<script setup lang="ts">
import UiToast from './UiToast.vue'
import {computed, nextTick, onMounted, ref, watch} from 'vue'
import {supportEmail,legalText,termsVersion,termsSections,faqs,guides} from '../lib/support-content'
import {locale,t,tr,englishText} from '../lib/i18n'
import {asset} from '../lib/assets'
import {api,post,ApiError} from '../lib/api'
const props=defineProps<{token:string;privacy?:boolean;initial?:'notifications'|'system'|'interactions'|'help'}>()
const emit=defineEmits<{close:[];security:[]}>()
const view=ref<'settings'|'language'|'notifications'|'privacySettings'|'general'|'security'|'feedback'|'help'|'about'|'faq'|'guidelines'|'safety'|'privacy'|'terms'|'system'|'interactions'>(props.initial||'settings')
const toastKeys=['visibilitySaved','loadFailed','saveFailed','cacheDeleted','cacheCleared','cacheFailed','feedbackHistoryFailed'] as const
const feedbackReference='Feedback sent. Reference:'
function translateToast(message:string){
 const key=toastKeys.find(key=>englishText(key)===message)
 if(key)return t(key)
 if(message.startsWith(feedbackReference))return tr(feedbackReference)+message.slice(feedbackReference.length)
 return tr(message)
}
const confirm=ref(false),toast=ref(''),busy=ref(false)
type Card={id:string;position:number;visibility:'everyone'|'friends'|'only_me'}
const cards=ref<Card[]>([]),selected=ref<Card>(),choice=ref<Card['visibility']>('everyone')
const globalProfile=ref<{visibility:Card['visibility']}>(),globalSelected=ref(false)
async function saveGlobalVisibility(){if(busy.value)return;busy.value=true;toast.value='';try{globalProfile.value=await api('/profiles/me',{method:'PATCH',headers:{Authorization:`Bearer ${props.token}`,'Content-Type':'application/json'},body:JSON.stringify({visibility:choice.value})});globalSelected.value=false;toast.value=englishText('visibilitySaved')}catch{toast.value=englishText('saveFailed')}finally{busy.value=false}}
onMounted(()=>{if(props.privacy)void openPrivacy()})
const scopes=['everyone','friends','only_me'] as const
const hapticsAvailable=ref(typeof navigator.vibrate==='function')
async function openPrivacy(){view.value='privacySettings';busy.value=true;toast.value='';try{globalProfile.value=await api('/profiles/me',{headers:{Authorization:`Bearer ${props.token}`}});cards.value=(await api<{items:Card[]}>('/users/me/image-cards',{headers:{Authorization:`Bearer ${props.token}`}})).items}catch{toast.value=englishText('loadFailed')}finally{busy.value=false}}
async function saveVisibility(){if(!selected.value||busy.value)return;busy.value=true;toast.value='';try{const updated=await api<Card>(`/users/me/image-cards/${selected.value.id}`,{method:'PATCH',headers:{Authorization:`Bearer ${props.token}`,'Content-Type':'application/json'},body:JSON.stringify({visibility:choice.value})});cards.value=cards.value.map(c=>c.id===updated.id?updated:c);selected.value=undefined;toast.value=englishText('visibilitySaved')}catch{toast.value=englishText('saveFailed')}finally{busy.value=false}}
function openPage(page:typeof view.value){toast.value='';if(page==='security')emit('security');else if(page==='privacySettings')void openPrivacy();else view.value=page}
function haptic(){if(preferences.value.haptics&&hapticsAvailable.value&&!navigator.vibrate(15))hapticsAvailable.value=false}
const defaults={notifications:true,incoming:true,replies:true,system:true,haptics:true,recommendations:true,systemFont:false}
const preferences=ref({...defaults,...JSON.parse(localStorage.getItem('maugo-settings')||'{}')})
watch(preferences,v=>{localStorage.setItem('maugo-settings',JSON.stringify(v));document.documentElement.classList.toggle('system-font',v.systemFont)},{deep:true,flush:'sync'})
const categories=['incoming','replies','system'] as const
const generalItems=['haptics','recommendations','systemFont'] as const
const pages=[['security','08-interface-icons/icon-lock-lime-22'],['privacySettings','08-interface-icons/icon-shield-lime-22'],['notifications','08-interface-icons/icon-bell-lime-22'],['general','08-interface-icons/icon-settings-light-24'],['language','08-interface-icons/icon-globe-lime-22'],['feedback','08-interface-icons/icon-feedback-lime-22'],['help','08-interface-icons/icon-help-lime-22'],['about','08-interface-icons/icon-info-lime-22']] as const

const supportTitles={help:'Help & support',feedback:'Feedback',about:'About MauGo',faq:'Help centre',guidelines:'Community guidelines',safety:'Safety guide',privacy:'Privacy information',terms:'Terms of Use & EULA',system:'System messages',interactions:'Interactions'}
const supportParent=ref<typeof view.value>('settings')
function supportPage(page:typeof view.value){supportParent.value=view.value;openPage(page)}
const feedbackText=ref(''),feedbackEmail=ref(''),feedbackType=ref('Suggestion')
type FeedbackEntry={id:string;content:string;status:'new'|'in_progress'|'resolved';createdAt:string}
const feedbackHistory=ref<FeedbackEntry[]>([]),feedbackRevision=ref(0)
const feedbackStatus={new:'feedbackStatusNew',in_progress:'feedbackStatusInProgress',resolved:'feedbackStatusResolved'} as const
function feedbackDate(createdAt:string){
 return new Date(createdAt).toLocaleString(locale.value==='ko'?'ko-KR':'en-US')
}
watch([view,()=>props.token,feedbackRevision],async([page,token],previous,onCleanup)=>{
 if(token!==previous[1])feedbackHistory.value=[]
 if(page!=='feedback')return
 let current=true
 onCleanup(()=>{current=false})
 try{
  const history=await api<{items:FeedbackEntry[]}>('/feedback/mine',{headers:{Authorization:`Bearer ${token}`}})
  if(current)feedbackHistory.value=history.items
 }catch{
  if(current&&!toast.value)toast.value=englishText('feedbackHistoryFailed')
 }
})
async function saveFeedback(){
 if(busy.value||!feedbackText.value.trim())return
 busy.value=true
 toast.value=''
 try{
  await nextTick()
  if(feedbackEmail.value&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(feedbackEmail.value.trim())){toast.value='Enter a valid email address.';return}
  const result=await post<{id:string;status:string}>('/feedback',{content:feedbackText.value.trim(),type:feedbackType.value,contact:feedbackEmail.value.trim()},props.token)
  feedbackText.value='';feedbackEmail.value=''
  toast.value=`Feedback sent. Reference: ${result.id} · ${result.status}`
  feedbackRevision.value++
 }catch(e){toast.value=e instanceof ApiError&&e.status===429?'Feedback limit reached. Try again in an hour.':'Feedback could not be sent. Please try again.'}finally{busy.value=false}
}
const title=computed(()=>view.value in supportTitles?tr(supportTitles[view.value as keyof typeof supportTitles]):t(view.value as Parameters<typeof t>[0]))
function back(){if(busy.value)return;if(globalSelected.value){globalSelected.value=false;return}if(selected.value){selected.value=undefined;return}if(confirm.value)confirm.value=false;else if(props.initial&&view.value===props.initial)emit('close');else if(view.value==='settings')emit('close');else{view.value=['faq','guidelines','safety','privacy','terms','system','interactions'].includes(view.value)?supportParent.value:'settings';toast.value=''}}
async function cleared(){busy.value=true;toast.value='';try{const keys='caches' in window?await caches.keys():[];const temporary=keys.filter(k=>k.startsWith('maugo-temp-'));await Promise.all(temporary.map(k=>caches.delete(k)));confirm.value=false;toast.value=englishText(temporary.length?'cacheDeleted':'cacheCleared')}catch{toast.value=englishText('cacheFailed')}finally{busy.value=false}}
</script>
<template>
<section class="settings-flow" :class="{'support-flow':view in supportTitles}" :data-page="view" @click="haptic" @keydown.esc.stop="back">
<header class="ui-header"><button class="ui-header__back" id="settings-back" :aria-label="t('back')" @click="back"><img :src="asset('08-interface-icons/icon-chevron-left-light-settings-22')" alt=""></button><h1>{{title}}</h1><span></span></header>
<UiToast :message="toast" @expired="toast=''" :translate="translateToast" />
<Transition name="settings-page" mode="out-in"><div :key="view" class="settings-body">
<template v-if="view==='settings'"><div v-for="(group,index) in [pages.slice(0,3),pages.slice(3,5),pages.slice(5)]" :key="index" class="settings-group settings-main ui-card"><button v-for="[page,icon] in group" :key="page" :id="`${page}-settings`" class="settings-row ui-row" @click="openPage(page)"><img :src="asset(page==='general'?'08-interface-icons/icon-settings-lime-22':icon)" alt=""><span>{{t(page)}}</span><small v-if="page==='language'">{{locale==='en'?'English':'한국어'}}</small><b aria-hidden="true"><img :src="asset('08-interface-icons/icon-chevron-right-muted-16')" alt=""></b></button></div></template>
<template v-else-if="view==='language'"><p>{{t('chooseLanguage')}}</p><div class="language-options"><button v-for="lang in ['en','ko'] as const" :key="lang" :data-language="lang" :aria-pressed="locale===lang" @click="locale=lang"><span>{{lang==='en'?'English':'한국어'}}</span><b>{{locale===lang?'✓':''}}</b></button></div></template>
<template v-else-if="view==='notifications'"><div class="settings-group ui-card"><label class="settings-row ui-row"><span>{{t('allowNotifications')}}</span><input id="allow-notifications" v-model="preferences.notifications" class="ui-switch" type="checkbox" role="switch"></label><label v-for="item in categories" :key="item" class="settings-row ui-row" :class="{'category-disabled':!preferences.notifications}"><span>{{t(item)}}</span><input :id="`${item}-notifications`" v-model="preferences[item]" class="ui-switch" type="checkbox" role="switch" :disabled="!preferences.notifications"></label></div></template>
<template v-else-if="view==='privacySettings'"><button v-if="globalProfile" id="global-profile-visibility" class="settings-row ui-row" :disabled="busy" @click="globalSelected=true;choice=globalProfile.visibility;toast=''"><span>{{tr('Profile visibility')}}</span><small>{{t(globalProfile.visibility)}}</small><b>›</b></button><p>{{t('visibilityScope')}}</p><p v-if="busy" role="status">{{t('loading')}}</p><p v-else-if="!cards.length">{{t('noCards')}}</p><div class="settings-group ui-card"><button v-for="card in cards" :key="card.id" :id="card===cards[0]?'profile-visibility':undefined" class="settings-row ui-row" :disabled="busy" @click="selected=card;choice=card.visibility;toast='' "><span>{{t('imageCard')}} {{card.position+1}}</span><small>{{t(card.visibility)}}</small><b>›</b></button></div></template>
<template v-else-if="view==='help'">
<section class="support-services"><h2>{{tr('Self service')}}</h2><div class="support-grid"><button id="help-centre" @click="supportPage('faq')"><img :src="asset('08-interface-icons/icon-help-lime-22')" alt=""><span>{{tr('Help centre')}}</span></button><button id="community-guidelines" @click="supportPage('guidelines')"><img :src="asset('08-interface-icons/icon-shield-lime-22')" alt=""><span>{{tr('Guidelines')}}</span></button><button id="safety-guide" @click="supportPage('safety')"><img :src="asset('08-interface-icons/icon-lock-lime-22')" alt=""><span>{{tr('Safety guide')}}</span></button><button id="help-delete" @click="emit('security')"><img :src="asset('08-interface-icons/icon-info-lime-22')" alt=""><span>{{tr('Delete account')}}</span></button></div></section>
<div class="support-message"><img :src="asset('02-bird-static/female-4')" alt=""><div><strong>{{tr('Hello, from MauGo.')}}</strong><p>{{tr('Find quick answers in Help centre, or leave your suggestions in Feedback.')}}</p><p>{{tr('Send feedback directly to the MauGo team.')}}</p><button v-for="[question] in faqs.slice(0,4)" :key="question" @click="supportPage('faq')">{{tr(question)}}</button></div></div>
<div class="support-bottom"><button id="support-feedback" @click="supportPage('feedback')">{{t('feedback')}}</button><button id="help-privacy" @click="supportPage('privacy')">{{tr('Privacy information')}}</button></div><p>{{tr('Support email')}}: {{supportEmail}} · {{tr('Pending Smith')}}</p>
</template>
<template v-else-if="view==='faq'"><div class="faq-list"><details v-for="[question,answer] in faqs" :key="question"><summary>{{tr(question)}}</summary><p>{{tr(answer)}}</p></details></div></template>
<template v-else-if="view==='feedback'">
<div class="feedback-types"><button v-for="kind in ['Suggestion','Bug','Experience','Other']" :key="kind" :aria-pressed="feedbackType===kind" @click="feedbackType=kind">{{tr(kind)}}</button></div><p>{{tr('Help make this little space better.')}}</p>
<form novalidate :aria-busy="busy" @submit.prevent="saveFeedback"><label class="support-field">{{tr('Your feedback')}}<textarea id="feedback-text" v-model="feedbackText" maxlength="2000" :disabled="busy" :placeholder="tr('What would you like us to improve?')"></textarea></label><label class="support-field">{{tr('Contact email (optional)')}}<input id="feedback-email" v-model="feedbackEmail" type="email" maxlength="200" :disabled="busy" :aria-invalid="toast==='Enter a valid email address.'"></label><button id="save-feedback" class="primary" :disabled="busy||!feedbackText.trim()">{{tr(busy?'Sending feedback…':'Send feedback')}}</button></form>
<ul v-if="feedbackHistory.length" class="feedback-history" :aria-label="t('feedback')">
 <li v-for="entry in feedbackHistory" :key="entry.id">
  <time :datetime="entry.createdAt">{{feedbackDate(entry.createdAt)}}</time>
  <p>{{entry.content}}</p>
  <small>{{t('feedbackReference')}} {{entry.id}} · {{t(feedbackStatus[entry.status])}}</small>
 </li>
</ul>
</template>
<template v-else-if="view==='about'"><div class="about-logo"><img :src="asset('01-brand-scenes/maugo-wordmark')" alt="MauGo"><p>{{tr('A little bird. A little story.')}}</p><small>Version 0.1.0</small></div><button v-for="page in ['guidelines','terms','privacy','help','system','interactions'] as const" :key="page" :id="`about-${page}`" class="settings-row ui-row" @click="supportPage(page)"><span>{{tr(supportTitles[page])}}</span><b>›</b></button><p>{{tr('Support email')}}: {{supportEmail}} · {{tr('Pending Smith')}}</p></template>
<template v-else-if="view==='guidelines'||view==='safety'"><article class="support-policy"><section v-for="[heading,copy] in guides[view]" :key="heading"><h2>{{tr(heading)}}</h2><p>{{tr(copy)}}</p></section></article></template>
<template v-else-if="view==='privacy'||view==='terms'"><article class="support-policy"><template v-if="view==='privacy'"><h2>{{tr('Privacy information')}}</h2><p>{{legalText.privacy[locale]}}</p></template><template v-else><p>{{tr(termsVersion)}}</p><section v-for="section in termsSections" :key="section.title"><h2>{{tr(section.title)}}</h2><p>{{tr(section.body)}}</p></section></template></article></template>
<template v-else-if="view==='system'||view==='interactions'"><div class="support-empty"><img :src="asset('01-brand-scenes/envelope')" alt=""><h2>{{t(view==='system'?'systemEmptyTitle':'interactionsEmptyTitle')}}</h2><p>{{t('aboutEmptyBody')}}</p></div></template>
<template v-else><div class="settings-group ui-card"><label v-for="item in generalItems" :key="item" class="settings-row ui-row"><span>{{t(item)}}</span><input :id="item" :disabled="item==='haptics'&&!hapticsAvailable" :checked="item==='haptics' ? hapticsAvailable&&preferences.haptics : preferences[item]" @change="preferences[item]=($event.target as HTMLInputElement).checked" class="ui-switch" type="checkbox" role="switch"></label><button id="clear-cache" class="settings-row ui-row" @click="confirm=true;toast=''"><span>{{t('clearCache')}}</span><b aria-hidden="true"><img :src="asset('08-interface-icons/icon-chevron-right-muted-16')" alt=""></b></button></div><p>{{t('hapticsNote')}}</p><p id="recommendations-status" role="status">{{t(preferences.recommendations?'recommendationsOn':'recommendationsOff')}}</p><p v-if="!hapticsAvailable">{{t('hapticsUnavailable')}}</p><p>{{t('cacheNote')}}</p></template>
</div></Transition>
<Transition name="settings-dialog"><div v-if="selected||globalSelected" class="settings-veil" @click.self="!busy&&(selected=undefined,globalSelected=false)"><section role="dialog" aria-modal="true" :aria-label="globalSelected?tr('Profile visibility'):t('profileVisibility')" class="settings-confirm settings-visibility"><h2>{{globalSelected?tr('Profile visibility'):t('profileVisibility')}}</h2><button v-for="scope in scopes" :key="scope" :data-visibility="scope" :aria-pressed="choice===scope" :disabled="busy" @click="choice=scope">{{t(scope)}} {{choice===scope?'✓':''}}</button><p>{{t('friendsNote')}}</p><button id="save-visibility" class="primary" :disabled="busy" @click="globalSelected?saveGlobalVisibility():saveVisibility()">{{t('save')}}</button><button :disabled="busy" @click="selected=undefined;globalSelected=false">{{t('cancel')}}</button></section></div></Transition>
<Transition name="settings-dialog"><div v-if="confirm" class="settings-veil" @click.self="!busy&&(confirm=false)"><section role="dialog" aria-modal="true" :aria-label="t('cacheConfirm')" class="settings-confirm settings-cache ui-dialog"><h2>{{t('cacheConfirm')}}</h2><p>{{t('cacheNote')}}</p><button id="confirm-clear-cache" class="primary ui-button" :disabled="busy" @click="cleared">{{t('clearCache')}}</button><button id="cancel-clear-cache" :disabled="busy" @click="confirm=false">{{t('cancel')}}</button></section></div></Transition>
</section>
</template>
<style scoped src="../styles/pages/settings.css"></style>

<style scoped src="../styles/pages/support.css"></style>
