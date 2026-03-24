<template>
  <div
    class="rounded-2xl p-4 cursor-pointer active:scale-[0.98] transition-transform"
    :class="clip.pinned ? 'bg-slate-700 ring-1 ring-blue-500/40' : 'bg-slate-800'"
    @click="handleCopy"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="flex-1 min-w-0">
        <template v-if="clip.content_type === 'url'">
          <a
            :href="clip.content"
            target="_blank"
            rel="noopener noreferrer"
            class="text-blue-400 hover:underline text-sm break-all"
            @click.stop
          >{{ clip.content }}</a>
        </template>
        <template v-else>
          <p class="text-white text-sm break-words line-clamp-4">{{ clip.content }}</p>
        </template>
      </div>

      <div class="flex gap-1 shrink-0">
        <button
          @click.stop="emit('toggle-pin', clip.id, !clip.pinned)"
          class="w-10 h-10 flex items-center justify-center rounded-xl transition-colors"
          :class="clip.pinned ? 'text-blue-400 bg-blue-500/20 hover:bg-blue-500/30' : 'text-slate-600 bg-slate-700 hover:text-slate-300 hover:bg-slate-600'"
          :title="clip.pinned ? 'ピン留めを外す' : 'ピン留め'"
        >📌</button>
        <button
          @click.stop="handleCopy"
          class="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-700 hover:bg-slate-600 transition-colors"
          :title="justCopied ? 'コピーしました!' : 'コピー'"
        >
          <span v-if="justCopied" class="text-green-400 text-lg">✓</span>
          <span v-else class="text-slate-300 text-base">⎘</span>
        </button>
      </div>
    </div>

    <div class="flex items-center justify-between mt-3">
      <div class="flex items-center gap-2">
        <span class="text-slate-500 text-xs">{{ deviceIcon }} {{ clip.device_name }}</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-slate-500 text-xs">{{ relativeTime }}</span>
        <button
          @click.stop="emit('delete', clip.id)"
          class="text-slate-600 hover:text-red-400 transition-colors text-xs"
          title="削除"
        >✕</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Clip } from '../composables/useClips'
import { useClipboard } from '../composables/useClipboard'

const props = defineProps<{ clip: Clip }>()
const emit = defineEmits<{
  delete: [id: string]
  'toggle-pin': [id: string, pinned: boolean]
}>()

const { copyToClipboard } = useClipboard()
const justCopied = ref(false)

async function handleCopy() {
  const ok = await copyToClipboard(props.clip.content)
  if (ok) {
    justCopied.value = true
    setTimeout(() => (justCopied.value = false), 2000)
  }
}

const deviceIcon = computed(() => {
  switch (props.clip.device_name) {
    case 'iPhone': return '📱'
    case 'Android': return '📱'
    case 'Mac': return '💻'
    case 'Windows': return '🖥️'
    default: return '🌐'
  }
})

const relativeTime = computed(() => {
  const now = Date.now()
  const diff = now - new Date(props.clip.created_at).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (diff < 60000) return 'たった今'
  if (minutes < 60) return `${minutes}分前`
  if (hours < 24) return `${hours}時間前`
  return `${days}日前`
})
</script>
