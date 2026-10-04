(function(){
  const modules=[
    '@m3e/web/theme','@m3e/web/button','@m3e/web/form-field','@m3e/web/search','@m3e/web/list',
    '@m3e/web/app-bar','@m3e/web/icon','@m3e/web/icon-button','@m3e/web/heading',
    '@m3e/icons/outlined/search','@m3e/icons/outlined/arrow_back','@m3e/icons/outlined/school',
    '@m3e/icons/outlined/qr_code_scanner','@m3e/icons/outlined/account_circle',
    '@m3e/icons/outlined/visibility','@m3e/icons/outlined/visibility_off','@m3e/icons/outlined/chevron_right'
  ];
  window.m3eReady=Promise.all(modules.map(spec=>import(spec)));
})();
