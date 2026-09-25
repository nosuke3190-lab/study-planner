import { useMemo, useState } from 'react'
import type { CalendarEvent } from '../types'
import { compareEvents, formatDayLabel } from '../lib/date'
import EventRow from './EventRow'
import { ChevronLeft, SearchIcon } from './Icons'

interface Props {
  events: CalendarEvent[]
  today: string
  onOpen: (event: CalendarEvent) => void
  onClose: () => void
}

export default function SearchScreen({ events, today, onOpen, onClose }: Props) {
  const [query, setQuery] = useState('')
  const needle = query.trim().toLowerCase()

  const groups = useMemo(() => {
    if (!needle) return []
    const hits = events
      .filter(e => [e.title, e.location, e.memo].some(t => t.toLowerCase().includes(needle)))
      .sort((a, b) => a.startDate.localeCompare(b.startDate) || compareEvents(a, b))
    const map = new Map<string, CalendarEvent[]>()
    for (const e of hits) map.set(e.startDate, [...(map.get(e.startDate) ?? []), e])
    return [...map.entries()]
  }, [events, needle])

  const count = groups.reduce((n, [, list]) => n + list.length, 0)

  return (
    <div className="screen" role="dialog" aria-modal="true" aria-label="検索">
      <div className="screen-header">
        <button type="button" className="icon-btn" aria-label="戻る" onClick={onClose}><ChevronLeft size={22} /></button>
        <label className="search-field">
          <SearchIcon size={18} />
          <span className="sr-only">予定を検索</span>
          <input type="search" autoFocus placeholder="予定・場所・メモを検索" value={query}
            onChange={e => setQuery(e.target.value)} enterKeyHint="search" />
        </label>
      </div>

      <div className="screen__scroll">
        <p className="search-count">
          {needle ? `「${query.trim()}」の検索結果 ${count}件` : 'キーワードを入力してください'}
        </p>
        <div className="search-results">
          {groups.map(([date, list]) => (
            <div key={date} className="search-group">
              <span className={`search-group__date${date < today ? ' is-past' : ''}`}>
                {formatDayLabel(date)}{date === today ? '・今日' : ''}
              </span>
              {list.map(e => (
                <div key={e.id} className="search-card">
                  <EventRow event={e} dayKey={date} onOpen={onOpen} />
                </div>
              ))}
            </div>
          ))}
          {needle && count === 0 && <p className="empty-note" style={{ textAlign: 'center', marginTop: 40 }}>見つかりませんでした</p>}
        </div>
      </div>
    </div>
  )
}
