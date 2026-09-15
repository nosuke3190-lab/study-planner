import { useMemo } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { useStore } from '../store/context'
import { PRIORITIES, type Kind } from '../types'
import { daysUntil, dotDay, todayStr } from '../lib/date'
import QuickCapture from '../components/QuickCapture'
import TaskRow from '../components/TaskRow'
import { Card, Empty, SectionLabel } from '../components/ui'

export default function HomeScreen({
  onOpenSettings,
  onOpenItem,
  onOpenTriage,
}: {
  onOpenSettings: () => void
  onOpenItem: (id: string) => void
  onOpenTriage: () => void
}) {
  const { items, exams, captureMemo, toggleTask } = useStore()
  const today = todayStr()

  const upcoming = useMemo(
    () =>
      [...exams]
        .filter((e) => daysUntil(e.date, today) >= 0)
        .sort((a, b) => a.date.localeCompare(b.date)),
    [exams, today],
  )

  const todays = useMemo(() => {
    return items
      .filter((it) => it.kind === 'task' && it.date === today)
      .sort((a, b) => {
        if ((a.done === true) !== (b.done === true)) return a.done ? 1 : -1
        const pa = PRIORITIES[a.priority ?? 'should'].weight
        const pb = PRIORITIES[b.priority ?? 'should'].weight
        if (pa !== pb) return pa - pb
        return a.createdAt - b.createdAt
      })
  }, [items, today])

  const unsorted = items.filter((it) => it.kind === null).length
  const doneCount = todays.filter((t) => t.done).length
  const next = upcoming[0]
  const after = upcoming[1]

  const capture = (text: string, kind: Kind | null) => {
    captureMemo(text, kind)
  }

  return (
    <div className="flex flex-col gap-3.5 px-4.5 pb-4 pt-1">
      <header className="flex h-13 items-center justify-between">
        <h1 className="text-[19px] font-bold tracking-[0.06em]">Mindeck</h1>
        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="設定"
          className="-mr-2.5 flex size-11 items-center justify-center text-ink2"
        >
          <SlidersHorizontal size={21} strokeWidth={1.6} />
        </button>
      </header>

      <QuickCapture onCapture={capture} />

      {next ? (
        <Card className="p-4">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <SectionLabel>つぎの試験</SectionLabel>
              <p className="mt-1.5 truncate text-base font-bold">{next.name}</p>
              <p className="num mt-0.5 text-[11.5px] text-ink3">{dotDay(next.date)}</p>
            </div>
            <p className="flex shrink-0 items-baseline gap-1">
              <span className="num text-[46px] font-medium leading-[0.86] tracking-tight">
                {daysUntil(next.date, today)}
              </span>
              <span className="text-sm font-medium text-ink2">日</span>
            </p>
          </div>
          {after && (
            <p className="mt-3 border-t border-line pt-2.5 text-[11.5px] text-ink3">
              つぎ　{after.name} まで{' '}
              <span className="num font-medium text-ink2">{daysUntil(after.date, today)}</span> 日
            </p>
          )}
        </Card>
      ) : (
        <Card className="p-4">
          <SectionLabel>つぎの試験</SectionLabel>
          <p className="mt-2 text-[13px] leading-relaxed text-ink2">
            設定から試験日を登録すると、残り日数がここに出ます。
          </p>
          <button
            type="button"
            onClick={onOpenSettings}
            className="mt-2.5 text-[13px] font-bold text-ink underline underline-offset-4"
          >
            試験を登録する
          </button>
        </Card>
      )}

      <div className="mt-0.5 flex items-center justify-between">
        <SectionLabel>今日やること</SectionLabel>
        <SectionLabel>
          <span className="num">{doneCount}</span> / <span className="num">{todays.length}</span> 完了
        </SectionLabel>
      </div>

      {todays.length === 0 ? (
        <Empty title="今日のタスクはありません" hint="メモを「タスク」に仕分けると、ここに並びます。" />
      ) : (
        <Card className="overflow-hidden">
          {todays.map((it, i) => (
            <TaskRow
              key={it.id}
              item={it}
              onToggle={toggleTask}
              onOpen={onOpenItem}
              last={i === todays.length - 1}
            />
          ))}
        </Card>
      )}

      {unsorted > 0 && (
        <button
          type="button"
          onClick={onOpenTriage}
          className="flex h-14 items-center justify-between rounded-2xl border border-linestrong bg-surface2 px-4 text-left"
        >
          <span className="text-[13px] font-bold">
            未整理のメモが <span className="num">{unsorted}</span> 件
          </span>
          <span className="text-[13px] font-medium text-ink2">仕分ける</span>
        </button>
      )}
    </div>
  )
}
