const {ipcRenderer}=require('electron');
const STYLE_ID='__schoology_shared_webview_shade_inversion_css__';
const ATTR='data-schoology-shade-inversion';
let dark=false,observer=null,queued=false;
try{dark=!!ipcRenderer.sendSync('get-shared-webview-theme-sync')?.dark}catch{}
const selector='html['+ATTR+'="true"]';
const css=selector+'{filter:invert(1) hue-rotate(180deg)!important;background:#17191c!important}'+
selector+' img,'+selector+' picture,'+selector+' video,'+selector+' canvas,'+selector+' svg,'+selector+' iframe,'+selector+' object,'+selector+' embed,'+selector+' [style*="background-image"]{filter:invert(1) hue-rotate(180deg)!important}'+
selector+' input,'+selector+' textarea,'+selector+' select,'+selector+' [contenteditable="true"]{color-scheme:dark!important}';
function ensureStyle(){const root=document.documentElement;if(!root)return false;let style=document.getElementById(STYLE_ID);if(!style){style=document.createElement('style');style.id=STYLE_ID;style.textContent=css}(document.head||root).appendChild(style);return true}
function pageIsLight(){try{const nodes=[document.querySelector('main'),document.querySelector('[role="main"]'),document.querySelector('#content'),document.querySelector('#container'),document.body,document.documentElement].filter(Boolean);const surfaces=nodes.map(el=>{const rect=el.getBoundingClientRect(),c=getComputedStyle(el).backgroundColor,m=c.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s/]+([\d.]+))?\s*\)/i);if(!m||Number(m[4]??1)<.08)return null;return {area:Math.max(0,rect.width)*Math.max(0,rect.height),luminance:.2126*Number(m[1])+.7152*Number(m[2])+.0722*Number(m[3])}}).filter(Boolean).sort((a,b)=>b.area-a.area);return surfaces.length?surfaces[0].luminance>=145:true}catch{return true}}
function apply(){queued=false;if(!ensureStyle())return;const root=document.documentElement;if(!dark||!document.body||!pageIsLight()){root.removeAttribute(ATTR);return}root.setAttribute(ATTR,'true')}
function schedule(){if(queued)return;queued=true;if(typeof requestAnimationFrame==='function')requestAnimationFrame(apply);else Promise.resolve().then(apply)}
function initialize(){if(!document.documentElement){if(!observer){observer=new MutationObserver(()=>{if(document.documentElement){observer.disconnect();observer=null;initialize()}});observer.observe(document,{subtree:true,childList:true})}return}ensureStyle();if(!observer){observer=new MutationObserver(schedule);observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['style','class','bgcolor','color']})}schedule()}
initialize();
ipcRenderer.on('shared-webview-theme-changed',(_event,payload)=>{dark=!!payload?.dark;initialize()});
