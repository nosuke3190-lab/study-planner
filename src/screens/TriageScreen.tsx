import { useState } from 'react'
import { X } from 'lucide-react'
import { useStore } from '../store/context'
import { KINDS, KIND_ORDER, type Kind } from '../types'
import { dayOf, shiftDay, shortDay, todayStr } from '../lib/date'
import { BigButton, Card, Pill, SectionLabel } from '../components/ui'
import { KindDot } from '../components/KindDot'

type When = 'today' | 'tomorrow' | 'pick' | 'someday'

export default function TriageScreen({ onClose }: { onClose: () => void }) {
  const { items, fileItem, deleteItem } = useStore()
  const queue = items.filter((it) => it.kind === null)
  const [index, setIndex] = useState(0)
  const [kind, setKind] = useState<Kind | null>(null)
  const [when, setWhen] = useState<When>('today')
  const [picked, setPicked] = useState(todayStr())

  const total = queue.length
  const current = queue[Math.min(index, total - 1)]

  const reset = () => {
    setKind(null)
    setWhen('today')
    setPicked(todayStr())
  }

  const advance = () => {
    reset()
    if (index >= queue.length - 1) onClose()
  }

  if (!current) {
    return (
      <div className="flex min-h-full flex-col px-4.5 pb-4 pt-1">
        <header className="-ml-3 flex h-13 items-center gap-0.5">
          <button type="button" onClick={onClose} aria-label="閉じる" className="flex size-11 items-center justify-center">
            <X size={20} strokeWidth={1.7} />
          </button>
          <h1 className="text-[17px] font-bold">仕分け</h1>
        </header>
        <Card className="mt-4 px-6 py-12 text-center">
          <p className="text-sm font-medium text-ink2">未整理のメモはありません</p>
          <p className="mt-1.5 text-xs text-ink3">思いついたことはホームの入力欄から書けます。</p>
        </Card>
      </div>
    )
  }

  const dateFor = (): string | null => {
    if (when === 'today') return todayStr()
    if (when === 'tomorrow') return shiftDay(todayStr(), 1)
    if (when === 'pick') return picked
    return null
  }

  const confirm = () => {
    if (!kind) return
    fileItem(current.id, kind, kind === 'task' ? { date: dateFor() } : undefined)
    advance()
  }

  return (
    <div className="flex min-h-full flex-col gap-3.5 px-4.5 pb-4 pt-1">
      <header className="-ml-3 flex h-13 items-center justify-between">
        <div className="flex items-center gap-0.5">
          <button type="button" onClick={onClose} aria-label="閉じる" className="flex size-11 items-center justify-center">
            <X size={20} strokeWidth={1.7} />
          </button>
          <h1 className="text-[17px] font-bold">仕分け</h1>
        </div>
        <SectionLabel>
          のこり <span className="num text-ink2">{total}</span> 件
        </SectionLabel>
      </header>

      <div className="flex gap-1" aria-hidden>
        {Array.from({ length: Math.min(total, 12) }, (_, i) => (
          <span
            key={i}
            className={`h-[3px] flex-1 rounded-sm ${i === 0 ? 'bg-ink' : 'bg-linestrong'}`}
          />
        ))}
      </div>

      <Card className="flex min-h-[150px] flex-1 flex-col justify-center px-4.5 py-5">
        <p className="text-[17px] font-medium leading-loose">{current.text}</p>
        <p className="mt-3 text-[11px] text-ink3">{shortDay(dayOf(current.createdAt))} に書いたメモ</p>
      </Card>

      <div>
        <SectionLabel>どこに入れる？</SectionLabel>
        <div className="mt-2 grid grid-cols-3 gap-2.5">
          {KIND_ORDER.map((k) => (
            <Pill key={k} on={kind === k} onClick={() => setKind(k)} className="h-14 flex-col gap-1.5">
              <KindDot kind={k} />
              {KINDS[k].label}
            </Pill>
          ))}
        </div>
      </div>

      {kind === 'task' && (
        <div>
          <SectionLabel>いつやる？</SectionLabel>
          <div className="mt-2 grid grid-cols-4 gap-2">
            <Pill on={when === 'today'} onClick={() => setWhen('today')}>
              今日
            </Pill>
            <Pill on={when === 'tomorrow'} onClick={() => setWhen('tomorrow')}>
              明日
            </Pill>
            <label
              className={`flex h-11 items-center justify-center rounded-xl border text-[13px] font-medium ${
                when === 'pick' ? 'border-ink bg-ink text-inverse' : 'border-line bg-surface text-ink2'
              }`}
            >
              <span className="sr-only">日付を選ぶ</span>
              <input
                type="date"
                value={picked}
                onChange={(e) => {
                  setPicked(e.target.value)
                  setWhen('pick')
                }}
                className="w-full bg-transparent px-1 text-center text-[11px] outline-none"
              />
            </label>
            <Pill on={when === 'someday'} onClick={() => setWhen('someday')}>
              いつか
            </Pill>
          </div>
        </div>
      )}

      <BigButton onClick={confirm} disabled={!kind}>
        この内容で決定
      </BigButton>

      <div className="mt-auto grid grid-cols-2 gap-2.5 pt-2">
        <button
          type="button"
          onClick={() => {
            reset()
            setIndex((i) => (i + 1 >= total ? 0 : i + 1))
          }}
          className="h-11 text-[13px] font-medium text-ink2"
        >
          あとで決める
        </button>
        <button
          type="button"
          onClick={() => {
            deleteItem(current.id)
            advance()
          }}
          className="h-11 text-[13px] font-medium text-ink3"
        >
          削除する
        </button>
      </div>
    </div>
  )
}
