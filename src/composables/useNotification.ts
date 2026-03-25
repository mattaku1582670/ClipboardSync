import { ref } from 'vue'

export function useNotification() {
  const permission = ref<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  )

  const supported = typeof Notification !== 'undefined'

  async function requestPermission() {
    if (!supported || permission.value === 'granted') return
    permission.value = await Notification.requestPermission()
  }

  function notify(deviceName: string, content: string) {
    if (!supported || permission.value !== 'granted') return

    const preview = content.length > 60 ? content.slice(0, 60) + '…' : content
    const n = new Notification('📋 ClipSync', {
      body: `${deviceName} から\n${preview}`,
      icon: '/icon-192.png',
    })

    n.onclick = () => {
      window.focus()
      n.close()
    }
  }

  return { permission, supported, requestPermission, notify }
}
