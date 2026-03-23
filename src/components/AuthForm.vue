<template>
  <div class="min-h-screen bg-slate-900 flex items-center justify-center px-4">
    <div class="w-full max-w-sm">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-white mb-2">ClipSync</h1>
        <p class="text-slate-400 text-sm">クロスデバイス クリップボード共有</p>
      </div>

      <div class="bg-slate-800 rounded-2xl p-6 shadow-xl">

        <!-- Magic Link 送信完了 -->
        <template v-if="magicLinkSent">
          <div class="text-center py-4">
            <div class="text-4xl mb-4">📧</div>
            <h2 class="text-lg font-semibold text-white mb-2">メールを確認してください</h2>
            <p class="text-slate-400 text-sm">
              <span class="text-blue-400">{{ email }}</span> にログインリンクを送信しました。
            </p>
            <button
              @click="magicLinkSent = false"
              class="mt-4 text-slate-400 hover:text-white text-xs underline transition-colors"
            >
              戻る
            </button>
          </div>
        </template>

        <!-- パスワードログイン / 新規登録 -->
        <template v-else-if="mode !== 'magic'">
          <h2 class="text-lg font-semibold text-white mb-4">
            {{ mode === 'login' ? 'ログイン' : '新規登録' }}
          </h2>
          <form @submit.prevent="handlePasswordSubmit">
            <input
              v-model="email"
              type="email"
              placeholder="メールアドレス"
              required
              class="w-full bg-slate-700 text-white placeholder-slate-400 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 mb-3"
            />
            <input
              v-model="password"
              type="password"
              placeholder="パスワード"
              required
              class="w-full bg-slate-700 text-white placeholder-slate-400 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />
            <button
              type="submit"
              :disabled="loading"
              class="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl py-3 text-sm transition-colors"
            >
              {{ loading ? '処理中...' : mode === 'login' ? 'ログイン' : '登録する' }}
            </button>
          </form>

          <p v-if="error" class="mt-3 text-red-400 text-xs text-center">{{ error }}</p>
          <p v-if="info" class="mt-3 text-green-400 text-xs text-center">{{ info }}</p>

          <div class="mt-4 flex flex-col gap-2 text-center">
            <button
              v-if="mode === 'login'"
              @click="mode = 'signup'"
              class="text-slate-400 hover:text-white text-xs transition-colors"
            >
              アカウントをお持ちでない方 → 新規登録
            </button>
            <button
              v-else
              @click="mode = 'login'"
              class="text-slate-400 hover:text-white text-xs transition-colors"
            >
              既にアカウントをお持ちの方 → ログイン
            </button>
            <button
              @click="mode = 'magic'"
              class="text-slate-500 hover:text-slate-300 text-xs transition-colors"
            >
              パスワードなしでログイン（マジックリンク）
            </button>
          </div>
        </template>

        <!-- マジックリンク送信 -->
        <template v-else>
          <h2 class="text-lg font-semibold text-white mb-1">マジックリンクでログイン</h2>
          <p class="text-slate-400 text-xs mb-4">メールアドレスにログインリンクを送信します。</p>
          <form @submit.prevent="handleMagicLinkSubmit">
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

          <div class="mt-4 text-center">
            <button
              @click="mode = 'login'"
              class="text-slate-400 hover:text-white text-xs transition-colors"
            >
              ← パスワードログインに戻る
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

const { signInWithEmail, signInWithPassword, signUpWithPassword } = useAuth()

type Mode = 'login' | 'signup' | 'magic'

const mode = ref<Mode>('login')
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const info = ref('')
const magicLinkSent = ref(false)

function clearMessages() {
  error.value = ''
  info.value = ''
}

async function handlePasswordSubmit() {
  loading.value = true
  clearMessages()
  try {
    if (mode.value === 'login') {
      await signInWithPassword(email.value, password.value)
    } else {
      await signUpWithPassword(email.value, password.value)
      info.value = '確認メールを送信しました。メールのリンクをクリックして登録を完了してください。'
    }
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'エラーが発生しました'
  } finally {
    loading.value = false
  }
}

async function handleMagicLinkSubmit() {
  loading.value = true
  clearMessages()
  try {
    await signInWithEmail(email.value)
    magicLinkSent.value = true
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'エラーが発生しました'
  } finally {
    loading.value = false
  }
}
</script>
