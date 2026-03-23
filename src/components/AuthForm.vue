<template>
  <div class="min-h-screen bg-slate-900 flex items-center justify-center px-4">
    <div class="w-full max-w-sm">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-white mb-2">ClipSync</h1>
        <p class="text-slate-400 text-sm">クロスデバイス クリップボード共有</p>
      </div>

      <div class="bg-slate-800 rounded-2xl p-6 shadow-xl">
        <template v-if="!sent">
          <h2 class="text-lg font-semibold text-white mb-4">ログイン</h2>
          <form @submit.prevent="handleSubmit">
            <input
              v-model="email"
              type="email"
              placeholder="メールアドレス"
              required
              class="w-full bg-slate-700 text-white placeholder-slate-400 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />
            <button
              type="submit"
              :disabled="loading"
              class="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl py-3 text-sm transition-colors"
            >
              {{ loading ? '送信中...' : 'マジックリンクを送信' }}
            </button>
          </form>
          <p v-if="error" class="mt-3 text-red-400 text-xs text-center">{{ error }}</p>
        </template>

        <template v-else>
          <div class="text-center py-4">
            <div class="text-4xl mb-4">📧</div>
            <h2 class="text-lg font-semibold text-white mb-2">メールを確認してください</h2>
            <p class="text-slate-400 text-sm">
              <span class="text-blue-400">{{ email }}</span> にログインリンクを送信しました。
            </p>
            <button
              @click="sent = false"
              class="mt-4 text-slate-400 hover:text-white text-xs underline transition-colors"
            >
              別のアドレスで試す
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '../composables/useAuth'

const { signInWithEmail } = useAuth()

const email = ref('')
const loading = ref(false)
const sent = ref(false)
const error = ref('')

async function handleSubmit() {
  loading.value = true
  error.value = ''
  try {
    await signInWithEmail(email.value)
    sent.value = true
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'エラーが発生しました'
  } finally {
    loading.value = false
  }
}
</script>
