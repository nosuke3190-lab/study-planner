import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addMonths, startOfMonth, getDaysInMonth } from 'date-fns'
import { useStore } from '../store/context'
import { ISO, longDay, parseDay, todayStr } from '../lib/date'
import { Card } from '../components/ui'

const WEEK = ['日', '月', '火', '水', '木', '金', '土']

export default function CalendarScreen({ onBack }: { onBack: () => void }) {
  const { journal } = useStore()
  const today = todayStr()
  const [cursor, setCursor] = useState(() => startOfMonth(parseDay(today)))
  const [selected, setSelected] = useState(today)

  const written = useMemo(() => new Set(journal.map((e) => e.date)), [journal])

  const cells = useMemo(() => {
    const first = startOfMonth(cursor)
    const blanks = first.getDay()
    const count = getDaysInMonth(cursor)
    const out: (string | null)[] = Array.from({ length: blanks }, () => null)
    for (let d = 1; d <= count; d++) {
      out.push(format(new Date(cursor.getFullYear(), cursor.getMonth(), d), ISO))
    }
    return out
  }, [cursor])

  const monthCount = cells.filter((c) => c && written.has(c)).length
  const entry = journal.find((e) => e.date === selected)

  return (
    <div className="flex flex-col gap-3.5 px-4.5 pb-4 pt-1">
      <header className="-ml-3 flex h-13 items-center gap-0.5">
        <button type="button" onClick={onBack} aria-label="戻る" className="flex size-11 items-center justify-center">
          <ChevronLeft size={21} strokeWidth={1.8} />
        </button>
        <h1 className="text-[17px] font-bold">日記カレンダー</h1>
      </header>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCursor((c) => addMonths(c, -1))}
          aria-label="前の月"
          className="-ml-2.5 flex size-11 items-center justify-center text-ink2"
        >
          <ChevronLeft size={19} strokeWidth={1.8} />
        </button>
        <p className="num text-[15px] font-medium">{format(cursor, 'yyyy 年 M 月')}</p>
        <button
          type="button"
          onClick={() => setCursor((c) => addMonths(c, 1))}
          aria-label="次の月"
          className="-mr-2.5 flex size-11 items-center justify-center text-ink2"
        >
          <ChevronRight size={19} strokeWidth={1.8} />
        </button>
      </div>

      <Card className="-mt-1 px-2.5 pb-3.5 pt-3">
        <div className="mb-1 grid grid-cols-7 gap-[3px]">
          {WEEK.map((w) => (
            <span key={w} className="text-center text-[10.5px] font-medium text-ink3">
              {w}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-[3px]">
          {cells.map((iso, i) => {
            if (!iso) return <span key={'b' + i} />
            const isToday = iso === today
            const isSelected = iso === selected
            const has = written.has(iso)
            const future = iso > today
            return (
              <button
                key={iso}
                type="button"
                onClick={() => setSelected(iso)}
                aria-pressed={isSelected}
                className="flex h-[46px] flex-col items-center justify-center gap-[3px]"
              >
                <span
                  className={`flex size-7 items-center justify-center rounded-full ${
                    isToday ? 'bg-ink' : isSelected ? 'border border-linestrong' : ''
                  }`}
                >
                  <span
                    className={`num text-[13px] ${
                      isToday
                        ? 'font-medium text-inverse'
                        : future
                          ? 'text-ink3'
                          : 'text-ink'
                    }`}
                  >
                    {Number(iso.slice(8))}
                  </span>
                </span>
                <span
                  aria-hidden
                  className="size-1 rounded-full"
                  style={{ background: has ? 'var(--c-task)' : 'transparent' }}
                />
              </button>
            )
          })}
        </div>
        <p className="mt-3 flex items-center gap-1.5 border-t border-line pt-2.5 text-[11px] text-ink3">
          <span aria-hidden className="size-1 rounded-full bg-task" />
          日記を書いた日　この月 <span className="num text-ink2">{monthCount}</span> 日
        </p>
      </Card>

      <Card className="p-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-[13.5px] font-bold">{longDay(selected)}</h2>
          {selected === today && <span className="text-[11px] text-ink3">今日</span>}
        </div>
        <p className="mt-2 whitespace-pre-wrap text-[13px] leading-[1.8] text-ink2">
          {entry?.body ?? 'この日の日記はありません。'}
        </p>
      </Card>
    </div>
  )
}
