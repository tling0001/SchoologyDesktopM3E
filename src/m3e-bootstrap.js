// Load the official matraic M3E distribution bundle. The bundle contains
// M3E itself and its Lit runtime, so Electron does not need to resolve the
// package's internal bare Lit specifiers at runtime.
(async function(){
  try {
    await import('../node_modules/@m3e/web/dist/all.js');

    // @m3e/icons publishes individual icon modules. They import
    // @m3e/web/icon, which is mapped to the official M3E bundle in app.html.
    const icons = [
      'outlined/search',
      'outlined/notifications',
      'outlined/arrow_back',
      'outlined/menu',
      'outlined/menu_open',
      'outlined/school',
      'outlined/qr_code_scanner',
      'outlined/account_circle',
      'outlined/home',
      'outlined/mail',
      'outlined/request_quote',
      'outlined/groups',
      'outlined/book',
      'outlined/folder',
      'outlined/settings',
      'outlined/logout',
      'outlined/person',
      'outlined/calendar_month',
      'outlined/assignment',
      'outlined/visibility',
      'outlined/visibility_off',
      'outlined/chevron_right'
    ];

    await Promise.all(
      icons.map(path => import(`../node_modules/@m3e/icons/dist/${path}.js`))
    );

    window.m3eReady = Promise.resolve();
  } catch (error) {
    window.m3eReady = Promise.reject(error);
  }
})();
