import { useCallback, useEffect, useRef, useState } from 'react'
import { showNotification } from './useNotifications'

const RUNNING_KEY = 'mindeck.timer'

export type TimerPhase = 'idle' | 'running' | 'paused' | 'done'

interface Persisted {
  phase: 'running' | 'paused'
  plannedMin: number
  label: string
  itemId?: string
  /** running のとき: 終了予定時刻。paused のとき使わない */
  endsAt?: number
  /** paused のとき: 残り秒 */
  remainingSec?: number
  startedAt: number
}

function read(): Persisted | null {
  try {
    const raw = localStorage.getItem(RUNNING_KEY)
    return raw ? (JSON.parse(raw) as Persisted) : null
  } catch {
    return null
  }
}

function write(v: Persisted | null) {
  try {
    if (v) localStorage.setItem(RUNNING_KEY, JSON.stringify(v))
    else localStorage.removeItem(RUNNING_KEY)
  } catch {
    // 保存できなくてもタイマー自体は動く
  }
}

export interface FinishedSession {
  plannedMin: number
  actualSec: number
  label: string
  itemId?: string
  startedAt: number
  endedAt: number
  completed: boolean
}

export function useFocusTimer(onFinish: (s: FinishedSession) => void, notifyOnDone: boolean) {
  // 途中で閉じても続きから再開できるよう、走っていたタイマーを読み戻す
  const [saved] = useState<Persisted | null>(read)
  const [phase, setPhase] = useState<TimerPhase>(saved ? saved.phase : 'idle')
  const [plannedMin, setPlannedMin] = useState(saved?.plannedMin ?? 25)
  const [label, setLabel] = useState(saved?.label ?? '')
  const [itemId, setItemId] = useState<string | undefined>(saved?.itemId)
  const [remainingSec, setRemainingSec] = useState(() => {
    if (!saved) return 25 * 60
    if (saved.phase === 'paused') return saved.remainingSec ?? saved.plannedMin * 60
    return Math.max(0, Math.round(((saved.endsAt ?? Date.now()) - Date.now()) / 1000))
  })
  const startedAt = useRef(saved?.startedAt ?? 0)
  const endsAt = useRef(saved?.endsAt ?? 0)
  const onFinishRef = useRef(onFinish)

  useEffect(() => {
    onFinishRef.current = onFinish
  }, [onFinish])

  const finish = useCallback(
    (completed: boolean) => {
      const now = Date.now()
      const elapsed = Math.max(0, Math.round((now - startedAt.current) / 1000))
      const session: FinishedSession = {
        plannedMin,
        actualSec: Math.min(elapsed, plannedMin * 60),
        label: label.trim() || '集中',
        itemId,
        startedAt: startedAt.current,
        endedAt: now,
        completed,
      }
      write(null)
      setPhase(completed ? 'done' : 'idle')
      setRemainingSec(plannedMin * 60)
      if (session.actualSec >= 30) onFinishRef.current(session)
      if (completed && notifyOnDone) {
        void showNotification(
          '集中おわり',
          `${plannedMin} 分の集中が終わりました`,
          'timer-' + now,
        )
      }
    },
    [plannedMin, label, itemId, notifyOnDone],
  )

  useEffect(() => {
    if (phase !== 'running') return
    const tick = () => {
      const left = Math.max(0, Math.round((endsAt.current - Date.now()) / 1000))
      setRemainingSec(left)
      if (left === 0) finish(true)
    }
    tick()
    const timer = window.setInterval(tick, 500)
    const onVisible = () => {
      if (document.visibilityState === 'visible') tick()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [phase, finish])

  const start = useCallback((min: number, text: string, linkedId?: string) => {
    const now = Date.now()
    startedAt.current = now
    endsAt.current = now + min * 60_000
    setPlannedMin(min)
    setLabel(text)
    setItemId(linkedId)
    setRemainingSec(min * 60)
    setPhase('running')
    write({ phase: 'running', plannedMin: min, label: text, itemId: linkedId, endsAt: endsAt.current, startedAt: now })
  }, [])

  const pause = useCallback(() => {
    const left = Math.max(0, Math.round((endsAt.current - Date.now()) / 1000))
    setRemainingSec(left)
    setPhase('paused')
    write({
      phase: 'paused',
      plannedMin,
      label,
      itemId,
      remainingSec: left,
      startedAt: startedAt.current,
    })
  }, [plannedMin, label, itemId])

  const resume = useCallback(() => {
    endsAt.current = Date.now() + remainingSec * 1000
    setPhase('running')
    write({ phase: 'running', plannedMin, label, itemId, endsAt: endsAt.current, startedAt: startedAt.current })
  }, [remainingSec, plannedMin, label, itemId])

  const stop = useCallback(() => finish(false), [finish])
  const acknowledge = useCallback(() => setPhase('idle'), [])

  return {
    phase,
    remainingSec,
    plannedMin,
    label,
    itemId,
    start,
    pause,
    resume,
    stop,
    acknowledge,
  }
}
