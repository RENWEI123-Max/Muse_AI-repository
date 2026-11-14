<script setup lang="ts">
import {computed,onMounted,onUnmounted,ref,watch} from 'vue'
import {api,post} from '../lib/api'
import {asset} from '../lib/assets'
import {tr,locale} from '../lib/i18n'

// Presentation dictionary only; account state and operations below are unchanged.
const accountKo:Record<string,string>={
  "Account": "계정",
  "Account & security": "계정 및 보안",
  "App lock": "앱 잠금",
  "Identity verification": "본인 인증",
  "Delete account": "계정 삭제",
  "Email": "이메일",
  "On": "켜짐",
  "Off": "꺼짐",
  "Lock now": "지금 잠그기",
  "Export my data": "내 데이터 내보내기",
  "Sign out": "로그아웃",
  "Your account is connected securely. App lock protects this device session and is not account authentication.": "계정이 안전하게 연결되어 있어요. 앱 잠금은 이 기기의 세션을 보호하며 계정 인증이 아니에요.",
  "Email address": "이메일 주소",
  "Sign-in method": "로그인 방식",
  "Account type": "계정 유형",
  "MauGo account": "MauGo 계정",
  "Switch account": "계정 전환",
  "A face behind a little bird.": "작은 새 뒤에 있는 당신.",
  "Identity verification is not connected. No photo or biometric data is collected here.": "본인 인증 서비스가 연결되지 않았어요. 여기서는 사진이나 생체 정보를 수집하지 않아요.",
  "Verification service": "인증 서비스",
  "Not connected": "연결되지 않음",
  "Back to security": "보안으로 돌아가기",
  "Before you leave": "떠나기 전에",
  "Your current account and its data will be permanently removed. Other accounts are kept.": "현재 계정과 데이터가 영구 삭제돼요. 다른 계정은 유지돼요.",
  "Your profile, letters, messages, uploads and diamonds will be permanently removed.": "프로필, 편지, 메시지, 업로드 및 다이아몬드가 영구 삭제돼요.",
  "This cannot be undone. Export your data first if you want a copy.": "이 작업은 되돌릴 수 없어요. 사본이 필요하면 먼저 데이터를 내보내세요.",
  "Type DELETE to continue": "계속하려면 DELETE를 입력하세요",
  "I understand that this deletion cannot be undone.": "이 삭제를 되돌릴 수 없음을 이해했어요.",
  "Keep my account": "내 계정 유지",
  "Welcome back": "다시 만나 반가워요",
  "Enter your PIN to unlock MauGo.": "MauGo 잠금을 해제하려면 PIN을 입력하세요.",
  "Enter your current PIN to turn off app lock.": "앱 잠금을 끄려면 현재 PIN을 입력하세요.",
  "Create a 4-digit PIN to lock this device session.": "이 기기 세션을 잠글 4자리 PIN을 만드세요.",
  "Unlock": "잠금 해제",
  "Turn off": "끄기",
  "Set PIN": "PIN 설정",
  "Device session only. This is not account authentication.": "기기 세션 전용이며 계정 인증이 아니에요.",
  "Sign out?": "로그아웃할까요?",
  "Signing out clears this account’s local drafts, preferences and chat appearance. Your language and App lock are kept.": "로그아웃하면 이 계정의 기기 내 초안, 환경설정 및 채팅 모양이 삭제돼요. 언어와 앱 잠금은 유지돼요.",
  "Delete this account?": "이 계정을 삭제할까요?",
  "Your current profile and its content will be permanently removed. This cannot be undone.": "현재 프로필과 콘텐츠가 영구 삭제돼요. 되돌릴 수 없어요.",
  "Confirm your password": "비밀번호 확인",
  "Cancel": "취소",
  "Enter a 4-digit PIN.": "4자리 PIN을 입력하세요.",
  "Incorrect PIN.": "PIN이 올바르지 않아요."
}
const accountText=(value:unknown)=>locale.value==='ko'?(accountKo[String(value)]??tr(value)):String(value??'')
const props=defineProps<{token:string;active:boolean}>()
const emit=defineEmits<{close:[];signedout:[];locking:[value:boolean]}>()
const view=ref('security'),sheet=ref(''),error=ref(''),busy=ref(false),pin=ref(''),typed=ref(''),understood=ref(false),password=ref(''),challenge=ref('')
const profile=ref<{id:string;email:string}>(),lock=ref<{salt:string;hash:string}|null>(null),locked=ref(false)
const headers=()=>({Authorization:`Bearer ${props.token}`})
watch(locked,value=>emit('locking',value),{flush:'sync'})
const lockKey=computed(()=>`maugo-lock-${profile.value?.id}`)
const title=computed(()=>({'security':'Account & security','account':'Account','verification':'Identity verification','delete':'Delete account'}[view.value]))
const ready=computed(()=>typed.value==='DELETE'&&understood.value)
async function act(work:()=>Promise<void>){if(busy.value)return;busy.value=true;error.value='';try{await work()}catch(e){error.value=(e as Error).message}finally{busy.value=false}}
async function hash(value:string,salt:string){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(salt+value));return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('')}
async function savePin(){await act(async()=>{if(!/^\d{4}$/.test(pin.value)){error.value='Enter a 4-digit PIN.';return}if(lock.value){if(await hash(pin.value,lock.value.salt)!==lock.value.hash){error.value='Incorrect PIN.';return}lock.value=null;localStorage.removeItem(lockKey.value)}else{const salt=crypto.randomUUID();lock.value={salt,hash:await hash(pin.value,salt)};localStorage.setItem(lockKey.value,JSON.stringify(lock.value))}sheet.value='';pin.value=''})}
async function unlock(){await act(async()=>{if(!lock.value||await hash(pin.value,lock.value.salt)!==lock.value.hash){error.value='Incorrect PIN.';return}locked.value=false;pin.value=''})}
function visibility(){if(document.hidden&&lock.value){locked.value=true;pin.value='';error.value=''}}
function back(){error.value='';if(locked.value)return;if(sheet.value){sheet.value='';password.value='';challenge.value=''}else if(view.value==='security')emit('close');else view.value='security'}
function openSheet(next:string){sheet.value=next;pin.value='';password.value='';error.value=''}
async function logout(){await act(async()=>{await post('/auth/logout',{},props.token);emit('signedout')})}
async function exportData(){await act(async()=>{const data=await api('/users/me/export',{headers:headers()});const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='maugo-export.json';a.click();URL.revokeObjectURL(url)})}
async function requestDeletion(){if(!ready.value)return;await act(async()=>{const r=await api<{deletionToken:string}>('/users/me',{method:'DELETE',headers:{...headers(),'Content-Type':'application/json'},body:JSON.stringify({confirm:true})});challenge.value=r.deletionToken;openSheet('delete')})}
async function deleteAccount(){if(!ready.value||!password.value||!challenge.value)return;await act(async()=>{await api('/users/me',{method:'DELETE',headers:{...headers(),'Content-Type':'application/json'},body:JSON.stringify({confirm:true,deletionToken:challenge.value,password:password.value})});localStorage.removeItem(lockKey.value);emit('signedout')})}
watch(()=>props.active,()=>{view.value='security';sheet.value='';error.value='';typed.value='';understood.value=false})
onMounted(()=>{document.addEventListener('visibilitychange',visibility);void act(async()=>{const data=await api<{profile:{id:string;email:string}}>('/users/me/export',{headers:headers()});profile.value=data.profile;lock.value=JSON.parse(localStorage.getItem(lockKey.value)||'null');locked.value=!!lock.value})})
onUnmounted(()=>document.removeEventListener('visibilitychange',visibility))
</script>
<template>
<section v-if="active||locked" class="account-security" :data-page="view" @keydown.esc.stop="back">
<header class="ui-header"><button class="ui-header__back" aria-label="Back" :disabled="locked" @click="back"><img :src="asset('08-interface-icons/icon-back-light-22')" alt=""></button><h1>{{accountText(locked?'App lock':title)}}</h1><span></span></header>
<Transition name="account-page" mode="out-in"><div :key="view" class="account-body" :inert="locked||!!sheet">
<template v-if="view==='security'">
<div class="account-group ui-card"><button class="ui-row" id="account-signin" @click="view='account'">{{accountText('Account')}}<small>{{accountText('Email')}} <b aria-hidden="true">›</b></small></button><button class="ui-row" id="app-lock" :disabled="!profile" @click="openSheet('pin')">{{accountText('App lock')}}<small>{{accountText(lock?'On':'Off')}} <b aria-hidden="true">›</b></small></button><button class="ui-row" v-if="lock" id="lock-now" @click="locked=true;pin='';error=''">{{accountText('Lock now')}}<small><b aria-hidden="true">›</b></small></button><button class="ui-row" id="identity-verification" @click="view='verification'">{{accountText('Identity verification')}}<small><b aria-hidden="true">›</b></small></button><button class="ui-row" id="export-data" :disabled="busy" @click="exportData">{{accountText('Export my data')}}<small><b aria-hidden="true">›</b></small></button><button id="delete-local" class="ui-row destructive" @click="view='delete'">{{accountText('Delete account')}}<small><b aria-hidden="true">›</b></small></button></div>
<p>{{accountText('Your account is connected securely. App lock protects this device session and is not account authentication.')}}</p><button id="logout" class="outline" @click="openSheet('logout')">{{accountText('Sign out')}}</button>
</template>
<template v-else-if="view==='account'"><div class="account-group ui-card"><div class="ui-row">{{accountText('Email address')}}<small id="account-email">{{profile?.email}}</small></div><div class="ui-row">{{accountText('Sign-in method')}}<small>{{accountText('Email')}}</small></div><div class="ui-row">{{accountText('Account type')}}<small>{{accountText('MauGo account')}}</small></div></div><button class="outline" @click="openSheet('logout')">{{accountText('Switch account')}}</button><button class="outline" @click="openSheet('logout')">{{accountText('Sign out')}}</button><button class="danger-link" @click="view='delete'">{{accountText('Delete account')}}</button></template>
<template v-else-if="view==='verification'"><img class="verification-bird" :src="asset('02-bird-static/male-1')" alt=""><h2>{{accountText('A face behind a little bird.')}}</h2><p>{{accountText('Identity verification is not connected. No photo or biometric data is collected here.')}}</p><div class="account-group ui-card"><div class="ui-row">{{accountText('Verification service')}}<small>{{accountText('Not connected')}}</small></div></div><button class="outline" @click="view='security'">{{accountText('Back to security')}}</button></template>
<template v-else><div class="deletion-intro"><span>⊘</span><h2>{{accountText('Before you leave')}}</h2><p>{{accountText('Your current account and its data will be permanently removed. Other accounts are kept.')}}</p></div><div class="deletion-summary"><p>{{accountText('Your profile, letters, messages, uploads and diamonds will be permanently removed.')}}</p><p>{{accountText('This cannot be undone. Export your data first if you want a copy.')}}</p></div><button class="outline" :disabled="busy" @click="exportData">{{accountText('Export my data')}}</button><label class="field">{{accountText('Type DELETE to continue')}}<input class="ui-input" id="delete-account-input" v-model="typed" autocomplete="off"></label><label class="deletion-check"><input id="delete-account-check" v-model="understood" type="checkbox"><span>{{accountText('I understand that this deletion cannot be undone.')}}</span></label><button id="request-account-deletion" class="ui-button primary danger" :disabled="!ready||busy" @click="requestDeletion">{{accountText('Delete account')}}</button><button class="keep" @click="view='security'">{{accountText('Keep my account')}}</button></template>
<p v-if="error&&!sheet&&!locked" role="alert">{{accountText(error)}}</p>
</div></Transition>
<Transition name="account-dialog"><div v-if="sheet||locked" class="account-veil" :class="{bottom:sheet==='pin'&&!locked}" @click.self="!locked&&!busy&&back()"><section class="account-dialog ui-dialog" :class="{'ui-sheet':sheet==='pin'&&!locked}" role="dialog" aria-modal="true" :aria-label="locked?'Welcome back':sheet==='pin'?'App lock':sheet==='logout'?'Sign out?':'Delete this account?'">
<template v-if="locked||sheet==='pin'"><span v-if="!locked" class="ui-sheet__grabber" aria-hidden="true"></span><h2>{{accountText(locked?'Welcome back':'App lock')}}</h2><p>{{accountText(locked?'Enter your PIN to unlock MauGo.':lock?'Enter your current PIN to turn off app lock.':'Create a 4-digit PIN to lock this device session.')}}</p><form @submit.prevent="locked?unlock():savePin()"><input class="ui-input" :id="locked?'unlock-pin':'lock-pin'" v-model="pin" type="password" inputmode="numeric" maxlength="4" autocomplete="off" aria-label="4-digit PIN" :aria-invalid="!!error"><button :id="locked?'unlock-session':'save-lock'" class="ui-button primary" :disabled="busy||!profile">{{accountText(locked?'Unlock':lock?'Turn off':'Set PIN')}}</button></form><p>{{accountText('Device session only. This is not account authentication.')}}</p></template>
<template v-else-if="sheet==='logout'"><h2>{{accountText('Sign out?')}}</h2><p>{{accountText('Signing out clears this account’s local drafts, preferences and chat appearance. Your language and App lock are kept.')}}</p><button id="confirm-logout" class="ui-button primary" :disabled="busy" @click="logout">{{accountText('Sign out')}}</button></template>
<template v-else><h2>{{accountText('Delete this account?')}}</h2><p>{{accountText('Your current profile and its content will be permanently removed. This cannot be undone.')}}</p><label class="field">{{accountText('Confirm your password')}}<input class="ui-input" id="deletion-password" v-model="password" type="password" autocomplete="current-password"></label><button id="confirm-account-deletion" class="ui-button primary danger" :disabled="busy||!password" @click="deleteAccount">{{accountText('Delete account')}}</button></template>
<p v-if="error" class="account-error" role="alert">{{accountText(error)}}</p><button v-if="!locked" class="keep" :disabled="busy" @click="back">{{accountText('Cancel')}}</button>
</section></div></Transition>
</section>
</template>
<style scoped src="../styles/pages/account.css"></style>
