import { ref, readonly } from 'vue'
import { supabase } from '../lib/supabase'
import { deriveKey, generateSalt, encryptText, decryptText, isEncrypted } from '../lib/crypto'

const SESSION_KEY_PREFIX = 'clipsync_enc_key_'

export function useEncryption() {
  const key = ref<CryptoKey | null>(null)
  const isReady = ref(false)

  async function getSalt(): Promise<Uint8Array | null> {
    const { data } = await supabase.auth.getUser()
    const saltB64 = data.user?.user_metadata?.encryption_salt
    if (!saltB64) return null
    return Uint8Array.from(atob(saltB64), c => c.charCodeAt(0))
  }

  async function hasSalt(): Promise<boolean> {
    const { data } = await supabase.auth.getUser()
    return !!data.user?.user_metadata?.encryption_salt
  }

  async function saveSalt(salt: Uint8Array) {
    const saltB64 = btoa(String.fromCharCode(...salt))
    const { error } = await supabase.auth.updateUser({ data: { encryption_salt: saltB64 } })
    if (error) throw error
  }

  async function setup(passphrase: string) {
    let salt = await getSalt()
    if (!salt) {
      salt = generateSalt()
      await saveSalt(salt)
    }
    key.value = await deriveKey(passphrase, salt)
    isReady.value = true
    await _saveKeyToSession(key.value)
  }

  async function _saveKeyToSession(cryptoKey: CryptoKey) {
    try {
      const { data } = await supabase.auth.getUser()
      const userId = data.user?.id
      if (!userId) return
      const jwk = await crypto.subtle.exportKey('jwk', cryptoKey)
      sessionStorage.setItem(SESSION_KEY_PREFIX + userId, JSON.stringify(jwk))
    } catch {
      // sessionStorage が使えない環境では無視
    }
  }

  async function tryRestore(): Promise<boolean> {
    try {
      const { data } = await supabase.auth.getUser()
      const userId = data.user?.id
      if (!userId) return false
      const stored = sessionStorage.getItem(SESSION_KEY_PREFIX + userId)
      if (!stored) return false
      const jwk = JSON.parse(stored) as JsonWebKey
      key.value = await crypto.subtle.importKey(
        'jwk',
        jwk,
        { name: 'AES-GCM' },
        true,
        ['encrypt', 'decrypt']
      )
      isReady.value = true
      return true
    } catch {
      return false
    }
  }

  function lock() {
    key.value = null
    isReady.value = false
    // セッションキーを全消去
    Object.keys(sessionStorage)
      .filter(k => k.startsWith(SESSION_KEY_PREFIX))
      .forEach(k => sessionStorage.removeItem(k))
  }

  async function encrypt(plaintext: string): Promise<string> {
    if (!key.value) return plaintext
    return encryptText(key.value, plaintext)
  }

  async function decrypt(content: string): Promise<string> {
    if (!isEncrypted(content)) return content
    if (!key.value) return '🔒 暗号化済み'
    try {
      return await decryptText(key.value, content)
    } catch {
      return '⚠️ 復号に失敗しました（パスフレーズが違う可能性があります）'
    }
  }

  return { isReady: readonly(isReady), hasSalt, setup, lock, tryRestore, encrypt, decrypt }
}
