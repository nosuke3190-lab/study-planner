import { useMemo } from 'react'
import type { CalendarEvent, Settings } from '../types'
import { COLOR_MAP } from '../types'
import { WEEKDAYS, eventsOn, monthGrid, toKey, weekdayClass, weekdayOrder } from '../lib/date'
import { holidayName } from '../lib/holidays'

interface Props {
  month: Date
  selectedKey: string
  today: string
  events: CalendarEvent[]
  settings: Settings
  onSelect: (key: string) => void
}

export default function MonthView({ month, selectedKey, today, events, settings, onSelect }: Props) {
  const weeks = useMemo(() => monthGrid(month, settings.weekStart), [month, settings.weekStart])
  const rowHeight = weeks.length > 5 ? 66 : 78
  // マス目に表示できる行数（祝日名・予定・「+N」がそれぞれ1行）
  const slots = weeks.length > 5 ? 2 : 3

  return (
    <div className="month">
      <div className="weekday-row">
        {weekdayOrder(settings.weekStart).map(dow => (
          <span key={dow} className={weekdayClass(dow)}>{WEEKDAYS[dow]}</span>
        ))}
      </div>
      <div className="month-grid">
        {weeks.map(week => (
          <div className="month-week" key={toKey(week[0])}>
            {week.map(date => {
              const key = toKey(date)
              const inMonth = date.getMonth() === month.getMonth()
              const holiday = settings.showHolidays ? holidayName(key) : ''
              const dayEvents = eventsOn(events, key)
              const free = slots - (holiday ? 1 : 0)
              const shown = dayEvents.length <= free ? dayEvents : dayEvents.slice(0, free - 1)
              const more = dayEvents.length - shown.length
              const numClass = ['day-num', key === today ? 'is-today' : inMonth ? weekdayClass(date.getDay(), !!holiday) : 'is-other'].join(' ')
              return (
                <button
                  key={key}
                  type="button"
                  className={`day-cell${key === selectedKey ? ' is-selected' : ''}`}
                  style={{ height: rowHeight }}
                  aria-label={`${date.getMonth() + 1}月${date.getDate()}日 予定${dayEvents.length}件`}
                  aria-pressed={key === selectedKey}
                  onClick={() => onSelect(key)}
                >
                  <span className={numClass}>{date.getDate()}</span>
                  {holiday && <span className="day-holiday">{holiday}</span>}
                  {shown.map(e => (
                    <span key={e.id} className="day-chip" style={{ background: COLOR_MAP[e.color].tint, color: COLOR_MAP[e.color].ink }}>
                      {e.title || '（タイトルなし）'}
                    </span>
                  ))}
                  {more > 0 && <span className="day-more">+{more}</span>}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
