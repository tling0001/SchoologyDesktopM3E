// Load the official matraic M3E distribution bundle. The bundle contains
// M3E itself and its Lit runtime, so Electron does not need to resolve the
// package's internal bare Lit specifiers at runtime.
(async function(){
  try {
    await import('../node_modules/@m3e/web/dist/all.js');
    await import('../node_modules/@m3e/icons/outlined/add.js');

    window.m3eReady = Promise.resolve();
  } catch (error) {
    window.m3eReady = Promise.reject(error);
  }
})();
