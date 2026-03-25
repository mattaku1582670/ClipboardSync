<template>
  <div class="min-h-screen bg-slate-900 text-white">
    <template v-if="loading">
      <div class="min-h-screen flex items-center justify-center">
        <div class="text-slate-500 text-sm">読み込み中...</div>
      </div>
    </template>

    <template v-else-if="!user">
      <AuthForm />
    </template>

    <template v-else-if="!encryptionReady">
      <EncryptionSetup @done="onEncryptionDone" @skip="onEncryptionSkip" />
    </template>

    <template v-else>
      <!-- Header -->
      <header class="sticky top-0 z-10 bg-slate-900/80 backdrop-blur border-b border-slate-800 px-4 py-3">
        <div class="max-w-lg mx-auto flex items-center justify-between">
          <div class="flex items-baseline gap-2">
            <h1 class="font-bold text-lg">📋 ClipSync</h1>
            <span class="text-xs text-slate-500">v{{ version }}</span>
          </div>
          <div class="flex items-center gap-3">
            <button
              v-if="notificationSupported && notificationPermission !== 'granted'"
              @click="requestPermission"
              class="text-slate-400 hover:text-white text-sm transition-colors"
              title="通知を有効にする"
            >🔔</button>
            <span
              v-else-if="notificationPermission === 'granted'"
              class="text-slate-600 text-sm"
              title="通知オン"
            >🔔</span>
            <button
              v-if="encryptionEnabled"
              @click="handleLock"
              class="text-slate-400 hover:text-yellow-400 text-sm transition-colors"
              title="暗号化をロック"
            >
              🔐
            </button>
            <button
              @click="signOut"
              class="text-slate-400 hover:text-white text-sm transition-colors"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      <!-- Main -->
      <main class="max-w-lg mx-auto px-4 py-4 flex flex-col gap-4">
        <ClipInput :on-send="sendClip" />
        <ClipList
          :clips="decryptedClips"
          :loading="clipsLoading"
          @delete="deleteClip"
          @toggle-pin="togglePin"
        />
      </main>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import AuthForm from './components/AuthForm.vue'
import EncryptionSetup from './components/EncryptionSetup.vue'
import ClipInput from './components/ClipInput.vue'
import ClipList from './components/ClipList.vue'
import { useAuth } from './composables/useAuth'
import { useClips } from './composables/useClips'
import { useEncryption } from './composables/useEncryption'
import { useNotification } from './composables/useNotification'
import type { Clip } from './composables/useClips'

const version = __APP_VERSION__

const { user, loading, signOut } = useAuth()
const { encrypt, decrypt, lock } = useEncryption()
const { permission: notificationPermission, supported: notificationSupported, requestPermission, notify } = useNotification()

const encryptionReady = ref(false)
const encryptionEnabled = ref(false)

const clips = ref<Clip[]>([])
const decryptedClips = ref<Clip[]>([])
const clipsLoading = ref(false)
const decryptTrigger = ref(0)
let clipsApi: ReturnType<typeof useClips> | null = null

// clips または暗号化状態が変わるたびに復号
watch([clips, decryptTrigger], async () => {
  decryptedClips.value = await Promise.all(
    clips.value.map(async (clip) => ({ ...clip, content: await decrypt(clip.content) }))
  )
}, { immediate: true })

function onEncryptionDone() {
  encryptionEnabled.value = true
  encryptionReady.value = true
  decryptTrigger.value++
}

function onEncryptionSkip() {
  encryptionEnabled.value = false
  encryptionReady.value = true
  decryptTrigger.value++
}

function handleLock() {
  lock()
  encryptionReady.value = false
  encryptionEnabled.value = false
}

async function handleNewClip(clip: Clip) {
  // 自分のデバイスから送ったクリップは通知しない
  if (!clipsApi || clip.device_name === clipsApi.getDeviceName()) return
  const content = await decrypt(clip.content)
  notify(clip.device_name, content)
}

async function sendClip(content: string) {
  if (!clipsApi) return
  const payload = encryptionEnabled.value ? await encrypt(content) : content
  await clipsApi.sendClip(payload)
}

async function togglePin(id: string, pinned: boolean) {
  if (!clipsApi) return
  await clipsApi.togglePin(id, pinned)
}

async function deleteClip(id: string) {
  if (!clipsApi) return
  await clipsApi.deleteClip(id)
}

watch(user, (newUser) => {
  if (clipsApi) {
    clipsApi.cleanup()
    clipsApi = null
  }
  encryptionReady.value = false
  encryptionEnabled.value = false
  if (newUser) {
    clipsApi = useClips(newUser.id, handleNewClip)
    watch(clipsApi.clips, (v) => { clips.value = v }, { immediate: true })
    watch(clipsApi.loading, (v) => { clipsLoading.value = v }, { immediate: true })
    clipsApi.fetchClips()
    clipsApi.subscribe()
  }
})

onUnmounted(() => {
  clipsApi?.cleanup()
})
</script>
