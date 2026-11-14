<script setup lang="ts">
import {legalText,termsVersion,termsSections} from '../lib/support-content'
import {tr,locale} from '../lib/i18n'
import { computed, nextTick, onUnmounted, ref } from 'vue'
import { ApiError, post } from '../lib/api'
import PageTransition from './PageTransition.vue'
import { asset } from '../lib/assets'
const props = defineProps<{initial: string}>()
const emit = defineEmits<{back: []; signedout: []; authenticated: [token:string, account:string]}>()
const target = ref(props.initial === 'create' ? 'signup' : props.initial === 'apple' ? 'apple' : 'signin')
const route = new URLSearchParams(location.search).get('auth')
const mode = ref(['terms','privacy'].includes(props.initial) ? props.initial : 'consent')
if (route && ['signin','signup','forgot','verify','recovery','password','apple','privacy','consent'].includes(route)) mode.value = route === 'recovery' ? 'verify' : route
const accepted = ref(false), email = ref(new URLSearchParams(location.search).get('email') || ''), name = ref(''), password = ref(''), confirm = ref(''), code = ref(''), show = ref(false), share = ref(false)
const error = ref(''), notice = ref(''), busy = ref(false), recovery = ref(route === 'recovery'), token = ref(''), account = ref(''), seconds = ref(0)
let deadline = 0
const timer = window.setInterval(() => { seconds.value = Math.max(0, Math.ceil((deadline - Date.now()) / 1000)) }, 250)
onUnmounted(() => clearInterval(timer))
const title = computed(() => ({consent:'Before you continue',signin:'Welcome back',signup:'Create your account',forgot:'Forgot your password?',verify:recovery.value?'Password recovery':'Verify your email',password:'Choose a new password',apple:'Apple sign-in',privacy:'Privacy information',terms:'Terms of Use & EULA',session:'Welcome to MauGo'}[mode.value]))
let returnMode: string | null = null
function go(next: string) {
 if (next === 'privacy' || next === 'terms') returnMode = mode.value
 mode.value = next; error.value = ''; notice.value = ''; password.value = ''; confirm.value = ''; code.value = ''
 nextTick(() => document.querySelector('.auth-flow')?.scrollTo(0, 0))
}
function back() {
 if (mode.value === 'privacy' || mode.value === 'terms') { if (returnMode) go(returnMode); else emit('back') }
 else if (mode.value === 'verify') go(recovery.value ? 'forgot' : 'signup')
 else if (mode.value === 'password') go('signin')
 else emit('back')
}
function validEmail() { if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {error.value='Enter a valid email address.';return false} return true }
async function request(work: () => Promise<void>) { if(busy.value)return; busy.value=true;error.value='';notice.value='';try {await work()} catch(e) {
 const err=e as ApiError
 if(err.retryAfter) {deadline=Date.now()+err.retryAfter*1000;seconds.value=err.retryAfter}
 error.value=err.status===503 && /SMTP/i.test(err.message)?'Email delivery is unavailable. Please try again later.':err.status===401&&mode.value==='verify'?'Incorrect verification code. Please try again.':err.status===410?'Verification code expired. Please request a new code.':err.message || 'Cannot connect to the server. Please try again later.'
 } finally {busy.value=false} }
async function sendCode() { if(!validEmail())return; await request(async()=> {const r=await post<{sent:boolean;retryAfter:number}>('/auth/code/send',{email:email.value.trim()});if(r.sent){deadline=Date.now()+60000;seconds.value=60;notice.value='Verification email sent.'}}) }
async function submit() {
 error.value=''
 if(mode.value!=='password'&&!validEmail())return
 if(mode.value==='forgot') {recovery.value=true;go('verify');await sendCode();return}
 if(mode.value==='signup'&&!name.value.trim()){error.value='Enter a nickname.';return}
 if(password.value.length<8||password.value.length>128||!/[A-Za-z]/.test(password.value)||!/[0-9\W]/.test(password.value)){error.value='Use at least 8 characters, with a letter and a number or symbol.';return}
 if(['signup','password'].includes(mode.value)&&password.value!==confirm.value){error.value='Passwords do not match.';return}
 if(mode.value==='password'){error.value='Password reset is not connected yet. Your password has not been changed.';return}
 if(!accepted.value){target.value=mode.value;go('consent');return}
 await request(async()=>{const signup=mode.value==='signup';const r=await post<{id:string;token:string}>('/auth/'+(signup?'signup':'login'),{email:email.value.trim(),password:password.value,...(signup?{confirmPassword:confirm.value}:{}),termsVersion:'1.0',privacyVersion:'1.0'});token.value=r.token;account.value=r.id;password.value='';confirm.value='';if(signup){recovery.value=false;go('verify');}else go('session')})
 if(mode.value==='verify')await sendCode()
}
async function verify() {error.value='';if(!/^\d{6}$/.test(code.value)){error.value='Enter a 6-digit code.';return}if(!validEmail())return;await request(async()=>{const r=await post<{verified:boolean}>('/auth/code/verify',{email:email.value.trim(),code:code.value});if(r.verified)go(recovery.value?'password':'session')})}
async function apple(cancelled=false) {await request(async()=>{const result=await post<{cancelled?:boolean}>('/auth/apple',cancelled?{cancelled:true}:{});if(result.cancelled)emit('back');else error.value='Apple sign-in did not complete. No session was issued.'})}
async function logout(){await request(async()=>{await post('/auth/logout',{},token.value);token.value='';emit('signedout')})}
</script>
<template>
<div class="auth-flow" :data-auth-mode="mode"><button class="ui-icon-button ui-icon-button--auth-back back" :aria-label="tr('Back')" @click="back">{{tr("‹ Back")}}</button>
<PageTransition><section :key="mode" class="flow-content"><h1>{{ tr(title) }}</h1>
<template v-if="['consent','terms','privacy'].includes(mode)"><p class="auth-copy">{{tr(mode==='privacy'?'How MauGo handles your information.':'Read the terms before registering or signing in.')}}</p><article v-if="mode!=='privacy'" class="terms-scroll terms-document" tabindex="0"><slot name="legal" /><article class="policy-copy terms-document"><p>{{tr(termsVersion)}}</p><section v-for="section in termsSections" :key="section.title"><h2>{{tr(section.title)}}</h2><p>{{tr(section.body)}}</p></section></article></article><p v-if="mode==='privacy'" class="privacy-copy">{{legalText.privacy[locale]}}</p><button v-if="mode==='privacy'" class="ui-button ui-button--auth auth-privacy-back" @click="back">{{tr("Back")}}</button><template v-if="mode==='consent'"><label class="terms-check"><input class="ui-auth-checkbox" id="accept-terms" v-model="accepted" type="checkbox"><span>{{tr("I have read and agree to the Terms of Use and EULA.")}}</span></label><button id="terms-continue" class="ui-button ui-button--auth auth-main" :disabled="!accepted" @click="go(target)">{{tr("Agree & continue")}}</button><button class="ui-auth-text auth-preview" @click="emit('back')">{{tr("Not now")}}</button><button class="ui-auth-text auth-link" @click="go('privacy')">{{tr("Privacy information")}}</button></template></template>
<template v-else-if="['signin','signup','forgot','password'].includes(mode)"><p class="auth-copy">{{tr(mode==='signup'?'A kind space starts with a little hello.':mode==='forgot'?'Enter your email to recover your password.':mode==='password'?'Use a new password you have not used before.':'Your little corner is waiting for you.')}}</p><form id="auth-form" novalidate @submit.prevent="submit"><label v-if="mode==='signup'" class="field-label">{{tr("Nickname")}}<input class="ui-input ui-input--auth" id="auth-name" v-model="name" maxlength="24" autocomplete="nickname"></label><label v-if="mode!=='password'" class="field-label">{{tr("Email address")}}<input class="ui-input ui-input--auth" id="auth-email" v-model="email" type="email" inputmode="email" autocomplete="email" maxlength="254"></label><label v-if="mode!=='forgot'" class="field-label">{{tr(mode==='password'?'New password':'Password')}}<input class="ui-input ui-input--auth" id="auth-password" v-model="password" :type="show?'text':'password'" :autocomplete="mode==='signin'?'current-password':'new-password'" maxlength="128"></label><label v-if="['signup','password'].includes(mode)" class="field-label">{{tr("Confirm password")}}<input class="ui-input ui-input--auth" id="auth-confirm" v-model="confirm" :type="show?'text':'password'" autocomplete="new-password" maxlength="128"></label><label v-if="mode!=='forgot'" class="show-password"><input class="ui-auth-checkbox" v-model="show" type="checkbox">{{tr("Show password")}}</label><p v-if="['signup','password'].includes(mode)" class="password-hint">{{tr("At least 8 characters, with a letter and a number or symbol.")}}</p><button v-if="mode==='signin'" type="button" class="ui-auth-text auth-link" @click="go('forgot')">{{tr("Forgot password?")}}</button><button class="ui-button ui-button--auth auth-main" :disabled="busy">{{tr(busy?'Please wait…':mode==='signup'?'Create account':mode==='forgot'?'Continue':mode==='password'?'Update password':'Sign in')}}</button></form><p v-if="['signin','signup'].includes(mode)" class="auth-switch">{{tr(mode==='signup'?'Already have an account?':'New here?')}} <button class="ui-auth-text" @click="go(mode==='signup'?'signin':'signup')">{{tr(mode==='signup'?'Sign in':'Create an account')}}</button></p><button v-if="mode==='signup'" class="ui-auth-text auth-policy" @click="go('privacy')">{{tr("Privacy information")}}</button><button v-if="!['signin','signup'].includes(mode)" class="ui-auth-text auth-preview" @click="go('signin')">{{tr("Back to sign in")}}</button></template>
<template v-else-if="mode==='verify'"><div class="mail-orbit"><img class="auth-mail-icon" :src="asset('11-symbol-icons/icon-mail-56-b5fa70')" alt=""></div><p class="auth-copy">{{tr("Email verification for:")}}</p><p class="auth-address">{{email}}</p><form id="code-form" novalidate @submit.prevent="verify"><label class="field-label">{{tr("6-digit code")}}<input class="ui-input ui-input--auth" id="auth-code" v-model="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]{6}" @input="code=code.replace(/\D/g,'')"></label><button class="ui-button ui-button--auth auth-main" :disabled="busy">{{tr("Verify & continue")}}</button></form><button id="resend-email" class="ui-auth-text auth-preview" :disabled="busy||seconds>0" @click="sendCode">{{tr("Resend code")}}{{tr(seconds>0?` (${seconds}s)`:'')}}</button><button class="ui-auth-text auth-preview" @click="go(recovery?'forgot':'signup')">{{tr("Use a different email")}}</button><button v-if="token" class="ui-auth-text auth-preview" @click="logout">{{tr("Sign out")}}</button></template>
<template v-else-if="mode==='apple'"><div class="apple-orbit">{{tr("Apple")}}</div><p class="auth-copy">{{tr("Apple sign-in requires native authorization and server configuration. The full flow is not connected yet.")}}</p><div class="auth-options"><button class="ui-row ui-row--auth-option" id="apple-hide" :aria-pressed="!share" @click="share=false">{{tr("Hide my email")}} <b>{{tr(!share?'✓':'')}}</b></button><button class="ui-row ui-row--auth-option" id="apple-share" :aria-pressed="share" @click="share=true">{{tr("Share my email")}} <b>{{tr(share?'✓':'')}}</b></button></div><p class="auth-address">{{tr(share?'Share my email':'Hide my email')}} {{tr("· Awaiting Apple authorization")}}</p><button class="ui-button ui-button--auth auth-main" :disabled="busy" @click="apple()">{{tr("Continue with Apple")}}</button><button class="ui-auth-text auth-preview" :disabled="busy" @click="emit('back')">{{tr("Cancel")}}</button></template>
<template v-else-if="mode==='session'"><div class="mail-orbit"><img :src="asset('11-symbol-icons/icon-sparkle-19-e5ffb3')" alt=""></div><p class="auth-copy">{{tr("You are signed in.")}}</p><p class="auth-address">{{email}}</p><button class="ui-button ui-button--auth" @click="emit('authenticated',token,account)">{{tr("Meet your letters")}}</button><button class="ui-auth-text auth-preview" :disabled="busy" @click="logout">{{tr("Sign out")}}</button></template>
<p v-if="error" id="auth-error" class="auth-error" role="alert">{{tr(error)}}</p><p v-if="notice" role="status" class="auth-copy">{{tr(notice)}}</p>
</section></PageTransition></div>
</template>
