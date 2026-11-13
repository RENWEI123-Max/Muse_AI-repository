<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { asset } from '../lib/assets'
defineProps<{balance:number}>()
const emit=defineEmits<{back:[]}>()
const selected=ref(0),notice=ref(''),panel=ref<HTMLElement>()
const packs=[{diamonds:100,price:'0.99',label:'A little boost'},{diamonds:550,price:'4.99',label:'Most popular'},{diamonds:1200,price:'9.99',label:'More possibilities'},{diamonds:2600,price:'19.99',label:'Best value'}]
const restore=document.activeElement as HTMLElement
function keyboard(e:KeyboardEvent){if(e.key==='Escape'){e.stopImmediatePropagation();emit('back')}if(e.key==='Tab'){const a=Array.from(panel.value?.querySelectorAll<HTMLButtonElement>('button')||[]);if(e.shiftKey&&document.activeElement===a[0]){e.preventDefault();a.at(-1)?.focus()}else if(!e.shiftKey&&document.activeElement===a.at(-1)){e.preventDefault();a[0]?.focus()}}}
onMounted(async()=>{document.addEventListener('keydown',keyboard,true);await nextTick();panel.value?.querySelector('button')?.focus()})
onUnmounted(()=>{document.removeEventListener('keydown',keyboard,true);restore?.focus()})
</script>
<template>
<Transition name="d1-topup" appear><div class="d1-topup" ref="panel" role="dialog" aria-modal="true" aria-label="Diamonds">
<header><button @click="emit('back')">‹ Back to replies</button><h2>Diamonds</h2></header>
<img class="d1-diamond" :src="asset('01-brand-scenes/diamond')" alt=""><h3>Your little boost</h3><p>Your balance · <strong>{{balance}} diamonds</strong></p>
<div class="d1-packs"><button v-for="(pack,i) in packs" :key="pack.diamonds" class="diamond-pack" :aria-pressed="selected===i" @click="selected=i;notice='' "><img :src="asset('01-brand-scenes/diamond')" alt=""><strong>{{pack.diamonds}}</strong><small>{{pack.label}}</small><b>${{pack.price}}</b></button></div>
<button id="confirm-pack" class="primary" @click="notice='Payments are not available yet. No charge has been made.'">Get {{packs[selected]!.diamonds}} diamonds · ${{packs[selected]!.price}}</button>
<p v-if="notice" role="status">{{notice}}</p><p class="d1-topup-note">After adding diamonds, return to your reply to confirm collection.</p><button class="text-button" @click="emit('back')">Back to replies</button>
</div></Transition>
</template>
<style>
.d1-payment-overlay{display:grid!important;place-items:center;padding:24px;background:#030805c9!important;backdrop-filter:blur(8px)}.d1-payment-overlay .inbox-sheet{position:relative!important;inset:auto!important;border-radius:28px!important;width:100%;padding:28px 24px 16px!important;background:linear-gradient(145deg,#253229,#17221c)!important;border:1px solid #d5eac51a;box-shadow:0 28px 80px #0009;text-align:center}.d1-payment-overlay .inbox-sheet header{justify-content:center}.d1-payment-overlay .inbox-sheet header>button{position:absolute;right:8px;top:8px}.d1-payment-overlay h2{font-size:22px}.d1-payment-overlay p{font-size:12px;line-height:20px;color:#a1b29f}.d1-payment-symbol img{width:88px;height:80px;object-fit:contain;animation:d1-float 3s ease-in-out infinite}.d1-payment-overlay .primary{width:100%;border-radius:24px}.d1-payment-overlay .text-button{width:100%;height:44px}.d1-payment-overlay .payment-summary{margin:20px 0 24px;padding:16px;background:#0e181566;border:1px solid #ffffff08;border-radius:16px;display:grid;gap:16px}.d1-payment-overlay .payment-summary>div{display:flex;justify-content:space-between;font-size:11px;color:#95a792}.d1-payment-overlay .payment-summary strong{color:#e2eadc;font-size:12px}

.d1-topup{position:absolute;inset:0;z-index:70;background:radial-gradient(ellipse at 50% 5%,#354041,#101717 60%);color:#f7f4ec;padding:54px 22px 35px;overflow:auto;text-align:center}.d1-topup header{text-align:left}.d1-topup header button{background:none;border:0;color:#eee;font-size:14px}.d1-topup h2{font-size:25px;margin:24px 0}.d1-topup h3{font-size:25px;margin:8px}.d1-diamond{width:78px;animation:d1-float 3s ease-in-out infinite}.d1-packs{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:28px 0}.diamond-pack{border:1px solid #69706b;border-radius:18px;background:#ffffff08;color:inherit;display:flex;align-items:center;flex-direction:column;gap:7px;padding:18px 8px;transition:background .2s,transform .2s}.diamond-pack[aria-pressed=true]{border-color:#e5edab;background:#e5edab18;transform:translateY(-3px)}.diamond-pack img{width:32px}.diamond-pack strong{font-size:23px}.diamond-pack small{color:#bac4bf}.d1-topup>.primary{width:100%}.d1-topup-note{font-size:12px;color:#b8c0b9;line-height:1.6}.d1-topup-enter-active,.d1-topup-leave-active{transition:transform .3s,opacity .3s}.d1-topup-enter-from,.d1-topup-leave-to{transform:translateY(30px);opacity:0}.d1-receipt{position:absolute;bottom:95px;left:20px;right:20px;background:#e5edab;color:#18201c;padding:14px;border-radius:16px;z-index:5;animation:d1-receipt .35s ease-out}@keyframes d1-float{50%{transform:translateY(-7px)}}@keyframes d1-receipt{from{opacity:0;transform:translateY(12px)}}@media(prefers-reduced-motion:reduce){.d1-diamond{animation:none}}
</style>
