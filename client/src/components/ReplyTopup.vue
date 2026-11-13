<script setup lang="ts">
import {tr} from '../lib/i18n'
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { api } from '../lib/api'
import { asset } from '../lib/assets'
import { Capacitor, registerPlugin } from '@capacitor/core'
type Signed={signedTransaction:string;transactionId:string}
// Native StoreKit 2 bridge: client/ios/App/App/StoreKitPlugin.swift
const StoreKit=registerPlugin<{
 getProducts(o:{ids:string[]}):Promise<{products:{id:string;displayPrice:string}[]}>
 purchase(o:{productId:string;appAccountToken:string}):Promise<{state:'purchased'|'cancelled'|'pending'}&Partial<Signed>>
 unfinished():Promise<{transactions:(Signed&{appAccountToken:string})[]}>
 finish(o:{transactionId:string}):Promise<void>
}>('StoreKit')
const store=Capacitor.isPluginAvailable('StoreKit')
const props=defineProps<{balance:number;token:string;userId:string;required?:number;context?:string}>()
const emit=defineEmits<{back:[];funded:[]}>()
const selected=ref(0),notice=ref(''),panel=ref<HTMLElement>(),buying=ref(false)
const packs=ref<{id:string;diamonds:number;label:string;price?:string}[]>([])
const currentBalance=ref(props.balance)
const auth=()=>({Authorization:`Bearer ${props.token}`})
async function loadWallet(){try{currentBalance.value=(await api<{diamonds:number}>('/wallet',{headers:auth()})).diamonds}catch(e){notice.value=(e as Error).message}}
async function loadProducts(){try{
 const {products}=await api<{products:{id:string;diamonds:number;label:string}[]}>('/payments/apple/products')
 const prices=store?(await StoreKit.getProducts({ids:products.map(p=>p.id)})).products:[]
 packs.value=products.map(p=>({...p,price:prices.find(s=>s.id===p.id)?.displayPrice}))
}catch(e){notice.value=(e as Error).message}}
// Diamonds come only from server verification. The transaction is finished only after it, so
// an unverified purchase stays unfinished and is resubmitted; the server credits each transaction once.
async function submit(t:Signed){
 const v=await api<{credited:number}>('/payments/apple/verify',{method:'POST',headers:{...auth(),'Content-Type':'application/json'},body:JSON.stringify({signedTransaction:t.signedTransaction}),signal:AbortSignal.timeout(30000)})
 paid=true
 await StoreKit.finish({transactionId:t.transactionId}).catch(()=>{})
 try{currentBalance.value=(await api<{diamonds:number}>('/wallet',{headers:auth()})).diamonds;notice.value=`Added ${v.credited} diamonds. Your balance is ${currentBalance.value} diamonds.`}
 catch{notice.value=`Added ${v.credited} diamonds. Could not refresh your balance. Return and check again.`}
}
async function retryUnfinished(){if(!store)return;for(const t of (await StoreKit.unfinished()).transactions)if(t.appAccountToken===props.userId.toLowerCase())await submit(t).catch(()=>{})}
async function buy(){
 const pack=packs.value[selected.value]
 if(!pack?.price){notice.value='In-app purchases are only available in the MauGo iOS app. No charge has been made.';return}
 if(buying.value)return
 buying.value=true;notice.value=''
 let charged=false
 try{
  const r=await StoreKit.purchase({productId:pack.id,appAccountToken:props.userId})
  if(r.state==='cancelled'){notice.value='Purchase cancelled. No charge has been made.';return}
  if(r.state==='pending'){notice.value='Purchase is pending approval. Diamonds will be added after it is approved.';return}
  charged=true
  await submit(r as Signed)
 }catch(e){notice.value=charged?`Payment received but not yet confirmed: ${(e as Error).message}. No diamonds were added yet; it will be retried next time you open Diamonds.`:`Purchase failed: ${(e as Error).message}. No charge has been made.`}
 finally{buying.value=false}
}
function leave(){if(paid)emit('funded');else emit('back')}
const restore=document.activeElement as HTMLElement
let checking=false,closed=false,paid=false
async function checkBalance(){
 if(checking)return
 checking=true
 try{const w=await api<{diamonds:number}>('/wallet',{headers:auth()})
 currentBalance.value=w.diamonds
 if(!closed&&!buying.value&&!paid&&w.diamonds>props.balance&&w.diamonds>=(props.required??0)){closed=true;emit('funded')}
 }catch{if(!closed)notice.value='Could not check balance. Return and try again.'}finally{checking=false}
}
const timer=setInterval(checkBalance,1500)
function keyboard(e:KeyboardEvent){if(e.key==='Escape'){e.stopImmediatePropagation();leave()}if(e.key==='Tab'){const a=Array.from(panel.value?.querySelectorAll<HTMLButtonElement>('button')||[]);if(e.shiftKey&&document.activeElement===a[0]){e.preventDefault();a.at(-1)?.focus()}else if(!e.shiftKey&&document.activeElement===a.at(-1)){e.preventDefault();a[0]?.focus()}}}
onMounted(async()=>{void loadWallet();void loadProducts().then(retryUnfinished).catch(()=>{});document.addEventListener('keydown',keyboard,true);await nextTick();panel.value?.querySelector('button')?.focus()})
onUnmounted(()=>{closed=true;clearInterval(timer);document.removeEventListener('keydown',keyboard,true);restore?.focus()})
</script>
<template>
<Transition name="d1-topup" appear><div class="d1-topup" ref="panel" role="dialog" aria-modal="true" :aria-label="tr('Diamonds')">
<header><button @click="leave">{{tr("‹ Back to")}} {{tr(context||'replies')}}</button><h2>{{tr("Diamonds")}}</h2></header>
<img class="d1-diamond" :src="asset('01-brand-scenes/diamond')" alt=""><h3>{{tr("Diamonds for filters and extra replies.")}}</h3><p>{{tr("Your balance ·")}} <strong>{{currentBalance}} {{tr("diamonds")}}</strong></p>
<div class="d1-packs"><button v-for="(pack,i) in packs" :key="pack.id" class="diamond-pack" :aria-pressed="selected===i" @click="selected=i;notice='' "><span class="pack-amount"><img :src="asset('01-brand-scenes/diamond')" alt=""><strong>{{pack.diamonds.toLocaleString('en-US')}}</strong></span><small>{{tr(pack.label)}}</small><b>{{pack.price??tr('Unavailable')}}</b></button></div>
<button v-if="packs[selected]" id="confirm-pack" class="primary" :disabled="buying" @click="buy">{{tr(buying?'Processing…':'Get')}} {{tr(packs[selected]!.diamonds)}} {{tr("diamonds")}}{{packs[selected]!.price?' · '+packs[selected]!.price:''}}</button>
<p v-if="notice" role="status">{{tr(notice)}}</p><p class="d1-topup-note">{{tr("Purchases are processed by the App Store. Diamonds are added after MauGo verifies the transaction; confirm your original operation after returning.")}}</p><button class="text-button" @click="leave">{{tr("Back to")}} {{tr(context||'replies')}}</button>
</div></Transition>
</template>
<style>
.d1-payment-overlay{display:grid!important;place-items:center;padding:24px;background:#030805c9!important;backdrop-filter:blur(8px)}.d1-payment-overlay .inbox-sheet{position:relative!important;inset:auto!important;border-radius:28px!important;width:100%;padding:28px 24px 16px!important;background:linear-gradient(145deg,#253229,#17221c)!important;border:1px solid #d5eac51a;box-shadow:0 28px 80px #0009;text-align:center}.d1-payment-overlay .inbox-sheet header{justify-content:center}.d1-payment-overlay .inbox-sheet header>button{position:absolute;right:8px;top:8px}.d1-payment-overlay h2{font-size:22px}.d1-payment-overlay p{font-size:12px;line-height:20px;color:#a1b29f}.d1-payment-symbol img{width:88px;height:80px;object-fit:contain;animation:d1-float 3s ease-in-out infinite}.d1-payment-overlay .primary{width:100%;border-radius:24px}.d1-payment-overlay .text-button{width:100%;height:44px}.d1-payment-overlay .payment-summary{margin:20px 0 24px;padding:16px;background:#0e181566;border:1px solid #ffffff08;border-radius:16px;display:grid;gap:16px}.d1-payment-overlay .payment-summary>div{display:flex;justify-content:space-between;font-size:11px;color:#95a792}.d1-payment-overlay .payment-summary strong{color:#e2eadc;font-size:12px}

.d1-topup{position:absolute;inset:0;z-index:70;background:radial-gradient(ellipse at 50% 5%,#354041,#101717 60%);color:#f7f4ec;padding:54px 22px 35px;overflow:auto;text-align:center}.d1-topup header{text-align:left}.d1-topup header button{background:none;border:0;color:#eee;font-size:14px}.d1-topup h2{font-size:25px;margin:24px 0}.d1-topup h3{font-size:25px;margin:8px}.d1-diamond{width:78px;animation:d1-float 3s ease-in-out infinite}.d1-packs{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:28px 0}.diamond-pack{border:1px solid #ffffff1a;border-radius:18px;background:#ffffff08;color:inherit;display:flex;align-items:center;flex-direction:column;gap:7px;padding:18px 8px;transition:background .2s,border-color .2s,box-shadow .2s,transform .25s var(--ease-out),scale .16s var(--ease-out);animation:rise-in .4s var(--ease-out) both}.diamond-pack:nth-child(2){animation-delay:50ms}.diamond-pack:nth-child(3){animation-delay:100ms}.diamond-pack:nth-child(4){animation-delay:150ms}.diamond-pack[aria-pressed=true]{border-color:#b5fa70;background:#b5fa7014;box-shadow:0 10px 30px #b5fa7018;transform:translateY(-3px)}.diamond-pack img{width:32px}.diamond-pack strong{font-size:23px;font-weight:600}.diamond-pack b{color:#d9f7b8;font-weight:500}.diamond-pack small{color:#bac4bf}.d1-topup>.primary{width:100%}.d1-topup-note{font-size:12px;color:#b8c0b9;line-height:1.6}.d1-topup-enter-active,.d1-topup-leave-active{transition:transform .3s,opacity .3s}.d1-topup-enter-from,.d1-topup-leave-to{transform:translateY(30px);opacity:0}.d1-receipt{position:absolute;bottom:95px;left:20px;right:20px;background:#e5edab;color:#18201c;padding:14px;border-radius:16px;z-index:5;animation:d1-receipt .35s ease-out}@keyframes d1-float{50%{transform:translateY(-7px)}}@keyframes d1-receipt{from{opacity:0;transform:translateY(12px)}}@media(prefers-reduced-motion:reduce){.d1-diamond,.diamond-pack{animation:none}}
</style>
