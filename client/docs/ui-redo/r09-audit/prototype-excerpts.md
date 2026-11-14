# Local prototype excerpts (before implementation)

features.js
```js
 function open(name,params={},replace=false){if(name!==route.name&&guardMomentLeave(()=>open(name,params,replace)))return;if(!replace&&view.hidden===false)history.push(route);route={name,...params};if(name==='public-profile')recordVisit(chatFor(params.id)??params.person,params.sourceNote);C.hideHome();screen.classList.add('page-open');screen.classList.toggle('subpage',!['inbox','profile'].includes(name));view.hidden=false;if(['inbox','profile','chat'].includes(name))activateNav(name==='profile'?'profile':'inbox');render();view.scrollTop=0;}

 function back(){if(guardMomentLeave(back))return;closeSheet();if(route.name==='public-profile'&&route.sourceNote&&!history.length){const note=route.sourceNote;home();C.openNote(note);return;}if(history.length){route=history.pop();open(route.name,route,true);}else home();}

 function home(){if(guardMomentLeave(home))return;closeInboxMenu();view.hidden=true;view.replaceChildren();screen.classList.remove('page-open','subpage','wallpaper-chat');screen.style.removeProperty('--chat-wallpaper');activateNav('home');history=[];C.home();}

 function page(title,body,action=''){attachmentHandler=null;closeInboxMenu();screen.classList.remove('wallpaper-chat');screen.style.removeProperty('--chat-wallpaper');view.classList.remove('chat-page','inbox-page','profile-reference','settings-reference','feedback-reference','help-reference','public-profile-reference');view.innerHTML=`<header class="page-header"><button id="page-back" class="page-back" aria-label="Back">${icon('back')}</button><h1>${T(title)}</h1>${action||'<span class="header-space"></span>'}</header><div class="page-body">${body}</div>`;$('#page-back').onclick=back;window.MauGoI18n?.translate(view);refreshOwnAvatar();}

 function openLetterThread(n){syncLetterReplies();if(n.id.startsWith('echo')){open('chat',{id:({'echo-1':'tea','echo-2':'ocean','echo-3':'sea'})[n.id]});return;}const c=chats.find(c=>c.noteId===n.id||c.contactId===rules.contactKey(n));if(c){c.hiddenFromInbox=false;persist();open('chat',{id:c.id});}}
 for(const c of chats){if(c.wallpaperId&&!wallpapers.some(w=>w.id===c.wallpaperId)){delete c.wallpaperId;c.background='night';}const intro=c.noteId?C.getIntroductions()[c.noteId]:null;c.repliedAt=c.repliedAt??intro?.repliedAt??null;if(['tea','ocean','sea'].includes(c.id))c.repliedAt=c.repliedAt??c.messages.find(m=>m.mine===false)?.time??c.clearedAt??Date.now();c.status=rules.hasReply(c)?'open':'waiting';}

 function inbox(){syncLetterReplies();const friends=route.tab==='friends',incoming=pendingReplyQueue().map(q=>({...chatFor(q.chatId),...q.person,status:'open'}));page('Inbox',`${!friends&&incoming.length?`<button class="collect-replies" id="collect-replies"><span class="collect-symbol">${icon('mail')}</span><span class="collect-copy"><strong>${T('Collect replies')}</strong><small>${freeReplies()?`${freeReplies()} ${T('free today')}`:`${C.getReplyPricing().diamondsPerReply} ${T('diamonds per reply')}`}</small></span><span class="reply-avatar-stack">${incoming.slice(0,3).map(c=>`<img src="${avatar(c)}" ${c.sentLetter&&c.status==='waiting'?'data-sent-envelope':''} alt="">`).join('')}<i>•••</i></span><b>${incoming.length}</b><span class="collect-chevron">›</span></button>`:''}<div id="chat-list" class="inbox-conversations"></div>${searchText?`<button class="text-button" id="clear-inbox-search">${T('Clear search')}</button>`:''}<p class="local-note">${T('Sample conversations · Stored on this device')}</p>${!state.settings.inboxPromptDismissed?`<div class="inbox-notification-prompt"><span>♧</span><p>${T('Keep up with replies')}</p><button id="inbox-enable-notifications">${T('Enable')}</button><button id="dismiss-inbox-notifications" aria-label="Dismiss notification reminder">×</button></div>`:''}`);view.classList.add('inbox-page');view.querySelector('.page-header').innerHTML=`<h1 class="sr-only">${T('Inbox')}</h1><div class="inbox-heading-tabs"><button id="tab-messages" aria-pressed="${!friends}" class="${!friends?'selected':''}">${T('Messages')}</button><button id="tab-friends" aria-pressed="${friends}" class="${friends?'selected':''}">${T('Friends')}</button></div><button class="inbox-menu-button" id="inbox-menu" aria-label="Inbox menu"><i></i><i></i><i></i><b></b></button>`;$('#tab-messages').onclick=()=>open('inbox',{tab:'messages'},true);$('#tab-friends').onclick=()=>open('inbox',{tab:'friends'},true);$('#collect-replies')?.addEventListener('click',()=>collectOneReply());$('#inbox-menu').onclick=showInboxMenu;$('#clear-inbox-search')?.addEventListener('click',()=>{searchText='';render();});$('#inbox-enable-notifications')?.addEventListener('click',()=>open('notifications'));$('#dismiss-inbox-notifications')?.addEventListener('click',()=>{state.settings.inboxPromptDismissed=true;persist();render();});
 const q=searchText.toLowerCase(),list=chats.filter(c=>!c.blocked&&!c.hiddenFromInbox&&(!friends||state.following.includes(c.id))&&`${c.name} ${c.remark??''}`.toLowerCase().includes(q)).sort((a,b)=>Number(!!b.pinned)-Number(!!a.pinned)||(b.messages.at(-1)?.time??0)-(a.messages.at(-1)?.time??0));$('#chat-list').innerHTML=list.length?list.map(c=>`<div class="chat-row-wrap"><button class="chat-row" data-chat="${c.id}">${avatarMarkup(c)}<span class="chat-row-text"><strong data-user-content>${escape(c.remark||c.name)} ${c.pinned?'⌁':''}</strong><span data-user-content>${chatPreview(c)}</span></span><span class="chat-row-end"><small>${listTime(c)}</small>${c.status==='waiting'?`<small class="pending-dot">${T('Awaiting reply')}</small>`:c.unread?`<b>${c.unread}</b>`:''}${c.muted?'♧':''}</span></button><button class="conversation-options" data-options="${c.id}" aria-label="${T('Conversation options')} · ${escape(c.name)}">•••</button></div>`).join(''):empty(friends?'Your circle is just beginning.':'No conversations found.');view.querySelectorAll('[data-chat]').forEach(b=>{b.onclick=()=>open('chat',{id:b.dataset.chat});b.oncontextmenu=e=>{e.preventDefault();conversationOptions(chatFor(b.dataset.chat));};});view.querySelectorAll('[data-options]').forEach(b=>b.onclick=()=>conversationOptions(chatFor(b.dataset.options)));window.MauGoI18n.translate(view);refreshOwnAvatar();}

 function conversationOptions(c){showSheet('Conversation options',`${row(c.pinned?'Unpin conversation':'Pin conversation','option-pin')}${row(c.unread?'Mark as read':'Mark as unread','option-unread')}${row('Hide conversation','option-hide')}${row('Report or block','option-safety')}`);$('#option-pin').disabled=!rules.canContinue(c);$('#option-safety').disabled=!!c.sentLetter&&c.status==='waiting';$('#option-pin').onclick=()=>{if(!rules.canContinue(c))return;c.pinned=!c.pinned;persist();closeSheet();render();};$('#option-unread').onclick=()=>{c.unread=c.unread?0:1;persist();closeSheet();render();};$('#option-hide').onclick=()=>{c.hiddenFromInbox=true;persist();closeSheet();render();};$('#option-safety').onclick=()=>C.showSafetyMenu(()=>open('report',{id:c.id}),()=>confirm(c.blocked?'Unblock this person?':'Block this person?', 'Their letters and conversations will be hidden. You can unblock them in Privacy settings.',()=>{changeBlock(c,!c.blocked);closeSheet();render();},c.blocked?'Unblock':'Block'),c.blocked);}

 function showInboxMenu(){closeInboxMenu();const overlay=document.createElement('div');overlay.className='inbox-drawer-overlay';overlay.innerHTML=`<button class="inbox-drawer-backdrop" aria-label="Close inbox menu"></button><aside class="inbox-drawer" role="dialog" aria-modal="true" aria-label="Inbox tools"><div class="drawer-heading"><h2>${T('Inbox tools')}</h2><button id="close-inbox-drawer" aria-label="Close inbox menu">×</button></div><input class="search-field" id="inbox-drawer-search" aria-label="Search conversations" placeholder="${T('Search conversations')}" value="${escape(searchText)}"><button class="drawer-search-button" id="drawer-search">${T('Search')}</button><div class="drawer-menu-group">${row('System messages','system-messages')}${row('Interactions','interactions')}${row('New followers','new-followers')}${row('Help & support','inbox-support')}${row('Hidden conversations','hidden-conversations')}${row('Preview incoming replies','preview-incoming-replies')}${row('Preview a Home reply','preview-home-reply')}</div><div class="drawer-bottom"><div class="drawer-shortcuts"><button id="read-all">✓<span>${T('Mark all as read')}</span></button><button id="clear-inbox">⌫<span>${T('Clear conversation list')}</span></button></div><button class="outline-button full-width" id="inbox-notifications">${T('Notification settings')}</button></div></aside>`;screen.append(overlay);const targets=[view,document.querySelector('.bottom-nav')],before=targets.map(el=>el.inert);targets.forEach(el=>el.inert=true);drawerRestore=()=>targets.forEach((el,i)=>el.inert=before[i]);overlay.onkeydown=e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();closeInboxMenu();}if(e.key==='Tab'){const focusables=[...overlay.querySelectorAll('button,input')].filter(el=>el.getClientRects().length);if(e.shiftKey&&document.activeElement===focusables[0]){e.preventDefault();focusables.at(-1).focus();}else if(!e.shiftKey&&document.activeElement===focusables.at(-1)){e.preventDefault();focusables[0].focus();}}};window.MauGoI18n.translate(overlay);overlay.querySelector('.inbox-drawer-backdrop').onclick=closeInboxMenu;$('#close-inbox-drawer').onclick=closeInboxMenu;$('#close-inbox-drawer').focus({preventScroll:true});$('#drawer-search').onclick=()=>{searchText=$('#inbox-drawer-search').value.trim();closeInboxMenu();render();};$('#inbox-drawer-search').onkeydown=e=>{if(e.key==='Enter')$('#drawer-search').click();if(e.key==='Escape'){e.stopPropagation();closeInboxMenu();}};$('#system-messages').onclick=()=>open('activity',{kind:'System messages'});$('#interactions').onclick=()=>open('activity',{kind:'Interactions'});$('#new-followers').onclick=()=>open('activity',{kind:'New followers'});$('#inbox-support').onclick=()=>open('help');$('#hidden-conversations').onclick=()=>open('hidden-chats');$('#preview-incoming-replies').onclick=()=>queueDemoReplies();$('#preview-home-reply').onclick=()=>{const people=chats.filter(c=>!c.blocked&&c.status==='open').slice(0,3);home();C.previewHomeResponses(people);};$('#inbox-notifications').onclick=()=>open('notifications');$('#read-all').onclick=()=>{chats.forEach(c=>c.unread=0);persist();closeInboxMenu();render();};$('#clear-inbox').onclick=()=>{closeInboxMenu();confirm('Clear conversations?','Conversations will be hidden from Inbox. Their messages are kept and can be restored from Hidden conversations.',()=>{chats.forEach(c=>c.hiddenFromInbox=true);persist();render();},'Clear conversations');};}

 function closeInboxMenu(){if(drawerRestore){drawerRestore();drawerRestore=null;}screen.querySelector('.inbox-drawer-overlay')?.remove();}

 function hiddenChats(){const hidden=chats.filter(c=>c.hiddenFromInbox&&!c.blocked&&!pendingReplies.some(q=>q.chatId===c.id));page('Hidden conversations',hidden.length?`<p class="intro-copy">${T('Restore a conversation to your Inbox.')}</p>${hidden.map(c=>`<div class="blocked-row"><img src="${avatar(c)}" ${c.sentLetter&&c.status==='waiting'?'data-sent-envelope':''} alt=""><span data-user-content>${escape(c.name)}</span><button class="outline-button" data-restore="${c.id}">${T('Restore')}</button></div>`).join('')}`:empty('No hidden conversations.'));view.querySelectorAll('[data-restore]').forEach(b=>b.onclick=()=>{chatFor(b.dataset.restore).hiddenFromInbox=false;persist();render();});}


 function collectOneReply(paid=false,expectedId=null){if(collectingReply)return;const receipt=pendingReplyQueue()[0];if(!receipt||expectedId&&receipt.id!==expectedId||!rules.isReply(receipt.message))return;replyQuota=currentReplyQuota();if(!freeReplies()&&!paid){requestCollectPayment(receipt.id);return;}paid=paid&&freeReplies()===0;if(paid&&C.getWallet().balance<C.getReplyPricing().diamondsPerReply){requestCollectPayment(receipt.id);return;}collectingReply=true;const button=$('#collect-replies');if(button)button.disabled=true;const beforeChats=structuredClone(chats),beforeQueue=[...pendingReplies],beforeQuota={...replyQuota},beforePurchases=[...replyPurchases],c=chatFor(receipt.chatId);Object.assign(c,receipt.person);if(!c.messages.some(m=>m.id===receipt.message.id)){c.messages.push(receipt.message);c.unread=(c.unread??0)+1;}c.status='open';c.repliedAt=receipt.message.time;c.hiddenFromInbox=false;pendingReplies=pendingReplies.filter(q=>q.id!==receipt.id);if(paid)replyPurchases.push({id:receipt.id,diamonds:C.getReplyPricing().diamondsPerReply,time:new Date().toISOString()});else replyQuota=window.MauGoReplyRules.consume(replyQuota,C.getReplyPricing().dailyFree);if(!persist()){chats=beforeChats;pendingReplies=beforeQueue;replyQuota=beforeQuota;replyPurchases=beforePurchases;collectingReply=false;render();toast(T('Unable to save right now. Please try again.'));return;}if(paid)C.syncReplyCharges();if(c.noteId)C.setIntroduction(c.noteId,rules.afterReply(C.getIntroductions()[c.noteId]??rules.afterOpening(c.noteId,c.messages.find(m=>m.mine)?.text??'')));collectingReply=false;searchText='';render();const row=view.querySelector(`[data-chat="${c.id}"]`);row?.classList.add('reply-collected');row?.scrollIntoView({block:'nearest',behavior:'smooth'});toast(T('One reply collected.'));
 }

 function requestCollectPayment(receiptId){if(!pendingReplyQueue().some(r=>r.id===receiptId))return;const price=C.getReplyPricing().diamondsPerReply,balance=C.getWallet().balance;if(balance<price){const close=showPaymentDialog(`<h2 id="payment-title">${T('Not enough diamonds')}</h2><p>${T('Collecting one reply costs')} ${price} ${T('diamonds')}.</p><div class="payment-summary"><div><span>${T('Your balance')}</span><strong>${balance} ${T('diamonds')}</strong></div><div><span>${T('Still needed')}</span><strong>${price-balance} ${T('diamonds')}</strong></div></div><button id="reply-topup" class="primary full-width">${T('Get diamonds')}</button><button id="reply-payment-cancel" class="text-button">${T('Not now')}</button>`);$('#reply-payment-cancel').onclick=close;$('#reply-topup').onclick=()=>{close();showDiamondStore(()=>{closeSheet();requestCollectPayment(receiptId);},'Back to replies');};return;}const close=showPaymentDialog(`<h2 id="payment-title">${T('Collect one reply?')}</h2><p>${T('Your 10 free replies for today have been used. Pay only for this one reply.')}</p><div class="payment-summary"><div><span>${T('Total')}</span><strong>${price} ${T('diamonds')}</strong></div><div><span>${T('Your balance')}</span><strong>${balance} ${T('diamonds')}</strong></div><div><span>${T('Balance after payment')}</span><strong>${balance-price} ${T('diamonds')}</strong></div></div><button id="confirm-reply-payment" class="primary full-width">${T('Collect reply')} · ${price} ${T('diamonds')}</button><button id="reply-payment-cancel" class="text-button">${T('Not now')}</button>`);$('#reply-payment-cancel').onclick=close;$('#confirm-reply-payment').onclick=()=>{if(C.getWallet().balance<price){close();requestCollectPayment(receiptId);return;}close();collectOneReply(true,receiptId);};}

```

CSS (all inbox-related rules; earlier rules may be overridden)
```css
.inbox-entry{border-bottom:1px solid #ffffff0b;padding:12px 0}
.inbox-entry small{font-size:11px;color:var(--lime)}
.inbox-entry p{margin:6px 0}
.inbox-tabs{display:flex;background:#111b13;border-radius:16px;padding:4px;gap:4px;margin-bottom:12px}
.inbox-tabs button{flex:1;background:none;border-radius:12px;padding:8px;font-size:11px;color:#889981}
.inbox-tabs button.active{background:#34422d;color:var(--lime)}
.inbox-entry{background:#202c22;border-radius:13px;padding:12px;margin:8px 0;border:0;font-size:12px}
.inbox-entry button{background:none;padding:0;color:#ccddbc;font-size:12px;text-align:left;width:100%}
.inbox-entry small{font-size:9px;color:#8ea57e}
.inbox-entry p{font-size:12px;margin:6px 0 0}
.inbox-tabs button{font-size:11px}
.inbox-tabs{gap:var(--space-1);padding:var(--space-1);margin-bottom:var(--space-3)}
.inbox-tabs button{height:36px;font-size:12px}
.inbox-entry{padding:var(--space-3);margin:var(--space-2) 0}
.page-body{height:calc(100% - 64px);overflow:auto;scrollbar-width:none;padding:24px;overscroll-behavior:contain}
.page-body p{line-height:21px}
.chat-row{display:flex;align-items:center;gap:12px;background:none;width:100%;padding:16px 0;border-bottom:1px solid #ffffff07;text-align:left}
.chat-row>img{width:52px;height:52px;object-fit:cover;background:#24312a;border-radius:50%;flex:none}
.chat-row-text{display:flex;flex-direction:column;gap:8px;min-width:0;flex:1}
.chat-row-text strong{font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.chat-row-text>span{color:#869b86;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.chat-row-end{display:flex;flex-direction:column;align-items:flex-end;gap:8px;flex:none}
.chat-row-end small{font-size:9px;color:#708670}
.chat-row-end b{display:grid;place-items:center;border-radius:9px;background:#b5fa70;color:#183513;min-width:16px;height:16px;font-size:9px}
.page-body .primary{min-height:48px;font-size:14px;border-radius:24px}
.chat-page .page-body{display:flex;flex-direction:column;padding:0;overflow:hidden}
.chat-row>img,.blocked-row>img,.person-card>img,.conversation .avatar img{object-fit:cover}
.subpage .page-body{height:calc(100% - 64px)}
.chat-row-end .pending-dot{background:none;color:#93a787;max-width:60px;white-space:normal;text-align:right;font-size:9px}


.inbox-page>.page-header{padding:0 24px;justify-content:space-between}
.inbox-heading-tabs{display:flex;gap:20px;align-items:center}
.inbox-heading-tabs button{background:none;font-size:19px;line-height:28px;font-weight:500;color:#7c9285;padding:8px 0}
.inbox-heading-tabs .selected{color:#edf6e7;font-size:23px;font-weight:550}
.inbox-menu-button{background:none;width:36px;height:40px;display:flex;flex-direction:column;gap:5px;justify-content:center;align-items:center;position:relative}
.inbox-menu-button i{width:21px;height:2.2px;background:#e8f3de;border-radius:4px}
.inbox-menu-button b{position:absolute;top:7px;right:5px;width:6px;height:6px;background:#b5fa70;border-radius:50%}
.collect-replies{width:100%;height:48px;border:1px solid #b5fa70b3;background:#132017;border-radius:24px;display:flex;align-items:center;gap:8px;padding:0 12px;margin:0 0 20px}
.collect-replies strong{font-size:14px;white-space:nowrap}
.collect-replies>b{font-size:10px;color:#142912;background:#b5fa70;padding:2px 5px;border-radius:10px;min-width:17px}
.inbox-page>.page-body{display:flex;flex-direction:column;padding-top:12px;gap:0}
.inbox-conversations{flex:1}
.chat-row-wrap{position:relative}
.inbox-page .chat-row{min-height:84px;padding:12px 28px 12px 0;border:0;background:transparent;gap:14px}
.inbox-page .chat-row>img{height:48px;width:48px;border-radius:50%;flex:none}
.inbox-page .chat-row-text{gap:6px}
.inbox-page .chat-row-text strong{font-size:15px;line-height:21px}
.inbox-page .chat-row-text>span{font-size:12px;color:#86978c;line-height:18px}
.inbox-page .chat-row-end{width:58px;gap:7px}
.inbox-page .chat-row-end small{font-size:10px;color:#8ca094;white-space:nowrap}
.inbox-page .chat-row-end b{height:16px;min-width:16px;padding:0 4px;font-size:10px;line-height:16px;background:#b5fa70;color:#15321a;border-radius:50%}
.inbox-page .chat-row-end .pending-dot{font-size:9px;white-space:normal}
.inbox-notification-prompt{display:flex;align-items:center;gap:8px;border-radius:12px;background:#223026;padding:8px 10px;margin:12px 0 0;flex:none}
.inbox-notification-prompt>span{color:#b5fa70}
.inbox-notification-prompt p{margin:0;flex:1;font-size:10px;color:#9eb194}
.inbox-notification-prompt button{background:none;color:#d3e6c6;font-size:10px;padding:4px}
.inbox-notification-prompt button:last-child{font-size:18px;color:#81947a}
.inbox-drawer-overlay{position:absolute;inset:48px 0 28px;z-index:58;display:flex;justify-content:flex-end}
.inbox-drawer-backdrop{position:absolute;inset:0;background:#050c085c}
.inbox-drawer{position:relative;z-index:1;width:284px;background:#17251c;border-radius:20px 0 0 20px;padding:20px;display:flex;flex-direction:column;box-shadow:-12px 0 40px #0004}
.inbox-drawer .search-field{margin:0;height:44px;font-size:12px;flex:none}


.reply-collected{animation:reply-arrive .45s ease-out}


.collect-replies{flex-shrink:0}
.inbox-page .chat-row>img[data-sent-envelope]{object-fit:cover;padding:0;background:#fff0cf}
.inbox-page .collect-replies{position:sticky;top:0;z-index:2;box-shadow:0 0 0 10px #0d1713}
.collect-replies:active{transform:scale(.99)}
.collect-replies{height:56px}
.inbox-page .chat-row>.sent-envelope-avatar{flex:none;width:48px;min-width:48px;max-width:48px;height:48px}


.app-view:not(.chat-page):not(.profile-reference):not(.inbox-page) .menu-group{background:#1b2a20;border-radius:16px;padding:0 16px;margin-bottom:20px}
.public-profile-reference>.page-body{display:block;overflow:auto;padding:4px 24px 120px}
```

## Supplemental effect cross-check

app.js toast(): sets visible, clears previous timer, removes visible after 2700ms.
CSS toast: opacity .2s, transform .2s; hidden opacity0 / translateY8px.
CSS sheet: animation sheet-in .3s ease-out; keyframes opacity0/translateY30px → opacity1/none.
CSS reply-arrive: .45s ease-out; opacity0/translateY-8px → opacity1/translateY0.
The drawer itself has no animation declaration in the prototype; current ui-sheet inheritance is a difference.

Collection confirmation uses prototype `.payment-dialog` animation `sheet-in .22s ease-out` (220ms), distinct from the standard sheet's 300ms. Runtime audit found the shared selector overriding that duration; the R09 override only changes animation duration, not collection/payment rules.
