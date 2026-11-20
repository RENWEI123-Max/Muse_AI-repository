<script setup lang="ts">
import { assets, assetCategories } from '../lib/assets'
import { tr } from '../lib/i18n'
</script>

<template>
  <main class="asset-audit">
    <h1>{{tr("343 MauGo assets")}}</h1>
    <section v-for="category in assetCategories" :key="category">
      <h2>{{ category }}</h2>
      <img v-for="entry in assets.filter(a => a.category === category)" :key="entry.id" :src="entry.url" :alt="tr(entry.name)" width="64" height="64">
    </section>
  </main>
</template>
