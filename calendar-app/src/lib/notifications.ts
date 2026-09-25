import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { addDays, addMinutes, parse } from 'date-fns'
import { type CalendarEvent, REMINDER_OPTIONS } from '../types'
import { formatDayLabel, hasNoStartTime } from './date'

const CHANNEL_ID = 'reminders'
// Android はアプリごとに予約できるアラーム数に上限（約500）があるため、近いものから予約する
const MAX_SCHEDULED = 200

export type PermissionStatus = 'granted' | 'denied' | 'prompt' | 'unsupported'

export const isNative = Capacitor.isNativePlatform()

export async function initNotifications(): Promise<void> {
  if (!isNative) return
  // 普通の通知（アラームのように鳴り続けたり全画面表示したりはしない）
  await LocalNotifications.createChannel({
    id: CHANNEL_ID,
    name: '予定の通知',
    description: '予定の前にお知らせします',
    importance: 4,
    visibility: 1,
    vibration: true,
  })
}

export async function checkPermission(): Promise<PermissionStatus> {
  if (!isNative) return 'unsupported'
  const { display } = await LocalNotifications.checkPermissions()
  if (display === 'granted') return 'granted'
  if (display === 'denied') return 'denied'
  return 'prompt'
}

export async function requestPermission(): Promise<PermissionStatus> {
  if (!isNative) return 'unsupported'
  const { display } = await LocalNotifications.requestPermissions()
  if (display === 'granted') return 'granted'
  if (display === 'denied') return 'denied'
  return 'prompt'
}

/** 通知を出す日時（通知なしなら null） */
export function reminderAt(event: CalendarEvent): Date | null {
  if (hasNoStartTime(event)) {
    if (event.allDayReminderDay === 'none') return null
    const base = parse(`${event.startDate} ${event.allDayReminderTime}`, 'yyyy-MM-dd HH:mm', new Date())
    return event.allDayReminderDay === 'before' ? addDays(base, -1) : base
  }
  if (event.reminder === 'none') return null
  const start = parse(`${event.startDate} ${event.startTime}`, 'yyyy-MM-dd HH:mm', new Date())
  return addMinutes(start, -Number(event.reminder))
}

function notificationBody(event: CalendarEvent): string {
  const parts: string[] = []
  const day = formatDayLabel(event.startDate)
  if (event.allDay) {
    parts.push(`${day} 終日`)
  } else if (!event.startTime) {
    parts.push(event.endTime ? `${day} 〜${event.endTime}` : day)
  } else {
    const label = REMINDER_OPTIONS.find(o => o.value === event.reminder)?.label ?? ''
    const when = event.reminder === '0' ? '今から' : label.replace('前', '後')
    parts.push(`${day} ${event.startTime}〜${event.endTime}（${when}）`)
  }
  if (event.location) parts.push(event.location)
  return parts.join('・')
}

async function doSync(events: CalendarEvent[]): Promise<void> {
  if (!isNative) return
  if ((await checkPermission()) !== 'granted') return

  const pending = await LocalNotifications.getPending()
  if (pending.notifications.length > 0) {
    await LocalNotifications.cancel({ notifications: pending.notifications.map(n => ({ id: n.id })) })
  }

  const now = Date.now()
  const upcoming = events
    .map(event => ({ event, at: reminderAt(event) }))
    .filter((x): x is { event: CalendarEvent; at: Date } => x.at !== null && x.at.getTime() > now)
    .sort((a, b) => a.at.getTime() - b.at.getTime())
    .slice(0, MAX_SCHEDULED)

  if (upcoming.length === 0) return
  await LocalNotifications.schedule({
    notifications: upcoming.map(({ event, at }) => ({
      id: event.notificationId,
      title: event.title || '（タイトルなし）',
      body: notificationBody(event),
      channelId: CHANNEL_ID,
      schedule: { at, allowWhileIdle: true },
      extra: { eventId: event.id },
    })),
  })
}

let queue: Promise<void> = Promise.resolve()

/** 予定の一覧に合わせて通知の予約をすべて付け直す（連続で呼ばれても順番に処理） */
export function syncNotifications(events: CalendarEvent[]): Promise<void> {
  queue = queue.then(() => doSync(events)).catch(err => console.error('通知の予約に失敗しました', err))
  return queue
}
