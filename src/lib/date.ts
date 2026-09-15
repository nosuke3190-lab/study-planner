import { addDays, format, parseISO, startOfDay } from 'date-fns'
import { ja } from 'date-fns/locale'
import type { Repeat } from '../types'

export const ISO = 'yyyy-MM-dd'

export function todayStr(now: Date = new Date()): string {
  return format(now, ISO)
}

export function parseDay(iso: string): Date {
  return startOfDay(parseISO(iso))
}

export function shiftDay(iso: string, days: number): string {
  return format(addDays(parseDay(iso), days), ISO)
}

/** 「9月15日（火）」 */
export function longDay(iso: string): string {
  return format(parseDay(iso), 'M月d日（E）', { locale: ja })
}

/** 「2026.10.27（火）」 */
export function dotDay(iso: string): string {
  return format(parseDay(iso), 'yyyy.MM.dd（E）', { locale: ja })
}

/** 「9月15日」 */
export function shortDay(iso: string): string {
  return format(parseDay(iso), 'M月d日', { locale: ja })
}

export function weekdayLabel(iso: string): string {
  return format(parseDay(iso), 'E', { locale: ja })
}

/** from から to までの日数。同じ日なら 0、未来なら正の数 */
export function daysUntil(iso: string, from: string = todayStr()): number {
  const ms = parseDay(iso).getTime() - parseDay(from).getTime()
  return Math.round(ms / 86_400_000)
}

/** 直近 n 日の日付を古い順に返す */
export function lastDays(n: number, end: string = todayStr()): string[] {
  return Array.from({ length: n }, (_, i) => shiftDay(end, i - (n - 1)))
}

/** ローカル日時 'YYYY-MM-DDTHH:mm' を作る */
export function localStamp(d: Date = new Date()): string {
  return format(d, "yyyy-MM-dd'T'HH:mm")
}

/** ローカル日時文字列をミリ秒に。不正な値は NaN */
export function stampToMs(stamp: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(stamp)
  if (!m) return NaN
  return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], 0, 0).getTime()
}

export function stampDay(stamp: string): string {
  return stamp.slice(0, 10)
}

export function stampTime(stamp: string): string {
  return stamp.slice(11, 16)
}

export function repeatLabel(r: Repeat | undefined): string {
  if (!r || r.type === 'none') return 'なし'
  if (r.type === 'daily') return '毎日'
  if (r.days.length === 0) return 'なし'
  const names = ['日', '月', '火', '水', '木', '金', '土']
  return '毎週 ' + [...r.days].sort((a, b) => a - b).map((d) => names[d]).join('・')
}

function matchesRepeat(iso: string, r: Repeat): boolean {
  if (r.type === 'daily') return true
  if (r.type === 'weekly') return r.days.includes(parseDay(iso).getDay())
  return false
}

/**
 * after より後で repeat に合う最初の日を返す。
 * 繰り返しが none、または週指定が空なら null。
 */
export function nextOccurrence(after: string, r: Repeat, notBefore?: string): string | null {
  if (r.type === 'none') return null
  if (r.type === 'weekly' && r.days.length === 0) return null
  let cursor = shiftDay(after, 1)
  if (notBefore && daysUntil(cursor, notBefore) > 0) cursor = notBefore
  for (let i = 0; i < 400; i++) {
    if (matchesRepeat(cursor, r)) return cursor
    cursor = shiftDay(cursor, 1)
  }
  return null
}

/** 通知の次回時刻。繰り返しが無ければ null */
export function nextNotifyStamp(stamp: string, r: Repeat): string | null {
  const day = stampDay(stamp)
  const next = nextOccurrence(day, r)
  return next ? next + 'T' + stampTime(stamp) : null
}

/** ミリ秒をローカルの YYYY-MM-DD に */
export function dayOf(ms: number): string {
  return format(new Date(ms), ISO)
}

/** 曜日番号。日曜が 0 */
export function weekdayIndex(iso: string): number {
  return parseDay(iso).getDay()
}
