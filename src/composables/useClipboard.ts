import { ref } from 'vue'

export function useClipboard() {
  const copied = ref(false)
  const pasteSupported = ref(false)

  const writeSupported = !!navigator.clipboard?.writeText

  async function checkPasteSupport() {
    try {
      const result = await navigator.permissions.query({
        name: 'clipboard-read' as PermissionName,
      })
      pasteSupported.value = result.state !== 'denied'
    } catch {
      pasteSupported.value = false
    }
  }

  async function copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text)
      copied.value = true
      setTimeout(() => (copied.value = false), 2000)
      return true
    } catch {
      return fallbackCopy(text)
    }
  }

  function fallbackCopy(text: string): boolean {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    document.body.appendChild(textarea)
    textarea.select()
    try {
      document.execCommand('copy')
      copied.value = true
      setTimeout(() => (copied.value = false), 2000)
      return true
    } catch {
      return false
    } finally {
      document.body.removeChild(textarea)
    }
  }

  async function readFromClipboard(): Promise<string | null> {
    try {
      return await navigator.clipboard.readText()
    } catch {
      return null
    }
  }

  checkPasteSupport()

  return { copied, writeSupported, pasteSupported, copyToClipboard, readFromClipboard }
}
