<script lang="ts">
import { apiBaseUrl } from '../lib/api'

async function decodePhoto(url: string) {
  const photo = new Image()
  photo.src = url
  await photo.decode()
  return url
}

type Photo = {
  users: number
  ready: Promise<string>
  dispose: () => void
}
const photos = new Map<string, Photo>()

function acquirePhoto(path: string, token: string) {
  let photo = photos.get(path)
  if (!photo) {
    const controller = new AbortController()
    let url: string | undefined
    const ready = (async () => {
      const response = await fetch(apiBaseUrl + path, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal
      })
      if (response.status !== 200) throw new Error(`Avatar request failed (${response.status})`)
      const blob = await response.blob()
      controller.signal.throwIfAborted()
      url = URL.createObjectURL(blob)
      return decodePhoto(url)
    })()
    photo = {
      users: 0,
      ready,
      dispose() {
        controller.abort()
        if (url) URL.revokeObjectURL(url)
      }
    }
    photos.set(path, photo)
    const entry = photo
    void ready.catch(() => {
      if (photos.get(path) === entry) photos.delete(path)
    })
  }

  const entry = photo
  entry.users++
  return {
    ready: entry.ready,
    release() {
      if (--entry.users > 0) return
      if (photos.get(path) === entry) photos.delete(path)
      entry.dispose()
    }
  }
}
</script>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onUnmounted, ref, watch } from 'vue'

defineOptions({ inheritAttrs: false })
const props = defineProps<{ avatar: string; token: string }>()
const src = ref<string>()
const image = ref<HTMLImageElement>()
const failed = ref(false)
let displayedPath = ''
let releaseDisplayed: (() => void) | undefined
let pending: { path: string; release?: () => void } | undefined

async function showPhoto(path: string, url?: string, release?: () => void) {
  const releasePrevious = releaseDisplayed
  displayedPath = path
  releaseDisplayed = release
  src.value = url
  // Keep the previous URL valid until Vue updates the displayed img.
  await nextTick()
  releasePrevious?.()
}

async function loadPhoto(path: string, token: string) {
  if (pending?.path === path) return
  pending?.release?.()
  pending = undefined
  failed.value = false
  if (path === displayedPath) return
  if (!path) {
    await showPhoto(path)
    return
  }

  const photo = path.startsWith('/media/uploads/') ? acquirePhoto(path, token) : undefined
  const request = { path, release: photo?.release }
  pending = request
  try {
    const url = photo ? await photo.ready : src.value ? await decodePhoto(path) : path
    if (pending !== request) return
    pending = undefined
    await showPhoto(path, url, request.release)
  } catch {
    if (pending !== request) return
    pending = undefined
    request.release?.()
    if (photo && token !== props.token) {
      void loadPhoto(path, props.token)
      return
    }
    failed.value = true
    await showPhoto('')
  }
}

watch(() => [props.avatar, props.token] as const, ([path, token]) => {
  void loadPhoto(path, token)
}, { immediate: true })

function imageError(event: Event) {
  if (event.target !== image.value) return
  failed.value = true
  void showPhoto('')
}

let leavingImage: HTMLImageElement | undefined
onBeforeUnmount(() => { leavingImage = image.value })
onUnmounted(() => {
  pending?.release?.()
  pending = undefined
  const release = releaseDisplayed
  if (!release) return
  if (!leavingImage?.isConnected) {
    release()
    return
  }
  // An ancestor transition can leave the img in the DOM after Vue unmounts it.
  const observer = new MutationObserver(() => {
    if (leavingImage?.isConnected) return
    observer.disconnect()
    release()
  })
  observer.observe(document, { childList: true, subtree: true })
})
</script>

<template>
  <img v-if="src" ref="image" :key="src" v-bind="$attrs" :src="src" @error="imageError">
  <slot v-else-if="failed || !avatar" />
  <span v-else :class="$attrs.class" aria-hidden="true"></span>
</template>
