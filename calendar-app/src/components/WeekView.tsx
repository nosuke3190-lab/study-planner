import { useEffect, useRef, type MouseEvent } from 'react'
import type { CalendarEvent, Settings } from '../types'
import { COLOR_MAP } from '../types'
import { WEEKDAYS, daySpan, occursOn, toKey, weekdayClass } from '../lib/date'
import { holidayName } from '../lib/holidays'

const HOUR_PX = 48

interface Props {
  days: Date[]
  today: string
  nowMinutes: number
  events: CalendarEvent[]
  settings: Settings
  onOpen: (event: CalendarEvent) => void
  onCreateAt: (key: string, hour: number) => void
  onSelectDay: (key: string) => void
}

interface Placed {
  event: CalendarEvent
  start: number
  end: number
  col: number
  cols: number
}

/** その日に時刻がまったくない予定（終日・時刻なし）は上の「終日」の段に出す */
function isUntimedOn(event: CalendarEvent, key: string): boolean {
  const span = daySpan(event, key)
  return span.start === null && span.end === null
}

function timeText(event: CalendarEvent, key: string): string {
  const span = daySpan(event, key)
  if (span.start !== null) return event.startDate === key ? event.startTime : '0:00'
  return `〜${event.endTime}`
}

/** 1日分の時間のある予定を、重なりに応じて横に並べる */
function layoutDay(events: CalendarEvent[], key: string): Placed[] {
  const items = events
    .filter(e => occursOn(e, key) && !isUntimedOn(e, key))
    .map(e => {
      // 片方の時刻がないときは 1 時間分の枠で表示する
      const span = daySpan(e, key)
      const start = span.start ?? Math.max(0, (span.end ?? 60) - 60)
      const end = span.end ?? Math.min(24 * 60, start + 60)
      return { event: e, start, end: Math.max(end, start + 30), col: 0, cols: 1 }
    })
    .sort((a, b) => a.start - b.start || b.end - a.end)

  const placed: Placed[] = []
  let cluster: Placed[] = []
  let clusterEnd = -1
  const flush = () => {
    const cols = Math.max(1, ...cluster.map(p => p.col + 1))
    cluster.forEach(p => { p.cols = cols })
    cluster = []
  }
  for (const item of items) {
    if (item.start >= clusterEnd) flush()
    const colEnds: number[] = []
    cluster.forEach(p => { colEnds[p.col] = Math.max(colEnds[p.col] ?? 0, p.end) })
    let col = 0
    while (colEnds[col] !== undefined && colEnds[col] > item.start) col++
    item.col = col
    cluster.push(item)
    placed.push(item)
    clusterEnd = Math.max(clusterEnd, item.end)
  }
  flush()
  return placed
}

export default function WeekView({ days, today, nowMinutes, events, settings, onOpen, onCreateAt, onSelectDay }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const keys = days.map(toKey)

  useEffect(() => {
    // 最初は朝7時あたりから見えるようにする
    if (scrollRef.current) scrollRef.current.scrollTop = 7 * HOUR_PX - 8
  }, [])

  const allDayByDay = keys.map(k => events.filter(e => occursOn(e, k) && isUntimedOn(e, k)))
  const hasAllDay = allDayByDay.some(list => list.length > 0)
  const timedByDay = keys.map(k => layoutDay(events, k))

  const handleColumnClick = (key: string) => (e: MouseEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return
    const y = e.nativeEvent.offsetY
    onCreateAt(key, Math.min(23, Math.floor(y / HOUR_PX)))
  }

  return (
    <div className="week">
      <div className="week-head">
        <span />
        {days.map((date, i) => {
          const key = keys[i]
          const holiday = settings.showHolidays ? holidayName(key) : ''
          const cls = weekdayClass(date.getDay(), !!holiday)
          return (
            <button key={key} type="button" className="week-head__day" onClick={() => onSelectDay(key)}
              aria-label={`${date.getMonth() + 1}月${date.getDate()}日を月表示で見る`}>
              <span className={`week-head__wd ${cls}`}>{WEEKDAYS[date.getDay()]}</span>
              <span className={`week-head__num ${key === today ? 'is-today' : cls}`}>{date.getDate()}</span>
              <span className="week-head__hol">{holiday}</span>
            </button>
          )
        })}
      </div>

      {hasAllDay && (
        <div className="week-allday">
          <span className="week-allday__label">終日</span>
          {allDayByDay.map((list, i) => (
            <div key={keys[i]} className="week-allday__col">
              {list.map(e => (
                <button key={e.id} type="button" className="week-allday__chip" onClick={() => onOpen(e)}
                  style={{ background: COLOR_MAP[e.color].tint, color: COLOR_MAP[e.color].ink }}>
                  {e.title || '（タイトルなし）'}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      <div className="week-scroll" ref={scrollRef}>
        <div className="week-body" style={{ height: 24 * HOUR_PX + 16, marginTop: 8 }}>
          {Array.from({ length: 25 }, (_, h) => (
            <div key={h}>
              <div className="week-hour-line" style={{ top: h * HOUR_PX }} />
              {h > 0 && h < 24 && <span className="week-hour-label" style={{ top: h * HOUR_PX - 7 }}>{h}:00</span>}
            </div>
          ))}
          <div className="week-cols" style={{ height: 24 * HOUR_PX }}>
            {keys.map((key, i) => (
              <div key={key} className={`week-col${key === today ? ' is-today' : ''}`} onClick={handleColumnClick(key)}>
                {timedByDay[i].map(p => {
                  const c = COLOR_MAP[p.event.color]
                  const width = 100 / p.cols
                  return (
                    <button
                      key={p.event.id}
                      type="button"
                      className="week-event"
                      onClick={() => onOpen(p.event)}
                      style={{
                        top: (p.start / 60) * HOUR_PX + 1,
                        height: ((p.end - p.start) / 60) * HOUR_PX - 2,
                        left: `calc(${p.col * width}% + 2px)`,
                        width: `calc(${width}% - 4px)`,
                        background: c.tint,
                        color: c.ink,
                        boxShadow: `inset 0 2px 0 ${c.main}`,
                      }}
                    >
                      <span className="week-event__title">{p.event.title || '（タイトルなし）'}</span>
                      <span className="week-event__time">{timeText(p.event, key)}</span>
                    </button>
                  )
                })}
                {key === today && <div className="week-now" style={{ top: (nowMinutes / 60) * HOUR_PX }} />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
