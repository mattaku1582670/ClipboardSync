<template>
  <div class="flex flex-col gap-3">
    <template v-if="loading">
      <div class="text-center py-8 text-slate-500 text-sm">読み込み中...</div>
    </template>
    <template v-else-if="clips.length === 0">
      <div class="text-center py-12">
        <div class="text-4xl mb-3">{{ isSearching ? '🔍' : '📋' }}</div>
        <p class="text-slate-500 text-sm">{{ isSearching ? '一致するクリップがありません' : 'クリップがありません' }}</p>
        <p class="text-slate-600 text-xs mt-1">{{ isSearching ? '別のキーワードで試してください' : 'テキストを送信すると、ここに表示されます' }}</p>
      </div>
    </template>
    <template v-else>
      <!-- ピン留めセクション -->
      <template v-if="pinnedClips.length > 0">
        <p class="text-xs text-slate-500 font-medium px-1">📌 ピン留め</p>
        <TransitionGroup name="clip" tag="div" class="flex flex-col gap-3">
          <ClipItem
            v-for="clip in pinnedClips"
            :key="clip.id"
            :clip="clip"
            @delete="emit('delete', $event)"
            @toggle-pin="(id, pinned) => emit('toggle-pin', id, pinned)"
          />
        </TransitionGroup>
        <div v-if="unpinnedClips.length > 0" class="border-t border-slate-700/60" />
      </template>

      <!-- 通常セクション -->
      <TransitionGroup name="clip" tag="div" class="flex flex-col gap-3">
        <ClipItem
          v-for="clip in unpinnedClips"
          :key="clip.id"
          :clip="clip"
          @delete="emit('delete', $event)"
          @toggle-pin="(id, pinned) => emit('toggle-pin', id, pinned)"
        />
      </TransitionGroup>
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
  isSearching?: boolean
}>()

const emit = defineEmits<{
  delete: [id: string]
  'toggle-pin': [id: string, pinned: boolean]
}>()

const pinnedClips = computed(() => props.clips.filter((c) => c.pinned))
const unpinnedClips = computed(() => props.clips.filter((c) => !c.pinned))
</script>

<style scoped>
/* 新着クリップ: 上からスライドイン */
.clip-enter-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.clip-enter-from {
  opacity: 0;
  transform: translateY(-10px) scale(0.98);
}

/* 削除: フェードアウト + 縮小 */
.clip-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.clip-leave-to {
  opacity: 0;
  transform: scale(0.96);
}

/* ピン留め/解除時の位置移動 */
.clip-move {
  transition: transform 0.3s ease;
}
</style>
