import { useCallback, useEffect, useState } from 'react'
import { Bell, TriangleAlert, X } from 'lucide-react'
import { StoreProvider } from './store/store'
import { useStore } from './store/context'
import { useNotifications } from './hooks/useNotifications'
import { useFocusTimer, type FinishedSession } from './hooks/useFocusTimer'
import { buildSchedule, usePush } from './hooks/usePush'
import { isStandalone } from './lib/browser'
import { dayOf } from './lib/date'
import TabBar, { type Tab } from './components/TabBar'
import { BigButton, Card } from './components/ui'
import HomeScreen from './screens/HomeScreen'
import MemoScreen from './screens/MemoScreen'
import MemoDetailScreen from './screens/MemoDetailScreen'
import FocusScreen from './screens/FocusScreen'
import FocusRunningScreen from './screens/FocusRunningScreen'
import ReviewScreen from './screens/ReviewScreen'
import CalendarScreen from './screens/CalendarScreen'
import TriageScreen from './screens/TriageScreen'
import SettingsScreen from './screens/SettingsScreen'
import InstallScreen from './screens/InstallScreen'

type View =
  | { t: 'tab'; tab: Tab }
  | { t: 'detail'; id: string }
  | { t: 'triage' }
  | { t: 'calendar' }
  | { t: 'settings' }
  | { t: 'install' }

function Shell() {
  const store = useStore()
  const { settings, setSettings, items, captureMemo, addSession, storageFailed } = store
  const { permission, request, missed, dismissMissed } = useNotifications()
  const push = usePush(settings)

  const [view, setView] = useState<View>({ t: 'tab', tab: 'home' })
  const [lastTab, setLastTab] = useState<Tab>('home')

  const onFinish = useCallback(
    (s: FinishedSession) => {
      addSession({
        date: dayOf(s.startedAt),
        startedAt: s.startedAt,
        endedAt: s.endedAt,
        plannedMin: s.plannedMin,
        actualSec: s.actualSec,
        label: s.label,
        itemId: s.itemId,
        completed: s.completed,
      })
    },
    [addSession],
  )

  const timer = useFocusTimer(onFinish, settings.timerDone)

  /* 通知の予定が変わったらサーバーにも送り直す */
  const pushSync = push.sync
  useEffect(() => {
    const t = window.setTimeout(() => {
      void pushSync(buildSchedule(items, settings))
    }, 1200)
    return () => window.clearTimeout(t)
  }, [items, settings, pushSync])

  /* 初回だけ、ホーム画面への追加を案内する */
  useEffect(() => {
    if (settings.installDismissed || isStandalone()) return
    const t = window.setTimeout(() => setView({ t: 'install' }), 700)
    return () => window.clearTimeout(t)
  }, [settings.installDismissed])

  const goTab = (tab: Tab) => {
    setLastTab(tab)
    setView({ t: 'tab', tab })
  }
  const back = () => setView({ t: 'tab', tab: lastTab })

  const startFocus = (min: number, label: string, itemId?: string) => {
    timer.start(min, label, itemId)
  }

  if (timer.phase === 'running' || timer.phase === 'paused') {
    return (
      <FocusRunningScreen
        remainingSec={timer.remainingSec}
        plannedMin={timer.plannedMin}
        label={timer.label}
        paused={timer.phase === 'paused'}
        onPause={timer.pause}
        onResume={timer.resume}
        onStop={timer.stop}
        onMemo={(text) => captureMemo(text, null)}
      />
    )
  }

  if (timer.phase === 'done') {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-5 px-8 text-center">
        <p className="text-5xl" aria-hidden>
          🌱
        </p>
        <div>
          <h1 className="text-xl font-bold">おつかれさま</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink2">
            <span className="num">{timer.plannedMin}</span> 分の集中が終わりました。
          </p>
        </div>
        <BigButton
          onClick={() => {
            timer.acknowledge()
            goTab('focus')
          }}
          className="max-w-xs"
        >
          もどる
        </BigButton>
      </div>
    )
  }

  const showTabs = view.t === 'tab'

  return (
    <div className="flex h-full flex-col">
      <main className="no-scrollbar safe-t flex-1 overflow-y-auto">
        {storageFailed && (
          <div className="px-4.5 pt-3">
            <Card tone="muted" className="flex items-start gap-3 border-danger p-3.5">
              <TriangleAlert size={17} className="mt-0.5 shrink-0 text-danger" />
              <p className="flex-1 text-[12.5px] leading-relaxed">
                この端末に保存できませんでした。ブラウザの空き容量が足りないか、プライベートモードで開いています。書いたものが残りません。
              </p>
            </Card>
          </div>
        )}

        {missed.length > 0 && (
          <div className="px-4.5 pt-3">
            <Card tone="muted" className="flex items-start gap-3 p-3.5">
              <Bell size={17} className="mt-0.5 shrink-0 text-ink2" />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold">
                  閉じている間に <span className="num">{missed.length}</span> 件の通知予定が過ぎました
                </p>
                <ul className="mt-1.5 flex list-none flex-col gap-1 p-0">
                  {missed.slice(0, 3).map((m) => (
                    <li key={m.id + m.at} className="truncate text-[12px] text-ink2">
                      {m.text}
                    </li>
                  ))}
                </ul>
              </div>
              <button
                type="button"
                onClick={dismissMissed}
                aria-label="この知らせを閉じる"
                className="-mr-1.5 -mt-1.5 flex size-11 shrink-0 items-center justify-center text-ink3"
              >
                <X size={16} />
              </button>
            </Card>
          </div>
        )}

        {view.t === 'tab' && view.tab === 'home' && (
          <HomeScreen
            onOpenSettings={() => setView({ t: 'settings' })}
            onOpenItem={(id) => setView({ t: 'detail', id })}
            onOpenTriage={() => setView({ t: 'triage' })}
          />
        )}
        {view.t === 'tab' && view.tab === 'memo' && (
          <MemoScreen
            onOpenItem={(id) => setView({ t: 'detail', id })}
            onOpenTriage={() => setView({ t: 'triage' })}
          />
        )}
        {view.t === 'tab' && view.tab === 'focus' && <FocusScreen onStart={startFocus} />}
        {view.t === 'tab' && view.tab === 'review' && (
          <ReviewScreen onOpenCalendar={() => setView({ t: 'calendar' })} />
        )}

        {view.t === 'detail' && (
          <MemoDetailScreen
            id={view.id}
            onBack={back}
            onStartFocus={(id, label) => startFocus(settings.lastTimerMin || 25, label, id)}
          />
        )}
        {view.t === 'triage' && <TriageScreen onClose={back} />}
        {view.t === 'calendar' && <CalendarScreen onBack={() => setView({ t: 'tab', tab: 'review' })} />}
        {view.t === 'settings' && (
          <SettingsScreen
            onBack={back}
            onOpenInstall={() => setView({ t: 'install' })}
            permission={permission}
            requestPermission={request}
            push={push}
          />
        )}
        {view.t === 'install' && (
          <InstallScreen
            onBack={back}
            onDone={() => {
              setSettings({ installDismissed: true })
              setView({ t: 'tab', tab: lastTab })
            }}
          />
        )}
      </main>

      {showTabs && <TabBar active={view.tab} onChange={goTab} />}
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  )
}
