(function(){
  try{const t=JSON.parse(localStorage.getItem('schoology-m3e-theme-settings')||'{}');const dark=t.scheme==='dark'||(t.scheme!=='dark'&&t.scheme!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches);const logo=document.querySelector('.androidSplashLogo');if(logo)logo.src=dark?'../assets/logo_schoology.png':'../assets/schoology-logo-expressive-light.svg';}catch{}
  setTimeout(function(){ window.location.replace('app.html'); }, 100);
})();
