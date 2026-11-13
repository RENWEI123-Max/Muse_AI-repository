<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import LettersFlow, { type Letter } from './LettersFlow.vue'
import { api } from '../lib/api'
import { asset } from '../lib/assets'
const props=defineProps<{token:string}>()
const emit=defineEmits<{signin:[]}>()
type Pass={active:boolean;expiresAt:string|null;remainingDays:number;plans:{days:number;diamonds:number}[]}
const sheet=ref(''),error=ref(''),busy=ref(false),items=ref<Letter[]>([]),responses=ref<{openingMessageId:string}[]>([]),detail=ref<Letter>(),loaded=ref(false)
const pass=ref<Pass>({active:false,expiresAt:null,remainingDays:0,plans:[]}), now=ref(Date.now()),cities=ref<string[]>([])
const active=computed(()=>pass.value.active&&!!pass.value.expiresAt&&new Date(pass.value.expiresAt).getTime()>now.value)
const days=computed(()=>active.value?Math.ceil((new Date(pass.value.expiresAt!).getTime()-now.value)/86400000):0)
const gender=ref(''),city=ref(''),min=ref(18),max=ref(50),ageSet=ref(false)
const filters=computed(()=>({...(gender.value?{gender:gender.value}:{}),...(active.value&&city.value?{city:city.value}:{}),...(active.value&&ageSet.value?{minAge:min.value,...(max.value<50?{maxAge:max.value}:{})}:{})}))
const birdGender=ref('female'),variant=ref(1),motion=ref(true),trails=ref(true)
try{const p=JSON.parse(localStorage.getItem('maugo-bird')||'{}');if(['male','female'].includes(p.gender))birdGender.value=p.gender;if(Number.isInteger(p.variant)&&p.variant>=1&&p.variant<=9)variant.value=p.variant;motion.value=p.motion!==false;trails.value=p.trails!==false}catch{}
watch([birdGender,variant,motion,trails],()=>localStorage.setItem('maugo-bird',JSON.stringify({gender:birdGender.value,variant:variant.value,motion:motion.value,trails:trails.value})))
const variants=['Sky blue','Sunshine','Sage green','Soft lilac','Fresh mint','Sunset peach','Blueberry blush','Pastel rainbow','Aurora']
const bird=computed(()=>asset(`02-bird-static/${birdGender.value}-${variant.value}`))
const flight=computed(()=>asset(`03-bird-flight-sheets/${birdGender.value}-${variant.value}-fly`))
const headers=()=>({Authorization:`Bearer ${props.token}`})
async function request<T>(path:string,body?:object,extra?:Record<string,string>){return api<T>(path,{method:body?'POST':'GET',headers:{...headers(),...(body?{'Content-Type':'application/json'}:{}),...extra},...(body?{body:JSON.stringify(body)}:{})})}
async function status(){const [p,f]=await Promise.all([request<Pass>('/filter-pass'),request<{cities:string[]}>('/discovery/filters')]);pass.value=p;cities.value=f.cities;now.value=Date.now()}
async function load(refresh=false){if(busy.value)return;if(!props.token){error.value='Sign in to meet your letters.';return}busy.value=true;error.value='';try{await status();const data=await request<{items:Letter[];responses:{openingMessageId:string}[];locked?:boolean}>(refresh?'/letters/refresh':`/letters?${new URLSearchParams(Object.entries(filters.value).map(([k,v])=>[k,String(v)]))}`,refresh?filters.value:undefined);if(data.locked){pass.value.active=false;city.value='';ageSet.value=false;throw new Error('Your Filter Pass has expired. Please try again.')}items.value=data.items;responses.value=data.responses||[];loaded.value=true}catch(e){error.value=(e as Error).message}finally{busy.value=false}}
async function openLetter(id:string){error.value='';try{detail.value=await request<Letter>(`/letters/${id}`);responses.value=responses.value.filter(r=>r.openingMessageId!==id);sheet.value='letter'}catch(e){error.value=(e as Error).message}}
async function openFilters(){sheet.value='filters';if(props.token)try{await status()}catch(e){error.value=(e as Error).message}}
async function purchase(days:number){if(busy.value)return;busy.value=true;error.value='';try{pass.value=await request<Pass>('/filter-pass/purchase',{days},{'Idempotency-Key':crypto.randomUUID()});sheet.value='filters'}catch(e){error.value=(e as Error).message}finally{busy.value=false}}
watch(active,(value,old)=>{if(old&&!value){city.value='';ageSet.value=false;min.value=18;max.value=50;if(!busy.value)void load()}})
const tick=setInterval(()=>{now.value=Date.now()},500)
function escape(e:KeyboardEvent){if(e.key==='Escape'&&!['letter','compose'].includes(sheet.value))sheet.value=''}
onMounted(()=>{void load();document.addEventListener('keydown',escape)})
onUnmounted(()=>{clearInterval(tick);document.removeEventListener('keydown',escape)})
</script>
<template>
<section class="home-flow" :class="{'motion-off':!motion,'refreshing':busy}" :data-state="responses.length?'home-response':items.length?'home-ready':'home-empty'">
<header class="home-header"><img :src="asset('01-brand-scenes/maugo-wordmark')" alt="MauGo"><div><button id="magic" aria-label="Bird appearance" @click="sheet='appearance'">✦</button><button id="settings" aria-label="Filters" @click="openFilters">☷</button></div></header>
<div v-if="error" class="home-error" role="alert">{{error}} <button v-if="!token" @click="emit('signin')">Sign in</button><button v-else :disabled="busy" @click="load()">Retry</button></div>
<div v-if="responses.length" class="response-strip"><button v-for="r in responses" :key="r.openingMessageId" @click="openLetter(r.openingMessageId)">✉ Replied to you <small>Tap to open</small></button></div>
<section class="magic-scene" :aria-busy="busy"><div class="aura"></div><img class="scene-mist" :src="asset('01-brand-scenes/mist')" alt=""><span v-if="trails" class="magic-sparks">✧ · ✦ · ✧</span>
<TransitionGroup name="birds" tag="div" class="bird-layer"><button v-for="(letter,i) in items" :key="letter.openingMessageId" class="letter-bird" :style="{'--i':i}" :aria-label="`Open letter from ${letter.sender.displayName}`" @click="openLetter(letter.openingMessageId)"><span v-if="motion" class="flight-sprite" :style="{backgroundImage:`url(${flight})`}"></span><img v-else :src="bird" alt=""><small>{{letter.sender.displayName}}</small></button></TransitionGroup>
<button id="hat" class="magic-hat" aria-label="Tap the hat to meet three new letters" :disabled="busy" @click="load(true)"><img :src="asset('01-brand-scenes/hat')" alt="A black magic hat with a glowing green ribbon"></button>
</section>
<p class="scene-hint">{{busy?'Your little birds are on their way…':loaded&&!items.length?'No letters match just yet. Try another little wish.':'Tap a bird. Open a little story.'}}</p>
<div class="home-actions"><button id="compose" aria-label="Write a letter" @click="sheet='compose'">✎ Write a letter</button><button id="refresh" aria-label="Refresh" :disabled="busy" @click="load(true)">⟳ Refresh</button><button class="primary" @click="openFilters">Find your letters</button></div><nav class="home-nav"><span aria-current="page">✧ Home</span><button @click="sheet='appearance'">Choose your bird</button></nav>
<LettersFlow v-if="sheet==='letter'||sheet==='compose'" :token="token" :letter="sheet==='letter'?detail:undefined" :compose="sheet==='compose'" @close="sheet=''" @blocked="items=items.filter(i=>i.openingMessageId!==$event);responses=responses.filter(i=>i.openingMessageId!==$event)" />
<Transition name="sheet"><div v-if="sheet&&!['letter','compose'].includes(sheet)" class="home-veil" @click.self="sheet=''">
<section class="home-sheet" role="dialog" aria-modal="true" :data-state="sheet==='filters'?(Object.keys(filters).length?'filters-selected':active?'filters-active':'filters-free'):sheet==='appearance'?(!motion?'bird-motion-off':`bird-${birdGender}`):sheet" :aria-label="sheet==='appearance'?'Choose your bird':sheet==='filters'?'Find your letters':sheet==='pass'?'Filter Pass':'A letter for you'"><header><h2>{{sheet==='appearance'?'Choose your bird':sheet==='filters'?'Find your letters':sheet==='pass'?'Filter Pass':'A letter for you'}}</h2><button aria-label="Close" @click="sheet=''">×</button></header>
<template v-if="sheet==='filters'"><p>Gender</p><div class="gender-options"><button v-for="g in [['male','♂','Man'],['female','♀','Woman'],['','∞','Everyone']]" :key="g[0]" :aria-label="`Filter ${g[2]}`" :aria-pressed="gender===g[0]" @click="gender=g[0]!"><i>{{g[1]}}</i>{{g[2]}}</button></div><p>Age range <button class="pass-badge" @click="sheet='pass'">◆ Pass</button><small>{{min}}–{{max===50?'50+':max}}</small></p><div class="premium-zone"><label>Minimum age<input v-model.number="min" aria-label="Minimum age" type="range" min="18" max="50" :disabled="!active" @input="ageSet=true;max=Math.max(max,min)"></label><label>Maximum age<input v-model.number="max" aria-label="Maximum age" type="range" min="18" max="50" :disabled="!active" @input="ageSet=true;min=Math.min(min,max)"></label><button v-if="!active" class="premium-cover" @click="sheet='pass'">♢ Unlock age and city filters</button></div><p>City <button class="pass-badge" @click="sheet='pass'">◆ Pass</button></p><select v-model="city" aria-label="City" :disabled="!active"><option value="">Any city</option><option v-for="c in cities" :key="c">{{c}}</option></select><small class="city-source">City options · temporary data source</small><p class="pass-status">{{active?`Filter Pass · ${days} days remaining`:'Choose a day pass to unlock age and city filters.'}}</p><button v-if="!active" class="unlock-pass" @click="sheet='pass'">Unlock Filter Pass</button><button class="primary" :disabled="busy" @click="sheet='';load()">Done</button></template>
<template v-else-if="sheet==='appearance'"><div id="appearance-genders" class="gender-options"><button v-for="g in ['male','female']" :key="g" :aria-pressed="birdGender===g" @click="birdGender=g"><img :src="asset(`02-bird-static/${g}-${variant}`)" alt="">{{g==='male'?'Male bird':'Female bird'}}</button></div><div class="appearance-grid"><button v-for="(name,i) in variants" :key="name" :aria-pressed="variant===i+1" :aria-label="`Choose ${name}`" @click="variant=i+1"><img :src="asset(`02-bird-static/${birdGender}-${i+1}`)" alt=""><span>{{name}}</span></button></div><div class="flight-preview"><span v-if="motion" class="flight-sprite" :style="{backgroundImage:`url(${flight})`}"></span><img v-else :src="bird" alt=""><span>Flight preview</span></div><label class="switch-row">Flight & hover<input v-model="motion" type="checkbox"></label><label class="switch-row">Magic trails<input v-model="trails" type="checkbox"></label><button class="primary" @click="sheet=''">Done</button></template>
<template v-else-if="sheet==='pass'"><p>Unlock age and city filters.</p><p v-if="active">{{days}} days remaining</p><button v-for="p in pass.plans" :key="p.days" class="pass-plan" :disabled="busy" @click="purchase(p.days)">{{p.days}} day{{p.days>1?'s':''}} <b>◆ {{p.diamonds}}</b></button><p v-if="!pass.plans.length">Sign in to view available passes.</p><button class="text-button" @click="sheet='filters'">Back to filters</button></template>
<template v-else-if="detail"><p class="letter-meta">{{detail.sender.displayName}} · {{detail.sender.city}}</p><p class="letter-content">{{detail.content}}</p></template>
<p v-if="error" role="alert" class="home-error">{{error}}</p>
</section></div></Transition>
</section>
</template>
<style src="../home.css"></style>
