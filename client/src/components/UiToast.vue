<script setup lang="ts">
import {ref,watch,onUnmounted} from 'vue'
import {tr} from '../lib/i18n'
const props=defineProps<{message:string;translate?:(message:string)=>string}>()
const emit=defineEmits<{expired:[]}>()
const visible=ref(false)
let timer:ReturnType<typeof setTimeout>
watch(()=>props.message,message=>{clearTimeout(timer);visible.value=!!message;if(message)timer=setTimeout(()=>{visible.value=false;emit('expired')},2700)},{immediate:true,flush:'sync'})
onUnmounted(()=>clearTimeout(timer))
</script>
<template><p v-if="visible" class="ui-toast show" role="status">{{(translate??tr)(message)}}<slot /></p></template>
<style scoped>
.ui-toast{position:fixed;left:20px;right:20px;bottom:calc(env(safe-area-inset-bottom, 0px) + 88px);width:auto;max-width:319px;z-index:200;margin:0 auto;padding:10px 16px;border-radius:var(--radius-16);background:var(--reply-toast);color:var(--reply-toast-text);font:var(--font-body-sm-18);text-align:center;pointer-events:none}
</style>
