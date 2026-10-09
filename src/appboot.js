(function(){
  const themeKey='schoology-m3e-theme-settings';
  const defaults={color:'#2e66a3',variant:'fidelity',scheme:'auto',contrast:'standard',motion:'expressive'};
  let theme=defaults;try{theme={...defaults,...JSON.parse(localStorage.getItem(themeKey)||'{}')}}catch{}
  const themeEl=document.querySelector('.splashM3eTheme');
  if(themeEl){for(const [k,v] of Object.entries(theme))themeEl.setAttribute(k==='scheme'?'scheme':k,v);}
  const isDark=()=>theme.scheme==='dark'||(theme.scheme!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches);
  const syncEarlyTheme=()=>{const dark=isDark();document.documentElement.dataset.themeEffective=dark?'dark':'light';document.documentElement.style.colorScheme=dark?'dark':'light';const logo=document.querySelector('.androidSplashLogo');if(logo)logo.src=dark?'../assets/logo_schoology.png':'../assets/schoology-logo-expressive-light.svg';};
  syncEarlyTheme();
  if(!window.__schoologySplashThemeBound){window.__schoologySplashThemeBound=true;matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change',()=>{if(theme.scheme==='auto')syncEarlyTheme()})}
  const dark=isDark();
  const logo=document.querySelector('.androidSplashLogo');if(logo)logo.src=dark?'../assets/logo_schoology.png':'../assets/schoology-logo-expressive-light.svg';
  const app=document.getElementById('app');
  const splash=document.getElementById('startupSplash');
  document.body.classList.add('splashVisible');
  let appReady=false;
  function hideSplash(){
    if(appReady)return;
    appReady=true;
    if(splash){splash.classList.add('hidden'); requestAnimationFrame(()=>{splash.remove(); document.body.classList.remove('splashVisible'); void document.body.offsetWidth;});}
  }
  window.schoologyAppReady=hideSplash;
  function showError(title,detail){
    // Startup faults must always replace the blank app area with a visible diagnostic.
    // Do not route these through the in-app request-error dialog: that dialog itself
    // depends on a successfully mounted shell and can silently hide startup failures.
    hideSplash();
    if(!app)return;
    const panel=document.createElement('section');
    panel.className='fatal startupFatal';
    const heading=document.createElement('h2');heading.textContent=title;
    const body=document.createElement('p');body.textContent=String(detail||'Unknown startup error');
    const note=document.createElement('p');note.className='startupFatalNote';note.textContent='The application renderer failed before startup completed. Close Schoology and try again; include this error when reporting the problem.';
    panel.replaceChildren(heading,body,note);app.replaceChildren(panel);
    console.error(title+':',detail);
  }
  window.addEventListener('error',function(e){
    const msg=e&&e.error&&e.error.stack ? e.error.stack : (e&&e.message||'Unknown renderer error');
    console.error('Schoology renderer error:',msg);
    showError('Schoology could not start',msg);
  });
  window.addEventListener('unhandledrejection',function(e){
    const reason=e&&e.reason;
    const msg=reason&&reason.stack ? reason.stack : String(reason||'Unknown promise error');
    console.error('Schoology renderer promise error:',msg);
    showError('Schoology could not start',msg);
  });
  if(!window.schoology){
    showError('Schoology could not start','The Electron authentication bridge is unavailable.');
    return;
  }
  const loadRenderer=()=>{
    const s=document.createElement('script');
    s.src='renderer.js';
    s.onload=function(){console.log('Schoology renderer loaded.');};
    s.onerror=function(){showError('Schoology could not start','renderer.js could not be loaded.');};
    document.body.appendChild(s);
  };
  Promise.resolve(window.m3eReady).then(loadRenderer).catch(function(e){
    showError('Schoology could not start','Material 3 Expressive could not initialize: '+(e?.message||e));
  });
})();
