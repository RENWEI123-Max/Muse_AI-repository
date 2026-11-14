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
<Transition name="d1-topup" appear><div class="reply-topup ui-sheet" ref="panel" role="dialog" aria-modal="true" :aria-label="tr('Diamonds')">
<span class="ui-sheet__grabber" aria-hidden="true"></span><header class="reply-topup-heading"><button class="ui-icon-button reply-topup-close" @click="leave">{{tr("‹ Back to")}} {{tr(context||'replies')}}</button><h2>{{tr("Diamonds")}}</h2></header>
<img class="reply-diamond" :src="asset('01-brand-scenes/diamond')" alt=""><h3 class="reply-topup-description">{{tr("Diamonds for filters and extra replies.")}}</h3><p class="reply-balance">{{tr("Your balance ·")}} <strong>{{currentBalance}} {{tr("diamonds")}}</strong></p>
<div class="reply-packs"><button v-for="(pack,i) in packs" :key="pack.id" class="reply-pack" :aria-pressed="selected===i" @click="selected=i;notice='' "><span class="reply-pack-amount"><img class="reply-pack-icon" :src="asset('01-brand-scenes/diamond')" alt=""><strong class="reply-pack-value">{{pack.diamonds.toLocaleString('en-US')}}</strong></span><span class="reply-pack-bonus">{{tr(['Starter pack','+10% bonus','+20% bonus','+30% bonus'][i]||'')}}</span><small class="reply-pack-description">{{tr(pack.label)}}</small><b class="reply-pack-price">{{pack.price??tr('Unavailable')}}</b></button></div>
<button v-if="packs[selected]" id="confirm-pack" class="ui-button reply-buy" :disabled="buying" @click="buy">{{tr(buying?'Processing…':'Get')}} {{tr(packs[selected]!.diamonds)}} {{tr("diamonds")}}{{packs[selected]!.price?' · '+packs[selected]!.price:''}}</button>
<p v-if="notice" role="status">{{tr(notice)}}</p><p class="reply-topup-note">{{tr("Purchases are processed by the App Store. Diamonds are added after MauGo verifies the transaction; confirm your original operation after returning.")}}</p><button class="ui-button ui-button--text reply-back" @click="leave">{{tr("Back to")}} {{tr(context||'replies')}}</button>
</div></Transition>
</template>

<style src="../styles/pages/reply.css"></style>
