// Load the official matraic M3E distribution and the supplied M3E icon package.
// Use static package-relative imports so Electron's ESM loader resolves the
// package exports normally; the previous dynamic icon path pointed at a
// non-existent @m3e/icons/outlined directory and caused a transient startup error.
import '../node_modules/@m3e/web/dist/all.js';
import '../node_modules/@m3e/icons/dist/outlined/add.js';
window.__resolveM3eReady?.();
