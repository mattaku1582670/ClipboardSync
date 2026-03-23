<template>
  <div
    class="bg-slate-800 rounded-2xl p-4 cursor-pointer active:scale-[0.98] transition-transform"
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

      <button
        @click.stop="handleCopy"
        class="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-slate-700 hover:bg-slate-600 transition-colors"
        :title="justCopied ? 'コピーしました!' : 'コピー'"
      >
        <span v-if="justCopied" class="text-green-400 text-lg">✓</span>
        <span v-else class="text-slate-300 text-base">⎘</span>
      </button>
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
const emit = defineEmits<{ delete: [id: string] }>()

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
