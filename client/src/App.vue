<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import { asset, assets, assetCategories } from './lib/assets'
import { locale, t } from './lib/i18n'
import Avatar from './components/Avatar.vue'
import PageTransition from './components/PageTransition.vue'
const page = ref('welcome')
const audit = new URLSearchParams(location.search).has('assets')
watchEffect(() => { document.documentElement.lang = locale.value })
</script>
<template>
  <main v-if="audit" class="asset-audit">
    <h1>343 MauGo assets</h1>
    <section v-for="category in assetCategories" :key="category">
      <h2>{{ category }}</h2>
      <img v-for="entry in assets.filter(a => a.category === category)" :key="entry.id" :src="entry.url" :alt="entry.name" width="64" height="64">
    </section>
  </main>
  <main v-else class="device" :lang="locale" aria-label="MauGo">
    <div class="screen" :style="{ backgroundImage: `url(${asset('01-brand-scenes/auth-background')})` }">
      <header class="auth-top">
        <img :src="asset('01-brand-scenes/maugo-wordmark')" alt="MauGo" class="wordmark">
        <button class="language" aria-label="Switch language" @click="locale = locale === 'en' ? 'ko' : 'en'">{{ locale === 'en' ? '한국어' : 'EN' }}</button>
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
        <section v-else :key="page" class="preview-content">
          <button class="text-button" @click="page = 'welcome'">← {{ t('back') }}</button>
          <template v-if="page === 'preview'">
            <h1>{{ t('home') }}</h1>
            <img class="preview-bird" :src="asset('02-bird-static/female-1')" alt="A little bird carrying a letter">
            <Avatar :src="asset('05-avatars/portrait-1')" alt="Preview profile" />
            <p>{{ t('placeholder') }}</p>
          </template>
          <template v-else><h1>{{ t(page as 'email' | 'apple' | 'create' | 'terms' | 'privacy') }}</h1><p>{{ t('note') }}</p></template>
        </section>
      </PageTransition>
      <div class="home-indicator" aria-hidden="true"></div>
    </div>
  </main>
</template>
