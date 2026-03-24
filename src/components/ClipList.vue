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
      <!-- ピン留めセクション -->
      <template v-if="pinnedClips.length > 0">
        <p class="text-xs text-slate-500 font-medium px-1">📌 ピン留め</p>
        <ClipItem
          v-for="clip in pinnedClips"
          :key="clip.id"
          :clip="clip"
          @delete="emit('delete', $event)"
          @toggle-pin="(id, pinned) => emit('toggle-pin', id, pinned)"
        />
        <div v-if="unpinnedClips.length > 0" class="border-t border-slate-700/60" />
      </template>

      <!-- 通常セクション -->
      <ClipItem
        v-for="clip in unpinnedClips"
        :key="clip.id"
        :clip="clip"
        @delete="emit('delete', $event)"
        @toggle-pin="(id, pinned) => emit('toggle-pin', id, pinned)"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ClipItem from './ClipItem.vue'
import type { Clip } from '../composables/useClips'

const props = defineProps<{
  clips: Clip[]
  loading: boolean
}>()

const emit = defineEmits<{
  delete: [id: string]
  'toggle-pin': [id: string, pinned: boolean]
}>()

const pinnedClips = computed(() => props.clips.filter((c) => c.pinned))
const unpinnedClips = computed(() => props.clips.filter((c) => !c.pinned))
</script>
