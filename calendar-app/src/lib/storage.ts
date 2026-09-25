import { Preferences } from '@capacitor/preferences'
import { type CalendarEvent, type Settings, DEFAULT_SETTINGS } from '../types'

const EVENTS_KEY = 'events.v1'
const SETTINGS_KEY = 'settings.v1'

export async function loadEvents(): Promise<CalendarEvent[]> {
  try {
    const { value } = await Preferences.get({ key: EVENTS_KEY })
    const parsed: unknown = value ? JSON.parse(value) : []
    return Array.isArray(parsed) ? (parsed as CalendarEvent[]) : []
  } catch {
    return []
  }
}

export async function saveEvents(events: CalendarEvent[]): Promise<void> {
  await Preferences.set({ key: EVENTS_KEY, value: JSON.stringify(events) })
}

export async function loadSettings(): Promise<Settings> {
  try {
    const { value } = await Preferences.get({ key: SETTINGS_KEY })
    return { ...DEFAULT_SETTINGS, ...(value ? JSON.parse(value) : {}) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  await Preferences.set({ key: SETTINGS_KEY, value: JSON.stringify(settings) })
}
