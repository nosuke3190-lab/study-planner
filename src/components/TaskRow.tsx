import { Bell, Check, ChevronRight, Repeat2 } from 'lucide-react'
import { PRIORITIES, type Item } from '../types'
import { repeatLabel, stampTime, shortDay, stampDay } from '../lib/date'

export default function TaskRow({
  item,
  onToggle,
  onOpen,
  last = false,
}: {
  item: Item
  onToggle: (id: string) => void
  onOpen: (id: string) => void
  last?: boolean
}) {
  const done = item.done === true
  const subs = item.subtasks ?? []
  const subDone = subs.filter((s) => s.done).length
  const priority = item.priority ? PRIORITIES[item.priority] : null
  const repeats = item.repeat && item.repeat.type !== 'none'

  return (
    <div className={`flex items-stretch ${last ? '' : 'border-b border-line'}`}>
      <button
        type="button"
        onClick={() => onToggle(item.id)}
        aria-pressed={done}
        className="flex min-h-[62px] flex-1 items-center gap-3 py-2.5 pl-3.5 pr-1 text-left active:bg-canvas"
      >
        <span
          aria-hidden
          className={`flex size-[22px] shrink-0 items-center justify-center rounded-full border-[1.5px] ${
            done ? 'border-ink bg-ink' : 'border-linestrong'
          }`}
        >
          {done && <Check size={12} strokeWidth={3} className="text-inverse" />}
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={`block text-sm font-medium leading-snug ${
              done ? 'text-ink3 line-through' : 'text-ink'
            }`}
          >
            {item.text}
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-ink3">
            {priority && (
              <span
                className={`rounded border px-1.5 py-px ${
                  item.priority === 'must'
                    ? 'border-linestrong font-bold text-ink'
                    : 'border-line text-ink3'
                }`}
              >
                {priority.label}
              </span>
            )}
            {subs.length > 0 && (
              <span className="num">
                サブタスク {subDone}/{subs.length}
              </span>
            )}
            {repeats && (
              <span className="inline-flex items-center gap-1">
                <Repeat2 size={11} />
                {repeatLabel(item.repeat)}
              </span>
            )}
            {item.notify && (
              <span className="inline-flex items-center gap-1">
                <Bell size={11} />
                <span className="num">
                  {shortDay(stampDay(item.notify.at))} {stampTime(item.notify.at)}
                </span>
              </span>
            )}
          </span>
        </span>
      </button>
      <button
        type="button"
        onClick={() => onOpen(item.id)}
        aria-label="詳細をひらく"
        className="flex w-11 shrink-0 items-center justify-center text-ink3 active:bg-canvas"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )
}
