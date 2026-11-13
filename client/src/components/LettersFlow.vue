<script setup lang="ts">
import {tr} from '../lib/i18n'
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { api, ApiError } from '../lib/api'
import { asset } from '../lib/assets'
export type Letter = {openingMessageId:string;conversationId:string;content:string;sender:{id:string;displayName:string;city:string;age:number};state:string;canReply:boolean;canChat:boolean}
const props=defineProps<{token:string;letter?:Letter;compose?:boolean}>()
const emit=defineEmits<{close:[];blocked:[id:string]}>()
const detail=ref(props.letter),view=ref(props.compose?'compose':'letter'),draft=ref(''),recipient=ref(new URLSearchParams(location.search).get('recipient')||''),reply=ref(''),sent=ref(''),error=ref(''),notice=ref(''),busy=ref(false),safety=ref(''),confirmation=ref(false)
const sentKey=computed(()=>`maugo-opening-sent:${props.token.slice(-16)}:${recipient.value}`)
const draftKey=computed(()=>`maugo-opening-draft:${props.token.slice(-16)}:${recipient.value}`)
const replyKey=computed(()=>`maugo-reply-draft:${props.token.slice(-16)}:${detail.value?.conversationId}`)
const count=computed(()=>[...draft.value].length)
function invalid(text:string){return !text.trim()?'Write a little hello first.':/[\r\n\u2028\u2029]/u.test(text)?'One opening message, on a single line.':[...text].length>200?'Keep your hello within 200 characters.':''}
const validation=computed(()=>invalid(draft.value))
const state=computed(()=>safety.value==='choice'?'letter-safety':safety.value==='report'?'letter-report':view.value==='sent'?'compose-sent':view.value==='compose'?(draft.value&&validation.value?'compose-invalid':draft.value?'compose-draft':'compose-empty'):detail.value?.state==='letter-open'&&reply.value?'letter-typed':detail.value?.state||'letter-open')
const headers=()=>({Authorization:`Bearer ${props.token}`,'Content-Type':'application/json'})
function restore(){try{draft.value=sessionStorage.getItem(draftKey.value)||'';const previous=sessionStorage.getItem(sentKey.value);if(previous){sent.value=previous;view.value='sent'}}catch{}}
watch(recipient,restore)
watch(draft,v=>{error.value='';try{sessionStorage.setItem(draftKey.value,v)}catch{}})
watch(reply,v=>{try{sessionStorage.setItem(replyKey.value,v)}catch{}})
async function refresh(){if(!detail.value||view.value!=='letter'||busy.value)return;try{detail.value=await api<Letter>(`/letters/${detail.value.openingMessageId}`,{headers:headers()})}catch(e){if(e instanceof ApiError&&[403,404,410].includes(e.status))error.value='This letter is no longer available.'}}
async function send(opening:boolean){
 if(busy.value||view.value==='sent'||(!opening&&!detail.value?.canReply))return
 const text=opening?draft.value:reply.value
 error.value=invalid(text);if(error.value)return
 if(opening&&!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(recipient.value)){error.value='Enter a valid recipient ID.';return}
 busy.value=true
 try{
  await api(opening?`/conversations/${recipient.value}/opening`:`/conversations/${detail.value!.conversationId}/messages`,{method:'POST',headers:headers(),body:JSON.stringify({content:text})})
  sent.value=text;error.value=''
  if(opening){view.value='sent';sessionStorage.removeItem(draftKey.value);sessionStorage.setItem(sentKey.value,text)}else{sessionStorage.removeItem(replyKey.value);reply.value='';detail.value={...detail.value!,state:'letter-waiting',canReply:false}}
 }catch(e){if(opening&&e instanceof ApiError&&e.status===409){view.value='sent';notice.value='You already sent an opening message to this person. Wait for their reply.';sent.value='';}else error.value='Could not send. Your draft is saved. Please try again.'}finally{busy.value=false}
}
async function report(category:string,reason:string){if(busy.value)return;busy.value=true;error.value='';try{await api('/reports',{method:'POST',headers:headers(),body:JSON.stringify({reportedUserId:detail.value!.sender.id,messageId:detail.value!.openingMessageId,category,reason})});notice.value='Report received. Thank you for helping keep MauGo safe.';safety.value=''}catch{error.value='Could not submit your report. Please try again.'}finally{busy.value=false}}
async function block(){if(busy.value)return;busy.value=true;error.value='';try{await api(`/blocks/${detail.value!.sender.id}`,{method:'PUT',headers:{Authorization:`Bearer ${props.token}`}});emit('blocked',detail.value!.openingMessageId);emit('close')}catch{error.value='Could not block this person. Please try again.'}finally{busy.value=false}}
function close(){if(safety.value){safety.value='';confirmation.value=false}else emit('close')}
function key(e:KeyboardEvent){if(e.key==='Escape')close()}
let timer:ReturnType<typeof setInterval>
onMounted(()=>{restore();try{reply.value=sessionStorage.getItem(replyKey.value)||''}catch{};timer=setInterval(refresh,4000);document.addEventListener('keydown',key);setTimeout(()=>document.querySelector<HTMLTextAreaElement>('#letter-text')?.focus(),300)})
onUnmounted(()=>{clearInterval(timer);document.removeEventListener('keydown',key)})
</script>
<template>
<div class="letters-veil" @click.self="close">
<section class="letters-panel" :class="{'composer-panel':view==='compose','is-sending':busy}" role="dialog" aria-modal="true" :aria-label="tr(view==='compose'?'Share a little story':'A letter for you')" :data-state="state" :aria-busy="busy">
<header><span aria-hidden="true">✉</span><h2>{{tr(view==='compose'?'Share a little story':view==='sent'?'Your sent letter':'A letter for you')}}</h2><button :aria-label="tr('Close')" @click="close">×</button></header>
<template v-if="view==='compose'">
<div class="sender-preview"><img :src="asset('02-bird-static/female-1')" :alt="tr('Your messenger bird')"><span>{{tr("Your little messenger")}}</span></div>
<label class="recipient-label">{{tr("Recipient ID")}}<input v-model.trim="recipient" :aria-label="tr('Recipient ID')" :disabled="busy" :placeholder="tr('Paste your recipient’s ID')" autocomplete="off"></label>
<form class="opening-form" @submit.prevent="send(true)"><textarea id="letter-text" v-model="draft" :disabled="busy" :placeholder="tr('One little hello. One opening message.')" :aria-label="tr('Write your letter')" :aria-invalid="!!draft&&!!validation" aria-describedby="opening-rule letter-validation"></textarea>
<Transition name="count" mode="out-in"><div :key="count" class="letter-count" :class="{invalid:count>200}" aria-live="polite">{{count}} / 200</div></Transition>
<p id="opening-rule" class="opening-rule">{{tr("One opening message. Chat starts when they reply.")}}</p><p id="letter-validation" class="letter-validation" role="status">{{tr(validation||'Plain text · up to 200 characters · a single line')}}</p>
<footer><button type="button" class="secondary" @click="close">{{tr("Cancel")}}</button><button id="publish" class="primary" :disabled="busy||!!validation" type="submit">{{tr(busy?'Flying…':'➤ Let it fly')}}</button></footer></form>
</template>
<template v-else-if="view==='sent'">
<div class="sent-scene"><img :src="asset('02-bird-static/female-1')" :alt="tr('Your letter is on its way')"><span>✧ · ✦ · ✧</span></div><h3>{{tr("Your little hello is on its way.")}}</h3><p class="waiting-status" role="status">{{tr(notice||'Waiting for their reply. Chat starts when they reply.')}}</p><blockquote v-if="sent" class="my-reply">{{sent}}</blockquote><p v-if="!sent" class="opening-rule">{{tr("Your draft is saved. Another opening cannot be sent to this person.")}}</p><button class="primary" @click="emit('close')">{{tr("Back to home")}}</button>
</template>
<template v-else-if="detail">
<div class="note-meta"><span>{{detail.sender.displayName}} · {{detail.sender.age}} · {{detail.sender.city}}</span><button id="report-note" :aria-label="tr('Report this letter')" @click="safety='choice'">⚑</button></div>
<div class="letter-conversation"><div class="message-row"><img class="letter-avatar" :src="asset('02-bird-static/female-1')" :alt="tr('Letter author')"><div class="message-bubble"><p>{{tr("Dear little wanderer,")}}</p><p class="letter-content">{{detail.content}}</p><p class="note-signature">— {{detail.sender.displayName}}</p></div></div><Transition name="reply"><p v-if="sent" class="my-reply">{{sent}}</p></Transition></div>
<p v-if="notice" role="status">{{tr(notice)}}</p>
<template v-if="detail.state==='letter-waiting'||detail.state==='letter-replied'"><p class="waiting-status" role="status"><span class="waiting-dots">✧</span> {{tr(detail.state==='letter-replied'?'They replied to your little hello.':'Your reply is on its way. Waiting for their reply.')}}</p><button id="continue-chat" class="primary" @click="refresh">{{tr(detail.state==='letter-replied'?'Reply received · Check for updates':'Waiting for their reply')}}</button></template>
<form v-else-if="detail.canReply" id="reply-form" class="reply-form" @submit.prevent="send(false)"><div class="reply-bar"><textarea id="reply" v-model="reply" :disabled="busy" rows="1" :placeholder="tr('Say something kind…')" :aria-label="tr('Write a reply')" :aria-invalid="!!reply&&!!invalid(reply)"></textarea><button id="reply-send" :aria-label="tr('Send reply')" :disabled="busy||!!invalid(reply)">{{tr(busy?'◌':'➤')}}</button></div><small :class="{invalid:!!reply&&!!invalid(reply)}">{{tr(reply&&invalid(reply)?invalid(reply):`${[...reply].length} / 200`)}}</small><button type="button" class="write-opening" @click="view='compose'">{{tr("Share a little story")}}</button></form>
<p v-else class="waiting-status">{{tr("This letter is no longer available.")}}</p>
</template>
<Transition name="reply"><p v-if="error" class="letter-error" role="alert">{{tr(error)}}</p></Transition>
</section>
<Transition name="safety"><section v-if="safety" class="letter-safety" role="dialog" aria-modal="true" :aria-label="tr(safety==='report'?'Report this letter':'Report or block')"><header><h2>{{tr(safety==='report'?'Report this letter':confirmation?'Block this person?':'Report or block')}}</h2><button :aria-label="tr('Close safety menu')" @click="safety='';confirmation=false">×</button></header>
<template v-if="safety==='report'"><p>{{tr("Choose a reason. Tell us about inappropriate content.")}}</p><button v-for="r in [['harassment','Abuse or harassment'],['spam','Spam or advertising'],['sexual','Inappropriate content'],['other','Something else']]" :key="r[0]" :disabled="busy" @click="report(r[0]!,r[1]!)">{{tr(r[1])}}</button></template>
<template v-else-if="confirmation"><p>{{tr("Stop contact from this person. Their letters will disappear from your home.")}}</p><button :disabled="busy" @click="block">{{tr(busy?'Blocking…':'Block')}}</button><button :disabled="busy" @click="confirmation=false">{{tr("Cancel")}}</button></template>
<template v-else><p>{{tr("Choose how you would like to manage this person.")}}</p><button id="safety-report" @click="safety='report'">{{tr("⚑ Report")}}<small>{{tr("Tell us about inappropriate content")}}</small></button><button id="safety-block" @click="confirmation=true">{{tr("⊘ Block")}}<small>{{tr("Stop contact from this person")}}</small></button></template><p v-if="error" role="alert" class="letter-error">{{tr(error)}}</p></section></Transition>
</div>
</template>
<style src="../letters.css"></style>
