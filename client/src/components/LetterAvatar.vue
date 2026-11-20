<script setup lang="ts">
import { ref, watch } from 'vue'
import { apiBaseUrl } from '../lib/api'

const props = defineProps<{ avatar: string; token: string }>()
const src = ref<string>()

watch(() => [props.avatar, props.token] as const, async ([avatar, token], _, onCleanup) => {
  src.value = undefined
  if (!avatar.startsWith('/media/uploads/')) {
    src.value = avatar
    return
  }

  const controller = new AbortController()
  let objectUrl: string | undefined
  onCleanup(() => {
    controller.abort()
    if (objectUrl) URL.revokeObjectURL(objectUrl)
  })

  try {
    const response = await fetch(apiBaseUrl + avatar, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal
    })
    if (!response.ok) return
    const photo = await response.blob()
    if (controller.signal.aborted) return
    objectUrl = URL.createObjectURL(photo)
    src.value = objectUrl
  } catch {
    // Keep the image slot when the supplied avatar cannot be loaded.
  }
}, { immediate: true })
</script>

<template>
  <img :src="src">
</template>
