import { useRef } from 'react'
import type { AllDayReminderDay, Reminder, Settings } from '../types'
import { ALL_DAY_REMINDER_OPTIONS, REMINDER_OPTIONS } from '../types'
import type { PermissionStatus } from '../lib/notifications'
import { ChevronLeft, ChevronRight, DownloadIcon, UploadIcon } from './Icons'

interface Props {
  settings: Settings
  permission: PermissionStatus
  onChange: (patch: Partial<Settings>) => void
  onRequestPermission: () => void
  onExport: () => void
  onImport: (file: File) => void
  onClose: () => void
}

export default function SettingsScreen({ settings, permission, onChange, onRequestPermission, onExport, onImport, onClose }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <div className="screen" role="dialog" aria-modal="true" aria-label="設定">
      <div className="screen-header">
        <button type="button" className="icon-btn" aria-label="戻る" onClick={onClose}><ChevronLeft size={22} /></button>
        <h1>設定</h1>
      </div>

      <div className="screen__scroll">
        <div className="settings">
          <span className="settings__section">表示</span>
          <div className="card">
            <div className="settings-row">
              <span className="settings-row__main">週の始まり</span>
              <div className="mini-seg">
                <button type="button" aria-pressed={settings.weekStart === 0} onClick={() => onChange({ weekStart: 0 })}>日曜</button>
                <button type="button" aria-pressed={settings.weekStart === 1} onClick={() => onChange({ weekStart: 1 })}>月曜</button>
              </div>
            </div>
            <div className="settings-row">
              <span className="settings-row__main">祝日を表示</span>
              <button type="button" role="switch" aria-checked={settings.showHolidays} aria-label="祝日を表示" className="switch"
                onClick={() => onChange({ showHolidays: !settings.showHolidays })}><span /></button>
            </div>
          </div>

          <span className="settings__section">通知</span>
          <div className="card">
            <div className="settings-row">
              <span className="settings-row__main">通知の許可</span>
              {permission === 'granted' && <span className="status-pill is-ok">許可済み</span>}
              {permission === 'prompt' && <button type="button" className="link-btn" onClick={onRequestPermission}>許可する</button>}
              {permission === 'denied' && <span className="status-pill is-ng">オフ</span>}
              {permission === 'unsupported' && <span className="row__value">アプリ版のみ</span>}
            </div>
            <label className="settings-row">
              <span className="settings-row__main">新しい予定の通知</span>
              <span className="select-wrap">
                {REMINDER_OPTIONS.find(o => o.value === settings.defaultReminder)?.label}
                <ChevronRight size={16} />
                <select aria-label="新しい予定の通知" value={settings.defaultReminder}
                  onChange={e => onChange({ defaultReminder: e.target.value as Reminder })}>
                  {REMINDER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </span>
            </label>
            <div className="settings-row">
              <span className="settings-row__main">終日の予定の通知</span>
              <div className="picker-group">
                <label className="picker-chip">
                  {ALL_DAY_REMINDER_OPTIONS.find(o => o.value === settings.defaultAllDayReminderDay)?.label}
                  <select aria-label="終日の予定を通知する日" value={settings.defaultAllDayReminderDay}
                    onChange={e => onChange({ defaultAllDayReminderDay: e.target.value as AllDayReminderDay })}>
                    {ALL_DAY_REMINDER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </label>
                {settings.defaultAllDayReminderDay !== 'none' && (
                  <label className="picker-chip is-time">
                    {settings.defaultAllDayReminderTime}
                    <input type="time" aria-label="終日の予定を通知する時刻" value={settings.defaultAllDayReminderTime}
                      onChange={e => e.target.value && onChange({ defaultAllDayReminderTime: e.target.value })} />
                  </label>
                )}
              </div>
            </div>
          </div>
          {permission === 'denied' && (
            <p className="settings__note">通知がオフになっています。スマホの「設定」→「アプリ」→「カレンダー」→「通知」からオンにしてください。</p>
          )}
          <p className="settings__note">ここで選んだ通知は、これから追加する予定の初期値になります。</p>

          <span className="settings__section">データ</span>
          <div className="card">
            <button type="button" className="settings-row" onClick={onExport}>
              <span className="settings-row__main"><DownloadIcon size={18} />バックアップを書き出す</span>
            </button>
            <button type="button" className="settings-row" onClick={() => fileRef.current?.click()}>
              <span className="settings-row__main"><UploadIcon size={18} />バックアップから読み込む</span>
            </button>
          </div>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden
            onChange={e => {
              const file = e.target.files?.[0]
              if (file) onImport(file)
              e.target.value = ''
            }} />
          <p className="settings__note">予定はこのスマホの中だけに保存されます。機種変更の前に書き出して、Google ドライブなどに保存してください。</p>
        </div>
      </div>
    </div>
  )
}
