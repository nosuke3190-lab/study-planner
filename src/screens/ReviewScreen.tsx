import { useEffect, useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { useStore } from '../store/context'
import { longDay, todayStr } from '../lib/date'
import { Card } from '../components/ui'
import CompletionChart from '../components/CompletionChart'

export default function ReviewScreen({ onOpenCalendar }: { onOpenCalendar: () => void }) {
  const { completions, journalFor, saveJournal } = useStore()
  const today = todayStr()
  const entry = journalFor(today)
  const [body, setBody] = useState(entry?.body ?? '')
  const saved = body === (entry?.body ?? '')

  // 入力が止まってから書き込む。1文字ごとに localStorage を触らない
  useEffect(() => {
    if (saved) return
    const t = window.setTimeout(() => saveJournal(today, body), 600)
    return () => window.clearTimeout(t)
  }, [body, saved, saveJournal, today])

  return (
    <div className="flex min-h-full flex-col gap-3.5 px-4.5 pb-4 pt-1">
      <header className="flex h-13 items-center justify-between">
        <h1 className="text-[17px] font-bold">振り返り</h1>
        <button
          type="button"
          onClick={onOpenCalendar}
          aria-label="日記カレンダーをひらく"
          className="-mr-2.5 flex size-11 items-center justify-center text-ink2"
        >
          <CalendarDays size={21} strokeWidth={1.6} />
        </button>
      </header>

      <Card className="flex min-h-[300px] flex-col p-4 pb-3.5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-bold">{longDay(today)}の日記</h2>
          <span className="text-[11px] text-ink3">{saved ? (body ? '保存済み' : '') : '書いています'}</span>
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="今日はどんな一日でしたか"
          aria-label="今日の日記"
          className="mt-2.5 min-h-40 flex-1 bg-transparent text-[13.5px] leading-[1.85] outline-none placeholder:text-ink3"
        />
        <div className="mt-3 flex items-center justify-between border-t border-line pt-2.5">
          <span className="num text-[11px] text-ink3">{body.length} 字</span>
          <span className="text-[11px] text-ink3">自由に書くだけ。決まった形式はありません</span>
        </div>
      </Card>

      <Card className="p-4 pb-3.5">
        <CompletionChart completions={completions} />
      </Card>
    </div>
  )
}
