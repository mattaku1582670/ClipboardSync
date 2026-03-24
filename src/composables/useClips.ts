import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface Clip {
  id: string
  content: string
  device_name: string
  content_type: 'text' | 'url'
  created_at: string
  pinned: boolean
}

export function useClips(userId: string) {
  const clips = ref<Clip[]>([])
  const loading = ref(false)
  let channel: RealtimeChannel | null = null

  function getDeviceName(): string {
    const ua = navigator.userAgent
    if (/iPhone|iPad|iPod/.test(ua)) return 'iPhone'
    if (/Android/.test(ua)) return 'Android'
    if (/Mac/.test(ua)) return 'Mac'
    if (/Windows/.test(ua)) return 'Windows'
    return 'Browser'
  }

  async function fetchClips() {
    loading.value = true
    const { data, error } = await supabase
      .from('clips')
      .select('*')
      .eq('user_id', userId)
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(20)

    if (!error && data) {
      clips.value = data
    }
    loading.value = false
  }

  function isUrl(text: string): boolean {
    try {
      new URL(text)
      return true
    } catch {
      return false
    }
  }

  async function sendClip(content: string) {
    const trimmed = content.trim()
    if (!trimmed) return

    const contentType = isUrl(trimmed) ? 'url' : 'text'

    const { error } = await supabase.from('clips').insert({
      user_id: userId,
      content: trimmed,
      device_name: getDeviceName(),
      content_type: contentType,
    })

    if (error) throw error
  }

  function sortClips(list: Clip[]): Clip[] {
    return [...list].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }

  function subscribe() {
    channel = supabase
      .channel('clips-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'clips',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newClip = payload.new as Clip
          clips.value = sortClips([newClip, ...clips.value]).slice(0, 20)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'clips',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const updated = payload.new as Clip
          clips.value = sortClips(
            clips.value.map((c) => (c.id === updated.id ? updated : c))
          )
        }
      )
      .subscribe()
  }

  async function togglePin(clipId: string, pinned: boolean) {
    await supabase.from('clips').update({ pinned }).eq('id', clipId)
    clips.value = sortClips(
      clips.value.map((c) => (c.id === clipId ? { ...c, pinned } : c))
    )
  }

  async function deleteClip(clipId: string) {
    await supabase.from('clips').delete().eq('id', clipId)
    clips.value = clips.value.filter((c) => c.id !== clipId)
  }

  function cleanup() {
    if (channel) {
      supabase.removeChannel(channel)
      channel = null
    }
  }

  return { clips, loading, sendClip, togglePin, deleteClip, fetchClips, subscribe, cleanup }
}
