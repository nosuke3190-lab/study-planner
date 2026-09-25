import { useCallback, useEffect, useRef, useState } from 'react'
import { App as CapApp } from '@capacitor/app'
import { addMonths, addWeeks, format, startOfMonth } from 'date-fns'
import type { CalendarEvent, EventDraft } from './types'
import { useCalendarData } from './hooks/useCalendarData'
import { fromKey, toKey, todayKey, weekDays } from './lib/date'
import { holidayName } from './lib/holidays'
import { type PermissionStatus, checkPermission, initNotifications, isNative, requestPermission } from './lib/notifications'
import { exportBackup, parseBackup } from './lib/backup'
import CalendarHeader from './components/CalendarHeader'
import MonthView from './components/MonthView'
import DaySheet from './components/DaySheet'
import WeekView from './components/WeekView'
import EventForm from './components/EventForm'
import SearchScreen from './components/SearchScreen'
import SettingsScreen from './components/SettingsScreen'
import { PlusIcon } from './components/Icons'

type View = 'month' | 'week'
type Screen =
  | { type: 'form'; initial: EventDraft; editing?: CalendarEvent }
  | { type: 'search' }
  | { type: 'settings' }
  | null

function nowMinutes(): number {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}

export default function App() {
  const data = useCalendarData()
  const { events, settings } = data

  const [view, setView] = useState<View>('month')
  const [today, setToday] = useState(todayKey)
  const [now, setNow] = useState(nowMinutes)
  const [selectedKey, setSelectedKey] = useState(todayKey)
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [screens, setScreens] = useState<Screen[]>([])
  const [permission, setPermission] = useState<PermissionStatus>('unsupported')
  const [toast, setToast] = useState('')
  const screen = screens.length > 0 ? screens[screens.length - 1] : null

  const pushScreen = (s: Screen) => setScreens(prev => [...prev, s])
  const popScreen = useCallback(() => setScreens(prev => prev.slice(0, -1)), [])

  const showToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 3000)
  }

  // 日付・現在時刻の更新（週表示の赤い線、日付が変わったときの「今日」）
  useEffect(() => {
    const tick = () => { setToday(todayKey()); setNow(nowMinutes()) }
    const timer = window.setInterval(tick, 60_000)
    let resume: { remove: () => void } | undefined
    if (isNative) {
      CapApp.addListener('resume', () => {
        tick()
        checkPermission().then(setPermission)
      }).then(h => { resume = h })
    }
    return () => { window.clearInterval(timer); resume?.remove() }
  }, [])

  // 通知の準備と、初回起動時の許可のお願い
  const resync = data.resync
  useEffect(() => {
    if (!isNative) return
    ;(async () => {
      await initNotifications()
      let status = await checkPermission()
      if (status === 'prompt') status = await requestPermission()
      setPermission(status)
      if (status === 'granted') resync()
    })().catch(err => console.error(err))
  }, [resync])

  // Android の戻るボタン
  const screensRef = useRef(screens)
  useEffect(() => { screensRef.current = screens }, [screens])
  useEffect(() => {
    if (!isNative) return
    let handle: { remove: () => void } | undefined
    CapApp.addListener('backButton', () => {
      if (screensRef.current.length > 0) popScreen()
      else CapApp.minimizeApp()
    }).then(h => { handle = h })
    return () => handle?.remove()
  }, [popScreen])

  const selectDay = (key: string) => {
    setSelectedKey(key)
    setMonth(startOfMonth(fromKey(key)))
  }

  const goToday = () => selectDay(todayKey())

  const move = (dir: 1 | -1) => {
    if (view === 'month') {
      const next = addMonths(month, dir)
      setMonth(next)
      const t = todayKey()
      setSelectedKey(format(next, 'yyyy-MM') === t.slice(0, 7) ? t : toKey(next))
    } else {
      selectDay(toKey(addWeeks(fromKey(selectedKey), dir)))
    }
  }

  const newDraft = (date: string, hour?: number): EventDraft => {
    const h = hour ?? Math.min(23, new Date().getHours() + 1)
    const endH = Math.min(23, h + 1)
    return {
      title: '',
      location: '',
      memo: '',
      color: 'green',
      allDay: false,
      startDate: date,
      startTime: `${String(h).padStart(2, '0')}:00`,
      endDate: date,
      endTime: h === 23 ? '23:59' : `${String(endH).padStart(2, '0')}:00`,
      reminder: settings.defaultReminder,
      allDayReminderDay: settings.defaultAllDayReminderDay,
      allDayReminderTime: settings.defaultAllDayReminderTime,
    }
  }

  const openNew = (date = selectedKey, hour?: number) => pushScreen({ type: 'form', initial: newDraft(date, hour) })

  const openEvent = (event: CalendarEvent) => {
    const { id: _id, notificationId: _n, createdAt: _c, updatedAt: _u, ...draft } = event
    pushScreen({ type: 'form', initial: draft, editing: event })
  }

  const handleSave = async (draft: EventDraft, editing?: CalendarEvent) => {
    if (editing) data.updateEvent(editing.id, draft)
    else data.addEvent(draft)
    popScreen()
    selectDay(draft.startDate)
    const wantsReminder = draft.allDay ? draft.allDayReminderDay !== 'none' : draft.reminder !== 'none'
    if (isNative && wantsReminder && permission === 'prompt') {
      const status = await requestPermission()
      setPermission(status)
      if (status === 'granted') data.resync()
    }
  }

  const handleRequestPermission = async () => {
    const status = await requestPermission()
    setPermission(status)
    if (status === 'granted') data.resync()
  }

  const handleExport = async () => {
    try {
      await exportBackup(events, settings)
    } catch (err) {
      // 共有画面を閉じただけのときもここに来るので、控えめに知らせる
      console.error(err)
    }
  }

  const handleImport = async (file: File) => {
    try {
      const backup = await parseBackup(file)
      if (!window.confirm(`バックアップの予定（${backup.events.length}件）で、今の予定を置き換えます。よろしいですか？`)) return
      data.replaceAll(backup.events, backup.settings)
      showToast('バックアップを読み込みました')
    } catch (err) {
      showToast(err instanceof Error ? err.message : '読み込みに失敗しました')
    }
  }

  if (!data.loaded) return <div className="loading">読み込み中…</div>

  const days = weekDays(fromKey(selectedKey), settings.weekStart)
  const first = days[0]
  const last = days[6]
  const title = view === 'month'
    ? format(month, 'yyyy年M月')
    : first.getMonth() === last.getMonth()
      ? `${first.getMonth() + 1}月${first.getDate()}日〜${last.getDate()}日`
      : `${first.getMonth() + 1}月${first.getDate()}日〜${last.getMonth() + 1}月${last.getDate()}日`

  return (
    <div className="app">
      <CalendarHeader
        title={title}
        unit={view === 'month' ? '月' : '週'}
        onPrev={() => move(-1)}
        onNext={() => move(1)}
        onToday={goToday}
        onSearch={() => pushScreen({ type: 'search' })}
        onSettings={() => pushScreen({ type: 'settings' })}
      />

      <div className="segment" role="group" aria-label="表示の切り替え">
        <button type="button" aria-pressed={view === 'month'} onClick={() => { setView('month'); setMonth(startOfMonth(fromKey(selectedKey))) }}>月</button>
        <button type="button" aria-pressed={view === 'week'} onClick={() => setView('week')}>週</button>
      </div>

      {view === 'month' ? (
        <>
          <MonthView month={month} selectedKey={selectedKey} today={today} events={events} settings={settings} onSelect={selectDay} />
          <DaySheet dayKey={selectedKey} holiday={settings.showHolidays ? holidayName(selectedKey) : ''} events={events} onOpen={openEvent} />
        </>
      ) : (
        <WeekView
          days={days}
          today={today}
          nowMinutes={now}
          events={events}
          settings={settings}
          onOpen={openEvent}
          onCreateAt={(key, hour) => openNew(key, hour)}
          onSelectDay={key => { selectDay(key); setView('month') }}
        />
      )}

      <button type="button" className="fab" aria-label="予定を追加" onClick={() => openNew()}>
        <PlusIcon size={26} />
      </button>

      {screen?.type === 'search' && (
        <SearchScreen events={events} today={today} onOpen={openEvent} onClose={popScreen} />
      )}
      {screen?.type === 'settings' && (
        <SettingsScreen
          settings={settings}
          permission={permission}
          onChange={data.updateSettings}
          onRequestPermission={handleRequestPermission}
          onExport={handleExport}
          onImport={handleImport}
          onClose={popScreen}
        />
      )}
      {screen?.type === 'form' && (
        <EventForm
          key={screen.editing?.id ?? 'new'}
          initial={screen.initial}
          editing={screen.editing}
          onSave={draft => handleSave(draft, screen.editing)}
          onDelete={screen.editing ? () => { data.deleteEvent(screen.editing!.id); popScreen() } : undefined}
          onClose={popScreen}
        />
      )}

      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  )
}
