import { useMemo, useState } from 'react'
import { Timer } from 'lucide-react'
import { useStore } from '../store/context'
import { todayStr } from '../lib/date'
import { BigButton, Card, Pill, SectionLabel } from '../components/ui'

const PRESET = 25

export default function FocusScreen({
  onStart,
}: {
  onStart: (min: number, label: string, itemId?: string) => void
}) {
  const { items, sessions, setSettings } = useStore()
  const today = todayStr()

  const todaysTasks = useMemo(
    () => items.filter((it) => it.kind === 'task' && it.date === today && !it.done).slice(0, 4),
    [items, today],
  )

  const [pickedId, setPickedId] = useState<string | null>(todaysTasks[0]?.id ?? null)
  const [freeText, setFreeText] = useState('')
  // 自由入力は文字のまま持つ。数値に寄せると入力中に勝手に書き換わる
  const [customText, setCustomText] = useState('')
  const [custom, setCustom] = useState(false)
  const minutes = custom ? Number(customText) : PRESET

  const todaySeconds = sessions
    .filter((s) => s.date === today)
    .reduce((sum, s) => sum + s.actualSec, 0)
  const hours = Math.floor(todaySeconds / 3600)
  const mins = Math.round((todaySeconds % 3600) / 60)

  const label = pickedId ? (items.find((it) => it.id === pickedId)?.text ?? '') : freeText.trim()
  const canStart = Number.isFinite(minutes) && minutes >= 1 && minutes <= 600

  const begin = () => {
    if (!canStart) return
    setSettings({ lastTimerMin: minutes })
    onStart(minutes, label || '集中', pickedId ?? undefined)
  }

  return (
    <div className="flex min-h-full flex-col gap-3.5 px-4.5 pb-4 pt-1">
      <header className="flex h-13 items-center">
        <h1 className="text-[17px] font-bold">集中</h1>
      </header>

      <section>
        <SectionLabel>なにに集中する？</SectionLabel>
        <Card className="mt-2 overflow-hidden">
          {todaysTasks.map((t) => {
            const on = pickedId === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setPickedId(t.id)}
                aria-pressed={on}
                className={`flex min-h-[58px] w-full items-center gap-3 border-b border-line px-3.5 py-2.5 text-left ${
                  on ? 'bg-canvas' : ''
                }`}
              >
                <span
                  className={`size-5 shrink-0 rounded-full ${
                    on ? 'border-[6px] border-ink' : 'border-[1.5px] border-linestrong'
                  }`}
                />
                <span className="min-w-0 flex-1">
                  <span className={`block text-sm ${on ? 'font-bold' : 'font-medium'}`}>{t.text}</span>
                  <span className="mt-0.5 block text-[11px] text-ink3">今日のタスク</span>
                </span>
              </button>
            )
          })}
          <div className="flex items-center gap-3 px-3.5">
            <button
              type="button"
              onClick={() => setPickedId(null)}
              aria-pressed={pickedId === null}
              aria-label="タスクを選ばず自由に入力"
              className={`size-5 shrink-0 rounded-full ${
                pickedId === null ? 'border-[6px] border-ink' : 'border-[1.5px] border-dashed border-linestrong'
              }`}
            />
            <input
              value={freeText}
              onFocus={() => setPickedId(null)}
              onChange={(e) => setFreeText(e.target.value)}
              placeholder="タスクを選ばずに自由に入力"
              aria-label="集中する内容"
              className="min-h-[54px] flex-1 bg-transparent text-sm outline-none placeholder:text-ink3"
            />
          </div>
        </Card>
      </section>

      <section className="mt-1">
        <SectionLabel>どれくらい？</SectionLabel>
        <div className="mt-2 grid grid-cols-2 gap-2.5">
          <Pill
            on={!custom}
            onClick={() => {
              setCustom(false)
              setCustomText('')
            }}
            className="h-14 text-base font-bold"
          >
            <span className="num">{PRESET}</span> 分
          </Pill>
          <label
            className={`flex h-14 items-center justify-center gap-1.5 rounded-xl border text-[13px] ${
              custom ? 'border-ink bg-surface' : 'border-line bg-surface text-ink2'
            }`}
          >
            <span className="sr-only">ほかの長さ（分）</span>
            <input
              type="number"
              min={1}
              max={600}
              inputMode="numeric"
              value={customText}
              placeholder="ほかの長さ"
              onChange={(e) => {
                setCustomText(e.target.value)
                setCustom(e.target.value !== '')
              }}
              className="num w-20 bg-transparent text-center text-base font-medium outline-none placeholder:font-sans placeholder:text-[13px] placeholder:text-ink2"
            />
            {custom && <span className="text-[13px] text-ink2">分</span>}
          </label>
        </div>
      </section>

      <BigButton onClick={begin} disabled={!canStart} className="mt-1.5">
        <Timer size={19} strokeWidth={2} />
        集中をはじめる
      </BigButton>

      <div className="mt-auto flex items-baseline justify-between pt-4">
        <SectionLabel>今日の集中</SectionLabel>
        <p>
          {hours > 0 && (
            <>
              <span className="num text-[19px] font-medium">{hours}</span>
              <span className="text-xs text-ink2"> 時間 </span>
            </>
          )}
          <span className="num text-[19px] font-medium">{mins}</span>
          <span className="text-xs text-ink2"> 分</span>
        </p>
      </div>
    </div>
  )
}
