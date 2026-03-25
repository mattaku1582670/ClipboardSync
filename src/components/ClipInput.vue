<template>
  <div class="bg-slate-800 rounded-2xl p-4">
    <textarea
      v-model="text"
      placeholder="クリップボードに送信するテキストを入力..."
      rows="3"
      class="w-full bg-slate-700 text-white placeholder-slate-400 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-2"
      @keydown.ctrl.enter="handleSend"
      @keydown.meta.enter="handleSend"
    />
    <div class="flex justify-end mb-2">
      <span class="text-xs text-slate-500">{{ text.length.toLocaleString() }} 文字</span>
    </div>
    <div class="flex gap-2">
      <button
        @click="handleSend"
        :disabled="!text.trim() || sending"
        class="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold rounded-xl py-3 text-sm transition-colors"
      >
        {{ sending ? '送信中...' : '送信' }}
      </button>
      <button
        v-if="pasteSupported"
        @click="handlePasteAndSend"
        :disabled="sending"
        class="bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-slate-300 rounded-xl px-4 py-3 text-sm transition-colors"
        title="クリップボードから貼り付けて送信"
      >
        📋 貼り付け
      </button>
    </div>
    <p v-if="error" class="mt-2 text-red-400 text-xs">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useClipboard } from '../composables/useClipboard'

const props = defineProps<{
  onSend: (content: string) => Promise<void>
}>()

const { pasteSupported, readFromClipboard } = useClipboard()

const text = ref('')
const sending = ref(false)
const error = ref('')

async function handleSend() {
  if (!text.value.trim()) return
  sending.value = true
  error.value = ''
  try {
    await props.onSend(text.value)
    text.value = ''
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : '送信に失敗しました'
  } finally {
    sending.value = false
  }
}

async function handlePasteAndSend() {
  const content = await readFromClipboard()
  if (!content) return
  text.value = content
  await handleSend()
}
</script>
