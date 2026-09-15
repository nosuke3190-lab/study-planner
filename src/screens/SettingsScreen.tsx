import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { useStore } from '../store/context'
import { daysUntil, dotDay, todayStr } from '../lib/date'
import { BigButton, Card, Row, SectionLabel, Toggle } from '../components/ui'
import { buildSchedule, type PushStatus } from '../hooks/usePush'
import { clearAllData } from '../lib/storage'
import { ALL_KEYS } from '../store/keys'
import type { PermissionState } from '../hooks/useNotifications'

const PUSH_LABEL: Record<PushStatus, string> = {
  unsupported: '使えません',
  off: 'オフ',
  on: 'オン',
  error: 'エラー',
}

export default function SettingsScreen({
  onBack,
  onOpenInstall,
  permission,
  requestPermission,
  push,
}: {
  onBack: () => void
  onOpenInstall: () => void
  permission: PermissionState
  requestPermission: () => Promise<unknown>
  push: {
    status: PushStatus
    message: string
    configured: boolean
    enable: (schedule: ReturnType<typeof buildSchedule>) => Promise<boolean>
    disable: () => Promise<void>
  }
}) {
  const { exams, addExam, deleteExam, settings, setSettings, items, resetEverything } = useStore()
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [adding, setAdding] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [showPush, setShowPush] = useState(false)

  const today = todayStr()
  const sorted = useMemo(() => [...exams].sort((a, b) => a.date.localeCompare(b.date)), [exams])
  const scheduled = items.filter((it) => it.notify).length

  const wipe = () => {
    resetEverything()
    clearAllData(ALL_KEYS)
    setConfirmReset(false)
    onBack()
  }

  return (
    <div className="flex flex-col gap-3.5 px-4.5 pb-6 pt-1">
      <header className="-ml-3 flex h-13 items-center gap-0.5">
        <button type="button" onClick={onBack} aria-label="戻る" className="flex size-11 items-center justify-center">
          <ChevronLeft size={21} strokeWidth={1.8} />
        </button>
        <h1 className="text-[17px] font-bold">設定</h1>
      </header>

      <section>
        <SectionLabel>試験</SectionLabel>
        <Card className="mt-1.5 overflow-hidden">
          {sorted.map((e) => (
            <Row key={e.id}>
              <span className="min-w-0 flex-1 py-3">
                <span className="block truncate text-sm font-medium">{e.name}</span>
                <span className="num mt-0.5 block text-[11px] text-ink3">{dotDay(e.date)}</span>
              </span>
              <span className="num shrink-0 text-xs text-ink3">
                あと {daysUntil(e.date, today)} 日
              </span>
              <button
                type="button"
                onClick={() => deleteExam(e.id)}
                aria-label={`${e.name} を消す`}
                className="-mr-2 flex size-11 shrink-0 items-center justify-center text-ink3"
              >
                <Trash2 size={15} />
              </button>
            </Row>
          ))}
          {adding ? (
            <form
              onSubmit={(ev) => {
                ev.preventDefault()
                addExam(name, date)
                setName('')
                setDate('')
                setAdding(false)
              }}
              className="flex flex-col gap-2.5 p-3.5"
            >
              <input
                value={name}
                onChange={(ev) => setName(ev.target.value)}
                placeholder="試験の名前"
                aria-label="試験の名前"
                autoFocus
                className="h-11 rounded-xl border border-line bg-canvas px-3 text-sm outline-none"
              />
              <input
                type="date"
                value={date}
                onChange={(ev) => setDate(ev.target.value)}
                aria-label="試験の日"
                className="num h-11 rounded-xl border border-line bg-canvas px-3 text-sm outline-none"
              />
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setAdding(false)}
                  className="h-11 rounded-xl border border-line text-[13px] font-medium text-ink2"
                >
                  やめる
                </button>
                <button
                  type="submit"
                  disabled={!name.trim() || !date}
                  className="h-11 rounded-xl bg-ink text-[13px] font-bold text-inverse disabled:opacity-30"
                >
                  追加する
                </button>
              </div>
            </form>
          ) : (
            <Row last onClick={() => setAdding(true)} className="text-ink2">
              <Plus size={17} strokeWidth={1.8} />
              <span className="py-3.5 text-[13.5px] font-medium">試験を追加</span>
            </Row>
          )}
        </Card>
      </section>

      <section>
        <SectionLabel>通知</SectionLabel>
        <Card className="mt-1.5 overflow-hidden">
          <Row>
            <span className="flex-1 py-3">
              <span className="block text-sm font-medium">メモの通知</span>
              <span className="mt-0.5 block text-[11px] text-ink3">
                予約中 <span className="num">{scheduled}</span> 件
              </span>
            </span>
            <Toggle
              on={settings.memoNotify}
              onChange={(v) => setSettings({ memoNotify: v })}
              label="メモの通知"
            />
          </Row>
          <Row>
            <span className="flex-1 py-3">
              <span className="block text-sm font-medium">日記のリマインダー</span>
              <span className="mt-0.5 block text-[11px] text-ink3">毎日</span>
            </span>
            <input
              type="time"
              value={settings.journalReminder.time}
              onChange={(e) =>
                setSettings({
                  journalReminder: { ...settings.journalReminder, time: e.target.value },
                })
              }
              aria-label="日記のリマインダーの時刻"
              className="num mr-3 bg-transparent text-right text-[13px] font-medium outline-none"
            />
            <Toggle
              on={settings.journalReminder.enabled}
              onChange={(v) =>
                setSettings({ journalReminder: { ...settings.journalReminder, enabled: v } })
              }
              label="日記のリマインダー"
            />
          </Row>
          <Row last>
            <span className="flex-1 py-3.5 text-sm font-medium">集中タイマーの終了</span>
            <Toggle
              on={settings.timerDone}
              onChange={(v) => setSettings({ timerDone: v })}
              label="集中タイマーの終了"
            />
          </Row>
        </Card>
        {permission !== 'granted' && (
          <button
            type="button"
            onClick={() => void requestPermission()}
            className="mt-2 px-0.5 text-[11.5px] font-bold text-ink underline underline-offset-4"
          >
            {permission === 'denied'
              ? '通知がブロックされています。端末の設定から許可してください'
              : '通知を許可する'}
          </button>
        )}
        {permission === 'granted' && (
          <p className="mt-2 px-0.5 text-[11px] text-ink3">通知は許可済みです</p>
        )}
      </section>

      <section>
        <SectionLabel>閉じている間の通知</SectionLabel>
        <Card className="mt-1.5 overflow-hidden">
          <Row last={!showPush} onClick={() => setShowPush((v) => !v)}>
            <span className="flex-1 py-3">
              <span className="block text-sm font-medium">Web Push</span>
              <span className="mt-0.5 block text-[11px] text-ink3">
                {push.configured ? PUSH_LABEL[push.status] : 'サーバー未設定'}
              </span>
            </span>
            <ChevronRight size={16} className="shrink-0 text-ink3" />
          </Row>
          {showPush && (
            <div className="flex flex-col gap-2.5 border-t border-line p-3.5">
              <p className="text-[11.5px] leading-relaxed text-ink2">
                アプリを閉じている間の通知は、中継サーバーがないと届きません。server/ の
                手順どおりに立てたあと、その URL と公開鍵をここに入れてください。
              </p>
              <input
                value={settings.pushEndpoint}
                onChange={(e) => setSettings({ pushEndpoint: e.target.value })}
                placeholder="https://..."
                aria-label="通知サーバーの URL"
                inputMode="url"
                className="h-11 rounded-xl border border-line bg-canvas px-3 text-[13px] outline-none"
              />
              <input
                value={settings.pushPublicKey}
                onChange={(e) => setSettings({ pushPublicKey: e.target.value })}
                placeholder="VAPID の公開鍵"
                aria-label="VAPID の公開鍵"
                className="h-11 rounded-xl border border-line bg-canvas px-3 text-[13px] outline-none"
              />
              {push.message && <p className="text-[11.5px] text-ink2">{push.message}</p>}
              {push.status === 'on' ? (
                <button
                  type="button"
                  onClick={() => void push.disable()}
                  className="h-11 rounded-xl border border-line text-[13px] font-medium text-ink2"
                >
                  受け取りをやめる
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!push.configured}
                  onClick={() => void push.enable(buildSchedule(items, settings))}
                  className="h-11 rounded-xl bg-ink text-[13px] font-bold text-inverse disabled:opacity-30"
                >
                  この端末で受け取る
                </button>
              )}
            </div>
          )}
        </Card>
      </section>

      <section>
        <SectionLabel>アプリ</SectionLabel>
        <Card className="mt-1.5 overflow-hidden">
          <Row onClick={onOpenInstall}>
            <span className="flex-1 py-3">
              <span className="block text-sm font-medium">ホーム画面に追加</span>
              <span className="mt-0.5 block text-[11px] text-ink3">手順を見る</span>
            </span>
            <ChevronRight size={16} className="shrink-0 text-ink3" />
          </Row>
          <Row last>
            <span className="flex-1 py-3">
              <span className="block text-sm font-medium">オフラインで使う</span>
              <span className="mt-0.5 block text-[11px] text-ink3">電波がなくても開けます</span>
            </span>
            <span className="text-xs font-bold text-good">有効</span>
          </Row>
        </Card>
      </section>

      <section>
        <SectionLabel>データ</SectionLabel>
        <Card className="mt-1.5 overflow-hidden">
          <Row last onClick={() => setConfirmReset(true)}>
            <span className="flex-1 py-3.5 text-sm font-medium">すべてのデータを削除</span>
            <span className="text-xs font-bold text-danger">削除</span>
          </Row>
        </Card>
        <p className="mt-2 px-0.5 text-[11px] leading-relaxed text-ink3">
          データはこの端末のブラウザの中だけに保存されます。閲覧履歴を消したり、別の端末で開いたりすると読み込めません。
        </p>
      </section>

      {confirmReset && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/45 p-4" role="dialog" aria-modal="true">
          <Card className="safe-b w-full p-5">
            <h2 className="text-base font-bold">すべて消しますか？</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-ink2">
              メモ、タスク、日記、集中の記録、試験がすべて消えます。元には戻せません。
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="h-12 rounded-xl border border-line text-[13px] font-medium text-ink2"
              >
                やめる
              </button>
              <button
                type="button"
                onClick={wipe}
                className="h-12 rounded-xl bg-danger text-[13px] font-bold text-white"
              >
                すべて消す
              </button>
            </div>
          </Card>
        </div>
      )}

      <BigButton onClick={onBack} className="mt-2">
        とじる
      </BigButton>
    </div>
  )
}
