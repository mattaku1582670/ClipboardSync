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
          <button
            class="flex items-baseline gap-2 cursor-pointer hover:opacity-70 transition-opacity active:scale-95"
            @click="handleRefresh"
            title="クリックで更新"
          >
            <h1 class="font-bold text-lg">📋 ClipSync</h1>
            <span class="text-xs text-slate-500">v{{ version }}</span>
          </button>
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

        <!-- 検索バー -->
        <div class="relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">🔍</span>
          <input
            v-model="searchQuery"
            type="search"
            placeholder="クリップを検索..."
            class="w-full bg-slate-800 text-white placeholder-slate-500 rounded-xl pl-9 pr-9 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            v-if="searchQuery"
            @click="searchQuery = ''"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors text-sm"
          >✕</button>
        </div>

        <ClipList
          :clips="filteredClips"
          :loading="clipsLoading"
          :is-searching="!!searchQuery"
          @delete="deleteClip"
          @toggle-pin="togglePin"
        />
      </main>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
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
const searchQuery = ref('')
let clipsApi: ReturnType<typeof useClips> | null = null

const filteredClips = computed(() => {
  if (!searchQuery.value.trim()) return decryptedClips.value
  const q = searchQuery.value.toLowerCase()
  return decryptedClips.value.filter((c) => c.content.toLowerCase().includes(q))
})

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

async function handleRefresh() {
  if (!clipsApi) return
  await clipsApi.fetchClips()
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
