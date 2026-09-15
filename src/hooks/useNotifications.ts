import { useCallback, useEffect, useRef, useState } from 'react'
import { useStore } from '../store/context'
import { nextNotifyStamp, stampToMs, todayStr } from '../lib/date'

export type PermissionState = 'unsupported' | 'default' | 'granted' | 'denied'

const LAST_JOURNAL_KEY = 'mindeck.lastJournalReminder'
/** これより古い予定は「閉じている間に過ぎた」とみなす */
const MISSED_AFTER_MS = 60_000
const TICK_MS = 20_000

function currentPermission(): PermissionState {
  if (typeof Notification === 'undefined') return 'unsupported'
  return Notification.permission as PermissionState
}

/** 通知を出す。PWA では Service Worker 経由でないと出ない端末があるため、そちらを優先する */
export async function showNotification(title: string, body: string, tag: string) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
  const options: NotificationOptions = {
    body,
    tag,
    icon: import.meta.env.BASE_URL + 'icon-192.png',
    badge: import.meta.env.BASE_URL + 'icon-192.png',
  }
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration()
      if (reg) {
        await reg.showNotification(title, options)
        return
      }
    }
    new Notification(title, options)
  } catch {
    // 端末が拒んだ場合は黙って諦める
  }
}

export interface MissedNotice {
  id: string
  text: string
  at: string
}

export function useNotifications() {
  const { items, updateItem, settings } = useStore()
  const [permission, setPermission] = useState<PermissionState>(currentPermission)
  const [missed, setMissed] = useState<MissedNotice[]>([])
  const firstPass = useRef(true)

  const request = useCallback(async () => {
    if (typeof Notification === 'undefined') return 'unsupported' as const
    const result = await Notification.requestPermission()
    setPermission(result as PermissionState)
    return result
  }, [])

  const dismissMissed = useCallback(() => setMissed([]), [])

  useEffect(() => {
    const run = () => {
      const now = Date.now()
      const wasFirst = firstPass.current
      firstPass.current = false
      const missedNow: MissedNotice[] = []

      for (const item of items) {
        const n = item.notify
        if (!n || !settings.memoNotify) continue
        if (n.firedFor === n.at) continue
        const due = stampToMs(n.at)
        if (Number.isNaN(due) || due > now) continue

        const late = now - due > MISSED_AFTER_MS
        if (wasFirst && late) {
          missedNow.push({ id: item.id, text: item.text, at: n.at })
        } else {
          void showNotification('メモ', item.text, 'memo-' + item.id)
        }

        const upcoming = nextNotifyStamp(n.at, n.repeat)
        updateItem(item.id, {
          notify: upcoming
            ? { at: upcoming, repeat: n.repeat }
            : { ...n, firedFor: n.at },
        })
      }

      if (missedNow.length > 0) setMissed((prev) => [...prev, ...missedNow])

      // 日記のリマインダー
      const jr = settings.journalReminder
      if (jr.enabled) {
        const today = todayStr()
        const dueAt = stampToMs(today + 'T' + jr.time)
        let last = ''
        try {
          last = localStorage.getItem(LAST_JOURNAL_KEY) ?? ''
        } catch {
          last = ''
        }
        if (!Number.isNaN(dueAt) && now >= dueAt && last !== today) {
          try {
            localStorage.setItem(LAST_JOURNAL_KEY, today)
          } catch {
            // 保存できなくても通知だけは出す
          }
          if (!wasFirst || now - dueAt <= MISSED_AFTER_MS) {
            void showNotification('Mindeck', '今日の振り返りを書きませんか', 'journal-' + today)
          }
        }
      }
    }

    run()
    const timer = window.setInterval(run, TICK_MS)
    const onVisible = () => {
      if (document.visibilityState === 'visible') run()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [items, settings.memoNotify, settings.journalReminder, updateItem])

  return { permission, request, missed, dismissMissed }
}
