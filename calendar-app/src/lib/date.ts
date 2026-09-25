import { addDays, format, parse, startOfMonth, startOfWeek } from 'date-fns'
import type { CalendarEvent } from '../types'

export const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

export function toKey(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function fromKey(key: string): Date {
  return parse(key, 'yyyy-MM-dd', new Date())
}

export function todayKey(): string {
  return toKey(new Date())
}

/** 例: 9月25日（金） */
export function formatDayLabel(key: string): string {
  const d = fromKey(key)
  return `${d.getMonth() + 1}月${d.getDate()}日（${WEEKDAYS[d.getDay()]}）`
}

export function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function fromMinutes(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** 月表示のマス目（週の始まりに合わせて 5〜6 週分） */
export function monthGrid(month: Date, weekStart: 0 | 1): Date[][] {
  const first = startOfMonth(month)
  const gridStart = startOfWeek(first, { weekStartsOn: weekStart })
  const weeks: Date[][] = []
  let cur = gridStart
  do {
    const week: Date[] = []
    for (let i = 0; i < 7; i++) {
      week.push(cur)
      cur = addDays(cur, 1)
    }
    weeks.push(week)
  } while (cur.getMonth() === first.getMonth())
  return weeks
}

export function weekDays(date: Date, weekStart: 0 | 1): Date[] {
  const start = startOfWeek(date, { weekStartsOn: weekStart })
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export function weekdayOrder(weekStart: 0 | 1): number[] {
  return Array.from({ length: 7 }, (_, i) => (i + weekStart) % 7)
}

export function occursOn(event: CalendarEvent, key: string): boolean {
  return event.startDate <= key && key <= event.endDate
}

/** 開始時刻がない予定（終日・時刻なし）。通知は「当日／前日＋時刻」で決める */
export function hasNoStartTime(event: Pick<CalendarEvent, 'allDay' | 'startTime'>): boolean {
  return event.allDay || event.startTime === ''
}

export function compareEvents(a: CalendarEvent, b: CalendarEvent): number {
  if (a.allDay !== b.allDay) return a.allDay ? -1 : 1
  if (a.startDate !== b.startDate) return a.startDate < b.startDate ? -1 : 1
  const at = hasNoStartTime(a) ? '' : a.startTime
  const bt = hasNoStartTime(b) ? '' : b.startTime
  if (at !== bt) return at < bt ? -1 : 1
  return a.createdAt - b.createdAt
}

/** その日の開始・終了（分）。時刻なしは null */
export function daySpan(event: CalendarEvent, key: string): { start: number | null; end: number | null } {
  if (event.allDay) return { start: null, end: null }
  const s = event.startDate === key ? event.startTime : '00:00'
  const e = event.endDate === key ? event.endTime : '24:00'
  return { start: s ? toMinutes(s) : null, end: e ? toMinutes(e) : null }
}

export function eventsOn(events: CalendarEvent[], key: string): CalendarEvent[] {
  return events.filter(e => occursOn(e, key)).sort(compareEvents)
}

/** 一覧に出す時刻表記（上段・下段） */
export function timeLabels(event: CalendarEvent, key: string): [string, string] {
  if (event.allDay) return ['終日', '']
  const start = event.startDate === key ? event.startTime : '0:00'
  const end = event.endDate === key ? event.endTime : '24:00'
  if (start && end) return [start, end]
  if (start) return [`${start}〜`, '']
  if (end) return [`〜${end}`, '']
  return ['時間なし', '']
}

/** 日曜・祝日は赤、土曜は青のクラス名 */
export function weekdayClass(dow: number, holiday = false): string {
  if (dow === 0 || holiday) return 'is-sun'
  if (dow === 6) return 'is-sat'
  return ''
}
