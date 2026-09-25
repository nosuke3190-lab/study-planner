export type ColorId = 'blue' | 'teal' | 'green' | 'yellow' | 'orange' | 'pink' | 'purple' | 'gray'

/** 時間のある予定の通知: 開始の何分前か。'none' は通知なし */
export type Reminder = 'none' | '0' | '5' | '10' | '15' | '30' | '60' | '1440'

/** 終日の予定の通知日 */
export type AllDayReminderDay = 'none' | 'same' | 'before'

export interface CalendarEvent {
  id: string
  title: string
  location: string
  memo: string
  color: ColorId
  allDay: boolean
  startDate: string // yyyy-MM-dd
  startTime: string // HH:mm。'' は「時刻なし」（終日のときは使わない）
  endDate: string   // yyyy-MM-dd
  endTime: string   // HH:mm。'' は「時刻なし」（終日のときは使わない）
  reminder: Reminder
  allDayReminderDay: AllDayReminderDay
  allDayReminderTime: string // HH:mm
  notificationId: number
  createdAt: number
  updatedAt: number
}

export type EventDraft = Omit<CalendarEvent, 'id' | 'notificationId' | 'createdAt' | 'updatedAt'>

export interface Settings {
  weekStart: 0 | 1 // 0 = 日曜, 1 = 月曜
  showHolidays: boolean
  defaultReminder: Reminder
  defaultAllDayReminderDay: AllDayReminderDay
  defaultAllDayReminderTime: string
}

export const DEFAULT_SETTINGS: Settings = {
  weekStart: 0,
  showHolidays: true,
  defaultReminder: '15',
  defaultAllDayReminderDay: 'same',
  defaultAllDayReminderTime: '09:00',
}

export interface ColorDef {
  id: ColorId
  name: string
  main: string
  tint: string
  ink: string
}

export const COLORS: ColorDef[] = [
  { id: 'blue', name: '青', main: '#2F6FDB', tint: '#E3ECFB', ink: '#1D4FA8' },
  { id: 'teal', name: '青緑', main: '#1C8C8C', tint: '#DDF1F1', ink: '#116464' },
  { id: 'green', name: '緑', main: '#2E8B57', tint: '#DFF1E6', ink: '#1D6440' },
  { id: 'yellow', name: '黄', main: '#C99A06', tint: '#FAF0CF', ink: '#735700' },
  { id: 'orange', name: 'オレンジ', main: '#E0701F', tint: '#FCEBDD', ink: '#9A4409' },
  { id: 'pink', name: 'ピンク', main: '#D6457F', tint: '#FBE3EC', ink: '#A42A5B' },
  { id: 'purple', name: '紫', main: '#7B4FD6', tint: '#EDE6FB', ink: '#5733A8' },
  { id: 'gray', name: 'グレー', main: '#6B7280', tint: '#ECEDEF', ink: '#474C55' },
]

export const COLOR_MAP = Object.fromEntries(COLORS.map(c => [c.id, c])) as Record<ColorId, ColorDef>

export const REMINDER_OPTIONS: { value: Reminder; label: string }[] = [
  { value: 'none', label: 'なし' },
  { value: '0', label: '開始時' },
  { value: '5', label: '5分前' },
  { value: '10', label: '10分前' },
  { value: '15', label: '15分前' },
  { value: '30', label: '30分前' },
  { value: '60', label: '1時間前' },
  { value: '1440', label: '1日前' },
]

export const ALL_DAY_REMINDER_OPTIONS: { value: AllDayReminderDay; label: string }[] = [
  { value: 'none', label: 'なし' },
  { value: 'same', label: '当日' },
  { value: 'before', label: '前日' },
]
