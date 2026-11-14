# 原型摘录（改实现前读取）

本地 MauGo.html 内嵌 features.js / CSS；未执行演示写入逻辑。

```text
 function open(name,params={},replace=false){if(name!==route.name&&guardMomentLeave(()=>open(name,params,replace)))return;if(!replace&&view.hidden===false)history.push(route);route={name,...params};if(name==='public-profile')recordVisit(chatFor(params.id)??params.person,params.sourceNote);C.hideHome();screen.classList.add('page-open');screen.classList.toggle('subpage',!['inbox','profile'].includes(name));view.hidden=false;if(['inbox','profile','chat'].includes(name))activateNav(name==='profile'?'profile':'inbox');render();view.scrollTop=0;}

 function back(){if(guardMomentLeave(back))return;closeSheet();if(route.name==='public-profile'&&route.sourceNote&&!history.length){const note=route.sourceNote;home();C.openNote(note);return;}if(history.length){route=history.pop();open(route.name,route,true);}else home();}

 function page(title,body,action=''){attachmentHandler=null;closeInboxMenu();screen.classList.remove('wallpaper-chat');screen.style.removeProperty('--chat-wallpaper');view.classList.remove('chat-page','inbox-page','profile-reference','settings-reference','feedback-reference','help-reference','public-profile-reference');view.innerHTML=`<header class="page-header"><button id="page-back" class="page-back" aria-label="Back">${icon('back')}</button><h1>${T(title)}</h1>${action||'<span class="header-space"></span>'}</header><div class="page-body">${body}</div>`;$('#page-back').onclick=back;window.MauGoI18n?.translate(view);refreshOwnAvatar();}

 function returnToChat(c){const index=history.map(r=>r.name==='chat'&&r.id===c.id).lastIndexOf(true);history=index>=0?history.slice(0,index):history;open('chat',{id:c.id},true);}

 function background(){const c=chatFor(route.id),colors=route.tab==='colors';page('Chat background',`<div class="page-tabs"><button id="wallpaper-tab" class="${!colors?'selected':''}">${T('Wallpapers')}</button><button id="color-tab" class="${colors?'selected':''}">${T('Colors')}</button></div>${colors?`<div class="theme-grid">${themes.map(theme=>`<button class="theme-card theme-${theme}" data-theme="${theme}" aria-pressed="${!c.wallpaperId&&(c.background??'night')===theme}"><span>${T(theme[0].toUpperCase()+theme.slice(1))}</span><i>${!c.wallpaperId&&(c.background??'night')===theme?'✓':''}</i></button>`).join('')}</div><button class="primary full-width" id="background-done">${T('Done')}</button>`:`<div class="wallpaper-grid"><button class="wallpaper-tile wallpaper-default" id="wallpaper-default" aria-pressed="${!c.wallpaperId&&(c.background??'night')==='night'}"><span class="wallpaper-name">${T('Default')}</span><b>${!c.wallpaperId&&(c.background??'night')==='night'?'✓':''}</b></button>${wallpapers.map(w=>`<button class="wallpaper-tile" data-wallpaper="${w.id}" aria-label="${T(w.name)}" aria-pressed="${c.wallpaperId===w.id}"><img src="${asset(w.path)}" alt="${T(w.name)}" loading="lazy"><span class="wallpaper-name">${T(w.name)}</span><b>${c.wallpaperId===w.id?'✓':''}</b></button>`).join('')}</div><p class="local-note">${T('Tap a wallpaper to preview it. Saved for this conversation.')}</p>`}`);$('#wallpaper-tab').onclick=()=>open('background',{id:c.id,tab:'wallpapers'},true);$('#color-tab').onclick=()=>open('background',{id:c.id,tab:'colors'},true);if(colors){view.querySelectorAll('[data-theme]').forEach(b=>b.onclick=()=>{c.background=b.dataset.theme;delete c.wallpaperId;persist();render();});$('#background-done').onclick=()=>returnToChat(c);}else{$('#wallpaper-default').onclick=()=>{delete c.wallpaperId;c.background='night';persist();returnToChat(c);};view.querySelectorAll('[data-wallpaper]').forEach(b=>b.onclick=()=>open('wallpaper-preview',{id:c.id,wallpaperId:b.dataset.wallpaper}));}}

 function wallpaperPreview(){const c=chatFor(route.id),w=wallpapers.find(w=>w.id===route.wallpaperId);if(!w){back();return;}page('Preview wallpaper',`<figure class="wallpaper-preview"><img src="${asset(w.path)}" alt="${T(w.name)}"><div class="preview-conversation"><span>${T('A little hello for you.')}</span><span>${T('Lovely to meet you!')}</span></div><figcaption>${T(w.name)}</figcaption></figure><div class="wallpaper-apply"><button class="primary full-width" id="apply-wallpaper">${T('Use this wallpaper')}</button></div>`);$('#apply-wallpaper').onclick=()=>{c.wallpaperId=w.id;persist();returnToChat(c);};}

 function bubbles(){const c=chatFor(route.id);page('Chat bubbles',`<div class="bubble-preview"><div id="their-bubble">${T('A little hello for you.')}</div><div id="my-bubble">${T('Lovely to meet you!')}</div></div><div class="menu-group">${[['myBubble','My bubble','#aef879'],['myText','My text','#153011'],['theirBubble','Their bubble','#28362e'],['theirText','Their text','#e1e9dd']].map(([key,label,value])=>`<label class="preference-row"><span>${T(label)}</span><input type="color" id="color-${key}" value="${c[key]||value}"></label>`).join('')}</div><button class="outline-button full-width" id="reset-bubbles">${T('Reset to default')}</button>`);const draw=()=>{for(const [id,bg,fg]of [['my-bubble','myBubble','myText'],['their-bubble','theirBubble','theirText']]){$('#'+id).style.background=c[bg]??'';$('#'+id).style.color=c[fg]??'';}};draw();for(const key of ['myBubble','myText','theirBubble','theirText'])$('#color-'+key).oninput=e=>{c[key]=e.target.value;persist();draw();};$('#reset-bubbles').onclick=()=>{for(const k of ['myBubble','myText','theirBubble','theirText'])delete c[k];persist();render();};}

.actions button:active{transform:scale(.96)}

.tool-button:active{color:var(--lime)}

.hold-button:active{background:#314332}

.page-body{height:calc(100% - 64px);overflow:auto;scrollbar-width:none;padding:24px;overscroll-behavior:contain}

.page-body p{line-height:21px}

.page-body .primary{min-height:48px;font-size:14px;border-radius:24px}

.chat-page .page-body{display:flex;flex-direction:column;padding:0;overflow:hidden}

.theme-card{height:180px;border-radius:16px;position:relative;display:flex;align-items:flex-end;justify-content:space-between;padding:16px;color:#d8e7d1;border:1px solid #ffffff16;font-size:12px}

.theme-card[aria-pressed=true]{border-color:#b5fa70}

.theme-card i{font-style:normal;color:#b5fa70}

.bubble-preview{display:flex;flex-direction:column;gap:16px;margin-bottom:24px;padding:20px;background:#0c1a12;border-radius:16px}

.bubble-preview div{font-size:12px;padding:12px;border-radius:12px;background:#28362e;max-width:85%;line-height:20px}

.bubble-preview #my-bubble{align-self:flex-end;background:#aef879;color:#153011}

.subpage .page-body{height:calc(100% - 64px)}


.wallpaper-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}

.wallpaper-tile{position:relative;aspect-ratio:375/650;border-radius:14px;overflow:hidden;border:1px solid #ffffff0c;background:#0e2016;padding:0}

.wallpaper-tile>img{width:100%;height:100%;object-fit:cover}

.wallpaper-tile[aria-pressed=true]{border:2px solid #b5fa70}

.wallpaper-name{position:absolute;left:0;right:0;bottom:0;padding:20px 6px 10px;color:#eef6e9;background:linear-gradient(transparent,#030905c9);font-size:9px;line-height:14px;text-align:center}

.wallpaper-tile>b{position:absolute;top:8px;right:8px;font-size:14px;color:#b5fa70;text-shadow:0 2px 5px #000}

.wallpaper-default{background:radial-gradient(ellipse,#253c28,#0d1713)}

.wallpaper-default:before{content:'☾';font-size:32px;color:#b5fa7055}

.wallpaper-preview{position:relative;height:488px;margin:0;border:1px solid #ffffff18;border-radius:20px;overflow:hidden;background:#102017}

.wallpaper-preview>img{width:100%;height:100%;object-fit:cover}

.preview-conversation{position:absolute;inset:24px 16px;display:flex;flex-direction:column;gap:20px}

.preview-conversation span{max-width:86%;background:#1d2c24ed;color:#e5ecde;padding:12px 16px;font-size:12px;line-height:20px;border-radius:14px 14px 14px 4px}

.preview-conversation span+span{align-self:flex-end;background:#b5fa70;color:#18310e;border-radius:14px 14px 4px 14px}

.wallpaper-preview figcaption{position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,#030807bb);color:#ebf3e4;padding:40px 16px 20px;text-align:center;font-size:13px}

.wallpaper-apply{position:sticky;bottom:-24px;padding:8px 0 20px;background:linear-gradient(transparent,#0d1713 20%)}

.wallpaper-apply .primary{margin-top:8px}

.screen.subpage.wallpaper-chat{background-image:linear-gradient(#07100b26,#07100b26),var(--chat-wallpaper);background-size:cover;background-position:center}

.wallpaper-chat .app-view.chat-page{background:transparent}

.wallpaper-chat .page-header{background:#07100b96;backdrop-filter:blur(10px)}

.wallpaper-chat .chat-notice{background:#07100b75;color:#c0d1b7}

.wallpaper-chat .chat-thread.with-wallpaper{background:transparent!important}

.wallpaper-chat .chat-composer{background:#07100bba;backdrop-filter:blur(12px)}

.wallpaper-chat .chat-message small{color:#c2d1b9;text-shadow:0 1px 3px #000}

.wallpaper-chat .home-indicator{background:#d4decc88}

.wallpaper-chat .waiting-card{background:#07100bd6;backdrop-filter:blur(12px)}

.inbox-page>.page-body{display:flex;flex-direction:column;padding-top:12px;gap:0}

.public-profile-reference>.page-body{display:block;overflow:auto;padding:4px 24px 120px}
```
