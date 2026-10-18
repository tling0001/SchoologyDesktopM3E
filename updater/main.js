const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const crypto = require('crypto');
const { spawn, execFile } = require('child_process');
let payload = {};
const arg = process.argv.slice(1).find(x => x.startsWith('--payload-base64='));
try { payload = JSON.parse(Buffer.from(arg ? arg.slice('--payload-base64='.length) : '', 'base64').toString('utf8')); } catch {}
const installDir = path.resolve(payload.installDir || path.join(process.env.LOCALAPPDATA || app.getPath('temp'), 'Programs', 'Schoology'));
const schoologyExe = path.join(installDir, 'Schoology.exe');
const tempDir = path.join(process.env.LOCALAPPDATA || app.getPath('temp'), 'Temp', 'schoology-updater', String(Date.now()));
const sevenZipLocal = path.join(installDir, '7-Zip');
let win, activeRequest, currentStep = '', completed = false, cancelled = false;
const children = new Set();
function updateUi(data) { if (win && !win.isDestroyed()) win.webContents.executeJavaScript('window.updaterUI && window.updaterUI.update(' + JSON.stringify(data) + ')').catch(() => {}); }
function status(value) { updateUi({ status: value }); }
function step(id, state, text, percent) { currentStep = id; updateUi({ id, state, text, percent }); }
function createWindow() {
  win = new BrowserWindow({ width: 520, height: 490, resizable: false, fullscreenable: false, minimizable: false, maximizable: false, alwaysOnTop: true, center: true, title: 'Schoology Update', icon: path.join(__dirname, 'assets', 'ic_launcher_256.png'), backgroundColor: payload.darkTheme ? '#17191c' : '#f5f8fc', webPreferences: { contextIsolation: true, nodeIntegration: false } });
  win.removeMenu();
  win.on('close', event => { if (!completed && !cancelled) { event.preventDefault(); cancelled = true; try { activeRequest && activeRequest.destroy(); } catch {} for (const child of children) try { child.kill(); } catch {} app.quit(); } });
  win.webContents.on('console-message', (_, level, message) => { if (message === 'schoology-updater-cancel') { cancelled = true; try { activeRequest && activeRequest.destroy(); } catch {} for (const child of children) try { child.kill(); } catch {} app.quit(); } });
  win.loadFile(path.join(__dirname, 'ui.html'), { query: { dark: payload.darkTheme ? '1' : '0', color: payload.themeColor || '#7ea9d8', product: payload.productName || 'Updating Schoology' } });
}
function download(url, target, progress) {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    function get(address, depth) {
      if (depth > 8) return reject(new Error('Too many download redirects.'));
      const u = new URL(address);
      const req = https.request({ hostname: u.hostname, path: u.pathname + u.search, headers: { 'User-Agent': 'Schoology-Updater/1.0' } }, res => {
        if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) { res.resume(); return get(new URL(res.headers.location, u).toString(), depth + 1); }
        if (res.statusCode < 200 || res.statusCode >= 300) { res.resume(); return reject(new Error('Download failed (HTTP ' + res.statusCode + ').')); }
        const total = Number(res.headers['content-length'] || payload.size || 0);
        let received = 0;
        const output = fs.createWriteStream(target);
        res.on('data', chunk => { received += chunk.length; if (progress) progress(received, total); });
        res.pipe(output);
        output.on('finish', () => output.close(() => resolve(target)));
        output.on('error', reject);
      });
      activeRequest = req;
      req.setTimeout(900000, () => req.destroy(new Error('Download timed out.')));
      req.on('error', reject);
      req.end();
    }
    get(url, 0);
  });
}
function run(executable, args, accepted) {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, { windowsHide: true });
    children.add(child);
    let stderr = '';
    if (child.stderr) child.stderr.on('data', data => { stderr += String(data); });
    child.on('error', error => { children.delete(child); reject(error); });
    child.on('close', code => { children.delete(child); (accepted || [0]).includes(code) ? resolve() : reject(new Error(path.basename(executable) + ' exited with code ' + code + (stderr ? ': ' + stderr.slice(-250) : ''))); });
  });
}
function find7z() {
  const dirs = [sevenZipLocal, path.join(process.env.ProgramFiles || 'C:\\Program Files', '7-Zip')].concat(String(process.env.PATH || '').split(';'));
  for (const dir of dirs) for (const name of ['7z.exe', '7zz.exe', '7zg.exe']) { try { const file = path.join(dir, name); if (fs.existsSync(file)) return file; } catch {} }
  return null;
}
function sha256(file) {
  return new Promise((resolve, reject) => { const hash = crypto.createHash('sha256'), stream = fs.createReadStream(file); stream.on('data', chunk => hash.update(chunk)); stream.on('end', () => resolve(hash.digest('hex'))); stream.on('error', reject); });
}
function waitForSchoology(pid) {
  if (!pid) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const started = Date.now();
    function check() {
      execFile('tasklist.exe', ['/FI', 'PID eq ' + pid], { windowsHide: true }, (error, stdout) => {
        if (!error && (!String(stdout).includes(String(pid)) || /No tasks are running/i.test(String(stdout)))) return resolve();
        if (Date.now() - started > 20000) return reject(new Error('Schoology is still running. Close it and retry.'));
        setTimeout(check, 350);
      });
    }
    check();
  });
}
function findAppRoot(root, depth) {
  if (depth > 10) return null;
  let entries;
  try { entries = fs.readdirSync(root, { withFileTypes: true }); } catch { return null; }
  if (entries.some(entry => entry.isFile() && entry.name.toLowerCase() === 'schoology.exe')) return root;
  for (const entry of entries) if (entry.isDirectory() && !entry.isSymbolicLink() && !['resources', 'locales', 'swiftshader'].includes(entry.name.toLowerCase())) { const found = findAppRoot(path.join(root, entry.name), depth + 1); if (found) return found; }
  return null;
}
async function main() {
  if (process.platform !== 'win32' || !payload.url) throw new Error('The Windows update URL is missing.');
  fs.mkdirSync(tempDir, { recursive: true });
  const installer = path.join(tempDir, 'schoology-installer.exe'), outer = path.join(tempDir, 'outer'), inner = path.join(tempDir, 'inner'), msi = path.join(tempDir, '7zip.msi');
  let seven = find7z();
  if (!seven) {
    status('Downloading 7-Zip…'); step('sevenDownload', 'determinate', 'Downloading…', 0);
    await download('https://github.com/ip7z/7zip/releases/download/26.04/7z2604-x64.msi', msi, (n, total) => step('sevenDownload', 'determinate', total ? Math.round(n * 100 / total) + '%' : 'Downloading…', total ? Math.round(n * 100 / total) : 0));
    step('sevenDownload', 'done', 'Complete', 100); status('Installing 7-Zip…'); step('sevenInstall', 'indeterminate', 'Installing…');
    fs.mkdirSync(sevenZipLocal, { recursive: true }); await run('msiexec.exe', ['/a', msi, '/qb', 'TARGETDIR=' + sevenZipLocal]); seven = find7z();
    if (!seven) throw new Error('7-Zip was not found after setup.');
    step('sevenInstall', 'done', 'Complete', 100);
  }
  status('Downloading Schoology…'); step('schoologyDownload', 'determinate', 'Downloading…', 0);
  await download(payload.url, installer, (n, total) => step('schoologyDownload', 'determinate', total ? Math.round(n * 100 / total) + '%' : 'Downloading…', total ? Math.round(n * 100 / total) : 0));
  if (payload.size && fs.statSync(installer).size !== Number(payload.size)) throw new Error('Installer size verification failed.');
  if (payload.digest && /^sha256:/i.test(payload.digest)) { const digest = await sha256(installer); if (digest.toLowerCase() !== String(payload.digest).split(':').pop().toLowerCase()) throw new Error('Installer SHA-256 verification failed.'); }
  step('schoologyDownload', 'done', 'Verified', 100); status('Waiting for Schoology to close…'); step('install', 'determinate', 'Preparing…', 5);
  await waitForSchoology(Number(payload.parentPid || 0));
  fs.mkdirSync(outer, { recursive: true }); fs.mkdirSync(inner, { recursive: true }); status('Extracting installer…');
  await run(seven, ['x', installer, '-o' + outer, '-y']); step('install', 'determinate', 'Installer extracted', 40);
  const appArchive = path.join(outer, '$PLUGINSDIR', 'app-64.7z');
  if (!fs.existsSync(appArchive)) throw new Error('Installer did not contain $PLUGINSDIR\\app-64.7z.');
  await run(seven, ['x', appArchive, '-o' + inner, '-y']); step('install', 'determinate', 'Application extracted', 65);
  const appRoot = findAppRoot(inner, 0);
  if (!appRoot) throw new Error('The extracted installer did not contain Schoology.exe.');
  await run('robocopy.exe', [appRoot, installDir, '/E', '/IS', '/IT', '/R:2', '/W:1'], [0, 1, 2, 3, 4, 5, 6, 7]);
  const uninstall = path.join(outer, '$R0', 'Uninstall Schoology.exe');
  if (fs.existsSync(uninstall)) fs.copyFileSync(uninstall, path.join(installDir, 'Uninstall Schoology.exe'));
  if (!fs.existsSync(schoologyExe)) throw new Error('Schoology.exe is missing after update.');
  step('install', 'done', 'Complete', 100); status('Update complete. Restarting Schoology…'); completed = true;
  const child = spawn(schoologyExe, [], { cwd: installDir, detached: true, stdio: 'ignore', windowsHide: false }); child.unref();
  const cleanupScript = "$ErrorActionPreference='SilentlyContinue'; while(Get-Process -Id " + process.pid + " -ErrorAction SilentlyContinue){Start-Sleep -Milliseconds 250}; " + [installer, msi, outer, inner, tempDir, payload.stagedInstallDir, payload.stagedUpdaterPath].filter(Boolean).map(file => "Remove-Item -LiteralPath '" + String(file).replace(/'/g, "''") + "' -Recurse -Force -ErrorAction SilentlyContinue").join('; ');
  const encoded = Buffer.from(cleanupScript, 'utf16le').toString('base64');
  const cleaner = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-WindowStyle', 'Hidden', '-EncodedCommand', encoded], { detached: true, stdio: 'ignore', windowsHide: true }); cleaner.unref(); setTimeout(() => app.quit(), 400);
}
process.on('uncaughtException', error => { updateUi({ status: 'Update failed.', foot: error.message || String(error), error: true }); if (currentStep) step(currentStep, 'error', 'Failed'); });
process.on('unhandledRejection', error => { updateUi({ status: 'Update failed.', foot: error && error.message || String(error), error: true }); if (currentStep) step(currentStep, 'error', 'Failed'); });
app.whenReady().then(() => { createWindow(); setTimeout(() => main().catch(error => { updateUi({ status: 'Update failed.', foot: error.message || String(error), error: true }); if (currentStep) step(currentStep, 'error', 'Failed'); }), 300); });
app.on('window-all-closed', () => {});
