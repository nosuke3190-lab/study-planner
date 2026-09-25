import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { format } from 'date-fns'
import { type CalendarEvent, type Settings, COLOR_MAP } from '../types'
import { isNative } from './notifications'

interface BackupFile {
  app: 'calendar'
  version: 1
  exportedAt: string
  events: CalendarEvent[]
  settings: Settings
}

export async function exportBackup(events: CalendarEvent[], settings: Settings): Promise<void> {
  const data: BackupFile = { app: 'calendar', version: 1, exportedAt: new Date().toISOString(), events, settings }
  const json = JSON.stringify(data, null, 2)
  const fileName = `calendar-backup-${format(new Date(), 'yyyyMMdd-HHmm')}.json`

  if (isNative) {
    const { uri } = await Filesystem.writeFile({
      path: fileName,
      data: json,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    })
    await Share.share({ title: 'カレンダーのバックアップ', files: [uri] })
    return
  }

  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
}

function isEvent(x: unknown): x is CalendarEvent {
  if (typeof x !== 'object' || x === null) return false
  const e = x as Record<string, unknown>
  return (
    typeof e.id === 'string' &&
    typeof e.title === 'string' &&
    typeof e.startDate === 'string' &&
    typeof e.endDate === 'string' &&
    typeof e.allDay === 'boolean' &&
    typeof e.notificationId === 'number' &&
    typeof e.color === 'string' && e.color in COLOR_MAP
  )
}

export async function parseBackup(file: File): Promise<{ events: CalendarEvent[]; settings?: Partial<Settings> }> {
  let data: unknown
  try {
    data = JSON.parse(await file.text())
  } catch {
    throw new Error('ファイルを読み込めませんでした。バックアップのファイルを選んでください。')
  }
  const d = data as Partial<BackupFile>
  if (d?.app !== 'calendar' || !Array.isArray(d.events) || !d.events.every(isEvent)) {
    throw new Error('このアプリのバックアップファイルではありません。')
  }
  return { events: d.events, settings: d.settings }
}
