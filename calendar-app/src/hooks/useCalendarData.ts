import { useCallback, useEffect, useRef, useState } from 'react'
import type { CalendarEvent, EventDraft, Settings } from '../types'
import { DEFAULT_SETTINGS } from '../types'
import { loadEvents, loadSettings, saveEvents, saveSettings } from '../lib/storage'
import { syncNotifications } from '../lib/notifications'

function newNotificationId(events: CalendarEvent[]): number {
  const used = new Set(events.map(e => e.notificationId))
  let id: number
  do {
    id = 1 + Math.floor(Math.random() * 2_000_000_000)
  } while (used.has(id))
  return id
}

export function useCalendarData() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [loaded, setLoaded] = useState(false)
  const eventsRef = useRef(events)
  useEffect(() => { eventsRef.current = events }, [events])

  useEffect(() => {
    let cancelled = false
    Promise.all([loadEvents(), loadSettings()]).then(([ev, st]) => {
      if (cancelled) return
      setEvents(ev)
      setSettings(st)
      setLoaded(true)
    })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!loaded) return
    saveEvents(events).catch(err => console.error('保存に失敗しました', err))
    syncNotifications(events)
  }, [events, loaded])

  useEffect(() => {
    if (!loaded) return
    saveSettings(settings).catch(err => console.error('保存に失敗しました', err))
  }, [settings, loaded])

  const addEvent = useCallback((draft: EventDraft) => {
    setEvents(prev => {
      const now = Date.now()
      return [...prev, { ...draft, id: crypto.randomUUID(), notificationId: newNotificationId(prev), createdAt: now, updatedAt: now }]
    })
  }, [])

  const updateEvent = useCallback((id: string, draft: EventDraft) => {
    setEvents(prev => prev.map(e => (e.id === id ? { ...e, ...draft, updatedAt: Date.now() } : e)))
  }, [])

  const deleteEvent = useCallback((id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id))
  }, [])

  const replaceAll = useCallback((next: CalendarEvent[], nextSettings?: Partial<Settings>) => {
    setEvents(next)
    if (nextSettings) setSettings(s => ({ ...s, ...nextSettings }))
  }, [])

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings(s => ({ ...s, ...patch }))
  }, [])

  /** 通知の許可が変わったときなどに予約をやり直す */
  const resync = useCallback(() => syncNotifications(eventsRef.current), [])

  return { events, settings, loaded, addEvent, updateEvent, deleteEvent, replaceAll, updateSettings, resync }
}
