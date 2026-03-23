<template>
  <div class="flex flex-col gap-3">
    <template v-if="loading">
      <div class="text-center py-8 text-slate-500 text-sm">読み込み中...</div>
    </template>
    <template v-else-if="clips.length === 0">
      <div class="text-center py-12">
        <div class="text-4xl mb-3">📋</div>
        <p class="text-slate-500 text-sm">クリップがありません</p>
        <p class="text-slate-600 text-xs mt-1">テキストを送信すると、ここに表示されます</p>
      </div>
    </template>
    <template v-else>
      <ClipItem
        v-for="clip in clips"
        :key="clip.id"
        :clip="clip"
        @delete="emit('delete', $event)"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import ClipItem from './ClipItem.vue'
import type { Clip } from '../composables/useClips'

defineProps<{
  clips: Clip[]
  loading: boolean
}>()

const emit = defineEmits<{ delete: [id: string] }>()
</script>
