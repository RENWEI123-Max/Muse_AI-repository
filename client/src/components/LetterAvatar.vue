<script setup lang="ts">
import { ref, watch } from 'vue'
import { apiBaseUrl } from '../lib/api'

defineOptions({ inheritAttrs: false })
const props = defineProps<{ avatar: string; token: string }>()
const src = ref<string>()
const failed = ref(false)

watch(() => [props.avatar, props.token] as const, async ([avatar, token], _, onCleanup) => {
  src.value = undefined
  failed.value = !avatar
  if (!avatar) return
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
    if (!response.ok) {
      failed.value = true
      return
    }
    const photo = await response.blob()
    if (controller.signal.aborted) return
    objectUrl = URL.createObjectURL(photo)
    src.value = objectUrl
  } catch {
    if (!controller.signal.aborted) failed.value = true
  }
}, { immediate: true })
</script>

<template>
  <slot v-if="failed" />
  <img v-else v-bind="$attrs" :src="src" @error="failed = true">
</template>
