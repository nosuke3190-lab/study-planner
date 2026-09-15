import { useMemo, useState } from 'react'
import { Bell, ChevronRight, Search } from 'lucide-react'
import { useStore } from '../store/context'
import { KINDS, KIND_ORDER, type Item, type Kind } from '../types'
import { dayOf, shortDay, stampDay, stampTime } from '../lib/date'
import { Card, Empty, Pill } from '../components/ui'
import { KindDot } from '../components/KindDot'

function MemoRow({
  item,
  onOpen,
  last,
}: {
  item: Item
  onOpen: (id: string) => void
  last: boolean
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(item.id)}
      className={`flex w-full min-h-[54px] items-center gap-3 px-3.5 py-2.5 text-left active:bg-canvas ${
        last ? '' : 'border-b border-line'
      }`}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium leading-snug">{item.text}</span>
        <span className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-ink3">
          <span>{shortDay(dayOf(item.createdAt))}</span>
          {item.tags.map((t) => (
            <span key={t}>#{t}</span>
          ))}
          {item.notify && (
            <span className="inline-flex items-center gap-1 text-ink2">
              <Bell size={11} />
              <span className="num">
                {shortDay(stampDay(item.notify.at))} {stampTime(item.notify.at)}
              </span>
            </span>
          )}
        </span>
      </span>
      <ChevronRight size={16} className="shrink-0 text-ink3" />
    </button>
  )
}

export default function MemoScreen({
  onOpenItem,
  onOpenTriage,
}: {
  onOpenItem: (id: string) => void
  onOpenTriage: () => void
}) {
  const { items } = useStore()
  const [query, setQuery] = useState('')
  const [tag, setTag] = useState<string | null>(null)

  const tags = useMemo(() => {
    const counts = new Map<string, number>()
    for (const it of items) for (const t of it.tags) counts.set(t, (counts.get(t) ?? 0) + 1)
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t)
  }, [items])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((it) => {
      if (tag && !it.tags.includes(tag)) return false
      if (q && !it.text.toLowerCase().includes(q)) return false
      return true
    })
  }, [items, query, tag])

  const unsorted = filtered.filter((it) => it.kind === null)
  const byKind = (k: Kind) => filtered.filter((it) => it.kind === k)
  const nothing = filtered.length === 0

  return (
    <div className="flex flex-col gap-3.5 px-4.5 pb-4 pt-1">
      <header className="flex h-13 items-center">
        <h1 className="text-[17px] font-bold">メモ</h1>
      </header>

      <Card className="flex h-[46px] items-center gap-2.5 px-3.5">
        <Search size={17} strokeWidth={1.7} className="shrink-0 text-ink3" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          type="search"
          placeholder="メモ・タスクを探す"
          aria-label="メモを探す"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink3"
        />
      </Card>

      {tags.length > 0 && (
        <div className="no-scrollbar -mt-0.5 flex gap-2 overflow-x-auto">
          <Pill on={tag === null} onClick={() => setTag(null)} className="shrink-0 px-3.5">
            すべて
          </Pill>
          {tags.map((t) => (
            <Pill key={t} on={tag === t} onClick={() => setTag(t)} className="shrink-0 px-3.5">
              #{t}
            </Pill>
          ))}
        </div>
      )}

      {nothing && <Empty title="見つかりませんでした" hint="ホームの入力欄からメモを足せます。" />}

      {KIND_ORDER.map((k) => {
        const rows = byKind(k)
        if (rows.length === 0) return null
        return (
          <section key={k}>
            <h2 className="mb-1.5 flex items-center gap-1.5">
              <KindDot kind={k} />
              <span className="text-[12.5px] font-bold">{KINDS[k].label}</span>
              <span className="num text-[11.5px] text-ink3">{rows.length}</span>
            </h2>
            <Card className="overflow-hidden">
              {rows.map((it, i) => (
                <MemoRow key={it.id} item={it} onOpen={onOpenItem} last={i === rows.length - 1} />
              ))}
            </Card>
          </section>
        )
      })}

      {unsorted.length > 0 && (
        <button
          type="button"
          onClick={onOpenTriage}
          className="mt-0.5 flex items-center justify-between gap-3 rounded-2xl border border-linestrong bg-surface2 p-3.5 pl-4 text-left"
        >
          <span className="min-w-0">
            <span className="block text-[13.5px] font-bold">未整理のメモ</span>
            <span className="mt-0.5 block text-[11.5px] text-ink2">
              <span className="num">{unsorted.length}</span> 件たまっています
            </span>
          </span>
          <span className="flex h-11 shrink-0 items-center rounded-xl bg-ink px-4 text-[13px] font-bold text-inverse">
            仕分ける
          </span>
        </button>
      )}
    </div>
  )
}
