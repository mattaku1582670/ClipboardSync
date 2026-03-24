<template>
  <div class="min-h-screen bg-slate-900 flex items-center justify-center px-4">
    <div class="w-full max-w-sm">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-white mb-2">ClipSync</h1>
        <p class="text-slate-400 text-sm">クロスデバイス クリップボード共有</p>
      </div>

      <div class="bg-slate-800 rounded-2xl p-6 shadow-xl">
        <div class="text-3xl text-center mb-3">🔐</div>
        <h2 class="text-lg font-semibold text-white mb-1 text-center">
          {{ isFirstTime ? '暗号化パスフレーズを設定' : 'パスフレーズを入力' }}
        </h2>
        <p class="text-slate-400 text-xs text-center mb-5">
          {{
            isFirstTime
              ? 'クリップボードの内容を暗号化します。全端末で同じパスフレーズを使用してください。'
              : '暗号化されたクリップを読むにはパスフレーズが必要です。'
          }}
        </p>

        <form @submit.prevent="handleSubmit">
          <input
            v-model="passphrase"
            type="password"
            placeholder="パスフレーズ"
            required
            autofocus
            class="w-full bg-slate-700 text-white placeholder-slate-400 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          />
          <button
            type="submit"
            :disabled="loading || !passphrase"
            class="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl py-3 text-sm transition-colors"
          >
            {{ loading ? '処理中...' : isFirstTime ? '設定して開始' : '解除する' }}
          </button>
        </form>

        <p v-if="error" class="mt-3 text-red-400 text-xs text-center">{{ error }}</p>

        <div class="mt-4 text-center">
          <button
            @click="emit('skip')"
            class="text-slate-500 hover:text-slate-300 text-xs transition-colors"
          >
            スキップ（暗号化なし）
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useEncryption } from '../composables/useEncryption'

const emit = defineEmits<{ done: []; skip: [] }>()

const { hasSalt, setup } = useEncryption()

const passphrase = ref('')
const loading = ref(false)
const error = ref('')
const isFirstTime = ref(false)

onMounted(async () => {
  isFirstTime.value = !(await hasSalt())
})

async function handleSubmit() {
  loading.value = true
  error.value = ''
  try {
    await setup(passphrase.value)
    emit('done')
  } catch {
    error.value = 'パスフレーズの設定に失敗しました。再度お試しください。'
  } finally {
    loading.value = false
  }
}
</script>
