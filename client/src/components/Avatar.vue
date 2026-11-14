<script setup lang="ts">
defineProps<{ src: string; alt: string }>()
</script>
<template><img class="avatar" :src="src" :alt="alt"></template>
<style scoped>.avatar { display:block; width:48px; height:48px; border-radius:var(--radius-full); object-fit:cover; flex-shrink:0; }</style>
