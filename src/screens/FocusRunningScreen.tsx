import { useState } from 'react'
import { ArrowUp, Pause, Play, X } from 'lucide-react'

const R = 108
const C = 2 * Math.PI * R

function mmss(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function FocusRunningScreen({
  remainingSec,
  plannedMin,
  label,
  paused,
  onPause,
  onResume,
  onStop,
  onMemo,
}: {
  remainingSec: number
  plannedMin: number
  label: string
  paused: boolean
  onPause: () => void
  onResume: () => void
  onStop: () => void
  onMemo: (text: string) => void
}) {
  const [draft, setDraft] = useState('')
  const total = Math.max(1, plannedMin * 60)
  const elapsed = Math.min(1, Math.max(0, (total - remainingSec) / total))

  const send = () => {
    if (!draft.trim()) return
    onMemo(draft)
    setDraft('')
  }

  return (
    <div className="flex min-h-full flex-col bg-focusbg text-focusink">
      <div className="safe-t" />
      <header className="flex h-13 items-center justify-between px-4.5">
        <span className="text-[11px] font-medium tracking-[0.09em] text-focusink2">
          {paused ? '一時停止中' : '集中中'}
        </span>
        <button
          type="button"
          onClick={onStop}
          aria-label="集中をやめる"
          className="-mr-2.5 flex size-11 items-center justify-center text-focusink2"
        >
          <X size={20} strokeWidth={1.7} />
        </button>
      </header>

      <div className="flex flex-1 flex-col items-center px-6">
        <div className="relative mt-6 size-[250px]">
          <svg width="250" height="250" viewBox="0 0 250 250" className="block -rotate-90">
            <circle cx="125" cy="125" r={R} fill="none" stroke="var(--c-focus-ring)" strokeWidth="3" />
            <circle
              cx="125"
              cy="125"
              r={R}
              fill="none"
              stroke="var(--c-focus-ink)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - elapsed)}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
            <p className="num text-[52px] font-normal leading-none tracking-tight" aria-live="off">
              {mmss(remainingSec)}
            </p>
            <p className="num text-[11px] tracking-wider text-focusink2">{plannedMin} 分のうち</p>
          </div>
        </div>

        <p className="mt-6 max-w-[300px] text-center text-[15px] font-medium leading-snug">{label}</p>

        <div className="mt-6 flex w-full items-center gap-2.5 rounded-[13px] border border-focusline p-3">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                send()
              }
            }}
            placeholder="思いついたことだけメモする"
            aria-label="集中中のメモ"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-focusink2"
          />
          <button
            type="button"
            onClick={send}
            disabled={!draft.trim()}
            aria-label="メモを未整理に送る"
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-focusring text-focusink disabled:opacity-40"
          >
            <ArrowUp size={18} strokeWidth={2} />
          </button>
        </div>
        <p className="mt-2.5 text-center text-[11px] leading-relaxed text-focusink2">
          集中中はメモだけ書けます。ほかの画面は終わるまで開きません。
        </p>

        <div className="mt-auto flex w-full gap-2.5 pb-7">
          <button
            type="button"
            onClick={paused ? onResume : onPause}
            className="flex h-14 flex-1 items-center justify-center gap-2 rounded-[13px] border border-focusline2 text-sm font-medium"
          >
            {paused ? <Play size={17} strokeWidth={2} /> : <Pause size={17} strokeWidth={2} />}
            {paused ? '再開する' : '一時停止'}
          </button>
          <button
            type="button"
            onClick={onStop}
            className="h-14 flex-1 rounded-[13px] bg-focusink text-sm font-bold text-focusbg"
          >
            終わる
          </button>
        </div>
      </div>
      <div className="safe-b" />
    </div>
  )
}
