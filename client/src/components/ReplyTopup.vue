<script setup lang="ts">
import {tr} from '../lib/i18n'
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
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
const confirmation=ref(false)
const selected=ref(0),notice=ref(''),panel=ref<HTMLElement>(),buying=ref(false)
const packs=ref<{id:string;diamonds:number;label:string;price?:string}[]>([])
const currentBalance=ref(props.balance)
const auth=()=>({Authorization:`Bearer ${props.token}`})

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
function leave(){if(confirmation.value){confirmation.value=false;return}if(paid)emit('funded');else emit('back')}
watch(confirmation,async value=>{await nextTick();if(value)document.querySelector<HTMLElement>('.reply-purchase-overlay button')?.focus();else panel.value?.querySelectorAll<HTMLElement>('.reply-pack')[selected.value]?.focus()})
const restore=document.activeElement as HTMLElement
// The first server snapshot is the opening baseline; the parent may have a stale balance.
let openingBalance:number|undefined
let checking=false,closed=false,paid=false
async function checkBalance(){
 if(checking)return
 checking=true
 try{const w=await api<{diamonds:number}>('/wallet',{headers:auth()})
 currentBalance.value=w.diamonds
 if(openingBalance===undefined){openingBalance=w.diamonds;return}
 if(!closed&&!buying.value&&!paid&&w.diamonds>openingBalance&&w.diamonds>=(props.required??0)){closed=true;emit('funded')}
 }catch{if(!closed)notice.value='Could not check balance. Return and try again.'}finally{checking=false}
}
const timer=setInterval(checkBalance,1500)
function keyboard(e:KeyboardEvent){if(e.key==='Escape'){e.stopImmediatePropagation();leave()}if(e.key==='Tab'){const root=confirmation.value?document.querySelector('.reply-purchase-overlay'):panel.value;const a=Array.from(root?.querySelectorAll<HTMLButtonElement>('button')||[]).filter(e=>!e.disabled&&e.getClientRects().length);if(e.shiftKey&&document.activeElement===a[0]){e.preventDefault();a.at(-1)?.focus()}else if(!e.shiftKey&&document.activeElement===a.at(-1)){e.preventDefault();a[0]?.focus()}}}
onMounted(async()=>{void checkBalance();void loadProducts().then(retryUnfinished).catch(()=>{});document.addEventListener('keydown',keyboard,true);await nextTick();panel.value?.querySelector('button')?.focus()})
onUnmounted(()=>{closed=true;clearInterval(timer);document.removeEventListener('keydown',keyboard,true);restore?.focus()})
</script>
<style src="../styles/pages/wallet.css"></style>
<template>
<div v-if="confirmation" class="reply-purchase-overlay ui-scrim ui-scrim--dialog" @click.self="confirmation=false"><section class="reply-dialog ui-sheet ui-dialog" role="dialog" aria-modal="true" :aria-label="tr('Confirm purchase')"><h2>{{packs[selected]?.diamonds}} {{tr('diamonds')}}</h2><p>{{packs[selected]?.price||tr('Unavailable')}}</p><p>{{tr('Purchases are processed by the App Store. Diamonds are added after MauGo verifies the transaction; confirm your original operation after returning.')}}</p><button id="confirm-native-pack" class="ui-button" :disabled="buying" @click="confirmation=false;buy()">{{tr('Confirm purchase')}}</button><button class="ui-button ui-button--text" :disabled="buying" @click="confirmation=false">{{tr('Not now')}}</button></section></div>
<Transition name="d1-topup" appear><div class="reply-topup ui-sheet" :inert="confirmation" ref="panel" role="dialog" aria-modal="true" :aria-label="tr('Diamonds')">
<span class="ui-sheet__grabber" aria-hidden="true"></span><header class="reply-topup-heading"><button class="ui-icon-button reply-topup-close" @click="leave">{{tr("‹ Back to")}} {{tr(context||'replies')}}</button><h2>{{tr("Diamonds")}}</h2></header>
<div class="wallet-body"><img class="reply-diamond" :src="asset('01-brand-scenes/diamond')" alt=""><h3 class="reply-topup-description">{{tr("Diamonds for filters and extra replies.")}}</h3><p class="reply-balance">{{tr("Your balance ·")}} <strong>{{currentBalance}} {{tr("diamonds")}}</strong></p>
<div class="reply-packs"><button v-for="(pack,i) in packs" :key="pack.id" class="reply-pack" :aria-pressed="selected===i" @click="selected=i;notice='';confirmation=true"><span class="reply-pack-amount"><img class="reply-pack-icon" :src="asset('01-brand-scenes/diamond')" alt=""><strong class="reply-pack-value">{{pack.diamonds.toLocaleString('en-US')}}</strong></span><span class="reply-pack-bonus">{{tr(['Starter pack','+10% bonus','+20% bonus','+30% bonus'][i]||'')}}</span><small class="reply-pack-description">{{tr(pack.label)}}</small><b class="reply-pack-price">{{pack.price??tr('Unavailable')}}</b></button></div>
<button v-if="packs[selected]" id="confirm-pack" class="ui-button reply-buy" :disabled="buying" @click="confirmation=true">{{tr(buying?'Processing…':'Get')}} {{tr(packs[selected]!.diamonds)}} {{tr("diamonds")}}{{packs[selected]!.price?' · '+packs[selected]!.price:''}}</button>
<p v-if="notice" role="status">{{tr(notice)}}</p><p class="reply-topup-note">{{tr("Purchases are processed by the App Store. Diamonds are added after MauGo verifies the transaction; confirm your original operation after returning.")}}</p><button class="ui-button ui-button--text reply-back" @click="leave">{{tr("Back to")}} {{tr(context||'replies')}}</button>
</div></div></Transition>
</template>
