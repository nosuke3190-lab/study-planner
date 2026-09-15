import { useCallback, useEffect, useState } from 'react'
import type { Item, Repeat, Settings } from '../types'
import { shiftDay, stampDay, stampTime, stampToMs, todayStr, weekdayIndex } from '../lib/date'

export type PushStatus = 'unsupported' | 'off' | 'on' | 'error'

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const normal = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(normal)
  const out = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

export interface ScheduleEntry {
  id: string
  title: string
  body: string
  at: number
}

/** 何日先まで予定を送っておくか。開くたびに送り直すので、これで足りる */
const HORIZON_DAYS = 60
const MAX_PER_ITEM = 90

/** 繰り返しをその都度の時刻に展開する。サーバー側に日付の計算を持たせないため */
function expand(stamp: string, repeat: Repeat, horizon: number): number[] {
  const first = stampToMs(stamp)
  if (Number.isNaN(first)) return []
  if (repeat.type === 'none') return first >= Date.now() ? [first] : []

  const out: number[] = []
  const time = stampTime(stamp)
  let day = stampDay(stamp)
  const start = todayStr()
  if (day < start) day = start

  for (let i = 0; i < horizon && out.length < MAX_PER_ITEM; i++) {
    const iso = shiftDay(day, i)
    const ok =
      repeat.type === 'daily' || (repeat.type === 'weekly' && repeat.days.includes(weekdayIndex(iso)))
    if (!ok) continue
    const ms = stampToMs(iso + 'T' + time)
    if (!Number.isNaN(ms) && ms > Date.now()) out.push(ms)
  }
  return out
}

/** サーバーに渡す通知予定。繰り返しは展開済みの一回きりの予定として送る */
export function buildSchedule(items: Item[], settings: Settings): ScheduleEntry[] {
  if (!settings.memoNotify) return []
  const out: ScheduleEntry[] = []
  for (const it of items) {
    const n = it.notify
    if (!n) continue
    for (const at of expand(n.at, n.repeat, HORIZON_DAYS)) {
      out.push({
        id: 'memo-' + it.id + '-' + at,
        title: 'メモ',
        body: it.text.slice(0, 120),
        at,
      })
    }
  }
  return out.sort((a, b) => a.at - b.at).slice(0, 500)
}

function supported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    typeof Notification !== 'undefined'
  )
}

/**
 * 閉じている間の通知は Web Push でしか届かない。
 * 中継サーバーの URL と公開鍵は設定画面から入れてもらう。
 */
export function usePush(settings: Settings) {
  const [status, setStatus] = useState<PushStatus>(() => (supported() ? 'off' : 'unsupported'))
  const [message, setMessage] = useState('')

  const configured = settings.pushEndpoint.trim() !== '' && settings.pushPublicKey.trim() !== ''

  useEffect(() => {
    if (!supported() || !configured) return
    let alive = true
    void (async () => {
      try {
        const reg = await navigator.serviceWorker.ready
        const sub = await reg.pushManager.getSubscription()
        if (alive) setStatus(sub ? 'on' : 'off')
      } catch {
        if (alive) setStatus('error')
      }
    })()
    return () => {
      alive = false
    }
  }, [configured])

  const post = useCallback(
    async (path: string, payload: unknown) => {
      const base = settings.pushEndpoint.trim().replace(/\/+$/, '')
      const res = await fetch(base + path, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('サーバーが ' + res.status + ' を返しました')
      return res
    },
    [settings.pushEndpoint],
  )

  const enable = useCallback(
    async (schedule: ScheduleEntry[]) => {
      if (!supported()) {
        setStatus('unsupported')
        setMessage('この端末のブラウザは Web Push に対応していません')
        return false
      }
      if (!configured) {
        setMessage('サーバーの URL と公開鍵を先に入れてください')
        return false
      }
      try {
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') {
          setMessage('通知が許可されていません')
          return false
        }
        const reg = await navigator.serviceWorker.ready
        const existing = await reg.pushManager.getSubscription()
        const sub =
          existing ??
          (await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(settings.pushPublicKey.trim()),
          }))
        await post('/subscribe', { subscription: sub.toJSON(), schedule })
        setStatus('on')
        setMessage('閉じていても通知が届くようになりました')
        return true
      } catch (err) {
        setStatus('error')
        setMessage(err instanceof Error ? err.message : '設定できませんでした')
        return false
      }
    },
    [configured, post, settings.pushPublicKey],
  )

  const disable = useCallback(async () => {
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        if (configured) {
          await post('/unsubscribe', { endpoint: sub.endpoint }).catch(() => undefined)
        }
        await sub.unsubscribe()
      }
      setStatus('off')
      setMessage('')
    } catch {
      setStatus('error')
      setMessage('解除できませんでした')
    }
  }, [configured, post])

  const sync = useCallback(
    async (schedule: ScheduleEntry[]) => {
      if (!supported() || !configured || status !== 'on') return
      try {
        const reg = await navigator.serviceWorker.ready
        const sub = await reg.pushManager.getSubscription()
        if (!sub) return
        await post('/schedule', { endpoint: sub.endpoint, schedule })
      } catch {
        // 次に設定を触ったときに送り直す
      }
    },
    [configured, post, status],
  )

  return { status, message, configured, enable, disable, sync }
}
