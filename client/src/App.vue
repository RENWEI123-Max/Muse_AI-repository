<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import { asset, assets, assetCategories } from './lib/assets'
import {tr,  locale, t } from './lib/i18n'
import AuthFlow from './components/AuthFlow.vue'
import HomeFlow from './components/HomeFlow.vue'
import PageTransition from './components/PageTransition.vue'
const page = ref(new URLSearchParams(location.search).has('auth') ? 'email' : 'welcome')
const sessionToken = ref('')
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
    <HomeFlow v-if="page === 'home' || page === 'preview'" :token="sessionToken" @signin="page='email'" />
    <div v-else class="screen" :style="{ backgroundImage: `url(${asset('01-brand-scenes/auth-background')})` }">
      <header class="auth-top">
        <img :src="asset('01-brand-scenes/maugo-wordmark')" :alt="tr('MauGo')" class="wordmark">
        <button class="language" :aria-label="tr('Switch language')" @click="locale = locale === 'en' ? 'ko' : 'en'">{{ tr(locale === 'en' ? '한국어' : 'EN') }}</button>
      </header>
      <PageTransition>
        <section v-if="page === 'welcome'" key="welcome" class="auth-content">
          <h1>{{ t('welcome') }}</h1>
          <p class="auth-tagline">{{ t('tagline') }}</p>
          <p class="auth-copy">{{ t('firstHello') }}</p>
          <div class="auth-actions">
            <button class="primary" @click="page = 'email'">{{ t('email') }}</button>
            <button class="apple-button" @click="page = 'apple'">{{ t('apple') }}</button>
            <p class="auth-switch">{{ t('newHere') }} <button class="text-button" @click="page = 'create'">{{ t('create') }}</button></p>
            <p class="auth-legal"><button class="text-button" @click="page = 'terms'">{{ t('terms') }}</button><span> · </span><button class="text-button" @click="page = 'privacy'">{{ t('privacy') }}</button></p>
            <button class="auth-preview" @click="page = 'preview'">{{ t('explore') }}</button>
          </div>
        </section>
        <AuthFlow v-else-if="page !== 'preview'" :key="page" :initial="page" @back="page = 'welcome'" @authenticated="sessionToken=$event;page='home'" />
      </PageTransition>
      <div class="home-indicator" aria-hidden="true"></div>
    </div>
  </main>
</template>
