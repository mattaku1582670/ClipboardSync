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

    <template v-else>
      <!-- Header -->
      <header class="sticky top-0 z-10 bg-slate-900/80 backdrop-blur border-b border-slate-800 px-4 py-3">
        <div class="max-w-lg mx-auto flex items-center justify-between">
          <h1 class="font-bold text-lg">📋 ClipSync</h1>
          <button
            @click="signOut"
            class="text-slate-400 hover:text-white text-sm transition-colors"
          >
            ログアウト
          </button>
        </div>
      </header>

      <!-- Main -->
      <main class="max-w-lg mx-auto px-4 py-4 flex flex-col gap-4">
        <ClipInput :on-send="sendClip" />
        <ClipList
          :clips="clips"
          :loading="clipsLoading"
          @delete="deleteClip"
        />
      </main>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import AuthForm from './components/AuthForm.vue'
import ClipInput from './components/ClipInput.vue'
import ClipList from './components/ClipList.vue'
import { useAuth } from './composables/useAuth'
import { useClips } from './composables/useClips'
import type { Clip } from './composables/useClips'

const { user, loading, signOut } = useAuth()

const clips = ref<Clip[]>([])
const clipsLoading = ref(false)
let clipsApi: ReturnType<typeof useClips> | null = null

async function sendClip(content: string) {
  if (!clipsApi) return
  await clipsApi.sendClip(content)
}

async function deleteClip(id: string) {
  if (!clipsApi) return
  await clipsApi.deleteClip(id)
}

watch(user, (newUser) => {
  if (newUser) {
    clipsApi = useClips(newUser.id)
    watch(clipsApi.clips, (v) => { clips.value = v }, { immediate: true })
    watch(clipsApi.loading, (v) => { clipsLoading.value = v }, { immediate: true })
  }
})
</script>
