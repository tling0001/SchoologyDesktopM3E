const app=document.getElementById('app');
const A=window.schoology;
if(!A){
  app.innerHTML='<div class="fatal"><h2>Schoology</h2><p>The application interface could not initialize.</p><p>The Schoology application bridge did not load.</p></div>';
  throw new Error('Schoology application bridge is unavailable');
}
const C={graphite:'#44505d',dark:'#22303e',blue:'#2e66a3',blueText:'#3183c8',bg:'#e7ebee',light:'#f4f5f5',white:'#fff',muted:'#868e96'};
let qrStream=null;
let qrBusy=false;
let qrLastAttempt=0;
let loadTabGeneration=0;
const THEME_STORAGE_KEY='schoology-m3e-theme-settings';
const DEFAULT_THEME_SETTINGS={color:'#7ea9d8',variant:'tonal-spot',scheme:'auto',contrast:'standard',motion:'expressive',colorVersion:2};
function getThemeSettings(){try{const v=JSON.parse(localStorage.getItem(THEME_STORAGE_KEY)||'null');const next={...DEFAULT_THEME_SETTINGS,...(v&&typeof v==='object'?v:{})};if(v?.color==='#2e66a3'&&!v?.colorVersion){next.color=DEFAULT_THEME_SETTINGS.color;next.variant='tonal-spot';next.colorVersion=2;localStorage.setItem(THEME_STORAGE_KEY,JSON.stringify(next))}return next}catch{return {...DEFAULT_THEME_SETTINGS}}}
function saveThemeSettings(v){const next={...DEFAULT_THEME_SETTINGS,...v,colorVersion:2};try{localStorage.setItem(THEME_STORAGE_KEY,JSON.stringify(next))}catch{}try{A.setThemeSettings?.(next).catch?.(e=>console.warn('Could not persist theme settings:',e))}catch{}return next}
A.getThemeSettings?.().then(result=>{if(result?.saved&&result.settings&&typeof result.settings==='object'){try{localStorage.setItem(THEME_STORAGE_KEY,JSON.stringify({...DEFAULT_THEME_SETTINGS,...result.settings}))}catch{}applyThemeToDocument()}else{saveThemeSettings(getThemeSettings())}}).catch(e=>console.warn('Could not load saved theme settings:',e));
document.addEventListener('click',async event=>{
 const anchor=event.target?.closest?.('a[href]');if(!anchor)return;
 const rich=anchor.closest('.activityBody,.schoolProfileUpdateBody,.schoolProfileUpdate,.assignmentDescription,.commentBodyHtml,.discussionBody,.messageThreadBody,.notificationBodyRich,.groupFullUpdate,.androidCommentContent,.activityMedia');
 if(!rich)return;
 const href=anchor.href||anchor.getAttribute('href')||'';if(!(href.startsWith('http://')||href.startsWith('https://')))return;
 event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
 try{const result=await A.openExternal(href);if(result)showAppDialog('Unable to open link',result)}catch(error){showAppDialog('Unable to open link',error.message||String(error))}
},true);
function effectiveThemeIsDark(){const t=getThemeSettings();return t.scheme==='dark'||(t.scheme==='auto'&&window.matchMedia?.('(prefers-color-scheme: dark)').matches)}
function themeLogoSrc(){return effectiveThemeIsDark()?'../assets/logo_schoology.png':'../assets/schoology-logo-expressive-light.svg'}
function applyThemeToDocument(){const t=getThemeSettings();const dark=effectiveThemeIsDark();document.documentElement.dataset.themeEffective=dark?'dark':'light';document.documentElement.style.colorScheme=dark?'dark':'light';document.querySelectorAll('m3e-theme').forEach(el=>{el.color=t.color;el.variant=t.variant;el.scheme=t.scheme;el.contrast=t.contrast;el.motion=t.motion});document.querySelectorAll('.m3eLoginLogo,.m3eButtonLogo,.androidSplashLogo').forEach(img=>{img.src=themeLogoSrc()});try{A.setSharedWebviewTheme?.(dark)}catch{}if(dark)requestAnimationFrame(()=>fixDarkRichTextColors())}
function fixDarkRichTextColors(root=document.getElementById('content')){
 if(document.documentElement.dataset.themeEffective!=='dark'||!root?.querySelectorAll)return;
 const values=color=>(String(color||'').match(/[0-9.]+/g)||[]).map(Number);
 const neutralDark=color=>{const rgb=values(color).slice(0,3);return rgb.length===3&&Math.max(...rgb)-Math.min(...rgb)<34&&rgb.reduce((a,b)=>a+b,0)/3<118};
 const nearWhite=color=>{const v=values(color);return v.length>=3&&(v[3]??1)>.8&&v[0]>238&&v[1]>238&&v[2]>238};
 const elements=[];if(root.nodeType===1)elements.push(root);elements.push(...root.querySelectorAll('*'));
 for(const el of elements){if(!el.isConnected||/^(IMG|SVG|PATH|VIDEO|CANVAS|IFRAME)$/.test(el.tagName))continue;let node=el,lightSurface=false;while(node&&node!==root.parentElement){if(nearWhite(getComputedStyle(node).backgroundColor)){lightSurface=true;break}node=node.parentElement}if(lightSurface)continue;if(neutralDark(getComputedStyle(el).color))el.style.setProperty('color','var(--md-sys-color-on-surface, #e6e8eb)','important');}
}
if(!window.__schoologyDarkTextObserver){window.__schoologyDarkTextObserver=new MutationObserver(records=>{if(document.documentElement.dataset.themeEffective!=='dark')return;for(const record of records){for(const node of record.addedNodes||[]){if(node.nodeType===1)fixDarkRichTextColors(node)}if(record.target?.nodeType===1)fixDarkRichTextColors(record.target)}});window.__schoologyDarkTextObserver.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['style','class','color']});}

if(!window.__schoologyThemeMediaBound){window.__schoologyThemeMediaBound=true;window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change',()=>{if(getThemeSettings().scheme==='auto')applyThemeToDocument()})}

let state={canadianInstance:false,screen:'login',school:null,schools:[],q:'',loading:false,error:'',auth:null,user:null,tab:'home',settingsPage:null,homeTab:'recent',searchToken:0,drawerPage:null,message:null,messageTab:'inbox',messageFolder:'inbox',messageThread:null,composeMessage:false,selectedCourse:null,mobileMe:null,courseDashboardEnabled:false,preferredHomepage:'recent',toolbarTitle:'Home',embeddedReturn:null,embeddedCanOpenExternal:false,homeUpcomingReturn:false,assignmentTab:'info',assignmentCanSubmit:false,assignmentIsTeacher:false,assignmentSubpage:null,submissionMenu:false,assignmentAllowComments:false,assignmentLandscape:false,folderId:0,folderStack:[],courseView:null,activityUsers:{},activityComments:null,currentFolderId:0,currentGroup:null,profileUser:null,profileTab:'updates',groupTab:'updates',resourceCollection:null,windowChromeOverlay:false,homeCreateMenu:false,calendarDate:null,calendarSelectedDate:null,calendarCanCreate:false,calendarEvents:[],calendarEventsMonth:'',calendarTab:'calendar',calendarUpcomingEvents:null,groupJoinOpen:false,embeddedTheme:'',profileReturn:null,peopleEnabled:false,openSchoologyLinks:true,desktopNotifications:true,notificationSound:false,appVersion:'',groupCanCreateDiscussion:false,groupCanPostUpdates:false,courseCanPostUpdates:false,assignmentSupportsAnnotations:false};
A.getServerInstance?.().then(enabled=>{state.canadianInstance=!!enabled;const b=document.getElementById('switchCanada');if(b)b.textContent=state.canadianInstance?'Switch to app.schoology.com':'Switch to app.schoologyca.com'}).catch(()=>{});

A.getOpenSchoologyLinks?.().then(v=>{state.openSchoologyLinks=v!==false}).catch(()=>{});
A.getDesktopNotifications?.().then(v=>{state.desktopNotifications=v!==false}).catch(()=>{});
A.getNotificationSound?.().then(v=>{state.notificationSound=v===true}).catch(()=>{});
A.getAppVersion?.().then(v=>{state.appVersion=String(v||'');const label=document.querySelector('.settingsVersion');if(label)label.textContent='Version: '+state.appVersion}).catch(()=>{});
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function syncM3eTabSelection(container, attr, value){
  const root=typeof container==='string'?document.querySelector(container):container;
  if(!root)return;
  root.querySelectorAll('m3e-tab').forEach(tab=>{
    const selected=String(tab.dataset?.[attr]||'')===String(value);
    tab.toggleAttribute('selected',selected);
    tab.selected=selected;
  });
  // Segmented action-list navigation shares the same selection state as M3E tabs.
  for(const [dataKey,attribute] of [['courseTab','course-tab'],['groupTab','group-tab'],['schoolProfileTab','school-profile-tab']])root.querySelectorAll('m3e-list-action[data-'+attribute+']').forEach(item=>{const selected=String(item.dataset?.[dataKey]||'')===String(value);item.classList.toggle('courseSidebarActive',selected);if(selected)item.setAttribute('aria-current','page');else item.removeAttribute('aria-current')});
}
function alert(message){showAppDialog('Schoology',String(message));}
function showAppDialog(title,message,actions=[{label:'OK',action:null}]){
  let el=document.getElementById('appDialog');
  if(!el){el=document.createElement('m3e-dialog');el.id='appDialog';document.body.appendChild(el)}
  el.className='m3eAppDialog';
  if(actions.some(a=>String(a.label||'').toLowerCase()==='cancel'))el.setAttribute('disable-close','');else el.removeAttribute('disable-close');
  el.innerHTML=`<span slot="header">${esc(title)}</span><div class="appDialogMessage">${message}</div><div slot="actions" end class="appDialogActions">${actions.map((a,i)=>`<m3e-button variant="${i===actions.length-1?'filled':'text'}" data-dialog-action="${i}">${esc(a.label)}</m3e-button>`).join('')}</div>`;
  el.open=true;
  el.querySelectorAll('[data-dialog-action]').forEach((b,i)=>b.addEventListener('click',async()=>{el.open=false;const fn=actions[i]?.action;if(fn)await fn()}));
  return el;
}
function showThemeSettingsDialog(){
 const existing=document.getElementById('themeSettingsDialog');if(existing){try{existing.hide?.()}catch{}existing.remove()}
 const t=getThemeSettings(),host=document.querySelector('m3e-theme.m3eShellTheme')||document.querySelector('m3e-theme.m3eRoot')||document.body;
 const dialog=document.createElement('m3e-dialog');dialog.id='themeSettingsDialog';dialog.className='themeSettingsDialog';dialog.setAttribute('disable-close','');
 dialog.innerHTML=`<span slot="header">Theme</span><div class="themeSettingsScroll">
 <m3e-heading variant="label" size="large">Color</m3e-heading><input id="themeColor" type="color" aria-label="Color" value="${esc(t.color)}">
 <m3e-heading variant="label" size="large">Color variant</m3e-heading><m3e-filter-chip-set id="themeVariant" aria-label="Color variant">${['tonal-spot','vibrant','fidelity','expressive','monochrome','neutral','rainbow','fruit-salad'].map(v=>`<m3e-filter-chip value="${v}" ${t.variant===v?'selected':''}>${v.split('-').map(x=>x.charAt(0).toUpperCase()+x.slice(1)).join(' ')}</m3e-filter-chip>`).join('')}</m3e-filter-chip-set>
 <m3e-heading variant="label" size="large">Color scheme</m3e-heading><m3e-segmented-button id="themeScheme" aria-label="Color scheme"><m3e-button-segment value="light" ${t.scheme==='light'?'checked':''}><m3e-icon slot="icon" name="light_mode"></m3e-icon>Light</m3e-button-segment><m3e-button-segment value="auto" ${t.scheme==='auto'?'checked':''}><m3e-icon slot="icon" name="settings_brightness"></m3e-icon>System</m3e-button-segment><m3e-button-segment value="dark" ${t.scheme==='dark'?'checked':''}><m3e-icon slot="icon" name="dark_mode"></m3e-icon>Dark</m3e-button-segment></m3e-segmented-button>
 <m3e-heading variant="label" size="large">Contrast</m3e-heading><m3e-segmented-button id="themeContrast" aria-label="Contrast"><m3e-button-segment value="standard" ${t.contrast==='standard'?'checked':''}>Default</m3e-button-segment><m3e-button-segment value="medium" ${t.contrast==='medium'?'checked':''}>Medium</m3e-button-segment><m3e-button-segment value="high" ${t.contrast==='high'?'checked':''}>High</m3e-button-segment></m3e-segmented-button>
 <m3e-heading variant="label" size="large">Motion</m3e-heading><m3e-segmented-button id="themeMotion" aria-label="Motion"><m3e-button-segment value="standard" ${t.motion==='standard'?'checked':''}>Standard</m3e-button-segment><m3e-button-segment value="expressive" ${t.motion==='expressive'?'checked':''}>Expressive</m3e-button-segment></m3e-segmented-button>
 </div><div slot="actions" end class="themeSettingsActions"><m3e-button id="themeSettingsReset" variant="text">Reset to default</m3e-button><m3e-button id="themeSettingsClose" variant="filled">Close</m3e-button></div>`;
 host.appendChild(dialog);dialog.open=true;
 const close=()=>{if(dialog.__schoologyClosing)return;dialog.__schoologyClosing=true;const remove=()=>dialog.remove();try{if(typeof dialog.hide==='function'){dialog.hide();setTimeout(remove,240)}else{dialog.open=false;setTimeout(remove,240)}}catch{dialog.open=false;setTimeout(remove,240)}};
 dialog.querySelector('#themeSettingsClose')?.addEventListener('click',close);
 const updateTheme=patch=>{saveThemeSettings(patch);applyThemeToDocument()};
 dialog.querySelector('#themeSettingsReset')?.addEventListener('click',()=>{updateTheme(DEFAULT_THEME_SETTINGS);const color=dialog.querySelector('#themeColor');if(color)color.value=DEFAULT_THEME_SETTINGS.color;dialog.querySelectorAll('#themeVariant m3e-filter-chip').forEach(chip=>{const selected=chip.getAttribute('value')===DEFAULT_THEME_SETTINGS.variant;chip.toggleAttribute('selected',selected);chip.selected=selected});for(const id of ['themeScheme','themeContrast','themeMotion']){const key={themeScheme:'scheme',themeContrast:'contrast',themeMotion:'motion'}[id];dialog.querySelectorAll('#'+id+' m3e-button-segment').forEach(seg=>{const selected=seg.getAttribute('value')===DEFAULT_THEME_SETTINGS[key];seg.checked=selected;seg.toggleAttribute('checked',selected)})}});
 dialog.querySelector('#themeColor')?.addEventListener('input',e=>updateTheme({color:e.target.value}));
 dialog.querySelectorAll('#themeVariant m3e-filter-chip').forEach(chip=>chip.addEventListener('change',()=>updateTheme({variant:chip.getAttribute('value')||''})));
 dialog.querySelectorAll('#themeScheme m3e-button-segment').forEach(seg=>seg.addEventListener('change',()=>seg.checked&&updateTheme({scheme:seg.getAttribute('value')||''})));
 dialog.querySelectorAll('#themeContrast m3e-button-segment').forEach(seg=>seg.addEventListener('change',()=>seg.checked&&updateTheme({contrast:seg.getAttribute('value')||''})));
 dialog.querySelectorAll('#themeMotion m3e-button-segment').forEach(seg=>seg.addEventListener('change',()=>seg.checked&&updateTheme({motion:seg.getAttribute('value')||''})));
}
function showUpdateDialog(u){
 const iosUA=/iPhone|iPad|iPod/i.test(navigator.userAgent||'')||(navigator.platform==='MacIntel'&&Number(navigator.maxTouchPoints)>1),iosInstall=A.platform==='ios'||document.documentElement.dataset.tauriPlatform==='ios'||iosUA;
 showAppDialog('Update available','Schoology '+u.version+' is available. The update will start only after you choose Install update.',[{label:'Later',action:null},{label:'Install update',action:async()=>{
  if(iosInstall){try{await A.installUpdate(u);showAppDialog('Installing update','The installation page will open. Follow the iOS prompts to install the update, then return to Schoology.')}catch(e){showAppDialog('Unable to open installation link',e?.message||String(e))}return}
  const dlg=showAppDialog('Downloading update','Downloading…',[]),msg=dlg?.querySelector('.appDialogMessage');if(msg)msg.innerHTML='<div class="updateDownloadProgressWrap"><m3e-linear-progress-indicator id="updateDownloadProgressBar" mode="determinate" value="0" max="100"></m3e-linear-progress-indicator><div id="updateDownloadProgressText" class="updateDownloadProgressText">Downloading…</div></div>';
  const off=A.onUpdateDownloadProgress?.(d=>{const bar=document.getElementById('updateDownloadProgressBar'),txt=document.getElementById('updateDownloadProgressText');if(bar&&d?.percent!=null)bar.value=Math.max(0,Math.min(100,Number(d.percent)||0));if(txt)txt.textContent=d?.total?'Downloading… '+(d.percent||0)+'%':'Downloading…'});
  try{await A.installUpdate(u);off?.();if(dlg)dlg.open=false}catch(e){off?.();if(dlg)dlg.open=false;showAppDialog('Unable to install update',e?.message||String(e))}
 }}]);
}

const CURRENT_RELEASE_NOTES_VERSION='2026.10.0-port.5';
const CURRENT_RELEASE_NOTES_TEXT='Shared PDF and image viewing with a View or Download dialog; improved discussion navigation, calendar and comment layouts; portrait-aware course and profile panels; safer startup updates and window controls.';
function maybeShowReleaseNotes(){try{const key='schoology.release-notes-version';if(localStorage.getItem(key)===CURRENT_RELEASE_NOTES_VERSION)return;if(document.getElementById('appDialog')?.classList.contains('open')){setTimeout(maybeShowReleaseNotes,1000);return}localStorage.setItem(key,CURRENT_RELEASE_NOTES_VERSION);showAppDialog('What’s new in Schoology '+CURRENT_RELEASE_NOTES_VERSION,CURRENT_RELEASE_NOTES_TEXT)}catch(error){console.debug('Could not check release notes version:',error)}}

window.closeDrawerThen=function closeDrawerThen(fn){const c=document.getElementById('appDrawerContainer');if(c)c.start=false;setTimeout(()=>{state.drawerPage=null;if(typeof fn==='function')fn()},280)};const closeDrawerThen=(fn)=>window.closeDrawerThen(fn);
function messageDetail(){
 const m=state.message||{},thread=state.messageThread,msgs=thread?.messages||[],users=thread?.users||{},subject=m.subject||msgs[0]?.subject||'Message';
 const cards=msgs.length?msgs.map(msg=>{
  const uid=Number(msg.author_id||msg.authorId||msg.author?.id||msg.author?.user_id||msg.uid||msg.user_id||msg.sender_id||msg.senderId||msg.sender?.id||msg.sender?.user_id||msg.creator_id||0),user=users[uid]||msg.author?.user||msg.author||msg.sender?.user||msg.sender||msg.user||{},me=uid&&Number(state.auth?.userId||state.auth?.user?.id||0)===uid,name=me?'You':(user.name_display||user.nameDisplay||user.display_name||user.name||'Schoology'),avatar=normalizeImageUrl(user.picture_url||user.pictureUrl||user.picture||''),timestamp=msg.last_updated||msg.lastUpdated||msg.created||msg.timestamp,date=timestamp?(typeof timestamp==='number'||/^\\d+$/.test(String(timestamp))?new Date(Number(timestamp)*1000).toLocaleString():String(timestamp)):'',body=msg.message||msg.body||'',attachments=renderMessageAttachments(msg.attachments||msg.attachment||{});
  return '<m3e-card variant="filled" class="messageThreadCard"><div slot="header" class="messageThreadHeader">'+(avatar?'<img class="messageThreadAvatar" data-media-image-url="'+esc(avatar)+'" alt="" style="display:none">':'<span class="messageThreadAvatarFallback">'+esc(String(name).charAt(0))+'</span>')+'<div class="messageThreadAuthorBlock"><b>'+esc(name)+'</b><small>'+esc(date)+'</small></div></div><div slot="content" class="messageThreadBody">'+esc(body)+'</div>'+(attachments?'<div slot="footer" class="messageThreadAttachments">'+attachments+'</div>':'')+'</m3e-card>';
 }).join(''):'<div class="messageThreadLoading">Loading message…</div>';
 return m3eTheme('<main class="messageDetailPage"><m3e-app-bar class="m3eMainAppBar"><m3e-icon-button id="messageBack" slot="leading" aria-label="Back"><span class="m3eOriginalIcon">'+originalM3Icon('arrow_back')+'</span></m3e-icon-button><span slot="title">'+esc(subject)+'</span><m3e-icon-button id="messageRefresh" slot="trailing" aria-label="Refresh"><span class="m3eOriginalIcon">'+officialOrAssetIcon('ic_action_refresh.png','Refresh')+'</span></m3e-icon-button><m3e-icon-button id="messageReply" slot="trailing" aria-label="Reply"><span class="m3eOriginalIcon">'+officialOrAssetIcon('ic_action_reply.png','Reply')+'</span></m3e-icon-button></m3e-app-bar><main class="messageDetail">'+(thread?cards:'<div class="loading"><m3e-circular-progress-indicator indeterminate class="m3eInlineProgress" aria-label="Loading"></m3e-circular-progress-indicator><span>Loading message…</span></div>')+'</main></main>','m3eMessageDetailScreen');
}
function renderMessageAttachments(a){
 const rows=[];
 const files=a?.files?.file||a?.files?.list||a?.files||a?.['file-attachment']||[];
 const list=Array.isArray(files)?files:(files&&typeof files==='object'?(files.file||files.list||[files]):[]);
 for(const f of list){const url=f?.resolveDownloadUrl||f?.resolve_download_url||f?.download_path||f?.downloadPath||f?.converted_download_path||f?.convertedDownloadPath||f?.fileDownloadURL||f?.url;if(!url)continue;const title=(f.title||f.fileTitle||f.filename||f.fileName||'File').trim();const mime=f.filemime||f.fileMIME||f.converted_filemime||f.convertedFileMime||'application/octet-stream';rows.push('<m3e-list-action class="attachmentSegmentedItem fileAttachment messageAttachment" tabindex="0" data-download-url="'+esc(url)+'" data-download-name="'+esc(title)+'" data-download-mime="'+esc(mime)+'"><span slot="leading" class="attachmentFileIcon"><img src="'+localAttachmentIcon(mimeIconForFilename(title,mime))+'" alt=""></span><span class="attachmentFileText"><b>'+esc(title)+'</b><small>'+esc((mime||'File').split('/').pop().toUpperCase())+'</small></span><span slot="trailing" class="attachmentDownloadIcon"><img src="'+localAttachmentIcon('ic_action_download.png')+'" alt=""></span></m3e-list-action>')}
 const links=a?.links?.link||a?.links||[];const ll=Array.isArray(links)?links:(links?.link||[]);for(const l of ll){const url=l.url||l.linkURL||l.href;if(url)rows.push('<m3e-list-action class="attachmentSegmentedItem messageAttachment" tabindex="0" data-open-url="'+esc(url)+'"><span slot="leading" class="m3eOriginalIcon">'+originalM3Icon('link')+'</span><span>'+esc(l.title||l.linkTitle||url)+'</span><span slot="trailing" class="m3eOriginalIcon">'+originalM3Icon('chevron_right')+'</span></m3e-list-action>')}
 const embeds=a?.embeds?.embed||a?.embeds||[];const ee=Array.isArray(embeds)?embeds:(embeds?.embed||[]);for(const e of ee){const html=e.embed_code||e.embedCode;if(html)rows.push('<m3e-list-action class="attachmentSegmentedItem messageAttachment" tabindex="0" data-embed-html="'+esc(html)+'"><span slot="leading" class="m3eOriginalIcon">'+originalM3Icon('attachment')+'</span><span>Embedded content</span><span slot="trailing" class="m3eOriginalIcon">'+originalM3Icon('chevron_right')+'</span></m3e-list-action>')}
 return rows.length?'<m3e-action-list variant="segmented" class="attachmentSegmentedList messageAttachments">'+rows.join('')+'</m3e-action-list>':'';
}
const menuImg="<svg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg' aria-hidden='true'><path fill='white' d='M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z'/></svg>";
const officialIconData={"ic_test_quiz.png":"data:image/png;base64,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","ic_action_new.png":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAQAAAAAYLlVAAAAj0lEQVRo3u3YsQ2AIBRF0YdYuJMjuJEDsJEjuBMN0UJjISaCFGi8t7HxkxNoUImI/p4pGV4GWUnBTLUAszpJ3vTP12hqHwEAAAAAAAAAAACA6gBzcdMdk6e7/emTJ9z5Bt1Gr9hjWWVD7rOvO4J4B0LGhuYfQeDDBAAAAAAAAAAAAMAHbsU5ue13vYiICloBd7gS8a1wnOgAAAAASUVORK5CYII=","ic_notifications_comment_add.png":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACH0lEQVQ4y32TXUiTURjHf+/r3pWNYWrma/iFc7E0civMIggGdRd1VTQJAy8q61aIAinookLvwpKCBD+o6EL6IJCgiyiCFjLXCqcblpp7d2FFsZWbvaeLfbC5jwMPB57zP//n+f+fcySA3wOnqgPGrxpFVnOsQTX3joXX56Wf1zur502LWkt7N8ZWK+jxbISsEPs0x2f3fZoitWrZpQdZJIZ506LWeuAsyvYG+DUN8T8ZxwJKSjDa2tgpuvB9GNEAKYsfQLHWQTSYyCilYKoC8xZQNoG8AaIzGFoseaUZEoV0WIvAxhooEYR/KLgmG3PRxkGcQwiARoQ6fK4tbEh1CsDfEOF/VlyTKt32WvbZytHFOkskmA5+Z9D9TTt9e0qVASJeP5h2AOB6odLTXk+HrZxVHWLrYlWHXZYKevZsY0E2aPKd0ZBjzjNOdOYLlNoAcFjKiOkgRK4KIRJEDmtloqO77oDv6eOVw7Pvh9MgXeS/nEmSkiYDa0ePV760d13DM3Y1rVOSChNIUgKTHiOAZ6SP5+NL/QDv/GGMcn4SSQKjDO7ZxMNNQZqT+1L9wZPNls7LH8/vrcLepOadgnt2mXtTK4Qe3dhtSOYDKcDC64cz5s1bB/w1Z3qPOVRuPvHxSss1ZGH0Skfw7YQvr8ZDfRNvQnEh+p/5xP6eWxeSHWZGHaAUNMk55BXOIa+wn7h4BKgo9ksLeZ3yZBmIFiP4D7sOv7gcN2P7AAAAAElFTkSuQmCC","ic_action_download.png":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAD8AAAA/CAQAAAD9VthUAAABnklEQVRYw+2YP2vCQBiHEwtCQFwEXXR1Egr2C4hdHP0IdivS0UU/gNDNjq5209HF2c1FP4CLDkJBkFrIkmqfDtWYU5OWaJKK95sO3j/P3fG+d8cpipSUlJTUJYgQj7zyxE0w+Gd+9BIM/m2Dfw8G/8lWrrc/FGz9nIJXg8Ur/wXPVa9elp4sPVl6V7f5qiw9Wfly8yVe4n3D4xGeKHlSJ8wrRZ6o2+Asc8CgZmPf6svGXsMA5mTd4XsmoEX4wKo64QnTMu09d/ghO/WJ/R1PjL4ldugOX8WqMWkb/HovLs1YiKy6/b1oCmkW5H7Hk2MhRDVx311UWFtSGTw44ylhWPzXVE5t6iK6sJo66nE8KnXBU6d4jlPljpmQtoOmKIREPBodwWvmsuGOTCDJSEg9ICHiSTAQPEYkz/mPE6ErpJ9ya45XZJgK1i6Rc38khWgIiI9d31vGAA28ucgos8JZK8oeXpAUWDrAlxQ8vqHJMLGBT8j48EQ4qHKzG3x6o6DR3oO30Xx8JO2dcJuT0FdRQgd0SgE9FIlzT1yRukx9Ax0Ep3nLYXR9AAAAAElFTkSuQmCC","ic_assignment.png":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEYAAABGCAMAAABG8BK2AAAB8lBMVEVfTDF+bFwAAABsVToAAABWXlMAAABBmNIAAAAAAABmPxEAAABBmNIAAAAAAAAAAABQUFeYbjL/4qX+ulzEoGzOzs6urq6SXijtu2t1styUYCr/u17KdR6ysbDt1bfDrpT///7//vivr6/MeyazsbD39fb/zGz///uRXifCbRr//fmRXib08/OSXif8+vrFcR7/+/b/9/Hy8PD/vGH/23mAc1z/+fT/9O/v7u7DbhqzsrHCbRn/9vH1596bXyDGcx/67+rUf7zDbxu0srH/vWF1dnHPfijcg7f38Ov17ObYo9n/vF//yWrQaZp0gHrUf7mkq7awsLCan6FueYb17unh29iBiobAwsOzsrBBmNL89O/w5+HJy8zKcJ/bodv59/iQmZf/yWv+xXT46N7v6OSUYCi0s7Ls5N9lo8z////h2NT88uzDxcb/vGD37ef6+vrPe6vr49/Nycnf1tJqqNDYptprqdHjruS1tLPHxcVycHDy6eSYnKLq49/k4N7q5eHIa5j68e3yvGnb09DYk0HUz83g3NqTnquUYSppp9Hr5N92s9y1s7KZ1PfWzsqTXSVtqtL/vWLy5t7+/P3s493/zHzrvWf/y2zYz8ppYEnj2tbz6+fSzMr26N7m4NzEw8TQm9Td29rXn9jt5N7JcBalZCQE59oaAAAAEHRSTlOP6wL6CLMR8wcGkwC0FwEFaEHXZgAAAr1JREFUWMPt2GdTGkEAgGFEBM4gWGNBLFiwiw3F3hs2VNSzayyA5RRUsBfEEg161ojY9X/GzQ1znkKCzm1mksn7gQ/M3DPs3S7swvhES4z/zN/E8Pk8HvqBeDw+n35GIEBRzQdCUYGAfobLBYxOZ7NZLN9dyGKx2XQ6wHC59DMsFmDMZrXa1ZurVpvNgGGxYDEmE4p+czEUNZngMnr9exi9Hi6j1b6H0WrhMlbrexirFS6jUs3MuDr9dndVKrjM1tbJSUHBl59dXR0dPTxMT3912PLyysrdXWNjVRU85vp6bo782IeHq6vz80bjvoOMxpubkhKDYXZ2agpB4DCjoy8fOIoODe3vY05qbu7v7+2trTUYenrgMF1dVOby0hmztNTd3d7e1nZ/f3u7tgaHWVykMq2tIyPgIuVzL18fH5uaxsfbn2toqK9/88BpYmpqqEx1NcFQq6ysq8Px7W3AVFQ4mH40MZOTVGZ9vazMPij7gEpLBwZwvLwcx1taFhYcLk2amOJiKtPZSTBkRUXn5/hzCgWOFxY6+aKgiRkbozL5+bm55KCUSrmcQAAzPJyTA5fJzqYyMhnBEMnlmZmAyMhQKHZ2lMr0dLhMWhqVkUo7OuyDSk0lB5ScDN5LSoLLyGRUJiGBYDAsPp5E4uIIOiYGLiOVUhmJJDoaXBIVBRYAaGIiMREsCwwTi/v64DKRkVQmIkIkwrC8PBIBN5dILE5JgctIJFRGoxGJQkNjYwEhFOJ4SAg5GcXi42O4jEYTHEz++O7taTTh4UFBYDBgCQQGfn5RQABx9IDJvM7fH8cHB/38hMKDA8cHoT/HhIWdnfn6np5ubj49OTuWwWE4nLfbxIuLrKyNDR8f5xtJDgcGgyBstterPDy8vd3dPT29fhGbTWzZ6GWYTARhvcrNjcFg/SYEYTLpZ/61P15+ANmGakjyc+W3AAAAAElFTkSuQmCC","ic_notifications_test_quiz.png":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAARCAYAAADUryzEAAACSklEQVQ4y42SS0hUcRTGf/fOvQ6TLzKYcfI5DoYpZIs0K81BBFu0aOFegtkYBLUzalu0iFbhLBqiq0ibgghahFIOJtMDeiySHlxnFHWcIR/cUcaZuTO3xTwsnSHP6s/5znf+3znfESgQzXcZ7bU7hwF8IdXza4QrFAlTMbKr00pjTSlo5o5o14ZtfYqXhRqIexM5smb2o5n9uDqt5NQcSEG0a8OGZu5oO2bBIpXzeiaBL6R6iikQ3IrTKAT098cAmJqy7MO8Q6qQe0sAF8+dZCu58k/RetwPgKvzTD4ni6VMvguwdHvSMIw0dbcGBAkgZcRJGTvo6R0SKY2UkYS4FYBN1N15BZn6hcsI7c1saXHUm08NEeB7YJ2ZjxqrK4c5JFdjEuR9smOmCIvPhjnvGuDRzycAJH+HMy4EQmG8Q2pjIBRmaclMialiX4Oexw3c6Z3nzewnek534/06yr2z9xGAhmzNAtDgVpzBno4KoonlPLl9rILuwVqINfFts54H01H0U8/xhVSP5Facwdxm3Yoz6LDbkEWR8pIa9PQOrUqKrsE6iGX+eftiHL1v90IlAIfdhlvBcNhttDZZmZuPEAhpXJ0zOHHBBRlHGR3387kPvENqY1ZxxsYWRxW1tTFkUcySwzystMK1SzD3AwDP2CyVI1XwIZIbd/eUY/oa0cQyyfR2fqETX6p5Nb0NthbGJnykr28UPGUJoEw+CoBFOoLDbsGtEJz36yyuvKdtFcpuHMekr2XrIgc75exSi2L5Bn/ZuDcW/oMB8AdPJOq18j24LwAAAABJRU5ErkJggg=="};
const officialIconExtraData={"ic_attach_resourcesv3.png":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAQAAAD9CzEMAAAAbUlEQVRYw+3UTQ5AMBCG4W/EHiduXBg3GAsrkVElIniny0n6NJ0fc90blQAAAACeB+r9dC/ltqGlK8ByhbogM2b5Q4A0hDRdBCCZxxNQEOlEmzaaSh76ghrY6rRs0204kwzwv23KFwEAAHwJmAF0XwtqZQqlrAAAAABJRU5ErkJggg==","ic_action_ic_menu_folder.png":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAQAAAD9CzEMAAABFElEQVRYw+2Wuw4BQRSGZ9a6FIJEIVFqFK6h0GhEIfEwSg+hVnoCvccQ624l2JCIhkRhY7MmR6VZwZlhK/OVZzfny5yc+XcJkUgkkj+AOgvZkrfiKN2ObeMqKlCfjGFIOGvRqtETFSiot2r5iKsCCHjqPxvRC8rF0OuHjGkdAl8JQCWFN2OwuU9AD9cW1ySAUwBL4vM38P0fx4PuYIYb0TyQgzj3pWLUQG0RZZclyQiszKpv4tZ0q1qQ5O8PE+Q9gIWaIl7+/paGFeiKyID20wNKQJm5o2kBwQgZFeAJNolA9thDdBZBTCD3T+ONeJriNghcFSjaN9+Dz1iguyvQ+7arAqqh0xTOdM0vYBP5/ySRSP6aO8hVS+x558quAAAAAElFTkSuQmCC","ic_action_discard_icon.png":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAgCAYAAABU1PscAAABD0lEQVRYw+2X0Q2CMBCGP40DMAFhBJ95ATZwBEZwg4YJHEHcQDfgiWfcgDgBI/hyJo3hQckhrfRPGpLjaO8v91+vEBCwbmy0J6zaxwk4jrzqgcKkca+53lY5+MQKvgMaGQAJUGpv2E55vlyejUnjwiJWAmcgcy6FZNcPQCQB5pIudqpEwF5sF7FdTRp3LvyBEjBvtkQGI/aXbwYUTmlgCWgQ6EWwc3/zmzJq6cJOoUEj32cjULWPXMTbfOCeAJg0rl0qo7mI03zo3wC1KxrgrWR6J+IpBAYnW4kvcPedgPcp5BaBCS2y9xroggZmIND5TmBYjQY0G7uggaU1oHmpr4Cbdf8dO+z6JQ+9gIB/xBON3T2KYvt1bAAAAABJRU5ErkJggg==","ic_action_send_icon.png":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAgCAYAAABU1PscAAABEUlEQVRYw+3XwW2DMBiG4RfEAEyAGIEzp2wQNoANMgLyCJ0gzQZskJvP3aCVF2g2aA91pAjRJMV/Yrvyd0Igo+8BDBhSUlL+FKXNu9JmCKVPtgLwZTc/ADW21WusAEKASAC8QiQBXiD5ijGnG8drYP+syZ6tGaS06YAtcE/Bh96RzGWw0qYEzpjOBySTOtEFZgc0z4K43oEBOI1tNc321xbTX8GIQFwBR2BjJ/YEvIxt9baAGSymloZIAeaFJuCwgGkspFvArILkRJ5C6Dy3HqHdL1fd+RFyBRxs6Tgn8X94jcb5IbO/Ev0dpcP7lVDafAKl7+Iuk7gMobj0a9TbgqaItbgEIIhFfRFr8ZSUlJ98Awi3lNmk+OSWAAAAAElFTkSuQmCC","ic_action_new.png":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAQAAAAAYLlVAAAAj0lEQVRo3u3YsQ2AIBRF0YdYuJMjuJEDsJEjuBMN0UJjISaCFGi8t7HxkxNoUImI/p4pGV4GWUnBTLUAszpJ3vTP12hqHwEAAAAAAAAAAACA6gBzcdMdk6e7/emTJ9z5Bt1Gr9hjWWVD7rOvO4J4B0LGhuYfQeDDBAAAAAAAAAAAAMAHbsU5ue13vYiICloBd7gS8a1wnOgAAAAASUVORK5CYII=","ic_notifications_test_quiz.png":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAARCAYAAADUryzEAAACSklEQVQ4y42SS0hUcRTGf/fOvQ6TLzKYcfI5DoYpZIs0K81BBFu0aOFegtkYBLUzalu0iFbhLBqiq0ibgghahFIOJtMDeiySHlxnFHWcIR/cUcaZuTO3xTwsnSHP6s/5znf+3znfESgQzXcZ7bU7hwF8IdXza4QrFAlTMbKr00pjTSlo5o5o14ZtfYqXhRqIexM5smb2o5n9uDqt5NQcSEG0a8OGZu5oO2bBIpXzeiaBL6R6iikQ3IrTKAT098cAmJqy7MO8Q6qQe0sAF8+dZCu58k/RetwPgKvzTD4ni6VMvguwdHvSMIw0dbcGBAkgZcRJGTvo6R0SKY2UkYS4FYBN1N15BZn6hcsI7c1saXHUm08NEeB7YJ2ZjxqrK4c5JFdjEuR9smOmCIvPhjnvGuDRzycAJH+HMy4EQmG8Q2pjIBRmaclMialiX4Oexw3c6Z3nzewnek534/06yr2z9xGAhmzNAtDgVpzBno4KoonlPLl9rILuwVqINfFts54H01H0U8/xhVSP5Facwdxm3Yoz6LDbkEWR8pIa9PQOrUqKrsE6iGX+eftiHL1v90IlAIfdhlvBcNhttDZZmZuPEAhpXJ0zOHHBBRlHGR3387kPvENqY1ZxxsYWRxW1tTFkUcySwzystMK1SzD3AwDP2CyVI1XwIZIbd/eUY/oa0cQyyfR2fqETX6p5Nb0NthbGJnykr28UPGUJoEw+CoBFOoLDbsGtEJz36yyuvKdtFcpuHMekr2XrIgc75exSi2L5Bn/ZuDcW/oMB8AdPJOq18j24LwAAAABJRU5ErkJggg=="};
function officialIcon(name,alt=''){const src=officialIconData[name]||officialIconExtraData[name]||'';return src?`<img class="officialEmbeddedIcon" src="${src}" alt="${esc(alt)}">`:''}
function officialOrAssetIcon(name,alt=''){const embedded=officialIcon(name,alt);if(embedded)return embedded;const src=String(name||'').endsWith('.svg')||String(name||'').endsWith('.png')?name:`${name}.png`;return `<img class="officialEmbeddedIcon" src="../assets/icons/${src}" alt="${esc(alt)}">`}
const originalM3IconMap={school:'ic_school.svg',qr_code_scanner:'ic_qr_code.svg',arrow_back:'ic_arrow_back_white_24dp.svg',search:'ic_search_list.svg',chevron_right:'ic_chevron.svg',menu:'ic_menu.svg',menu_open:'ic_menu.svg',add:'ic_add_white_24dp.svg',notifications:'ic_menu_notifications.svg',mail:'ic_menu_messages.svg',request_quote:'ic_menu_requests.svg',home:'ic_menu_home.svg',book:'ic_menu_courses.svg',groups:'ic_menu_groups.svg',folder:'ic_menu_resources.svg',assignment:'ic_menu_grades.svg',calendar_month:'ic_menu_calender.svg',settings:'ic_menu_account_settings.svg',logout:'ic_menu_logout.svg',refresh:'ic_action_refresh.png'};
function originalM3Icon(name,alt=''){return officialOrAssetIcon(originalM3IconMap[name]||name,alt)}

function syncIosStatusBarInset(){
 const platform=A.platform||document.documentElement.dataset.electronPlatform||'';
 const enabled=(platform==='ios'||platform==='android')&&state.screen==='app'&&!!app.querySelector('.m3eShell');
 const ios=enabled&&platform==='ios',android=enabled&&platform==='android';
 document.documentElement.classList.toggle('iosAppSafeArea',!!ios);
 document.documentElement.classList.toggle('androidAppSafeArea',!!android);
 app.querySelector('.iosStatusBarInset')?.remove();app.querySelector('.androidStatusBarInset')?.remove();
 if(ios||android){const inset=document.createElement('div');inset.className=ios?'iosStatusBarInset':'androidStatusBarInset';inset.setAttribute('aria-hidden','true');app.prepend(inset)}
}
function render(){if(!state.embeddedTitle)window.dispatchEvent(new Event('schoology-close-embedded-webviews'));let h=state.message?messageDetail():state.screen==='login'?login():state.screen==='search'?schoolSearchScreen():state.screen==='credentials'?credentials():state.screen==='externalSelect'?externalSelect():state.screen==='qr'?qr():shell();app.innerHTML=h;bind();applyThemeToDocument();syncIosStatusBarInset();syncWindowChrome();return h}
function syncWindowChrome(){if(A.platform!=='win32'&&A.platform!=='linux')return;let color='#002137';if(state.screen!=='app'){color='#002137'}else if(document.getElementById('appDrawerContainer')?.start)color='#002137';A.setWindowChrome?.({color,symbolColor:'#ffffff',height:56}).catch?.(()=>{})}
function m3eTheme(content,extraClass=''){const t=getThemeSettings();return `<m3e-theme class="m3eRoot ${extraClass}" color="${esc(t.color)}" variant="${esc(t.variant)}" scheme="${esc(t.scheme)}" contrast="${esc(t.contrast)}" motion="${esc(t.motion)}" strong-focus>${content}</m3e-theme>`;}
function login(){return m3eTheme(`<main class="m3eLogin loginAnimated"><img class="m3eLoginLogo" src="${themeLogoSrc()}" alt="Schoology"><div class="m3eLoginActions">
  <m3e-button id="schoolLogin" variant="filled" size="large" class="m3eLoginButton"><span class="m3eOriginalIcon">${originalM3Icon("school")}</span>Log in through your School</m3e-button>
  <m3e-button id="continueSchoology" variant="tonal" size="large" class="m3eLoginButton"><img src="${themeLogoSrc()}" class="m3eButtonLogo" slot="icon" alt="">Log in using schoology.com</m3e-button>
  <m3e-button id="qrLogin" variant="outlined" size="large" class="m3eLoginButton"><span class="m3eOriginalIcon">${originalM3Icon("qr_code_scanner")}</span>Sign in with a QR code</m3e-button>
</div>${typeof A.getServerInstance==='function'?`<m3e-button id="switchCanada" class="m3eLoginHelp" variant="text" size="medium">${state.canadianInstance?'Switch to app.schoology.com':'Switch to app.schoologyca.com'}</m3e-button>`:''}<m3e-button id="loginHelp" class="m3eLoginHelp" variant="text" size="medium">I need help signing in</m3e-button>${state.error?`<div class="m3eLoginError" role="alert">${esc(state.error)}</div>`:''}</main>`,'m3eLoginScreen');}
function schoolSearchScreen(){return m3eTheme(`<main class="m3eLogin loginAnimated"><m3e-app-bar size="small" class="m3eLoginAppBar"><m3e-icon-button id="back" slot="leading" aria-label="Back"><span class="m3eOriginalIcon">${originalM3Icon("arrow_back")}</span></m3e-icon-button><span slot="title">School</span></m3e-app-bar><img class="m3eLoginLogo m3eLoginLogoSmall" src="${themeLogoSrc()}" alt="Schoology"><div class="m3eSearchArea"><m3e-search-view id="schoolSearchView" mode="docked" contained open clear-label="Clear school search" close-label="Close school search"><span class="m3eOriginalIcon">${originalM3Icon("search")}</span><input id="schoolSearch" slot="input" autocomplete="off" placeholder="Enter your School or domain" value="${esc(state.q)}"><m3e-list variant="segmented" id="schoolSuggestions"></m3e-list></m3e-search-view><div id="schoolSearchStatus" class="m3eSearchStatus"></div></div>${state.error?`<div class="m3eLoginError" role="alert">${esc(state.error)}</div>`:''}</main>`,'m3eSearchScreen');}
function credentials(){return m3eTheme(`<main class="m3eLogin loginAnimated"><m3e-app-bar size="small" class="m3eLoginAppBar"><m3e-icon-button id="back" slot="leading" aria-label="Back"><span class="m3eOriginalIcon">${originalM3Icon("arrow_back")}</span></m3e-icon-button><span slot="title">Log in using schoology.com</span></m3e-app-bar><img class="m3eLoginLogo m3eLoginLogoSmall" src="${themeLogoSrc()}" alt="Schoology"><form id="credentialForm" class="m3eCredentialForm"><div class="m3eCredentialSchool">${state.school?`<span class="m3eOriginalIcon">${originalM3Icon("school")}</span><span>${esc(state.school.title||'School')}</span>`:'<m3e-heading variant="title" size="medium">Log in using schoology.com</m3e-heading>'}</div><m3e-form-field variant="outlined"><label slot="label" for="user">Username or Email</label><input id="user" autocomplete="username"></m3e-form-field><m3e-form-field variant="outlined"><label slot="label" for="pass">Password</label><input id="pass" type="password" autocomplete="current-password"></m3e-form-field><m3e-button id="signIn" type="submit" variant="filled" size="large">Login</m3e-button><m3e-button id="qrLogin" type="button" variant="outlined" size="medium"><span class="m3eOriginalIcon">${originalM3Icon("qr_code_scanner")}</span>Sign in with a QR code</m3e-button></form>${state.error?`<div class="m3eLoginError" role="alert">${esc(state.error)}</div>`:''}</main>`,'m3eCredentialsScreen');}
function externalSelect(){
  const name=state.school?.title||'School';
  const progress=state.loading?`<div class="m3eExternalLoginProgress"><m3e-circular-progress-indicator indeterminate></m3e-circular-progress-indicator><span>Continue signing in in your default browser…</span></div>`:'';
  return m3eTheme(`<main class="m3eLogin loginAnimated"><m3e-app-bar size="small" class="m3eLoginAppBar"><m3e-icon-button id="back" slot="leading" aria-label="Back" ${state.loading?'disabled':''}><span class="m3eOriginalIcon">${originalM3Icon("arrow_back")}</span></m3e-icon-button><span slot="title">${esc(name)}</span></m3e-app-bar>${progress}<div class="m3eExternalActions">${state.loading?'':`<m3e-button id="browserLogin" variant="filled" size="large">Try browser sign-in again</m3e-button><m3e-button id="nativeLogin" variant="outlined" size="large">Use username and password instead</m3e-button>`}</div>${state.error?`<div class="m3eLoginError" role="alert">${esc(state.error)}</div>`:''}</main>`,'m3eExternalScreen');
}
async function startSchoolBrowserLogin(){
  state.loading=true;state.error='';render();
  try{
    let domain='';
    for(const candidate of [state.school?.domain,state.school?.school_domain,state.school?.schoolDomain,state.school?.url,state.school?.login_url,state.school?.loginUrl]){
      const raw=String(candidate||'').trim();if(!raw)continue;
      try{const parsed=new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)?raw:`https://${raw}`);if(['http:','https:'].includes(parsed.protocol)&&parsed.hostname){domain=parsed.host;break}}catch{}
    }
    if(!domain)throw new Error('This school did not provide a valid login domain.');
    state.auth=await A.loginSchoolBrowser({domain});await afterLogin();
  }catch(error){state.loading=false;state.error=error.message||'Browser sign-in failed.';render()}
}
function qr(){return m3eTheme(`<main class="m3eQrScreen loginAnimated"><m3e-app-bar size="small" class="m3eQrAppBar"><m3e-icon-button id="back" slot="leading" aria-label="Back"><span class="m3eOriginalIcon">${originalM3Icon("arrow_back")}</span></m3e-icon-button><span slot="title">QR Code Login</span></m3e-app-bar><section class="m3eQrCamera"><video id="video" autoplay playsinline muted></video><canvas id="canvas"></canvas><div class="m3eQrOverlay"><m3e-heading variant="title" size="large" level="1">Scan Your Code</m3e-heading><div class="qrbox"></div><p>Point your camera at the QR code shown in Schoology.</p></div>${state.error?`<div class="m3eQrError" role="alert">${esc(state.error)}<m3e-button id="qrRetry" variant="outlined" size="small">Try again</m3e-button></div>`:''}</section></main>`,'m3eQrLoginScreen');}
function drawerItemMarkup(id,label,icon){
 const iconMap={messages:'mail',notifications:'notifications',requests:'request_quote',home:'home',courses:'book',groups:'groups',resources:'folder',grades:'assignment',calendar:'calendar_month',people:'people',settings:'settings',logout:'logout'};
 const name=iconMap[id]||'menu';
 return `<m3e-nav-menu-item data-drawer="${id}"><span slot="icon" class="drawerSchoologyIcon">${originalM3Icon(name)}</span><span slot="label">${label}</span></m3e-nav-menu-item>`;
}
function shell(){
 const drawerItems=[
  ['messages','Messages'],['notifications','Notifications'],['requests','Requests'],
  ['home','Home'],['courses','Courses'],['groups','Groups'],['resources','Resources'],['grades','Grades'],['calendar','Calendar'],
  ...(state.peopleEnabled?[['people','People']]:[]),['settings','Settings'],['logout','Logout']
 ];
 const nested=(id,label,icon)=>`<m3e-nav-menu-item id="drawer-${id}" data-drawer="${id}"><span slot="icon" class="drawerSchoologyIcon">${originalM3Icon(icon)}</span><span slot="label">${label}</span><m3e-nav-menu-item class="drawerSubLoading" disabled><span slot="label">Loading…</span></m3e-nav-menu-item></m3e-nav-menu-item>`;
 const drawerList=drawerItems.map(([id,label],i)=>`${i===3?'<m3e-divider></m3e-divider>':''}${id==='settings'?'<m3e-divider></m3e-divider>':''}${drawerItemMarkup(id,label)}`).join('');
 const leading=state.settingsPage==='theme'?`<m3e-icon-button id="toolbarBack" slot="leading" aria-label="Back"><span class="m3eOriginalIcon">${originalM3Icon("arrow_back")}</span></m3e-icon-button>`:state.assignmentView||state.embeddedTitle?`<m3e-icon-button id="toolbarBack" slot="leading" aria-label="Back"><span class="m3eOriginalIcon">${originalM3Icon("arrow_back")}</span></m3e-icon-button>`:`<m3e-icon-button id="menuButton" slot="leading" aria-label="Navigation menu"><m3e-drawer-toggle for="startDrawer"></m3e-drawer-toggle><span class="m3eOriginalIcon">${originalM3Icon("menu")}</span></m3e-icon-button>`;
 const t=getThemeSettings();return `<m3e-theme class="m3eRoot m3eShellTheme" color="${esc(t.color)}" variant="${esc(t.variant)}" scheme="${esc(t.scheme)}" contrast="${esc(t.contrast)}" motion="${esc(t.motion)}" strong-focus"><div class="shell m3eShell"><m3e-drawer-container id="appDrawerContainer" start-mode="over" class="m3eAppDrawerContainer m3eSchoologyDrawer"><nav slot="start" id="startDrawer" aria-label="Navigation" class="m3eDrawer"><m3e-nav-menu class="m3eDrawerNav"><m3e-nav-menu-item id="drawerProfile" data-drawer="profile"><img slot="icon" class="drawerProfileImage" data-profile-drawer-image="1" src="../assets/icons/profile_default_website.png" alt="Profile"><span slot="label">${esc(state.auth?.user?.name_display||state.auth?.user?.name||'Profile')}</span></m3e-nav-menu-item><m3e-divider></m3e-divider>${drawerItems.map(([id,label],i)=>`${i===3?'<m3e-divider></m3e-divider>':''}${id==='settings'?'<m3e-divider></m3e-divider>':''}${id==='courses'?nested('courses','Courses','book'):id==='groups'?nested('groups','Groups','groups'):id==='grades'?nested('grades','Grades','assignment'):drawerItemMarkup(id,label)}`).join('')}</m3e-nav-menu></nav><main class="m3eShellMain"><m3e-app-bar id="mainAppBar" class="m3eMainAppBar">${leading}<span slot="title" class="toolbarTitle">${esc(state.toolbarTitle||'Home')}</span></m3e-app-bar><main id="content"><div class="loading"><m3e-circular-progress-indicator indeterminate class="m3eInlineProgress" aria-label="Loading"></m3e-circular-progress-indicator><span>Loading…</span></div></main><div id="floatingActionSlot" class="floatingActionSlot"></div></main></m3e-drawer-container></div></m3e-theme>`;
}
function setDownloadButtonState(button,active,label='Downloading…'){
  if(!button)return;
  if(active){
    button.dataset.downloadBusy='1';button.disabled=true;button.classList.add('downloadBusy');
    if(!button.querySelector('.downloadProgressWrap')) button.insertAdjacentHTML('beforeend',`<span class="downloadProgressWrap"><m3e-circular-progress-indicator indeterminate class="m3eInlineProgress" aria-label="Loading"></m3e-circular-progress-indicator><span>${esc(label)}</span></span>`);
  }else{
    button.disabled=false;button.classList.remove('downloadBusy');button.querySelector('.downloadProgressWrap')?.remove();delete button.dataset.downloadBusy;
  }
}
async function downloadWithFeedback(button,params){
  const progressId='dl-'+Date.now()+'-'+Math.random().toString(36).slice(2);
  setDownloadButtonState(button,true);
  const stop=A.onFileDownloadProgress?.(d=>{if(!d||d.id!==progressId)return;if(d.total){const pct=Math.min(100,Math.round((d.received/d.total)*100));const wrap=button.querySelector('.downloadProgressWrap span:last-child');if(wrap)wrap.textContent=`Downloading… ${pct}%`;}});
  try{return await A.downloadFile({...params,progressId});}
  finally{stop?.();setDownloadButtonState(button,false);}
}

async function showJoinCourseDialog(){
  const old=document.getElementById('joinCourseDialog');old?.remove();const wrap=document.createElement('div');wrap.id='joinCourseDialog';wrap.className='assignmentCommentDialogOverlay';
  wrap.innerHTML=`<m3e-dialog open class="androidSimpleDialog" disable-close><span slot="header" class="androidDialogHeader"><b>Join Course</b><button id="joinCourseCancel" class="androidDialogIcon">${officialIcon('ic_action_discard_icon.png','Cancel')}</button></span><div class="androidSimpleDialogBody"><label>Access Code</label><input id="joinCourseCode" autocomplete="off" placeholder="Enter access code"><div id="joinCourseStatus"></div></div><div slot="actions" end><m3e-button id="joinCourseSubmit" variant="filled">Join</m3e-button></div></m3e-dialog>`
  document.body.appendChild(wrap);const close=()=>wrap.remove();wrap.querySelector('#joinCourseCancel')?.addEventListener('click',close);wrap.addEventListener('click',e=>{if(e.target===wrap)close()});
  wrap.querySelector('#joinCourseSubmit')?.addEventListener('click',async()=>{const code=wrap.querySelector('#joinCourseCode')?.value.trim();const st=wrap.querySelector('#joinCourseStatus');if(!code){st.textContent='Enter an access code.';return}try{st.textContent='Joining…';const x=await A.api({path:'sections/accesscode',method:'POST',json:true,params:{access_code:code}});const status=String(x?.status||x?.enrollment?.status||'').toLowerCase();st.textContent=status==='pending'?'Course request sent.':status==='active'?'You joined the course.':'Course request submitted.';setTimeout(()=>{close();loadCourseSubmenu()},500)}catch(e){st.textContent='Unable to join course: '+e.message}});requestAnimationFrame(()=>wrap.querySelector('#joinCourseCode')?.focus());
}
async function showJoinGroupDialog(){
  const old=document.getElementById('joinGroupDialog');old?.remove();
  const wrap=document.createElement('div');wrap.id='joinGroupDialog';wrap.className='assignmentCommentDialogOverlay';
  wrap.innerHTML=`<m3e-dialog open class="androidSimpleDialog" disable-close><span slot="header" class="androidDialogHeader"><b>Join Group</b><button id="joinGroupCancel" class="androidDialogIcon">${officialIcon('ic_action_discard_icon.png','Cancel')}</button></span><div class="androidSimpleDialogBody"><label>Access Code</label><input id="joinGroupCode" autocomplete="off" placeholder="Enter access code"><div id="joinGroupStatus"></div></div><div slot="actions" end><m3e-button id="joinGroupSubmit" variant="filled">Join</m3e-button></div></m3e-dialog>`
  document.body.appendChild(wrap);
  const close=()=>wrap.remove();wrap.querySelector('#joinGroupCancel')?.addEventListener('click',close);wrap.addEventListener('click',e=>{if(e.target===wrap)close()});
  wrap.querySelector('#joinGroupSubmit')?.addEventListener('click',async()=>{const code=wrap.querySelector('#joinGroupCode')?.value.trim();const st=wrap.querySelector('#joinGroupStatus');if(!code){st.textContent='Enter an access code.';return}try{st.textContent='Joining…';const x=await A.api({path:'groups/accesscode',method:'POST',json:true,params:{access_code:code}});const status=String(x?.status||x?.enrollment?.status||'').toLowerCase();st.textContent=status==='pending'?'Group request sent.':status==='active'?'You joined the group.':'Group request submitted.';setTimeout(()=>{close();loadCourseSubmenu()},500)}catch(e){st.textContent='Unable to join group: '+e.message}});
  requestAnimationFrame(()=>wrap.querySelector('#joinGroupCode')?.focus());
}
function wireFabMenu(plus,menu){
  if(!plus||!menu)return;
  let trigger=plus.querySelector("m3e-fab-menu-trigger");
  if(!trigger){
    trigger=document.createElement("m3e-fab-menu-trigger");
    plus.replaceChildren(trigger);
  }
  const add=document.createElement("m3e-icon");
  add.setAttribute("name","add");add.setAttribute("variant","outlined");
  const close=document.createElement("m3e-icon");
  close.setAttribute("slot","close-icon");close.setAttribute("name","close");close.setAttribute("variant","outlined");close.hidden=true;
  trigger.replaceChildren(add,close);
  const syncFabIcon=()=>{const open=!!menu.isOpen;add.hidden=open;close.hidden=!open;};
  menu.addEventListener("toggle",syncFabIcon);syncFabIcon();
  trigger.setAttribute("for",menu.id);
}
function createFabMenuFor(plusId,menuId,itemsHtml){
  const plus=document.getElementById(plusId);if(!plus)return null;
  document.getElementById(menuId)?.remove();
  const menu=document.createElement("m3e-fab-menu");menu.id=menuId;menu.innerHTML=itemsHtml;
  document.body.appendChild(menu);
  wireFabMenu(plus,menu);
  return menu;
}

let homePostableUpdateDestinations=[];
let homePermissionLoadPromise=null;
async function loadHomeCreationPermissions(force=false){
 if(homePermissionLoadPromise&&!force)return homePermissionLoadPromise;
 homePermissionLoadPromise=(async()=>{
  const uid=state.auth?.userId||state.auth?.user?.id;if(!uid)return [];
  try{
   const pair=await Promise.all([A.api({path:'users/'+uid+'/sections',params:{limit:100}}),A.api({path:'users/'+uid+'/groups',params:{limit:100}})]);
   const sections=pair[0]?.section||pair[0]?.sections||[],groups=pair[1]?.group||pair[1]?.groups||[];
   const destinations=[...sections.map(x=>({realm:'sections',id:x.id||x.section_id,label:x.section_title||x.course_title||x.title||'Course'})),...groups.map(x=>({realm:'groups',id:x.id||x.group_id,label:x.name||x.title||'Group'}))].filter(x=>x.id!=null);
   if(!destinations.length){homePostableUpdateDestinations=[];return []}
   const paths=destinations.map(x=>'/v1/'+x.realm+'/'+x.id+'/updates'),response=await A.api({path:'multioptions',method:'POST',params:{request:paths}}),rows=Array.isArray(response?.response)?response.response:(Array.isArray(response?.responses)?response.responses:[]),bodies={};
   for(const row of rows){if(!row?.location)continue;let body=row.body??row.data??'';try{if(typeof body==='string')body=JSON.parse(body)}catch{}bodies[String(row.location)]=body}
   const canPost=value=>{if(value==null)return false;if(typeof value==='boolean')return value;if(typeof value==='number')return value===1;if(typeof value==='string'){const v=value.toLowerCase();if(v==='true'||v==='1'||v==='post')return true;try{return canPost(JSON.parse(value))}catch{return v.includes('post')}}if(Array.isArray(value))return value.some(canPost);if(typeof value==='object'){for(const [key,val] of Object.entries(value))if(String(key).toLowerCase()==='post'&&canPost(val))return true;return canPost(value.permissions??value.permission_map??value.permissionMap??value.data)}return false};
   homePostableUpdateDestinations=destinations.filter(x=>canPost(bodies['/v1/'+x.realm+'/'+x.id+'/updates']));return homePostableUpdateDestinations;
  }catch(error){console.warn('Unable to check homepage update permissions:',error?.message||error);homePostableUpdateDestinations=[];return []}
 })();
 const result=await homePermissionLoadPromise;showHomeCreateMenu();return result;
}
function openHomeUpdateComposer(){
 const destinations=homePostableUpdateDestinations;if(!destinations.length){showAppDialog('Post Update','Your account does not have permission to post updates in an available course or group.');return}
 document.getElementById('homeUpdateComposer')?.remove();const wrap=document.createElement('div');wrap.id='homeUpdateComposer';wrap.className='sharedOverlay';
 wrap.innerHTML='<m3e-dialog open class="sharedM3eDialog homeUpdateComposerDialog" disable-close><span slot="header">Post Update</span><div class="homeUpdateComposerBody"><label for="homeUpdatePostTo">Post to</label><m3e-select id="homeUpdatePostTo" block><m3e-option value="">Select a course or group</m3e-option>'+destinations.map((item,index)=>'<m3e-option value="'+index+'">'+esc(item.label)+'</m3e-option>').join('')+'</m3e-select><label for="homeUpdateBody">Update</label><textarea id="homeUpdateBody" rows="4" placeholder="Write an update…"></textarea><div id="homeUpdateStatus" role="status"></div></div><span slot="actions" end><m3e-button data-home-update-cancel variant="text">Cancel</m3e-button><m3e-button data-home-update-submit variant="filled">Post</m3e-button></span></m3e-dialog>';
 document.body.appendChild(wrap);wrap.querySelector('[data-home-update-cancel]')?.addEventListener('click',()=>wrap.remove());
 wrap.querySelector('[data-home-update-submit]')?.addEventListener('click',async()=>{const select=wrap.querySelector('#homeUpdatePostTo'),field=wrap.querySelector('#homeUpdateBody'),status=wrap.querySelector('#homeUpdateStatus'),target=destinations[Number(select?.value)],body=String(field?.value||'').trim();if(!target){status.textContent='Select a course or group.';return}if(!body){status.textContent='Write an update before posting.';return}const button=wrap.querySelector('[data-home-update-submit]');button.disabled=true;status.textContent='Posting…';try{await A.api({path:target.realm+'/'+target.id+'/updates',method:'POST',params:{body},json:true});wrap.remove();await loadHomeTab()}catch(error){button.disabled=false;status.textContent=error?.message||String(error)}});
}
function showHomeCreateMenu(){
 const plus=document.getElementById('homeCreatePlus');if(!plus)return;document.getElementById('homeCreateMenu')?.remove();
 const updateItem=homePostableUpdateDestinations.length?'<m3e-fab-menu-item id="createHomeUpdate"><m3e-icon slot="icon" name="edit" variant="outlined"></m3e-icon>Update</m3e-fab-menu-item>':'';
 const menu=createFabMenuFor('homeCreatePlus','homeCreateMenu',updateItem+'<m3e-fab-menu-item id="createHomeDiscussion"><m3e-icon slot="icon" name="add" variant="outlined"></m3e-icon>Discussion</m3e-fab-menu-item><m3e-fab-menu-item id="createHomeEvent"><m3e-icon slot="icon" name="event" variant="outlined"></m3e-icon>Event</m3e-fab-menu-item>');if(!menu)return;
 document.getElementById('createHomeUpdate')?.addEventListener('click',()=>{menu.hide?.();openHomeUpdateComposer()});
 document.getElementById('createHomeDiscussion')?.addEventListener('click',()=>{menu.hide?.();showCreatePostDialog('discussion','',null)});
 document.getElementById('createHomeEvent')?.addEventListener('click',()=>{menu.hide?.();showCreatePostDialog('event','',null)});
}
function showCreatePostDialog(kind,realm,realmId){
  const old=document.getElementById('createPostDialog');old?.remove();
  const wrap=document.createElement('div');wrap.id='createPostDialog';wrap.className='assignmentCommentDialogOverlay';
  const isEvent=kind==='event', title=isEvent?'New Event':'New Discussion';
  const now=new Date();
  const pad=n=>String(n).padStart(2,'0');
  const dateValue=`${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
  const timeValue=`${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const postTo=(realm==='users'?'My Account':`${realm.charAt(0).toUpperCase()+realm.slice(1)} ${realmId||''}`).trim();
  wrap.innerHTML=`<m3e-dialog open class="androidCreatePostDialog" disable-close>
    <span slot="header" class="androidCommentDialogBar"><button id="createPostCancel" class="androidDialogIcon" aria-label="Cancel">${officialIcon('ic_action_discard_icon.png','Cancel')}</button><div class="androidDialogTitle">${title}</div><button id="createPostSend" class="androidDialogIcon" aria-label="Post">${officialIcon('ic_action_send_icon.png','Post')}</button></span>
    <div class="androidCreatePostBody">
      <label class="androidFieldLabel">Post To</label><div class="androidPostToField">${esc(postTo)}</div>
      <input id="createPostTitle" placeholder="Title" autocomplete="off">
      <textarea id="createPostBody" placeholder="${isEvent?'Description':'Description'}"></textarea>
      ${isEvent?`<div class="androidSwitchRow"><label><input id="createEventAllDay" type="checkbox" checked> All Day</label></div>
      <div class="androidDateRow"><span>When</span><input id="createEventStartDate" type="date" value="${dateValue}"><input id="createEventStartTime" type="time" value="${timeValue}"></div>
      <label class="androidCheckRow"><input id="createEventAddEnd" type="checkbox"> End Date</label>
      <div id="createEventEndWrap" class="androidDateRow" style="display:none"><input id="createEventEndDate" type="date" value="${dateValue}"><input id="createEventEndTime" type="time" value="${timeValue}"><button id="createEventEndCancel" type="button">×</button></div>
      <label class="androidFieldLabel">RSVP</label><select id="createEventRsvp"><option value="0">No RSVP</option><option value="1">Yes</option><option value="2">Maybe</option></select>
      <label class="androidCheckRow"><input id="createEventComments" type="checkbox" checked> Enable comments</label>`:
      `<label class="androidCheckRow"><input id="createDiscussionDue" type="checkbox"> Due Date</label>
      <div id="createDiscussionDueWrap" class="androidDateRow" style="display:none"><input id="createDiscussionDueDate" type="date" value="${dateValue}"><input id="createDiscussionDueTime" type="time" value="${timeValue}"></div>
      <label class="androidCheckRow"><input id="createDiscussionGrading" type="checkbox"> Enable Grading</label>
      <div id="createDiscussionGradingWrap" class="androidGradingBox" style="display:none"><label>Max Points <input id="createDiscussionMaxPoints" type="number" min="0" step="0.01"></label><label>Factor <input id="createDiscussionFactor" type="number" min="0" step="0.01" value="1.0"></label></div>
      <label class="androidCheckRow"><input id="createDiscussionPublished" type="checkbox" checked> Published</label>`}
      <div id="createPostStatus" class="androidCreatePostStatus"></div>
    </div>
  </section>`;
  document.body.appendChild(wrap);
  let selectedRealm=realm||'', selectedId=realmId||null;
  const postToEl=wrap.querySelector('.androidPostToField');
  if(!selectedRealm){
    postToEl.innerHTML='<span class="androidPostToLoading">Loading destinations…</span>';
    (async()=>{try{
      const uid=state.auth?.userId||state.auth?.user?.id;const [sx,gx]=await Promise.all([A.api({path:`users/${uid}/sections`,params:{limit:100}}).catch(()=>({})),A.api({path:`users/${uid}/groups`,params:{limit:100}}).catch(()=>({}))]);
      const sections=sx?.section||sx?.sections||[],groups=gx?.group||gx?.groups||[];const opts=[{realm:'users',id:uid,label:'My Account'},...sections.map(x=>({realm:'sections',id:x.id||x.section_id,label:x.section_title||x.course_title||x.title||'Course'})),...groups.map(x=>({realm:'groups',id:x.id||x.group_id,label:x.name||x.title||'Group'}))].filter(x=>x.id!=null);
      if(!opts.length)throw new Error('No posting destinations were found.');
      postToEl.innerHTML='<select id="createPostDestination">'+opts.map((x,i)=>`<option value="${i}">${esc(x.label)}</option>`).join('')+'</select>';
      const sel=postToEl.querySelector('#createPostDestination');const apply=()=>{const o=opts[Number(sel.value)||0];selectedRealm=o.realm;selectedId=o.id};sel?.addEventListener('change',apply);apply();
    }catch(e){postToEl.innerHTML='<span class="androidCreatePostStatus">Unable to load posting destinations.</span>';postToEl.dataset.error=e.message||String(e)}})();
  }

  const close=()=>wrap.remove();
  wrap.querySelector('#createPostCancel')?.addEventListener('click',close);
  wrap.addEventListener('click',e=>{if(e.target===wrap)close()});
  if(isEvent){
    const all=wrap.querySelector('#createEventAllDay'),end=wrap.querySelector('#createEventAddEnd'),endWrap=wrap.querySelector('#createEventEndWrap');
    const sync=()=>{wrap.querySelector('#createEventStartTime').disabled=all.checked;wrap.querySelector('#createEventEndWrap').style.display=end.checked?'flex':'none';};
    all?.addEventListener('change',sync);end?.addEventListener('change',sync); wrap.querySelector('#createEventStartTime')?.addEventListener('focus',()=>{if(all.checked){all.checked=false;sync()}}); wrap.querySelector('#createEventEndTime')?.addEventListener('focus',()=>{if(all.checked){all.checked=false;sync()}});wrap.querySelector('#createEventEndCancel')?.addEventListener('click',()=>{end.checked=false;sync()});sync();
  }else{
    const due=wrap.querySelector('#createDiscussionDue'),grading=wrap.querySelector('#createDiscussionGrading');
    due?.addEventListener('change',()=>wrap.querySelector('#createDiscussionDueWrap').style.display=due.checked?'flex':'none');
    grading?.addEventListener('change',()=>wrap.querySelector('#createDiscussionGradingWrap').style.display=grading.checked?'block':'none');
  }
  wrap.querySelector('#createPostSend')?.addEventListener('click',async()=>{
    const titleText=wrap.querySelector('#createPostTitle')?.value.trim(), body=wrap.querySelector('#createPostBody')?.value.trim(), st=wrap.querySelector('#createPostStatus'), send=wrap.querySelector('#createPostSend');
    if(!titleText){st.textContent=isEvent?'Enter a title.':'Enter a title.';return}
    if(!selectedRealm||!selectedId){st.textContent=wrap.querySelector('.androidPostToField')?.dataset.error||'Choose where to post this first.';return}
    send.disabled=true;st.textContent='Posting…';
    try{
      if(isEvent){
        const all=!!wrap.querySelector('#createEventAllDay')?.checked;
        const sd=wrap.querySelector('#createEventStartDate')?.value,stt=wrap.querySelector('#createEventStartTime')?.value||'00:00';
        const ed=wrap.querySelector('#createEventEndDate')?.value,ett=wrap.querySelector('#createEventEndTime')?.value||'00:00';
        const start=all?`${sd} 00:00:00`:`${sd} ${stt}:00`;
        const hasEnd=!!wrap.querySelector('#createEventAddEnd')?.checked;
        if(hasEnd && ed && new Date(`${ed}T${ett}`)<new Date(`${sd}T${stt}`))throw new Error('The end date cannot be before the start date.');
        const params={title:titleText,description:body,start,is_all_day:all?1:0,rsvp:Number(wrap.querySelector('#createEventRsvp')?.value||0),comments_enabled:wrap.querySelector('#createEventComments')?.checked?1:0};
        if(hasEnd){params.has_end=1;params.end=all?`${ed} 23:59:00`:`${ed} ${ett}:00`}
        await A.api({path:`${selectedRealm}/${selectedId}/events`,method:'POST',params,json:true});
      }else{
        const params={title:titleText,body,published:wrap.querySelector('#createDiscussionPublished')?.checked?1:0};
        if(wrap.querySelector('#createDiscussionDue')?.checked){const d=wrap.querySelector('#createDiscussionDueDate')?.value,t=wrap.querySelector('#createDiscussionDueTime')?.value||'00:00';params.due_date=`${d} ${t}:00`}
        if(wrap.querySelector('#createDiscussionGrading')?.checked){const max=wrap.querySelector('#createDiscussionMaxPoints')?.value;if(!max){throw new Error('Enter maximum points.')}params.graded=1;params.max_points=Number(max);params.factor=Number(wrap.querySelector('#createDiscussionFactor')?.value||1)}
        await A.api({path:`${selectedRealm}/${selectedId}/discussions`,method:'POST',params,json:true});
      }
      close();loadTab();
    }catch(e){send.disabled=false;st.textContent='Unable to create '+kind+': '+(e.message||e)}
  });
  requestAnimationFrame(()=>wrap.querySelector('#createPostTitle')?.focus());
}

async function hydrateProfileDrawer(){const el=document.querySelector('[data-profile-drawer-image]');let u=state.auth?.user||{};let url=normalizeImageUrl(u.picture_url||u.pictureUrl||u.picture||u.photo_url||'');if(!url){const uid=state.auth?.userId||u.id;if(uid){try{const r=await A.api({path:`users/${uid}`,params:{picture_size:'sm'}});u=r?.user||r||u;state.auth.user={...(state.auth.user||{}),...u};url=normalizeImageUrl(u.picture_url||u.pictureUrl||u.picture||u.photo_url||'')}catch{}}}if(el&&url){try{const d=await A.fetchImage(url);if(d)el.src=d}catch{}}}

async function updateDrawerBadges(){
  const checks=[['messages','messages/inbox'],['notifications','notifications'],['requests',`users/${state.auth?.userId||state.auth?.user?.id||0}/requests/friends`]];
  for(const [id,path] of checks){try{const x=await A.api({path,params:{limit:1}});const n=Number(x?.total||x?.unread||x?.count||0);document.querySelector(`[data-drawer="${id}"] .drawerBadge`)?.classList.toggle('visible',n>0)}catch{}}
}

function wireM3eSplitPaneTracks(root=document){
  root.querySelectorAll?.("m3e-split-pane").forEach(p=>{
    if(p.__schoologySplitTrackBound)return;
    p.__schoologySplitTrackBound=true;
    const key=p.getAttribute("data-persist-key");
    const storageKey=key?`schoology-m3e-split-pane:${key}`:null;
    const sync=()=>{
      const v=Number(p.value);
      if(Number.isFinite(v))p.style.setProperty("--schoology-split-position",`${Math.max(0,Math.min(100,v))}%`);
    };
    const restore=()=>{
      if(!storageKey)return;
      try{
        const raw=localStorage.getItem(storageKey);
        if(raw===null)return;
        const saved=Number(raw);
        if(!Number.isFinite(saved))return;
        const min=Number(p.getAttribute("min")),max=Number(p.getAttribute("max"));
        const bounded=Math.max(Number.isFinite(min)?min:0,Math.min(Number.isFinite(max)?max:100,saved));
        p.value=bounded;p.setAttribute("value",String(bounded));
      }catch{}
    };
    const save=()=>{
      sync();if(!storageKey)return;
      const value=Number(p.value);
      if(Number.isFinite(value))try{localStorage.setItem(storageKey,String(value))}catch{}
    };
    p.addEventListener("input",save);p.addEventListener("change",save);
    customElements.whenDefined("m3e-split-pane").then(()=>{restore();sync()}).catch(()=>{});
  });
}

function installSplitPaneTrackObserver(){
  const content=document.getElementById("content");
  if(!content||content.__schoologySplitObserver)return;
  content.__schoologySplitObserver=new MutationObserver(()=>wireM3eSplitPaneTracks(content));
  content.__schoologySplitObserver.observe(content,{subtree:true,childList:true});
  wireM3eSplitPaneTracks(content);
}

function bind(){
  installSplitPaneTrackObserver();
  document.getElementById('composeMessage')?.addEventListener('click',()=>showComposeMessage());document.getElementById('joinGroup')?.addEventListener('click',showJoinGroupDialog);
  document.getElementById('toolbarBack')?.addEventListener('click',()=>navigateBack());
  document.getElementById('switchCanada')?.addEventListener('click',async()=>{try{state.canadianInstance=await A.setServerInstance(!state.canadianInstance);state.schools=[];state.q='';state.error='';state.searchToken++;render()}catch(error){showAppDialog('Unable to switch Schoology instance',error?.message||String(error))}});
  document.getElementById('loginHelp')?.addEventListener('click',()=>A.openExternal('https://docs.powerschool.com/SGYH/en/students/schoology-mobile-apps/logging-into-the-schoology-mobile-app-students').catch(e=>{state.error=e.message||'Unable to open the sign-in help page.';render()}));
  const schoolBtn=document.getElementById('schoolLogin');if(schoolBtn)schoolBtn.onclick=()=>{state.error='';state.q='';state.schools=[];state.screen='search';render();document.getElementById('schoolSearch')?.focus()};
  const accountBtn=document.getElementById('continueSchoology');if(accountBtn)accountBtn.onclick=()=>{state.error='';state.school=null;state.screen='credentials';render();document.getElementById('user')?.focus()};
  const qrbtn=document.getElementById('qrLogin');if(qrbtn)qrbtn.onclick=()=>{state.error='';state.screen='qr';render();startQR()};
  const back=document.getElementById('back');if(back)back.onclick=()=>{stopQR();state.error='';state.screen=state.school?'search':'login';if(state.screen==='search')state.schools=[];render()};
  const searchView=document.getElementById('schoolSearchView');
  const q=document.getElementById('schoolSearch');
  if(searchView&&q){
    const status=document.getElementById('schoolSearchStatus'),list=document.getElementById('schoolSuggestions');
    const updateSearchUi=()=>{
      if(status)status.innerHTML=state.loading?'<span>Searching…</span>':(!state.error&&state.q&&state.schools.length===0?'<span>No schools found.</span>':'');
      if(list)list.innerHTML=state.schools.length?state.schools.map((s,i)=>`<m3e-list-item class="m3eSchoolResult" data-school="${i}" tabindex="0"><span>${esc(s.title||'')}</span><span slot="supporting-text">${esc([s.id,s.domain,s.location].filter(Boolean).join(' • '))}</span><span class="m3eOriginalIcon" slot="trailing">${originalM3Icon("chevron_right")}</span></m3e-list-item>`).join(''):'<m3e-list-item class="m3eSearchEmpty" aria-hidden="true">Enter your school name or domain</m3e-list-item>';
      list?.querySelectorAll('[data-school]').forEach(item=>{
        const choose=async()=>{
          const school=state.schools[+item.dataset.school];
          if(!school)return;
          state.school=school;state.schools=[];state.error='';
          state.screen='externalSelect';
          state.loading=true;
          render();
          void startSchoolBrowserLogin();
        };
        item.addEventListener('click',choose,{once:true});
        item.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose()}},{once:true});
      });
    };
    let lastSearchTerm='';
    const runSearch=async(term)=>{
      const query=String(term??'').trim();state.q=query;state.error='';
      if(query.length<1){state.schools=[];state.loading=false;updateSearchUi();return}
      const token=++state.searchToken;lastSearchTerm=query;state.loading=true;updateSearchUi();
      try{const results=await A.schoolSearch(query);if(token!==state.searchToken||query!==lastSearchTerm)return;state.schools=Array.isArray(results)?results:[]}
      catch(e){if(token===state.searchToken){state.schools=[];state.error=e.message||'Unable to search for schools.'}}
      finally{if(token===state.searchToken){state.loading=false;updateSearchUi()}}
    };
    searchView.addEventListener('query',e=>runSearch(e.detail?.term??q.value));
    searchView.addEventListener('clear',()=>runSearch(''));
    q.addEventListener('input',()=>{state.q=q.value});
    updateSearchUi();
    requestAnimationFrame(()=>q.focus());
  }

  document.getElementById('qrRetry')?.addEventListener('click',()=>{state.error='';render();startQR()});
  const browserLogin=document.getElementById('browserLogin');
  if(browserLogin)browserLogin.onclick=()=>void startSchoolBrowserLogin();
  const nativeLogin=document.getElementById('nativeLogin');if(nativeLogin)nativeLogin.onclick=()=>{state.error='';state.screen='credentials';render();document.getElementById('user')?.focus()};
  const credentialForm=document.getElementById('credentialForm');
  if(credentialForm)credentialForm.addEventListener('submit',async e=>{e.preventDefault();const user=document.getElementById('user')?.value||'',password=document.getElementById('pass')?.value||'';state.error='';if(!user||!password){state.error='Enter your username or email and password.';render();return}const si=document.getElementById('signIn');if(si)si.disabled=true;try{state.auth=await A.loginCredentials({user,password,schoolId:state.school?.id??null});await afterLogin()}catch(e){state.error=e.message||'Login failed.';render()}});

  const drawerContainer=document.getElementById('appDrawerContainer');
  const drawer=document.getElementById('startDrawer');
  const setDrawer=(open)=>{if(drawerContainer)drawerContainer.start=open;if(!open)state.drawerPage=null;syncWindowChrome()};

  hydrateProfileDrawer();updateDrawerBadges();document.getElementById('drawerProfile')?.addEventListener('click',()=>{closeDrawerThen(()=>{state.courseView=null;state.selectedCourse=null;state.assignmentView=null;state.embeddedTitle=null;state.profileUser=state.auth?.user||null;state.profileTab='updates';state.tab='profile';state.toolbarTitle='Profile';render();loadTab()})});
  document.getElementById('drawerBack')?.addEventListener('click',()=>{state.drawerPage=null;render();requestAnimationFrame(()=>{const c=document.getElementById('appDrawerContainer');if(c)c.start=true})});

  document.querySelectorAll('[data-drawer]').forEach(b=>{
    const id=b.dataset.drawer;
    if(id==='courses'||id==='groups'||id==='grades'){
      // M3E owns the submenu toggle. Listen to its public opening/opened and
      // closing/closed events rather than closing the drawer or re-rendering it.
      const openSub=()=>{ state.drawerPage=id; loadCourseSubmenu(); };
      const closeSub=()=>{ if(state.drawerPage===id) state.drawerPage=null; };
      b.addEventListener('opened',openSub);
      b.addEventListener('closed',closeSub);
      return;
    }
    b.addEventListener('click',async()=>{
    closeDrawerThen(async()=>{
      if(id==='logout'){await A.logout();state.auth=null;state.school=null;state.tab='home';state.screen='login';render();return}
      if(id==='settings'){state.settingsPage=null;state.courseView=null;state.selectedCourse=null;state.assignmentView=null;state.currentGroup=null;state.profileUser=null;state.embeddedTitle=null;state.tab='settings';state.toolbarTitle='Settings';state.screen='app';render();loadTab();return}
      if(['home','calendar','grades','messages','notifications','requests','resources','profile','groups'].includes(id)){state.courseView=null;state.selectedCourse=null;state.assignmentView=null;state.currentGroup=null;state.profileUser=null;state.embeddedTitle=null;state.tab=id;state.toolbarTitle=id.charAt(0).toUpperCase()+id.slice(1);state.screen='app';render();loadTab()}
    });
    });
  });

  if(!document.__schoologySplitStylerBound){
    document.__schoologySplitStylerBound=true;
    const syncSplitTrack=e=>{const sp=e.target?.closest?.('m3e-split-pane');if(!sp)return;const v=Number(sp.value);if(Number.isFinite(v)){sp.style.setProperty('--schoology-split-track-position',`${v}%`);sp.style.setProperty('--schoology-split-position',`${v}%`);}};
    document.addEventListener('input',syncSplitTrack,{passive:true});
    document.addEventListener('change',syncSplitTrack,{passive:true});
  }
  document.querySelectorAll('m3e-split-pane').forEach(sp=>{const v=Number(sp.value);if(Number.isFinite(v)){sp.style.setProperty('--schoology-split-track-position',`${v}%`);sp.style.setProperty('--schoology-split-position',`${v}%`)}});
  document.querySelectorAll('[data-home-tab]').forEach(b=>b.onclick=()=>{const root=b.closest('.homeTabViewport')||document;const order=['recent','dashboard','upcoming'];const oldIndex=order.indexOf(state.homeTab),newIndex=order.indexOf(b.dataset.homeTab);state.homeTabDirection=newIndex>=oldIndex?'forward':'back';state.homeTab=b.dataset.homeTab;syncM3eTabSelection(root,'homeTab',state.homeTab);loadHomeTab()});
  document.getElementById('messageBack')?.addEventListener('click',()=>{state.message=null;state.messageThread=null;render();loadTab()});
  document.querySelectorAll('[data-download-url]').forEach(b=>b.onclick=async()=>{try{const r=await downloadWithFeedback(b,{url:b.dataset.downloadUrl,filename:b.dataset.downloadName,mime:b.dataset.downloadMime});const err=await A.openDownloadedFile({path:r.path});if(err)alert(err)}catch(e){alert('Unable to open file: '+e.message)}});
  document.querySelectorAll('[data-open-url]').forEach(b=>b.onclick=()=>openWithPressTransition(b,()=>showEmbeddedWeb(b.dataset.openUrl,'Link')));
  document.querySelectorAll('[data-embed-html]').forEach(b=>b.onclick=()=>showEmbeddedWeb('data:text/html;charset=utf-8,'+encodeURIComponent(b.dataset.embedHtml),'Embedded content'));
  document.querySelectorAll('[data-course-sub]').forEach(b=>b.onclick=()=>{const i=+b.dataset.courseSub;const c=window.__schoologyCourses?.[i];state.drawerPage=null;state.tab='courses';state.courseView='course';state.toolbarTitle=sectionTitleOf(c)||courseTitleOf(c);state.screen='app';render();showCourse(c)});
}
function directoryIsPublic(user){
 const objects=[user,user?.user_permissions,user?.userPermissions,user?.permissions,user?.user?.user_permissions,user?.user?.userPermissions,user?.user?.permissions].filter(Boolean);
 const truthy=v=>v===true||v===1||String(v??'').toLowerCase()==='true'||String(v??'')==='1';
 return objects.some(o=>['is_directory_public','directory_public','isDirectoryPublic','directoryPublic'].some(key=>Object.prototype.hasOwnProperty.call(o,key)&&truthy(o[key])));
}
async function resolvePeopleDrawerVisibility(){
 const uid=state.auth?.userId||state.auth?.user?.id;let user=state.auth?.user||{};
 try{if(uid){const response=await A.api({path:'users/'+uid,params:{}});user=response?.user||response?.data?.user||response||user;}}catch(e){console.warn('Unable to check School Directory visibility:',e?.message||e)}
 const mobile=state.mobileMe||{};
 const objects=[user,user?.user_permissions,user?.userPermissions,user?.permissions,mobile,mobile?.user,mobile?.user_permissions,mobile?.userPermissions,state.auth,state.auth?.user,state.auth?.user_permissions,state.auth?.userPermissions].filter(Boolean);
 const truthy=v=>v===true||v===1||String(v??'').toLowerCase()==='true'||String(v??'')==='1';
 let enterprise=false;
 for(const o of objects){for(const key of ['is_enterprise_user','isEnterpriseUser','enterprise','is_enterprise','isEnterprise','enterprise_enabled'])if(Object.prototype.hasOwnProperty.call(o,key)&&truthy(o[key]))enterprise=true;for(const key of ['ent_stat','entStat','ENT_STAT'])if(Number(o[key])===573)enterprise=true;}
 state.peopleEnabled=enterprise&&directoryIsPublic(user);
}
let pendingDeepLinkAfterLogin=null;
async function afterLogin(){
  stopQR();
  try{
    const mm=await A.api({path:'mobile/me',params:{}});
    state.mobileMe=mm||{};
    const settings=mm?.settings||{};
    state.courseDashboardEnabled=settings.course_dashboard_enabled===true;
    try{state.windowChromeOverlay=(await A.getWindowChromeMode?.())?.overlay!==false}catch{}
    document.documentElement.dataset.windowControlsOverlay=String(state.windowChromeOverlay);
    state.preferredHomepage=settings.default_start_page==='course_dashboard'?'dashboard':'recent';
    if(state.preferredHomepage==='dashboard'&&!state.courseDashboardEnabled)state.preferredHomepage='recent';
    state.homeTab=state.preferredHomepage;
  }catch(e){
    throw e;
  }
  await resolvePeopleDrawerVisibility();
  state.screen='app';render();await loadTab();
  if(pendingDeepLinkAfterLogin){const pending=pendingDeepLinkAfterLogin;pendingDeepLinkAfterLogin=null;setTimeout(()=>handleIncomingSchoologyDeepLink(pending),0)}
}
async function hydrateCourseImages(root=document){
  const els=root.querySelectorAll?.('[data-course-image-url]')||[];
  await Promise.all([...els].map(async el=>{
    const url=el.getAttribute('data-course-image-url');if(!url)return;
    const fallback=el.parentElement?.querySelector?.('.dashboardCourseFallback,.sectionProfileFallback,.courseAppFallback,.groupImageFallback,.courseImageFallback');
    try{const data=await A.fetchImage(url);if(data){el.src=data;el.style.display='block';if(fallback)fallback.style.setProperty('display','none','important');return}}catch{}
    if(fallback)fallback.style.setProperty('display','flex','important');
  }));
}
async function canJoinByAccessCode(path){
  try{
    const x=await A.api({path:'multioptions',method:'POST',params:{request:[`/v1/${path}`]},json:true});
    const responses=Array.isArray(x?.response)?x.response:(Array.isArray(x?.responses)?x.responses:[]);
    const hasPost=v=>{if(v==null)return false;if(typeof v==='boolean')return v;if(typeof v==='number')return v===1;if(typeof v==='string'){const z=v.trim().toLowerCase();if(z==='true'||z==='1'||z==='post')return true;try{return hasPost(JSON.parse(v))}catch{return false}}if(Array.isArray(v))return v.some(hasPost);if(typeof v==='object')return !!(v.post??v.POST??v.create??v.CREATE)||Object.entries(v).some(([k,val])=>String(k).toLowerCase()==='post'&&hasPost(val));return false};
    return responses.some(r=>{if(Number(r?.response_code??r?.responseCode)===403)return false;let body=r?.body??r?.data??r;try{if(typeof body==='string')body=JSON.parse(body)}catch{}return hasPost(r?.permission_map??r?.permissionMap)||hasPost(body?.permission_map??body?.permissionMap)||hasPost(body?.permissions)||hasPost(body)});
  }catch{return false}
}
async function loadCourseSubmenu(){
 const parent=document.getElementById(`drawer-${state.drawerPage}`);if(!parent)return;
 const page=state.drawerPage;
 parent.setAttribute('open','');
 const replaceSubItems=html=>{
   parent.querySelectorAll(':scope > .drawerSubLoading, :scope > .courseSubItem, :scope > .drawerErrorItem').forEach(el=>el.remove());
   parent.insertAdjacentHTML('beforeend',html);
 };
 const timeout=ms=>new Promise((_,reject)=>setTimeout(()=>reject(new Error('Schoology took too long to load the navigation.')),ms));
 try{
   const uid=state.auth?.userId||state.auth?.user?.id;if(!uid)throw new Error('No logged-in user ID.');
   if(page==='groups'){
     const cached=Array.isArray(window.__schoologyGroups)?window.__schoologyGroups:null;
     const x=cached?{group:cached}:await Promise.race([A.api({path:`users/${uid}/groups`,params:{limit:100}}),timeout(10000)]);
     const arr=x.group||x.groups||[];window.__schoologyGroups=arr;
     replaceSubItems(arr.length?arr.map((g,i)=>{const gi=normalizeImageUrl(g.picture_url||g.pictureUrl||g.picture||g.image||'');return `<m3e-nav-menu-item data-group-sub="${i}"><span slot="icon" class="drawerSubImage">${gi?`<img data-course-image-url="${esc(gi)}" alt="" style="display:none">`:''}${gi?'':`<span>${esc(String(g.name||g.title||'G').charAt(0))}</span>`}</span><span slot="label">${esc(g.name||g.title||'Group')}</span></m3e-nav-menu-item>`}).join(''):'<m3e-nav-menu-item disabled><span slot="label">No groups found.</span></m3e-nav-menu-item>');
     await hydrateCourseImages(parent);
     document.querySelectorAll('[data-group-sub]').forEach(b=>b.onclick=()=>{const g=window.__schoologyGroups[+b.dataset.groupSub];if(!g)return;closeDrawerThen(()=>{state.drawerPage=null;state.tab='groups';state.currentGroup=g;state.toolbarTitle=g?.name||'Group';render();showGroup(g);syncToolbar();});});
     return;
   }
   const cached=Array.isArray(window.__schoologyCourses)?window.__schoologyCourses:null;
   const x=cached?{section:cached}:await Promise.race([A.api({path:`users/${uid}/sections`,params:{limit:100}}),timeout(10000)]);
   const arr=x.section||x.sections||[];window.__schoologyCourses=arr;
   replaceSubItems(arr.length?arr.map((s,i)=>{const courseTitle=s.course_title||s.courseTitle||s.title||s.section_title||'Course';const sectionTitle=s.section_title||s.sectionTitle||'';const image=normalizeImageUrl(s.profile_url||s.profileUrl||s.course_profile_url||s.courseProfileUrl||s.course_theme||s.courseTheme||s.image||s.course_image||'');return `<m3e-nav-menu-item data-course-sub="${i}"><span slot="icon" class="drawerSubImage">${image?`<img data-course-image-url="${esc(image)}" alt="" style="display:none">`:''}${image?'':`<span>${esc(courseTitle.charAt(0)||'C')}</span>`}</span><span slot="label">${esc(sectionTitle?`${courseTitle} — ${sectionTitle}`:courseTitle)}</span></m3e-nav-menu-item>`}).join(''):'<m3e-nav-menu-item disabled><span slot="label">No courses found.</span></m3e-nav-menu-item>');
   document.querySelectorAll('[data-course-sub]').forEach(b=>b.onclick=()=>{const course=window.__schoologyCourses[+b.dataset.courseSub];closeDrawerThen(()=>{state.drawerPage=null;state.tab=page==='grades'?'grades':'courses';state.courseView='course';state.toolbarTitle=sectionTitleOf(course)||courseTitleOf(course);state.screen='app';render();showCourse(course,page==='grades'?'grades':'materials')});});
   await hydrateCourseImages(parent);
 }catch(e){replaceSubItems(`<m3e-nav-menu-item class="drawerErrorItem" disabled><span slot="label">Unable to load ${page==='groups'?'groups':'courses'}.</span><span slot="supporting-text">${esc(e.message||String(e))}</span></m3e-nav-menu-item>`);parent.setAttribute('open','');}
}
function showGradeSection(course){
 state.selectedCourse=course;
 const c=document.getElementById('content');if(!c)return;
 const title=courseTitleOf(course),section=sectionTitleOf(course),sid=course?.id||course?.section_id||course?.sectionId;
 c.innerHTML=`<section class="gradesNativePage"><div class="gradesHeader"><h1>${esc(section||title)}</h1><p>${esc(title)}</p></div><div id="gradesContent" class="gradesContent"><div class="loading"><m3e-circular-progress-indicator indeterminate class="m3eInlineProgress" aria-label="Loading"></m3e-circular-progress-indicator><span>Loading…</span></div></div></section>`;
 (async()=>{try{
   const x=await A.api({path:`sections/${sid}/grades`,params:{}});
   const rows=x.grade||x.grades||x.assignment||x.assignments||[];
   document.getElementById('gradesContent').innerHTML=renderGrades(rows);
 }catch(e){document.getElementById('gradesContent').innerHTML=`<div class="error apiError"><b>Schoology could not load this page.</b><br>${esc(e.message)}</div>`}})();
}

function normalizeImageUrl(value){
  if(!value)return '';
  const s=String(value).trim();
  if(s.startsWith('//'))return 'https:'+s;
  if(s.startsWith('http://'))return s.replace(/^http:/,'https:');
  if(s.startsWith('/'))return 'https://app.schoology.com'+s;
  return s;
}
function normalizeSchoologyWebUrl(value){
  if(!value)return '';
  let s=String(value).trim();
  if(!s)return '';
  if(s.startsWith('//'))return 'https:'+s;
  if(/^https?:\/\//i.test(s))return s;
  if(s.startsWith('/'))return 'https://app.schoology.com'+s;
  return 'https://'+s;
}
async function resolveCourseSchoolName(course){
  const sid=course?.id??course?.section_id??course?.sectionId;
  let schoolId=course?.school_id??course?.schoolId;
  try{
    if(sid){const sx=await A.api({path:`sections/${sid}`,params:{}});const section=sx?.section||sx;schoolId=section?.school_id??section?.schoolId??schoolId;}
    if(!schoolId)return '';
    const x=await A.api({path:`schools/${schoolId}`,params:{}});const school=x?.school||x;return String(school?.title||school?.name||'');
  }catch{return ''}
}
function courseTitleOf(course){return course?.course_title||course?.courseTitle||course?.title||course?.section_title||'Course'}
function sectionTitleOf(course){return course?.section_title||course?.sectionTitle||''}
function openProfileById(id,name='Profile'){
  const uid=Number(id); if(!uid)return;
  const returnGroup=state.currentGroup;
  state.profileReturn={tab:state.tab,homeTab:state.homeTab,group:returnGroup,groupTab:state.groupTab||'updates',course:state.selectedCourse,courseTab:state.courseTab||'materials',title:state.toolbarTitle||'Home'};
  state.profileUser={id:uid}; state.profileTab='updates'; state.tab='profile'; state.toolbarTitle='Profile';
  state.assignmentView=null; state.embeddedTitle=null; state.embeddedTheme=''; state.currentGroup=null; state.courseView=null; state.selectedCourse=null;
  render(); loadTab();
}
function syncToolbar(){
  const bar=document.getElementById('mainAppBar');if(!bar)return;
  const needs=!!(state.assignmentView||state.embeddedTitle||state.resourceCollection||state.profileReturn) && !(state.courseView && !state.assignmentView && !state.embeddedTitle);
  if(needs){
    bar.querySelector('#menuButton')?.remove();
    if(!bar.querySelector('#toolbarBack')){const b=document.createElement('m3e-icon-button');b.id='toolbarBack';b.setAttribute('slot','leading');b.setAttribute('aria-label','Back');b.innerHTML='<span class="m3eOriginalIcon">'+originalM3Icon('arrow_back')+'</span>';b.addEventListener('click',navigateBack);bar.insertBefore(b,bar.firstChild);}
  }else{
    bar.querySelector('#toolbarBack')?.remove();
    if(!bar.querySelector('#menuButton')){const b=document.createElement('m3e-icon-button');b.id='menuButton';b.setAttribute('slot','leading');b.setAttribute('aria-label','Navigation menu');b.setAttribute('toggle','');b.innerHTML='<m3e-drawer-toggle for="startDrawer"></m3e-drawer-toggle><span class="m3eOriginalIcon">'+originalM3Icon('menu')+'</span><span class="m3eOriginalIcon" slot="selected">'+originalM3Icon('menu_open')+'</span>';bar.insertBefore(b,bar.firstChild);}
  }
  const title=bar.querySelector('.toolbarTitle');if(title)title.textContent=state.toolbarTitle||'Home';bar.classList.toggle('toolbarAccountInfo',state.embeddedTheme==='account');bar.classList.toggle('toolbarLti',state.embeddedTheme==='lti');
  const barActions=bar.querySelectorAll('[data-toolbar-action]');barActions.forEach(el=>el.remove());
  if(state.embeddedTitle && state.embeddedTheme!=='quiz' && state.embeddedTheme!=='school-profile'){
    const reload=document.createElement('m3e-icon-button');reload.id='embeddedReload';reload.setAttribute('slot','trailing');reload.setAttribute('data-toolbar-action','');reload.setAttribute('aria-label','Reload');reload.innerHTML=`<span class="m3eOriginalIcon">${originalM3Icon('refresh')}</span>`;reload.addEventListener('click',()=>{const w=document.getElementById('schoologyWebview');try{w?.reload()}catch{}});bar.appendChild(reload);
    if(state.embeddedCanOpenExternal){const open=document.createElement('m3e-icon-button');open.id='embeddedOpenBrowser';open.setAttribute('slot','trailing');open.setAttribute('data-toolbar-action','');open.setAttribute('aria-label','Open in browser');open.title='Open in browser';open.innerHTML=`<span class="m3eOriginalIcon">${officialOrAssetIcon('ic_external_tool.png','')}</span>`;open.addEventListener('click',()=>{const w=document.getElementById('schoologyWebview');const u=normalizeSchoologyWebUrl(w?.getURL?.()||'');if(u)A.openExternal(u).catch(e=>{console.warn('External browser failed:',e);showEmbeddedWeb(u,state.embeddedTitle||'Link',{allowBrowser:false})})});bar.appendChild(open)}
  }
  const slot=document.getElementById('floatingActionSlot');if(!slot)return;
  slot.innerHTML='';
  if(state.tab==='home'&&!state.courseView&&!state.assignmentView&&!state.embeddedTitle){
    slot.innerHTML=`<m3e-fab id="homeCreatePlus" variant="primary-container" aria-label="Create"><m3e-fab-menu-trigger for="homeCreateMenu"><m3e-icon name="add" variant="outlined"></m3e-icon><m3e-icon slot="close-icon" name="close" variant="outlined"></m3e-icon></m3e-fab-menu-trigger></m3e-fab>`;
    showHomeCreateMenu();
    return;
  }
  if(state.tab==='calendar'&&!state.courseView&&!state.embeddedTitle){if(state.calendarCanCreate){slot.innerHTML=`<m3e-fab id="calendarCreatePlus" variant="primary-container" aria-label="Create event"><m3e-icon name="add" variant="outlined"></m3e-icon></m3e-fab>`;document.getElementById('calendarCreatePlus')?.addEventListener('click',()=>showCreatePostDialog('event','',null));}return;}
  if(state.eventView){
    slot.innerHTML=`<m3e-fab id="eventCommentPlus" variant="primary-container" aria-label="Post comment"><m3e-icon name="add" variant="outlined"></m3e-icon></m3e-fab>`;
    document.getElementById('eventCommentPlus')?.addEventListener('click',()=>openNativeCommentComposer('event',state.eventView));return;
  }
  if(state.discussionView){
    if(state.discussionView.tab==='comments'){
      slot.innerHTML=`<m3e-fab id="discussionCommentPlus" variant="primary-container" aria-label="Post comment"><m3e-icon name="add" variant="outlined"></m3e-icon></m3e-fab>`;
      document.getElementById('discussionCommentPlus')?.addEventListener('click',()=>openNativeCommentComposer('discussion',state.discussionView));
    }
    return;
  }
  if(state.albumView){ return; }
  if(state.assignmentView&&state.assignmentLandscape&&!state.assignmentSubpage&&(state.assignmentTab==='info'||state.assignmentTab==='comments')){
    if(state.assignmentAllowComments||state.assignmentCanSubmit){
      slot.innerHTML=`<m3e-fab id="assignmentPlus" variant="primary-container" aria-label="Assignment actions" title="Assignment actions"><m3e-icon name="add" variant="outlined"></m3e-icon></m3e-fab>`;
      document.getElementById('assignmentPlus')?.addEventListener('click',()=>{if(state.assignmentCanSubmit)showAssignmentActionMenu();else openAssignmentCommentComposer(state.assignmentView.sectionId,state.assignmentView.assignmentId,'0')});
    }
  }else if(state.assignmentView&&state.assignmentTab==='comments'&&!state.assignmentSubpage){
    slot.innerHTML=`<m3e-fab id="assignmentPlus" variant="primary-container" aria-label="Post comment" title="Post comment"><m3e-icon name="add" variant="outlined"></m3e-icon></m3e-fab>`;
    document.getElementById('assignmentPlus')?.addEventListener('click',()=>openAssignmentCommentComposer(state.assignmentView.sectionId,state.assignmentView.assignmentId,'0'));
  }else if(state.assignmentView&&state.assignmentCanSubmit&&state.assignmentTab==='submit'&&!state.assignmentIsTeacher&&!state.assignmentSubpage){
    slot.innerHTML='<m3e-fab id="assignmentPlus" variant="primary-container" aria-label="Submit assignment" title="Submit assignment">'+originalM3Icon('add')+'</m3e-fab>';
    document.getElementById('assignmentPlus')?.addEventListener('click',showSubmissionMenu,{once:true});
  }else if(state.assignmentView&&state.assignmentIsTeacher&&state.assignmentSubpage==='teacherSubmission'){
    slot.innerHTML=`<m3e-icon-button id="assignmentSaveGrade" aria-label="Save grade"><span class="m3eOriginalIcon">${officialOrAssetIcon('ic_action_post_checkmark_divider.png','Save')}</span></m3e-icon-button>`;
    document.getElementById('assignmentSaveGrade')?.addEventListener('click',()=>document.getElementById('saveTeacherGrade')?.click());
  }else if(state.currentGroup&&state.tab==='groups'&&!state.embeddedTitle&&!state.assignmentView){
    const gid=state.currentGroup.id||state.currentGroup.group_id;
    if(state.groupTab==='updates'&&state.groupCanPostUpdates){slot.innerHTML='<m3e-fab id="groupUpdateCreatePlus" variant="primary-container" aria-label="Post update"><m3e-icon name="add" variant="outlined"></m3e-icon></m3e-fab>';document.getElementById('groupUpdateCreatePlus')?.addEventListener('click',()=>{if(gid)openGroupUpdateComposer(gid)})}
    else if(state.groupTab==='discussions'&&state.groupCanCreateDiscussion){slot.innerHTML='<m3e-fab id="groupDiscussionCreatePlus" variant="primary-container" aria-label="Create discussion"><m3e-icon name="add" variant="outlined"></m3e-icon></m3e-fab>';document.getElementById('groupDiscussionCreatePlus')?.addEventListener('click',()=>{if(gid)showCreatePostDialog('discussion','groups',gid)})}
  }else if(state.courseView&&!state.assignmentView&&!state.embeddedTitle&&!state.currentGroup&&!state.profileUser&&state.courseTab==='updates'&&state.courseCanPostUpdates){
    slot.innerHTML=`<m3e-fab id="courseUpdatePlus" variant="primary-container" aria-label="Post update"><m3e-icon name="add" variant="outlined"></m3e-icon></m3e-fab>`;
    document.getElementById('courseUpdatePlus')?.addEventListener('click',()=>state.selectedCourse&&openCourseUpdateComposer(state.selectedCourse));
  }else if(state.courseView&&!state.assignmentView&&!state.embeddedTitle&&!state.currentGroup&&!state.profileUser&&state.courseTab==='materials'){
  }else if(state.tab==='messages'&&!state.courseView&&!state.embeddedTitle&&!state.message){
    slot.innerHTML=`<m3e-fab id="composeMessage" variant="primary-container" aria-label="Compose message"><m3e-icon name="add" variant="outlined"></m3e-icon></m3e-fab>`;
    document.getElementById('composeMessage')?.addEventListener('click',()=>showComposeMessage());document.getElementById('joinGroup')?.addEventListener('click',showJoinGroupDialog);
  }
}

function navigateBack(){
  if(state.settingsPage==='theme'){state.settingsPage=null;state.toolbarTitle='Settings';render();loadTab();return;}
  const commentDialog=document.getElementById('assignmentCommentDialog');
  if(commentDialog){commentDialog.remove();state.assignmentSubpage=null;syncToolbar();return}
  document.getElementById('assignmentActionMenu')?.remove();
  if(state.composeMessage){state.composeMessage=false;state.toolbarTitle='Messages';state.tab='messages';state.message=null;state.messageThread=null;render();loadTab();return}
  if(state.assignmentView){
    if(state.assignmentSubpage){
      state.assignmentSubpage=null; state.toolbarTitle=state.assignmentTab==='comments'?'Comments':'Assignment'; syncToolbar();
      if(state.assignmentTab==='comments')openAssignmentComments(state.assignmentView.sectionId,state.assignmentView.assignmentId,state.assignmentData||{}); else openAssignmentSubmissions(state.assignmentView.sectionId,state.assignmentView.assignmentId,state.assignmentData||{},state.assignmentIsTeacher);
      return;
    }
    state.assignmentView=null;state.assignmentCanSubmit=false;state.assignmentIsTeacher=false;state.assignmentAllowComments=false;state.assignmentLandscape=false;state.assignmentSubpage=null;state.assignmentData=null;state.assignmentEnrollmentId=null;state.assignmentTab='info';state.submissionMenu=false;state.embeddedTitle=null;state.profileUser=null;
    syncToolbar();
    if(state.homeUpcomingReturn){state.homeUpcomingReturn=false;state.courseView=null;state.selectedCourse=null;state.tab='home';state.homeTab=state.preferredHomepage||'recent';state.toolbarTitle='Home';render();loadTab();return;}
    if(state.selectedCourse){showCourse(state.selectedCourse,state.courseTab||'materials');}
    else {state.toolbarTitle='Home';state.courseView=null;render();loadTab();}
    return;
  }
  if(state.profileUser&&state.profileReturn){
    const ret=state.profileReturn;state.profileUser=null;state.profileReturn=null;state.tab=ret.tab||'home';state.homeTab=ret.homeTab||state.homeTab;state.toolbarTitle=ret.title||'Home';
    if(ret.course){state.selectedCourse=ret.course;state.courseView='course';showCourse(ret.course,ret.courseTab||'materials');return;}
    if(ret.group){state.currentGroup=ret.group;state.groupTab=ret.groupTab||'updates';showGroup(ret.group,state.groupTab);return;}
    render();loadTab();return;
  }
  if(state.resourceCollection){
    state.resourceCollection=null;state.toolbarTitle='Resources';state.tab='resources';
    render();loadResourcesHome(document.getElementById('content'));return;
  }
  if(state.eventView||state.discussionView||state.albumView){
    const ret=state.embeddedReturn;
    state.eventView=null;state.discussionView=null;state.albumView=null;state.embeddedTitle=null;state.embeddedTheme='';state.embeddedReturn=null;
    if(ret?.group){state.currentGroup=ret.group;state.groupTab=ret.groupTab||'updates';state.tab='groups';state.toolbarTitle=ret.group.name||ret.title||'Group';showGroup(ret.group,state.groupTab);return;}
    state.tab=ret?.tab||'home';state.homeTab=ret?.homeTab||state.homeTab;state.toolbarTitle=ret?.title||'Home';render();loadTab();return;
  }
  if(state.embeddedTitle){
    const ret=state.embeddedReturn;
    state.embeddedTitle=null; state.embeddedTheme=''; state.embeddedReturn=null;
    if(ret){if(ret.group){state.currentGroup=ret.group;state.groupTab=ret.groupTab||'updates';state.tab='groups';state.toolbarTitle=ret.group.name||ret.title||'Group';showGroup(ret.group,state.groupTab);return;}if(ret.course){state.tab=ret.tab||'courses';state.homeTab=ret.homeTab||state.homeTab;state.currentGroup=null;state.selectedCourse=ret.course;state.courseView=ret.courseView||'course';state.toolbarTitle=ret.title||courseTitleOf(ret.course)||'Course';showCourse(ret.course,ret.courseTab||'materials');return;}state.tab=ret.tab||'home';state.homeTab=ret.homeTab||state.homeTab;state.homeUpcomingReturn=!!ret.homeUpcomingReturn;state.toolbarTitle=ret.title||'Home';state.courseView=null;state.selectedCourse=null;state.currentGroup=null;state.profileUser=null;render();loadTab();return;}
    syncToolbar();
    if(state.selectedCourse){showCourse(state.selectedCourse,state.courseTab||'materials');}
    else if(state.currentGroup){showGroup(state.currentGroup,state.groupTab||'updates');}
    else {state.toolbarTitle='Home';render();loadTab();}
    return;
  }
  if(state.folderStack.length){
    state.folderStack.pop();
    const prev=state.folderStack[state.folderStack.length-1];
    state.currentFolderId=prev?.id||0;
    syncToolbar();
    if(state.selectedCourse)loadFolder(state.selectedCourse,state.currentFolderId,false,prev?.title||'Materials');
    return;
  }
  if(state.currentGroup){
    state.currentGroup=null;state.groupTab='updates';state.toolbarTitle='Groups';syncToolbar();render();loadTab();return;
  }
  if(state.profileUser){
    state.profileUser=null;state.profileTab='updates';state.toolbarTitle='Profile';syncToolbar();render();loadTab();return;
  }
  if(state.courseView){
    state.courseView=null;state.selectedCourse=null;
    state.toolbarTitle=state.tab==='home'?'Home':'Home';state.tab='home';state.homeTab=state.preferredHomepage||'recent';
    render();loadTab();
  }
}
async function getCourseNavigationPermissions(sectionId,userId){
 if(!sectionId||!userId)throw new Error('Missing course/user ID');
 const request=['/v1/sections/'+sectionId+'/grades','/v1/users/'+userId+'/grades','/v1/sections/'+sectionId+'/attendance','/v1/sections/'+sectionId+'/updates'];
 const x=await A.api({path:'multioptions',method:'POST',params:{request}});
 const list=Array.isArray(x?.response)?x.response:(Array.isArray(x?.responses)?x.responses:[]);
 const by={};for(const row of list){if(!row?.location)continue;let body=row.body??'';by[String(row.location)]=(typeof body==='string'?body:JSON.stringify(body)).toLowerCase()}
 const sectionGradeBody=by['/v1/sections/'+sectionId+'/grades']||'',userGradeBody=by['/v1/users/'+userId+'/grades']||'',attendanceBody=by['/v1/sections/'+sectionId+'/attendance']||'',updatesBody=by['/v1/sections/'+sectionId+'/updates']||'';
 const sectionUpdatesPost=/\bpost\b/i.test(updatesBody);
 if(state.courseView==='course'&&String(state.selectedCourse?.id||state.selectedCourse?.section_id||state.selectedCourse?.sectionId)===String(sectionId)){state.courseCanPostUpdates=sectionUpdatesPost;syncToolbar()}
 return {sectionGradesPut:sectionGradeBody.includes('put'),userGradesGet:userGradeBody.includes('get'),attendanceGet:attendanceBody.includes('get'),sectionUpdatesPost};
}

function schoologyNavIcon(name){
 const paths={materials:'<path d="M3 5h7l2 2h9v12H3z"/><path d="M3 9h18"/>',updates:'<path d="M4 12a8 8 0 0 1 14-5l2 2"/><path d="M20 4v5h-5"/><path d="M20 12a8 8 0 0 1-14 5l-2-2"/><path d="M4 20v-5h5"/>',members:'<circle cx="9" cy="8" r="3"/><path d="M3 20v-1a6 6 0 0 1 12 0v1"/><path d="M17 5a3 3 0 0 1 0 6"/><path d="M18 14a5 5 0 0 1 3 5v1"/>',grades:'<path d="M4 4h16v16H4z"/><path d="m7 12 3 3 7-7"/>',upcoming:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/>',discussions:'<path d="M4 5h16v12H9l-5 4z"/><path d="M8 9h8M8 13h5"/>',albums:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="1.5"/><path d="m21 15-5-5L5 21"/>',resources:'<path d="M3 6h7l2 2h9v12H3z"/><path d="M3 10h18"/>',info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7h.01"/>',apps:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'};
 return '<svg class="schoologyNavSvg" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+(paths[name]||paths.materials)+'</svg>';
}

async function showCourse(course,activeTab='materials',forceRebuild=false){
 const c=document.getElementById('content');if(!c)return;
 const renderToken=++courseRenderToken;
 if(!course){loadTab();return}
 const sid=course.id||course.section_id||course.sectionId;
 const sameCourse=!forceRebuild&&state.courseView==='course'&&state.selectedCourse&&String(state.selectedCourse.id||state.selectedCourse.section_id||state.selectedCourse.sectionId)===String(sid)&&!!c.querySelector('.courseLandscapePage');
 // Android keeps the SectionProfilePagerFragment alive while switching tabs. Only
 // replace the tab content; the apps/upcoming split and course header remain mounted.
 if(sameCourse){
   const tab=activeTab;
   const buttons=[...c.querySelectorAll('[data-course-tab]')];
   const target=buttons.find(b=>b.dataset.courseTab===tab);
   if(target){buttons.forEach(b=>b.removeAttribute('active'));syncM3eTabSelection(document.getElementById('content'),'courseTab',tab);}
   state.courseTab=tab;state.toolbarTitle=sectionTitleOf(course)||courseTitleOf(course);state.folderStack=[];state.currentFolderId=0;state.assignmentView=null;state.embeddedTitle=null;syncToolbar();
   const tabContent=document.getElementById('sectionProfileContent');
   if(tabContent)tabContent.innerHTML='<div class="loading courseTabLoading"><m3e-circular-progress-indicator indeterminate class="m3eInlineProgress" aria-label="Loading"></m3e-circular-progress-indicator><span>Loading…</span></div>';
   await loadCourseTab(course,tab).catch(e=>{const el=document.getElementById('sectionProfileContent');if(el)el.innerHTML=`<div class="error apiError"><b>Schoology could not load this page.</b><br>${esc(e.message)}</div>`});
   return;
 }
 state.courseCanPostUpdates=false;state.selectedCourse=course;state.courseView='course';state.courseTab=activeTab;state.folderStack=[];state.currentFolderId=0;state.assignmentView=null;state.embeddedTitle=null;
 state.toolbarTitle=sectionTitleOf(course)||courseTitleOf(course);syncToolbar();
 const title=courseTitleOf(course), section=sectionTitleOf(course);
 const image=normalizeImageUrl(course.profile_url||course.profileUrl||course.course_profile_url||course.courseProfileUrl||course.course_theme||course.courseTheme||course.image||course.course_image||'');
 const landscape=window.matchMedia('(min-width: 801px)').matches;
 // Mount the Android-like course shell immediately. Network-dependent metadata and
 // permissions are hydrated after the page is visible so slow connections show the
 // native loading indicators instead of blocking navigation.
 const initialTabs=[['materials','Materials'],['updates','Updates'],['members','Members'],...(landscape?[]:[['upcoming','Upcoming'],['courseapp','Course App']]),['grades','Grades'],['attendance','Attendance']];
 let effectiveTab=activeTab;
 if(landscape&&effectiveTab==='upcoming')effectiveTab='materials';
 
 state.courseTab=effectiveTab;
 const courseTabsMarkup=tabs=>tabs.map(([id,label])=>`<m3e-tab class="sectionProfileTab" data-course-tab="${id}" ${effectiveTab===id?'selected':''}>${label}</m3e-tab>`).join('');
 const courseSidebarMarkup=tabs=>tabs.map(([id,label])=>`<m3e-list-action class="courseSidebarNavItem ${effectiveTab===id?'courseSidebarActive':''}" data-course-tab="${id}" tabindex="0"><span slot="leading" class="m3eOriginalIcon" aria-hidden="true">${schoologyNavIcon(id==='courseapp'?'apps':id==='gradebook'?'grades':id==='attendance'?'upcoming':id)}</span><span>${esc(label)}</span></m3e-list-action>`).join('');
 const courseLandscapeMarkup=`<m3e-split-pane orientation="horizontal" class="courseOuterSplit" data-persist-key="courses-outer" value="73" min="25" max="90" step="1" label="Resize course content and upcoming">
    <m3e-split-pane slot="start" orientation="horizontal" class="courseInnerSplit" data-persist-key="courses-apps" value="20" min="12" max="40" step="1" label="Resize course navigation and content">
     <aside slot="start" class="courseAppsSidePane courseInfoSidePane">
      <div class="courseLandscapeImage"><img class="sectionProfileImage" data-course-image-url="${esc(image)}" style="display:${image?'block':'none'}" alt=""><span class="sectionProfileFallback" style="display:${image?'none':'flex'}">${esc(title.charAt(0)||'C')}</span></div>
      <m3e-action-list variant="segmented" class="upcomingSegmentedList courseSidebarSegmentedList">${courseSidebarMarkup(initialTabs)}</m3e-action-list>
     </aside>
     <section slot="end" class="courseMainPane">
      <div class="sectionProfileHeader courseIdentityCard courseIdentityMainInfo"><div class="courseIdentityImageWrap"><img class="sectionProfileImage" data-course-image-url="${esc(image)}" style="display:none" alt=""><span class="sectionProfileFallback" style="display:${image?'none':'flex'}">${esc(title.charAt(0)||'C')}</span></div><div class="courseIdentityInfoBar"><div class="sectionProfileTitle">${esc(title)}</div><div class="sectionProfileSubtitle">${esc(section||'')}</div><span class="courseSchoolLoading" aria-hidden="true"></span></div></div>
      <div class="sectionProfileRule"></div>
      <div id="sectionProfileContent" class="sectionProfileContent tabSlidePage"><div class="loading"><m3e-circular-progress-indicator indeterminate class="m3eInlineProgress" aria-label="Loading"></m3e-circular-progress-indicator><span>Loading…</span></div></div>
     </section>
    </m3e-split-pane>
    <aside slot="end" id="courseUpcomingPane" class="courseUpcomingPane"><div class="homePaneHeader">Upcoming</div><div id="courseUpcomingContent" class="courseUpcomingContent"><div class="loading"><m3e-circular-progress-indicator indeterminate class="m3eInlineProgress" aria-label="Loading"></m3e-circular-progress-indicator><span>Loading…</span></div></div></aside>
   </m3e-split-pane>`;
 const coursePortraitMarkup=`<div class="coursePortraitLayout">
   <section class="courseMainPane">
    <div class="sectionProfileTabs"><m3e-tabs variant="secondary" class="m3eSchoologyTabs courseTabsM3e">${courseTabsMarkup(initialTabs)}</m3e-tabs></div>
    <div class="sectionProfileHeader courseIdentityCard"><div class="courseIdentityImageWrap"><img class="sectionProfileImage" data-course-image-url="${esc(image)}" style="display:none" alt=""><span class="sectionProfileFallback" style="display:${image?'none':'flex'}">${esc(title.charAt(0)||'C')}</span></div><div class="courseIdentityInfoBar"><div class="sectionProfileTitle">${esc(title)}</div><div class="sectionProfileSubtitle">${esc(section||'')}</div><span class="courseSchoolLoading" aria-hidden="true"></span></div></div>
    <div class="sectionProfileRule"></div>
    <div id="sectionProfileContent" class="sectionProfileContent tabSlidePage"><div class="loading"><m3e-circular-progress-indicator indeterminate class="m3eInlineProgress" aria-label="Loading"></m3e-circular-progress-indicator><span>Loading…</span></div></div>
   </section>
  </div>`;
 c.innerHTML=`<section class="sectionProfilePage courseLandscapePage">${landscape?courseLandscapeMarkup:coursePortraitMarkup}</section>`;
 const schoolButton=document.querySelector('[data-course-school-id]');if(schoolButton)schoolButton.onclick=()=>{const id=Number(schoolButton.getAttribute('data-course-school-id')||0);if(id)openSchoolProfile(id,schoolButton.textContent||'School')};
 hydrateCourseImages(c);
 const bindCourseTabs=()=>document.querySelectorAll('[data-course-tab]').forEach(b=>b.onclick=()=>{
   const id=b.dataset.courseTab;state.courseTab=id;state.toolbarTitle=sectionTitleOf(course)||courseTitleOf(course);
   syncM3eTabSelection(document.getElementById('content'),'courseTab',id);
   state.folderStack=[];state.currentFolderId=0;syncToolbar();
   const tabContent=document.getElementById('sectionProfileContent');
   if(tabContent)tabContent.innerHTML='<div class="loading courseTabLoading"><m3e-circular-progress-indicator indeterminate class="m3eInlineProgress" aria-label="Loading"></m3e-circular-progress-indicator><span>Loading…</span></div>';
   loadCourseTab(course,id).catch(e=>{const el=document.getElementById('sectionProfileContent');if(el)el.innerHTML=`<div class="error apiError"><b>Schoology could not load this page.</b><br>${esc(e.message)}</div>`});
 });
 bindCourseTabs();
 installCourseLayoutWatcher();
 void (async()=>{
   const [sectionDetail,schoolFromList,navPerms]=await Promise.all([
     A.api({path:`sections/${sid}`,params:{}}).catch(()=>course),
     resolveCourseSchoolName(course),
     getCourseNavigationPermissions(sid,state.auth?.userId||state.auth?.user?.id).catch(()=>null)
   ]);
   const school=await resolveCourseSchoolName(sectionDetail||course)||schoolFromList;
   if(renderToken!==courseRenderToken||state.screen!=='app'||state.courseView!=='course'||state.selectedCourse!==course)return;
   const canGradebook=!!navPerms?.sectionGradesPut, canGrades=!!navPerms?.userGradesGet, attendanceEnabled=!!navPerms?.attendanceGet;
   const tabs=[['materials','Materials'],['updates','Updates'],['members','Members'],...(landscape?[]:[['upcoming','Upcoming'],['courseapp','Course App']]),...(canGradebook?[['gradebook','Gradebook']]:canGrades?[['grades','Grades']]:[]),...(attendanceEnabled?[['attendance','Attendance']]:[])];
   effectiveTab=activeTab;
   if(effectiveTab==='grades'&&canGradebook)effectiveTab='gradebook';
   if(effectiveTab==='gradebook'&&!canGradebook)effectiveTab='grades';
   if(effectiveTab==='attendance'&&!attendanceEnabled)effectiveTab='materials';
   if(landscape&&effectiveTab==='upcoming')effectiveTab='materials';
   
   state.courseTab=effectiveTab;
   const tabsHost=landscape?c.querySelector('.courseSidebarSegmentedList'):c.querySelector('.courseTabsM3e');
   if(tabsHost){tabsHost.innerHTML=landscape?courseSidebarMarkup(tabs):courseTabsMarkup(tabs);bindCourseTabs();syncM3eTabSelection(document.getElementById('content'),'courseTab',effectiveTab);}
   const info=c.querySelector('.courseIdentityInfoBar');
   const loadingSchool=info?.querySelector('.courseSchoolLoading');
   if(loadingSchool){loadingSchool.outerHTML=school?`<button class="courseSchoolLink" data-course-school-id="${esc(sectionDetail?.school_id??sectionDetail?.schoolId??course?.school_id??course?.schoolId??'')}" type="button">${esc(school)}</button>`:'';const infoSchoolButton=info?.querySelector('[data-course-school-id]');if(infoSchoolButton)infoSchoolButton.onclick=()=>{const id=Number(infoSchoolButton.getAttribute('data-course-school-id')||0);if(id)openSchoolProfile(id,infoSchoolButton.textContent||'School')};}
   loadCourseTab(course,effectiveTab).catch(e=>{const el=document.getElementById('sectionProfileContent');if(el)el.innerHTML=`<div class="error apiError"><b>Schoology could not load this page.</b><br>${esc(e.message)}</div>`});
   if(landscape)loadCourseApps(course,document.querySelector('.courseSidebarSegmentedList')).catch(e=>{const nav=document.querySelector('.courseSidebarSegmentedList');if(nav)nav.insertAdjacentHTML('beforeend',`<div class="error apiError">${esc(e.message)}</div>`)});
   if(landscape)loadCourseUpcomingPane(course).catch(e=>{const el=document.getElementById('courseUpcomingContent');if(el)el.innerHTML=`<div class="error apiError">${esc(e.message)}</div>`});
 })();
}
function collectAssignmentAttachments(a){
  const out=[],seen=new Set();
  const add=(kind,v)=>{if(!v||typeof v!=='object')return;const id=String(v.id||v.file_id||v.fileId||v.link_id||v.linkId||v.url||v.href||v.title||'');const key=kind+':'+id;if(seen.has(key))return;seen.add(key);out.push({kind,...v});};
  const walk=v=>{if(!v)return;if(Array.isArray(v)){v.forEach(walk);return}if(typeof v!=='object')return;
    const files=v.files?.file||v.files?.list||v.files||v.file; if(files){for(const f of (Array.isArray(files)?files:(files.file||files.list||[files])))add('file',f)}
    const links=v.links?.link||v.links||v.link; if(links){for(const l of (Array.isArray(links)?links:(links.link||links.list||[links])))add('link',l)}
    const videos=v.videos?.video||v.videos||v.video; if(videos){for(const x of (Array.isArray(videos)?videos:(videos.video||videos.list||[videos])))add('video',x)}
    const embeds=v.embeds?.embed||v.embeds||v.embed; if(embeds){for(const x of (Array.isArray(embeds)?embeds:(embeds.embed||embeds.list||[embeds])))add('embed',x)}
    const t=String(v.type||v.attachmentType||'').toLowerCase();if(t==='file'||v.download_path||v.downloadPath||v.resolveDownloadUrl)add('file',v);if(t==='link'||v.linkURL||v.linkUrl)add('link',v);
    for(const k of ['attachment','attachments','files','links','videos','embeds','file','link','video','embed'])if(v[k]&&v[k]!==a)walk(v[k]);
  };walk(a);return out;
}
async function openAssignmentAttachmentItem(item,button,dialog){
  try{
    if(item.kind==='file'){
      const url=item.resolveDownloadUrl||item.resolve_download_url||item.converted_download_path||item.convertedDownloadPath||item.download_path||item.downloadPath||item.url;
      if(!url)throw new Error('Schoology did not provide a file URL.');
      const filename=item.filename||item.fileName||item.title||'Schoology file',mime=item.filemime||item.fileMIME||item.mime||'application/octet-stream';
      const viewUrl=item.file_converted_download_url||item.fileConvertedDownloadURL||item.converted_download_path||item.convertedDownloadPath||item.converted_url||item.convertedUrl||item.convertedDownloadURL||'';
      const info={url,viewUrl,filename,mime,displayFilename:filename};
      const download=async()=>{const result=await downloadWithFeedback(button,{url,filename,mime});const error=await A.openDownloadedFile({path:result.path});if(error)throw new Error(error)};
      if(isPdfAttachment(info)||isImageAttachment(info)||isOfficeAttachment(info)){dialog?.remove();showPdfAttachmentOptions(info,download);return}
      await download();dialog.remove();
    }else if(item.kind==='link'||item.kind==='video'){
      const url=item.url||item.linkURL||item.linkUrl||item.link_url||item.href||item.videoURL||item.videoUrl||item.video_url;
      if(!url)throw new Error('Schoology did not provide a link URL.');
      dialog.remove();
      if(await routeSchoologyLink(url))return;
      await A.prepareWebSession();showEmbeddedWeb(url,item.linkTitle||item.title||item.videoTitle||item.video_title||'Link');
    }else if(item.kind==='embed'){
      const code=item.embed_code||item.embedCode||'';
      if(!code)throw new Error('Schoology did not provide embedded content.');
      dialog.remove();showEmbeddedWeb('data:text/html;charset=utf-8,'+encodeURIComponent(code),item.title||'Embedded content',{allowBrowser:false});
    }else if(item.kind==='external_tool'){
      const url=item.launch_url||item.launchUrl||item.url||item.tool_url||item.toolUrl||item.web_url||item.webUrl;
      if(!url)throw new Error('Schoology did not provide a launch URL for this tool.');
      dialog.remove();await A.prepareWebSession();showEmbeddedWeb(url,item.tool_name||item.toolName||item.title||'External Tool',{allowBrowser:false,lti:true});
    }
  }catch(error){showAppDialog('Unable to open attachment',error.message||String(error))}
}
function showAssignmentAttachmentDialog(attachments){
  const items=(Array.isArray(attachments)?attachments:collectAssignmentAttachments(attachments)).slice(0,50);
  if(!items.length)return;
  document.getElementById('assignmentAttachmentDialog')?.remove();
  const wrapper=document.createElement('div');wrapper.id='assignmentAttachmentDialog';wrapper.className='assignmentAttachmentDialogOverlay';
  wrapper.innerHTML=`<m3e-dialog open class="assignmentAttachmentDialog" disable-close><span slot="header">Attachments</span><div class="assignmentAttachmentList">${items.map((item,index)=>{
    const title=String(item.title||item.fileTitle||item.filename||item.fileName||item.linkTitle||item.videoTitle||item.name||item.tool_name||'Attachment');
    const mime=item.filemime||item.fileMIME||item.mime||'';
    const iconName=item.kind==='link'||item.kind==='video'||item.kind==='embed'||item.kind==='external_tool'?'attachment_link_icon.png':mimeIconForFilename(title,mime);
    const icon=localAttachmentIcon(iconName)||localAttachmentIcon('attachment_document_icon.png');
    return `<button type="button" class="assignmentAttachmentRow" data-assignment-attachment-index="${index}"><span class="assignmentAttachmentIcon" aria-hidden="true"><img src="${esc(icon)}" alt=""></span><span class="assignmentAttachmentName">${esc(title)}</span></button>`;
  }).join('')}</div><div slot="actions" end class="assignmentAttachmentActions"><m3e-button id="assignmentAttachmentClose" variant="filled">Close</m3e-button></div></m3e-dialog>`;
  document.body.appendChild(wrapper);
  const dialog=wrapper.querySelector('m3e-dialog');let closing=false;
  dialog?.addEventListener('closed',()=>setTimeout(()=>wrapper.remove(),260),{once:true});
  const close=()=>{if(closing)return;closing=true;try{if(typeof dialog?.hide==='function')dialog.hide();else if(dialog)dialog.open=false}catch{if(dialog)dialog.open=false}setTimeout(()=>wrapper.remove(),260)};
  wrapper.querySelector('#assignmentAttachmentClose')?.addEventListener('click',close);
  wrapper.querySelectorAll('[data-assignment-attachment-index]').forEach(button=>button.addEventListener('click',async()=>{
    const item=items[Number(button.dataset.assignmentAttachmentIndex)];
    if(item)await openAssignmentAttachmentItem(item,button,dialog);
  }));
  wrapper.addEventListener('click',event=>{if(event.target===wrapper)close()});
}
function collectAssignmentAttachments(a){
  const out=[],seen=new Set();
  const add=(kind,v)=>{if(!v||typeof v!=='object')return;const id=String(v.id||v.file_id||v.fileId||v.link_id||v.linkId||v.url||v.href||v.title||'');const key=kind+':'+id;if(seen.has(key))return;seen.add(key);out.push({kind,...v});};
  const walk=v=>{if(!v)return;if(Array.isArray(v)){v.forEach(walk);return}if(typeof v!=='object')return;
    const files=v.files?.file||v.files?.list||v.files||v.file; if(files){for(const f of (Array.isArray(files)?files:(files.file||files.list||[files])))add('file',f)}
    const links=v.links?.link||v.links||v.link; if(links){for(const l of (Array.isArray(links)?links:(links.link||links.list||[links])))add('link',l)}
    const videos=v.videos?.video||v.videos||v.video; if(videos){for(const x of (Array.isArray(videos)?videos:(videos.video||videos.list||[videos])))add('video',x)}
    const embeds=v.embeds?.embed||v.embeds||v.embed; if(embeds){for(const x of (Array.isArray(embeds)?embeds:(embeds.embed||embeds.list||[embeds])))add('embed',x)}
    const tools=v.external_tools?.external_tool||v.external_tools||v.external_tool||v.externalTool||v.tools;if(tools){for(const x of (Array.isArray(tools)?tools:(tools.external_tool||tools.list||[tools])))add('external_tool',x)}
    const t=String(v.type||v.attachmentType||v.attachment_type||'').toLowerCase();if(t==='file'||v.download_path||v.downloadPath||v.resolveDownloadUrl)add('file',v);if(t==='link'||v.linkURL||v.linkUrl)add('link',v);if(['external_tool','externaltool','lti'].includes(t)||v.launch_url||v.launchUrl)add('external_tool',v);
    for(const k of ['attachment','attachments','files','links','videos','embeds','external_tools','external_tool','tools','file','link','video','embed'])if(v[k]&&v[k]!==a)walk(v[k]);
  };walk(a);return out;
}
async function schoologyAssignmentSupportsAnnotations(sectionId,assignmentId){
  if(!sectionId||!assignmentId||!A.annotationRequest)return false;
  try{
    const isCa=await A.getServerInstance?.().catch(()=>false);
    const host=isCa?'api.schoologyca.com':'api.schoology.com';
    const result=await A.annotationRequest({url:'https://'+host+'/v2/sections/'+encodeURIComponent(sectionId)+'/assignments/'+encodeURIComponent(assignmentId)});
    const actions=result?.['@actions']||result?.actions||[];
    const hasAction=type=>Array.isArray(actions)&&actions.some(action=>{
      const types=Array.isArray(action?.['@type'])?action['@type']:[action?.['@type']||action?.type];
      return types.includes(type)&&!!(action?.['@href']||action?.href);
    });
    return hasAction('assignment:startAssignment')||hasAction('assignment:restoreAssignment');
  }catch(error){console.debug('Could not verify Schoology annotation availability:',error);return false;}
}

async function showAssignment(sectionId,assignmentId){
  const c=document.getElementById('content'); if(!c)return;
  state.assignmentSupportsAnnotations=false;state.toolbarTitle='Assignment'; state.screen='app'; state.assignmentView={sectionId,assignmentId}; state.courseView='course'; state.assignmentTab='info'; state.assignmentCanSubmit=false; state.assignmentIsTeacher=false; state.assignmentSubpage=null; state.submissionMenu=false; state.assignmentAllowComments=false; state.assignmentLandscape=window.matchMedia('(min-width: 801px)').matches; syncToolbar();
  c.innerHTML=`<section class="assignmentPage"><div class="assignmentLoading loading"><m3e-circular-progress-indicator indeterminate class="m3eInlineProgress" aria-label="Loading"></m3e-circular-progress-indicator><span>Loading assignment…</span></div></section>`;
  try{
    const uid=state.auth?.userId||state.auth?.user?.id;
    const [aResp,sectionResp,enrollResp]=await Promise.all([
      A.api({path:`sections/${sectionId}/assignments/${assignmentId}`,params:{richtext:1,with_attachments:'TRUE'}}),
      A.api({path:`sections/${sectionId}`,params:{}}).catch(()=>({})),
      uid?A.api({path:`sections/${sectionId}/enrollments`,params:{uid,enrollment_status:1}}).catch(()=>({})):Promise.resolve({})
    ]);
    const at=aResp.assignment||aResp;
    // Android AssignmentResolverActivity sends LTI submissions to LTIAssignmentActivity,
    // which loads AssignmentData.webUrl() in a Schoology WebView. Google Drive/Docs/Slides
    // assignments use this LTI/external-tool path, so do not try to render them natively.
    const assignmentType=String(at.assignment_type||at.assignmentType||at.type||'').toLowerCase();
    const assignmentWebUrl=at.web_url||at.webUrl||at.launch_url||at.launchUrl||'';
    if(assignmentType==='lti_submission' && assignmentWebUrl){
      await A.prepareWebSession();
      showEmbeddedWeb(assignmentWebUrl,at.title||'Assignment',{allowBrowser:false,lti:true});
      return;
    }
    const html=typeof at.description==='string'?at.description:'';
    const attachments=at.attachments||at.attachment||{};
    const myEnrollment=(enrollResp.enrollment||enrollResp.enrollments||[])[0]||{};
    const isTeacher=String(myEnrollment.admin??sectionResp.admin??at.admin??(state.selectedCourse?.admin||0))==='1';
    const flag=v=>v===true||v===1||v==='1'||String(v).toLowerCase()==='true'||String(v).toLowerCase()==='yes';
    let gradeItem=at;
    try{
      const gi=await A.api({path:`sections/${sectionId}/grade_items/${assignmentId}`,params:{}});
      gradeItem=gi?.assignment||gi?.grade_item||gi?.gradeItem||gi||at;
    }catch{}
    const canSubmit=flag(at.allow_dropbox)||flag(at.allowDropbox)||flag(at.allow_submission)||flag(at.allowSubmission)||flag(gradeItem.allow_dropbox)||flag(gradeItem.allowDropbox)||flag(gradeItem.allow_submission)||flag(gradeItem.allowSubmission);
    const allowComments=flag(at.allow_discussion)||flag(at.allowDiscussion)||flag(gradeItem.allow_discussion)||flag(gradeItem.allowDiscussion);
    const annotationFiles=collectAssignmentAttachments(attachments).filter(file=>{const name=String(file.filename||file.fileName||file.title||file.fileTitle||''),mime=String(file.filemime||file.fileMIME||file.mime||'').toLowerCase();return !!(file.id||file.file_id||file.fileId)&&(mime.includes('pdf')||/\.pdf$/i.test(name))&&!!(file.file_download_url||file.fileDownloadURL||file.download_path||file.downloadPath||file.download_url||file.downloadUrl||file.url||file.resolveDownloadUrl||file.resolve_download_url)});
    const supportsAnnotations=canSubmit&&!isTeacher&&await schoologyAssignmentSupportsAnnotations(sectionId,assignmentId);
    let assignmentGrade={};
    if(uid){try{const gr=await A.api({path:`sections/${sectionId}/grades`,params:{assignment_id:gradeItem.id||assignmentId,enrollment_id:(myEnrollment.id||undefined)}});assignmentGrade=(gr.grades?.grade||gr.grade||[])[0]||{}}catch{}}
    const resolvedGradeItemId=Number(gradeItem.id||gradeItem.grade_item_id||gradeItem.gradeItemId||gradeItem.gradeitem_id||gradeItem.gradeItemID||assignmentId)||Number(assignmentId);
    state.assignmentCanSubmit=canSubmit; state.assignmentIsTeacher=isTeacher; state.assignmentSupportsAnnotations=supportsAnnotations; state.assignmentAllowComments=allowComments; state.assignmentData={...at,__gradeItemId:resolvedGradeItemId,__annotationFiles:annotationFiles}; state.assignmentEnrollmentId=myEnrollment.id||null;
    const tabs=`<m3e-tabs variant="secondary" class="m3eSchoologyTabs assignmentTabsM3e"><m3e-tab class="assignmentTab" data-assignment-tab="info" selected>Info</m3e-tab>${allowComments?`<m3e-tab class="assignmentTab" data-assignment-tab="comments">Comments</m3e-tab>`:''}${!state.assignmentLandscape&&canSubmit?`<m3e-tab class="assignmentTab" data-assignment-tab="submit">${isTeacher?'Grade Submissions':'Submissions'}</m3e-tab>`:''}</m3e-tabs>`;
    if(state.assignmentLandscape&&canSubmit){
      c.innerHTML=`<section class="assignmentAndroidPage assignmentLandscapePage"><m3e-split-pane orientation="horizontal" class="assignmentLandscapeSplit" data-persist-key="assignment-${esc(sectionId)}-${esc(assignmentId)}" value="70.833" min="35" max="85" step="1" label="Resize assignment information and submissions"><section slot="start" class="assignmentInfoPane">${tabs}<div id="assignmentTabContent" class="assignmentTabContent"></div></section><aside slot="end" class="assignmentSubmissionsPane"><div class="assignmentPaneHeader">${isTeacher?'Submissions':'Submissions'}</div><div id="assignmentSubmissionsPane" class="assignmentSubmissionsContent"></div></aside></div></section>`;
    }else{
      c.innerHTML=`<section class="assignmentAndroidPage">${tabs}<div id="assignmentTabContent" class="assignmentTabContent"></div></section>`;
    }
    const renderInfo=()=>{
      const el=document.getElementById('assignmentTabContent');if(!el)return;
      const teacherComment=typeof assignmentGrade.comment==='string'?assignmentGrade.comment:(assignmentGrade.comment?.comment||assignmentGrade.comment?.body||'');
      const attachmentCount=collectAssignmentAttachments(attachments).length;
      el.innerHTML=`<m3e-card variant="filled" class="assignmentInfoCard"><div class="assignmentInfoHeader"><h1>${esc(at.title||'Assignment')}</h1><div>${esc(at.due||'')}</div></div>${attachmentCount?`<m3e-button id="viewAssignmentAttachments" class="assignmentAttachmentsButton" variant="tonal">View Attachments (${attachmentCount})</m3e-button>`:''}<div class="assignmentDescription">${html||'<span class="muted">No description.</span>'}</div>${teacherComment?`<section class="assignmentTeacherComment"><b>Teacher Comment</b><div>${teacherComment}</div></section>`:''}<div class="assignmentMeta">${at.max_points!=null?`<span>${esc(at.max_points)} points</span>`:''}</div></m3e-card>`;
      state.assignmentTab='info';state.assignmentSubpage=null;state.submissionMenu=false;syncToolbar();
      document.getElementById('viewAssignmentAttachments')?.addEventListener('click',()=>showAssignmentAttachmentDialog(attachments));
      hydrateMediaImages(el);
      el.querySelectorAll('a[href]').forEach(a=>a.addEventListener('click',async ev=>{const href=a.href||a.getAttribute('href')||'';if(!href||href==='#')return;ev.preventDefault();ev.stopPropagation();try{if(await routeSchoologyLink(href))return;const error=await A.openExternal(href);if(error)throw new Error(error)}catch(e){alert('Unable to open assignment link: '+e.message)}}));
    };
    const select=async(id)=>{
      state.assignmentTab=id; state.submissionMenu=false;
      syncM3eTabSelection(document.querySelector('.assignmentTabsM3e'),'assignmentTab',id);
      if(id==='info')renderInfo();
      else if(id==='comments')await openAssignmentComments(sectionId,assignmentId,at);
      else if(id==='submit')await openAssignmentSubmissions(sectionId,assignmentId,at,isTeacher);
      syncToolbar();
    };
    document.querySelectorAll('[data-assignment-tab]').forEach(b=>b.onclick=()=>openWithPressTransition(b,()=>select(b.dataset.assignmentTab)));
    renderInfo();
    if(state.assignmentLandscape&&canSubmit)await openAssignmentSubmissions(sectionId,assignmentId,at,isTeacher);
  }catch(e){ c.innerHTML=`<div class="error apiError"><b>Schoology could not load this page.</b><br>${esc(e.message)}</div>`; }
}

async function openAssignmentComments(sectionId,assignmentId,assignment){
 const c=document.getElementById('assignmentTabContent')||document.getElementById('content');if(!c)return;
 c.innerHTML='<div class="commentsPage officialComments"><div class="loading"><m3e-circular-progress-indicator indeterminate class="m3eInlineProgress" aria-label="Loading"></m3e-circular-progress-indicator><span>Loading comments…</span></div></div>';
 try{
  const response=await A.api({path:'sections/'+sectionId+'/assignments/'+assignmentId+'/comments',params:{start:0,limit:100,with_attachments:'TRUE',richtext:1}});
  const comments=flattenSharedComments(response),hydrated=await hydrateDialogPeople(comments);
  c.innerHTML='<div class="commentsPage officialComments"><div class="commentsList sharedCommentsList">'+(comments.map((row,index)=>renderSharedCommentRow(row,comments,assignmentId,hydrated[index])).join('')||'<div class="androidEmptyState">No comments yet.</div>')+'</div></div>';
  await hydrateMediaImages(c);
  wireSharedCommentRows(c,{likePath:id=>'like/'+assignmentId+'/comment/'+id,replyHandler:id=>openAssignmentCommentComposer(sectionId,assignmentId,id)});
 }catch(error){c.innerHTML='<div class="error apiError"><b>Schoology could not load comments.</b><br>'+esc(error?.message||String(error))+'</div>'}
}
async function chooseSchoologyResource(onSelect,title='Attach Resource'){
 const old=document.getElementById('schoologyResourcePicker');old?.remove();
 const wrap=document.createElement('div');wrap.id='schoologyResourcePicker';wrap.className='assignmentCommentDialogOverlay schoologyResourcePickerOverlay';
 wrap.innerHTML=`<m3e-dialog open class="schoologyResourcePickerDialog" disable-close><span slot="header"><button id="resourcePickerCancel" class="iconButton">${officialIcon('ic_action_discard_icon.png','Close')}</button><b>${esc(title)}</b><button id="resourcePickerDone" class="iconButton" disabled>${officialIcon('ic_action_post_checkmark_divider.png','Save')}</button></span><div class="resourcePickerTabs"><m3e-tabs variant="secondary" class="m3eSchoologyTabs"><m3e-tab selected>All</m3e-tab><m3e-tab>Selected</m3e-tab></m3e-tabs></div><div id="resourcePickerBody"><div class="loading"><m3e-circular-progress-indicator indeterminate class="m3eInlineProgress" aria-label="Loading"></m3e-circular-progress-indicator><span>Loading resources…</span></div></div></m3e-dialog>`
 document.body.appendChild(wrap); const body=wrap.querySelector('#resourcePickerBody'); let selected=null;
 const close=()=>wrap.remove();wrap.querySelector('#resourcePickerCancel').onclick=close;wrap.onclick=e=>{if(e.target===wrap)close()};
 try{
  const x=await A.api({path:'collections',params:{start:0,limit:200}});const cols=x?.collection||x?.collections||x?.collection_list||[];
  if(!Array.isArray(cols)||!cols.length){body.innerHTML='<div class="resourcePickerEmpty">No resource collections available.</div>';return;}
  body.innerHTML=cols.map((col,i)=>`<button class="resourcePickerCollection" data-col-index="${i}"><img src="../assets/icons/ic_collection.png" alt=""><span><b>${esc(col.collection_title||col.title||col.name||'Collection')}</b><small>Resources</small></span><span>›</span></button>`).join('');
  wrap.querySelectorAll('[data-col-index]').forEach(btn=>btn.onclick=async()=>{const col=cols[+btn.dataset.colIndex],cid=col.id??col.collection_id??col.collectionID;if(cid==null)return;body.innerHTML='<div class="loading"><m3e-circular-progress-indicator indeterminate class="m3eInlineProgress" aria-label="Loading"></m3e-circular-progress-indicator><span>Loading resources…</span></div>';try{const rx=await A.api({path:`collections/${cid}/resources`,params:{start:0,limit:200,with_attachments:'TRUE'}});const rs=rx?.resource||rx?.resources||rx?.resource_list||[];body.innerHTML=`<button class="resourcePickerBack">‹ ${esc(col.collection_title||col.title||'Collection')}</button>`+(rs.length?rs.map((r,i)=>`<button class="resourcePickerItem" data-res-index="${i}"><img src="../assets/icons/${resourceIconForType(resourceType(r),resourceTitle(r),r)}" onerror="this.onerror=null;this.src='../assets/icons/attachment_document_icon.png'" alt=""><span><b>${esc(resourceTitle(r)||'Resource')}</b></span></button>`).join(''):'<div class="resourcePickerEmpty">No resources in this collection.</div>');body.querySelector('.resourcePickerBack')?.addEventListener('click',()=>{body.innerHTML=cols.map((col2,i)=>`<button class="resourcePickerCollection" data-col-index="${i}"><img src="../assets/icons/ic_collection.png" alt=""><span><b>${esc(col2.collection_title||col2.title||col2.name||'Collection')}</b><small>Resources</small></span><span>›</span></button>`).join('');body.querySelectorAll('[data-col-index]').forEach(b=>b.onclick=wrap.querySelectorAll('[data-col-index]')[0]?.onclick)});window.__pickerResources=rs;body.querySelectorAll('[data-res-index]').forEach(rbtn=>rbtn.onclick=()=>{selected=window.__pickerResources[+rbtn.dataset.resIndex];wrap.querySelector('#resourcePickerDone').disabled=false;body.querySelectorAll('.resourcePickerItem').forEach(q=>q.classList.remove('selected'));rbtn.classList.add('selected');});}catch(e){body.innerHTML=`<div class="resourcePickerError">Unable to load resources<br>${esc(e.message)}</div>`}});
  wrap.querySelector('#resourcePickerDone').onclick=()=>{if(selected){onSelect(selected);close()}};
 }catch(e){body.innerHTML=`<div class="resourcePickerError">Unable to load resources<br>${esc(e.message)}</div>`}
}

function openAssignmentCommentComposer(sectionId,assignmentId,parentId='0'){
  state.assignmentSubpage='commentComposer';
  const old=document.getElementById('assignmentCommentDialog');old?.remove();
  const wrap=document.createElement('div');wrap.id='assignmentCommentDialog';wrap.className='assignmentCommentDialogOverlay';
  wrap.innerHTML=`<m3e-dialog open class="assignmentCommentDialog" disable-close><span slot="header" class="androidCommentDialogBar"><button id="assignmentCommentCancel" class="androidDialogIcon" aria-label="Cancel">${officialIcon('ic_action_discard_icon.png','Cancel')}</button><div class="androidDialogTitle">Comment</div><button id="assignmentCommentSend" class="androidDialogIcon" aria-label="Submit">${officialIcon('ic_action_send_icon.png','Submit')}</button></span><div class="androidCommentDialogBody"><textarea id="assignmentCommentBody" placeholder="Post a comment…" autofocus></textarea><div class="commentAttachmentActions"><button id="commentAttachFile">${officialOrAssetIcon('ic_action_ic_menu_folder.png','')}File</button><button id="commentAttachResource">${officialOrAssetIcon('ic_attach_resourcesv3.png','')}Resource</button></div><div id="commentAttachmentStatus"></div></div></m3e-dialog>`
  document.body.appendChild(wrap);
  const close=()=>{state.assignmentSubpage=null;wrap.remove();syncToolbar()};
  wrap.querySelector('#assignmentCommentCancel')?.addEventListener('click',close);wrap.querySelector('#commentAttachFile')?.addEventListener('click',async()=>{try{const f=await A.pickFile?.();if(f){wrap.dataset.attachment=f.path||f.filePath||'';wrap.querySelector('#commentAttachmentStatus').textContent='File attached: '+(f.name||f.fileName||f.path||'Selected file')}}catch(e){alert('Unable to select file: '+e.message)}});wrap.querySelector('#commentAttachResource')?.addEventListener('click',async()=>{try{await chooseSchoologyResource(r=>{const id=r.template_id??r.templateID??r.resource_id??r.resourceId??r.template?.id??r.id;if(id==null)throw new Error('This resource does not have a usable Schoology resource ID.');wrap.dataset.resourceId=id;wrap.querySelector('#commentAttachmentStatus').textContent='Resource attached: '+resourceTitle(r)},'Attach Resource')}catch(e){alert('Unable to load resources: '+e.message)}});
  wrap.addEventListener('click',e=>{if(e.target===wrap)close()});
  wrap.querySelector('#assignmentCommentSend')?.addEventListener('click',async()=>{
    const body=wrap.querySelector('#assignmentCommentBody')?.value.trim();if(!body)return;
    const send=wrap.querySelector('#assignmentCommentSend');send.disabled=true;
    try{
      const params={comment:body,parent_id:Number(parentId)||0};
      const filePath=wrap.dataset.attachment||'';const resourceId=wrap.dataset.resourceId||'';
      if(filePath){const fileId=await A.uploadSchoologyFile({filePath});params['file-attachment']={id:[Number(fileId)||fileId]}}
      if(resourceId)params.attachments=[{resource:Number(resourceId)||resourceId}];
      await A.api({path:`course/${sectionId}/materials/assignments/${assignmentId}/${Number(parentId)?`create_reply/${Number(parentId)}`:'create_comment'}`,method:'POST',params,json:true});
      close();await openAssignmentComments(sectionId,assignmentId,state.assignmentData||{})
    }catch(e){send.disabled=false;alert('Unable to post comment: '+e.message)}
  });
  requestAnimationFrame(()=>wrap.querySelector('#assignmentCommentBody')?.focus());
}
function showAssignmentActionMenu(){
 const old=document.getElementById('assignmentActionMenuDialog');old?.remove();
 const canComment=!!state.assignmentAllowComments,canSubmit=!!state.assignmentCanSubmit;
 const actions=(canSubmit?'<m3e-list-action data-assignment-menu-action="upload" tabindex="0"><span slot="leading" class="m3eOriginalIcon">'+schoologyNavIcon('resources')+'</span><span>Upload Submission</span></m3e-list-action><m3e-list-action data-assignment-menu-action="text" tabindex="0"><span slot="leading" class="m3eOriginalIcon">'+schoologyNavIcon('materials')+'</span><span>Create Text Submission</span></m3e-list-action>':'')+(canComment?'<m3e-list-action data-assignment-menu-action="comment" tabindex="0"><span slot="leading" class="m3eOriginalIcon">'+schoologyNavIcon('updates')+'</span><span>Create Comment</span></m3e-list-action>':'');
 const wrap=document.createElement('div');wrap.id='assignmentActionMenuDialog';wrap.className='sharedOverlay';
 wrap.innerHTML='<m3e-dialog open class="sharedM3eDialog assignmentActionDialog" disable-close><span slot="header">Assignment actions</span><m3e-action-list variant="segmented" class="assignmentActionList">'+actions+'</m3e-action-list><span slot="actions" end><m3e-button variant="text" data-assignment-menu-close>Cancel</m3e-button></span></m3e-dialog>';
 document.body.appendChild(wrap);const close=()=>wrap.remove();wrap.querySelector('[data-assignment-menu-close]')?.addEventListener('click',close);
 wrap.querySelectorAll('[data-assignment-menu-action]').forEach(button=>button.addEventListener('click',()=>{const action=button.dataset.assignmentMenuAction;close();if(action==='upload')showAssignmentAttachmentChooser();else if(action==='text')openTextSubmissionComposer();else if(action==='comment')openAssignmentCommentComposer(state.assignmentView.sectionId,state.assignmentView.assignmentId,'0')}));
}

async function openAssignmentSubmissions(sectionId,assignmentId,assignment,isTeacher){
  const c=(state.assignmentLandscape&&document.getElementById('assignmentSubmissionsPane'))||(document.getElementById('assignmentTabContent')||document.getElementById('content'));if(!c)return;
  const gradeItemId=assignment.__gradeItemId||assignment.grade_item_id||assignment.gradeItemId||assignment.gradeitem_id||assignment.gradeItemID||assignmentId;
  c.innerHTML='<div class="gradeDropboxAndroid"><div class="loading"><m3e-circular-progress-indicator indeterminate class="m3eInlineProgress" aria-label="Loading"></m3e-circular-progress-indicator><span>Loading…</span></div></div>';
  try{
    if(isTeacher){
      const [enr,grades,subs]=await Promise.all([
        A.api({path:`sections/${sectionId}/enrollments`,params:{enrollment_status:1,limit:200}}),
        A.api({path:`sections/${sectionId}/grades`,params:{assignment_id:gradeItemId,limit:200}}),
        A.api({path:`sections/${sectionId}/submissions/${gradeItemId}`,params:{with_attachments:'TRUE',all_revisions:'TRUE',limit:200}}).catch(()=>({}))
      ]);
      const enrollments=(enr.enrollment||enr.enrollments||[]).filter(e=>String(e.admin)!=='1'&&String(e.status||1)==='1');
      const gradesArr=grades.grades?.grade||grades.grade||[];const gmap={};gradesArr.forEach(g=>gmap[String(g.enrollment_id)]=g);
      const revisions=subs.revision||subs.revisions||[];const smap={};revisions.forEach(r=>{const uid=String(r.uid||r.user_id||'');if(uid&&!smap[uid])smap[uid]=r});
      enrollments.sort((a,b)=>String(a.name_last||'').localeCompare(String(b.name_last||''))||String(a.name_first||'').localeCompare(String(b.name_first||'')));
      c.innerHTML=`<section class="gradeDropboxAndroid m3eSubmissionsView"><m3e-card variant="filled" class="submissionHeaderCard"><div slot="content"><m3e-heading variant="title" size="large">${esc(assignment.title||'Assignment')}</m3e-heading><m3e-heading variant="label" size="medium">${esc(assignment.max_points!=null?'/ '+assignment.max_points:'')}</m3e-heading></div></m3e-card>${enrollments.length?`<m3e-list variant="segmented" class="gradeStudentList">${enrollments.map(e=>{const g=gmap[String(e.id)]||{};const r=smap[String(e.uid)];const score=g.grade??g.calculated_grade??'';const status=r?(String(r.draft)==='1'?'Draft':(String(r.late)==='1'?'Late':'Submitted')):'Not submitted';return `<m3e-list-action data-grade-student="${esc(e.uid)}" data-grade-enrollment="${esc(e.id)}"><span class="submissionStudentAvatar">${esc(String(e.name_first||e.name_display||'?').charAt(0))}</span><span>${esc((e.name_last||'')+', '+(e.name_first||''))}</span><span slot="supporting-text">${esc(status)}</span><span slot="trailing">${esc(score===''?'—':score)}</span></m3e-list-action>`}).join('')}</m3e-list>`:'<m3e-card variant="filled" class="gradeEmptyCard"><m3e-heading variant="body" size="medium">No students found.</m3e-heading></m3e-card>'}</section>`;
      document.querySelectorAll('[data-grade-student]').forEach(b=>b.onclick=()=>openTeacherSubmission(sectionId,assignmentId,assignment,b.dataset.gradeStudent,b.dataset.gradeEnrollment));
    }else{
      const uid=state.auth?.userId||state.auth?.user?.id;
      const grades=await A.api({path:`sections/${sectionId}/grades`,params:{assignment_id:gradeItemId,enrollment_id:(state.assignmentEnrollmentId||undefined)}}).catch(()=>({}));
      let subs={};
      try{subs=await A.api({path:`sections/${sectionId}/submissions/${gradeItemId}/${uid}`,params:{with_attachments:'TRUE',all_revisions:'TRUE',start:0,limit:200}})}catch(e){subs={};}
      const g=(grades.grades?.grade||grades.grade||[])[0]||{};const revsRaw=subs.revision||subs.revisions||subs.data?.revision||subs.data?.revisions||[];const revs=Array.isArray(revsRaw)?revsRaw.slice():[];revs.sort((a,b)=>Number(b.revision_id??b.revisionId??b.id??0)-Number(a.revision_id??a.revisionId??a.id??0));
      const annotationAllowed=await schoologyAssignmentSupportsAnnotations(sectionId,assignmentId);
      const revisionHtml=revs.length?revs.map(r=>{const rid=r.revision_id??r.revisionId??r.id??'';const status=String(r.draft)==='1'?'Draft':String(r.late)==='1'?'Late':'On time';return `<m3e-card variant="filled" class="submissionRevisionCard"><div slot="content"><div class="submissionRevisionHeader"><m3e-heading variant="title" size="medium">Revision ${esc(rid)}</m3e-heading><m3e-heading variant="label" size="small" class="revisionStatus ${String(r.late)==='1'?'late':''}">${status}</m3e-heading></div><m3e-heading variant="body" size="small">${esc(formatSchoologyDate(r.created||''))}</m3e-heading><m3e-divider></m3e-divider>${renderAttachments(r.attachments||{}, {sectionId,assignmentId,gradeItemId,userId:uid,revisionId:rid,submissionId:r.submission_id||r.submissionId||r.sub_id||'',allowAnnotation:annotationAllowed})}</div></m3e-card>`}).join(''):'<m3e-card variant="filled" class="gradeEmptyCard"><m3e-heading variant="body" size="medium">You haven’t made any submissions.</m3e-heading></m3e-card>';
      const gradeComment=typeof g.comment==='string'?g.comment:(g.comment?.comment||g.comment?.body||'');
      c.innerHTML=`<section class="gradeDropboxAndroid studentSubmissionAndroid m3eSubmissionsView"><m3e-card variant="filled" class="submissionHeaderCard"><div slot="content"><m3e-heading variant="title" size="large">${esc(assignment.title||'Assignment')}</m3e-heading><m3e-heading variant="label" size="medium">${esc((g.grade??'—')+(assignment.max_points!=null?` / ${assignment.max_points}`:''))}</m3e-heading></div></m3e-card>${gradeComment?`<m3e-card variant="outlined" class="studentOverallComment"><m3e-heading variant="label" size="large">Overall Comment</m3e-heading><p>${esc(gradeComment)}</p></m3e-card>`:''}<m3e-heading variant="title" size="large" class="submissionSectionTitle">Your Submissions</m3e-heading><div class="submissionRevisionList">${revisionHtml}</div></section>`;
      await hydrateMediaImages(c);
    }
  }catch(e){c.innerHTML=`<div class="error apiError"><b>Schoology could not load submissions.</b><br>${esc(e.message)}</div>`}
}

async function openTeacherSubmission(sectionId,gradeItemId,assignment,userId,enrollmentId){
  state.assignmentSubpage='teacherSubmission'; state.toolbarTitle='Grade Submission'; syncToolbar();
  const c=document.getElementById('assignmentTabContent');if(!c)return;
  c.innerHTML='<div class="gradeDropboxAndroid"><div class="loading"><m3e-circular-progress-indicator indeterminate class="m3eInlineProgress" aria-label="Loading"></m3e-circular-progress-indicator><span>Loading submission…</span></div></div>';
  try{
    const [u,grades,subs]=await Promise.all([A.api({path:`users/${userId}`,params:{picture_size:'sm'}}).catch(()=>({})),A.api({path:`sections/${sectionId}/grades`,params:{assignment_id:gradeItemId,enrollment_id:enrollmentId}}).catch(()=>({})),A.api({path:`sections/${sectionId}/submissions/${gradeItemId}/${userId}`,params:{with_attachments:'TRUE',all_revisions:'TRUE',start:0,limit:200}}).catch(()=>({}))]);
    const user=u.user||u,g=(grades.grades?.grade||grades.grade||[])[0]||{},revsRaw=subs.revision||subs.revisions||[];const revs=Array.isArray(revsRaw)?revsRaw.slice():[];revs.sort((a,b)=>Number(b.revision_id??b.revisionId??b.id??0)-Number(a.revision_id??a.revisionId??a.id??0));
    const revisionHtml=revs.length?revs.map(r=>{const rid=r.revision_id??r.revisionId??r.id??'';const comment=typeof g.comment==='string'?g.comment:(g.comment?.comment||g.comment?.body||'');return `<article class="submissionRevisionAndroid"><div><b>Revision ${esc(rid)}</b><small>${esc(formatSchoologyDate(r.created||''))}</small></div><span class="revisionStatus ${String(r.late)==='1'?'late':''}">${String(r.draft)==='1'?'Draft':String(r.late)==='1'?'Late':'On time'}</span>${renderAttachments(r.attachments||{}, {sectionId,gradeItemId,userId,revisionId:rid,submissionId:r.submission_id||r.submissionId||r.sub_id||''})}</article>`}).join(''):'<div class="androidEmptyState">No submissions.</div>';
    const gradeComment=typeof g.comment==='string'?g.comment:(g.comment?.comment||g.comment?.body||'');
    c.innerHTML=`<section class="gradeDropboxAndroid teacherSubmissionAndroid"><div class="teacherGradeHeader"><div class="teacherUser"><div class="gradeStudentAvatar">${esc(String(user.name_first||user.name_display||'?').charAt(0))}</div><b>${esc(user.name_display||`${user.name_first||''} ${user.name_last||''}`)}</b></div><div class="teacherScore"><input id="teacherGradeInput" value="${esc(g.grade??'')}" inputmode="decimal"><span>/ ${esc(assignment.max_points??'')}</span></div></div><div class="submissionSectionTitle">Submissions</div><div class="submissionRevisionList">${revisionHtml}</div><section class="teacherOverallComment"><label>Overall Comment</label><textarea id="teacherGradeComment">${esc(gradeComment)}</textarea><label class="displayComment"><input id="teacherDisplayComment" type="checkbox" ${String(g.comment_status)==='1'?'checked':''}> Display comment to student</label><button id="saveTeacherGrade" class="androidPrimary">✓</button></section></section>`;
    await hydrateMediaImages(c);
    document.getElementById('saveTeacherGrade')?.addEventListener('click',async()=>{try{await A.updateAssignmentGrade({sectionId,assignmentId:gradeItemId,enrollmentId,grade:document.getElementById('teacherGradeInput')?.value||'',comment:document.getElementById('teacherGradeComment')?.value||'',commentStatus:document.getElementById('teacherDisplayComment')?.checked});await openTeacherSubmission(sectionId,gradeItemId,assignment,userId,enrollmentId)}catch(e){alert(e.message)}});
  }catch(e){c.innerHTML=`<div class="error apiError"><b>Schoology could not load this submission.</b><br>${esc(e.message)}</div>`}
}

function showSubmissionMenu(){
  const old=document.getElementById('submissionMenu');old?.remove();
  const plus=document.getElementById('assignmentPlus');if(!plus)return;
  const menu=createFabMenuFor('assignmentPlus','submissionMenu',`<m3e-fab-menu-item id="uploadSubmissionAction">Upload Submission</m3e-fab-menu-item><m3e-fab-menu-item id="textSubmissionAction">Create Text Submission</m3e-fab-menu-item><m3e-fab-menu-item id="textSubmissionCommentAction">Create Comment</m3e-fab-menu-item>${state.assignmentSupportsAnnotations?'<m3e-fab-menu-item id="annotatedSubmissionAction">Create annotated submission</m3e-fab-menu-item>':''}`);if(!menu)return;
  document.getElementById('uploadSubmissionAction')?.addEventListener('click',()=>{menu.hide?.();showAssignmentAttachmentChooser()});
  document.getElementById('textSubmissionAction')?.addEventListener('click',()=>{menu.hide?.();openTextSubmissionComposer()});
  document.getElementById('textSubmissionCommentAction')?.addEventListener('click',()=>{menu.hide?.();openAssignmentCommentComposer(state.assignmentView.sectionId,state.assignmentView.assignmentId,'0')});
  document.getElementById('annotatedSubmissionAction')?.addEventListener('click',()=>{menu.hide?.();openAnnotatedSubmissionPicker()});
}

function openAnnotatedSubmissionPicker(){
 const assignment=state.assignmentData||{},files=assignment.__annotationFiles||[];
 if(!state.assignmentSupportsAnnotations||!files.length){showAppDialog('Annotated submission unavailable','This assignment does not currently provide a supported PDF for annotated submissions.');return;}
 const openFile=async file=>{
  const fileId=file.id||file.file_id||file.fileId;
  const pdfUrl=file.file_download_url||file.fileDownloadURL||file.download_path||file.downloadPath||file.download_url||file.downloadUrl||file.url||file.resolveDownloadUrl||file.resolve_download_url;
  if(!fileId||!pdfUrl){showAppDialog('Annotated submission unavailable','Schoology did not provide the PDF file details required to annotate this submission.');return;}
  if(!window.schoologyAnnotationEditor?.open){showAppDialog('Annotation unavailable','The PDF annotation editor did not load.');return;}
  try{await window.schoologyAnnotationEditor.open({sectionId:state.assignmentView.sectionId,assignmentId:state.assignmentView.assignmentId,fileId:String(fileId),fileType:file.fileType||file.file_type||file.filemime||file.fileMIME||'application/pdf',pdfUrl,filename:file.title||file.fileTitle||file.filename||file.fileName||'Assignment PDF',onSubmitted:async()=>{await openAssignmentSubmissions(state.assignmentView.sectionId,state.assignmentView.assignmentId,state.assignmentData||{},false)}})}
  catch(error){showAppDialog('Unable to open annotation editor',error?.message||String(error))}
 };
 if(files.length===1){void openFile(files[0]);return;}
 const old=document.getElementById('annotatedSubmissionPicker');old?.remove();
 const wrap=document.createElement('div');wrap.id='annotatedSubmissionPicker';wrap.className='appDialogOverlay';
 wrap.innerHTML='<section class="appDialog assignmentAttachmentDialog" role="dialog" aria-modal="true"><h2>Create annotated submission</h2><div class="assignmentAttachmentList">'+files.map((f,i)=>'<button type="button" class="assignmentAttachmentRow" data-annotated-file="'+i+'"><span class="assignmentAttachmentName">'+esc(f.title||f.fileTitle||f.filename||f.fileName||'Assignment PDF')+'</span></button>').join('')+'</div><div class="appDialogActions"><button type="button" data-annotated-cancel>Cancel</button></div></section>';
 document.body.appendChild(wrap);wrap.classList.add('open');
 wrap.querySelector('[data-annotated-cancel]')?.addEventListener('click',()=>wrap.remove());
 wrap.querySelectorAll('[data-annotated-file]').forEach(button=>button.addEventListener('click',async()=>{const file=files[Number(button.dataset.annotatedFile)];wrap.remove();if(file)await openFile(file)}));
}
function showAssignmentAttachmentChooser(){
  document.getElementById('assignmentUploadSubmissionDialog')?.remove();
  const wrap=document.createElement('div');wrap.id='assignmentUploadSubmissionDialog';wrap.className='assignmentSubmissionDialogOverlay';
  wrap.innerHTML=`<m3e-dialog open class="assignmentSubmissionDialog" disable-close><span slot="header" class="assignmentSubmissionBar"><button id="submissionDialogCancel" class="androidDialogIcon" aria-label="Cancel">${officialIcon('ic_action_discard_icon.png','Cancel')}</button><div class="androidDialogTitle">New Submission</div><button id="submissionDialogSend" class="androidDialogIcon" aria-label="Submit">${officialIcon('ic_action_send_icon.png','Submit')}</button></span><div class="assignmentSubmissionBody"><div class="assignmentSubmissionChoices"><button id="submissionFileChoice">${officialOrAssetIcon('ic_action_ic_menu_folder.png','')}<span>File</span></button><button id="submissionResourceChoice">${officialOrAssetIcon('ic_attach_resourcesv3.png','')}<span>Resource</span></button></div><div id="submissionAttachmentStatus" class="submissionAttachmentStatus">No attachment selected</div></div></m3e-dialog>`
  document.body.appendChild(wrap);wrap.style.zIndex='2147483647';
  let selected=null;
  const status=()=>wrap.querySelector('#submissionAttachmentStatus');
  const close=()=>wrap.remove();
  const showSelected=label=>{if(status)status.textContent=label?`Selected: ${label}`:'No attachment selected'};
  wrap.querySelector('#submissionDialogCancel')?.addEventListener('click',close);wrap.addEventListener('click',e=>{if(e.target===wrap)close()});
  wrap.querySelector('#submissionFileChoice')?.addEventListener('click',async()=>{
    try{
      const picked=await A.pickFile();if(!picked)return;
      const filePath=typeof picked==='string'?picked:picked.path;if(!filePath)throw new Error('The selected file could not be accessed.');
      const filename=typeof picked==='object'&&picked.name?picked.name:filePath.split(/[\\/]/).pop();
      const mime=typeof picked==='object'?picked.mime:'';
      selected={type:'file',filePath,filename,mime};showSelected(filename||'File');
    }catch(e){showAppDialog('Unable to prepare file submission',e.message||String(e))}
  });
  wrap.querySelector('#submissionResourceChoice')?.addEventListener('click',async()=>{
    try{
      await chooseSchoologyResource(async r=>{
        const resourceId=r.template_id??r.templateID??r.resource_id??r.resourceId??r.id;
        if(resourceId==null)throw new Error('This resource does not have a usable Schoology resource ID.');
        const label=r.title||r.name||'Resource';selected={type:'resource',resourceId};showSelected(label);
      },'Attach Resource');
    }catch(e){showAppDialog('Unable to load resources',e.message||String(e))}
  });
  wrap.querySelector('#submissionDialogSend')?.addEventListener('click',async()=>{
    if(!selected){showAppDialog('New submission','Choose a File or Resource before submitting.');return}
    const btn=wrap.querySelector('#submissionDialogSend');if(btn)btn.disabled=true;
    try{
      const v=state.assignmentView;if(!v||!state.assignmentCanSubmit)throw new Error('This assignment is no longer available for submission.');
      if(selected.type==='resource'){
        const dlg=showAppDialog('Submitting resource','Submitting…',[]);
        try{await A.submitAssignmentResource({sectionId:v.sectionId,assignmentId:v.assignmentId,resourceId:selected.resourceId});if(dlg)dlg.open=false;close();await openAssignmentSubmissions(v.sectionId,v.assignmentId,state.assignmentData||{},false)}catch(e){if(dlg)dlg.open=false;throw e}
      }else{
        const dlg=showAppDialog('Uploading submission','Uploading…',[]);const msg=dlg?.querySelector('.appDialogMessage');
        if(msg)msg.innerHTML='<div class="fileUploadProgressWrap"><div class="fileUploadProgressTrack"><div id="fileUploadProgressBar" class="fileUploadProgressBar" style="width:0%"></div></div><div id="fileUploadProgressText" class="fileUploadProgressText">Uploading… 0%</div></div>';
        const off=A.onFileUploadProgress?.(d=>{const bar=document.getElementById('fileUploadProgressBar'),txt=document.getElementById('fileUploadProgressText');if(bar&&d?.percent!=null)bar.style.width=Math.max(0,Math.min(100,d.percent))+'%';if(txt)txt.textContent=d?.phase?`${d.phase}${d.percent!=null?` ${d.percent}%`:''}`:`Uploading… ${d?.percent??0}%`});
        try{await A.submitAssignmentFile({sectionId:v.sectionId,assignmentId:v.assignmentId,filePath:selected.filePath,filename:selected.filename,mime:selected.mime});off?.();if(dlg)dlg.open=false;close();await openAssignmentSubmissions(v.sectionId,v.assignmentId,state.assignmentData||{},false)}catch(e){off?.();if(dlg)dlg.open=false;throw e}
      }
    }catch(e){if(btn)btn.disabled=false;showAppDialog('Unable to submit',e.message||String(e))}
  });
  return wrap;
}
async function chooseAndSubmitAssignmentResource(){
  return showAssignmentAttachmentChooser();
}
async function chooseAndSubmitAssignmentFile(){
  return showAssignmentAttachmentChooser();
}
function openTextSubmissionComposer(){
 const v=state.assignmentView;if(!v)return;
 document.getElementById("textSubmissionComposer")?.remove();
 const wrap=document.createElement("div");wrap.id="textSubmissionComposer";wrap.className="assignmentCommentDialogOverlay";
 wrap.innerHTML=m3eTheme('<m3e-dialog open class="textSubmissionM3eDialog" disable-close><span slot="header">Create Text Submission</span><div class="textSubmissionDialogBody"><label for="submissionText">Submission</label><textarea id="submissionText" placeholder="Enter your submission…"></textarea><label class="textSubmissionDraft"><input id="submissionDraft" type="checkbox">Save as draft</label></div><div slot="actions" end><m3e-button id="cancelTextSubmission" variant="text">Cancel</m3e-button><m3e-button id="postTextSubmission" variant="filled">Submit</m3e-button></div></m3e-dialog>',"textSubmissionDialogTheme");
 document.body.appendChild(wrap);
 wrap.querySelector("#cancelTextSubmission")?.addEventListener("click",()=>wrap.remove());
 wrap.querySelector("#postTextSubmission")?.addEventListener("click",async()=>{const text=wrap.querySelector("#submissionText")?.value||"";if(!text.trim()){showAppDialog("Create Text Submission","Enter a submission before posting.");return}const button=wrap.querySelector("#postTextSubmission");if(button)button.disabled=true;try{const a=state.assignmentData||{};const gradeItemId=a.grade_item_id||a.gradeItemId||a.gradeitem_id||v.assignmentId;await A.submitAssignmentText({sectionId:v.sectionId,gradeItemId,text,draft:wrap.querySelector("#submissionDraft")?.checked});wrap.remove();await openAssignmentSubmissions(v.sectionId,v.assignmentId,a,false)}catch(e){if(button)button.disabled=false;showAppDialog("Unable to submit text",e.message||String(e))}});
 wrap.querySelector("#submissionText")?.focus();
}
const LOCAL_ATTACHMENT_ICONS={"attachment_document_icon.png":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEYAAABGCAMAAABG8BK2AAAA4VBMVEUAAAAAAACusLAAAAClqKgAAACtr6+kp6cAAAAAAAAAAAClp6cAAACnqamqrKwAAAAAAAD4+Pr39/j39/n29vbx8fLv8PHu7+7t7u7+/v7s7O39/f3r6+z8/Pzq6uv5+/vn6er5+vrn6Ong4eLz8vTKy8vl5+bn6Oju7++rra2jpaXm5+fk5uX7+/vp6uvk5eb19fbj5OXm5ubt7u/09fXi4+Ty8vOkp6fz9PTh4uP4+PmipaXf4OGtr6/e3+Do6eqrrq7p6emrrq3s7u3////n5+esrq78/Pvl5ualp6etsLBAJgwaAAAAEXRSTlMCBvcRwQHHwQQIBcEHxcMXAEuwd0QAAAGLSURBVFjD7djbTsJAEIDhFihQTopVUWlBy0ELiBUsteK2C51y6Ps/kDRcqIGNQ8JujPF/gO9ikklmVzo9StKfZhQlm43jxYIyms8pJaRSKRREMIUCIfBjs1mxmM/zZ0qlxQLA998Z+T5ArwcQRbncLnRsRlUpBWi1PM/Zk+e1WgCuOx4DjEa7EB/G854ZeR7Aem3bw+E+iA/jOE+MHCdhlsvJJIGiKJP5CvFhVqs+o8EgGTHAcmnbyaBns3JZUfgxlgXQ798z6nYBOh3XXW9y3ekUgJDPNeXDmGbAyDTb7e9rSmmpxJcJgiGzILjdtCVNE8CyVJUv02joiBqbRDC6foNK10UwYXiFKgxFMLXaA6paTQRziU4Ec4FOBDNBJ4L5nw2beUUngnlBJ4I5RyeC0bQzVJomgqlW31BVqyKYZvMOVbMpgjGMR1SGIYKp1w1U9TpvJjmvAa5RbU9Inkwcw0HFMU8mlSKEUgtV8rRPpfgxspxOnxxUOi3LvBhJkmX1oGRZkngxv+I36QMtlmnPFJsUygAAAABJRU5ErkJggg==","ic_attach_app_excel.png":"data:image/png;base64,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","ic_attach_app_pdf.png":"data:image/png;base64,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","ic_attach_app_ppt.png":"data:image/png;base64,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","ic_attach_app_word.png":"data:image/png;base64,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","ic_attach_app_zip.png":"data:image/png;base64,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","ic_attach_audio.png":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEgAAABICAYAAABV7bNHAAAJ00lEQVR42u2c23NbxR3HP7t7jiTf5Etk52InSkJDEhwCDaTQQMC5UEpnSgsdnjvTdvrQvjJ96UvpX9A+dehraR8YSB9KmWGm0NBC6hImpsQhMQk4iR3Alm+yZVs6Zy99OLbihFx80cUB/zzHkmaOjvZ897vf32+/uxKsxVqsRRlDLOakP7300gWgeTXegDGGjo6OKwcPHvxhPBb7tNTX9xZ5XhvQYIzBObdqwPE8D6UUAwMDLcePH38zm538XmNj8mw1AAqttezp7CSVSlUfJCHIz85yqqcHYwxCCAYHB7d2031sOJN5tq219WylAcJay8aNG9m0adOqYE8+n6fngw9QSrHz7rv5+Px5BgcHdwVB8PrFS5ee2ppOnyvF58iljvfic2sxxlTlcM6htS62affu3Txy4AC+7zM8PLz19OnTf+3t7d1TUQYtDOcco6OjaK0RQlSUOdY5mpJJpLzat1prtm3bhnOOd959l+FMZlcQBK+fOnXq0L59+z6pGIOuB6kaB/OP17UFYPv27Tz+2GPEfJ+JiYnN/Rcv/jObzT5RFYBEFf9A4Lhxokin0xx89FFisRjj4+Obj7/99rFsNttVeYCEqOpxq0in0xzq6iKRSJDJZOrffOutvw0NDT1RUYCqHrepNNrb2+nq6qK2tpbRsbH6EydOvHx5YOBo5QASUT1SnWNxTWzftInDhw5RF4HU1N3dfayvr+/o14NBi4z169dz+PBh6uvrmZycbDjd2/vyyZMnn6yMSFdLg1haabG+rY0jcyBls9nmj8+ff7W3t/fI14ZBSqnbnpNKpfjuk0/S3NxMEAR1Z8+d+0vZCsXVFv/p7sb3/dsDKSVKKZRSzMzMxMsL0CJTbrlMGmcdYRiitWZgYGDRE2ilFPF4HCGEqQCDRFUY45wjFovR2dmJNSbKbEuYT/b39xfncmUD6KpoVh4gay2+7/PAvn3LmssNXL5MGIaUn0HVGF1CUCgEBEF4XUkmsDcZZs45GpMN+L6/aGBKx6DKyw9SCpQUKCGQUhBoSz40SMENNXElBt+qzmJCgBRzYEiBkpJAG8ZzBcZyBTKTs3w0OEbP5TESMcVvfvQgcU/elEkVBShqfInrGSnwlURKgRSCUFvGpwuM5/KMTOY5+9k4/7s0xvmRHON5zZR2TApJ4AQPJ1U01CQIS/UBKgUYnpJ4SoKLHMqJ6YBLmUk+G5vmi+wsH12ZoG94kkzBMqUdMxZC38fG41BbgxMSJwQyCECEGGcRqJK2c8UatKwPlZLZUPPxZ1k+GhzjYmaK4ck8F0ZyXJ7MM+kkBSmxSkEsjk2oYioXuIgpDoSzOCcQ1t0+sy63rZVmTm3M47WeS/zhH2f5YiZk3ECgFFYpnO/jGpquBcOBhwPrFiQEV3wQOHC2bMmi4gxSSjKQmaJnLI9JtRQ7VszdrJyzVcVCw2ceiKtpqZjRXFQYRdNnIW/KIHEnaZCSAt+LtEJaew0IrngzrkiUG7+OXpZ7ha7iDCrqhHMIaxHOXnPT4gZA4BwLOeWYM++1wWiDr0NEbe2cn1ba6r5qWSzSFxsNqQVDad6Mv4YdDrAGEWowBmUNjUqwpamGeza2EGjNp8NTlKNsXT6DEMtq0PyqBC4SXjfHGLcAJeFAGIMLNcoaEjhScY8dG+pJp+rZ3FLH3nSKHRub2NBSx7/OXOG3x95fQatWIYMiLXY4Z6MMZTQy1PjOUisFHckEe3e0ck97C5uaa9nWlmTzugYSMYUUAmMdgTaEoSEfmtt2S1Uq6ZVokDIamctR70mafMmWVC0PbEuxrTVJx7p6tq9vpDVZg5ICax3aWkLjmA3MlzkpRPHx5hok7hwGBdbRURfjF0c72dXezLqGBK3JWupr/Kiqdg6tLbOBptrhrURml5MthBCExrKtLcmPj3SiA422DmMdMwX9pXOXkk1vxqD51aI7hkECMNZRKISE2rJ6tmSVDKDlz8OKvb3C+dw1DEKUzeX8yi8cVoVBKxnTLHjviq6zcJJ+3fW+9gwSVM4OX9FcbEVdLhavQQLwPYWnJM45rHWRoyklKFl0NsuhQat+ZTXmRVbqhc8n+KB/mFP9GUZyeWpiHp0dzRy9L41SsmzLT1VhkBC3dwQcUBv3+Hw0x+9e6+H1c18wbCUzsTjGU0gTkPhknBf/fYE9bfUkPHVLBonV5CgKIOYrpJqTOOuu7usRi/OMEzGPD/szPP/nE7w37cg3p3BKFY0142CGei5oTWZwlH0tibLoUskZFPcUQgpO92c4c3mEy6NTjOYKNCR80qkGHunswFdqgQPobmioTc4EvPDKe/wnLwlam1DGIIwt+kWRXeJwUpBraMAQLmDlKtWgRNynb3CUF9/4kDc+GWFAxCj4HgiJcJZYMMTO432s8wUbWupveh3f93i35yLvDM+i17fia02EYwQKEBluc0Ya1qLmVkjcamHQ9d2UiHu8e+YKz7/0Dj1eHUHbxrkh4RA28gO1gw+DgJahITanGm5etAjB+HSBwtz7523ZeVDmn8+PZ38qx/7OrdTVxCmEuqSFUEkY5CnJ52M5XnjlPXoSSQrNTXgmcgCv3lRkyFslmUo2MpUPCbRBCnHDfc/bNzSxTgdkggCUugakIo7W4WWzdLU38Mun7sdYW3INKsk2YM/zOHHmCienLWFjklgYIrVBWoO0FmkNylqktZGWOEdo3HUeztUjDA0P72rn5wfuomlkFDc1DaFGaAPaQCGAyRzNE+P8YHszv/9JF+uSNRjrlrVtuCIalJ0JCD0PaSzSmOKaVsQgiiwCqJma5PH9O0nEPQo38HwcYIzl+Wf2s3vzOv5+6iJ9Q1km8hpPCjYmE+ze0caRe7dw9L50tOMjNLCas1h6fZLG/AxjYQMIkHNDax4gR6QlamyC76Sb+ekTezHG3rIOss7x9EM7ePqhbzCSnWFsKk/Mk7Q21lJXE+2gC7XBWXt7llSzDgq14bE9aX724BX+2P0pM8kkNh5jbq8cUhvUzCwNYcBz39zMr579FrVxn1DfutedgyDUCKCloYZUshYAbS1BWBm3cQWrGlf/OwdKwq+f+zb3b23j1f+ep28kR8GBEtDkSx65bxOH927h0L1bEAICbZe0/mCMwyxI4ktdu6jqyqoArHUoIXjmwE6+v/8uhiammQ00npQ01sVpnu99HX3fqzq7GysM0PXD2hF90U1IQft8nUO0I3Xhpklxp6BTrrmYcw5tHF+FqPxs/g6LNU96jUFrDFpjUElKkWW2d41Bawxa06DVA9BXgTVLvYclDbEwDJf8bZnVFkEQlAUg3/M8Tr7/Pqd6eu5ogJxzBGGIlNIvJUDDQFgoFFbVDywtW1eiH0YZX1PYtSh//B9nzvc+JXByEAAAAABJRU5ErkJggg==","ic_attach_image.png":"data:image/png;base64,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","ic_attach_text.png":"data:image/png;base64,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","ic_action_download.png":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAD8AAAA/CAQAAAD9VthUAAABnklEQVRYw+2YP2vCQBiHEwtCQFwEXXR1Egr2C4hdHP0IdivS0UU/gNDNjq5209HF2c1FP4CLDkJBkFrIkmqfDtWYU5OWaJKK95sO3j/P3fG+d8cpipSUlJTUJYgQj7zyxE0w+Gd+9BIM/m2Dfw8G/8lWrrc/FGz9nIJXg8Ur/wXPVa9elp4sPVl6V7f5qiw9Wfly8yVe4n3D4xGeKHlSJ8wrRZ6o2+Asc8CgZmPf6svGXsMA5mTd4XsmoEX4wKo64QnTMu09d/ghO/WJ/R1PjL4ldugOX8WqMWkb/HovLs1YiKy6/b1oCmkW5H7Hk2MhRDVx311UWFtSGTw44ylhWPzXVE5t6iK6sJo66nE8KnXBU6d4jlPljpmQtoOmKIREPBodwWvmsuGOTCDJSEg9ICHiSTAQPEYkz/mPE6ErpJ9ya45XZJgK1i6Rc38khWgIiI9d31vGAA28ucgos8JZK8oeXpAUWDrAlxQ8vqHJMLGBT8j48EQ4qHKzG3x6o6DR3oO30Xx8JO2dcJuT0FdRQgd0SgE9FIlzT1yRukx9Ax0Ep3nLYXR9AAAAAElFTkSuQmCC"};
function localAttachmentIcon(name){return LOCAL_ATTACHMENT_ICONS[name]||''}

function isPdfAttachment(info){return /pdf/i.test(String(info?.mime||info?.filemime||info?.fileMIME||''))||/\.pdf(?:$|[?#])/i.test(String(info?.filename||info?.title||info?.url||info?.viewUrl||''))}
function isImageAttachment(info){return /^image\//i.test(String(info?.mime||info?.filemime||info?.fileMIME||''))||/\.(?:png|jpe?g|gif|webp|bmp|svg|heic|heif|avif|tiff?)(?:$|[?#])/i.test(String(info?.filename||info?.title||info?.url||info?.viewUrl||''))}
function isOfficeAttachment(info){return /\.(?:docx?|pptx?|xlsx?|odt|odp|ods|rtf)(?:$|[?#])/i.test(String(info?.filename||info?.title||info?.url||''))||/officedocument|msword|ms-powerpoint|ms-excel|opendocument|rtf/i.test(String(info?.mime||info?.filemime||info?.fileMIME||''))}
function imageAttachmentMime(info){const mime=String(info?.mime||info?.filemime||info?.fileMIME||'');if(/^image\//i.test(mime))return mime;const name=String(info?.filename||info?.title||info?.url||'').toLowerCase(),ext=(name.match(/\.(png|jpe?g|gif|webp|bmp|svg|heic|heif|avif|tiff?)\b/)||[])[1]||'';return ({jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',gif:'image/gif',webp:'image/webp',bmp:'image/bmp',svg:'image/svg+xml',heic:'image/heic',heif:'image/heif',avif:'image/avif',tif:'image/tiff',tiff:'image/tiff'})[ext]||'image/jpeg'}
function showPdfAttachmentOptions(info,downloadAction){
 document.getElementById('pdfAttachmentOptionsOverlay')?.remove();const overlay=document.createElement('div');overlay.id='pdfAttachmentOptionsOverlay';overlay.className='pdfAttachmentOptionsOverlay';
 const title=String(info?.displayFilename||info?.filename||info?.title||'Attachment'),viewUrl=info?.viewUrl||info?.url||'',canView=!!viewUrl&&(isPdfAttachment({...info,url:viewUrl})||isImageAttachment({...info,url:viewUrl})||!!info?.viewUrl);
 overlay.innerHTML='<m3e-dialog open class="pdfAttachmentOptions" disable-close><span slot="header">View or Download</span><div class="pdfAttachmentTitle">'+esc(title)+'</div><div slot="actions" end class="pdfAttachmentActions"><m3e-button variant="text" data-view-options-cancel>Cancel</m3e-button><m3e-button variant="tonal" data-view-options-download>Download</m3e-button><m3e-button variant="filled" data-view-options-view '+(canView?'':'disabled')+'>View</m3e-button></div></m3e-dialog>';
 document.body.appendChild(overlay);requestAnimationFrame(()=>overlay.classList.add('open'));const close=()=>{overlay.classList.remove('open');overlay.classList.add('closing');setTimeout(()=>overlay.remove(),180)};
 overlay.querySelector('[data-view-options-cancel]')?.addEventListener('click',close);overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
 overlay.querySelector('[data-view-options-download]')?.addEventListener('click',async()=>{close();try{await downloadAction()}catch(e){showAppDialog('Unable to download attachment',e?.message||String(e))}});
 overlay.querySelector('[data-view-options-view]')?.addEventListener('click',()=>{if(!canView)return;close();openSharedAttachmentViewer({...info,url:viewUrl})});
}
async function openSharedAttachmentViewer(info){if(isImageAttachment(info))return openSharedImageViewer(info);return openSharedPdfViewer(info)}
async function openSharedImageViewer(info){
 document.getElementById('sharedPdfViewerOverlay')?.remove();const root=document.createElement('section');root.id='sharedPdfViewerOverlay';root.className='sharedPdfViewerOverlay sharedImageViewer';
 root.innerHTML='<header class="sharedPdfViewerAppBar"><button type="button" data-viewer-back aria-label="Back">'+officialBackIcon()+'</button><b>'+esc(info?.displayFilename||info?.filename||'Image')+'</b><span class="sharedImageZoomLabel">100%</span></header><div class="sharedImageViewerBody"><div class="sharedPdfViewerLoading"><m3e-circular-progress-indicator indeterminate></m3e-circular-progress-indicator><span>Loading image…</span></div></div>';document.body.appendChild(root);
 let zoom=1,x=0,y=0,drag=null,closed=false,pinch=0,pinchZoom=1;const body=root.querySelector('.sharedImageViewerBody'),label=root.querySelector('.sharedImageZoomLabel');
 const close=()=>{closed=true;document.removeEventListener('keydown',key,true);root.remove()},key=e=>{if(e.key==='Escape')close();if((e.ctrlKey||e.metaKey)&&['+','=','-','0'].includes(e.key)){e.preventDefault();setZoom(e.key==='0'?1:zoom+(e.key==='-'?-.15:.15))}},apply=()=>{const img=root.querySelector('.sharedImageViewerImage');if(img)img.style.transform='translate('+x+'px,'+y+'px) scale('+zoom+')';if(label)label.textContent=Math.round(zoom*100)+'%'},setZoom=z=>{zoom=Math.max(1,Math.min(5,z));if(zoom===1)x=y=0;apply()};
 root.querySelector('[data-viewer-back]')?.addEventListener('click',close);document.addEventListener('keydown',key,true);body.addEventListener('wheel',e=>{if(e.ctrlKey||e.metaKey){e.preventDefault();setZoom(zoom+(e.deltaY<0?.15:-.15))}},{passive:false});
 body.addEventListener('pointerdown',e=>{if(zoom>1&&e.button===0){drag={x:e.clientX,y:e.clientY,tx:x,ty:y};body.setPointerCapture?.(e.pointerId)}});body.addEventListener('pointermove',e=>{if(drag){x=drag.tx+e.clientX-drag.x;y=drag.ty+e.clientY-drag.y;apply()}});body.addEventListener('pointerup',()=>drag=null);body.addEventListener('pointercancel',()=>drag=null);
 body.addEventListener('touchstart',e=>{if(e.touches.length===2){e.preventDefault();pinch=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);pinchZoom=zoom}},{passive:false});body.addEventListener('touchmove',e=>{if(e.touches.length===2&&pinch){e.preventDefault();setZoom(pinchZoom*Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY)/pinch)}},{passive:false});
 try{const url=info?.viewUrl||info?.url;if(!url)throw new Error('Schoology did not provide an image URL.');const file=await A.annotationRequest({url,binary:true});if(!file?.base64)throw new Error('Schoology did not return image data.');if(closed)return;body.innerHTML='<img class="sharedImageViewerImage" alt="'+esc(info?.filename||'Image')+'" src="data:'+esc(imageAttachmentMime(info))+';base64,'+file.base64+'">';setZoom(1)}catch(e){if(!root.isConnected)return;body.innerHTML='<div class="sharedPdfViewerError"><b>Unable to view image</b><p>'+esc(e?.message||String(e))+'</p><m3e-button data-viewer-back variant="filled">Back</m3e-button></div>';root.querySelector('[data-viewer-back]')?.addEventListener('click',close)}
}
async function openSharedPdfViewer(info){
 document.getElementById('sharedPdfViewerOverlay')?.remove();const root=document.createElement('section');root.id='sharedPdfViewerOverlay';root.className='sharedPdfViewerOverlay';
 root.innerHTML='<header class="sharedPdfViewerAppBar"><button type="button" data-viewer-back aria-label="Back">'+officialBackIcon()+'</button><b>'+esc(info?.displayFilename||info?.filename||'PDF document')+'</b><span class="sharedPdfViewerControls"><m3e-button variant="tonal" size="small" data-pdf-out>−</m3e-button><m3e-button variant="tonal" size="small" data-pdf-reset>100%</m3e-button><m3e-button variant="tonal" size="small" data-pdf-in>+</m3e-button></span></header><div class="sharedPdfViewerPages"><div class="sharedPdfViewerLoading"><m3e-circular-progress-indicator indeterminate></m3e-circular-progress-indicator><span>Loading PDF…</span></div></div>';document.body.appendChild(root);
 let pdf=null,scale=1,closed=false;const pages=root.querySelector('.sharedPdfViewerPages'),close=()=>{closed=true;document.removeEventListener('keydown',key,true);root.remove()};
 const render=async()=>{if(!pdf||closed)return;pages.innerHTML='';for(let n=1;n<=pdf.numPages;n++){if(closed)return;const page=await pdf.getPage(n),viewport=page.getViewport({scale:scale*1.25}),canvas=document.createElement('canvas');canvas.className='sharedPdfPageCanvas';canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);const wrap=document.createElement('div');wrap.className='sharedPdfPage';wrap.appendChild(canvas);pages.appendChild(wrap);await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise}};
 const setScale=z=>{scale=Math.max(.5,Math.min(3,z));const b=root.querySelector('[data-pdf-reset]');if(b)b.textContent=Math.round(scale*100)+'%';render().catch(e=>showAppDialog('Unable to render PDF',e?.message||String(e)))},key=e=>{if(e.key==='Escape')close();if((e.ctrlKey||e.metaKey)&&['+','=','-','0'].includes(e.key)){e.preventDefault();setScale(e.key==='0'?1:scale+(e.key==='-'?-.1:.1))}};
 root.querySelector('[data-viewer-back]')?.addEventListener('click',close);root.querySelector('[data-pdf-in]')?.addEventListener('click',()=>setScale(scale+.15));root.querySelector('[data-pdf-out]')?.addEventListener('click',()=>setScale(scale-.15));root.querySelector('[data-pdf-reset]')?.addEventListener('click',()=>setScale(1));pages.addEventListener('wheel',e=>{if(e.ctrlKey||e.metaKey){e.preventDefault();setScale(scale+(e.deltaY<0?.1:-.1))}},{passive:false});document.addEventListener('keydown',key,true);
 try{const url=info?.viewUrl||info?.url;if(!url)throw new Error('Schoology did not provide a PDF URL.');const script=[...document.scripts].find(s=>/renderer\.js(?:[?#]|$)/i.test(s.getAttribute('src')||'')),base=script?.getAttribute('src')?new URL('.',new URL(script.getAttribute('src'),location.href)):new URL('.',location.href);const pdfjs=await import(new URL('../node_modules/pdfjs-dist/build/pdf.mjs',base).href);pdfjs.GlobalWorkerOptions.workerSrc=new URL('../node_modules/pdfjs-dist/build/pdf.worker.mjs',base).href;const file=await A.annotationRequest({url,binary:true});if(!file?.base64)throw new Error('Schoology did not return PDF data.');pdf=await pdfjs.getDocument({data:Uint8Array.from(atob(file.base64),c=>c.charCodeAt(0))}).promise;if(!closed)await render()}catch(e){if(closed||!root.isConnected)return;pages.innerHTML='<div class="sharedPdfViewerError"><b>Unable to view PDF</b><p>'+esc(e?.message||String(e))+'</p><m3e-button data-viewer-back variant="filled">Back</m3e-button></div>';root.querySelector('[data-viewer-back]')?.addEventListener('click',close)}
}

function renderAttachments(a,submissionContext=null){
  if(!a)return '';
  const rows=[],media=[];
  const addFile=(f)=>{
    const viewUrl=f?.file_converted_download_url||f?.fileConvertedDownloadURL||f?.converted_download_path||f?.convertedDownloadPath||f?.converted_url||f?.convertedUrl||f?.convertedDownloadURL||'';
    const url=f?.file_download_url||f?.fileDownloadURL||f?.download_path||f?.downloadPath||f?.resolveDownloadUrl||f?.resolve_download_url||f?.download_url||f?.downloadUrl||viewUrl||f?.url;
    if(!url)return;
    const title=(f.title||f.fileTitle||f.filename||f.fileName||'File').trim();
    const mime=f.filemime||f.fileMIME||f.converted_filemime||f.convertedFileMime||'application/octet-stream';
    const ctx=submissionContext&&f?.id?' data-submission-file-id="'+esc(f.id)+'" data-submission-revision-id="'+esc(submissionContext.revisionId||'')+'" data-submission-submission-id="'+esc(submissionContext.submissionId||'')+'" data-submission-section-id="'+esc(submissionContext.sectionId||'')+'" data-submission-grade-item-id="'+esc(submissionContext.gradeItemId||'')+'" data-submission-user-id="'+esc(submissionContext.userId||'')+'"':'';
    rows.push('<m3e-list-action class="attachmentSegmentedItem fileAttachment" tabindex="0" data-download-url="'+esc(url)+'" data-pdf-view-url="'+esc(viewUrl)+'" data-download-name="'+esc(title)+'" data-download-mime="'+esc(mime)+'"'+ctx+'><span slot="leading" class="attachmentFileIcon"><img src="'+localAttachmentIcon(mimeIconForFilename(title,mime))+'" alt=""></span><span class="attachmentFileText"><b>'+esc(title)+'</b><small>'+esc((mime||'File').split('/').pop().toUpperCase())+'</small></span><span slot="trailing" class="attachmentDownloadIcon"><img src="'+localAttachmentIcon('ic_action_download.png')+'" alt=""></span></m3e-list-action>');
    const fileId=f?.id||f?.file_id||f?.fileId;
    if(submissionContext?.allowAnnotation&&fileId&&(String(mime).toLowerCase().includes('pdf')||/\.pdf$/i.test(title))){
      rows.push('<m3e-list-action class="attachmentSegmentedItem annotationLaunchButton" tabindex="0" data-annotate-pdf data-annotate-url="'+esc(url)+'" data-annotate-file-id="'+esc(fileId)+'" data-annotate-file-type="'+esc(f.fileType||f.file_type||mime)+'" data-annotate-name="'+esc(title)+'" data-annotate-section-id="'+esc(submissionContext.sectionId||'')+'" data-annotate-assignment-id="'+esc(submissionContext.assignmentId||submissionContext.gradeItemId||'')+'"><span slot="leading" class="m3eOriginalIcon">'+schoologyNavIcon('materials')+'</span><span class="attachmentFileText"><b>Annotate PDF</b><small>'+esc(title)+'</small></span><span slot="trailing" class="m3eOriginalIcon">'+originalM3Icon('chevron_right')+'</span></m3e-list-action>');
    }

  };
  const addLink=(url,title)=>{if(url)rows.push('<m3e-list-action class="attachmentSegmentedItem" tabindex="0" data-open-url="'+esc(url)+'"><span slot="leading" class="m3eOriginalIcon">'+originalM3Icon('link')+'</span><span>'+esc(title||url)+'</span><span slot="trailing" class="m3eOriginalIcon">'+originalM3Icon('chevron_right')+'</span></m3e-list-action>')};
  const walk=(v)=>{
    if(!v)return;
    if(Array.isArray(v)){v.forEach(walk);return}
    if(typeof v!=='object')return;
    const files=v.files?.file||v.files?.list||v.files||v['file-attachment']||v.file;
    if(files){const list=Array.isArray(files)?files:(files.file||files.list||[files]);list.filter(x=>x&&typeof x==='object').forEach(addFile)}
    const type=String(v.type||v.attachmentType||'').toLowerCase();
    const title=v.title||v.fileTitle||v.fileName||v.linkTitle||v.videoTitle||'Attachment';
    if(type==='file'||v.download_path||v.downloadPath||v.converted_download_path||v.convertedDownloadPath||v.resolveDownloadUrl||v.fileDownloadURL){addFile(v)}
    else if(v.thumbnail||v.fileThumbnailURL||v.videoThumbnailURL){const thumb=v.thumbnail||v.fileThumbnailURL||v.videoThumbnailURL;media.push('<img class="activityMediaImage authenticatedMediaImage" data-media-image-url="'+esc(normalizeImageUrl(thumb))+'" alt="'+esc(title)+'" loading="lazy" style="display:none">')}
    if(type!=='file')addLink(v.linkURL||v.linkUrl||((type==='link'||type==='web_content')?v.url:null),title);
    for(const k of ['attachment','file','link','video','embed','links','videos'])if(v[k])walk(v[k]);
  };
  walk(a);
  if(!rows.length&&!media.length)return '';
  return '<div class="activityMedia">'+(rows.length?'<m3e-action-list variant="segmented" class="attachmentSegmentedList">'+rows.join('')+'</m3e-action-list>':'')+media.join('')+'</div>';
}

async function hydrateMediaImages(root=document){
  const els=root.querySelectorAll?.('[data-media-image-url]')||[];
  await Promise.all([...els].map(async el=>{
    const u=el.getAttribute('data-media-image-url');try{const data=await A.fetchImage(u);if(data){el.src=data;el.style.display='block';if(el.nextElementSibling)el.nextElementSibling.style.display='none'}}catch{}
  }));
  root.querySelectorAll?.('[data-open-url]')?.forEach(b=>{if(b.dataset.boundOpen)return;b.dataset.boundOpen='1';b.onclick=()=>openWithPressTransition(b,()=>showEmbeddedWeb(b.dataset.openUrl,'Attachment'))});
  root.querySelectorAll?.('[data-annotate-pdf]')?.forEach(button=>{if(button.dataset.boundAnnotate)return;button.dataset.boundAnnotate='1';button.onclick=async()=>{if(!window.schoologyAnnotationEditor?.open){showAppDialog('Annotation unavailable','The PDF annotation editor did not load.');return;}try{await window.schoologyAnnotationEditor.open({sectionId:button.dataset.annotateSectionId,assignmentId:button.dataset.annotateAssignmentId,fileId:button.dataset.annotateFileId,fileType:button.dataset.annotateFileType,pdfUrl:button.dataset.annotateUrl,filename:button.dataset.annotateName,onSubmitted:async()=>{await openAssignmentSubmissions(button.dataset.annotateSectionId,button.dataset.annotateAssignmentId,state.assignmentData||{},false)}})}catch(error){showAppDialog('Unable to open annotation editor',error?.message||String(error))}}});
  root.querySelectorAll?.('[data-download-url]')?.forEach(b=>{if(b.dataset.boundDownload)return;b.dataset.boundDownload='1';b.onclick=async()=>{try{let info={url:b.dataset.downloadUrl,viewUrl:b.dataset.pdfViewUrl||'',filename:b.dataset.downloadName,mime:b.dataset.downloadMime};if(b.dataset.submissionFileId&&b.dataset.submissionRevisionId&&b.dataset.submissionSectionId&&b.dataset.submissionGradeItemId&&b.dataset.submissionUserId){const rr=await A.api({path:`sections/${b.dataset.submissionSectionId}/submissions/${b.dataset.submissionSubmissionId||b.dataset.submissionGradeItemId}/${b.dataset.submissionUserId}/revision/${b.dataset.submissionRevisionId}`,params:{with_annotations:'TRUE',with_attachments:'TRUE'}});const revisions=rr?.revision||rr?.revisions||rr?.data?.revision||rr?.data?.revisions||[];const list=Array.isArray(revisions)?revisions:[revisions];let exact=null;for(const rv of list){const files=rv?.attachments?.files?.file||rv?.attachments?.files||rv?.attachments?.file||[];const fs=Array.isArray(files)?files:(files?[files]:[]);const hit=fs.find(f=>String(f?.id??f?.fid??'')===String(b.dataset.submissionFileId));if(hit){exact=hit;break;}}if(exact){const convertedOk=['success','converted','1'].includes(String(exact.converted_status??exact.convertedStatus??'').toLowerCase());const rawUrl=exact.download_path||exact.downloadPath||'';const convertedUrl=exact.converted_download_path||exact.convertedDownloadPath||'';info.url=convertedOk&&convertedUrl?convertedUrl:(rawUrl||convertedUrl);info.filename=(convertedOk&&exact.convertedFilename)||exact.filename||exact.title||info.filename;info.mime=(convertedOk&&exact.convertedFileMime)||exact.filemime||info.mime;}}const download=async()=>{const r=await downloadWithFeedback(b,info);const err=await A.openDownloadedFile({path:r.path});if(err)throw new Error(err)};if(isPdfAttachment(info)||isImageAttachment(info)||isOfficeAttachment(info)){showPdfAttachmentOptions(info,download);return}await download()}catch(e){showAppDialog('Unable to open file',e?.message||String(e))}}});
}
function materialIconForType(item){
 const type=String(item?.type||item?.template_type||'').toLowerCase();
 const docType=String(item?.document_type||item?.documentType||item?.template_document_type||item?.templateDocumentType||item?.template_fields?.document_type||item?.template_fields?.documentType||'').toLowerCase();
 if(type==='folder'){const color=String(item?.color||item?.folder_color||item?.folderColor||'gray').toLowerCase();const allowed=['black','blue','gray','green','orange','pink','purple','red','yellow'];return `ic_folder_${allowed.includes(color)?color:'gray'}.png`;}
 if(type==='assignment')return 'ic_assignment.png';
 if(type==='discussion')return 'ic_discussion.png';
 if(type==='assessment')return 'ic_test_quiz.png';
 if(type==='assessment_v2'||type==='managed_assessment'||type==='quiz')return 'ic_assessment_48dp.png';
 if(type==='page')return 'ic_pages.png'; if(type==='album')return 'ic_albums.png'; if(type==='scorm')return 'ic_scorm.png';
 if(type==='web_content'||docType==='external_tool')return 'ic_web_content.png';
 if(type==='document'||docType){
   if(docType==='link')return 'ic_files_links.png';
   if(docType==='embed')return 'attachment_link_icon.png';
   if(docType==='external_tool')return 'ic_external_tool.png';
   if(docType==='file'){const f=item?.filename||item?.fileName||item?.title||item?.filemime||item?.fileMIME||'';return mimeIconForFilename(f,item?.filemime||item?.fileMIME||'');}
 }
 return mimeIconForFilename(item?.filename||item?.fileName||item?.title||'');
}
function mimeIconForFilename(name,mime=''){
 const n=String(name||'').toLowerCase();
 const mt=String(mime||'').toLowerCase().split(';')[0].trim();
 if(/\.(mp3|wav|m4a|aac|ogg|flac|mp4|mov|avi|webm|mkv)$/.test(n))return 'ic_attach_audio.png';
 if(/\.(txt|csv|rtf)$/.test(n))return 'ic_attach_text.png';
 if(/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/.test(n))return 'ic_attach_image.png';
 if(/\.pdf$/.test(n)||mt==='application/pdf')return 'ic_attach_app_pdf.png';
 if(/\.(ppt|pptx|odp)$/.test(n)||mt.includes('presentation')||mt.includes('powerpoint'))return 'ic_attach_app_ppt.png';
 if(/\.(xls|xlsx|ods)$/.test(n)||mt.includes('spreadsheet')||mt.includes('excel'))return 'ic_attach_app_excel.png';
 if(/\.(doc|docx|odt)$/.test(n)||mt.includes('word')||mt.includes('msword')||mt.includes('officedocument.word'))return 'ic_attach_app_word.png';
 if(/\.(zip|rar|7z|tar|gz)$/.test(n))return 'ic_attach_app_zip.png';
 return 'attachment_document_icon.png';
}

function extensionFromMime(mime){const m=String(mime||'').toLowerCase().split(';')[0].trim();const map={'image/jpeg':'jpg','image/png':'png','image/gif':'gif','image/webp':'webp','image/svg+xml':'svg','audio/mpeg':'mp3','audio/mp4':'m4a','audio/wav':'wav','video/mp4':'mp4','video/webm':'webm','application/pdf':'pdf','application/zip':'zip','application/x-zip-compressed':'zip','application/msword':'doc','application/vnd.openxmlformats-officedocument.wordprocessingml.document':'docx','application/vnd.ms-excel':'xls','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':'xlsx','application/vnd.ms-powerpoint':'ppt','application/vnd.openxmlformats-officedocument.presentationml.presentation':'pptx','text/plain':'txt','text/csv':'csv'};return map[m]||'';}
function extensionFromUrl(url){try{const p=new URL(String(url),location.href).pathname.split('/').pop()||'';const m=p.match(/\.([A-Za-z0-9]{1,8})$/);return m?m[1]:''}catch{return''}}
async function loadFolder(course,folderId,push=true,title='Materials'){
  const el=document.getElementById('sectionProfileContent');if(!el)return;
  const sid=course.id||course.section_id||course.sectionId;
  if(push && Number(folderId||0)!==0){
    state.folderStack.push({id:state.currentFolderId||0,title:'Previous folder'});
  }
  state.currentFolderId=folderId||0;
  state.courseTab='materials';
  syncToolbar();
  const previousTitle=title||'Materials';
  el.innerHTML=`${folderId?'<button class="materialBackRow" id="materialBack"><span class="materialIcon">‹</span><span><b>Back to previous folder</b></span></button>':''}<div class="folderLoadingState"><m3e-circular-progress-indicator indeterminate class="m3eInlineProgress" aria-label="Loading"></m3e-circular-progress-indicator><b>Loading ${esc(previousTitle)}…</b><small>Schoology is loading this folder.</small></div>`;
  el.querySelector('#materialBack')?.addEventListener('click',()=>navigateBack());
  try{ const x=await A.api({path:`courses/${sid}/folder/${folderId||0}`,params:{}});
  const items=x['folder-item']||x.folder_item||x.folderItems||x.items||[];
  const parent=folderId?'<button class="materialBackRow" id="materialBack"><span class="materialIcon">‹</span><span><b>Back to previous folder</b></span></button>':'';
  const rows=items.map((f,i)=>{
    const type=String(f.type||'');
    const icon=materialIconForType(f);
    return `<button class="materialRow" data-material-index="${i}"><span class="materialIcon officialMaterialIcon"><img src="../assets/icons/${icon}" alt=""></span><span><b>${esc(f.title||'Untitled')}</b></span><span>›</span></button>`;
  }).join('');
  el.innerHTML=`${parent}${items.length?`<m3e-action-list variant="segmented" class="materialList">${items.map((f,i)=>{const icon=materialIconForType(f);return `<m3e-list-action data-material-index="${i}" tabindex="0"><span slot="leading" class="m3eOriginalIcon officialMaterialIcon"><img src="../assets/icons/${icon}" alt=""></span><span>${esc(f.title||'Untitled')}</span><span slot="trailing" class="m3eOriginalIcon">${originalM3Icon('chevron_right')}</span></m3e-list-action>`}).join('')}</m3e-action-list>`:'<div class="empty"><h2>This folder is empty</h2></div>'}`;
  window.__schoologyFolderItems=items;
  document.getElementById('materialBack')?.addEventListener('click',()=>navigateBack());
  document.querySelectorAll('[data-material-index]').forEach(b=>b.onclick=async()=>{
    const f=window.__schoologyFolderItems[+b.dataset.materialIndex];
    if(String(f.type)==='folder'){loadFolder(course,f.id,true,f.title||'Folder').catch(e=>showSchoologyRequestError(e,()=>loadFolder(course,f.id,false,f.title||'Folder')));return}
    if(String(f.type)==='assignment'){showAssignment(sid,f.id);return}
    if(String(f.type||f.template_type||'').toLowerCase()==='discussion'){const did=f.discussion_id??f.discussionId??f.id??f.template_id??f.templateID;if(did!=null){openWithPressTransition(b,()=>showDiscussionNative('sections',sid,did,f.title||f.template_title||'Discussion'));return}}
    const directDocType=String(f.document_type||f.documentType||'').toLowerCase();
    const target=f.web_url||f.webUrl||f.url||f.href||f.launch_url||f.launchUrl||f.location;
    // Android FolderItem maps link/video documents to ACTION_VIEW, while embed
    // and external_tool documents use their dedicated WebView activities.
    if(directDocType==='link'||directDocType==='video'||String(f.type).toLowerCase()==='link'){
      try{const d=await A.api({path:`sections/${sid}/documents/${f.id}`,params:{}});const data=d?.document||d;const aa=data?.attachments||data?.attachment||{};const ll=aa?.links?.link||aa?.links||aa?.link||[];const link=Array.isArray(ll)?ll[0]:ll;const vv=aa?.videos?.video||aa?.videos||[];const video=Array.isArray(vv)?vv[0]:vv;const u=link?.url||link?.link_url||link?.linkURL||link?.href||video?.url||video?.video_url||data?.web_url||data?.webUrl;if(u){await A.prepareWebSession();showEmbeddedWeb(u,data?.title||f.title||'Link');return}}catch(e){console.warn('Unable to resolve course-material link:',e)}
      if(target && !/api\.schoology\.com\/v1\/sections\/\d+\/documents\/\d+/i.test(target)){await A.prepareWebSession();showEmbeddedWeb(target,f.title||'Link');return}alert('Schoology did not provide a valid destination URL for this link.');return;
    }
    if(directDocType==='embed'||directDocType==='external_tool'||String(f.type).toLowerCase()==='external_tool'||String(f.type).toLowerCase()==='embed'){
      if(target){await A.prepareWebSession();showEmbeddedWeb(target,f.title||'Resource');return}
    }
    if(['assessment','assessment_v2','managed_assessment','quiz'].includes(String(f.type))){(async()=>{try{await A.prepareWebSession();showEmbeddedWeb(`https://app.schoology.com/assignment/${f.id}`,f.title||'Assessment')}catch(e){alert(e.message)}})();return}
    (async()=>{try{
      let data=f; let fileUrl=f.download_path||f.downloadPath||f.converted_download_path||f.convertedDownloadPath||f.file_url||f.fileUrl||f.download_url||f.downloadUrl||f.location||f.url; if(!fileUrl){const aa=f.attachments||f.attachment||{};const ff=aa.files?.file||aa.files||aa.file||[];const af=Array.isArray(ff)?ff[0]:ff;fileUrl=af?.converted_download_path||af?.convertedDownloadPath||af?.download_path||af?.downloadPath||af?.resolveDownloadUrl||af?.url||'';if(af)data={...f,...af};}
      if(String(f.type)==='document'){
        const d=await A.api({path:`sections/${sid}/documents/${f.id}`,params:{}});
        data=d?.document||d;
        const tmpl=data.template||data.document||{};
        const docType=String(data.document_type||data.documentType||f.document_type||f.documentType||data.template_document_type||data.templateDocumentType||tmpl.document_type||tmpl.documentType||'').toLowerCase();
        const links=data.attachments?.links?.link||data.attachments?.links||data.attachment?.links?.link||data.attachment?.links||[];
        const linkObj=Array.isArray(links)?links[0]:links;
        const linkUrl=data.web_url||data.webUrl||data.url||data.href||f.web_url||f.webUrl||f.url||f.href||linkObj?.link_url||linkObj?.linkURL||tmpl.url||tmpl.web_url||tmpl.webUrl||tmpl.href||'';
        const documentTarget=linkUrl||data.location||data.launch_url||data.launchUrl;
        if(docType==='link'||docType==='video'){
          if(documentTarget && !/api\.schoology\.com\/v1\/sections\/\d+\/documents\/\d+/i.test(documentTarget)){await A.prepareWebSession();showEmbeddedWeb(documentTarget,data.title||f.title||'Link');return}
          const aa2=data?.attachments||data?.attachment||{};const ll2=aa2?.links?.link||aa2?.links||aa2?.link||[];const link2=Array.isArray(ll2)?ll2[0]:ll2;const u2=link2?.url||link2?.link_url||link2?.linkURL||link2?.href;if(u2){await A.prepareWebSession();showEmbeddedWeb(u2,data.title||f.title||'Link');return}
        }
        if(docType==='external_tool'||docType==='embed'){
          if(documentTarget){await A.prepareWebSession();showEmbeddedWeb(documentTarget,data.title||f.title||'Resource');return}
        }
        const a=data.attachments||data.attachment||{}; const files=a.files?.file||a.files||a.file||[]; const first=Array.isArray(files)?files[0]:files; fileUrl=first?.converted_download_path||first?.convertedDownloadPath||first?.download_path||first?.downloadPath||first?.url||fileUrl;
      }
      if(!fileUrl){ if(data.web_url||data.webUrl){await A.prepareWebSession();showEmbeddedWeb(data.web_url||data.webUrl,data.title||f.title||'Document');return} throw new Error('Schoology did not provide a downloadable file URL.'); }
      const rawName=data.filename||data.fileName||data.title||f.title||'Schoology file'; const mime=data.filemime||data.fileMIME||data.converted_filemime||data.convertedFileMime||f.filemime||f.fileMIME||'application/octet-stream'; const ext=data.file_extension||data.fileExtension||data.extension||data.converted_extension||data.convertedExtension||f.file_extension||f.fileExtension||f.extension||f.converted_extension||f.convertedExtension||extensionFromUrl(fileUrl)||extensionFromMime(mime); const filename=/\.[A-Za-z0-9]{1,8}$/.test(rawName)?rawName:(ext?rawName+'.'+String(ext).replace(/^\./,''):rawName); const r=await downloadWithFeedback(b,{url:fileUrl,filename,mime});const err=await A.openDownloadedFile({path:r.path});if(err)alert(err)
    }catch(e){alert('Unable to open file: '+e.message)}})();return
  });
  }catch(e){showSchoologyRequestError(e,()=>loadFolder(course,folderId,false,title));}
}

function showSchoologyRequestError(error,retry){
 const msg=String(error?.message||error||'Schoology could not load this page.');document.getElementById('schoologyNetworkError')?.remove();
 const isTimeout=/timed out|timeout|network|ECONN|ENOTFOUND|ERR_/i.test(msg);
 const wrap=document.createElement('div');wrap.id='schoologyNetworkError';wrap.className='schoologyErrorOverlay';wrap.innerHTML=`<m3e-dialog open class="schoologyErrorDialog" disable-close><span slot="header">${isTimeout?'Schoology is taking longer than expected':'Schoology could not load this page'}</span><div class="schoologyErrorSpinner"><m3e-circular-progress-indicator indeterminate class="m3eInlineProgress" aria-label="Loading"></m3e-circular-progress-indicator></div><p>${isTimeout?'The connection is slow or temporarily unavailable. Your course is still open.':esc(msg)}</p><div slot="actions" end class="schoologyErrorActions"><m3e-button id="schoologyErrorRetry" variant="filled">Retry</m3e-button><m3e-button id="schoologyErrorClose2" variant="text">Back</m3e-button></div></m3e-dialog>`;
 document.body.appendChild(wrap);const close=()=>{state.assignmentSubpage=null;wrap.remove();syncToolbar()};wrap.querySelector('#schoologyErrorClose2')?.addEventListener('click',close);wrap.querySelector('#schoologyErrorRetry')?.addEventListener('click',async()=>{close();if(retry){try{await retry()}catch(e){showSchoologyRequestError(e,retry)}}});
}
window.schoologyShowError=showSchoologyRequestError;

function openWithPressTransition(el,fn){if(!el){fn();return;}el.classList.add('pressTransition');setTimeout(()=>{el.classList.remove('pressTransition');fn()},110)}
async function resolveAssignmentSection(assignmentId){
 const id=Number(assignmentId); if(!id)return 0;
 const cached=window.__schoologyDashboardCourses||window.__schoologyCourses||[];
 const candidates=cached.length?cached.slice():[];
 if(!candidates.length){
   const uid=state.auth?.userId||state.auth?.user?.id;
   if(uid){try{const x=await A.api({path:`users/${uid}/sections`,params:{limit:100}});candidates.push(...(x.section||x.sections||[]));}catch{}}
 }
 const ids=[...new Set(candidates.map(x=>Number(x.id||x.section_id||x.sectionId)).filter(Boolean))];
 for(const sid of ids){
   try{const x=await A.api({path:`sections/${sid}/assignments/${id}`,params:{richtext:1,with_attachments:'TRUE'}});if(x&&(x.assignment||x.id||x.assignment_id))return sid}catch{}
 }
 return 0;
}
function isSchoologyRoutableLink(rawUrl){
 try{const u=new URL(rawUrl);const host=u.hostname.toLowerCase();return u.protocol.toLowerCase()==='schoology:'||host==='lms.lausd.net'||host.endsWith('.schoology.com')}catch{return false}
}
async function handleIncomingSchoologyDeepLink(url){
  if(!url)return;
  if(state.screen!=='app'||!state.auth){pendingDeepLinkAfterLogin=url;return}
  try{if(await routeSchoologyLink(url))return;await showEmbeddedWeb(url,'Schoology Link',{allowBrowser:false})}
  catch(error){showAppDialog('Unable to open Schoology link',error.message||String(error))}
}
async function findCourseDocumentInFolders(sectionId,documentId,maxDepth=4){
 const seen=new Set();
 async function visit(folderId,depth){
  if(depth>maxDepth||seen.has(String(folderId)))return null;seen.add(String(folderId));
  let response;try{response=await A.api({path:"courses/"+sectionId+"/folder/"+(folderId||0),params:{}})}catch{return null}
  const items=response?.["folder-item"]||response?.folder_item||response?.folderItems||response?.items||[];
  for(const item of items){const id=Number(item.id??item.document_id??item.documentId??item.template_id??item.templateID??0);if(id===Number(documentId)&&String(item.type||"").toLowerCase()!=="folder")return item;}
  for(const item of items){if(String(item.type||"").toLowerCase()!=="folder")continue;const folder=Number(item.id??item.folder_id??item.folderId??item.template_id??item.templateID??0);if(folder){const found=await visit(folder,depth+1);if(found)return found;}}
  return null;
 }
 return visit(0,0);
}
async function resolveDocumentSection(documentId){
 const uid=state.auth?.userId||state.auth?.user?.id;let candidates=[...(window.__schoologyDashboardCourses||[]),...(window.__schoologyCourses||[])];
 if(!candidates.length&&uid){try{const x=await A.api({path:"users/"+uid+"/sections",params:{limit:200}});candidates=x?.section||x?.sections||[]}catch{}}
 const ids=[...new Set(candidates.map(x=>Number(x.id||x.section_id||x.sectionId)).filter(Boolean))];
 for(const sid of ids){try{const response=await A.api({path:"sections/"+sid+"/documents/"+Number(documentId),params:{}});const doc=response?.document||response;if(doc&&(doc.id||doc.document_id||doc.title||doc.attachments||doc.attachment))return {sectionId:sid,document:doc};}catch{}const item=await findCourseDocumentInFolders(sid,documentId);if(item)return {sectionId:sid,document:item};}
 return null;
}
async function downloadDeepLinkedFile(info){
 const progressId="deep-link-"+Date.now()+"-"+Math.random().toString(36).slice(2);
 const wrap=document.createElement("div");wrap.id="deepLinkDownloadDialog";wrap.className="deepLinkDownloadOverlay";
 wrap.innerHTML=m3eTheme('<m3e-dialog open class="deepLinkDownloadDialog" disable-close><span slot="header">Opening file</span><div class="deepLinkDownloadBody"><div id="deepLinkDownloadStatus">Preparing download…</div><m3e-linear-progress-indicator id="deepLinkDownloadProgress" indeterminate></m3e-linear-progress-indicator></div></m3e-dialog>',"deepLinkDownloadTheme");
 document.body.appendChild(wrap);
 const status=wrap.querySelector("#deepLinkDownloadStatus"),bar=wrap.querySelector("#deepLinkDownloadProgress");
 const stop=A.onFileDownloadProgress?.(data=>{if(!data||data.id!==progressId)return;if(data.total>0){const value=Math.min(100,Math.round(data.received*100/data.total));bar?.removeAttribute("indeterminate");if(bar)bar.value=value;if(status)status.textContent="Downloading… "+value+"%";}else if(status)status.textContent="Downloading file…";});
 try{const result=await A.downloadFile({...info,progressId});if(status)status.textContent="Download complete. Opening file…";if(bar){bar.removeAttribute("indeterminate");bar.value=100;}wrap.remove();const error=await A.openDownloadedFile({path:result.path});if(error)throw new Error(error);}
 finally{stop?.();wrap.remove();}
}
async function openCourseDocumentDeepLink(sectionId,documentId,rawUrl){
 let sid=Number(sectionId)||0,doc=null;
 if(sid){try{const response=await A.api({path:"sections/"+sid+"/documents/"+Number(documentId),params:{}});doc=response?.document||response}catch{}}
 if(!doc||!(doc.id||doc.document_id||doc.title||doc.attachments||doc.attachment)){
  if(sid)doc=await findCourseDocumentInFolders(sid,documentId);
  else{const found=await resolveDocumentSection(documentId);if(found){sid=found.sectionId;doc=found.document;}}
 }
 if(!doc){showAppDialog("Unable to open course file","Schoology could not find this document in your courses or course folders.");return true;}
 const title=resourceTitle(doc)||doc.title||"Course file",dt=resourceDocumentType(doc)||String(doc.document_type||doc.documentType||doc.template_document_type||doc.templateDocumentType||"").toLowerCase(),type=resourceType(doc)||String(doc.type||doc.template_type||"").toLowerCase();
 const link=firstAttachment(doc,"links"),video=firstAttachment(doc,"videos"),embed=firstAttachment(doc,"embeds"),file=firstAttachment(doc,"files");
 const linkUrl=link?.url||link?.link_url||link?.linkURL||link?.href||video?.url||video?.video_url||doc.web_url||doc.webUrl||doc.url||doc.href||doc.link_url||doc.linkURL;
 if((dt==="link"||dt==="video"||type==="link"||type==="video")&&linkUrl){await A.prepareWebSession();showEmbeddedWeb(normalizeSchoologyWebUrl(linkUrl),title);return true;}
 if(dt==="embed"||type==="embed"){const code=embed?.embed_code||embed?.embedCode||doc.embed_code||doc.embedCode;if(code){showEmbeddedWeb("data:text/html;charset=utf-8,"+encodeURIComponent(code),title,{allowBrowser:false});return true;}}
 if(dt==="external_tool"||type==="external_tool"){const url=doc.launch_url||doc.launchUrl||doc.web_url||doc.webUrl||doc.url||doc.href||linkUrl;if(url){await A.prepareWebSession();showEmbeddedWeb(url,title,{allowBrowser:false,lti:true});return true;}}
 if(["assignment","assessment","assessment_v2","managed_assessment","quiz"].includes(type)){const id=Number(doc.id||doc.assignment_id||doc.assignmentId||documentId);if(type==="assignment"&&sid){showAssignment(sid,id);return true;}await A.prepareWebSession();showEmbeddedWeb("https://app.schoology.com/assignment/"+id,title,{allowBrowser:false,quiz:true,assessment:true});return true;}
 const fileUrl=file?.resolveDownloadUrl||file?.resolve_download_url||file?.file_download_url||file?.fileDownloadURL||file?.converted_download_path||file?.convertedDownloadPath||file?.download_path||file?.downloadPath||file?.url||doc.resolveDownloadUrl||doc.resolve_download_url||doc.converted_download_path||doc.convertedDownloadPath||doc.download_path||doc.downloadPath||doc.file_url||doc.fileUrl||doc.download_url||doc.downloadUrl||doc.location;
 if(fileUrl){const rawName=file?.filename||file?.fileName||doc.filename||doc.fileName||doc.title||title||"Schoology file";const mime=file?.filemime||file?.fileMIME||file?.converted_filemime||file?.convertedFileMime||doc.filemime||doc.fileMIME||doc.converted_filemime||doc.convertedFileMime||"application/octet-stream";const ext=doc.file_extension||doc.fileExtension||file?.file_extension||file?.fileExtension||extensionFromUrl(fileUrl)||extensionFromMime(mime);const filename=/\.[A-Za-z0-9]{1,8}$/.test(rawName)?rawName:(ext?rawName+"."+String(ext).replace(/^\./,""):rawName);await downloadDeepLinkedFile({url:fileUrl,filename,mime});return true;}
 if(linkUrl){await A.prepareWebSession();showEmbeddedWeb(normalizeSchoologyWebUrl(linkUrl),title);return true;}
 if(sid){try{const response=await A.api({path:"sections/"+sid,params:{}});showCourse(response?.section||response||{id:sid},"materials");return true}catch{}}
 if(rawUrl){await A.prepareWebSession();showEmbeddedWeb(rawUrl,title);return true;}
 showAppDialog("Unable to open course file","Schoology did not provide a link or downloadable attachment for this document.");return true;
}

async function routeSchoologyLink(rawUrl){
 let u;try{u=new URL(rawUrl)}catch{return false}
 const scheme=u.protocol.toLowerCase()==='schoology:';
 let host=u.hostname.toLowerCase(), path=u.pathname.replace(/\/+$/,'');
 // URL parses schoology://course/123 as hostname=course, pathname=/123.
 if(scheme)path=`/${host}${path}`;
 const webHost=u.hostname.toLowerCase();
 const isSchoolHost=webHost==='lms.lausd.net'||webHost.endsWith('.schoology.com');
 if(!scheme&&(!state.openSchoologyLinks||!isSchoolHost))return false;
 if(scheme&&host==='link'){
   const target=u.searchParams.get('url')||'';let destination;try{destination=new URL(target)}catch{return true}
   if(!['http:','https:'].includes(destination.protocol))return true;
   if(state.openSchoologyLinks&&isSchoologyRoutableLink(destination.toString())){
     try{if(await routeSchoologyLink(destination.toString()))return true;await A.prepareWebSession();await showEmbeddedWeb(destination.toString(),'Schoology Link',{allowBrowser:false});return true}
     catch(e){showAppDialog('Unable to open Schoology link',e.message||String(e));return true}
   }
   try{const result=await A.openExternal(destination.toString());if(result)showAppDialog('Unable to open external link',result)}catch(e){showAppDialog('Unable to open external link',e.message||String(e))}return true;
 }
 if(scheme&&host==='lti-assignment'){
   const message=u.searchParams.get('error-message');
   showAppDialog('Unable to open LTI assignment',message||'Schoology could not open this LTI assignment.');
   return true;
 }
 if(scheme&&host==='external-document'){
   const primary=u.searchParams.get('uri')||'',fallback=u.searchParams.get('fallback-url')||'';
   for(const candidate of [primary,fallback]){if(!candidate)continue;try{await A.openExternal(candidate);return true}catch{}}
   showAppDialog('Unable to open document','Neither the document link nor its fallback could be opened.');return true;
 }
 const mCourse=path.match(/^\/course(?:s)?\/(\d+)(?:\/materials(?:\/gp\/(\d+))?)?$/i);
 const mSection=path.match(/^\/section(?:s)?\/(\d+)$/i);
 const mAssignment=path.match(/^\/(?:assignment|assignments)\/(\d+)(?:\/info)?$/i);
 const mCourseDestination=path.match(/^\/course(?:s)?\/(\d+)\/(student_grades|updates)\/?$/i);
 if(mCourseDestination){const sid=Number(mCourseDestination[1]),destination=mCourseDestination[2].toLowerCase()==="student_grades"?"grades":"updates";try{const response=await A.api({path:"sections/"+sid,params:{}});const course=response?.section||response||{id:sid};state.tab="courses";state.currentGroup=null;state.profileUser=null;state.embeddedTitle=null;state.assignmentView=null;state.selectedCourse=course;render();await showCourse(course,destination);return true}catch(e){showSchoologyRequestError(e);return true}}
 const mProfileDestination=path.match(/^\/(?:user|users|profile|profiles)\/(?:view\/)?(\d+)(?:\/.*)?$/i);
 if(mProfileDestination){openProfileById(Number(mProfileDestination[1]),"Profile");return true}
 const mSchool=path.match(/^\/schools?\/(\d+)(?:\/.*)?$/i);
 if(mSchool){openSchoolProfile(Number(mSchool[1]),"School");return true}
 const mSectionAssignment=path.match(/^\/(?:section|sections)\/(\d+)\/assignments?\/(\d+)(?:\/.*)?$/i);
 if(mSectionAssignment){showAssignment(Number(mSectionAssignment[1]),Number(mSectionAssignment[2]));return true}
 const mParentAssignment=path.match(/^\/parents?\/\d+\/sections?\/(\d+)\/assignments?\/(\d+)(?:\/.*)?$/i);
 if(mParentAssignment){showAssignment(Number(mParentAssignment[1]),Number(mParentAssignment[2]));return true}
 const mSectionAssessment=path.match(/^\/(?:section|sections)\/(\d+)\/assessments?\/(\d+)(?:\/.*)?$/i);
 if(mSectionAssessment){await A.prepareWebSession();showEmbeddedWeb("https://app.schoology.com/assignment/"+Number(mSectionAssessment[2]),"Assessment",{allowBrowser:false,quiz:true,assessment:true});return true}
 const mCourseAssessment=path.match(/^\/course(?:s)?\/(\d+)\/assessments?\/(\d+)(?:\/.*)?$/i);
 if(mCourseAssessment){await A.prepareWebSession();showEmbeddedWeb("https://app.schoology.com/assignment/"+Number(mCourseAssessment[2]),"Assessment",{allowBrowser:false,quiz:true,assessment:true});return true}
 const mSectionDiscussion=path.match(/^\/(?:section|sections)\/(\d+)\/discussions?\/(\d+)(?:\/.*)?$/i);
 if(mSectionDiscussion){await showDiscussionNative("sections",Number(mSectionDiscussion[1]),Number(mSectionDiscussion[2]),"Discussion");return true}
 const mGroupDiscussion=path.match(/^\/groups?\/(\d+)\/discussions?\/(\d+)(?:\/.*)?$/i);
 if(mGroupDiscussion){await showDiscussionNative("groups",Number(mGroupDiscussion[1]),Number(mGroupDiscussion[2]),"Discussion");return true}
 const mSectionEvent=path.match(/^\/(?:section|sections)\/(\d+)\/events?\/(\d+)(?:\/.*)?$/i);
 if(mSectionEvent){showEventNative("sections",Number(mSectionEvent[1]),Number(mSectionEvent[2]),"Event");return true}
 const mGroupEvent=path.match(/^\/groups?\/(\d+)\/events?\/(\d+)(?:\/.*)?$/i);
 if(mGroupEvent){showEventNative("groups",Number(mGroupEvent[1]),Number(mGroupEvent[2]),"Event");return true}
 const mSectionPage=path.match(/^\/(?:section|sections)\/(\d+)\/pages?\/(\d+)(?:\/.*)?$/i);
 if(mSectionPage){showPageNative("sections",Number(mSectionPage[1]),Number(mSectionPage[2]),"Page");return true}
 const mCourseApp=path.match(/^\/(?:section|sections)\/(\d+)\/(?:applications|application)\/(\d+)$/i);
 if(mCourseApp){const sectionId=Number(mCourseApp[1]),appId=Number(mCourseApp[2]);try{const result=await A.launchCourseApp({sectionId,appId});const launch=result?.url||result?.launchTokenUrl||result?.launch_token_url||result?.data?.url||result?.data?.launchTokenUrl;if(!launch)throw new Error("Schoology did not return a course-app launch URL.");const error=await A.openExternal(launch);if(error)throw new Error(error)}catch(e){showAppDialog("Unable to open course app",e.message||String(e))}return true}
 // Android's LtiHandler, ExternalToolHandler, and Classic keep course tools
 // inside the authenticated Schoology WebView session.
 const mSpecialTool=path.match(/^\/(?:course|courses|section|sections)\/(\d+)\/(external-tool|lti|scorm)\/(\d+)$/i);
 if(mSpecialTool){
   const sectionId=Number(mSpecialTool[1]),toolType=mSpecialTool[2].toLowerCase(),toolId=Number(mSpecialTool[3]);
   await A.prepareWebSession();
   showEmbeddedWeb('https://app.schoology.com/section/'+sectionId+'/'+toolType+'/'+toolId,
     toolType==='scorm'?'SCORM':toolType==='lti'?'LTI Assignment':'Course App',
     {allowBrowser:false,lti:toolType==='lti'||toolType==='external-tool'});
   return true;
 }
 const mCourseAssignment=path.match(/^\/course(?:s)?\/(\d+)\/(?:assignment|assignments)\/(\d+)(?:\/info)?$/i);
 if(/^\/home$/i.test(path)){state.homeUpcomingReturn=false;state.tab='home';state.courseView=null;state.currentGroup=null;state.assignmentView=null;state.embeddedTitle=null;state.toolbarTitle='Home';render();loadTab();return true}
 const mResources=path.match(/^\/resources(?:\/.*)?$/i);if(mResources){state.homeUpcomingReturn=false;state.courseView=null;state.currentGroup=null;state.assignmentView=null;state.embeddedTitle=null;state.tab='resources';state.toolbarTitle='Resources';render();loadTab();return true}
 const mGroup=path.match(/^\/groups?\/(\d+)(?:\/.*)?$/i);if(mGroup){const gid=Number(mGroup[1]);let group={id:gid,name:'Group'};try{const gx=await A.api({path:`groups/${gid}`,params:{}});group=gx?.group||gx||group;}catch{}state.tab='groups';state.currentGroup=group;state.toolbarTitle=group.name||group.title||'Group';render();await showGroup(group,'updates');return true}
 if(mCourse||mSection){const sid=Number((mCourse||mSection)[1]);const gp=(mCourse&&mCourse[2])?Number(mCourse[2]):0;const placeholder={id:sid,section_id:sid,course_title:'Course',section_title:'Loading…'};state.embeddedTitle=null;showCourse(placeholder,'materials');try{const x=await A.api({path:`sections/${sid}`,params:{}});const course=x?.section||x;if(state.selectedCourse?.id===sid&&state.courseView==='course'){await showCourse(course,'materials',true);if(gp)await loadFolder(course,gp,true,'Folder')}return true}catch(e){const el=document.getElementById('sectionProfileContent');if(el)el.innerHTML=`<div class="error apiError"><b>Schoology could not load this page.</b><br>${esc(e.message)}</div>`;return true}}
 if(mCourseAssignment){const sid=Number(mCourseAssignment[1]),aid=Number(mCourseAssignment[2]);showAssignment(sid,aid);return true}
 if(mAssignment){const aid=Number(mAssignment[1]);const sid=await resolveAssignmentSection(aid);if(sid){showAssignment(sid,aid);return true}await A.prepareWebSession();showEmbeddedWeb(rawUrl,'Assignment');return true}
 const mQuiz=path.match(/^\/(?:quiz|quizzes|assessment|assessments|assessment_v2|managed_assessment)(?:\/view)?\/(\d+)$/i);if(mQuiz){await A.prepareWebSession();showEmbeddedWeb(scheme?`https://app.schoology.com/${path.replace(/^\//,'')}`:rawUrl,'Quiz',{allowBrowser:false});return true}
 const mMaterials=path.match(/^\/(?:course|section)\/(?:s)?(\d+)\/materials(?:\/(?:folder|gp)\/(\d+))?$/i);if(mMaterials){try{const x=await A.api({path:`sections/${Number(mMaterials[1])}`,params:{}});const course=x?.section||x;showCourse(course,'materials');if(mMaterials[2])await loadFolder(course,Number(mMaterials[2]),true,'Folder');return true}catch(e){showSchoologyRequestError(e);return true}}
 const mDocument=path.match(/^\/(?:course|courses|section|sections)\/(?:s)?(\d+)\/(?:documents?\/|materials\/(?:documents?\/)?)(\d+)$/i);if(mDocument)return await openCourseDocumentDeepLink(Number(mDocument[1]),Number(mDocument[2]),rawUrl);const mStandaloneDocument=path.match(/^\/(?:documents?|materials)\/(\d+)$/i);if(mStandaloneDocument)return await openCourseDocumentDeepLink(0,Number(mStandaloneDocument[1]),rawUrl);
 return false;
}
async function showPageNative(realm,realmId,pageId,title='Page'){
 const c=document.getElementById('content');if(!c)return;state.assignmentView=null;state.embeddedTitle=null;state.embeddedTheme='';state.embeddedCanOpenExternal=false;state.toolbarTitle=title||'Page';syncToolbar();
 c.innerHTML='<section class="pageAndroid"><div class="loading"><m3e-circular-progress-indicator indeterminate class="m3eInlineProgress" aria-label="Loading"></m3e-circular-progress-indicator><span>Loading page…</span></div></section>';
 try{const x=await A.api({path:`${realm}/${realmId}/pages/${pageId}`,params:{}});const page=x?.page||x;const body=page?.body||page?.description||page?.content||'';const pageTitle=page?.title||title||'Page';c.innerHTML=`<section class="pageAndroid"><div class="pageAndroidHeader"><h1>${esc(pageTitle)}</h1></div><div class="pageAndroidBody">${body||'<span class="muted">No page content.</span>'}</div></section>`;c.querySelectorAll('a[href]').forEach(a=>a.addEventListener('click',async ev=>{const href=a.href||a.getAttribute('href')||'';if(/^https?:\/\//i.test(href)){ev.preventDefault();await showEmbeddedWeb(href,a.textContent?.trim()||'Link')}}));}catch(e){c.innerHTML=`<div class="error apiError"><b>Schoology could not load this page.</b><br>${esc(e.message)}</div>`;}
}
async function showEmbeddedWeb(url,title,options={}){
 const c=document.getElementById('content');if(!c)return;
 const baseUrl=options.baseUrl||(state.canadianInstance?'https://app.schoologyca.com/':'https://app.schoology.com/');
 try{url=new URL(String(url||''),baseUrl).href}catch{throw new Error('This link does not contain a valid web address.')}
 if(state.canadianInstance)url=String(url).replace(/app\.schoology\.com/gi,'app.schoologyca.com').replace(/api\.schoology\.com/gi,'api.schoologyca.com');
 const externalLinks=typeof options.externalLinks==='boolean'?options.externalLinks:!(options.quiz||options.assessment||options.accountInfo);
 if(!options.quiz&&!options.assessment&&!options.accountInfo&&options.openInitialExternalInBrowser!==false){
  try{const initial=new URL(String(url||'')),h=initial.hostname.toLowerCase(),schoolHost=h==='lms.lausd.net'||h==='schoology.com'||h.endsWith('.schoology.com')||h==='schoologyca.com'||h.endsWith('.schoologyca.com');if(['http:','https:'].includes(initial.protocol)&&!schoolHost){const handled=await routeSchoologyLink(initial.href);if(handled)return;const result=await A.openExternal(initial.href);if(result)showAppDialog('Unable to open link',result);return}}
  catch(error){if(!(error instanceof TypeError)){showAppDialog('Unable to open link',error.message||String(error));return}}
 }
 try{await A.prepareWebSession()}catch(error){console.warn('Schoology web session preparation failed:',error)}
 c.classList.remove('webContentHost');c.classList.add('embeddedContentActive');state.toolbarTitle=title||'Schoology';state.embeddedTitle=title||'Schoology';state.embeddedCanOpenExternal=options.allowBrowser!==false;state.embeddedTheme=options.accountInfo?'account':(options.lti?'lti':(options.quiz?'quiz':''));syncToolbar();
 const embeddedTag=window.__TAURI__?'schoology-webview':'webview';
 const attrs=window.__TAURI__?'data-lti="'+(options.lti?'true':'false')+'" data-external-links="'+(externalLinks?'true':'false')+'" data-open-popups-external="'+(options.openPopupsExternal?'true':'false')+'" data-course-app="'+(options.courseApp?'true':'false')+'"':'';
 c.innerHTML='<section class="embeddedPage"><'+embeddedTag+' id="schoologyWebview" src="'+esc(String(url||''))+'" allowpopups '+attrs+'></'+embeddedTag+'><div class="embeddedWebviewError" id="embeddedWebviewError" hidden><b>Unable to load this Schoology page.</b><span id="embeddedWebviewErrorText">Check your connection and try again.</span><m3e-button variant="filled" id="embeddedWebviewRetry">Retry</m3e-button></div></section>';
 const w=document.getElementById('schoologyWebview'),errorPanel=document.getElementById('embeddedWebviewError'),errorText=document.getElementById('embeddedWebviewErrorText');
 if(!w)return;
 const showFailure=message=>{if(errorText)errorText.textContent=message||'Check your connection and try again.';if(errorPanel)errorPanel.hidden=false};
 document.getElementById('embeddedWebviewRetry')?.addEventListener('click',()=>{if(errorPanel)errorPanel.hidden=true;try{w.src=url}catch{showFailure('Unable to retry this page.')}});
 let initialPageLoaded=false;
 w.addEventListener('did-start-navigation',event=>{if(event.isMainFrame&&errorPanel)errorPanel.hidden=true});
 w.addEventListener('did-finish-load',()=>{initialPageLoaded=true;if(errorPanel)errorPanel.hidden=true});
 w.addEventListener('did-fail-load',event=>{if(event.isMainFrame&&event.errorCode!==-3){showFailure(event.errorDescription||'Check your connection and try again.');console.warn('Schoology embedded page failed:',event.errorDescription)}});
 w.addEventListener('new-window',async event=>{event.preventDefault();if(await routeSchoologyLink(event.url))return;if(externalLinks){try{const result=await A.openExternal(event.url);if(result)showAppDialog('Unable to open link',result)}catch(error){showAppDialog('Unable to open link',error.message||String(error))}return}try{w.src=event.url}catch{}});
 w.addEventListener('will-navigate',event=>{const target=String(event.url||'');if(externalLinks&&initialPageLoaded){event.preventDefault();Promise.resolve(routeSchoologyLink(target)).then(handled=>{if(handled)return;if(state.openSchoologyLinks&&isSchoologyRoutableLink(target)){w.src=target;return}return A.openExternal(target)}).catch(error=>showAppDialog('Unable to open link',error.message||String(error)));return}if(isSchoologyRoutableLink(target)){event.preventDefault();Promise.resolve(routeSchoologyLink(target)).catch(error=>console.warn('Schoology deep link failed:',error))}});
}

async function loadAttendanceTab(course){
  const el=document.getElementById('sectionProfileContent');if(!el)return;
  const sid=course.id||course.section_id||course.sectionId;
  try{
    const x=await A.api({path:`sections/${sid}/attendance`,params:{start:0,limit:100}});
    const arr=x.attendance||x.records||x.record||[];
    el.innerHTML=arr.length?`<div class="attendanceList">${arr.map(r=>`<div class="attendanceRow"><b>${esc(r.date||r.created||'')}</b><span>${esc(r.status||r.type||r.label||'')}</span></div>`).join('')}</div>`:'<div class="empty"><h2>No attendance records</h2></div>';
  }catch(e){
    el.innerHTML=`<div class="error apiError">${esc(e.message)}</div>`;
  }
}

async function loadCourseApps(course,targetEl){
  const landscapeApps=window.matchMedia('(min-width: 801px) and (orientation: landscape)').matches;
  const el=targetEl||(landscapeApps?document.querySelector('.courseSidebarSegmentedList'):document.getElementById('sectionProfileContent'));if(!el)return;
  const sid=course.id||course.section_id||course.sectionId;
  const x=await A.api({path:`v2/sections/${sid}/applications`,params:{}});
  const apps=x?.['@extra']||x.extra||x.data?.['@extra']||x.data?.extra||[];
  window.__schoologyCourseApps=apps;
  const rows=apps.map((a,i)=>{const title=a.title||a.name||'Course App',logo=normalizeImageUrl(a.logoUrl||a.logo_url||a.logo||'');
    if(landscapeApps)return `<m3e-list-action class="courseSidebarNavItem courseAppSidebarItem" data-app-index="${i}" tabindex="0"><span slot="leading" class="m3eOriginalIcon">${originalM3Icon('apps')}</span><span>${esc(title)}</span></m3e-list-action>`;
    return `<m3e-list-action class="courseAppRow" data-app-index="${i}" tabindex="0"><span slot="leading" class="courseAppIcon">${logo?`<img data-course-image-url="${esc(logo)}" alt="" loading="lazy">`:`<span class="courseAppFallback">${originalM3Icon('apps')}</span>`}</span><span class="courseAppText"><b>${esc(title)}</b></span><span slot="trailing" class="m3eOriginalIcon">${originalM3Icon('chevron_right')}</span></m3e-list-action>`;
  }).join('');
  if(landscapeApps){el.querySelectorAll('.courseAppSidebarItem').forEach(item=>item.remove());if(rows)el.insertAdjacentHTML('beforeend',rows);}
  else el.innerHTML=apps.length?`<m3e-action-list variant="segmented" class="courseAppList">${rows}</m3e-action-list>`:'<div class="empty"><h2>No course apps</h2></div>';
  el.querySelectorAll('[data-app-index]').forEach(b=>b.onclick=async()=>{
    const a=window.__schoologyCourseApps[+b.dataset.appIndex];const launch=a?.['@links']?.launch||a?.links?.launch||a?.['@links']?.launch||a?.links?.launch;
    const href=launch?.['@id']||launch?.id||launch?.href||launch?.url;
    const appId=Number(a?.id??a?.application_id??a?.applicationId??a?.resource_app_id??a?.resourceAppId??a?.app_id??a?.appId);
    if(!href&&(!Number.isSafeInteger(appId)||appId<=0)){showAppDialog('Unable to launch course app','Schoology did not provide a launch target for this course app.');return}
    try{await A.prepareWebSession();const result=await A.launchCourseApp({launchUrl:href,appId:Number.isSafeInteger(appId)&&appId>0?appId:undefined,sectionId:Number(sid)});const url=result?.url||result?.launchTokenUrl||result?.data?.url||result?.data?.launchTokenUrl||result?.launch_url||result?.launchUrl||href;if(!url)throw new Error('Schoology did not return a course-app launch URL.');if(landscapeApps){state.embeddedReturn={tab:state.tab,homeTab:state.homeTab,title:sectionTitleOf(course)||courseTitleOf(course),course,courseTab:state.courseTab};await showEmbeddedWeb(url,a.title||a.name||'Course App',{allowBrowser:false,courseApp:true})}else{const error=await A.openExternal(url);if(error)throw new Error(error)}}catch(error){showAppDialog('Unable to launch course app',error?.message||String(error))}
  });
  await hydrateCourseImages(el);
}
async function loadCourseUpcomingPane(course){
 const el=document.getElementById('courseUpcomingContent');if(!el)return;
 const sid=course.id||course.section_id||course.sectionId;if(!sid)return;
 const x=await A.api({path:`sections/${sid}/events`,params:{start_date:formatApiDate(new Date()),limit:20}});
 let arr=x.event||x.events||[];
 arr=arr.filter(e=>['assignment','assessment','assessment_v2','managed_assessment','discussion','external_tool','event'].includes(String(e.type||'')));
 el.innerHTML=renderUpcoming(arr);
 document.querySelectorAll('[data-course-upcoming-id]').forEach(b=>b.onclick=async()=>{const e=arr.find(v=>String(v.id||'')===String(b.dataset.courseUpcomingId));if(!e)return;const type=String(e.type||'').toLowerCase();const aid=e.assignment_id??e.assignmentId??e.assignment?.id;const esid=e.section_id??e.sectionId??sid;if(type==='assignment'&&aid){showAssignment(esid,aid);return}if(['assessment','assessment_v2','managed_assessment','quiz'].includes(type)){const id=aid??e.id;if(id){(async()=>{await A.prepareWebSession();showEmbeddedWeb(`https://app.schoology.com/assignment/${id}`,e.title||'Quiz',{allowBrowser:false,quiz:true,assessment:true})})();return}}if(e.web_url||e.webUrl)openWithPressTransition(b,()=>showEmbeddedWeb(e.web_url||e.webUrl,e.title||'Upcoming'));else if(type==='discussion'){const did=upcomingDiscussionId(e);if(did)openWithPressTransition(b,()=>showDiscussionNative('sections',esid,did,e.title||'Discussion'));else if(e.web_url||e.webUrl)openWithPressTransition(b,()=>showEmbeddedWeb(e.web_url||e.webUrl,e.title||'Discussion'));}});
}
let courseLayoutMediaQuery=null;
let lastWindowLayout='';
let resizeRefreshTimer=null;
let courseRenderToken=0;
function currentWindowLayout(){return window.matchMedia('(min-width: 801px)').matches?'landscape':'portrait'}
function installCourseLayoutWatcher(){
  const mq=window.matchMedia('(min-aspect-ratio: 4/3)');
  const handler=()=>{
    const layout=currentWindowLayout();
    if(layout===lastWindowLayout)return;
    lastWindowLayout=layout;
    clearTimeout(resizeRefreshTimer);
    resizeRefreshTimer=setTimeout(()=>{
      if(state.assignmentView||state.embeddedTitle)return;
      if(state.tab==='courses'&&state.screen==='app'&&state.courseView==='course'&&state.selectedCourse&&document.querySelector('.courseLandscapePage')){showCourse(state.selectedCourse,state.courseTab||'materials',true);return;}
      if(state.tab==='profile'&&state.screen==='app'&&state.profileUser){render();loadTab();}
    },60);
  };
  if(courseLayoutMediaQuery===mq)return;
  courseLayoutMediaQuery?.removeEventListener?.('change',window.__schoologyCourseLayoutChange);
  window.__schoologyCourseLayoutChange=handler;
  mq.addEventListener?.('change',handler);
  lastWindowLayout=currentWindowLayout();
  window.removeEventListener('resize',window.__schoologyResizeRefresh);
  window.__schoologyResizeRefresh=()=>handler();
  window.addEventListener('resize',window.__schoologyResizeRefresh,{passive:true});
  courseLayoutMediaQuery=mq;
}


document.addEventListener('click',async event=>{
 const button=event.target.closest?.('[data-poll-option]');if(!button||button.disabled)return;
 const updateId=button.dataset.updateId,optionId=button.dataset.pollOption,container=button.closest('[data-update-poll]');if(!updateId||!optionId||!container)return;
 event.preventDefault();button.disabled=true;const wasSelected=button.dataset.selected==='1';
 try{const result=await A.api({path:`poll/${updateId}/vote`,method:'POST',params:{id:Number(optionId),select:!wasSelected},json:true});const model=result?.pollUpdateModel||result?.poll_update_model||result?.update?.pollUpdateModel||result?.update?.poll_update_model||result?.update||result?.poll||null;if(model){const html=renderUpdatePoll({pollUpdateModel:model,pollVoteRecorded:true},updateId);if(html&&!html.includes('Poll options are unavailable.')){container.outerHTML=html;return}}
 const oldCount=Number((button.querySelector('.updatePollResult')?.textContent||'').match(/^\s*(\d+)/)?.[1]||0),nextCount=Math.max(0,oldCount+(wasSelected?-1:1));button.dataset.selected=wasSelected?'0':'1';button.classList.toggle('selected',!wasSelected);button.setAttribute('aria-pressed',String(!wasSelected));const resultEl=button.querySelector('.updatePollResult');if(resultEl)resultEl.textContent=`${nextCount} · —%`;container.querySelectorAll('[data-poll-option]').forEach(b=>{if(b!==button&&!wasSelected){b.dataset.selected='0';b.classList.remove('selected');b.setAttribute('aria-pressed','false')}});container.classList.add('resultsVisible');const summary=container.querySelector('small');if(summary)summary.textContent='Vote recorded';
 }catch(error){showAppDialog('Unable to vote in poll',error?.message||String(error)||'Unknown error')}finally{if(button.isConnected)button.disabled=false}
});

function dialogPersonId(person){
 const nested=person?.user||person?.author||person?.creator||person?.profile_info||person?.profile||{};
 const linked=person?.links?.user?.href||person?.links?.creator?.href||person?.links?.author?.href||'';
 const linkedId=String(linked).match(/(?:users|user)\/(\d+)/i)?.[1];
 return Number(person?.uid??person?.user_id??person?.userId??person?.author_user_id??person?.authorUserId??person?.creator_user_id??person?.creatorUserId??person?.commenter_id??person?.commenterId??person?.creater_id??person?.creator_id??person?.created_by??person?.createdBy??person?.author_id??person?.authorId??person?.user?.id??person?.author?.id??person?.creator?.id??nested?.uid??nested?.user_id??nested?.userId??nested?.author_id??nested?.id??linkedId??((person?.id&&(person?.name_display||person?.display_name||person?.name||person?.picture_url||person?.avatar_url))?person.id:0));
}
function dialogPersonName(person,profile={}){
 const nested=person?.user||person?.author||person?.creator||person?.profile_info||person?.profile||{};
 const hydrated=profile?.user||profile?.profile_info||profile?.profile||profile||{};
 const candidates=[person?.name_display,person?.nameDisplay,person?.display_name,person?.displayName,person?.author_name,person?.authorName,person?.user_name,person?.userName,person?.commenter_name,person?.commenterName,person?.creator_name,person?.creatorName,person?.name,nested?.name_display,nested?.nameDisplay,nested?.display_name,nested?.displayName,nested?.full_name,nested?.fullName,nested?.name,hydrated?.name_display,hydrated?.nameDisplay,hydrated?.display_name,hydrated?.displayName,hydrated?.full_name,hydrated?.fullName,hydrated?.name];
 const name=candidates.find(value=>typeof value==='string'&&value.trim()&&!/^(?:schoology(?: user)?)$/i.test(value.trim()));
 return String(name||'Schoology user');
}
function dialogPersonAvatar(person,profile={}){
 const nested=person?.user||person?.author||person?.creator||person?.profile_info||person?.profile||{};
 const hydrated=profile?.user||profile?.profile_info||profile?.profile||profile||{};
 return normalizeImageUrl(person?.picture_url||person?.pictureUrl||person?.picture||person?.avatar_url||person?.avatarUrl||person?.photo_url||person?.photoUrl||person?.avatar||nested?.picture_url||nested?.pictureUrl||nested?.picture||nested?.avatar_url||nested?.avatarUrl||nested?.photo_url||nested?.photoUrl||nested?.avatar||hydrated?.picture_url||hydrated?.pictureUrl||hydrated?.picture||hydrated?.avatar_url||hydrated?.avatarUrl||hydrated?.photo_url||hydrated?.photoUrl||hydrated?.avatar||'');
}
async function hydrateDialogPeople(records){
 const rows=(Array.isArray(records)?records:[records]).filter(Boolean),profiles={};
 const ids=[...new Set(rows.map(dialogPersonId).filter(id=>Number.isFinite(id)&&id>0))];
 await Promise.all(ids.map(async id=>{
   const row=rows.find(person=>dialogPersonId(person)===id)||{};
   const name=dialogPersonName(row,{}),avatar=dialogPersonAvatar(row,{});
   if(name!=='Schoology user'&&avatar)return;
   try{
     const response=await A.api({path:'users/'+id,params:{picture_size:'sm'}});
     const candidates=[response?.user,response?.data?.user,response?.users?.user,response?.data?.users?.user,response?.data?.data?.user,response?.data?.profile,response?.profile,response?.data?.data?.profile,response?.data?.data,response?.data,response];
     profiles[id]=candidates.find(value=>value&&typeof value==='object'&&!Array.isArray(value)&&(value.name_display||value.nameDisplay||value.display_name||value.displayName||value.full_name||value.fullName||value.name||value.picture_url||value.pictureUrl||value.picture||value.avatar_url||value.avatarUrl||value.photo_url||value.photoUrl||value.avatar||value.profile_info||value.profile||value.user))||{};
   }catch{}
 }));
 return rows.map(person=>({person,profile:profiles[dialogPersonId(person)]||{},id:dialogPersonId(person)}));
}
function groupAdminBadgeMarkup(value){const role=String(value?.role||value?.group_role||value?.groupRole||value?.user_role||value?.userRole||'').toLowerCase();return value&&(value.is_admin===true||value.isAdmin===true||value.admin===true||value.is_group_admin===true||value.isGroupAdmin===true||role==='admin'||role==='group admin')?'<svg class="groupAdminBadge" viewBox="0 0 17 19" aria-label="Group admin" role="img"><path fill="#fac901" stroke="#024f7d" stroke-width="1" d="M8.5.6c2.3 2.1 4.1 2.7 8 3v7.8c0 .5-.2 5.1-8 7.6C.5 16.5.5 11.9.5 11.4V3.6c4-.2 6-.9 8-3Z"/><path fill="#43c5f9" stroke="#024f7d" stroke-width=".8" d="m8.5 5.3 1.4 2.7 3 .4-2.2 2.1.5 3-2.7-1.4-2.7 1.4.5-3-2.2-2.1 3-.4Z"/></svg>':''}
function sharedPostId(post){return post?.id??post?.update_id??post?.updateId??post?.update?.id??''}
function sharedPostCounts(post){return {comments:Number(post?.num_comments??post?.comment_count??post?.comments_count??post?.comments??0)||0,likes:Number(post?.likes??post?.like_count??post?.likeCount??0)||0,liked:!!(post?.user_liked??post?.user_like_action??post?.liked??post?.is_liked)}}
function sharedPostIcon(kind){
 const paths=kind==='comment'?'<path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H6l-3 2v-5.5A7.5 7.5 0 0 1 10.5 8H12"/>':'<path d="M12 21s-8-4.6-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6.4-8 11-8 11Z"/>';
 return '<svg class="sharedActionIcon" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+paths+'</svg>';
}
function renderUpdatePoll(update,updateId){
 const poll=update?.pollUpdateModel||update?.poll_update_model||update?.poll||update?.poll_update||update?.pollUpdate||null;
 const options=Array.isArray(poll)?poll:(poll?.options||poll?.pollOptionsList||poll?.poll_options||poll?.pollOptions||update?.pollOptions||update?.poll_options||[]);
 if(!Array.isArray(options)||!options.length)return poll?`<section class="updatePoll" data-update-poll="${esc(updateId)}"><b>Poll</b><div class="updatePollUnavailable">Poll options are unavailable.</div></section>`:'' ;
 const optionCount=o=>Number(o?.count??o?.votes??o?.vote_count??o?.voteCount??o?.total_votes??o?.totalVotes??o?.num_votes??o?.numVotes??0)||0;const total=options.reduce((sum,o)=>sum+optionCount(o),0),voted=update?.pollVoteRecorded===true||options.some(o=>o?.selected===true||o?.selected===1||o?.selected==='true'||o?.is_selected===true||o?.isSelected===true);
 return `<section class="updatePoll ${voted?'resultsVisible':''}" data-update-poll="${esc(updateId)}"><div class="updatePollHeading">Poll</div>${options.map(o=>{const id=o?.id??o?.pollOptionID??o?.poll_option_id??'',title=o?.title??o?.name??'Option',count=optionCount(o),selected=o?.selected===true||o?.selected===1||o?.selected==='true'||o?.is_selected===true||o?.isSelected===true,percent=total?Math.round(count/total*100):0;return `<button type="button" class="updatePollOption ${selected?'selected':''}" data-poll-option="${esc(id)}" data-update-id="${esc(updateId)}" data-selected="${selected?'1':'0'}" aria-pressed="${selected?'true':'false'}"><span class="updatePollOptionTitle">${esc(title)}</span><span class="updatePollTrack"><span style="width:${percent}%"></span></span><span class="updatePollResult">${count} · ${percent}%</span></button>`}).join('')}<small>${voted?`${total} vote${total===1?'':'s'} · Your vote is recorded`:'Select an option to vote'}</small></section>`;
}
function renderSharedPostCard({post={},id=sharedPostId(post),realm,realmId,author='Schoology',avatar='',authorId='',contextLabel='',contextId='',canDelete=false,cardClass='' }={}){
 const counts=sharedPostCounts(post),body=post.body||post.message||post.description||post.title||'',created=post.created||post.timestamp||post.last_updated||post.lastUpdated||post.updated||'';
 const safeId=String(id??''),safeRealm=String(realm||''),safeRealmId=String(realmId??'');
 const authorMarkup='<button type="button" class="activityUser activityAuthorLink" data-shared-post-author="'+esc(authorId||post.user_id||post.uid||post.author_id||post.authorId||'')+'">'+esc(author||'Schoology')+'</button>';
 const avatarMarkup=avatar?'<img class="activityAvatar" data-media-image-url="'+esc(avatar)+'" alt="" style="display:none">':'<span class="activityAvatar">'+esc(String(author||'S').trim().charAt(0)||'S')+'</span>';
 const contextMarkup=contextLabel?'<button type="button" class="sharedPostContext" data-shared-post-context-group="'+esc(contextId||'')+'">'+esc(contextLabel)+'</button>':'';
 const del=canDelete?'<button type="button" class="updateDeleteButton" data-shared-post-delete="'+esc(safeId)+'" aria-label="Delete update">⋮</button>':'';
 return '<m3e-card variant="filled" class="androidActivityCard sharedPostCard '+esc(cardClass)+'" data-shared-post-id="'+esc(safeId)+'" data-shared-post-realm="'+esc(safeRealm)+'" data-shared-post-realm-id="'+esc(safeRealmId)+'">'+
 '<div slot="header" class="activityHeader">'+avatarMarkup+authorMarkup+contextMarkup+del+'</div>'+
 '<div slot="content" class="sharedPostContent"><div class="activityBody">'+body+'</div>'+renderAttachments(post.attachments||post.attachment||post.files||{})+renderUpdatePoll(post,safeId)+'<div class="activityMeta">'+esc(formatSchoologyDate(created))+'</div></div>'+
 '<div slot="actions" class="activityActions sharedPostActions">'+
 '<m3e-button-group variant="connected" class="sharedActionGroup sharedPostLikeGroup"><m3e-button variant="tonal" size="small" class="sharedPostLikeButton" data-shared-post-like="'+esc(safeId)+'" data-liked="'+(counts.liked?'1':'0')+'"><span class="sharedPostLikeLabel">'+(counts.liked?'Unlike':'Like')+'</span></m3e-button>'+(counts.likes>0?'<m3e-button variant="tonal" size="small" class="sharedPostLikeCount" data-shared-post-like-count="'+esc(safeId)+'" aria-label="'+counts.likes+' likes">'+sharedPostIcon('like')+'<span class="sharedPostCountLabel">'+counts.likes+'</span></m3e-button>':'')+'</m3e-button-group>'+
 '<m3e-button-group variant="connected" class="sharedActionGroup sharedPostCommentGroup"><m3e-button variant="tonal" size="small" class="sharedPostCommentButton" data-shared-post-comment="'+esc(safeId)+'">Comment</m3e-button>'+(counts.comments>0?'<m3e-button variant="tonal" size="small" class="sharedPostCommentCount" data-shared-post-comments="'+esc(safeId)+'" aria-label="'+counts.comments+' comments">'+sharedPostIcon('comment')+'<span class="sharedPostCountLabel">'+counts.comments+'</span></m3e-button>':'')+'</m3e-button-group></div>'+
 '<div slot="footer" class="sharedPostCommentPreview" data-shared-post-preview="'+esc(safeId)+'"></div><div slot="footer" class="updateCommentsPanel sharedPostInlineComments" data-shared-post-panel="'+esc(safeId)+'" hidden></div></m3e-card>';
}
function flattenSharedComments(response){
 const raw=response?.comment??response?.comments??response?.data?.comment??response?.data?.comments??[];
 const roots=Array.isArray(raw)?raw:(raw&&typeof raw==='object'?[raw]:[]),rows=[],seen=new Set();
 const walk=(node,parentId=0)=>{if(!node||typeof node!=='object')return;const id=String(node.id??node.comment_id??node.commentId??'');if(id&&seen.has(id))return;if(id)seen.add(id);const row={...node};if(row.parent_id==null&&row.parentId==null&&parentId)row.parent_id=parentId;rows.push(row);const nextId=node.id??node.comment_id??node.commentId??parentId;const children=node.children??node.replies??node.comments??node.comment_replies??[];if(Array.isArray(children))children.forEach(child=>walk(child,nextId));};
 roots.forEach(row=>walk(row,0));return rows;
}
function renderSharedCommentRow(comment,allComments,updateId,hydratedRow=null){
 const id=comment.id??comment.comment_id??comment.commentId??'',parent=Number(comment.parent_id??comment.parentId??0)||0;
 const author=comment.user||comment.author||comment.profile||comment.creator||{},profile=hydratedRow?.profile&&Object.keys(hydratedRow.profile).length?hydratedRow.profile:author;
 const authorId=hydratedRow?.id||dialogPersonId(comment),name=dialogPersonName(comment,profile),avatar=dialogPersonAvatar(comment,profile),body=comment.body??comment.comment??comment.message??'',created=formatSchoologyDate(comment.created??comment.timestamp??comment.last_updated??'');
 const liked=[comment.user_like_action,comment.user_liked,comment.userLiked,comment.liked,comment.is_liked,comment.isLiked].some(value=>value===true||value===1||value==='1'||String(value).toLowerCase()==='true');
 const likeCount=Number(comment.likes??comment.like_count??comment.likeCount??0)||0,replies=allComments.filter(reply=>String(reply.parent_id??reply.parentId??0)===String(id)),deleted=Number(comment.status??1)===0;
 const initials=String(name||'S').trim().split(/\s+/).filter(Boolean).slice(0,2).map(value=>value.charAt(0)).join('').toUpperCase()||'S';
 const avatarMarkup=avatar?'<img data-media-image-url="'+esc(avatar)+'" alt="" loading="lazy">':'<span>'+esc(initials)+'</span>';
 return '<m3e-card variant="filled" class="updateComment sharedCommentRow sharedCommentCard" data-shared-comment-id="'+esc(id)+'" data-parent-id="'+parent+'" '+(parent?'hidden':'')+'>'+
 '<div slot="header" class="sharedCommentHeading"><span class="sharedCommentAvatar">'+avatarMarkup+'</span>'+(authorId?'<button type="button" class="sharedCommentAuthor" data-shared-comment-author="'+esc(authorId)+'">'+esc(name)+'</button>':'<b>'+esc(name)+'</b>')+(groupAdminBadgeMarkup(comment)||'')+'</div>'+
 '<div slot="content" class="sharedCommentContent"><div class="sharedCommentBody '+(deleted?'commentDeleted':'')+'">'+(deleted?'Comment deleted':body)+'</div>'+renderAttachments(comment.attachments||comment.attachment||{})+'</div>'+
 '<div slot="actions" class="sharedCommentActions">'+
 '<m3e-button-group variant="connected" class="sharedActionGroup sharedCommentReplyGroup"><m3e-button variant="tonal" size="small" '+(deleted?'disabled':'')+' data-shared-comment-reply="'+esc(id)+'">Reply</m3e-button>'+(replies.length?'<m3e-button variant="tonal" size="small" data-shared-comment-replies-toggle="'+esc(id)+'" aria-expanded="false"><span class="sharedCommentReplyCount">'+replies.length+'</span></m3e-button>':'')+'</m3e-button-group>'+
 '<m3e-button-group variant="connected" class="sharedActionGroup sharedCommentLikeGroup"><m3e-button variant="tonal" size="small" data-shared-comment-like="'+esc(id)+'" data-liked="'+(liked?'1':'0')+'"><span class="sharedCommentLikeLabel">'+(liked?'Unlike':'Like')+'</span></m3e-button>'+(likeCount>0?'<m3e-button variant="tonal" size="small" class="sharedCommentLikeCount" data-shared-comment-like-count="'+esc(id)+'" data-like-count="'+likeCount+'" aria-label="'+likeCount+' likes">'+sharedPostIcon('like')+'<span class="sharedCommentLikeNumber">'+likeCount+'</span></m3e-button>':'')+'</m3e-button-group></div>'+
 (created?'<div slot="footer" class="sharedCommentMeta">'+esc(created)+'</div>':'')+'</m3e-card>';
}
function wireSharedCommentRows(root,{likePath,replyHandler}={}){
 root.querySelectorAll('[data-shared-comment-author]').forEach(button=>button.onclick=()=>{const id=button.dataset.sharedCommentAuthor;if(id)openProfileById(id,button.textContent||'Profile')});
 root.querySelectorAll('[data-shared-comment-replies-toggle]').forEach(button=>button.onclick=()=>{const id=button.dataset.sharedCommentRepliesToggle,rows=[...root.querySelectorAll('[data-shared-comment-id][data-parent-id]')].filter(row=>String(row.dataset.parentId)===String(id)),expanded=button.getAttribute('aria-expanded')==='true';button.setAttribute('aria-expanded',String(!expanded));rows.forEach(row=>row.hidden=expanded)});
 root.querySelectorAll('[data-shared-comment-reply]').forEach(button=>button.onclick=()=>replyHandler?.(button.dataset.sharedCommentReply));
 root.querySelectorAll('[data-shared-comment-like]').forEach(button=>button.onclick=async()=>{const id=button.dataset.sharedCommentLike,liked=button.dataset.liked==='1';if(!id||button.disabled||!likePath)return;button.disabled=true;try{const result=await A.api({path:likePath(id),method:'POST',params:{like_action:!liked},json:true});const next=typeof result?.user_like_action==='boolean'?result.user_like_action:!liked;button.dataset.liked=next?'1':'0';const label=button.querySelector('.sharedCommentLikeLabel');if(label)label.textContent=next?'Unlike':'Like';const count=button.closest('.sharedCommentRow')?.querySelector('[data-shared-comment-like-count]');if(count){const value=count.querySelector('.sharedCommentLikeNumber'),n=Math.max(0,(Number(value?.textContent)||0)+(next?1:-1));if(value)value.textContent=String(n);count.dataset.likeCount=String(n)}}catch(error){showAppDialog('Unable to update comment like',error?.message||String(error))}finally{button.disabled=false}});
 root.querySelectorAll('[data-shared-comment-like-count]').forEach(button=>button.onclick=()=>{if(likePath)showLikeUsers(likePath(button.dataset.sharedCommentLikeCount))});
}
async function showLikeUsers(path){
 const old=document.getElementById('sharedLikeUsersDialog');old?.remove();
 const wrap=document.createElement('div');wrap.id='sharedLikeUsersDialog';wrap.className='sharedOverlay';
 wrap.innerHTML='<m3e-dialog open class="sharedM3eDialog" disable-close><span slot="header">Likes</span><div class="sharedLikeUsersBody"><div class="loading"><m3e-circular-progress-indicator indeterminate class="m3eInlineProgress" aria-label="Loading"></m3e-circular-progress-indicator><span>Loading…</span></div></div><span slot="actions" end><m3e-button data-shared-close variant="text">Close</m3e-button></span></m3e-dialog>';
 document.body.appendChild(wrap);wrap.querySelector('[data-shared-close]')?.addEventListener('click',()=>wrap.remove());
 try{
  const response=await A.api({path,params:{start:0,limit:100}}),raw=response?.users?.user??response?.users??response?.user??response?.like??response?.likes??response?.data?.likes??[],rows=Array.isArray(raw)?raw:(raw&&typeof raw==='object'?[raw]:[]),hydrated=await hydrateDialogPeople(rows),body=wrap.querySelector('.sharedLikeUsersBody');
  if(body)body.innerHTML=hydrated.length?'<m3e-list variant="segmented">'+hydrated.map(({person,profile,id})=>{const name=dialogPersonName(person,profile),avatar=dialogPersonAvatar(person,profile),initials=String(name).trim().split(/\s+/).slice(0,2).map(part=>part.charAt(0)).join('').toUpperCase()||'S';return '<m3e-list-action data-shared-like-user="'+esc(id||'')+'"><span slot="leading" class="sharedLikeAvatar">'+(avatar?'<img data-media-image-url="'+esc(avatar)+'" alt="" loading="lazy">':'<span>'+esc(initials)+'</span>')+'</span><span>'+esc(name)+'</span><span slot="trailing" class="m3eOriginalIcon">'+originalM3Icon('chevron_right')+'</span></m3e-list-action>'}).join('')+'</m3e-list>':'<div class="empty">No likes to show.</div>';
  if(body){await hydrateMediaImages(body);body.querySelectorAll('[data-shared-like-user]').forEach(button=>button.onclick=()=>{const id=button.dataset.sharedLikeUser;if(id){wrap.remove();openProfileById(id,button.textContent||'Profile')}})}
 }catch(error){const body=wrap.querySelector('.sharedLikeUsersBody');if(body)body.innerHTML='<div class="error apiError">'+esc(error?.message||String(error))+'</div>'}
}

async function loadSharedPostPreview(realm,realmId,updateId,preview){
 if(!preview)return;
 try{
  const response=await A.api({path:realm+'/'+realmId+'/updates/'+updateId+'/comments',params:{start:0,limit:100,with_attachments:'TRUE',richtext:1}});
  const comments=flattenSharedComments(response),roots=comments.filter(row=>Number(row.parent_id??row.parentId??0)===0),recent=roots.slice(-2),hydrated=await hydrateDialogPeople(recent);
  if(!recent.length){preview.innerHTML='';return}
  preview.innerHTML='<div class="sharedPostPreviewList">'+recent.map((comment,index)=>renderSharedCommentRow(comment,recent,updateId,hydrated[index])).join('')+'</div><button type="button" class="sharedPostViewMore">View more comments</button>';
  await hydrateMediaImages(preview);
  preview.querySelector('.sharedPostViewMore')?.addEventListener('click',()=>openSharedPostCommentsDialog(realm,realmId,updateId));
 }catch{preview.innerHTML=''}
}
async function loadSharedPostComments(realm,realmId,updateId,panel,{inline=false}={}){
 if(!panel)return 0;panel.hidden=false;panel.innerHTML='<div class="loading"><m3e-circular-progress-indicator indeterminate class="m3eInlineProgress" aria-label="Loading"></m3e-circular-progress-indicator><span>Loading comments…</span></div>';
 try{
  const response=await A.api({path:realm+'/'+realmId+'/updates/'+updateId+'/comments',params:{start:0,limit:100,with_attachments:'TRUE',richtext:1}});
  const comments=flattenSharedComments(response),hydrated=await hydrateDialogPeople(comments);
  if(inline&&!comments.length){panel.hidden=true;panel.innerHTML='';return 0}
  panel.innerHTML='<div class="updateCommentsList sharedCommentsList">'+(comments.map((row,index)=>renderSharedCommentRow(row,comments,updateId,hydrated[index])).join('')||'<div class="empty">No comments yet.</div>')+'</div><div class="updateCommentComposer sharedCommentInlineComposer" hidden><textarea aria-label="Write a comment" placeholder="Write a comment…"></textarea><div class="sharedCommentComposerActions"><button type="button" data-shared-cancel-reply>Cancel reply</button><button type="button" data-shared-post-comment>Post comment</button></div></div>';
  await hydrateMediaImages(panel);
  panel.querySelectorAll('[data-shared-comment-author]').forEach(button=>button.onclick=()=>{const id=button.dataset.sharedCommentAuthor;if(id)openProfileById(id,button.textContent||'Profile')});
  panel.querySelectorAll('[data-shared-comment-replies-toggle]').forEach(button=>button.onclick=()=>{const id=button.dataset.sharedCommentRepliesToggle,rows=[...panel.querySelectorAll('[data-shared-comment-id][data-parent-id]')].filter(row=>String(row.dataset.parentId)===String(id)),expanded=button.getAttribute('aria-expanded')==='true';button.setAttribute('aria-expanded',String(!expanded));rows.forEach(row=>row.hidden=expanded);const replyCount=button.querySelector('.sharedCommentReplyCount');if(replyCount)replyCount.textContent=String(rows.length)});
  panel.querySelectorAll('[data-shared-comment-reply]').forEach(button=>button.onclick=()=>{const composer=panel.querySelector('.sharedCommentInlineComposer'),field=composer?.querySelector('textarea');if(composer)composer.hidden=false;if(field){field.dataset.parentId=button.dataset.sharedCommentReply||'0';field.placeholder='Write a reply…';field.focus()}});
  panel.querySelectorAll('[data-shared-comment-like]').forEach(button=>button.onclick=async()=>{const id=button.dataset.sharedCommentLike,liked=button.dataset.liked==='1';if(!id||button.disabled)return;button.disabled=true;try{const result=await A.api({path:'like/'+updateId+'/comment/'+id,method:'POST',params:{like_action:!liked},json:true});const next=typeof result?.user_like_action==='boolean'?result.user_like_action:!liked;button.dataset.liked=next?'1':'0';const label=button.querySelector('.sharedCommentLikeLabel');if(label)label.textContent=next?'Unlike':'Like';const count=button.closest('.sharedCommentCard')?.querySelector('.sharedCommentLikeNumber');if(count)count.textContent=String(Math.max(0,(Number(count.textContent)||0)+(next?1:-1)))}catch(error){showAppDialog('Unable to update comment like',error?.message||String(error))}finally{button.disabled=false}});
  panel.querySelectorAll('[data-shared-comment-like-count]').forEach(button=>button.onclick=()=>showLikeUsers('like/'+updateId+'/comment/'+button.dataset.sharedCommentLikeCount));
  panel.querySelector('[data-shared-cancel-reply]')?.addEventListener('click',()=>{const composer=panel.querySelector('.sharedCommentInlineComposer');if(composer)composer.hidden=true});
  panel.querySelector('[data-shared-post-comment]')?.addEventListener('click',async()=>{const field=panel.querySelector('.sharedCommentInlineComposer textarea'),body=field?.value.trim(),button=panel.querySelector('[data-shared-post-comment]');if(!body)return;button.disabled=true;try{await A.api({path:realm+'/'+realmId+'/updates/'+updateId+'/comments',method:'POST',params:{comment:body,parent_id:Number(field.dataset.parentId||0)},json:true});await loadSharedPostComments(realm,realmId,updateId,panel,{inline})}catch(error){button.disabled=false;showAppDialog('Unable to post comment',error?.message||String(error))}});
  return comments.length;
 }catch(error){panel.innerHTML='<div class="error apiError">'+esc(error?.message||String(error))+'</div>';return 0}
}
function openSharedCommentComposer(realm,realmId,updateId){
 const old=document.getElementById('sharedCommentComposerDialog');old?.remove();
 const wrap=document.createElement('div');wrap.id='sharedCommentComposerDialog';wrap.className='sharedOverlay';
 wrap.innerHTML='<m3e-dialog open class="sharedM3eDialog" disable-close><span slot="header">Add comment</span><div class="sharedComposerBody"><textarea id="sharedCommentComposerText" aria-label="Write a comment" placeholder="Write a comment…"></textarea></div><span slot="actions" end><m3e-button data-shared-composer-cancel variant="text">Cancel</m3e-button><m3e-button data-shared-composer-post variant="filled">Post</m3e-button></span></m3e-dialog>';
 document.body.appendChild(wrap);wrap.querySelector('[data-shared-composer-cancel]')?.addEventListener('click',()=>wrap.remove());
 wrap.querySelector('[data-shared-composer-post]')?.addEventListener('click',async()=>{const field=wrap.querySelector('textarea'),body=field?.value.trim(),button=wrap.querySelector('[data-shared-composer-post]');if(!body)return;button.disabled=true;try{await A.api({path:realm+'/'+realmId+'/updates/'+updateId+'/comments',method:'POST',params:{comment:body,parent_id:0},json:true});wrap.remove();const openDialog=document.getElementById('sharedPostCommentsDialog');if(openDialog){openDialog.remove();openSharedPostCommentsDialog(realm,realmId,updateId);return}const panel=[...document.querySelectorAll('[data-shared-post-panel]')].find(node=>String(node.dataset.sharedPostPanel)===String(updateId));if(panel)await loadSharedPostComments(realm,realmId,updateId,panel);else openSharedPostCommentsDialog(realm,realmId,updateId)}catch(error){button.disabled=false;showAppDialog('Unable to post comment',error?.message||String(error))}});
 requestAnimationFrame(()=>wrap.querySelector('textarea')?.focus());
}
function openSharedPostCommentsDialog(realm,realmId,updateId){
 const old=document.getElementById('sharedPostCommentsDialog');old?.remove();
 const wrap=document.createElement('div');wrap.id='sharedPostCommentsDialog';wrap.className='sharedOverlay';
 wrap.innerHTML='<m3e-dialog open class="sharedM3eDialog sharedCommentsDialog" disable-close><span slot="header">Comments</span><div class="sharedCommentsDialogBody" id="sharedPostCommentsDialogBody"></div><span slot="actions" end><m3e-button data-shared-comment-compose variant="text">Add comment</m3e-button><m3e-button data-shared-comments-close variant="text">Close</m3e-button></span></m3e-dialog>';
 document.body.appendChild(wrap);wrap.querySelector('[data-shared-comments-close]')?.addEventListener('click',()=>wrap.remove());wrap.querySelector('[data-shared-comment-compose]')?.addEventListener('click',()=>openSharedCommentComposer(realm,realmId,updateId));
 loadSharedPostComments(realm,realmId,updateId,wrap.querySelector('#sharedPostCommentsDialogBody'));
}
function wireSharedPostList(root,realm,realmId,posts,{authorUsers={},canDelete=false,deletePathPrefix=null}={}){
 const context=element=>{const card=element?.closest('[data-shared-post-id]');return {realm:card?.dataset.sharedPostRealm||realm,realmId:card?.dataset.sharedPostRealmId||realmId}};
 root.querySelectorAll('[data-shared-post-author]').forEach(button=>button.onclick=()=>{const id=button.dataset.sharedPostAuthor;if(id)openProfileById(id,button.textContent||'Profile')});
 root.querySelectorAll('[data-shared-post-context-group]').forEach(button=>button.onclick=async()=>{const id=Number(button.dataset.sharedPostContextGroup||0);if(!id)return;const group=state.__activityGroups?.[id]||{id,name:button.textContent||'Group'};state.tab='groups';state.screen='app';state.currentGroup=group;state.toolbarTitle=group.name||group.title||'Group';render();await showGroup(group,'updates')});
 root.querySelectorAll('[data-shared-post-comment]').forEach(button=>button.onclick=()=>{const c=context(button);openSharedCommentComposer(c.realm,c.realmId,button.dataset.sharedPostComment)});
 root.querySelectorAll('[data-shared-post-comments]').forEach(button=>button.onclick=()=>{const c=context(button);openSharedPostCommentsDialog(c.realm,c.realmId,button.dataset.sharedPostComments)});
 root.querySelectorAll('[data-shared-post-like-count]').forEach(button=>button.onclick=()=>showLikeUsers('like/'+button.dataset.sharedPostLikeCount));
 root.querySelectorAll('[data-shared-post-like]').forEach(button=>button.onclick=async()=>{const id=button.dataset.sharedPostLike,liked=button.dataset.liked==='1';if(!id||button.disabled)return;button.disabled=true;try{const result=await A.api({path:'like/'+id,method:'POST',params:{like_action:!liked},json:true});const next=typeof result?.user_like_action==='boolean'?result.user_like_action:!liked;button.dataset.liked=next?'1':'0';const label=button.querySelector('.sharedPostLikeLabel');if(label)label.textContent=next?'Unlike':'Like';const card=button.closest('[data-shared-post-id]'),count=card?.querySelector('[data-shared-post-like-count] .sharedPostCountLabel');if(count)count.textContent=String(Math.max(0,(Number(count.textContent)||0)+(next?1:-1)));const post=posts.find(row=>String(sharedPostId(row))===String(id));if(post){post.user_liked=next;post.liked=next;post.likes=Math.max(0,Number(post.likes??post.like_count??0)+(next?1:-1))}}catch(error){showAppDialog('Unable to update like',error?.message||String(error))}finally{button.disabled=false}});
 root.querySelectorAll('[data-shared-post-delete]').forEach(button=>button.onclick=async()=>{if(!confirm('Delete this update?'))return;const id=button.dataset.sharedPostDelete,c=context(button);try{await A.api({path:deletePathPrefix?deletePathPrefix+'/'+id:c.realm+'/'+c.realmId+'/updates/'+id,method:'DELETE',params:{}});button.closest('[data-shared-post-id]')?.remove()}catch(error){showAppDialog('Unable to delete update',error?.message||String(error))}});
 root.querySelectorAll('[data-shared-post-preview]').forEach(preview=>{const c=context(preview),id=preview.dataset.sharedPostPreview,card=preview.closest('[data-shared-post-id]'),count=Number(card?.querySelector('[data-shared-post-comments] .sharedPostCountLabel')?.textContent||0);if(count>0)void loadSharedPostPreview(c.realm,c.realmId,id,preview)});
 root.querySelectorAll('[data-shared-post-panel]').forEach(panel=>{const card=panel.closest('[data-shared-post-id]'),likeCount=card?.querySelector('[data-shared-post-like-count] .sharedPostCountLabel'),commentCount=card?.querySelector('[data-shared-post-comments] .sharedPostCountLabel');if(likeCount)likeCount.textContent=likeCount.textContent||'0';if(commentCount)commentCount.textContent=commentCount.textContent||'0'});
}
async function loadCourseUpdates(course,el){
 const sid=course.id||course.section_id||course.sectionId,uid=state.auth?.userId||state.auth?.user?.id;
 if(!sid)throw new Error('Course section ID is missing.');
 let start=0,limit=20,all=[],authorUsers={},next=true,loading=false;
 const render=async()=>{const cards=all.map(post=>{const id=sharedPostId(post),au=authorUsers[Number(post.user_id||post.uid||post.author_id||post.authorId)]||{},author=post.display_name||post.author_name||au.name_display||au.display_name||au.name||'Schoology',avatar=normalizeImageUrl(au.picture_url||au.pictureUrl||au.picture||au.photo_url||post.user_photo||post.photo_url||''),canDelete=uid&&String(post.uid||post.user_id||post.author_id||'')===String(uid);return renderSharedPostCard({post,id,realm:'sections',realmId:sid,author,avatar,authorId:au.id||post.user_id||post.uid||post.author_id||post.authorId||'',canDelete,cardClass:'sectionFullUpdate'})}).join('');
  el.innerHTML=(cards||'<div class="empty"><h2>No updates</h2><p>There are no updates in this course.</p></div>')+(next?'<button id="courseUpdateMore" class="androidMoreButton">Load more</button>':'');
  await hydrateMediaImages(el);wireSharedPostList(el,'sections',sid,all,{authorUsers,canDelete:true,deletePathPrefix:'sections/'+sid+'/updates'});
  el.querySelector('#courseUpdateMore')?.addEventListener('click',()=>loadPage(false));
 };
 const loadPage=async(reset)=>{if(loading)return;loading=true;if(reset){start=0;all=[];next=true}try{const x=await A.api({path:'sections/'+sid+'/updates',params:{start,limit,with_attachments:'TRUE',richtext:1}});const rows=x.update||x.updates||x.update_list||[];const ids=[...new Set(rows.map(post=>post.user_id||post.uid||post.author_id||post.authorId).filter(Boolean).map(Number))];await Promise.all(ids.map(async id=>{if(authorUsers[id])return;try{const q=await A.api({path:'users/'+id,params:{}});authorUsers[id]=q?.user||q}catch{}}));all=all.concat(rows);next=!!(x.links?.next||x.link?.next||rows.length>=limit);start+=rows.length;await render()}finally{loading=false}};
 await loadPage(true);
}
async function loadCourseUpdateComments(sectionId,updateId,panel){return loadSharedPostComments('sections',sectionId,updateId,panel,{inline:true})}

function openCourseUpdateComposer(course){
 const sid=course.id||course.section_id||course.sectionId;
 const old=document.getElementById('courseUpdateComposer');old?.remove();
 const wrap=document.createElement('div');wrap.id='courseUpdateComposer';wrap.className='courseUpdateComposer';
 wrap.innerHTML='<m3e-dialog open class="courseUpdateDialog" disable-close><span slot="header">Post Update</span><div class="courseUpdateComposerInner"><textarea id="courseUpdateBody" placeholder="Write an update…"></textarea></div><span slot="actions" end><m3e-button id="cancelCourseUpdate" variant="text">Cancel</m3e-button><m3e-button id="submitCourseUpdate" variant="filled">Post</m3e-button></span></m3e-dialog>';
 document.body.appendChild(wrap);
 document.getElementById('cancelCourseUpdate')?.addEventListener('click',()=>wrap.remove());
 document.getElementById('submitCourseUpdate')?.addEventListener('click',async()=>{
   const body=document.getElementById('courseUpdateBody')?.value.trim();if(!body)return;
   try{await A.api({path:`sections/${sid}/updates`,method:'POST',params:{body},signBody:true});wrap.remove();await loadCourseTab(course,'updates')}catch(e){alert('Unable to post update: '+e.message)}
 });
 document.getElementById('courseUpdateBody')?.focus();
}

async function loadCourseTab(course,tab){
 const el=document.getElementById('sectionProfileContent');if(!el)return;
 const sid=course.id||course.section_id||course.sectionId;
 if(!sid)throw new Error('Course section ID is missing.');
 if(tab==='materials'){
   await loadFolder(course,0);
   return;
 }
 if(tab==='updates'){
   await loadCourseUpdates(course,el);
   return;
 }
 if(tab==='members'){
   const response=await A.api({path:'sections/'+sid+'/enrollments',params:{start:0,limit:200,enrollment_status:1}});
   const raw=response?.enrollment||response?.enrollments||response?.data?.enrollment||response?.data?.enrollments||response?.data?.items||[],entries=normalizeSchoologyList(raw,['enrollment','enrollments','items','member','members','user','users','data']);
   const people=entries.filter(person=>String(person.status??1)==='1').map(person=>({...person,id:person.uid||person.user_id||person.userId||person.user?.id||'',uid:person.uid||person.user_id||person.userId||person.user?.id||'',name_first:person.name_first||person.user?.name_first||'',name_last:person.name_last||person.user?.name_last||'',name_display:person.name_display||person.user?.name_display||person.user?.name||'',name_first_preferred:person.name_first_preferred||person.user?.name_first_preferred||'',picture_url:person.picture_url||person.pictureUrl||person.user?.picture_url||person.user?.pictureUrl||'',admin:person.admin??person.is_admin??person.isAdmin,is_admin:person.is_admin??person.isAdmin,role:person.role??person.role_name??person.roleName})).filter(person=>person.id);
   renderM3ePeopleDirectoryInto(el,people,{placeholder:'Search course members',membersMode:true,onRefresh:()=>loadCourseTab(course,'members'),onSelect:person=>openProfileById(person.id,person.name_display||[person.name_first,person.name_last].filter(Boolean).join(' ')||'Profile')});
   return;
 }
 if(tab==='upcoming'){
   const x=await A.api({path:`sections/${sid}/events`,params:{start_date:formatApiDate(new Date()),limit:20}});
   let arr=x.event||x.events||[];
   arr=arr.filter(e=>['assignment','assessment','assessment_v2','managed_assessment','discussion','external_tool','event'].includes(String(e.type||'')));
   el.innerHTML=renderUpcoming(arr);
   document.querySelectorAll('[data-course-upcoming-id]').forEach(b=>b.onclick=async()=>{const e=arr.find(v=>String(v.id||'')===String(b.dataset.courseUpcomingId));if(!e)return;const type=String(e.type||'').toLowerCase();const aid=e.assignment_id??e.assignmentId??e.assignment?.id;const esid=e.section_id??e.sectionId??sid;if(type==='assignment'&&aid){showAssignment(esid,aid);return}if(['assessment','assessment_v2','managed_assessment','quiz'].includes(type)){const id=aid??e.id;if(id){(async()=>{await A.prepareWebSession();showEmbeddedWeb(`https://app.schoology.com/assignment/${id}`,e.title||'Quiz',{allowBrowser:false,quiz:true,assessment:true})})();return}}if(e.web_url||e.webUrl)openWithPressTransition(b,()=>showEmbeddedWeb(e.web_url||e.webUrl,e.title||'Upcoming'));else if(type==='discussion'){const did=upcomingDiscussionId(e);if(did)openWithPressTransition(b,()=>showDiscussionNative('sections',esid,did,e.title||'Discussion'));else if(e.web_url||e.webUrl)openWithPressTransition(b,()=>showEmbeddedWeb(e.web_url||e.webUrl,e.title||'Discussion'));}});
   return;
 }
 if(tab==='grades'||tab==='gradebook'){
   await loadSectionGrades(course);
   return;
 }
 if(tab==='attendance'){
   await loadAttendanceTab(course);
   return;
 }
 if(tab==='courseapp'){
   await loadCourseApps(course,el);
   return;
 }
}

function animateTab(){ /* Restored to the Android pager's stable tab layout; no custom overlay animation. */ }
function upcomingDiscussionId(event){const nested=event?.discussion;const value=event?.discussion_id??event?.discussionId??nested?.discussion_id??nested?.discussionId??nested?.id??((typeof nested==='number'||typeof nested==='string')?nested:null);return value&&typeof value==='object'?(value.id||value.discussion_id||value.discussionId||null):value}
function renderUpcoming(events){
 const arr=Array.isArray(events)?events:[];if(!arr.length)return '<div class="empty"><h2>No upcoming events</h2></div>';
 const groups=[],byDate=new Map(),sorted=arr.slice().sort((a,b)=>new Date(String(a.start||a.due||'').replace(' ','T'))-new Date(String(b.start||b.due||'').replace(' ','T')));
 for(const e of sorted){const rawDate=(String(e.type||'').toLowerCase()==='assignment'?(e.due||e.due_date||e.dueDate||e.start):(e.start||e.due||e.due_date||e.dueDate)),d=new Date(String(rawDate||'').replace(' ','T')),key=Number.isNaN(d.getTime())?'':d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();if(!byDate.has(key)){const g={key,date:d,items:[]};byDate.set(key,g);groups.push(g)}byDate.get(key).items.push(e)}
 return '<div class="upcomingList">'+groups.map(g=>{const label=Number.isNaN(g.date.getTime())?'':g.date.toLocaleDateString([], {weekday:'short',month:'short',day:'numeric',year:'numeric'}),rows=g.items.map(e=>`<m3e-list-action class="upcomingRow upcomingAssignment" data-course-upcoming-id="${esc(e.id||'')}" tabindex="0"><span slot="leading" class="m3eOriginalIcon">${officialOrAssetIcon(upcomingIcon(e),'')}</span><span>${esc(e.title||e.name||'Upcoming')}</span><span slot="supporting-text">${esc(upcomingSupportingText(e))}</span></m3e-list-action>`).join('');return `<section class="upcomingDateGroup"><div class="upcomingDateHeader"><span class="upcomingDateLabel">${esc(label)}</span></div><m3e-action-list variant="segmented" class="upcomingSegmentedList">${rows}</m3e-action-list></section>`}).join('')+'</div>';
}

function upcomingIcon(e){const t=String(e?.type||'').toLowerCase();if(t==='assignment')return 'ic_assignment.png';if(t==='assessment')return 'ic_test_quiz.png';if(['assessment_v2','managed_assessment','quiz'].includes(t))return 'ic_assessment_48dp.png';if(t==='discussion')return 'ic_discussion.png';if(t==='external_tool')return 'ic_external_tool.png';if(t==='event')return 'home_dash_upcoming.png';return 'ic_date_range_24px.png';}
function upcomingSupportingText(e){const start=e?.start||e?.due||e?.due_date||e?.dueDate||'';if(!start)return '';try{return formatSchoologyDate(start)}catch{return String(start)}}

function formatSchoologyDate(v){if(v===null||v===undefined||v==='')return '';const n=Number(v);const d=(Number.isFinite(n)&&n>0)?new Date(n*1000):new Date(String(v).replace(' ','T'));if(Number.isNaN(d.getTime()))return String(v);return d.toLocaleDateString([], {weekday:'short',month:'short',day:'numeric',year:'numeric'})+' at '+d.toLocaleTimeString([], {hour:'numeric',minute:'2-digit'});}
function formatApiDate(d){const p=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`;}
async function loadSectionGrades(course){
 const el=document.getElementById('sectionProfileContent')||document.getElementById('gradesContent');if(!el)return;
 const sid=course.id||course.section_id||course.sectionId;
 const uid=state.auth?.userId||state.auth?.user?.id;if(!uid)throw new Error('Schoology did not return the logged-in user ID.');
 const [section,periods,categories,items,userGrades]=await Promise.all([
  A.api({path:`sections/${sid}`,params:{}}),
  A.api({path:`sections/${sid}/grading_periods`,params:{}}),
  A.api({path:`sections/${sid}/grading_categories`,params:{}}),
  A.api({path:`sections/${sid}/grade_items`,params:{limit:2000}}),
  A.api({path:`users/${uid}/grades`,params:{section_id:sid}})
 ]);
 const assignments=items.assignment||items.assignments||[];
 const gs=userGrades.section||userGrades.sections||[];
 const current=gs.find(s=>String(s.section_id||s.id)===String(sid))||gs[0]||{};
 try{await hydrateUserCourseGrades([current])}catch{}
 const byId={};
 for(const per of (current.period||current.periods||[])){
  for(const ga of (per.assignment||per.assignments||[]))byId[String(ga.assignment_id||ga.id)]={...ga};
 }
 const rows=assignments.map(a=>({...a,gradeData:byId[String(a.id)]||{}}));
 el.innerHTML=`<div class="gradesAndroid">${renderOverallGrade(current)}${renderGradePeriods(rows,periods,categories)}</div>`;
 el.querySelectorAll('[data-grade-assignment]').forEach(b=>b.onclick=async()=>{const type=String(b.dataset.gradeType||'assignment').toLowerCase(),id=Number(b.dataset.gradeAssignment);if(!id)return;if(['assessment','assessment_v2','managed_assessment','quiz'].includes(type)){await A.prepareWebSession();showEmbeddedWeb(`https://app.schoology.com/assignment/${id}`,b.textContent?.trim()||'Quiz',{allowBrowser:false,quiz:true,assessment:true});}else if(type==='discussion'){await A.prepareWebSession();showEmbeddedWeb(`https://app.schoology.com/section/${sid}/discussion/view/${id}`,b.textContent?.trim()||'Discussion');}else showAssignment(sid,id)});
}
function getFinalGradeObject(sec){
 const raw=sec?.final_grade??sec?.finalGrade??sec?.final_grades??sec?.finalGrades??sec?.final??null;
 const arr=Array.isArray(raw)?raw:(raw&&typeof raw==='object'?[raw]:[]);
 // Android uses the FINAL period object and checks override_str first, then
 // override_numeric, before formatting the calculated grade.
 return arr.find(x=>String(x?.period_id??x?.periodId??'').toLowerCase()==='final')
   ||arr.find(x=>x&&String(x?.override_str??x?.overrideStr??x?.overrideStringGrade??'').trim())
   ||arr.find(x=>x&&((x.override_numeric??x.overrideNumericGrade)!=null))
   ||arr.find(x=>x&&((x.grade??x.calculated_grade??x.calculatedGrade)!=null))
   ||arr[0]||{};
}
function findStringGradeOverride(sec){
 const raw=sec?.final_grade??sec?.finalGrade??sec?.final_grades??sec?.finalGrades??sec?.final??null;
 const arr=Array.isArray(raw)?raw:(raw&&typeof raw==='object'?[raw]:[]);
 const final=arr.find(x=>String(x?.period_id??x?.periodId??'').toLowerCase()==='final')||arr[0];
 const direct=final?.override_str??final?.overrideStr??final?.overrideStringGrade??final?.overrideString??final?.grade_override??final?.gradeOverride;
 if(typeof direct==='string'&&direct.trim())return direct.trim();
 const seen=new Set();
 const walk=(v,depth=0)=>{
   if(v==null||depth>6||typeof v!=='object')return '';
   if(seen.has(v))return ''; seen.add(v);
   if(Array.isArray(v)){for(const x of v){const hit=walk(x,depth+1);if(hit)return hit}return '';}
   const d=v.override_str??v.overrideStr??v.overrideStringGrade??v.overrideString??v.grade_override??v.gradeOverride;
   if(typeof d==='string'&&d.trim())return d.trim();
   for(const k of ['final_grade','finalGrade','final_grades','finalGrades','override_grade','overrideGrade','override_grades','overrideGrades']){const hit=walk(v[k],depth+1);if(hit)return hit}
   return '';
 };
 return walk(sec);
}
function getFinalGradeDisplay(sec){
 const firstDefined=(...values)=>values.find(v=>v!==undefined&&v!==null&&String(v).trim()!=='');
 const rawFinal=sec?._resolvedFinalGrade??sec?.final_grade??sec?.finalGrade??sec?.final_grades??sec?.finalGrades??[];
 const finals=(Array.isArray(rawFinal)?rawFinal:(rawFinal?[rawFinal]:[])).filter(v=>v&&typeof v==='object');
 const periodList=f=>{const v=f?.period??f?.periods??f?.final_period??f?.finalPeriod??f?.final_grade_period??f?.finalGradePeriod??[];return Array.isArray(v)?v:(v?[v]:[])};
 const entries=finals.flatMap(final=>{const periods=periodList(final);return periods.length?periods.map(period=>({final,period:period||{}})):[{final,period:{}}]});
 const entry=entries.find(e=>String(e.period?.period_id??e.period?.periodId??'')==='final')||{final:finals[0]||{},period:{}};
 const final=entry.final||{},period=entry.period||{};
 const override=firstDefined(period.override_str,period.overrideStr,period.override_string,period.overrideString,period.grade_override,period.gradeOverride,final.override_str,final.overrideStr,final.override_string,final.overrideString,final.grade_override,final.gradeOverride);
 if(override!==undefined)return {value:String(override).trim(),letter:String(override).trim(),percentage:'',overridden:true,final,period};
 const numericOverride=firstDefined(period.override_numeric,period.overrideNumeric,final.override_numeric,final.overrideNumeric);
 const grade=numericOverride!==undefined?numericOverride:firstDefined(period.grade,final.grade,final.calculated_grade,final.calculatedGrade,sec?.grade);
 if(grade===undefined)return {value:'—',letter:'',percentage:'',overridden:false,final,period};
 const numeric=Number(String(grade).replace(/%$/,''));
 if(Number.isFinite(numeric)){
  const letter=letterGradeForCourse(sec,entry,numeric),scale=gradingScaleForCourse(sec,entry);
  const pct=formatGradeNumber(numeric)+'%';
  const scaleType=Number(scale?.type??scale?.scale_type??scale?.scaleType);
  const hideNumeric=[true,1,'1','true'].includes(scale?.hide_numeric??scale?.hideNumeric);
  if(letter&&scaleType===1)return {value:hideNumeric?letter:`${letter} (${pct})`,letter,percentage:pct,overridden:numericOverride!==undefined,final,period};
  return {value:pct,letter:'',percentage:pct,overridden:numericOverride!==undefined,final,period};
 }
 return {value:String(grade),letter:'',percentage:'',overridden:numericOverride!==undefined,final,period};
}
function formatGradeNumber(value){const n=Number(value);return Number.isFinite(n)?String(Number(n.toFixed(2))):String(value)}
function gradingScaleForCourse(sec,entry){
 const final=entry?.final||{},period=entry?.period||{};
 const scaleId=String(final.scale_id??final.scaleId??period.scale_id??period.scaleId??sec?._gradeScaleId??'');
 const root=sec?._gradingScales||{};
 const raw=root.grading_scale??root.gradingScale??root.scales??root.scale??root.data?.grading_scale??root.data?.scales??[];
 const scales=Array.isArray(raw)?raw:(raw?[raw]:[]);
 let scale=scales.find(s=>String(s.id??s.scale_id??s.scaleId??'')===scaleId);
 if(!scale&&scales.length===1)scale=scales[0];
 return scale||null;
}
function letterGradeForCourse(sec,entry,numeric){
 const scale=gradingScaleForCourse(sec,entry);if(!scale)return '';
 const type=Number(scale.type??scale.scale_type??scale.scaleType);
 if(Number.isFinite(type)&&type!==1)return '';
 const lv=scale.scale?.level??scale.scale?.levels?.level??scale.scale?.levels??scale.levels?.level??scale.levels??scale.level??[];
 const levels=(Array.isArray(lv)?lv:(lv?[lv]:[])).map(l=>({grade:l.grade??l.title??l.name,cutoff:Number(l.cutoff??l.average??l.percent??l.percentage)})).filter(l=>l.grade!=null&&Number.isFinite(l.cutoff)).sort((a,b)=>b.cutoff-a.cutoff);
 const matched=levels.find(l=>numeric>=l.cutoff);return matched?String(matched.grade):'';
}
async function hydrateUserCourseGrades(sections){
 const uid=state.auth?.userId||state.auth?.user?.id;
 await Promise.all((sections||[]).map(async sec=>{
  const sid=sec.section_id??sec.sectionId??sec.id;if(!sid)return;
  try{
   const [grades,scales,enrollments,sectionDetail]=await Promise.all([
    A.api({path:`sections/${sid}/grades`,params:{}}).catch(()=>null),
    A.api({path:`sections/${sid}/grading_scales`,params:{}}).catch(()=>null),
    A.api({path:`sections/${sid}/enrollments`,params:{start:0,limit:200,enrollment_status:1}}).catch(()=>null),
    A.api({path:`sections/${sid}`,params:{}}).catch(()=>null)
   ]);
   const all=grades?.final_grade??grades?.finalGrade??grades?.final_grades??[];
   const list=Array.isArray(all)?all:(all?[all]:[]);
   const enrollmentList=enrollments?.enrollment??enrollments?.enrollments??[];
   const myEnrollment=enrollmentList.find(en=>String(en.uid??en.user_id??en.userId??'')===String(uid));
   const enrollmentId=String(myEnrollment?.id??sec.enrollment_id??sec.enrollmentId??sec.enrollment?.id??'');
   let matched=list.find(f=>enrollmentId&&String(f.enrollment_id??f.enrollmentId??'')===enrollmentId);
   if(!matched&&list.length===1)matched=list[0];
   if(matched)sec._resolvedFinalGrade=[matched];
   sec._gradingScales=scales||{};
   const matchedPeriods=matched?.period??matched?.periods??matched?.final_period??matched?.finalPeriod??[];
   const periodArray=Array.isArray(matchedPeriods)?matchedPeriods:(matchedPeriods?[matchedPeriods]:[]);
   const finalPeriod=periodArray.find(p=>String(p?.period_id??p?.periodId??'')==='final');
   sec._gradeScaleId=finalPeriod?.scale_id??finalPeriod?.scaleId??matched?.scale_id??matched?.scaleId??sec.scale_id??sec.scaleId??sectionDetail?.section?.options?.default_grading_scale_id??sectionDetail?.options?.default_grading_scale_id;
  }catch{}
 }));
}
function renderOverallGrade(sec){
 const display=getFinalGradeDisplay(sec);
 const final=display.final;
 const comment=typeof final.comment==='string'?final.comment:(final.comment?.comment||final.comment?.body||'');
 return `<m3e-card variant="filled" class="gradeOverallCard"><div slot="content"><m3e-heading variant="label" size="large">Overall Grade</m3e-heading><m3e-heading variant="headline" size="large" class="gradeOverallValue">${esc(display.value)}</m3e-heading>${comment?`<m3e-divider></m3e-divider><m3e-heading variant="label" size="medium">Teacher Comment</m3e-heading><p class="gradeOverallTeacherComment">${comment}</p>`:''}</div></m3e-card>`;
}
function renderGradePeriods(rows,periods,categories){
 const ps=periods?.grading_period||periods?.period||[];const cs=categories?.grading_category||categories?.category||[];
 const pmap={};ps.forEach(p=>pmap[String(p.id)]=p.title||p.name||'Grading Period');
 const cmap={};cs.forEach(c=>cmap[String(c.id)]=c.title||c.name||'Category');
 const periodGroups={};
 rows.forEach(a=>{
  const pid=String(a.grading_period_id??a.grading_period??a.period_id??'0');
  const cid=String(a.grading_category_id??a.grading_category??a.category_id??'0');
  (periodGroups[pid]??={}).__title=pmap[pid]||'Grading Period';
  (periodGroups[pid][cid]??=[]).push(a);
 });
 const periodsHtml=[];
 Object.keys(periodGroups).forEach(pid=>{
  const pg=periodGroups[pid], periodTitle=pg.__title||'Grading Period';
  const inner=[];
  Object.keys(pg).filter(k=>k!=='__title').forEach(cid=>{
   const list=pg[cid],meta=cs.find?.(x=>String(x.id)===cid)||{};
   inner.push(`<m3e-expansion-panel class="gradeCategoryInner" open><span slot="header">${esc(meta.title||meta.name||cmap[cid]||'Category')}${meta.weight!=null?` <small>${esc(meta.weight)}%</small>`:''}</span><m3e-list variant="segmented" class="gradeItemList">${list.sort((a,b)=>String(a.title||'').localeCompare(String(b.title||''))).map(a=>{const g=a.gradeData||{};const raw=g.grade??g.calculated_grade??g.score??'—';const max=a.max_points??a.maxPoints??g.max_points??g.maxPoints;const value=(raw!=='—'&&max!=null&&String(max)!=='')?`${raw}/${max}`:raw;const comment=typeof g.comment==='string'?g.comment:(g.comment?.comment||g.comment?.body||'');return `<m3e-list-action class="gradeAssignmentRow" data-grade-assignment="${esc(a.id||'')}" data-grade-type="${esc(a.type||a.template_type||a.type_name||'assignment')}"><span class="gradeAssignmentTitle">${esc(a.title||a.assignment_title||'Assignment')}</span><span slot="supporting-text">${comment?esc(comment):''}</span><span slot="trailing">${esc(value)}</span></m3e-list-action>`}).join('')||'<m3e-list-item>No graded items.</m3e-list-item>'}</m3e-list></m3e-expansion-panel>`);
  });
  periodsHtml.push(`<m3e-expansion-panel class="gradePeriodSection" open><span slot="header">${esc(periodTitle)}</span><div class="gradePeriodInnerPanels">${inner.join('')||'<m3e-list-item>No graded items.</m3e-list-item>'}</div></m3e-expansion-panel>`);
 });
 if(!periodsHtml.length)return '<m3e-card variant="outlined" class="gradeEmptyCard"><m3e-heading variant="title" size="large">No grades</m3e-heading></m3e-card>';
 return `<div class="gradesPeriodsStack">${periodsHtml.join('')}</div>`;
}

function renderGrades(rows){return renderGradePeriods(rows,{grading_period:[]},{grading_category:[]});}

function openNativeCommentComposer(kind,view,parentId='0'){
 const old=document.getElementById('nativeCommentDialog');old?.remove();const wrap=document.createElement('div');wrap.id='nativeCommentDialog';wrap.className='assignmentCommentDialogOverlay';
 wrap.innerHTML=`<m3e-dialog open class="assignmentCommentDialog" disable-close><span slot="header" class="androidCommentDialogBar"><button id="nativeCommentCancel" class="androidDialogIcon" aria-label="Cancel">${officialIcon('ic_action_discard_icon.png','Cancel')}</button><div class="androidDialogTitle">Comment</div><button id="nativeCommentSend" class="androidDialogIcon" aria-label="Post">${officialIcon('ic_action_send_icon.png','Post')}</button></span><div class="androidCommentDialogBody"><textarea id="nativeCommentBody" placeholder="Post a comment…" autofocus></textarea><div class="commentAttachmentActions"><button id="nativeAttachFile">${officialOrAssetIcon('ic_action_ic_menu_folder.png','')}File</button><button id="nativeAttachResource">${officialOrAssetIcon('ic_attach_resourcesv3.png','')}Resource</button></div><div id="nativeAttachStatus"></div></div></m3e-dialog>`
 document.body.appendChild(wrap);const close=()=>{wrap.remove();if(view?.tab==='comments')syncToolbar()};wrap.querySelector('#nativeCommentCancel').onclick=close;wrap.onclick=e=>{if(e.target===wrap)close()};
 wrap.querySelector('#nativeAttachFile').onclick=async()=>{try{const f=await A.pickFile?.();if(f){wrap.dataset.file=f.path||f.filePath||'';wrap.querySelector('#nativeAttachStatus').textContent='File attached: '+(f.name||f.fileName||f.path||'Selected file')}}catch(e){alert('Unable to select file: '+e.message)}};
 wrap.querySelector('#nativeAttachResource').onclick=async()=>{try{await chooseSchoologyResource(r=>{const id=r.template_id??r.templateID??r.resource_id??r.resourceId??r.template?.id??r.id;if(id==null)throw new Error('This resource does not have a usable Schoology resource ID.');wrap.dataset.resource=id;wrap.querySelector('#nativeAttachStatus').textContent='Resource attached: '+resourceTitle(r)},'Attach Resource')}catch(e){alert('Unable to load resources: '+e.message)}};
 wrap.querySelector('#nativeCommentSend').onclick=async()=>{const body=wrap.querySelector('#nativeCommentBody').value.trim();if(!body)return;const btn=wrap.querySelector('#nativeCommentSend');btn.disabled=true;try{const params={comment:body,parent_id:Number(parentId)||0};if(wrap.dataset.file){const id=await A.uploadSchoologyFile({filePath:wrap.dataset.file});params['file-attachment']={id:[Number(id)||id]}}if(wrap.dataset.resource)params.attachments=[{resource:Number(wrap.dataset.resource)||wrap.dataset.resource}];const path=`${view.realm}/${view.realmId}/${kind==='event'?'events':'discussions'}/${kind==='event'?view.eventId:view.discussionId}/comments`;await A.api({path,method:'POST',params,json:true});close();if(kind==='event')showEventNative(view.realm,view.realmId,view.eventId,state.toolbarTitle,'comments');else showDiscussionNative(view.realm,view.realmId,view.discussionId,state.toolbarTitle,'comments')}catch(e){btn.disabled=false;alert('Unable to post comment: '+e.message)}};
 requestAnimationFrame(()=>wrap.querySelector('#nativeCommentBody')?.focus());
}

async function showDiscussionNative(realm,realmId,discussionId,title='Discussion',initialTab='info'){
 const c=document.getElementById('content');if(!c)return;const previousGroup=state.currentGroup,previousTab=state.groupTab;
 state.assignmentView=null;state.embeddedTitle=title;state.embeddedTheme='';state.embeddedReturn={tab:'groups',title:previousGroup?.name||'Groups',group:previousGroup,groupTab:previousTab||'discussions'};state.currentGroup=previousGroup;state.toolbarTitle=title;state.discussionView={realm,realmId,discussionId,tab:initialTab||'info',data:null};syncToolbar();
 c.innerHTML=`<section class="assignmentAndroidPage nativeGradeItemPage"><div class="assignmentTabs discussionTabs" id="discussionTabs"><m3e-tabs variant="secondary" class="m3eSchoologyTabs"><m3e-tab class="assignmentTab" data-discussion-tab="info" ${initialTab==='info'?'selected':''}>Info</m3e-tab><m3e-tab class="assignmentTab" data-discussion-tab="comments" ${initialTab==='comments'?'selected':''}>Discussion</m3e-tab></m3e-tabs></div><div id="discussionNativeContent" class="assignmentTabContent"></div></section>`;
 const box=()=>document.getElementById('discussionNativeContent');
 const loadInfo=async()=>{const el=box();el.innerHTML='<div class="loading"><m3e-circular-progress-indicator indeterminate class="m3eInlineProgress" aria-label="Loading"></m3e-circular-progress-indicator><span>Loading…</span></div>';try{const x=await A.api({path:`${realm}/${realmId}/discussions/${discussionId}`,params:{with_attachments:'TRUE',richtext:1}});const d=x?.discussion||x?.data?.discussion||x;state.discussionView.data=d;el.innerHTML=`<m3e-card variant="filled" class="assignmentInfoCard"><div class="assignmentInfoHeader"><h1>${esc(d?.title||title)}</h1><div>${esc(d?.due||d?.due_date||d?.dueDate||'')}</div></div><div class="assignmentDescription">${d?.body||d?.description||d?.message||'<span class="muted">No discussion content.</span>'}</div>${renderAttachments(d?.attachments||d?.attachment||{})}</m3e-card>`;el.querySelectorAll('a[href]').forEach(a=>a.onclick=async ev=>{const href=a.href||a.getAttribute('href');if(!href)return;ev.preventDefault();if(await routeSchoologyLink(href))return;await A.prepareWebSession();showEmbeddedWeb(href,a.textContent?.trim()||'Link')});await hydrateMediaImages(el)}catch(e){el.innerHTML=`<div class="error apiError"><b>Schoology could not load this discussion.</b><br>${esc(e.message)}</div>`}};
 const loadComments=async()=>{
  const el=box();el.innerHTML='<div class="loading"><m3e-circular-progress-indicator indeterminate class="m3eInlineProgress" aria-label="Loading"></m3e-circular-progress-indicator><span>Loading discussion…</span></div>';
  try{
   const response=await A.api({path:realm+'/'+realmId+'/discussions/'+discussionId+'/comments',params:{start:0,limit:100,with_attachments:'TRUE',richtext:1}});
   const comments=flattenSharedComments(response),hydrated=await hydrateDialogPeople(comments);
   el.innerHTML='<div class="commentsPage officialComments"><div class="commentsList sharedCommentsList">'+(comments.map((row,index)=>renderSharedCommentRow(row,comments,discussionId,hydrated[index])).join('')||'<div class="androidEmptyState">No discussion yet.</div>')+'</div></div>';
   await hydrateMediaImages(el);
   wireSharedCommentRows(el,{likePath:id=>'like/'+discussionId+'/comment/'+id,replyHandler:id=>openNativeCommentComposer('discussion',state.discussionView,id)});
  }catch(error){el.innerHTML='<div class="error apiError">'+esc(error?.message||String(error))+'</div>'}
 };
 const select=async tab=>{state.discussionView.tab=tab;syncM3eTabSelection(document.getElementById('discussionTabs'),'discussionTab',tab);syncToolbar();tab==='info'?await loadInfo():await loadComments()};document.querySelectorAll('#discussionTabs [data-discussion-tab]').forEach(b=>b.onclick=()=>select(b.dataset.discussionTab));await loadInfo();
}
async function showGroupAlbumNative(gid,albumId,title='Album'){
  const c=document.getElementById('content');if(!c)return;
  state.embeddedTitle=title||'Album';state.embeddedTheme='album';state.embeddedReturn={tab:'groups',title:state.currentGroup?.name||'Groups',group:state.currentGroup,groupTab:state.groupTab||'albums'};state.albumView={gid,albumId};state.toolbarTitle=title||'Album';syncToolbar();
  c.innerHTML='<section class="albumNativePage"><div class="loading"><m3e-circular-progress-indicator indeterminate class="m3eInlineProgress" aria-label="Loading"></m3e-circular-progress-indicator><span>Loading album…</span></div></section>';
  try{
    const x=await A.api({path:`groups/${gid}/albums/${albumId}`,params:{with_content:'TRUE'}});
    const album=x?.album||x?.data?.album||x;const content=album?.content||album?.contents||album?.media||[];const arr=Array.isArray(content)?content:(content?.content||[]);
    c.innerHTML=`<section class="albumNativePage"><div class="albumNativeTitle">${esc(album?.title||title||'Album')}</div><div class="albumNativeGrid">${arr.map((m,i)=>{const src=normalizeImageUrl(m?.thumbnail_url||m?.thumbnailUrl||m?.photo_url||m?.photoUrl||m?.image_url||m?.imageUrl||m?.url||'');return `<button class="albumNativeItem" data-album-item="${i}">${src?`<img data-media-image-url="${esc(src)}" alt="">`:`<img src="../assets/icons/ic_albums.png" alt="">`}<span>${esc(m?.caption||m?.title||'')}</span></button>`}).join('')||'<div class="empty">No media in this album.</div>'}</div></section>`;
    window.__groupAlbumContent=arr;await hydrateMediaImages(c);
    c.querySelectorAll('[data-album-item]').forEach(b=>b.onclick=()=>{const m=window.__groupAlbumContent[+b.dataset.albumItem];const u=m?.url||m?.photo_url||m?.photoUrl||m?.original_url||m?.originalUrl;if(u)showEmbeddedWeb(u,m?.title||m?.caption||'Album')});
  }catch(e){c.innerHTML=`<div class="error apiError"><b>Schoology could not load this album.</b><br>${esc(e.message)}</div>`}
}

async function renderEventComments(el,response,eventId){
 const comments=flattenSharedComments(response),hydrated=await hydrateDialogPeople(comments);
 el.innerHTML='<div class="commentsPage officialComments"><div class="commentsList sharedCommentsList">'+(comments.map((row,index)=>renderSharedCommentRow(row,comments,eventId,hydrated[index])).join('')||'<div class="androidEmptyState">No comments yet.</div>')+'</div></div>';
 await hydrateMediaImages(el);
 wireSharedCommentRows(el,{likePath:id=>'like/'+eventId+'/comment/'+id,replyHandler:id=>openNativeCommentComposer('event',state.eventView,id)});
}
async function showEventNative(realm,realmId,eventId,title='Event',initialTab='info'){
 const c=document.getElementById('content');if(!c)return;const previousGroup=state.currentGroup,previousTab=state.groupTab;state.embeddedTitle=title;state.embeddedTheme='';state.embeddedReturn={tab:previousGroup?'groups':'home',title:previousGroup?.name||'Home',group:previousGroup,groupTab:previousTab||'updates'};state.eventView={realm,realmId,eventId,tab:initialTab||'info'};state.toolbarTitle=title;syncToolbar();
 c.innerHTML=`<section class="assignmentAndroidPage nativeGradeItemPage"><div class="assignmentTabs discussionTabs" id="eventTabs"><m3e-tabs variant="secondary" class="m3eSchoologyTabs"><m3e-tab class="assignmentTab" data-event-tab="info" ${initialTab==='info'?'selected':''}>Info</m3e-tab><m3e-tab class="assignmentTab" data-event-tab="comments" ${initialTab==='comments'?'selected':''}>Comments</m3e-tab></m3e-tabs></div><div id="eventNativeContent" class="assignmentTabContent"></div></section>`;
 const load=async tab=>{state.eventView.tab=tab;syncM3eTabSelection(document.getElementById('eventTabs'),'eventTab',tab);syncToolbar();const el=document.getElementById('eventNativeContent');el.innerHTML='<div class="loading"><m3e-circular-progress-indicator indeterminate class="m3eInlineProgress" aria-label="Loading"></m3e-circular-progress-indicator><span>Loading…</span></div>';try{const x=await A.api({path:`${realm}/${realmId}/events/${eventId}`,params:{with_attachments:'TRUE',richtext:1}});const e=x?.event||x?.data?.event||x;if(tab==='comments'){const q=await A.api({path:`${realm}/${realmId}/events/${eventId}/comments`,params:{start:0,limit:50,with_attachments:'TRUE',richtext:1}});await renderEventComments(el,q,eventId);return}el.innerHTML=`<m3e-card variant="filled" class="assignmentInfoCard"><div class="assignmentInfoHeader"><h1>${esc(e.title||title)}</h1><div>${esc(e.start||e.start_time||e.date||'')}</div></div><div class="assignmentDescription">${e.description||e.body||'<span class="muted">No event description.</span>'}</div>${renderAttachments(e.attachments||e.attachment||{})}</m3e-card>`;el.querySelectorAll('a[href]').forEach(a=>a.onclick=async ev=>{ev.preventDefault();const href=a.href||a.getAttribute('href');if(await routeSchoologyLink(href))return;await A.prepareWebSession();showEmbeddedWeb(href,a.textContent?.trim()||'Link')});await hydrateMediaImages(el)}catch(e){el.innerHTML=`<div class="error apiError">${esc(e.message)}</div>`}};document.querySelectorAll('#eventTabs [data-event-tab]').forEach(b=>b.onclick=()=>load(b.dataset.eventTab));await load('info');
}
function groupResourceAttachment(item){
  return item?.attachment||item?.attachments||item?.template?.attachment||item?.template?.attachments||item?.template_fields?.attachment||item?.template_fields?.attachments||{};
}
function groupResourceFirst(item,key){
  const a=groupResourceAttachment(item);
  const candidates=[a?.[key]?.[key==='files'?'file':key==='links'?'link':key==='embeds'?'embed':'item'],a?.[key],a?.[key==='files'?'file':key==='links'?'link':key==='embeds'?'embed':'item']];
  for(const v of candidates){if(Array.isArray(v)&&v.length)return v[0];if(v&&typeof v==='object')return v;}
  return null;
}
function groupResourceDestination(item){
  const f=groupResourceFirst(item,'files'), l=groupResourceFirst(item,'links'), e=groupResourceFirst(item,'embeds');
  const converted=String(f?.converted_status||f?.convertedStatus||'').toLowerCase()==='success';
  const fileUrl=converted?(f?.file_converted_download_url||f?.fileConvertedDownloadURL||f?.converted_download_path||f?.convertedDownloadPath):(f?.file_download_url||f?.fileDownloadURL||f?.download_path||f?.downloadPath||f?.url||f?.download_url||f?.downloadUrl);
  const linkUrl=l?.url||l?.link_url||l?.linkURL||l?.linkUrl||l?.href;
  const embedUrl=e?.embed_url||e?.embedURL||e?.url;
  return fileUrl||linkUrl||embedUrl||item?.download_path||item?.downloadPath||item?.converted_download_path||item?.convertedDownloadPath||item?.file_url||item?.fileUrl||item?.download_url||item?.downloadUrl||item?.web_url||item?.webUrl||item?.url||item?.href||item?.location||item?.launch_url||item?.launchUrl||'';
}
async function openGroupResourceItem(d,b,gid){
  const t=String(d.template_type||d.templateType||d.type||'').toLowerCase(), dt=String(d.document_type||d.documentType||d.template?.template_document_type||d.template?.templateDocumentType||d.template_fields?.document_type||d.template_fields?.documentType||'').toLowerCase();
  if(t==='folder'){await showGroupResourceFolder(gid,d.id||d.folder_id||d.folderId,d.title||d.template_title||'Folder',d.collection_id||d.collectionID||d.collectionId);return;}
  if(t==='assignment'){const u=groupResourceDestination(d)||`https://app.schoology.com/assignment/${d.id}`;await A.prepareWebSession();showEmbeddedWeb(u,d.title||d.name||'Assignment');return;}
  if(['link','web_content','external_tool','embed','video'].includes(t)||['link','external_tool','embed','video'].includes(dt)){const u=groupResourceDestination(d);if(u){const error=await A.openExternal(u);if(error)throw new Error(error);return;}}
  const u=groupResourceDestination(d);if(!u)throw new Error('Schoology did not provide a resource URL.');
  const f=groupResourceFirst(d,'files');const filename=f?.filename||f?.fileName||d.filename||d.fileName||d.title||d.name||'Schoology file';const mime=f?.filemime||f?.fileMIME||f?.converted_filemime||f?.convertedFileMime||d.filemime||d.fileMIME||'application/octet-stream';
  if(dt==='link'||t==='link'){const error=await A.openExternal(u);if(error)throw new Error(error);return;}
  const r=await downloadWithFeedback(b,{url:u,filename,mime});const err=await A.openDownloadedFile({path:r.path});if(err)alert(err);
}
async function loadSchoolProfileUpcoming(){
 const id=Number(state.schoolProfile?.schoolId);if(!id)return [];
 const x=await A.api({path:`schools/${id}/events`,params:{start:formatApiDate(new Date()),limit:50}});
 const events=(x?.event||x?.events||[]).filter(e=>['assignment','assessment','assessment_v2','managed_assessment','discussion','external_tool','event'].includes(String(e.type||'').toLowerCase()));
 state.schoolProfile.events=events;
 const pane=document.getElementById('schoolProfileUpcomingContent');
 if(pane){pane.innerHTML=renderUpcoming(events);wireSchoolProfileUpcoming(pane,events,id)}
 return events;
}
function wireSchoolProfileUpcoming(root,events,schoolId){
 root.querySelectorAll('[data-course-upcoming-id]').forEach(button=>button.onclick=async()=>{
  const event=events.find(v=>String(v.id||'')===String(button.dataset.courseUpcomingId));if(!event)return;
  const type=String(event.type||'').toLowerCase(),assignmentId=event.assignment_id??event.assignmentId??event.assignment?.id,sectionId=event.section_id??event.sectionId;
  if(type==='assignment'&&assignmentId&&sectionId){showAssignment(sectionId,assignmentId);return}
  if(['assessment','assessment_v2','managed_assessment','quiz'].includes(type)){const id=assignmentId??event.id;if(id){await A.prepareWebSession();showEmbeddedWeb(`https://app.schoology.com/assignment/${id}`,event.title||'Quiz',{allowBrowser:false,quiz:true,assessment:true})}return}
  if(type==='event'&&event.id){showEventNative('schools',schoolId,event.id,event.title||'Event');return}
  const url=event.web_url||event.webUrl||event.url;
  if(url){if(await routeSchoologyLink(url))return;const error=await A.openExternal(url);if(error)throw new Error(error)}
 });
}
async function openSchoolProfile(schoolId,title='School'){
  const c=document.getElementById('content');if(!c)return;
  state.embeddedTitle=title;state.embeddedTheme='school-profile';state.embeddedCanOpenExternal=false;state.embeddedReturn={tab:state.tab,title:state.toolbarTitle,group:state.currentGroup,groupTab:state.groupTab,course:state.selectedCourse,courseTab:state.courseTab,courseView:state.courseView,homeTab:state.homeTab,homeUpcomingReturn:state.homeUpcomingReturn};state.toolbarTitle=title;state.schoolProfile={schoolId:Number(schoolId),tab:'updates',events:[]};syncToolbar();
  c.innerHTML='<section class="schoolProfileNativePage"><div class="loading"><m3e-circular-progress-indicator indeterminate class="m3eInlineProgress" aria-label="Loading"></m3e-circular-progress-indicator><span>Loading school…</span></div></section>';
  try{
   const x=await A.api({path:`schools/${schoolId}`,params:{}}),school=x?.school||x||{},schoolTitle=school.title||school.name||title;
   state.toolbarTitle=schoolTitle;syncToolbar();
   const image=normalizeImageUrl(school.picture_url||school.pictureUrl||school.picture||school.image||'');
   const schoolLandscape=window.matchMedia('(min-width: 801px) and (orientation: landscape)').matches;
   const schoolSidebar=`<aside slot="start" class="schoolProfileInfoSidePane"><div class="schoolProfileSidebarImage">${image?`<img data-media-image-url="${esc(image)}" alt="">`:`<span>${originalM3Icon('school')}</span>`}</div><m3e-action-list variant="segmented" class="upcomingSegmentedList schoolSidebarSegmentedList">${[['updates','Updates','campaign'],['info','Info','info'],['upcoming','Upcoming','event'],['resources','Resources','folder_open'],['discussions','Discussions','forum']].map(([id,label,icon])=>`<m3e-list-action class="schoolSidebarNavItem ${id==='updates'?'courseSidebarActive':''}" data-school-profile-tab="${id}" tabindex="0"><span slot="leading" class="m3eOriginalIcon">${schoologyNavIcon(id)}</span><span>${label}</span></m3e-list-action>`).join('')}</m3e-action-list></aside>`;
   const schoolMain=`<section slot="end" class="schoolProfileMainPane"><m3e-tabs variant="secondary" class="m3eSchoologyTabs schoolProfileTabs"><m3e-tab data-school-profile-tab="updates" selected>Updates</m3e-tab><m3e-tab data-school-profile-tab="info">Info</m3e-tab><m3e-tab data-school-profile-tab="upcoming">Upcoming</m3e-tab><m3e-tab data-school-profile-tab="resources">Resources</m3e-tab><m3e-tab data-school-profile-tab="discussions">Discussions</m3e-tab></m3e-tabs><div class="schoolProfileHeader"><div class="schoolProfileHeaderImage">${image?`<img data-media-image-url="${esc(image)}" alt="">`:`<span class="schoolProfileImageFallback">${originalM3Icon('school')}</span>`}</div><div class="schoolProfileHeaderText"><h1>${esc(schoolTitle)}</h1><p>${esc(school.description||school.location||'')}</p></div></div><div id="schoolProfileTabContent" class="schoolProfileTabContent"></div></section>`;
   const schoolUpcoming=`<aside slot="end" id="schoolProfileUpcomingPane" class="schoolProfileUpcomingPane"><div class="homePaneHeader">Upcoming</div><div id="schoolProfileUpcomingContent" class="schoolProfileUpcomingContent"><div class="loading"><m3e-circular-progress-indicator indeterminate class="m3eInlineProgress" aria-label="Loading"></m3e-circular-progress-indicator><span>Loading…</span></div></div></aside>`;
   c.innerHTML=`<section class="schoolProfileNativePage">${schoolLandscape?`<m3e-split-pane orientation="horizontal" class="schoolProfileOuterSplit" data-persist-key="school-profile" value="73" min="50" max="88" step="1" label="Resize school profile and upcoming"><m3e-split-pane slot="start" orientation="horizontal" class="schoolProfileInnerSplit" data-persist-key="school-profile-navigation" value="23" min="14" max="38" step="1" label="Resize school navigation and content">${schoolSidebar}${schoolMain}</m3e-split-pane>${schoolUpcoming}</m3e-split-pane>`:schoolMain}</section>`;
   await hydrateMediaImages(c);
   const content=document.getElementById('schoolProfileTabContent');
   const selectTab=async tab=>{
    state.schoolProfile.tab=tab;syncM3eTabSelection(c,'schoolProfileTab',tab);c.querySelectorAll('[data-school-profile-tab]').forEach(item=>{const selected=item.dataset.schoolProfileTab===tab;item.classList.toggle('courseSidebarActive',selected);if(selected)item.setAttribute('aria-current','page');else item.removeAttribute('aria-current')});
    content.innerHTML='<div class="loading"><m3e-circular-progress-indicator indeterminate class="m3eInlineProgress" aria-label="Loading"></m3e-circular-progress-indicator><span>Loading…</span></div>';
    try{
     if(tab==='info'){
      const address=[school.address1,school.address2,school.city,school.state,school.postal_code,school.country].filter(v=>v!=null&&String(v).trim()!=='').map(String).join(' ');
      const rows=[];if(address)rows.push(['Address',address]);if(school.phone)rows.push(['Phone',String(school.phone)]);
      content.innerHTML=rows.length?`<div class="schoolProfileInfoRows">${rows.map(([k,v])=>`<div class="schoolProfileInfoRow"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('')}</div>`:'<div class="empty">No information available.</div>';return;
     }
     if(tab==='updates'){
      const response=await A.api({path:'schools/'+schoolId+'/updates',params:{start:0,limit:50,with_attachments:'TRUE',richtext:1}});
      const items=response?.update||response?.updates||response?.update_list||[],users={};
      const ids=[...new Set(items.map(item=>item.user_id||item.uid||item.author_id||item.authorId).filter(Boolean).map(Number))];
      await Promise.all(ids.map(async id=>{try{const result=await A.api({path:'users/'+id,params:{}});users[id]=result?.user||result}catch{}}));
      content.innerHTML=items.length?'<div class="schoolProfileUpdates">'+items.map(item=>{const uid=item.user_id||item.uid||item.author_id||item.authorId||'',user=users[Number(uid)]||{},name=user.name_display||user.display_name||user.name||item.display_name||item.user_name||'Schoology',avatar=normalizeImageUrl(user.picture_url||user.pictureUrl||user.picture||item.picture_url||item.pictureUrl||'');return renderSharedPostCard({post:item,id:sharedPostId(item),realm:'schools',realmId:schoolId,author:name,avatar,authorId:user.id||uid,cardClass:'schoolProfileUpdate'})}).join('')+'</div>':'<div class="empty">No updates.</div>';
      await hydrateMediaImages(content);wireSharedPostList(content,'schools',schoolId,items,{authorUsers:users});return;
     }
     if(tab==='upcoming'){
      const events=state.schoolProfile.events.length?state.schoolProfile.events:await loadSchoolProfileUpcoming();
      content.innerHTML=events.length?renderUpcoming(events):'<div class="empty">No upcoming events.</div>';wireSchoolProfileUpcoming(content,events,Number(schoolId));return;
     }
     if(tab==='resources'){
      const response=await A.api({path:`schools/${schoolId}/resources`,params:{start:0,limit:200,with_attachments:'TRUE'}});
      const items=response?.resource||response?.resources||response?.resource_list||[];window.__schoolProfileResources=items;
      content.innerHTML=items.length?`<m3e-list variant="segmented" class="schoolProfileResourceRows">${items.map((item,i)=>`<m3e-list-action data-school-resource-index="${i}">${esc(resourceTitle(item))}<span class="m3eOriginalIcon" slot="trailing">${originalM3Icon("chevron_right")}</span></m3e-list-action>`).join('')}</m3e-list>`:'<div class="empty">No resources.</div>';
      content.querySelectorAll('[data-school-resource-index]').forEach(button=>button.onclick=async()=>{try{await openCollectionResource(window.__schoolProfileResources[Number(button.dataset.schoolResourceIndex)],button)}catch(error){showAppDialog('Unable to open resource',error.message||String(error))}});return;
     }
     if(tab==='discussions'){
      const response=await A.api({path:`schools/${schoolId}/discussions`,params:{start:0,limit:50,with_attachments:'TRUE',richtext:1}}).catch(()=>({}));
      const items=response?.discussion||response?.discussions||response?.discussion_list||[];
      content.innerHTML=items.length?`<m3e-list variant="segmented" class="schoolProfileDiscussionRows">${items.map(item=>`<m3e-list-action data-school-discussion-id="${esc(item.id||item.discussion_id||'')}" data-school-discussion-url="${esc(item.web_url||item.webUrl||'')}">${esc(item.title||item.name||'Discussion')}<span class="m3eOriginalIcon" slot="trailing">${originalM3Icon("chevron_right")}</span></m3e-list-action>`).join('')}</m3e-list>`:'<div class="empty">No discussions.</div>';
      content.querySelectorAll('[data-school-discussion-id]').forEach(button=>button.onclick=async()=>{const url=button.dataset.schoolDiscussionUrl||`https://app.schoology.com/school/${schoolId}/discussions/${button.dataset.schoolDiscussionId}`;await A.prepareWebSession();showEmbeddedWeb(url,button.textContent?.trim()||'Discussion',{allowBrowser:false})});return;
     }
    }catch(error){content.innerHTML=`<div class="error apiError">${esc(error.message||String(error))}</div>`}
   };
   c.querySelectorAll('[data-school-profile-tab]').forEach(button=>button.addEventListener('click',()=>selectTab(button.dataset.schoolProfileTab)));
   await Promise.all([selectTab('updates'),loadSchoolProfileUpcoming().catch(error=>{const pane=document.getElementById('schoolProfileUpcomingContent');if(pane)pane.innerHTML=`<div class="error apiError">${esc(error.message||String(error))}</div>`})]);
  }catch(error){c.innerHTML=`<div class="error apiError">${esc(error.message||String(error))}</div>`}
}

function isSchoologyAdminMember(person){
 const truthy=value=>value===true||value===1||value==='1'||String(value??'').toLowerCase()==='true';
 const flags=[person?.admin,person?.is_admin,person?.isAdmin,person?.group_admin,person?.groupAdmin,person?.is_group_admin,person?.isGroupAdmin,person?.owner,person?.is_owner,person?.isOwner];
 if(flags.some(truthy))return true;
 const roles=[person?.role,person?.role_name,person?.roleName,person?.role_title,person?.roleTitle,person?.position,person?.member_role,person?.memberRole];
 return roles.some(value=>{const text=typeof value==='object'?String(value?.name||value?.title||value?.label||value?.role||''):String(value??'');return /(^|[\s_-])(admin|administrator|owner|group admin|course admin)([\s_-]|$)/i.test(text)||/^(admin|administrator|owner)$/i.test(text.trim())});
}
function normalizeSchoologyList(value,keys=['items','data','list','results']){
 if(Array.isArray(value))return value;
 if(!value||typeof value!=='object')return [];
 for(const key of keys){if(value[key]!=null){const nested=value[key];if(Array.isArray(nested))return nested;if(nested&&typeof nested==='object'){const result=normalizeSchoologyList(nested,keys);if(result.length)return result}}}
 const objectValues=Object.values(value);if(objectValues.length&&objectValues.every(item=>item&&typeof item==='object'))return objectValues;
 return [];
}
function renderM3ePeopleDirectoryInto(container,people,{placeholder='Search people',onRefresh=null,onSelect=null,membersMode=false}={}){
 if(!container)return;
 const arr=(Array.isArray(people)?people:[]).slice(),lastName=p=>String(p.name_last||p.last_name||p.nameLast||''),firstName=p=>String(p.name_display_start||p.nameDisplayStart||p.name_first||p.first_name||p.name||p.name_display||p.display_name||'');
 arr.sort((a,b)=>(membersMode?(Number(isSchoologyAdminMember(b))-Number(isSchoologyAdminMember(a))):0)||lastName(a).localeCompare(lastName(b))||firstName(a).localeCompare(firstName(b)));
 window.__schoologyPeople=arr;
 const menuId='peopleMemberSortMenu-'+(container.id||'directory').replace(/[^a-z0-9_-]/gi,'-');
 const filters=membersMode?'<m3e-button-group variant="connected" class="peopleMemberFilterButtons" aria-label="Filter members"><m3e-button variant="tonal" toggle data-member-filter="all" selected>All</m3e-button><m3e-button variant="tonal" toggle data-member-filter="members">Members</m3e-button><m3e-button variant="tonal" toggle data-member-filter="admins">Admins</m3e-button></m3e-button-group><m3e-button class="peopleMemberSort" variant="tonal"><m3e-menu-trigger for="'+menuId+'">Sort</m3e-menu-trigger></m3e-button><m3e-menu id="'+menuId+'" class="peopleMemberSortMenu"><m3e-menu-item data-member-filter="all">All</m3e-menu-item><m3e-menu-item data-member-filter="members">Members</m3e-menu-item><m3e-menu-item data-member-filter="admins">Admins</m3e-menu-item></m3e-menu>':'<m3e-button class="peopleDirectoryRefresh" variant="text">Refresh</m3e-button>';
 container.innerHTML='<section class="peopleAndroidPage m3ePeopleDirectory"><div class="peopleDirectoryToolbar"><m3e-form-field variant="outlined" class="peopleDirectorySearchField"><label slot="label">Search</label><input class="peopleDirectorySearchInput" type="search" placeholder="'+esc(placeholder)+'" autocomplete="off"></m3e-form-field>'+filters+'</div><div class="peopleDirectorySections"></div></section>';
 const page=container.querySelector('.m3ePeopleDirectory'),sections=page?.querySelector('.peopleDirectorySections'),search=page?.querySelector('.peopleDirectorySearchInput');let filter='all';
 const makeRow=person=>{const admin=membersMode&&isSchoologyAdminMember(person),last=lastName(person),first=firstName(person),preferred=String(person.name_first_preferred||person.nameFirstPreferred||''),avatar=normalizeImageUrl(person.picture_url||person.pictureUrl||person.picture||person.photo_url||person.photoUrl||''),adminIcon=admin?'<span class="peopleMemberAdminIcon" aria-label="Administrator">'+groupAdminBadgeMarkup({...person,admin:true,is_admin:true})+'</span>':'';
 return '<m3e-list-action class="peopleListItem '+(admin?'peopleMemberAdmin':'')+'" data-person-index="'+arr.indexOf(person)+'"><span slot="leading" class="peopleAvatar">'+(avatar?'<img data-media-image-url="'+esc(avatar)+'" alt="" loading="lazy">':'<span>'+esc(String(first||'S').charAt(0))+'</span>')+'</span><span class="peopleMemberNameBlock"><b>'+esc((first+' '+last).trim()||'Schoology user')+'</b>'+(preferred?'<small>'+esc(preferred)+'</small>':'')+(admin?'<small class="peopleMemberRole">Admin</small>':'')+'</span>'+adminIcon+'<span slot="trailing" class="m3eOriginalIcon">'+originalM3Icon('chevron_right')+'</span></m3e-list-action>'};
 const render=async()=>{const query=String(search?.value||'').trim().toLocaleLowerCase(),visible=arr.filter(person=>{const admin=isSchoologyAdminMember(person);return (!membersMode||filter==='all'||(filter==='admins'?admin:!admin))&&(!query||[firstName(person),lastName(person),person.name_display,person.display_name,person.name_first_preferred].some(value=>String(value||'').toLocaleLowerCase().includes(query)))});
 const groups=[];if(membersMode&&filter!=='members'){const admins=visible.filter(isSchoologyAdminMember);if(admins.length)groups.push({label:'Admins',key:'admins',people:admins})}
 const members=visible.filter(person=>!membersMode||!isSchoologyAdminMember(person)),byLetter=new Map();for(const person of members){const letter=(lastName(person).charAt(0)||'#').toLocaleUpperCase();if(!byLetter.has(letter))byLetter.set(letter,[]);byLetter.get(letter).push(person)}
 for(const [letter,items] of [...byLetter.entries()].sort((a,b)=>a[0].localeCompare(b[0])))groups.push({label:letter,key:'letter-'+letter,people:items});
 if(sections)sections.innerHTML=groups.map(group=>'<section class="peopleDirectorySection" data-people-section="'+esc(group.key)+'"><div class="peopleSectionHeader">'+esc(group.label)+'</div><m3e-action-list variant="segmented" class="peopleDirectoryList">'+group.people.map(makeRow).join('')+'</m3e-action-list></section>').join('')||'<div class="empty">'+(membersMode&&filter==='admins'?'No admins found.':membersMode&&filter==='members'?'No members found.':'No people found.')+'</div>';
 sections?.querySelectorAll('[data-person-index]').forEach(button=>button.onclick=()=>{const person=arr[Number(button.dataset.personIndex)];if(person)onSelect?.(person)});await hydrateMediaImages(container)};
 search?.addEventListener('input',()=>void render());
 page?.querySelectorAll('[data-member-filter]').forEach(button=>button.addEventListener('click',()=>{filter=button.dataset.memberFilter||'all';page.querySelectorAll('[data-member-filter]').forEach(item=>item.toggleAttribute('selected',item.dataset.memberFilter===filter));void render()}));
 page?.querySelector('.peopleDirectoryRefresh')?.addEventListener('click',async event=>{const button=event.currentTarget;if(!onRefresh)return;button.disabled=true;try{await onRefresh()}finally{if(button.isConnected)button.disabled=false}});void render();
}
function openGroupUpdateComposer(groupId){
 if(!state.groupCanPostUpdates||!groupId)return;
 const targetGroup=state.currentGroup,old=document.getElementById('groupUpdateComposer');old?.remove();
 const wrap=document.createElement('div');wrap.id='groupUpdateComposer';wrap.className='courseUpdateComposer';
 wrap.innerHTML='<m3e-dialog open class="courseUpdateDialog" disable-close><span slot="header">Post Update</span><div class="courseUpdateComposerInner"><textarea id="groupUpdateBody" aria-label="Write an update" placeholder="Write an update…"></textarea></div><span slot="actions" end><m3e-button id="cancelGroupUpdate" variant="text">Cancel</m3e-button><m3e-button id="submitGroupUpdate" variant="filled">Post</m3e-button></span></m3e-dialog>';
 document.body.appendChild(wrap);wrap.querySelector('#cancelGroupUpdate')?.addEventListener('click',()=>wrap.remove());
 wrap.querySelector('#submitGroupUpdate')?.addEventListener('click',async()=>{const body=wrap.querySelector('#groupUpdateBody')?.value.trim(),button=wrap.querySelector('#submitGroupUpdate');if(!body)return;button.disabled=true;try{await A.api({path:'groups/'+groupId+'/updates',method:'POST',params:{body},signBody:true});wrap.remove();if(targetGroup&&state.currentGroup===targetGroup)await showGroup(targetGroup,'updates')}catch(error){button.disabled=false;showAppDialog('Unable to post update',error?.message||String(error))}});
 requestAnimationFrame(()=>wrap.querySelector('#groupUpdateBody')?.focus());
}
async function loadGroupCreationPermissions(groupId){
 state.groupCanPostUpdates=false;state.groupCanCreateDiscussion=false;
 if(!groupId)return;
 try{
  const paths=['updates','discussions'].map(kind=>'/v1/groups/'+groupId+'/'+kind);
  const response=await A.api({path:'multioptions',method:'POST',params:{request:paths}});
  const rows=Array.isArray(response?.response)?response.response:(Array.isArray(response?.responses)?response.responses:[]);
  const bodies={};for(const row of rows){if(!row?.location)continue;let body=row.body??row.data??'';try{if(typeof body==='string')body=JSON.parse(body)}catch{}bodies[String(row.location)]=body}
  const canPost=value=>{if(value==null)return false;if(typeof value==='boolean')return value;if(typeof value==='number')return value===1;if(typeof value==='string'){const text=value.trim().toLowerCase();if(text==='true'||text==='1'||text==='post')return true;try{return canPost(JSON.parse(value))}catch{return /\bpost\b/i.test(value)}}if(Array.isArray(value))return value.some(canPost);if(typeof value==='object'){for(const [key,val] of Object.entries(value)){if(String(key).toLowerCase()==='post'&&canPost(val))return true}return canPost(value.permissions??value.permission_map??value.permissionMap??value.data)}return false};
  state.groupCanPostUpdates=canPost(bodies[paths[0]]);state.groupCanCreateDiscussion=canPost(bodies[paths[1]]);
 }catch{state.groupCanPostUpdates=false;state.groupCanCreateDiscussion=false}
}
async function showGroup(group,activeTab='updates'){
  if(!group)return;
  state.currentGroup=group;state.groupTab=activeTab;state.courseView=null;state.selectedCourse=null;state.assignmentView=null;state.embeddedTitle=null;state.profileUser=null;state.message=null;state.composeMessage=false;state.toolbarTitle=group.name||group.title||'Group';syncToolbar();
  const c=document.getElementById('content');if(!c)return;
  const gid=group.id||group.group_id;
  let groupDetail=group;try{const gx=await A.api({path:`groups/${gid}`,params:{}});groupDetail=gx?.group||gx||group}catch{}
  await loadGroupCreationPermissions(gid);if(state.currentGroup===group)syncToolbar();
  let groupSchoolId=groupDetail?.school_id??groupDetail?.schoolId;
  let groupSchool='';
  if(groupSchoolId){try{const sx=await A.api({path:`schools/${groupSchoolId}`,params:{}});const sch=sx?.school||sx;groupSchool=String(sch?.title||sch?.name||'')}catch{}}
  const groupLandscape=window.matchMedia('(min-width: 801px) and (orientation: landscape)').matches;
  const groupTabsMarkup=`<div class="groupTabs"><m3e-tabs variant="secondary" class="m3eSchoologyTabs groupTabsM3e">${['updates','members','upcoming','discussions','albums','resources'].map((id)=>`<m3e-tab class="groupTab ${id==='upcoming'?'groupUpcomingTab':''}" data-group-tab="${id}" ${activeTab===id?'selected':''}>${({updates:'Updates',members:'Members',upcoming:'Upcoming',discussions:'Discussions',albums:'Albums',resources:'Resources'})[id]}</m3e-tab>`).join('')}</m3e-tabs></div>`;
  const groupSidebar=`<aside slot="start" class="groupInfoSidePane"><div class="groupSidebarImage">${group.picture_url||group.pictureUrl?`<img data-media-image-url="${esc(normalizeImageUrl(group.picture_url||group.pictureUrl))}" alt="">`:`<span>${esc(String(group.name||group.title||'G').charAt(0))}</span>`}</div><m3e-action-list variant="segmented" class="upcomingSegmentedList groupSidebarSegmentedList">${[['updates','Updates','campaign'],['members','Members','groups'],['upcoming','Upcoming','event'],['discussions','Discussions','forum'],['albums','Albums','photo_library'],['resources','Resources','folder_open']].map(([id,label,icon])=>`<m3e-list-action class="groupSidebarNavItem ${activeTab===id?'courseSidebarActive':''}" data-group-tab="${id}" tabindex="0"><span slot="leading" class="m3eOriginalIcon">${schoologyNavIcon(id)}</span><span>${label}</span></m3e-list-action>`).join('')}</m3e-action-list></aside>`;
  const groupMain=`<section slot="end" class="groupMainPane">${groupTabsMarkup}<div class="groupHeader"><div class="groupHero">${group.picture_url||group.pictureUrl?`<img data-media-image-url="${esc(normalizeImageUrl(group.picture_url||group.pictureUrl))}" alt="">`:`<span>${esc(String(group.name||group.title||'G').charAt(0))}</span>`}</div><div><h1>${esc(group.name||group.title||'Group')}</h1><button class="groupSchoolLink" data-group-school-id="${esc(groupSchoolId||'')}" type="button">${esc(groupSchool)}</button></div></div><div id="groupTabContent"></div></section>`;
  const groupUpcoming=`<aside slot="end" id="groupUpcomingPane" class="groupUpcomingPane"><div class="homePaneHeader">Upcoming</div><div id="groupUpcomingContent"></div></aside>`;
  c.innerHTML=`<section class="groupProfilePage">${groupLandscape?`<m3e-split-pane orientation="horizontal" class="groupOuterSplit" data-persist-key="group-${esc(gid)}" value="73" min="50" max="88" step="1" label="Resize group content and upcoming"><m3e-split-pane slot="start" orientation="horizontal" class="groupInnerSplit" data-persist-key="group-navigation-${esc(gid)}" value="23" min="14" max="38" step="1" label="Resize group navigation and content">${groupSidebar}${groupMain}</m3e-split-pane>${groupUpcoming}</m3e-split-pane>`:groupMain}</section>`;
  const gc=document.getElementById('groupTabContent');
  const groupSchoolButton=document.querySelector('[data-group-school-id]');if(groupSchoolButton)groupSchoolButton.onclick=()=>{const id=Number(groupSchoolButton.getAttribute('data-group-school-id')||0);if(id)openSchoolProfile(id,groupSchoolButton.textContent||'School')};
  const loadGroupUpcoming=async()=>{const up=document.getElementById('groupUpcomingContent');if(!up)return;try{const x=await A.api({path:`groups/${gid}/events`,params:{start:formatApiDate(new Date()),limit:20}});const a=(x.event||x.events||[]).filter(e=>['assignment','assessment','assessment_v2','managed_assessment','discussion','external_tool','event'].includes(String(e.type||'')));up.innerHTML=a.length?renderUpcoming(a):'<div class="empty upcomingEmpty"><h2>No upcoming events</h2></div>';up.querySelectorAll('[data-course-upcoming-id]').forEach(b=>b.onclick=()=>{const e=a.find(v=>String(v.id||'')===String(b.dataset.courseUpcomingId));if(!e)return;const aid=e.assignment_id??e.assignmentId??e.assignment?.id;if(String(e.type||'').toLowerCase()==='assignment'&&aid){showAssignment(gid,aid);}else if(['assessment','assessment_v2','managed_assessment','quiz'].includes(String(e.type||'').toLowerCase())){const id=aid??e.id;(async()=>{await A.prepareWebSession();showEmbeddedWeb(`https://app.schoology.com/assignment/${id}`,e.title||'Quiz',{allowBrowser:false,quiz:true,assessment:true})})()}else if(String(e.type||'').toLowerCase()==='event'&&e.id){openWithPressTransition(b,()=>showEventNative('groups',gid,e.id,e.title||'Event'));}})}catch(e){up.innerHTML=`<div class="error apiError">${esc(e.message)}</div>`}};
  const load=async(tab)=>{
    state.groupTab=tab;syncM3eTabSelection(document.getElementById('content'),'groupTab',tab);document.querySelectorAll('[data-group-tab]').forEach(item=>{const selected=item.dataset.groupTab===tab;item.classList.toggle('courseSidebarActive',selected);if(selected)item.setAttribute('aria-current','page');else item.removeAttribute('aria-current')});syncToolbar();
    gc.innerHTML='<div class="loading groupTabLoading"><m3e-circular-progress-indicator indeterminate class="m3eInlineProgress" aria-label="Loading"></m3e-circular-progress-indicator><span>Loading…</span></div>';
    try{
      if(tab==='updates'){
        const x=await A.api({path:'groups/'+gid+'/updates',params:{start:0,limit:20,with_attachments:'TRUE',richtext:1}});
        const items=x.update||x.updates||x.update_list||[],users={};
        const ids=[...new Set(items.map(post=>post.user_id||post.uid||post.author_id||post.authorId).filter(Boolean).map(Number))];
        await Promise.all(ids.map(async id=>{try{const q=await A.api({path:'users/'+id,params:{}});users[id]=q?.user||q}catch{}}));
        gc.innerHTML=items.length?items.map(post=>{const uid=post.user_id||post.uid||post.author_id||post.authorId||post.creator_id||post.creatorId||'',user=users[Number(uid)]||{},name=post.display_name||post.author_name||user.name_display||user.display_name||user.name||'Schoology',avatar=normalizeImageUrl(user.picture_url||user.pictureUrl||user.picture||user.photo_url||'');return renderSharedPostCard({post,id:sharedPostId(post),realm:'groups',realmId:gid,author:name,avatar,authorId:user.id||uid,cardClass:'groupFullUpdate'})}).join(''):'<div class="empty">No updates.</div>';
        await hydrateMediaImages(gc);wireSharedPostList(gc,'groups',gid,items,{authorUsers:users});
      }
      else if(tab==='members'){
        const response=await A.api({path:'groups/'+gid+'/enrollments',params:{start:0,limit:200,enrollment_status:1}});
        const raw=response?.enrollment||response?.enrollments||response?.data?.enrollment||response?.data?.enrollments||response?.member||response?.members||response?.user||response?.users||response?.data?.member||response?.data?.members||response?.data?.users||response?.data?.items||[];
        const entries=normalizeSchoologyList(raw,['enrollment','enrollments','member','members','user','users','items','data']);
        const people=entries.map(entry=>{const nested=entry?.user||entry?.member||entry?.profile,person=nested||entry,id=nested?(person.id??person.uid??person.user_id??person.userId??entry?.user_id??entry?.userId??entry?.uid??''):(entry?.user_id??entry?.userId??entry?.uid??entry?.id??'');return {...entry,...person,id,uid:id,name_first:person.name_first||person.first_name||person.nameFirst||'',name_last:person.name_last||person.last_name||person.nameLast||'',name_display_start:person.name_display_start||person.nameDisplayStart||person.name_first||person.first_name||person.name_display||person.display_name||person.name||'',name_display:person.name_display||person.display_name||person.name||'',name_first_preferred:person.name_first_preferred||person.nameFirstPreferred||'',picture_url:person.picture_url||person.pictureUrl||person.picture||person.photo_url||'',admin:entry?.admin??entry?.is_admin??entry?.isAdmin??person.admin??person.is_admin??person.isAdmin,role:entry?.role??entry?.role_name??entry?.roleName??person.role}}).filter(person=>person.id);
        if(!Array.isArray(raw)&&!entries.length)throw new Error('The group-members response did not contain a member list.');
        renderM3ePeopleDirectoryInto(gc,people,{placeholder:'Search group members',membersMode:true,onSelect:person=>openProfileById(person.id,person.name_display||[person.name_first,person.name_last].filter(Boolean).join(' ')||'Profile')});
      }
      else if(tab==='upcoming'){const x=await A.api({path:`groups/${gid}/events`,params:{start:formatApiDate(new Date()),limit:20}});const a=(x.event||x.events||[]).filter(e=>['assignment','assessment','assessment_v2','managed_assessment','discussion','external_tool','event'].includes(String(e.type||'')));gc.innerHTML=a.length?renderUpcoming(a):'<div class="empty upcomingEmpty"><h2>No upcoming events</h2></div>';}
      else if(tab==='discussions'){const x=await A.api({path:`groups/${gid}/discussions`,params:{limit:50}});const a=x.discussion||x.discussions||[];gc.innerHTML=a.length?`<m3e-action-list variant="segmented" class="groupSegmentedList">${a.map(d=>{const creator=d.creater_id??d.creator_id??d.created_by??d.user_id??d.uid??d.author_id??'';return `<m3e-list-action tabindex="0" data-group-discussion-id="${esc(d.id||d.discussion_id||'')}"><span slot="leading" class="m3eOriginalIcon">${officialOrAssetIcon('ic_discussion.png','')}</span><span>${esc(d.title||'Discussion')}</span><span slot="supporting-text">Created by ${esc(creator)}</span></m3e-list-action>`}).join('')}</m3e-action-list>`:'<div class="empty">No discussions.</div>';gc.querySelectorAll('[data-group-discussion-id]').forEach(b=>b.onclick=async()=>{const d=a.find(v=>String(v.id||v.discussion_id||'')===String(b.dataset.groupDiscussionId));if(!d)return;try{await showDiscussionNative('groups',gid,d.id||d.discussion_id,d.title||'Discussion')}catch(e){alert('Unable to open discussion: '+e.message)}});}
      else if(tab==='albums'){const x=await A.api({path:`groups/${gid}/albums`,params:{limit:50}});const a=x.album||x.albums||[];gc.innerHTML=a.length?`<m3e-action-list variant="segmented" class="groupSegmentedList">${a.map((d,i)=>`<m3e-list-action tabindex="0" data-group-album-index="${i}"><span slot="leading" class="m3eOriginalIcon">${officialOrAssetIcon('ic_albums.png','')}</span><span>${esc(d.title||d.name||'Album')}</span><span slot="supporting-text">${esc([d.photo_count||d.photoCount,d.audio_count||d.audioCount,d.video_count||d.videoCount].filter(Boolean).join(', '))}</span></m3e-list-action>`).join('')}</m3e-action-list>`:'<div class="empty">No albums.</div>';window.__groupAlbums=a;gc.querySelectorAll('[data-group-album-index]').forEach(b=>b.onclick=()=>{const d=window.__groupAlbums[+b.dataset.groupAlbumIndex];showGroupAlbumNative(gid,d.id||d.album_id,d.title||d.name||'Album')});}
      else {const x=await A.api({path:`groups/${gid}/resources`,params:{limit:50,with_attachments:'TRUE'}});const a=x.resource||x.resources||x.collection||x.items||[];gc.innerHTML=a.length?`<m3e-action-list variant="segmented" class="groupSegmentedList">${a.map((d,i)=>`<m3e-list-action tabindex="0" data-group-resource-index="${i}"><span slot="leading" class="m3eOriginalIcon">${officialOrAssetIcon(materialIconForType(d),'')}</span><span>${esc(d.title||d.template_title||d.name||'Resource')}</span></m3e-list-action>`).join('')}</m3e-action-list>`:'<div class="empty">No resources.</div>';window.__groupResources=a;gc.querySelectorAll('[data-group-resource-index]').forEach(b=>b.onclick=async()=>{const d=window.__groupResources[+b.dataset.groupResourceIndex];try{await openGroupResourceItem(d,b,gid)}catch(e){alert('Unable to open resource: '+e.message)}}); }
    }catch(e){gc.innerHTML=`<div class="error apiError"><b>Schoology could not load this page.</b><br>${esc(e.message)}</div>`}
  };
  document.querySelectorAll('[data-group-tab]').forEach(b=>b.onclick=()=>load(b.dataset.groupTab));
  await load(activeTab);
  await hydrateMediaImages(c);
  if(groupLandscape)await loadGroupUpcoming();
}
async function showGroupResourceFolder(gid,folderId,title,collectionId){
  const gc=document.getElementById('groupTabContent');if(!gc)return;
  gc.innerHTML='<div class="loading"><m3e-circular-progress-indicator indeterminate class="m3eInlineProgress" aria-label="Loading"></m3e-circular-progress-indicator><span>Loading…</span></div>';
  try{
    const cid=Number(collectionId||state.resourceCollection?.collection_id||state.resourceCollection?.id||0);const x=cid?await A.api({path:`collections/${cid}/resources`,params:{f:folderId,limit:50,with_attachments:'TRUE'}}):await A.api({path:`groups/${gid}/resources`,params:{f:folderId,limit:50,with_attachments:'TRUE'}});const a=x.resource||x.resources||x.collection||x.items||[];
    gc.innerHTML=`<m3e-button id="groupFolderBack" variant="text">‹&nbsp; ${esc(title||'Back')}</m3e-button>`+(a.length?`<m3e-action-list variant="segmented" class="groupSegmentedList">${a.map((d,i)=>`<m3e-list-action data-group-folder-resource="${i}"><span slot="leading" class="m3eOriginalIcon">${officialOrAssetIcon(materialIconForType(d),'')}</span><span>${esc(d.title||d.template_title||d.name||'Resource')}</span></m3e-list-action>`).join('')}</m3e-action-list>`:'<div class="empty">No resources.</div>');
    document.getElementById('groupFolderBack')?.addEventListener('click',()=>showGroup(state.currentGroup,'resources'));
    window.__groupFolderResources=a;
    gc.querySelectorAll('[data-group-folder-resource]').forEach(b=>b.onclick=async()=>{const d=window.__groupFolderResources[+b.dataset.groupFolderResource];try{await openGroupResourceItem(d,b,gid)}catch(e){alert('Unable to open resource: '+e.message)}});
  }catch(e){gc.innerHTML=`<div class="error apiError">${esc(e.message)}</div>`}
}

async function loadMessageThread(m){
  try{
    const id=m?.id||m?.message_id||m?.messageId; if(!id)throw new Error('Message ID is missing.');
    const folder=state.messageFolder||'inbox'; const x=await A.api({path:`messages/${state.messageFolder||'inbox'}/${id}`,params:{with_attachments:'TRUE',keep_unread:'TRUE'}});
    const payload=x?.data||x; const raw=payload?.message||payload?.messages||[]; const msgs=Array.isArray(raw)?raw:(raw?.message||raw?.messages||[]); const users={};
    const userList=payload?.user||payload?.users||payload?.data?.user||payload?.data?.users||[];
    for(const u of (Array.isArray(userList)?userList:[userList])){const id=Number(u?.id||u?.user_id||u?.uid||0);if(id)users[id]=u?.user||u}
    const ids=[...new Set(msgs.flatMap(v=>[v.author_id,v.authorId,v.author?.id,v.author?.user_id,v.user_id,v.uid,v.sender_id,v.senderId,v.sender?.id,v.sender?.user_id].map(Number).filter(Boolean)))];
    await Promise.all(ids.filter(id=>!users[id]).map(async uid=>{try{const u=await A.api({path:`users/${uid}`,params:{}});users[uid]=u?.user||u}catch{}}));
    state.messageThread={messages:msgs,users}; render(); await hydrateMediaImages(document.querySelector('.messageDetail')); document.getElementById('messageRefresh')?.addEventListener('click',async()=>{const b=document.getElementById('messageRefresh');b?.classList.add('spinning');await loadMessageThread(m);b?.classList.remove('spinning')}); document.getElementById('messageReply')?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();showComposeMessage(m,true)});
    if(folder==='inbox')try{await A.api({path:`messages/inbox/${id}`,method:'PUT',params:{message_status:'read'}})}catch{}
  }catch(e){state.messageThread={messages:[],users:{},error:e.message};render();const el=document.querySelector('.messageDetail');if(el)el.innerHTML=`<div class="error apiError">Unable to load this message.<br>${esc(e.message)}</div>`}
}

function showComposeMessage(replyMessage=null,isReply=false){
  state.composeMessage=true;
  document.getElementById('composeMessageDialog')?.remove();
  const wrap=document.createElement('div');wrap.id='composeMessageDialog';wrap.className='assignmentCommentDialogOverlay';wrap.innerHTML=`<m3e-dialog open class="composeMessageDialog" disable-close><span slot="header">${isReply?'Reply':'New Message'}</span><div class="composeMessagePage">${isReply?'':`<div class="composeField recipientField"><label>To</label><input id="composeToSearch" autocomplete="off" placeholder="Search for a recipient"><div id="recipientSuggestions" class="recipientSuggestions"></div><div id="recipientChips" class="recipientChips"></div><input id="composeTo" type="hidden"></div><div class="composeField"><label>Subject</label><input id="composeSubject" placeholder="Subject"></div>`}<div class="composeField composeBody"><label>Message</label><textarea id="composeBody" placeholder="Write a message…"></textarea></div><div class="messageAttachmentChoices"><button id="messageAttachFile" type="button"><img src="../assets/icons/ic_attach_file_black_24dp.svg" alt="">File</button><button id="messageAttachResource" type="button"><img src="../assets/icons/ic_attach_resourcesv3.png" alt="">Resource</button></div><div id="messageAttachmentList"></div><div id="composeStatus"></div></div><span slot="actions" end class="composeDialogActions"><m3e-icon-button id="composeMessageCancel" aria-label="Cancel"><span class="m3eOriginalIcon">${officialIcon('ic_action_discard_icon.png','Cancel')}</span></m3e-icon-button><m3e-button id="sendMessage" variant="filled" size="medium"><span slot="icon" class="m3eOriginalIcon">${officialIcon('ic_action_send_icon.png','Send')}</span>Send</m3e-button></span></m3e-dialog>`
  document.body.appendChild(wrap);
  wrap.style.zIndex='2147483647';
  const closeCompose=()=>{state.composeMessage=false;wrap.remove();syncToolbar()};
  wrap.querySelector('#composeMessageCancel')?.addEventListener('click',closeCompose);
  wrap.addEventListener('click',e=>{if(e.target===wrap)closeCompose()});
  const selected=[]; const attachments={files:[],resources:[]}; if(isReply&&replyMessage){const replySource=replyMessage||state.messageThread?.messages?.[state.messageThread.messages.length-1]||{};const authorId=replySource.author_id||replySource.authorId||replySource.author?.id||replySource.author?.user_id||replySource.sender_id||replySource.senderId||replySource.sender?.id||replySource.sender?.user_id||replySource.user_id||replySource.uid; if(authorId)selected.push({id:Number(authorId),name:replySource.author?.name_display||replySource.author?.display_name||replySource.author?.name||replySource.sender?.name_display||replySource.sender?.display_name||replySource.sender?.name||'Reply recipient'});}
  const search=document.getElementById('composeToSearch'), suggestions=document.getElementById('recipientSuggestions'), chips=document.getElementById('recipientChips');
  const renderRecipients=()=>{chips.innerHTML=selected.map((u,i)=>`<span class="recipientChip">${esc(u.name)} <button type="button" data-remove-recipient="${i}">×</button></span>`).join('');document.getElementById('composeTo').value=selected.map(u=>u.id).join(',');chips.querySelectorAll('[data-remove-recipient]').forEach(b=>b.onclick=()=>{selected.splice(+b.dataset.removeRecipient,1);renderRecipients()})};
  if(isReply){document.querySelector('.recipientField')?.remove();document.querySelector('#composeSubject')?.closest('.composeField')?.remove();}
  document.getElementById('messageAttachFile')?.addEventListener('click',async()=>{try{const p=await A.pickFile();if(!p)return;const fp=typeof p==='string'?p:p.path;const fid=await A.uploadSchoologyFile({filePath:fp,mime:typeof p==='object'?p.mime:''});attachments.files.push(String(fid));document.getElementById('messageAttachmentList').innerHTML+=`<div class="messageAttachedItem">${esc(typeof p==='object'&&p.name?p.name:fp.split(/[\\/]/).pop())}</div>`}catch(e){showAppDialog('Unable to attach file',e.message||String(e))}});
  document.getElementById('messageAttachResource')?.addEventListener('click',()=>chooseSchoologyResource(r=>{const id=r.template_id??r.templateID??r.resource_id??r.resourceId??r.template?.id??r.id;if(id!=null){attachments.resources.push(String(id));document.getElementById('messageAttachmentList').innerHTML+=`<div class="messageAttachedItem">${esc(r.template_title||r.title||r.name||'Resource')}</div>`}},'Attach Resource'));
  let searchTimer=null; search?.addEventListener('input',()=>{clearTimeout(searchTimer);const q=search.value.trim();if(q.length<2){suggestions.innerHTML='';return}searchTimer=setTimeout(async()=>{try{const x=await A.api({path:'messages/recipients',params:{name:q,limit:10}});const arr=x.user||x.users||x.recipient||x.recipients||[];suggestions.innerHTML=arr.map(u=>`<button type="button" class="recipientSuggestion" data-recipient-id="${esc(u.id)}" data-recipient-name="${esc(u.name_display||u.nameDisplay||u.display_name||u.name||'User')}">${esc(u.name_display||u.nameDisplay||u.display_name||u.name||'User')}</button>`).join('')||'<div class="recipientNone">No recipients found.</div>';suggestions.querySelectorAll('[data-recipient-id]').forEach(b=>b.onclick=()=>{const id=Number(b.dataset.recipientId),name=b.dataset.recipientName;if(id&&!selected.some(u=>u.id===id)){selected.push({id,name});renderRecipients()}search.value='';suggestions.innerHTML=''})}catch(e){suggestions.innerHTML=`<div class="recipientNone">${esc(e.message)}</div>`}},250)});
  document.getElementById('sendMessage')?.addEventListener('click',async()=>{
    const to=document.getElementById('composeTo')?.value.trim(),subject=document.getElementById('composeSubject')?.value.trim(),message=document.getElementById('composeBody')?.value.trim();
    const st=document.getElementById('composeStatus'); if((!isReply&&!to)||!message){if(st)st.textContent=isReply?'Enter a message.':'Enter a recipient and message.';return}
    const ids=selected.map(u=>u.id).join(',');
    try{if(st)st.textContent='Sending…';const params=isReply?{message}:{recipient_ids:ids,subject:subject||'',message};if(attachments.files.length)params['file-attachment']={id:attachments.files};if(attachments.resources.length)params.attachments=attachments.resources.map(resource=>({resource:Number(resource)}));const endpoint=isReply?`messages/${replyMessage?.id||replyMessage?.message_id||replyMessage?.messageId}`:'messages';await A.api({path:endpoint,method:'POST',params,signBody:true});if(st)st.textContent='Message sent.';setTimeout(()=>{state.composeMessage=false;state.toolbarTitle='Messages';state.messageTab='sent';wrap.remove();render();loadTab()},350)}catch(e){if(st)st.textContent='Unable to send message: '+e.message}
  });
}

function resourceIconForType(type,title,item={}){
 const t=String(type||'').toLowerCase();
 const dt=String(item.document_type||item.documentType||item.template?.template_document_type||item.template?.templateDocumentType||item.template_fields?.document_type||item.template_fields?.documentType||'').toLowerCase();
 if(t==='assessment')return 'ic_test_quiz.png';
 if(t==='assessment_v2'||t==='managed_assessment'||t==='quiz')return 'ic_assessment_48dp.png';
 if(t==='assignment')return 'ic_assignment.png';
 if(t==='discussion')return 'ic_discussion.png';
 if(t==='page')return 'ic_pages.png';
 if(t==='album')return 'ic_albums.png';
 if(t==='scorm')return 'ic_scorm.png';
 if(t==='web_package'||t==='web_content')return 'ic_web_content.png';
 if(t==='folder')return item.color&&String(item.color).toLowerCase()!=='black'?`ic_folder_${String(item.color).toLowerCase()}.png`:'ic_folder_black.png';
 if(t==='document'){
   if(dt==='link')return 'ic_files_links.png';
   if(dt==='embed')return 'attachment_link_icon.png';
   if(dt==='external_tool')return 'ic_web_content.png';
   if(dt==='file'){
     const n=String(title||'').replaceAll('#','').toLowerCase();
     const mt=String(item?.filemime||item?.fileMIME||item?.converted_filemime||item?.convertedFileMime||item?.mime||'').toLowerCase().split(';')[0].trim();
     const guess=mt||({pdf:'application/pdf',ppt:'application/vnd.ms-powerpoint',pptx:'application/vnd.openxmlformats-officedocument.presentationml.presentation',xls:'application/vnd.ms-excel',xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',doc:'application/msword',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',txt:'text/plain',csv:'text/csv',zip:'application/zip',mp3:'audio/mpeg',wav:'audio/wav',m4a:'audio/mp4',aac:'audio/aac',ogg:'audio/ogg',mp4:'video/mp4',mov:'video/quicktime',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',gif:'image/gif',webp:'image/webp'}[n.split('.').pop()]||'');
     if(guess.startsWith('video')||guess.startsWith('audio'))return 'ic_attach_audio.png';
     if(guess.startsWith('text'))return 'ic_attach_text.png';
     if(guess.startsWith('image'))return 'ic_attach_image.png';
     if(guess.startsWith('application')){
       if(guess.includes('pdf'))return 'ic_attach_app_pdf.png';
       if(guess.includes('presentation')||guess.includes('powerpoint'))return 'ic_attach_app_ppt.png';
       if(guess.includes('sheet')||guess.includes('excel'))return 'ic_attach_app_excel.png';
       if(guess.includes('document')||guess.includes('text')||guess.includes('msword'))return 'ic_attach_app_word.png';
       if(guess.includes('zip'))return 'ic_attach_app_zip.png';
     }
     return 'attachment_document_icon.png';
   }
 }
 if(t==='link')return 'ic_files_links.png';
 return 'attachment_document_icon.png';
}
function collectionIcon(type){return type==='shared'?'ic_collection.png':type==='groups'?'home_dash_groups.png':type==='apps'?'ic_resourceapps.png':'ic_eportfolio.png'}
function resourceAttachment(item){let a=item?.attachments??item?.attachment??item?.template?.attachments??item?.template?.attachment??item?.template_fields?.attachments??item?.template_fields?.attachment??{};if(Array.isArray(a))a=a[0]||{};if(a?.attachments&&!a.links&&!a.files&&!a.embeds)a=a.attachments;return a||{};}
function firstAttachment(item,key){const a=resourceAttachment(item);const x=a?.[key]?.[key==='files'?'file':key==='links'?'link':key==='embeds'?'embed':'item']||a?.[key]||a?.[key==='files'?'file':key==='links'?'link':key==='embeds'?'embed':'item'];return Array.isArray(x)?x[0]:x;}
function resourceDocumentType(item){return String(item?.document_type||item?.documentType||item?.template?.template_document_type||item?.template?.templateDocumentType||item?.template_fields?.document_type||item?.template_fields?.documentType||'').toLowerCase();}
function resourceTitle(item){return item?.template_title||item?.templateTitle||item?.title||item?.name||item?.filename||'Resource';}
function resourceType(item){return String(item?.template_type||item?.templateType||item?.type||'').toLowerCase();}
async function openCollectionResource(item,button){
 const t=resourceType(item),dt=resourceDocumentType(item),title=resourceTitle(item);
 if(t==='folder'){await openResourceCollection({...item,collection_id:item.collection_id||item.collectionID||state.resourceCollection?.collection_id||state.resourceCollection?.id,folder_id:item.id||item.template_id||item.templateID},button);return}
 if(['assignment','assessment','assessment_v2','managed_assessment','discussion','page','album','scorm','web_package','web_content'].includes(t)){
   const id=item.id||item.template_id||item.templateID||item.collection_id;
   if(id){await A.prepareWebSession();showEmbeddedWeb(`https://app.schoology.com/${t==='assignment'?'assignment':t==='assessment'?'assignment':t}/${id}`,title);return}
 }
 if(t==='document'){
   if(dt==='link'){
     const link=firstAttachment(item,'links');let u=link?.link_url||link?.linkURL||link?.url||link?.href||item.url||item.web_url||item.webUrl;
     if(u){u=normalizeSchoologyWebUrl(u);await A.prepareWebSession();showEmbeddedWeb(u,title);return}
   }
   if(dt==='embed'){
     const embed=firstAttachment(item,'embeds');const code=embed?.embed_code||embed?.embedCode;
     if(code){showEmbeddedWeb('data:text/html;charset=utf-8,'+encodeURIComponent(code),title,{allowBrowser:false});return}
   }
   if(dt==='external_tool'){
     const u=item.launch_url||item.launchUrl||item.web_url||item.webUrl||item.url||item.href;
     if(u){await A.prepareWebSession();showEmbeddedWeb(u,title);return}
   }
   if(dt==='file'){
     const f=firstAttachment(item,'files');const u=f?.resolveDownloadUrl||f?.file_download_url||f?.fileDownloadURL||f?.download_path||f?.downloadPath||f?.converted_download_path||f?.convertedDownloadPath;
     if(u){const filename=f?.filename||f?.fileName||title;const mime=f?.filemime||f?.fileMIME||f?.converted_filemime||f?.convertedFileMime||'application/octet-stream';const viewUrl=f?.file_converted_download_url||f?.fileConvertedDownloadURL||f?.converted_download_path||f?.convertedDownloadPath||f?.converted_url||f?.convertedUrl||'';const info={url:u,viewUrl,filename,mime,displayFilename:filename};const download=async()=>{const r=await downloadWithFeedback(button,{url:u,filename,mime});const err=await A.openDownloadedFile({path:r.path});if(err)throw new Error(err)};if(isPdfAttachment(info)||isImageAttachment(info)||isOfficeAttachment(info)){showPdfAttachmentOptions(info,download);return}await download();return}
   }
 }
 const u=item.web_url||item.webUrl||item.url||item.href||item.location||item.download_path||item.downloadPath||item.file_url||item.fileUrl;
 if(u){await A.prepareWebSession();showEmbeddedWeb(u,title);return}
 throw new Error('Schoology did not provide a destination for this resource.');
}
function setResourceLoading(button,text='Loading…'){
 const c=document.getElementById('content');if(!c)return()=>{};
 const old=c.querySelector('.resourceActionLoading');if(old)old.remove();
 const overlay=document.createElement('div');overlay.className='resourceActionLoading';overlay.innerHTML=`<m3e-circular-progress-indicator indeterminate class="m3eInlineProgress" aria-label="Loading"></m3e-circular-progress-indicator><span>${esc(text)}</span>`;c.appendChild(overlay);
 if(button){button.disabled=true;button.classList.add('resourceBusy')}
 return()=>{overlay.remove();if(button){button.disabled=false;button.classList.remove('resourceBusy')}};
}
async function loadResourcesHome(c){
 c.innerHTML='<section class="resourcesAndroidPage"><div class="loading"><m3e-circular-progress-indicator indeterminate class="m3eInlineProgress" aria-label="Loading"></m3e-circular-progress-indicator><span>Loading…</span></div></section>';
 const x=await A.api({path:'collections',params:{limit:200}}); const appsX=await A.api({path:'resource_apps',params:{limit:200}}).catch(()=>({}));
 const all=x.collection||x.collections||x.collection_list||[]; const apps=appsX.resource_apps||appsX.resourceApps||appsX.collection||appsX.collections||[];
 const uid=state.auth?.userId||state.auth?.user?.id; const groups=[],shared=[],mine=[];
 all.forEach(o=>{const owner=Number(o.collection_owner_id??o.collectionOwnerId??o.uid??o.owner_id??0), realmRaw=o.collection_realm??o.collectionRealm??o.realm??null, realm=String(realmRaw??'').toLowerCase(), sharedCount=Number(o.shared_users_count??o.sharedUsersCount??o.shared_users??0);if(realmRaw==null&&owner===Number(uid))mine.push(o);else if(sharedCount>0)shared.push(o);else if(realm==='group')groups.push(o)});
 const categories=[['mine','My Resources',mine],['shared','Shared',shared],['groups','Groups',groups],['apps','Resource Apps',apps]];
 c.innerHTML=`<section class="resourcesAndroidPage"><div class="resourceCategoryList">${categories.map(([key,label,list])=>`<m3e-expansion-panel class="resourceCategory" data-resource-category-panel="${key}"><span slot="header" class="resourceCategoryHeader"><img src="../assets/icons/${collectionIcon(key)}" alt=""><span>${esc(label)}</span></span><m3e-action-list variant="segmented" class="resourceCategoryChildren" id="resource-${key}">${list.length?list.map((o,i)=>`<m3e-list-action class="resourceCollectionRow" data-resource-collection="${key}" data-resource-index="${i}" tabindex="0"><span slot="leading" class="m3eOriginalIcon">${key==='apps'?(o.app_logo||o.appLogo?`<img class="resourceAppLogo" data-media-image-url="${esc(normalizeImageUrl(o.app_logo||o.appLogo))}" alt="" style="display:none"><img class="resourceAppFallback" src="../assets/icons/ic_menu_post.png" alt="">`:`<img src="../assets/icons/ic_menu_post.png" alt="">`):`<img src="../assets/icons/${o.collection_type_id==3?'ic_eportfolio.png':'ic_collection.png'}" alt="">`}</span><span>${esc(o.collection_title||o.title||o.name||'Resource')}</span><span slot="trailing" class="m3eOriginalIcon">${originalM3Icon('chevron_right')}</span></m3e-list-action>`).join(''):'<m3e-list-item class="resourceEmpty">No resources</m3e-list-item>'}</m3e-action-list></m3e-expansion-panel>`).join('')}</div></section>`;
 window.__resourceCategories=Object.fromEntries(categories.map(([k,l,a])=>[k,a])); await hydrateMediaImages(c);
 document.querySelectorAll('[data-resource-collection]').forEach(b=>b.onclick=async()=>{const col=window.__resourceCategories[b.dataset.resourceCollection][+b.dataset.resourceIndex];const stop=setResourceLoading(b,'Loading resources…');try{if(b.dataset.resourceCollection==='apps'){const j=await A.launchCourseApp({appId:col.collection_id||col.collectionID||col.id});const url=j?.url||j?.launch_token_url||j?.launchTokenUrl||j?.data?.url||j?.data?.launchTokenUrl;if(!url)throw new Error('Schoology did not return a resource-app launch URL.');{const error=await A.openExternal(url);if(error)throw new Error(error)}}else await openResourceCollection(col,b)}catch(e){alert('Unable to open resource: '+e.message)}finally{stop()}});
}
async function openResourceCollection(col){
 const c=document.getElementById('content');if(!c)return;state.resourceCollection=col;state.toolbarTitle=col.collection_title||col.title||col.name||'Resources';syncToolbar();
 const id=col.collection_id||col.collectionID||col.id;if(!id)return;
 const folderId=col.folder_id||col.folderId||col.collection_folder_id||col.collectionFolderId||0;
 c.innerHTML='<section class="resourcesAndroidPage"><div class="loading"><m3e-circular-progress-indicator indeterminate class="m3eInlineProgress" aria-label="Loading"></m3e-circular-progress-indicator><span>Loading resources…</span></div></section>';
 try{const x=await A.api({path:`collections/${id}/resources`,params:{start:0,limit:200,with_attachments:'TRUE',...(folderId?{f:folderId}:{})}});const arr=x.resource||x.resources||x.resource_list||[];c.innerHTML=`<section class="resourcesAndroidPage"><div class="resourceRows">${arr.length?arr.map((r,i)=>{const title=resourceTitle(r),type=resourceType(r);return `<button class="resourceFileRow" data-resource-item-index="${i}"><img src="../assets/icons/${resourceIconForType(type,title,r)}" alt=""><span><b>${esc(title)}</b></span><span>›</span></button>`}).join(''):'<div class="resourceEmpty">No resources</div>'}</div></section>`;window.__resourceItems=arr;document.querySelectorAll('[data-resource-item-index]').forEach(b=>b.onclick=async()=>{const stop=setResourceLoading(b,'Loading resource…');try{await openCollectionResource(window.__resourceItems[+b.dataset.resourceItemIndex],b)}catch(e){alert('Unable to open resource: '+e.message)}finally{stop()}})}catch(e){c.innerHTML=`<div class="error apiError">Schoology could not load resources.<br>${esc(e.message)}</div>`}
}
let homeLayoutMediaQuery=null;
function installHomeLayoutWatcher(){const mq=window.matchMedia('(min-aspect-ratio: 4/3)');if(homeLayoutMediaQuery===mq)return;window.__schoologyHomeLayoutChange=()=>{const savedHomeTab=state.homeTab,savedCourse=state.selectedCourse,savedCourseView=state.courseView,savedCourseTab=state.courseTab;if(state.courseView==='course'&&savedCourse){clearTimeout(resizeRefreshTimer);resizeRefreshTimer=setTimeout(()=>{if(state.courseView==='course'&&state.selectedCourse===savedCourse){showCourse(savedCourse,savedCourseTab||'materials',true)}},60);return;}if(state.tab==='home'){clearTimeout(resizeRefreshTimer);resizeRefreshTimer=setTimeout(()=>{if(state.tab==='home'&&state.courseView!=='course'){state.homeTab=savedHomeTab;loadTab()}},60)}};homeLayoutMediaQuery?.removeEventListener?.('change',window.__schoologyHomeLayoutChange);mq.addEventListener?.('change',window.__schoologyHomeLayoutChange);homeLayoutMediaQuery=mq}
async function openRequest(r){if(!r)return;try{const type=String(r.requestType||r.type||r.request_type||'').toLowerCase();if(type==='friend'){const id=Number(r.requester_id||r.requesterId||r.user_id||r.uid||0);if(!id)throw new Error('This friend request is missing its user ID.');state.profileUser={id};state.tab='profile';state.toolbarTitle='Profile';render();loadTab();return}if(type==='group'){const gid=Number(r.realm_id||r.realmId||r.group_id||r.groupId||0);if(!gid)throw new Error('This group invitation is missing its group ID.');state.currentGroup={id:gid,name:r.name||r.title||'Group'};state.tab='groups';state.toolbarTitle=state.currentGroup.name;render();showGroup(state.currentGroup);return}if(type==='section'){const sid=Number(r.realm_id||r.realmId||r.section_id||r.sectionId||0);if(!sid)throw new Error('This course invitation is missing its section ID.');const x=await A.api({path:`sections/${sid}`,params:{}});showCourse(x?.section||x);return}throw new Error('Unknown request type.')}catch(e){alert('Unable to open request: '+e.message)}}
async function handleRequestAction(r,accept){if(!r)return;try{const uid=state.auth?.userId||state.auth?.user?.id;if(!uid)throw new Error('Schoology did not return the logged-in user ID.');const id=r.id||r.request_id||r.requestId;if(!id)throw new Error('This request is missing its ID.');if(r.requestType==='friend'){await A.api({path:`users/${uid}/requests/friends/${id}`,method:'PUT',params:{request:{request_action:accept?'accept':'deny'}},json:true});}else{const realm=r.requestType==='group'?'groups':'sections';await A.api({path:`users/${uid}/invites/${realm}/${id}`,method:'PUT',params:{invite:{invite_action:accept?'accept':'deny'}},json:true});}await loadTab()}catch(e){alert(`Unable to ${accept?'accept':'decline'} request: ${e.message}`)}}

async function openNotification(n){
  if(!n)return;
  const realmRaw=String(n.realm||'user').toLowerCase();
  const realm=realmRaw==='section'?'sections':realmRaw==='group'?'groups':realmRaw==='school'?'schools':realmRaw==='user'?'users':realmRaw;
  const realmId=n.realm_id||n.realmId||n.user_id||n.uid||state.auth?.userId;
  const args=n.body_args||n.bodyArgs||n.body_arg||[];
  const list=Array.isArray(args)?args:(args?.body_arg||args?.args||[]);
  const candidates=[];
  const walk=v=>{if(!v)return;if(Array.isArray(v)){v.forEach(walk);return}if(typeof v==='object'){if(v.type&&v.id!=null)candidates.push(v);Object.values(v).forEach(x=>{if(x&&typeof x==='object')walk(x)})}}; walk(list);
  let a=candidates[candidates.length-1];
  if(String(n.type||'').toLowerCase()==='badge_award' && a?.type==='user')a={...a,type:'section'};
  if(!a?.id){a={type:n.object_type||n.objectType||n.type==='discussion_add'?'discussion':n.type==='grade_item_submit'?'assignment':null,id:n.object_id||n.objectId||n.assignment_id||n.assignmentId};}
  const type=String(a?.type||'').toLowerCase(), id=a?.id;
  try{
    if(!id)return;
    if(type==='assignment'||type==='assessment'||type==='assessment_v2'||type==='managed_assessment'){if(realm==='sections'&&realmId)showEmbeddedWeb(`https://app.schoology.com/assignment/${id}`,n.title||'Assessment',{allowBrowser:false,quiz:true,assessment:true});return}
    if(type==='discussion'){if(realm==='sections'&&realmId){showDiscussionNative('sections',realmId,id,n.title||'Discussion')}else if(realm==='groups'&&realmId){showDiscussionNative('groups',realmId,id,n.title||'Discussion')}else {showEmbeddedWeb(`https://app.schoology.com/discussion/${id}`,n.title||'Discussion',{allowBrowser:false})}return}
    if(type==='page'){if(realm&&realmId){showPageNative(realm,Number(realmId),Number(id),n.title||'Page');return}return}
    if(type==='user'){state.profileUser={id:Number(id)};state.tab='profile';state.toolbarTitle='Profile';render();loadTab();return}
    if(type==='group'){state.currentGroup={id:Number(id),name:n.title||'Group'};state.tab='groups';state.toolbarTitle=n.title||'Group';render();showGroup(state.currentGroup);return}
    if(type==='section'){const x=await A.api({path:`sections/${id}`,params:{}});showCourse(x?.section||x);return}
    if(type==='school'){showEmbeddedWeb(`https://app.schoology.com/school/${id}`,n.title||'School');return}
    showEmbeddedWeb(`https://app.schoology.com/${realm}/${id}`,n.title||'Notification');
  }catch(e){alert('Unable to open notification: '+e.message)}
}

async function loadMessagesPage(c,force=false){
 const wantsSplit=window.matchMedia('(min-width: 801px)').matches;const folders=['inbox','sent'];state.messageCache=state.messageCache||{};
 await Promise.all(folders.map(async folder=>{
  if(!force&&state.messageCache[folder])return;
  const response=await A.api({path:folder==='sent'?'messages/sent':'messages/inbox',params:{limit:50}}),arr=response?.message||response?.messages||response?.data?.message||[];
  const ids=[...new Set(arr.map(row=>Number(folder==='sent'?(row.recipient_ids||row.recipientIds||'').split(',')[0]:(row.author_id||row.authorId))).filter(Boolean))],users={};
  await Promise.all(ids.map(async id=>{try{const result=await A.api({path:'users/'+id,params:{}});users[id]=result?.user||result}catch{} }));
  state.messageCache[folder]={arr,users};
 }));
 if(wantsSplit)renderMessagesSplit(c);else renderMessageFolderInto(c,state.messageTab==='sent'?'sent':state.messageTab==='unread'?'unread':'inbox');
}
function isMessageUnread(message){const status=String(message?.message_status||message?.messageStatus||'').toLowerCase();return status==='unread'||message?.is_read===false||message?.isRead===false||message?.unread===true||message?.read===false}
function messageRowsForFolder(folder){const cache=state.messageCache?.[folder==='unread'?'inbox':folder]||{arr:[],users:{}};return folder==='unread'?cache.arr.filter(isMessageUnread):cache.arr}
function renderMessageListMarkup(folder){
 const cache=state.messageCache?.[folder==='unread'?'inbox':folder]||{arr:[],users:{}},rows=messageRowsForFolder(folder),users=cache.users;
 return rows.map((message,index)=>{const uid=Number(folder==='sent'?(message.recipient_ids||message.recipientIds||'').split(',')[0]:(message.author_id||message.authorId)),user=users[uid]||{},me=Number(state.auth?.userId||state.auth?.user?.id||0)===uid,name=me?'You':(user.name_display||user.nameDisplay||user.display_name||user.name||'Schoology'),avatar=normalizeImageUrl(user.picture_url||user.pictureUrl||user.picture||''),timestamp=message.last_updated||message.lastUpdated||message.created||message.timestamp,date=timestamp?(typeof timestamp==='number'||/^\\d+$/.test(String(timestamp))?new Date(Number(timestamp)*1000).toLocaleString():String(timestamp)):'';
  return '<m3e-list-action class="messageListItem '+(isMessageUnread(message)?'unread':'')+'" data-message="'+index+'" data-message-folder="'+folder+'" tabindex="0"><span slot="leading" class="messageListAvatar">'+(avatar?'<img data-media-image-url="'+esc(avatar)+'" alt="" style="display:none">':esc(String(name).charAt(0)))+'</span><span>'+esc(name)+'</span><span slot="supporting-text">'+esc(message.subject||'Message')+(date?' · '+esc(date):'')+'</span>'+(isMessageUnread(message)?'<span slot="trailing" class="messageUnreadDot"></span>':'')+'</m3e-list-action>';
 }).join('')||'<div class="empty">No messages.</div>';
}
function wireMessageList(root){root.querySelectorAll('[data-message]').forEach(button=>button.onclick=async()=>{const folder=button.dataset.messageFolder||state.messageTab||'inbox',rows=messageRowsForFolder(folder),message=rows[Number(button.dataset.message)];if(!message)return;state.messageTab=folder;state.messageFolder=folder;state.message=message;state.messageThread=null;render();await loadMessageThread(message)})}
function renderMessagesSplit(c){
 const active=state.messageTab==='unread'?'unread':'inbox';
 c.innerHTML='<m3e-split-pane orientation="horizontal" class="messagesSplitLayout messagesSplitPaneM3e" data-persist-key="messages-inbox-sent" value="50" min="30" max="70" step="1" label="Resize inbox and sent messages"><section slot="start" class="messagesSplitColumn messagesInboxSplitColumn"><m3e-button-group variant="connected" class="messageTabsToggleGroup" aria-label="Inbox tabs"><m3e-button variant="tonal" toggle data-split-message-tab="inbox" '+(active==='inbox'?'selected':'')+'>Inbox</m3e-button><m3e-button variant="tonal" toggle data-split-message-tab="unread" '+(active==='unread'?'selected':'')+'>Unread</m3e-button></m3e-button-group><m3e-action-list variant="segmented" class="messageList" data-split-folder="inbox" style="display:'+(active==='inbox'?'block':'none')+'">'+renderMessageListMarkup('inbox')+'</m3e-action-list><m3e-action-list variant="segmented" class="messageList" data-split-folder="unread" style="display:'+(active==='unread'?'block':'none')+'">'+renderMessageListMarkup('unread')+'</m3e-action-list></section><section slot="end" class="messagesSplitColumn messagesSentSplitColumn"><div class="messagesSplitHeading">Sent</div><m3e-action-list variant="segmented" class="messageList" data-split-folder="sent">'+renderMessageListMarkup('sent')+'</m3e-action-list></section></m3e-split-pane>';
 c.querySelectorAll('[data-split-message-tab]').forEach(button=>button.addEventListener('click',()=>{const next=button.dataset.splitMessageTab;state.messageTab=next;c.querySelectorAll('[data-split-message-tab]').forEach(tab=>{tab.toggleAttribute('selected',tab===button);tab.selected=tab===button});for(const folder of ['inbox','unread']){const list=c.querySelector('[data-split-folder="'+folder+'"]');if(list)list.style.display=folder===next?'block':'none'}}));
 wireMessageList(c);void hydrateMediaImages(c);
}
function renderMessageFolderInto(c,folder){
 const active=folder==='sent'?'sent':folder==='unread'?'unread':'inbox';state.messageTab=active;
 c.innerHTML='<section class="messagesAndroidPage"><m3e-button-group variant="connected" class="messageTabsToggleGroup" aria-label="Message folders"><m3e-button variant="tonal" toggle data-message-tab="inbox" '+(active==='inbox'?'selected':'')+'>Inbox</m3e-button><m3e-button variant="tonal" toggle data-message-tab="unread" '+(active==='unread'?'selected':'')+'>Unread</m3e-button><m3e-button variant="tonal" toggle data-message-tab="sent" '+(active==='sent'?'selected':'')+'>Sent</m3e-button></m3e-button-group><m3e-action-list variant="segmented" class="messageList">'+renderMessageListMarkup(active)+'</m3e-action-list></section>';
 c.querySelectorAll('[data-message-tab]').forEach(button=>button.addEventListener('click',()=>{const next=button.dataset.messageTab;state.messageTab=next;renderMessageFolderInto(c,next)}));
 wireMessageList(c);void hydrateMediaImages(c);
}
let messageResizeFrame=0;
window.addEventListener('resize',()=>{if(messageResizeFrame)return;messageResizeFrame=requestAnimationFrame(()=>{messageResizeFrame=0;const content=document.getElementById('content'),page=content?.querySelector('.messagesAndroidPage');if(!page)return;const split=window.matchMedia('(min-width: 801px)').matches,hasSplit=page.classList.contains('messagesSplitLayout');if(split!==hasSplit)loadMessagesPage(content,true).catch(error=>showAppDialog('Unable to resize messages',error?.message||String(error)))})});
async function loadTab(){
 const c=document.getElementById('content');if(!c)return;
 const generation=++loadTabGeneration;
 const tabAtStart=state.tab;
 const tabTitles={home:'Home',courses:'Courses',groups:'Groups',resources:'Resources',grades:'Grades',calendar:'Calendar',messages:'Messages',notifications:'Notifications',requests:'Requests',people:'People',settings:'Settings',profile:'Profile'};
 // Set the toolbar title synchronously before any asynchronous API work starts.
 // Older loadTab() calls are invalidated by loadTabGeneration so a slow response
 // from the previous screen can never put its title back into the current toolbar.
 state.toolbarTitle=tabTitles[tabAtStart]||state.toolbarTitle||'Home';
 syncToolbar();
 c.innerHTML='<div class="loading"><m3e-circular-progress-indicator indeterminate class="m3eInlineProgress" aria-label="Loading"></m3e-circular-progress-indicator><span>Loading…</span></div>';
 const uid=state.auth?.userId||state.auth?.user?.id;
 try{
  if(state.tab==='home'){
    installHomeLayoutWatcher();
    await loadHomeCreationPermissions();
    const landscape=window.matchMedia('(min-width: 801px)').matches;
    if(landscape){
      const tabs=`<m3e-tabs variant="secondary" class="m3eSchoologyTabs homeTabsM3e">${`<m3e-tab data-home-tab="recent" ${state.homeTab==='recent'?'selected':''}>Recent Activity</m3e-tab>`}${state.courseDashboardEnabled?`<m3e-tab data-home-tab="dashboard" ${state.homeTab==='dashboard'?'selected':''}>Course Dashboard</m3e-tab>`:''}</m3e-tabs>`;
      c.innerHTML=`<m3e-split-pane class="homeLandscapeSplitM3e" data-persist-key="home" orientation="auto" value="75" min="20" max="90" step="1" label="Resize Home panes"><section slot="start" class="homeRightPane"><div class="homeTabs">${tabs}</div><section id="homeTabContent" class="activity"></section></section><section slot="end" id="homeUpcomingPane" class="homeUpcomingPane"></section></m3e-split-pane>`;
      document.querySelectorAll('[data-home-tab]').forEach(b=>b.onclick=()=>{state.homeTab=b.dataset.homeTab;syncM3eTabSelection(document.getElementById('content'),'homeTab',state.homeTab);loadHomeTab()});
      await loadHomeUpcomingPane();
      await loadHomeTab();
    }else{
      const tabs=`<m3e-tabs variant="secondary" class="m3eSchoologyTabs homeTabsM3e"><m3e-tab data-home-tab="recent" ${state.homeTab==='recent'?'selected':''}>Recent Activity</m3e-tab>${state.courseDashboardEnabled?`<m3e-tab data-home-tab="dashboard" ${state.homeTab==='dashboard'?'selected':''}>Course Dashboard</m3e-tab>`:''}<m3e-tab data-home-tab="upcoming" ${state.homeTab==='upcoming'?'selected':''}>Upcoming</m3e-tab></m3e-tabs>`;
      c.innerHTML=`<div class="homeTabViewport"><div class="homeTabs">${tabs}</div><section id="homeTabContent" class="activity"></section></div>`;
      document.querySelectorAll('[data-home-tab]').forEach(b=>b.onclick=()=>{const order=['recent','dashboard','upcoming'];const oldIndex=order.indexOf(state.homeTab),newIndex=order.indexOf(b.dataset.homeTab);state.homeTabDirection=newIndex>=oldIndex?'forward':'back';state.homeTab=b.dataset.homeTab;syncM3eTabSelection(document.getElementById('content'),'homeTab',state.homeTab);loadHomeTab()});
      await loadHomeTab();
    }
  }else if(state.tab==='courses'){
    if(!uid)throw new Error('Schoology did not return the logged-in user ID.');
    const x=await A.api({path:`users/${uid}/sections`,params:{limit:100}});const arr=x.section||x.sections||[];window.__schoologyCourses=arr;
    c.innerHTML=`<section class="androidSectionList"><div class="sectionListRows">${arr.map((s,i)=>{
      const courseTitle=s.course_title||s.courseTitle||s.title||s.section_title||'Course';
      const sectionTitle=s.section_title||s.sectionTitle||'';
      const image=normalizeImageUrl(s.profile_url||s.profileUrl||s.course_profile_url||s.courseProfileUrl||s.course_theme||s.courseTheme||s.image||s.course_image||'');
      const admin=String(s.admin||'')==='1'||s.admin===true;
      return `<button class="sectionListItem" data-course-page="${i}">
        <span class="sectionImage">${image?`<img data-course-image-url="${esc(image)}" alt="" style="display:none">`:''}<span>${esc(courseTitle.charAt(0))}</span></span>
        <span class="sectionLabels"><b>${esc(courseTitle)}</b><small>${esc(sectionTitle)}</small></span>
        ${admin?'<span class="courseAdmin">★</span>':''}
      </button>`;
    }).join('')||'<div class="empty"><h2>No courses found.</h2></div>'}</div></section>`;
    document.querySelectorAll('[data-course-page]').forEach(b=>b.onclick=()=>showCourse(window.__schoologyCourses[+b.dataset.coursePage])); await hydrateCourseImages(c);
  }else if(state.tab==='profile'){
    const puid=state.profileUser?.id||uid;
    if(!puid)throw new Error('Schoology did not return the profile user ID.');
    let user=state.profileUser?.user||state.profileUser;
    if(!user || Object.keys(user).length<=1){
      const ur=await A.api({path:`users/${puid}`,params:{}});user=ur?.user||ur||{};state.profileUser=user;
    }
    const image=normalizeImageUrl(user.picture_url||user.pictureUrl||user.picture||user.photo_url||'');
    const profileLandscape=currentWindowLayout()==='landscape';
    c.innerHTML=`<section class="profileAndroidPage ${profileLandscape?'profileLandscapePage':''}">
      <div class="profileHeader"><img data-media-image-url="${esc(image)}" class="profileHeaderImage" style="display:none"><span class="profileHeaderFallback">${esc(String(user.name_display||user.name||'U').charAt(0))}</span><div><h1>${esc(user.name_display||user.name||'Profile')}</h1><p>${esc(user.school_name||user.school?.school_name||'')}</p></div></div>
      ${profileLandscape?`<div class="profileLandscapePanes">
        <section class="profilePane"><h2>Updates</h2><div id="profilePaneUpdates" class="profilePaneContent"></div></section>
        <section class="profilePane"><h2>Info</h2><div id="profilePaneInfo" class="profilePaneContent"></div></section>
        <section class="profilePane"><h2>Badges</h2><div id="profilePaneBadges" class="profilePaneContent"></div></section>
      </div>`:`<><div class="profileTabs"><m3e-tabs variant="secondary" class="m3eSchoologyTabs profileTabsM3e">
        <m3e-tab class="profileTab" data-profile-tab="updates" ${state.profileTab==='updates'?'selected':''}>Updates</m3e-tab>
        <m3e-tab class="profileTab" data-profile-tab="info" ${state.profileTab==='info'?'selected':''}>Info</m3e-tab>
        <m3e-tab class="profileTab" data-profile-tab="badges" ${state.profileTab==='badges'?'selected':''}>Badges</m3e-tab>
      </m3e-tabs></div><div id="profileTabContent"></div></>`}
    </section>`;
    const pc=document.getElementById('profileTabContent');
    const loadProfileTab=async(tab)=>{
      state.profileTab=tab;syncM3eTabSelection(document.getElementById('content'),'profileTab',tab);
      const target=document.getElementById(profileLandscape?`profilePane${tab.charAt(0).toUpperCase()+tab.slice(1)}`:'profileTabContent'); if(!target)return;
      const pane=target;
      if(tab==='info'){
        const rows=[['Email',user.primary_email||user.primaryEmail||''],['Username',user.username||''],['First Name',user.first_name||user.firstName||''],['Last Name',user.last_name||user.lastName||'']];
        pane.innerHTML=`<div class="profileInfoList">${rows.filter(r=>r[1]).map(r=>`<div class="profileInfoRow"><span>${esc(r[0])}</span><b>${esc(r[1])}</b></div>`).join('')||'<div class="empty">No profile information available.</div>'}</div>`;
      }else if(tab==='badges'){
        try{const x=await A.api({path:`users/${puid}/badges`,params:{}});const arr=x.badge||x.badges||x.items||[];pane.innerHTML=arr.length?`<div class="badgeGrid">${arr.map(b=>`<article class="badgeCard"><b>${esc(b.name||b.title||'Badge')}</b><small>${esc(b.description||'')}</small></article>`).join('')}</div>`:'<div class="empty">No badges.</div>'}catch(e){pane.innerHTML='<div class="empty">No badges.</div>'}
      }else{
        try{const x=await A.api({path:'users/'+puid+'/updates',params:{start:0,limit:50,with_attachments:'TRUE',richtext:1}});const arr=x.update||x.updates||x.update_list||[];const avatar=normalizeImageUrl(user.picture_url||user.pictureUrl||user.picture||user.photo_url||'');pane.innerHTML=arr.length?'<div class="profileUpdatesShared">'+arr.map(post=>renderSharedPostCard({post,id:sharedPostId(post),realm:'users',realmId:puid,author:user.name_display||user.display_name||user.name||'Schoology',avatar,authorId:puid,cardClass:'profileUpdateCard'})).join('')+'</div>':'<div class="empty">No updates.</div>';await hydrateMediaImages(pane);wireSharedPostList(pane,'users',puid,arr,{authorUsers:{[puid]:user}})}catch(e){pane.innerHTML='<div class="empty">No updates.</div>'}
      }
    };
    document.querySelectorAll('[data-profile-tab]').forEach(b=>b.onclick=()=>loadProfileTab(b.dataset.profileTab));
    if(profileLandscape){await Promise.all(['updates','info','badges'].map(loadProfileTab));}
    else await loadProfileTab(state.profileTab);
    await hydrateMediaImages(c);
  }else if(state.tab==='groups'){
    if(!uid)throw new Error('Schoology did not return the logged-in user ID.');
    const x=await A.api({path:`users/${uid}/groups`,params:{limit:100}});const arr=x.group||x.groups||[];
    window.__schoologyGroups=arr;
    c.innerHTML=`<section class="groupsAndroidPage"><h1>Groups</h1><div class="groupList">${arr.map((g,i)=>{const gi=normalizeImageUrl(g.picture_url||g.pictureUrl||g.picture||g.image||'');return `<button class="groupListItem" data-group-index="${i}"><span class="groupImage">${gi?`<img data-course-image-url="${esc(gi)}" alt="" style="display:none">`:''}<span class="groupImageFallback" style="display:${gi?'none':'flex'}">${esc(String(g.name||g.title||'G').charAt(0))}</span></span><span><b>${esc(g.name||g.title||'Group')}</b><small>${esc(g.description||g.group_description||'')}</small></span>${g.admin?'<span>★</span>':''}</button>`}).join('')||'<div class="empty">No groups found.</div>'}</div></section>`; await hydrateCourseImages(c);
    document.querySelectorAll('[data-group-index]').forEach(b=>b.onclick=()=>showGroup(window.__schoologyGroups[+b.dataset.groupIndex]));
  }else if(state.tab==='calendar'){
    if(!uid)throw new Error('Schoology did not return the logged-in user ID.');
    state.calendarTab=state.calendarTab||'calendar';
    const perm=await A.api({path:`users/${uid}/events/permissions`,params:{}}).catch(()=>({}));
    state.calendarCanCreate=!!(perm?.permission?.post??perm?.permissions?.post??perm?.permission_map?.post??perm?.canPOST??perm?.can_post);
    c.innerHTML=`<section class="calendarPagerPage"><div class="calendarPagerTabs"><m3e-tabs variant="secondary" class="m3eSchoologyTabs calendarTabsM3e"><m3e-tab class="calendarPagerTab" data-calendar-tab="calendar" ${state.calendarTab==='calendar'?'selected':''}>Calendar</m3e-tab><m3e-tab class="calendarPagerTab" data-calendar-tab="upcoming" ${state.calendarTab==='upcoming'?'selected':''}>Upcoming</m3e-tab></m3e-tabs></div><div id="calendarPagerContent" class="calendarPagerContent"><div class="loading"><m3e-circular-progress-indicator indeterminate class="m3eInlineProgress" aria-label="Loading"></m3e-circular-progress-indicator><span>Loading…</span></div></div></section>`;
    const pager=document.getElementById('calendarPagerContent');
    const renderCalendarRows=events=>events.map(e=>{const type=String(e.type||'').toLowerCase();const icon=type==='assignment'?'ic_assignment.png':type==='assessment'?'ic_test_quiz.png':['assessment_v2','managed_assessment','quiz'].includes(type)?'ic_assessment_48dp.png':type==='discussion'?'ic_discussion.png':type==='external_tool'?'ic_external_tool.png':'home_dash_upcoming.png';const allDay=String(e.all_day??e.allDay??'')==='1'||e.allDay===1;const start=e.start||e.start_date||e.startDate||'';let time='';if(!allDay&&start){const dt=new Date(String(start).replace(' ','T'));if(!Number.isNaN(dt.getTime()))time=dt.toLocaleTimeString([], {hour:'numeric',minute:'2-digit'});}return `<m3e-list-action data-calendar-event="${esc(e.id||'')}"><span slot="leading" class="m3eOriginalIcon calendarEventIcon">${officialOrAssetIcon(icon,'')}</span><span>${esc(e.title||'Event')}</span>${time?`<span slot="supporting-text">${esc(time)}</span>`:''}</m3e-list-action>`}).join('');
    const bindEventRows=(events)=>document.querySelectorAll('[data-calendar-event]').forEach(btn=>{if(btn.dataset.boundCalendar)return;btn.dataset.boundCalendar='1';btn.addEventListener('click',()=>{const e=events.find(v=>String(v.id||'')===String(btn.dataset.calendarEvent));if(!e)return;const type=String(e.type||'').toLowerCase();const aid=e.assignment_id??e.assignmentId??e.assignment?.id;const sid=e.section_id??e.sectionId;if(type==='assignment'&&aid){showAssignment(sid,aid);return}if(['assessment','assessment_v2','managed_assessment','quiz'].includes(type)){const id=aid??e.id;if(id){A.prepareWebSession().then(()=>showEmbeddedWeb(`https://app.schoology.com/assignment/${id}`,e.title||'Quiz',{allowBrowser:false,quiz:true,assessment:true}));return}}if(type==='discussion'){const did=upcomingDiscussionId(e),gid=e.group_id??e.groupId;if(did&&sid){showDiscussionNative('sections',sid,did,e.title||'Discussion');return}if(did&&gid){showDiscussionNative('groups',gid,did,e.title||'Discussion');return}if(e.web_url||e.webUrl){showEmbeddedWeb(e.web_url||e.webUrl,e.title||'Discussion');return}}if(type==='event'&&e.id){showEventNative(sid?'sections':'users',sid||state.auth?.userId,e.id,e.title||'Event');return}if(e.web_url||e.webUrl){showEmbeddedWeb(e.web_url||e.webUrl,e.title||'Upcoming');return}})});
    const loadCalendarUpcomingData=async()=>{
      if(!Array.isArray(state.calendarUpcomingEvents)){const x=await A.api({path:`users/${uid}/events`,params:{start_date:formatApiDate(new Date()),limit:100}});state.calendarUpcomingEvents=x.event||x.events||[];}
      return Array.isArray(state.calendarUpcomingEvents)?state.calendarUpcomingEvents:[];
    };
    const upcomingNow=()=>{const now=new Date();return (Array.isArray(state.calendarUpcomingEvents)?state.calendarUpcomingEvents:[]).filter(e=>{const d=new Date(String(e.start||e.start_date||e.startDate||'').replace(' ','T'));return Number.isNaN(d.getTime())||d>=now}).sort((a,b)=>new Date(String(a.start||a.start_date||a.startDate||'').replace(' ','T'))-new Date(String(b.start||b.start_date||b.startDate||'').replace(' ','T')))};
    const loadCalendarMonth=async()=>{
      await loadCalendarUpcomingData();
      const month=state.calendarDate?new Date(state.calendarDate):new Date(); state.calendarDate=new Date(month.getFullYear(),month.getMonth(),1);
      const selected=state.calendarSelectedDate?new Date(state.calendarSelectedDate):new Date();
      const monthStart=new Date(month.getFullYear(),month.getMonth(),1),monthEnd=new Date(month.getFullYear(),month.getMonth()+1,0); const monthKey=`${month.getFullYear()}-${String(month.getMonth()+1).padStart(2,'0')}`;
      if(state.calendarEventsMonth!==monthKey){const x=await A.api({path:`users/${uid}/events`,params:{start:`${monthKey}-01`,end:`${monthKey}-${String(monthEnd.getDate()).padStart(2,'0')}`,limit:200}});state.calendarEvents=x.event||x.events||[];state.calendarEventsMonth=monthKey;}
      const arr=Array.isArray(state.calendarEvents)?state.calendarEvents:[];const byDay={};for(const e of arr){const raw=e.start||e.start_date||e.date||e.startDate||'';const key=String(raw).slice(0,10);if(key)(byDay[key]||(byDay[key]=[])).push(e)}
      const selectedKey=formatApiDate(selected),days=monthStart.getDay(),rows=Math.ceil((days+monthEnd.getDate())/7),cells=[];
      for(let i=0;i<rows*7;i++){const n=i-days+1,inMonth=n>=1&&n<=monthEnd.getDate(),d=inMonth?new Date(month.getFullYear(),month.getMonth(),n):null,key=d?formatApiDate(d):'',evs=key?(byDay[key]||[]):[];cells.push(`<button class="calendarDay ${key===selectedKey?'selected':''} ${inMonth?'':'outside'}" data-calendar-day="${key}"><b>${inMonth?n:''}</b>${evs.length?'<i class="calendarEventMarker" aria-hidden="true"></i>':''}</button>`)}
      const calLandscape=currentWindowLayout()==='landscape';
      pager.innerHTML=`<section class="calendarAndroidPage"><m3e-split-pane orientation="auto" class="calendarMainSplit" data-persist-key="calendar" value="${calLandscape?'72':'64'}" min="35" max="85" step="1" label="Resize calendar and upcoming"><section slot="start" class="calendarMonthWrap"><m3e-calendar id="m3eSchoologyCalendar" date="${esc(selected.toISOString())}" start-at="${esc(month.toISOString())}"></m3e-calendar></section><section slot="end" class="calendarLandscapeUpcoming"><div class="calendarUpcomingHeader">Upcoming</div><m3e-action-list variant="segmented" class="calendarEventList" id="calendarUpcomingAll">${renderCalendarRows(upcomingNow())||'<m3e-list-action disabled>No upcoming events</m3e-list-action>'}</m3e-action-list></section></m3e-split-pane><m3e-action-list variant="segmented" id="calendarEventList" class="calendarEventList calendarSelectedDayList">${renderCalendarRows(byDay[selectedKey]||[])||'<m3e-list-action disabled>No upcoming events</m3e-list-action>'}</m3e-action-list></section>`;
      const m3cal=document.getElementById('m3eSchoologyCalendar');
      m3cal?.addEventListener('change',()=>{const d=m3cal.date;if(!(d instanceof Date)||Number.isNaN(d.getTime()))return;state.calendarSelectedDate=d;const key=formatApiDate(d);const list=document.getElementById('calendarEventList');if(list)list.innerHTML=renderCalendarRows(byDay[key]||[])||'<m3e-list-action disabled>No upcoming events</m3e-list-action>';bindEventRows(arr)});
      bindEventRows([...upcomingNow(),...arr]);
    };
    const loadCalendarUpcoming=async()=>{
      await loadCalendarUpcomingData();
      const arr=upcomingNow();
      if(!arr.length){pager.innerHTML='<section class="calendarStandaloneUpcoming"><div class="calendarUpcomingListEmpty"><h2>No upcoming events</h2></div></section>';return;}
      let lastDay='';let html='';for(const e of arr){const d=new Date(String(e.start||e.start_date||e.startDate||'').replace(' ','T'));const day=Number.isNaN(d.getTime())?'':d.toLocaleDateString([], {weekday:'short',month:'short',day:'numeric',year:'numeric'});if(day&&day!==lastDay){html+=`<m3e-list-item class="calendarUpcomingDate">${esc(day)}</m3e-list-item>`;lastDay=day;}html+=renderCalendarRows([e]);}
      pager.innerHTML=`<section class="calendarStandaloneUpcoming"><m3e-list variant="segmented" class="calendarUpcomingList">${html}</m3e-list></section>`;bindEventRows(arr);
    };
    const selectCalendarTab=async(tab)=>{state.calendarTab=tab;syncM3eTabSelection(document,'calendarTab',tab);pager.innerHTML='<div class="loading"><m3e-circular-progress-indicator indeterminate class="m3eInlineProgress" aria-label="Loading"></m3e-circular-progress-indicator><span>Loading…</span></div>';try{if(tab==='calendar')await loadCalendarMonth();else await loadCalendarUpcoming()}catch(e){pager.innerHTML=`<div class="error apiError">Unable to load Calendar.<br>${esc(e.message)}</div>`}};
    document.querySelectorAll('[data-calendar-tab]').forEach(b=>b.addEventListener('click',()=>selectCalendarTab(b.dataset.calendarTab)));
    try{if(state.calendarTab==='calendar')await loadCalendarMonth();else await loadCalendarUpcoming()}catch(e){pager.innerHTML=`<div class="error apiError">Unable to load Calendar.<br>${esc(e.message)}</div>`}
  }else if(state.tab==='grades'){
    if(!uid)throw new Error('Schoology did not return the logged-in user ID.');
    const x=await A.api({path:`users/${uid}/grades`,params:{}});const ss=x.section||x.sections||[];
    try{await hydrateUserCourseGrades(ss)}catch{}
    c.innerHTML=`<section class="page"><h1>Grades</h1><div class="sectionListRows">${ss.map((s,i)=>`<button class="sectionListItem" data-user-grade-section="${i}"><span class="sectionLabels"><b>${esc(s.section_title||s.course_title||'Course')}</b><small>${esc(getFinalGradeDisplay(s).value||'')}</small></span><span>›</span></button>`).join('')||'<div class="empty"><h2>No grades</h2></div>'}</div></section>`;
    window.__schoologyUserGradeSections=ss;
    document.querySelectorAll('[data-user-grade-section]').forEach(b=>b.onclick=()=>{const ss=window.__schoologyUserGradeSections[+b.dataset.userGradeSection];showCourse({id:ss.section_id,section_title:ss.section_title||ss.course_title,course_title:ss.course_title},'grades')});
  }else if(state.tab==='messages'){
    await loadMessagesPage(c);
  }else if(state.tab==='requests'){
    try{
      if(!uid)throw new Error('Schoology did not return the logged-in user ID.');
      const [friends,groups,sections]=await Promise.all([
        A.api({path:`users/${uid}/requests/friends`,params:{start:0,limit:200}}),
        A.api({path:`users/${uid}/invites/groups`,params:{start:0,limit:200}}),
        A.api({path:`users/${uid}/invites/sections`,params:{start:0,limit:200}})
      ]);
      const pick=(x,k)=>{const v=x?.[k];if(v==null)return [];return Array.isArray(v)?v:(v?.[k]&&Array.isArray(v[k])?v[k]:[v])};
      const normalize=(items,type)=>items.map(r=>({...r,requestType:type,id:r.id??r.request_id??r.invite_id,title:type==='friend'?(r.requester_name||r.requesterName||r.name||r.display_name||'Friend request'):(r.name||r.title||r.group_name||r.section_title||'Invitation'),subtitle:r.school_name||r.schoolName||r.description||r.message||'',picture_url:r.picture_url||r.pictureUrl||r.image||'',realm_id:r.realm_id||r.realmId||r.section_id||r.sectionId||r.group_id||r.groupId}));
      const arr=[...normalize(pick(friends,'request'), 'friend'),...normalize(pick(groups,'invite'), 'group'),...normalize(pick(sections,'invite'), 'section')];
      window.__schoologyRequests=arr;
      c.innerHTML=`<section class="requestsAndroidPage"><div class="requestsList">${arr.map((r,i)=>`<article class="requestItem"><img src="${esc(normalizeImageUrl(r.picture_url||''))}" onerror="this.style.display='none'" alt=""><div class="requestMain"><button class="requestTitle" data-request-open="${i}">${esc(r.title)}</button><small>${esc(r.subtitle)}</small><div class="requestActions"><button data-request-accept="${i}">Accept</button><button data-request-decline="${i}">Decline</button></div></div></m3e-card>`).join('')||'<div class="empty">You have no requests</div>'}</div></section>`;
      document.querySelectorAll('[data-request-open]').forEach(b=>b.onclick=()=>openRequest(window.__schoologyRequests[+b.dataset.requestOpen]));
      document.querySelectorAll('[data-request-accept]').forEach(b=>b.onclick=()=>handleRequestAction(window.__schoologyRequests[+b.dataset.requestAccept],true));
      document.querySelectorAll('[data-request-decline]').forEach(b=>b.onclick=()=>handleRequestAction(window.__schoologyRequests[+b.dataset.requestDecline],false));
    }catch(e){c.innerHTML=`<div class="error apiError"><b>Schoology could not load requests.</b><br>${esc(e.message)}</div>`}
  }else if(state.tab==='notifications'){
    const x=await A.api({path:'notifications'});
    const raw=x?.notification??x?.notifications??x?.data?.notification??x?.data?.notifications??[];
    const arr=Array.isArray(raw)?raw:(raw?.notification||raw?.notifications||raw?.items||[]);
    const iconFor=n=>{const t=String(n?.type||'').toLowerCase(), args=n?.body_args||n?.bodyArgs||n?.body_arg||[];const last=Array.isArray(args)?args[args.length-1]:null;if(t==='grade_add')return'ic_notifications_grade_add.png';if(t==='badge_award')return'ic_starbadge.png';if(t==='course_materials_add')return'ic_notifications_course_materials_add.png';if(t==='grade_item_submit'){if(last?.type==='assessment')return'ic_notifications_test_quiz.png';if(['assessment_v2','managed_assessment'].includes(last?.type))return'ic_assessment_16dp.svg';return'ic_notifications_grade_item_submit.png'}if(t==='comment_private_add')return'ic_notifications_comment_private_add.png';if(t==='discussion_add')return n?.realm==='schools'?'ic_notifications_discussion_add_school.png':n?.realm==='groups'?'ic_notifications_course_materials_add_group.png':'ic_notifications_unknown.png';if(t==='comment_add')return'ic_notifications_comment_add.png';return'ic_notifications_unknown.png'};
    const bodyFor=n=>{const body=String(n?.body||n?.message||n?.title||'Notification');const args=n?.body_args||n?.bodyArgs||[];const rendered=Array.isArray(args)?args.reduce((out,a)=>out.replace('%s',String(a?.title||a?.name||'')),body):body;return rendered.replace(/<a\b([^>]*?)href=[\"']([^\"']+)[\"']([^>]*)>(.*?)<\/a>/gi,(_,pre,href,post,label)=>`<a class="notificationBodyLink" data-notification-href="${esc(href)}">${esc(label.replace(/<[^>]+>/g,''))}</a>`)};
    window.__schoologyNotifications=arr;
c.innerHTML=`<section class="notificationsAndroidPage"><m3e-action-list variant="segmented" class="notificationList">${arr.map((n,i)=>`<m3e-list-action class="notificationClickable" data-notification-index="${i}"><span slot="leading" class="m3eOriginalIcon"><img src="../assets/icons/${iconFor(n)}" alt=""></span><span>${bodyFor(n)}</span><span slot="supporting-text">${esc(formatSchoologyDate(n.created||n.timestamp||''))}</span><span slot="trailing" class="m3eOriginalIcon">${originalM3Icon('chevron_right')}</span></m3e-list-action>`).join('')||'<m3e-list-action disabled>No notifications</m3e-list-action>'}</m3e-action-list></section>`;
document.querySelectorAll('[data-notification-index]').forEach(b=>b.onclick=()=>openNotification(window.__schoologyNotifications[+b.dataset.notificationIndex]));document.querySelectorAll('[data-notification-href]').forEach(a=>a.onclick=async ev=>{ev.preventDefault();ev.stopPropagation();const href=a.dataset.notificationHref||'';if(!href)return;try{if(await routeSchoologyLink(href))return;const error=await A.openExternal(href);if(error)throw new Error(error)}catch(e){alert('Unable to open notification link: '+e.message)}});
  }else if(state.tab==='resources'){
    await loadResourcesHome(c);
  }else if(state.tab==='people'){
    let arr=[];
    try{
      const x=await A.api({path:'users',params:{start:0,limit:200}});
      const raw=x?.user??x?.users??x?.data?.user??x?.data?.users??[];
      arr=Array.isArray(raw)?raw:(raw?.user||raw?.users||raw?.items||[]);
    }catch(e){
      if(!/403/.test(String(e?.message||e))) throw e;
      const seen=new Map(); const me=state.auth?.user||{}; const meId=Number(state.auth?.userId||me.id||0);
      if(meId)seen.set(String(meId),me);
      const sx=uid?await A.api({path:`users/${uid}/sections`,params:{limit:100}}):{};
      const sections=sx.section||sx.sections||[];
      for(const sec of sections.slice(0,30)){
        const sid=sec.id||sec.section_id||sec.sectionId;if(!sid)continue;
        try{const ex=await A.api({path:`sections/${sid}/enrollments`,params:{enrollment_status:1,limit:200}});const es=ex.enrollment||ex.enrollments||[];for(const en of es){const id=en.uid||en.user_id||en.userId||en.id;if(id&&!seen.has(String(id)))seen.set(String(id),{id,name_first:en.name_first,name_last:en.name_last,name_display:en.name_display,picture_url:en.picture_url,pictureUrl:en.pictureUrl,name_first_preferred:en.name_first_preferred});}}catch{}
      }
      arr=[...seen.values()];
    }
    renderM3ePeopleDirectoryInto(c,arr,{placeholder:'Search school directory',onRefresh:()=>loadTab(),onSelect:person=>{state.profileUser=person;state.tab='profile';state.profileTab='updates';state.toolbarTitle='Profile';render();loadTab()}});
  }else if(state.tab==='settings'){
    if(state.settingsPage==='theme'){
      const t=getThemeSettings();
      c.innerHTML=`<section class="themeSettingsPage"><div class="themeSettingsScroll">
        <m3e-heading variant="label" size="large">Color</m3e-heading><input id="themeColor" type="color" aria-label="Color" value="${esc(t.color)}">
        <m3e-heading variant="label" size="large">Color variant</m3e-heading><m3e-filter-chip-set id="themeVariant" aria-label="Color variant">
          ${['tonal-spot','vibrant','fidelity','expressive','monochrome','neutral','rainbow','fruit-salad'].map(v=>`<m3e-filter-chip value="${v}" ${t.variant===v?'selected':''}>${v.split('-').map(x=>x.charAt(0).toUpperCase()+x.slice(1)).join(' ')}</m3e-filter-chip>`).join('')}
        </m3e-filter-chip-set>
        <m3e-heading variant="label" size="large">Color scheme</m3e-heading><m3e-segmented-button id="themeScheme" aria-label="Color scheme">
          <m3e-button-segment value="light" ${t.scheme==='light'?'checked':''}><m3e-icon slot="icon" name="light_mode"></m3e-icon>Light</m3e-button-segment>
          <m3e-button-segment value="auto" ${t.scheme==='auto'?'checked':''}><m3e-icon slot="icon" name="settings_brightness"></m3e-icon>System</m3e-button-segment>
          <m3e-button-segment value="dark" ${t.scheme==='dark'?'checked':''}><m3e-icon slot="icon" name="dark_mode"></m3e-icon>Dark</m3e-button-segment>
        </m3e-segmented-button>
        <m3e-heading variant="label" size="large">Contrast</m3e-heading><m3e-segmented-button id="themeContrast" aria-label="Contrast">
          <m3e-button-segment value="standard" ${t.contrast==='standard'?'checked':''}>Default</m3e-button-segment><m3e-button-segment value="medium" ${t.contrast==='medium'?'checked':''}>Medium</m3e-button-segment><m3e-button-segment value="high" ${t.contrast==='high'?'checked':''}>High</m3e-button-segment>
        </m3e-segmented-button>
        <m3e-heading variant="label" size="large">Motion</m3e-heading><m3e-segmented-button id="themeMotion" aria-label="Motion">
          <m3e-button-segment value="standard" ${t.motion==='standard'?'checked':''}>Standard</m3e-button-segment><m3e-button-segment value="expressive" ${t.motion==='expressive'?'checked':''}>Expressive</m3e-button-segment>
        </m3e-segmented-button>
      </div></section>`;
      const updateTheme=patch=>{saveThemeSettings(patch);applyThemeToDocument()};
      document.getElementById('themeColor')?.addEventListener('input',e=>updateTheme({color:e.target.value}));
      document.querySelectorAll('#themeVariant m3e-filter-chip').forEach(chip=>chip.addEventListener('change',()=>updateTheme({variant:chip.getAttribute('value')||''})));
      document.querySelectorAll('#themeScheme m3e-button-segment').forEach(seg=>seg.addEventListener('change',()=>seg.checked&&updateTheme({scheme:seg.getAttribute('value')||''})));
      document.querySelectorAll('#themeContrast m3e-button-segment').forEach(seg=>seg.addEventListener('change',()=>seg.checked&&updateTheme({contrast:seg.getAttribute('value')||''})));
      document.querySelectorAll('#themeMotion m3e-button-segment').forEach(seg=>seg.addEventListener('change',()=>seg.checked&&updateTheme({motion:seg.getAttribute('value')||''})));
    }else c.innerHTML=`<section class="settingsPage">
      <div class="settingsSection">
        <h2>Desktop Notifications</h2>
        <m3e-list variant="segmented" class="settingsList">
          <m3e-list-item>Schoology notifications<span slot="supporting-text">Show a desktop notification when new activity arrives</span><m3e-switch slot="trailing" id="desktopNotificationsToggle" ${state.desktopNotifications?'checked':''} aria-label="Schoology notifications"></m3e-switch></m3e-list-item>
          <m3e-list-item>Notification sound<span slot="supporting-text">Play the system notification sound for new activity</span><m3e-switch slot="trailing" id="notificationSoundToggle" ${state.notificationSound?'checked':''} ${state.desktopNotifications?'':'disabled'} aria-label="Notification sound"></m3e-switch></m3e-list-item>
        </m3e-list>
      </div>
      <div class="settingsSection"><h2>Link Handling</h2><m3e-list variant="segmented" class="settingsList">
        <m3e-list-action id="setupChromeLinkHandler">Set up Chrome link handling<span slot="supporting-text">Load the companion extension to open supported Schoology links in this app</span><span class="m3eOriginalIcon" slot="trailing">${originalM3Icon("chevron_right")}</span></m3e-list-action>
      </m3e-list></div>
      <div class="settingsSection"><h2>Account Settings</h2><m3e-list variant="segmented" class="settingsList"><m3e-list-action id="accountInfo">Account Info<span class="m3eOriginalIcon" slot="trailing">${originalM3Icon("chevron_right")}</span></m3e-list-action></m3e-list></div>
      <div class="settingsSection"><h2>Schoology Desktop</h2><m3e-list variant="segmented" class="settingsList">
        <m3e-list-action id="themeSettings">Theme<span slot="supporting-text">Color, light/dark mode, contrast, and motion</span><span class="m3eOriginalIcon" slot="trailing">${originalM3Icon("chevron_right")}</span></m3e-list-action>
        <m3e-list-action id="checkForUpdates">Check for Updates<span slot="supporting-text">Check for a newer Schoology Desktop M3E release</span><span class="m3eOriginalIcon" slot="trailing">${originalM3Icon("chevron_right")}</span></m3e-list-action>
        <m3e-list-action id="trySchoologyClassic">Try Schoology Classic<span slot="supporting-text">Download the latest original Schoology Desktop release</span><span class="m3eOriginalIcon" slot="trailing">${originalM3Icon("chevron_right")}</span></m3e-list-action>
        <m3e-list-action id="tryLiquidGlass">Try Schoology Liquid Glass<span slot="supporting-text">Download the latest Schoology Liquid Glass release</span><span class="m3eOriginalIcon" slot="trailing">${originalM3Icon("chevron_right")}</span></m3e-list-action>
        <m3e-list-item>Window Controls Overlay<span slot="supporting-text">Place native window controls over the Schoology app bar (restart required)</span><m3e-switch slot="trailing" id="windowChromeOverlayToggle" ${state.windowChromeOverlay?'checked':''} aria-label="Window Controls Overlay"></m3e-switch></m3e-list-item>
      </m3e-list></div>
      <div class="settingsVersion">Version: ${esc(state.appVersion||'2026.10.0-port.5')}</div></section>`;
    document.getElementById('setupChromeLinkHandler')?.addEventListener('click',async()=>{try{state.openSchoologyLinks=await A.setOpenSchoologyLinks?.(true)!==false;const error=await A.openChromeExtensionFolder?.();if(error)throw new Error(error);showAppDialog('Chrome link handler','In Chrome, open chrome://extensions, enable Developer mode, choose Load unpacked, and select the chrome-link-handler folder that was opened. Supported Schoology links will now open in this app.')}catch(err){showAppDialog('Unable to open Chrome link handler folder',err.message||String(err))}});
    document.getElementById('desktopNotificationsToggle')?.addEventListener('change',async e=>{const next=!!e.target.checked;try{state.desktopNotifications=await A.setDesktopNotifications?.(next)!==false;const sound=document.getElementById('notificationSoundToggle');if(sound)sound.disabled=!state.desktopNotifications}catch(err){e.target.checked=state.desktopNotifications;showAppDialog('Unable to update notifications',err.message||String(err))}});
    document.getElementById('notificationSoundToggle')?.addEventListener('change',async e=>{const next=!!e.target.checked;try{state.notificationSound=await A.setNotificationSound?.(next)===true}catch(err){e.target.checked=state.notificationSound;showAppDialog('Unable to update notification sound',err.message||String(err))}});
    document.getElementById('themeSettings')?.addEventListener('click',()=>showThemeSettingsDialog());
    document.getElementById('accountInfo')?.addEventListener('click',async()=>{try{await A.prepareWebSession();state.embeddedReturn={tab:'settings',title:'Settings'};showEmbeddedWeb('https://app.schoology.com/settings/account','Account Info',{allowBrowser:false,accountInfo:true})}catch(e){showAppDialog('Unable to open Account Info',e.message||String(e))}});
    document.getElementById('checkForUpdates')?.addEventListener('click',async()=>{const b=document.getElementById('checkForUpdates');if(b)b.disabled=true;try{const u=await A.checkForUpdates(true);if(u?.available)showUpdateDialog(u);else showAppDialog('Up to date','You are using the latest available Schoology Desktop M3E release.')}catch(e){showAppDialog('Unable to check for updates',e.message||String(e))}finally{if(b)b.disabled=false}});
    async function downloadAlternateRelease(buttonId,methodName,title,progressId,errorTitle){const b=document.getElementById(buttonId),getRelease=A[String(methodName||'')];if(typeof getRelease!=='function'){showAppDialog(errorTitle,'This release download is not available in the current app build. Please update Schoology and try again.');return}if(b)b.disabled=true;try{const u=await getRelease.call(A);const dlg=showAppDialog(title,`Downloading ${u.version?`v${esc(u.version)}`:'the latest release'}…`,[{label:'Cancel',action:()=>A.cancelUpdateDownload?.()}]);const msg=dlg?.querySelector('.appDialogMessage');if(msg)msg.innerHTML=`<div class="updateDownloadProgressWrap"><m3e-linear-progress-indicator id="${progressId}Bar" mode="determinate" value="0" max="100"></m3e-linear-progress-indicator><div id="${progressId}Text" class="updateDownloadProgressText">Downloading…</div></div>`;const off=A.onUpdateDownloadProgress?.(d=>{const bar=document.getElementById(`${progressId}Bar`),txt=document.getElementById(`${progressId}Text`);if(bar&&d?.percent!=null)bar.value=Math.max(0,Math.min(100,Number(d.percent)||0));if(txt)txt.textContent=d?.percent!=null?`Downloading… ${d.percent}%`:'Downloading…'});try{await A.installUpdate(u);off?.()}catch(e){off?.();if(dlg)dlg.open=false;showAppDialog(errorTitle,e.message||String(e))}}catch(e){showAppDialog(errorTitle,e.message||String(e))}finally{if(b)b.disabled=false}}
    document.getElementById('trySchoologyClassic')?.addEventListener('click',()=>downloadAlternateRelease('trySchoologyClassic','downloadClassic','Downloading Schoology Classic','classicDownloadProgress','Unable to download Schoology Classic'));
    document.getElementById('tryLiquidGlass')?.addEventListener('click',()=>downloadAlternateRelease('tryLiquidGlass','downloadLiquidGlass','Downloading Schoology Liquid Glass','liquidGlassDownloadProgress','Unable to download Schoology Liquid Glass'));
    document.getElementById('windowChromeOverlayToggle')?.addEventListener('change',async e=>{const checked=!!e.target.checked;try{await A.setWindowChromeMode(checked)}catch(err){e.target.checked=!checked;showAppDialog('Unable to change window controls',err.message||String(err))}});
  }
 }catch(e){if(generation!==loadTabGeneration||tabAtStart!==state.tab)return;c.innerHTML=`<div class="error apiError"><b>Schoology could not load this page.</b><br>${esc(e.message)}</div>`}
}

async function renderUpcomingInto(c){
 const uid=state.auth?.userId||state.auth?.user?.id;if(!uid)throw new Error('Schoology did not return the logged-in user ID.');
 const x=await A.api({path:`users/${uid}/events`,params:{start_date:formatApiDate(new Date()),start:0,limit:50}});
 const arr=(x.event||x.events||[]).filter(e=>['assignment','assessment','assessment_v2','managed_assessment','discussion','external_tool','event'].includes(String(e.type||'')));
 const sorted=arr.slice().sort((a,b)=>String(a.start||'').localeCompare(String(b.start||'')));
 const body=c.querySelector('.homeUpcomingList')||c;
 body.innerHTML=renderUpcoming(sorted);
 document.querySelectorAll('[data-course-upcoming-id]').forEach(b=>b.onclick=async()=>{const e=sorted.find(v=>String(v.id||'')===String(b.dataset.courseUpcomingId));if(!e)return;const type=String(e.type||'').toLowerCase();const aid=e.assignment_id??e.assignmentId??e.assignment?.id;const sid=e.section_id??e.sectionId;if(type==='assignment'&&sid&&aid){state.homeUpcomingReturn=true;openWithPressTransition(b,()=>showAssignment(sid,aid));return}if(['assessment','assessment_v2','managed_assessment','quiz'].includes(type)){const id=aid??e.id;if(id){openWithPressTransition(b,async()=>{state.embeddedReturn={tab:'home',homeTab:state.homeTab,title:'Home'};await A.prepareWebSession();showEmbeddedWeb(`https://app.schoology.com/assignment/${id}`,e.title||'Quiz',{allowBrowser:false,quiz:true,assessment:true})});return}}if(type==='discussion'){const did=upcomingDiscussionId(e),realm=String(e.realm||e.realm_name||e.realmName||'').toLowerCase(),realmId=e.realm_id??e.realmId,sectionId=e.section_id??e.sectionId??(['section','sections'].includes(realm)?realmId:null),groupId=e.group_id??e.groupId??(['group','groups'].includes(realm)?realmId:null);if(did&&sectionId){openWithPressTransition(b,()=>showDiscussionNative('sections',sectionId,did,e.title||'Discussion'));return}if(did&&groupId){openWithPressTransition(b,()=>showDiscussionNative('groups',groupId,did,e.title||'Discussion'));return}if(e.web_url||e.webUrl){openWithPressTransition(b,()=>showEmbeddedWeb(e.web_url||e.webUrl,e.title||'Discussion'));return}}if(type==='event'&&e.id){showEventNative(e.section_id?'sections':'users',e.section_id||state.auth?.userId,e.event_id??e.eventId??e.id,e.title||'Event');return}if(e.web_url||e.webUrl)openWithPressTransition(b,()=>showEmbeddedWeb(e.web_url||e.webUrl,e.title||'Upcoming'));});
}
async function loadHomeUpcomingPane(){const c=document.getElementById('homeUpcomingPane');if(!c)return;c.innerHTML='<div class="homeUpcomingHeader">Upcoming</div><div class="homeUpcomingScroll"><div class="homeUpcomingList"><div class="loading"><m3e-circular-progress-indicator indeterminate class="m3eInlineProgress" aria-label="Loading"></m3e-circular-progress-indicator><span>Loading…</span></div></div></div>';await renderUpcomingInto(c)}
async function loadHomeTab(){
 const c=document.getElementById('homeTabContent');if(!c)return;
 c.classList.remove('dashboardContentActive','embeddedContentActive','recentActivityScroll');
 c.style.position='';c.style.left='';c.style.right='';c.style.top='';c.style.bottom='';c.style.height='';c.style.minHeight='';c.style.maxHeight='';c.style.overflow='';c.style.padding='';c.style.margin='';c.style.flex='';
 animateTab(c,state.homeTabDirection||'forward');
 c.innerHTML='<div class="loading"><m3e-circular-progress-indicator indeterminate class="m3eInlineProgress" aria-label="Loading"></m3e-circular-progress-indicator><span>Loading…</span></div>';
 try{
  if(state.homeTab==='recent'){
    const recent=await A.api({path:'recent',params:{start:0,limit:20,with_attachments:'TRUE',richtext:1}});
    const updates=recent?.update||recent?.updates||recent?.update_list||[];
    const userIds=[...new Set(updates.map(x=>x.user_id||x.uid||x.author_id||x.authorId).filter(Boolean).map(Number))];
    const userMap={};await Promise.all(userIds.slice(0,20).map(async id=>{try{const u=await A.api({path:`users/${id}`,params:{}});userMap[id]=u?.user||u}catch{}}));
    const groupIds=[...new Set(updates.filter(x=>['group','groups'].includes(String(x.realm||x.realm_name||x.realmName||'').toLowerCase())).map(x=>Number(x.group_id||x.groupId||x.realm_id||x.realmId)).filter(id=>Number.isSafeInteger(id)&&id>0))];const groupMap={};await Promise.all(groupIds.slice(0,10).map(async id=>{try{const x=await A.api({path:`groups/${id}`,params:{}});groupMap[id]=x?.group||x}catch{}}));
    state.activityUsers=userMap;state.__activityById=Object.fromEntries(updates.map(u=>[String(u.id),u]));state.__activityGroups=groupMap;
    c.classList.add('recentActivityScroll');
    c.innerHTML=updates.length?updates.map(post=>{
      const userId=post.user_id||post.uid||post.author_id||post.authorId,user=userMap[userId]||{};
      const name=post.display_name||post.author_name||user.name_display||user.display_name||user.name||post.user_name||'Schoology';
      const avatar=normalizeImageUrl(user.picture_url||user.pictureUrl||user.picture||user.photo_url||post.user_photo||post.photo_url||'');
      const rawRealm=String(post.realm||post.realm_name||post.realmName||'user').toLowerCase();
      const realm=({user:'users',users:'users',section:'sections',sections:'sections',group:'groups',groups:'groups',school:'schools',schools:'schools'})[rawRealm]||rawRealm;
      const groupId=Number(post.group_id||post.groupId||post.realm_id||post.realmId||0),group=groupMap[groupId]||{};
      const groupName=post.group_name||post.groupName||post.realm_title||post.realmTitle||group.name||group.title||'';
      const realmId=(rawRealm==='user'||rawRealm==='users')?(post.user_id||post.uid||state.auth?.userId||state.auth?.user?.id):(rawRealm==='section'||rawRealm==='sections')?(post.section_id||post.sectionId||post.realm_id||post.realmId):(rawRealm==='group'||rawRealm==='groups')?(post.group_id||post.groupId||post.realm_id||post.realmId):(rawRealm==='school'||rawRealm==='schools')?(post.school_id||post.schoolId||post.realm_id||post.realmId):(post.realm_id||post.realmId);
      return renderSharedPostCard({post:post,id:sharedPostId(post),realm:realm,realmId:realmId,author:name,avatar:avatar,authorId:user.user_id||user.uid||user.id||userId||'',contextLabel:(['group','groups'].includes(rawRealm)&&groupId&&groupName)?groupName:'',contextId:groupId,cardClass:'recentActivityPost'});
    }).join(''):'<div class="empty"><h2>No recent activity</h2><p>Your recent Schoology activity will appear here.</p></div>';
    await hydrateMediaImages(c);
    wireSharedPostList(c,'users',state.auth?.userId||state.auth?.user?.id,updates,{authorUsers:userMap});
  }else if(state.homeTab==='dashboard'){
    // Android 2026.10.0 uses a HybridView for this tab. The desktop port uses a
    // native equivalent so Chromium/WebView sizing cannot leave a blank bottom area.
    const uid=state.auth?.userId||state.auth?.user?.id;
    c.classList.remove('embeddedContentActive');c.classList.add('dashboardContentActive');
    c.innerHTML=`<section class="nativeCourseDashboard"><div class="dashboardOfficialLoading" id="dashboardOfficialLoading"><img src="../assets/sgy_loading.gif" alt=""></div><div id="nativeDashboardCourses" class="nativeDashboardCourses"></div></section>`;
    const loader=document.getElementById('dashboardOfficialLoading'),list=document.getElementById('nativeDashboardCourses');
    try{
      const x=uid?await A.api({path:`users/${uid}/sections`,params:{limit:100}}):{};
      const arr=x.section||x.sections||[];window.__schoologyDashboardCourses=arr;
      if(!arr.length){list.innerHTML='<div class="androidEmptyState">No courses found.</div>'}
      else{
        const schoolNames=await Promise.all(arr.map(resolveCourseSchoolName));
        list.innerHTML=arr.map((course,i)=>{
          const title=courseTitleOf(course),section=sectionTitleOf(course),school=schoolNames[i]||'';
          const image=normalizeImageUrl(course.profile_url||course.profileUrl||course.course_profile_url||course.courseProfileUrl||course.course_theme||course.courseTheme||course.image||course.course_image||'');
          return `<m3e-card actionable variant="filled" class="nativeDashboardCourse" data-dashboard-course="${i}">${image?`<img slot="header" data-course-image-url="${esc(image)}" alt="" style="display:none;width:100%;height:130px;object-fit:cover;">`:`<div slot="header" class="nativeDashboardCourseImage dashboardCourseFallback">${esc(title.charAt(0)||'C')}</div>`}<div slot="content" class="nativeDashboardCourseInfo"><b>${esc(title)}</b>${section?`<span class="nativeDashboardCoursePeriod">${esc(section)}</span>`:''}${school?`<small>${esc(school)}</small>`:''}</div></m3e-card>`;
        }).join('');
        await hydrateCourseImages(list);
        list.querySelectorAll('[data-dashboard-course]').forEach(b=>b.onclick=()=>showCourse(arr[+b.dataset.dashboardCourse],'materials'));
      }
    }catch(e){list.innerHTML=`<div class="error apiError"><b>Schoology could not load the course dashboard.</b><br>${esc(e.message)}</div>`}
    finally{loader?.classList.add('hidden')}
  }else{
    c.classList.remove('recentActivityScroll');c.classList.add('homePortraitUpcomingScroll');
    c.innerHTML='<div id="homeUpcomingList" class="homeUpcomingPortraitList"></div>';
    await renderUpcomingInto(document.getElementById('homeUpcomingList'));
  }
 }catch(e){c.innerHTML=`<div class="error apiError"><b>Schoology could not load this page.</b><br>${esc(e.message)}</div>`}
}

function stopQR(){if(qrStream){qrStream.getTracks().forEach(t=>t.stop());qrStream=null}qrBusy=false}
let nativeQrDetector=null;
function getNativeQrDetector(){
  if(nativeQrDetector!==null)return nativeQrDetector;
  try{
    nativeQrDetector=(typeof BarcodeDetector!=='undefined' && BarcodeDetector.getSupportedFormats)
      ? new BarcodeDetector({formats:['qr_code']}) : false;
  }catch(e){nativeQrDetector=false}
  return nativeQrDetector;
}
async function decodeFrame(ctx,w,h){
  // Prefer Chromium's native QR/barcode decoder. This avoids depending on the
  // optional jsQR native-module bridge for the normal camera-login path.
  const detector=getNativeQrDetector();
  const side=Math.min(w,h);
  const sx=Math.max(0,Math.floor((w-side)/2)),sy=Math.max(0,Math.floor((h-side)/2));
  const size=Math.min(side,1000);
  const work=document.createElement('canvas');work.width=size;work.height=size;
  const wc=work.getContext('2d',{willReadFrequently:true});
  wc.drawImage(ctx.canvas,sx,sy,side,side,0,0,size,size);
  if(detector){
    try{const found=await detector.detect(work);if(found?.length&&found[0]?.rawValue)return found[0].rawValue}catch(e){}
    try{const found=await detector.detect(ctx.canvas);if(found?.length&&found[0]?.rawValue)return found[0].rawValue}catch(e){}
  }
  // Compatibility fallback for Electron builds without BarcodeDetector.
  const attempts=[wc.getImageData(0,0,size,size),ctx.getImageData(0,0,w,h)];
  for(const img of attempts){
    try{const code=A.decodeQR(img.data,img.width,img.height);if(code?.data)return code.data}catch(e){}
  }
  return null;
}
async function startQR(){
  const v=document.getElementById('video'),canvas=document.getElementById('canvas');if(!v||!canvas)return;
  try{
    if(!navigator.mediaDevices?.getUserMedia)throw new Error('Camera API unavailable');
    qrStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}},audio:false});
    v.srcObject=qrStream;await v.play().catch(()=>{});
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    const tick=async(now)=>{
      if(state.screen!=='qr'||!qrStream)return;
      if(!qrBusy&&v.readyState>=2&&v.videoWidth&&(!qrLastAttempt||now-qrLastAttempt>120)){
        qrLastAttempt=now;
        canvas.width=v.videoWidth;canvas.height=v.videoHeight;ctx.drawImage(v,0,0,canvas.width,canvas.height);
        const data=await decodeFrame(ctx,canvas.width,canvas.height);
        if(data){
          qrBusy=true;stopQR();
          try{state.auth=await A.loginQR(data);await afterLogin()}catch(e){state.error=e.message||'Sorry, your code isn’t working. Please try again.';state.screen='qr';render();startQR();return}
        }
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }catch(e){stopQR();state.error='Unable to access the camera. Enable camera access for Schoology and try again.';render()}
}

installCourseLayoutWatcher();

// Restore the persisted Android-style OAuth session on application launch.
function showStartupOfflineError(){
  const splash=document.getElementById('startupSplash');
  if(!splash)return;
  splash.innerHTML=`<img class="androidSplashLogo" src="${themeLogoSrc()}" alt="Schoology"><div class="startupOfflineError"><b>Unable to connect to Schoology</b><span>Check your internet connection and try again.</span><button id="startupRetry">Retry</button></div>`;
  splash.querySelector('#startupRetry')?.addEventListener('click',()=>startSchoologyStartup(true));
}
async function startSchoologyStartup(retry=false){
  try{
    const online=await A.networkOnline?.();
    if(online===false){showStartupOfflineError();return;}
    const saved=await A.authState();
    if(saved?.oauth_token&&saved?.oauth_token_secret){
      state.auth=saved;
      await afterLogin();
      requestAnimationFrame(()=>requestAnimationFrame(()=>window.schoologyAppReady?.()));
      return;
    }
    render();
    requestAnimationFrame(()=>requestAnimationFrame(()=>window.schoologyAppReady?.()));
  }catch(e){
    console.warn('Schoology startup failed:',e);
    if(retry||e?.message){showStartupOfflineError();return;}
    render();requestAnimationFrame(()=>requestAnimationFrame(()=>window.schoologyAppReady?.()));
  }
}
startSchoologyStartup();
setTimeout(maybeShowReleaseNotes,1800);
A.onDeepLink?.(url=>{void handleIncomingSchoologyDeepLink(url)});

A.onUpdateAvailable?.(u=>{if(!u?.url)return;setTimeout(()=>showUpdateDialog(u),700)});
