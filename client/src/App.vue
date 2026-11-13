<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import { asset, assets, assetCategories } from './lib/assets'
import {tr,  locale, t } from './lib/i18n'
import AuthFlow from './components/AuthFlow.vue'
import AccountSecurity from './components/AccountSecurity.vue'
import HomeFlow from './components/HomeFlow.vue'
import PageTransition from './components/PageTransition.vue'
const page = ref(new URLSearchParams(location.search).has('auth') ? 'email' : 'welcome')
const sessionToken = ref('')
const securityOpen = ref(false)
const appLocked = ref(false)
// F07: drafts/preferences/chat appearance are cleared on sign-out (#103) and when another account signs in; language and per-account App lock stay.
function clearDevice(){sessionStorage.clear();for(const key of Object.keys(localStorage))if(key!=='maugo-language'&&!key.startsWith('maugo-lock-'))localStorage.removeItem(key);document.documentElement.classList.remove('system-font')}
function signedIn(token:string,account:string){if(localStorage.getItem('maugo-account')!==account){clearDevice();localStorage.setItem('maugo-account',account)}sessionToken.value=token;page.value='home'}
function signedOut(){clearDevice();sessionToken.value='';securityOpen.value=false;appLocked.value=false;page.value='welcome'}
const audit = new URLSearchParams(location.search).has('assets')
document.documentElement.classList.toggle('system-font', JSON.parse(localStorage.getItem('maugo-settings') || '{}').systemFont === true)
watchEffect(() => { document.documentElement.lang = locale.value })
</script>
<template>
  <main v-if="audit" class="asset-audit">
    <h1>{{tr("343 MauGo assets")}}</h1>
    <section v-for="category in assetCategories" :key="category">
      <h2>{{ category }}</h2>
      <img v-for="entry in assets.filter(a => a.category === category)" :key="entry.id" :src="entry.url" :alt="tr(entry.name)" width="64" height="64">
    </section>
  </main>
  <main v-else class="device" :lang="locale" :aria-label="tr('MauGo')">
    <img class="client-statusbar" :src="asset('09-navigation-system/status-bar-light-content')" alt="" aria-hidden="true">
    <div v-if="page === 'home' || page === 'preview'" :inert="appLocked||securityOpen" style="display:contents"><HomeFlow v-if="page === 'home' || page === 'preview'" :token="sessionToken" @signin="page='email'" @security="securityOpen=true" /></div>
    <AccountSecurity v-if="sessionToken" :token="sessionToken" :active="securityOpen" @close="securityOpen=false" @signedout="signedOut" @locking="appLocked=$event" />
    <div v-if="page !== 'home' && page !== 'preview'" class="screen" :class="{'welcome-screen': page === 'welcome'}" :style="{ backgroundImage: `url(${asset('01-brand-scenes/auth-background')})` }">
      <header class="auth-top">
        <img :src="asset('01-brand-scenes/maugo-wordmark')" :alt="tr('MauGo')" class="wordmark">
        <button class="language" :aria-label="tr('Switch language')" @click="locale = locale === 'en' ? 'ko' : 'en'">{{ tr(locale === 'en' ? '한국어' : 'EN') }}</button>
      </header>
      <PageTransition>
        <section v-if="page === 'welcome'" key="welcome" class="auth-content">
          <h1>{{ t('welcome') }}</h1>
          <p class="auth-tagline">{{ tr('A little bird. A little story.') }}</p>
          <p class="auth-copy">{{ t('tagline') }}</p>
          <div class="auth-actions">
            <button class="primary" @click="page = 'email'">{{ t('email') }}</button>
            <button class="apple-button" @click="page = 'apple'"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M17 12.4c0-2.1 1.7-3.2 1.8-3.3-1-1.5-2.6-1.7-3.2-1.7-1.4-.1-2.7.8-3.4.8-.7 0-1.8-.8-3-.7-1.6 0-3.1.9-3.9 2.3-1.7 2.8-.5 7 1.1 9.3.8 1.1 1.7 2.3 2.9 2.2 1.2 0 1.6-.7 3.1-.7 1.4 0 1.8.7 3.1.7s2.1-1.1 2.9-2.2c.9-1.3 1.3-2.6 1.3-2.7-.1 0-2.7-1-2.7-4zm-2.2-6.5c.6-.8 1.1-1.9 1-3-.9 0-2 .6-2.7 1.4-.6.7-1.2 1.8-1 2.9 1 .1 2.1-.5 2.7-1.3z"/></svg>{{ t('apple') }}</button>
            <p class="auth-switch">{{ t('newHere') }} <button class="text-button" @click="page = 'create'">{{ t('create') }}</button></p>
            <p class="auth-legal"><button class="text-button" @click="page = 'terms'">{{ t('terms') }}</button><span> · </span><button class="text-button" @click="page = 'privacy'">{{ t('privacy') }}</button></p>
            <button class="auth-preview" @click="page = 'preview'">{{ t('explore') }}</button>
          </div>
        </section>
        <AuthFlow v-else-if="page !== 'preview'" :key="page" :initial="page" @back="page = 'welcome'" @signedout="signedOut" @authenticated="signedIn" />
      </PageTransition>
      <div class="home-indicator" aria-hidden="true"></div>
    </div>
  </main>
</template>
