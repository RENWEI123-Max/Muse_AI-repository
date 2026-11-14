# 本地原型 R08 摘录
来源：~/maugo-design/MauGo.html 内嵌 app.js；原型只读，未调用接口。

app.js 113–121
```js
 }else if(phase==='opening'){
  const u=clamp((elapsed-openingStart)/(noMotion()?1:440)),q=1-Math.pow(1-u,3);
  if(letter){const sx=selectedPosition.x+43*selectedPosition.scale,sy=selectedPosition.y+6*selectedPosition.scale;letter.style.transform=`translate(${sx+(188-sx)*q-19.5}px,${sy+(202-sy)*q-14}px) rotate(${-12*(1-q)}deg) scale(${selectedPosition.scale+q*.8})`;letter.style.opacity=1-smooth(clamp((u-.55)/.45));}
  birds.forEach(b=>{b.el.style.opacity=1-q;setTrail(b,1,0);});if(u===1){letter?.remove();letter=null;phase='reading';}
 }else if(phase==='returning'){
  const u=clamp((elapsed-returnStart)/(noMotion()?1:480)),q=1-Math.pow(1-u,3);birds.forEach((b,i)=>{if(!b.note)return;const from=i===chosen?[188,215]:b.end;put(b,from[0]+(b.end[0]-from[0])*q,from[1]+(b.end[1]-from[1])*q,b.scale,0);b.el.style.opacity=q;b.art.style.opacity=1;flap(b,t,false);});if(u===1){elapsed=3300;settle();previousFocus?.isConnected&&previousFocus.focus({preventScroll:true});}
 }else if(phase==='sending'){
  const u=clamp((elapsed-sendingStart)/(noMotion()?1:1500));if(letter){const q=smooth(u);letter.style.transform=`translate(${149+Math.sin(q*Math.PI)*47}px,${435-540*q}px) rotate(${-12+q*20}deg) scale(${.7+Math.sin(q*Math.PI)*.3})`;letter.style.opacity=u>.85?(1-u)/.15:1;letter.style.backgroundPosition=`${-(Math.floor(t*14)%6)*132}px 0`;}
  if(u===1){letter?.remove();letter=null;phase='ready';startRound();toast('Your letter is saved. Let kindness find its way.');}
```

app.js 127–150
```js
async function openNote(n,index=-1){
 if(!n||blockedNotes.includes(n.id)||['opening','returning','sending'].includes(phase))return;closeSheet();hidePanels();activeNote=n;chosen=index;previousFocus=document.activeElement;selectedPosition=index>=0?{...birds[index].position}:{x:202,y:217,angle:0,scale:.9};phase='opening';openingStart=elapsed;screen.classList.remove('ready');actions.classList.remove('ready');birds.forEach(b=>b.el.disabled=true);
 $('#note-title').textContent=n.id.startsWith('echo')?'A reply for you':'A letter for you';$('#note-meta').textContent=`${n.gender==='female'?'Woman':'Man'} · ${n.age??'Private'} · ${n.city??'Somewhere'} · ${n.time?formatDate(n.time):'Just now'}`;$('#note-avatar').src=avatarFor(n);$('#view-letter-profile').onclick=()=>window.MauGoFeatures.openLetterProfile(n);$('#note-greeting').textContent=n.greeting??'';$('#note-body').textContent=n.body??'';$('#note-body').dataset.userContent='true';$('#note-signature').textContent=`— ${n.name??nickname}`;$('#note-media').replaceChildren();$('#reply-history').replaceChildren();$('#reply').value='';replyMedia=[];noteVoice=false;setVoiceMode('reply',false);renderAttachments('reply');
 panel.hidden=false;screen.classList.add('reading');panel.classList.add('visible');$('#close-note').focus({preventScroll:true});
 letter=document.createElement('img');letter.className='flying-letter';letter.src=asset('assets/envelope.png');letter.alt='';screen.append(letter);
 await renderMedia($('#note-media'),n.media??[]);for(const r of replies.filter(r=>r.note===n.id).slice(0,canChat(n)?30:1))await renderReply(r);updateReply();announce('Your letter is open.');
}
function closeNote(skip=false){if(!['reading','opening'].includes(phase))return;clearHomeResponses();hidePanels();panel.classList.remove('visible');if(skip){phase='ready';startRound();return;}phase='returning';returnStart=elapsed;}
$('#close-note').onclick=()=>closeNote();$('#not-interested').onclick=()=>{if(activeNote&&!activeNote.id.startsWith('echo')&&!activeNote.id.startsWith('post')){dismissed=[...new Set([...dismissed,activeNote.id])];save('magic-birds-dismissed',dismissed);}closeNote(true);};
$('#refresh').onclick=()=>pool().length?startRound():showFilters();hat.onclick=startRound;
function stopConversationView(){pauseMedia();closeEmoji();}
function openComposer(){if(['opening','returning','sending'].includes(phase))return;closeSheet();hidePanels();phase='composing';activeNote=null;screen.classList.remove('ready');screen.classList.add('composing');actions.classList.remove('ready');$('#composer-panel').hidden=false;$('#letter-text').value=draft.text??'';composeVoice=false;setVoiceMode('compose',false);updateSender();renderAttachments('compose');updateDraft();previousFocus=document.activeElement;$('#close-compose').focus({preventScroll:true});announce('Write a letter');}
function closeComposer(){if(phase!=='composing')return;clearHomeResponses();persistDraft();hidePanels();phase='returning';returnStart=elapsed;}
$('#compose').onclick=openComposer;$('#close-compose').onclick=closeComposer;$('#cancel-compose').onclick=closeComposer;
function updateSender(){$('#sender-avatar').src=birdAsset(preferences.gender,preferences.variant);$('#sender-label').textContent=`${nickname} · ${variants[preferences.variant-1]}`;}
function persistDraft(){draft.text=$('#letter-text').value;save('magic-birds-draft',draft);}
function updateDraft(){const text=$('#letter-text').value;const check=rules.validateOpening(text);$('#opening-rule').textContent=text.trim()&&!check.ok?check.error:'One opening message. Chat starts when they reply.';$('#letter-text').setAttribute('aria-invalid',String(!!text.trim()&&!check.ok));$('#letter-count').textContent=Array.from(text).length;$('#publish').disabled=!rules.validateOpening(text).ok;persistDraft();}
$('#letter-text').oninput=updateDraft;
$('#publish').onclick=async()=>{
 if(phase!=='composing')return;
 const body=$('#letter-text').value.trim();const check=rules.validateOpening(body);if(!check.ok){toast(check.error);return;}const post={id:`post-${Date.now()}`,gender:preferences.gender,variant:preferences.variant,age:24,city:'Somewhere',name:nickname,greeting:'A letter I sent',body:check.text,media:[],time:new Date().toISOString()};const next=[...posts,post].slice(-80);
 if(!save('magic-birds-posts',next)){toast('Unable to save right now. Please copy your words first.');return;}posts=next;introductions[post.id]=rules.afterOpening(post.id,check.text);saveIntroductions();draft={text:'',media:[]};save('magic-birds-draft',draft);hidePanels();phase='sending';sendingStart=elapsed;letter=document.createElement('div');letter.className='bird-art';letter.style.zIndex='26';letter.style.position='absolute';letter.style.left=0;letter.style.top=0;letter.style.backgroundImage=`url("${birdAsset(preferences.gender,preferences.variant,true)}")`;screen.append(letter);announce('Your little messenger is taking flight.');
};
function setVoiceMode(target,on){const button=$(`#${target}-voice`);button.innerHTML=icon(on?'keyboard':'mic');button.setAttribute('aria-label',on?'Switch to text input':(target==='reply'?'Switch to voice reply':'Switch to voice input'));$(`#${target}-hold`).hidden=!on;if(target==='reply')$('#reply').hidden=on;else $('#toolbar-label').hidden=on;}
```

app.js 152–177
```js
function updateReply(){$('#report-note').hidden=!!activeNote?.id.startsWith('post');const open=canChat(activeNote),pending=!!activeNote&&!!introductionFor(activeNote)&&!open;$('#reply').disabled=pending;$('#reply').maxLength=open?1000:200;$('#reply').placeholder=pending?'Waiting for their reply…':'One kind opening message…';for(const id of ['reply-voice','reply-emoji','reply-image'])$('#'+id).hidden=!open;$('#reply-status').textContent=pending?'Your hello is on its way. Chat opens when they reply.':open?'You both replied. Keep the conversation going.':'One opening message. More begins when they reply.';$('#continue-chat').hidden=!(open||pending);$('#continue-chat').textContent=open?'Continue chatting':'View waiting message';$('#reply-form').hidden=open||pending;$('#continue-chat').onclick=()=>{const n=activeNote;hidePanels();phase='feature';window.MauGoFeatures?.openLetterThread(n);};$('#reply-send').disabled=openingInFlight||pending||!$('#reply').value.trim();}
$('#reply').oninput=updateReply;
async function renderReply(r){const bubble=document.createElement('div');bubble.className='my-reply';const p=document.createElement('span');p.textContent=r.text??'';p.dataset.userContent='true';bubble.append(p);$('#reply-history').append(bubble);await renderMedia(bubble,r.media??[]);}
// Serialize the opening claim across tabs; the server must enforce this per user pair in production.
$('#reply-form').onsubmit=async e=>{
 e.preventDefault();if(!activeNote||openingInFlight)return;
 const note=activeNote,check=rules.validateOpening($('#reply').value);
 if(!check.ok){toast(check.error);return;}
 openingInFlight=true;updateReply();
 try{
  const claim=()=>{
   introductions=read('maugo-introductions',{});replies=read('magic-birds-replies',[]);
   blockedNotes=read('magic-birds-blocked',[]);
   if(blockedNotes.includes(note.id)||!rules.canSendOpening(introductionFor(note)))return null;
   const r={note:note.id,contactId:rules.contactKey(note),text:check.text,media:[],nickname,time:new Date().toISOString(),noteData:note};
   const next=[...replies,r];
   // Persist the opening itself first; it also serves as the durable claim if the ledger write fails.
   if(!save('magic-birds-replies',next))throw new Error('storage');
   replies=next;introductions[note.id]={...rules.afterOpening(note.id,check.text),contactId:r.contactId};saveIntroductions();return r;
  };
  const r=navigator.locks?await navigator.locks.request(userScope+'maugo-first-contact',claim):claim();
  if(!r){toast('Wait for their reply before sending another message.');return;}
  if(activeNote?.id===note.id){await renderReply(r);if(activeNote?.id===note.id){$('#reply').value='';replyMedia=[];renderAttachments('reply');$('#conversation').scrollTop=$('#conversation').scrollHeight;}}
  window.MauGoFeatures?.syncLetterReplies();toast('Opening message saved. Wait for their reply.');
 }catch{toast('Unable to save right now. Please copy your words first.');}
 finally{openingInFlight=false;if(activeNote)updateReply();}
```

app.js 219–219
```js
function reportLetter(note){showSheet('Report this letter','<p>Choose a reason. This letter will be hidden from your home.</p><div class="report-options" id="report-options"></div>','report');for(const reason of ['Abuse or harassment','Spam or advertising','Inappropriate content','Something else']){const b=document.createElement('button');b.textContent=reason;b.onclick=()=>{reports.push({note:note.id,reason,time:new Date().toISOString()});save('magic-birds-reports',reports);dismissed=[...new Set([...dismissed,note.id])];save('magic-birds-dismissed',dismissed);closeSheet();closeNote(true);toast('Recorded. This letter is now hidden.');};$('#report-options').append(b);}}
```

app.js 244–244
```js
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!$('#payment-overlay').hidden||recordGesture||!$('#emoji-picker').hidden||!$('#sheet').hidden||phase==='reading'||phase==='opening'||phase==='composing')e.stopImmediatePropagation();if(!$('#payment-overlay').hidden){$('#payment-overlay')._cancel?.();return;}if(recordGesture){finishRecording(true);return;}if(!$('#emoji-picker').hidden)closeEmoji();else if(!$('#sheet').hidden)closeSheet();else if(phase==='reading'||phase==='opening')closeNote();else if(phase==='composing')closeComposer();}if(e.key==='Tab'){const dialog=!$('#payment-overlay').hidden?$('#payment-dialog'):!$('#emoji-picker').hidden?$('#emoji-picker'):!$('#sheet').hidden?$('#sheet'):!panel.hidden?panel:!$('#composer-panel').hidden?$('#composer-panel'):null;if(!dialog)return;const targets=[...dialog.querySelectorAll('button,input,select,textarea')].filter(el=>!el.disabled&&!el.hidden&&el.getClientRects().length),first=targets[0],last=targets.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}});
```

CSS
```css
.note-panel{position:absolute;left:9px;right:9px;top:128px;height:580px;z-index:24;border:1px solid #777f69;border-radius:28px;background:linear-gradient(135deg,#11191ae6,#0c1313f2);padding:0 18px;display:flex;flex-direction:column;opacity:0;transform:translateY(14px) scale(.95);transition:opacity .36s,transform .44s cubic-bezier(.2,.8,.2,1);transform-origin:50% 30%}
.note-panel.visible{opacity:1;transform:none}
.sheet{position:absolute;left:10px;right:10px;bottom:25px;z-index:50;border:1px solid #ffffff16;border-radius:26px;background:#141d1d;padding:10px 22px 23px;box-shadow:0 -50px 100px #0008;max-height:620px;overflow:auto;animation:sheet-in .3s ease-out}
.note-panel.visible{transition-delay:.14s}
.note-panel{top:145px;height:562px;left:12px;right:12px;padding:0 17px}
.conversation{overflow:auto;flex:1;min-height:0;scrollbar-width:none;padding-bottom:12px}
.composer-panel{position:absolute;top:145px;left:12px;right:12px;height:499px;border:1px solid #6d7868;border-radius:27px;background:linear-gradient(130deg,#131c1c,#0f1515);z-index:24;padding:0 18px;display:flex;flex-direction:column;animation:sheet-in .3s ease-out}
.sheet{padding:10px 18px 20px;bottom:22px;background:#18211e;border-color:#ffffff0b;max-height:645px;border-radius:25px;scrollbar-width:none}

.sheet{left:12px;right:12px;bottom:24px;padding:var(--space-3) var(--panel-padding) var(--space-5);border-radius:var(--radius-panel);max-height:684px}

.note-panel{top:144px;height:560px;padding:0 var(--panel-padding)}
.composer-panel{top:144px;height:496px;padding:0 var(--panel-padding)}
```
