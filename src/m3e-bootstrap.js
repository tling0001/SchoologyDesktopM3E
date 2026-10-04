(function(){
  const modules=[
    '@m3e/web/theme','@m3e/web/button','@m3e/web/switch','@m3e/web/form-field','@m3e/web/search','@m3e/web/list','@m3e/web/drawer-container','@m3e/web/badge','@m3e/web/divider',
    '@m3e/web/app-bar','@m3e/web/avatar','@m3e/web/icon','@m3e/web/icon-button','@m3e/web/heading',
    '@m3e/icons/outlined/search','@m3e/icons/outlined/notifications','@m3e/icons/outlined/arrow_back','@m3e/icons/outlined/menu','@m3e/icons/outlined/menu_open','@m3e/icons/outlined/school',
    '@m3e/icons/outlined/qr_code_scanner','@m3e/icons/outlined/account_circle','@m3e/icons/outlined/home','@m3e/icons/outlined/mail','@m3e/icons/outlined/request_quote','@m3e/icons/outlined/groups','@m3e/icons/outlined/book','@m3e/icons/outlined/folder','@m3e/icons/outlined/settings','@m3e/icons/outlined/logout','@m3e/icons/outlined/person','@m3e/icons/outlined/calendar_month','@m3e/icons/outlined/assignment',
    '@m3e/icons/outlined/visibility','@m3e/icons/outlined/visibility_off','@m3e/icons/outlined/chevron_right'
  ];
  window.m3eReady=Promise.all(modules.map(spec=>import(spec)));
})();
