# Local prototype source excerpts (read before implementation)

```text
features.js
 function back(){if(guardMomentLeave(back))return;closeSheet();if(route.name==='public-profile'&&route.sourceNote&&!history.length){const note=route.sourceNote;home();C.openNote(note);return;}if(history.length){route=history.pop();open(route.name,route,true);}else home();}

features.js
 function confirm(title,message,action,label='Confirm',danger=false){const close=showPaymentDialog(`<h2 id="payment-title">${T(title)}</h2><p>${T(message)}</p><button id="action-confirm" class="primary ${danger?'danger':''}">${T(label)}</button><button id="action-cancel" class="text-button">${T('Cancel')}</button>`);$('#action-cancel').onclick=close;$('#action-confirm').onclick=()=>{close();action();};}

features.js
 async function drawMessages(c){const el=$('#chat-thread');if(!el)return;el.replaceChildren();for(const m of c.messages){const wrap=document.createElement('div');wrap.className=`chat-message ${m.mine?'mine':''}`;wrap.dataset.messageId=m.id;if(!m.mine){const avatarButton=document.createElement('button');avatarButton.className='chat-avatar-button';avatarButton.setAttribute('aria-label',T('View profile'));const img=document.createElement('img');img.className='chat-message-avatar';img.src=avatar(c);img.alt=c.name;avatarButton.append(img);avatarButton.onclick=()=>open('public-profile',{id:c.id});wrap.append(avatarButton);}const bubble=document.createElement('div');bubble.className='chat-bubble';bubble.style.background=m.mine?c.myBubble??'':c.theirBubble??'';bubble.style.color=m.mine?c.myText??'':c.theirText??'';const text=document.createElement('span');text.textContent=m.text;text.dataset.userContent='true';bubble.append(text);wrap.append(bubble);const date=document.createElement('small');date.textContent=(m.preview?T('Preview reply')+' · ':'')+time(m.time);wrap.append(date);el.append(wrap);await renderMedia(bubble,m.media??[]);}if(!el.isConnected)return;const target=route.messageId&&[...el.children].find(n=>n.dataset.messageId===route.messageId);if(target){target.classList.add('message-highlight');target.scrollIntoView({block:'center'});}else el.scrollTop=el.scrollHeight;}

features.js
 function chatDetails(){const c=chatFor(route.id);page('Chat details',`<div class="person-card"><img src="${avatar(c)}" ${c.sentLetter&&c.status==='waiting'?'data-sent-envelope':''} alt=""><h2 data-user-content>${escape(c.remark||c.name)}</h2><p>${c.sentLetter&&c.status==='waiting'?T('Recipient details appear after a reply.'):`${T(c.gender==='male'?'Man':'Woman')} · ${c.age} · ${escape(c.city)}`}</p><button class="outline-button" id="follow-person">${T(state.following.includes(c.id)?'Following':'Follow')}</button>${c.status==='waiting'?`<p class="opening-notice">${T('Following unlocks after they reply.')}</p>`:''}</div><div class="menu-group">${row('Remark name','remark-name',c.remark||'')}${toggle('Pin conversation','pin-chat',c.pinned)}${row('Chat background','chat-background')}${row('Chat bubbles','chat-bubbles')}${row('Search messages','chat-search')}</div><div class="menu-group">${toggle('Mute notifications','mute-chat',c.muted)}${row(c.blocked?'Unblock':'Block','block-chat')}${row('Report','report-person')}${row('Clear messages','clear-chat','','destructive')}</div>`);

features.js
 if(!(c.sentLetter&&c.status==='waiting')){const photo=view.querySelector('.person-card>img');const button=document.createElement('button');button.className='details-profile-photo';button.setAttribute('aria-label',T('View profile'));photo.replaceWith(button);button.append(photo);button.onclick=()=>open('public-profile',{id:c.id});}for(const id of ['remark-name','pin-chat','chat-background','chat-bubbles','chat-search','mute-chat'])$('#'+id).disabled=!rules.canContinue(c);$('#follow-person').disabled=!rules.canContinue(c);for(const id of ['block-chat','report-person'])$('#'+id).disabled=!!c.sentLetter&&c.status==='waiting';$('#follow-person').onclick=()=>{if(!rules.canContinue(c))return;state.following=state.following.includes(c.id)?state.following.filter(id=>id!==c.id):[...state.following,c.id];persist();render();};$('#pin-chat').onchange=e=>{c.pinned=e.target.checked;persist();};$('#mute-chat').onchange=e=>{c.muted=e.target.checked;persist();};$('#remark-name').onclick=()=>{showSheet('Remark name',`<label class="field-label">${T('Only visible to you')}<input id="remark-input" maxlength="24" value="${escape(c.remark??'')}" aria-label="Remark name"></label><button class="primary" id="save-remark">${T('Save')}</button>`);$('#save-remark').onclick=()=>{c.remark=$('#remark-input').value.trim();persist();closeSheet();render();};};$('#chat-background').onclick=()=>open('background',{id:c.id});$('#chat-bubbles').onclick=()=>open('bubbles',{id:c.id});$('#chat-search').onclick=()=>open('chat-search',{id:c.id});$('#report-person').onclick=()=>C.showSafetyMenu(()=>open('report',{id:c.id}),()=>confirm(c.blocked?'Unblock this person?':'Block this person?',c.blocked?'You can continue this conversation.':'Their letters and conversations will be hidden. You can unblock them in Privacy settings.',()=>{changeBlock(c,!c.blocked);open('inbox',{},true);},c.blocked?'Unblock':'Block'),c.blocked);$('#block-chat').onclick=()=>confirm(c.blocked?'Unblock this person?':'Block this person?',c.blocked?'You can continue this conversation.':'This person will be removed from your conversation list.',()=>{changeBlock(c,!c.blocked);open('inbox',{},true);},c.blocked?'Unblock':'Block');$('#clear-chat').onclick=()=>confirm('Clear messages?','This removes messages from this conversation on this device.',()=>{c.messages=[];c.clearedAt=Date.now();persist();render();},'Clear messages',true);

features.js
 function chatSearch(){const c=chatFor(route.id);page('Search messages',`<input class="search-field" id="message-search" placeholder="${T('Search in this conversation')}" aria-label="Search messages"><div id="message-results"></div>`);$('#message-search').oninput=()=>{const q=$('#message-search').value.trim().toLowerCase(),matches=c.messages.filter(m=>(m.text??'').toLowerCase().includes(q));$('#message-results').innerHTML=q?matches.map((m,i)=>`<button class="search-result search-result-button" data-result="${i}"><small>${time(m.time)}</small><p data-user-content>${escape(m.text)}</p></button>`).join('')||empty('No messages found.'):' ';view.querySelectorAll('[data-result]').forEach(b=>b.onclick=()=>open('chat',{id:c.id,messageId:matches[Number(b.dataset.result)].id}));};}

app.js
function showSheet(title,html,type='general'){pauseMedia();closeEmoji();previousFocus=document.activeElement;sheetType=type;$('#sheet-title').textContent=title;$('#sheet-content').innerHTML=html;$('#sheet').hidden=false;screen.classList.add('sheet-open');$('#close-sheet').focus({preventScroll:true});}

app.js
function closeSheet(){if($('#sheet').hidden)return;$('#sheet').hidden=true;screen.classList.remove('sheet-open');sheetType='';previousFocus?.isConnected&&previousFocus.focus({preventScroll:true});}

.sheet{position:absolute;left:10px;right:10px;bottom:25px;z-index:50;border:1px solid #ffffff16;border-radius:26px;background:#141d1d;padding:10px 22px 23px;box-shadow:0 -50px 100px #0008;max-height:620px;overflow:auto;animation:sheet-in .3s ease-out}

.composer-panel{position:absolute;top:145px;left:12px;right:12px;height:499px;border:1px solid #6d7868;border-radius:27px;background:linear-gradient(130deg,#131c1c,#0f1515);z-index:24;padding:0 18px;display:flex;flex-direction:column;animation:sheet-in .3s ease-out}

.payment-dialog{position:relative;width:100%;max-height:704px;overflow:auto;background:linear-gradient(145deg,#253229,#17221c);border:1px solid #d5eac51a;border-radius:28px;padding:28px 24px 16px;box-shadow:0 28px 80px #0009;text-align:center;animation:sheet-in .22s ease-out}

.page-body{height:calc(100% - 64px);overflow:auto;scrollbar-width:none;padding:24px;overscroll-behavior:contain}

.preference-row input[type=checkbox]{appearance:none;width:38px;height:22px;background:#3b4a40;border-radius:14px;position:relative;transition:background .2s;flex:none;margin:0;cursor:pointer}

.chat-page .page-body{display:flex;flex-direction:column;padding:0;overflow:hidden}

.subpage .page-body{height:calc(100% - 64px)}

.inbox-page>.page-body{display:flex;flex-direction:column;padding-top:12px;gap:0}

.public-profile-reference>.page-body{display:block;overflow:auto;padding:4px 24px 120px}
```
