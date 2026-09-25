import { useState } from 'react'
import type { AllDayReminderDay, CalendarEvent, ColorId, EventDraft, Reminder } from '../types'
import { ALL_DAY_REMINDER_OPTIONS, COLORS, COLOR_MAP, REMINDER_OPTIONS } from '../types'
import { addDays, differenceInCalendarDays, format } from 'date-fns'
import { formatDayLabel, fromKey, fromMinutes, hasNoStartTime, toMinutes } from '../lib/date'
import { BellIcon, CheckIcon, ChevronRight, ClockIcon, NoteIcon, PaletteIcon, PinIcon, TrashIcon, XIcon } from './Icons'

interface Props {
  initial: EventDraft
  editing?: CalendarEvent
  onSave: (draft: EventDraft) => void
  onDelete?: () => void
  onClose: () => void
}

function DateChip({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <label className="picker-chip">
      {formatDayLabel(value)}
      <input type="date" aria-label={label} value={value} required onChange={e => e.target.value && onChange(e.target.value)} />
    </label>
  )
}

function TimeChip({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <label className="picker-chip is-time">
      {value}
      <input type="time" aria-label={label} value={value} required onChange={e => e.target.value && onChange(e.target.value)} />
    </label>
  )
}

/** 開始・終了の時刻。「×」で時刻なしにでき、時刻なしのときはタップで時刻を選べる */
function OptionalTimeChip({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <span className="time-field">
      <label className={`picker-chip is-time${value ? '' : ' is-empty'}`}>
        {value || '時刻なし'}
        <input type="time" aria-label={label} value={value} onChange={e => e.target.value && onChange(e.target.value)} />
      </label>
      {value && (
        <button type="button" className="clear-btn" aria-label={`${label}をなしにする`} onClick={() => onChange('')}>
          <XIcon size={14} />
        </button>
      )}
    </span>
  )
}

export default function EventForm({ initial, editing, onSave, onDelete, onClose }: Props) {
  const [d, setD] = useState<EventDraft>(initial)
  const set = <K extends keyof EventDraft>(key: K, value: EventDraft[K]) => setD(prev => ({ ...prev, [key]: value }))

  // 開始を動かしたら、終了も同じ長さを保ったまま動かす
  const changeStartDate = (v: string) => setD(prev => {
    const span = differenceInCalendarDays(fromKey(prev.endDate), fromKey(prev.startDate))
    return { ...prev, startDate: v, endDate: format(addDays(fromKey(v), span), 'yyyy-MM-dd') }
  })
  const changeStartTime = (v: string) => setD(prev => {
    if (!v || !prev.startTime || !prev.endTime || prev.startDate !== prev.endDate) return { ...prev, startTime: v }
    const duration = Math.max(0, toMinutes(prev.endTime) - toMinutes(prev.startTime))
    const end = toMinutes(v) + duration
    if (end >= 24 * 60) {
      return { ...prev, startTime: v, endTime: fromMinutes(end - 24 * 60), endDate: format(addDays(fromKey(prev.startDate), 1), 'yyyy-MM-dd') }
    }
    return { ...prev, startTime: v, endTime: fromMinutes(end) }
  })

  const endBeforeStart = d.endDate < d.startDate ||
    (!d.allDay && d.endDate === d.startDate && d.startTime !== '' && d.endTime !== '' &&
      toMinutes(d.endTime) < toMinutes(d.startTime))
  const canSave = d.title.trim() !== '' && !endBeforeStart
  const color = COLOR_MAP[d.color]

  const handleSave = () => {
    if (!canSave) return
    onSave({ ...d, title: d.title.trim(), location: d.location.trim(), memo: d.memo.trim() })
  }

  const handleDelete = () => {
    if (onDelete && window.confirm('この予定を削除しますか？')) onDelete()
  }

  return (
    <div className="screen" role="dialog" aria-modal="true" aria-label={editing ? '予定を編集' : '予定を追加'}>
      <div className="form-header">
        <button type="button" className="text-btn" onClick={onClose}>キャンセル</button>
        <h1>{editing ? '予定を編集' : '予定を追加'}</h1>
        <button type="button" className="save-btn" disabled={!canSave} onClick={handleSave}>保存</button>
      </div>

      <div className="screen__scroll">
        <div className="form">
          <div className="card">
            <label className="row">
              <span className="row__icon"><span className="title-dot" style={{ background: color.main }} /></span>
              <span className="sr-only">タイトル</span>
              <span className="row__body has-line">
                <input className="plain-input title-input" type="text" placeholder="タイトル" value={d.title}
                  autoFocus={!editing} onChange={e => set('title', e.target.value)} />
              </span>
            </label>
            <label className="row">
              <span className="row__icon"><PinIcon size={18} /></span>
              <span className="sr-only">場所</span>
              <span className="row__body">
                <input className="plain-input" type="text" placeholder="場所を追加" value={d.location}
                  onChange={e => set('location', e.target.value)} />
              </span>
            </label>
          </div>

          <div className="card">
            <div className="row">
              <span className="row__icon"><ClockIcon size={18} /></span>
              <div className="row__body has-line">
                <span className="row__label">終日</span>
                <button type="button" role="switch" aria-checked={d.allDay} aria-label="終日" className="switch"
                  onClick={() => set('allDay', !d.allDay)}><span /></button>
              </div>
            </div>
            <div className="row">
              <span className="row__icon" />
              <div className="row__body has-line">
                <span className="row__label">開始</span>
                <div className="picker-group">
                  <DateChip label="開始日" value={d.startDate} onChange={changeStartDate} />
                  {!d.allDay && <OptionalTimeChip label="開始時刻" value={d.startTime} onChange={changeStartTime} />}
                </div>
              </div>
            </div>
            <div className="row">
              <span className="row__icon" />
              <div className="row__body">
                <span className="row__label">終了</span>
                <div className="picker-group">
                  <DateChip label="終了日" value={d.endDate} onChange={v => set('endDate', v)} />
                  {!d.allDay && <OptionalTimeChip label="終了時刻" value={d.endTime} onChange={v => set('endTime', v)} />}
                </div>
              </div>
            </div>
          </div>
          {endBeforeStart && <p className="form-error">終了が開始より前になっています。</p>}

          <div className="card">
            <div className="row">
              <span className="row__icon"><PaletteIcon size={18} /></span>
              <div className="row__body" style={{ minHeight: 48 }}>
                <span className="row__label">色</span>
                <span className="row__value">{color.name}</span>
              </div>
            </div>
            <div className="swatches">
              {COLORS.map(c => (
                <button key={c.id} type="button" className="swatch" aria-label={c.name} aria-pressed={d.color === c.id}
                  onClick={() => set('color', c.id as ColorId)}>
                  <span style={{ background: c.main, boxShadow: d.color === c.id ? `0 0 0 2px #FFFFFF, 0 0 0 4px ${c.main}` : undefined }}>
                    {d.color === c.id && <CheckIcon size={13} />}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            {hasNoStartTime(d) ? (
              <div className="row">
                <span className="row__icon"><BellIcon size={18} /></span>
                <div className="row__body">
                  <span className="row__label">通知</span>
                  <div className="picker-group">
                    <label className="picker-chip">
                      {ALL_DAY_REMINDER_OPTIONS.find(o => o.value === d.allDayReminderDay)?.label}
                      <select aria-label="通知する日" value={d.allDayReminderDay}
                        onChange={e => set('allDayReminderDay', e.target.value as AllDayReminderDay)}>
                        {ALL_DAY_REMINDER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </label>
                    {d.allDayReminderDay !== 'none' && (
                      <TimeChip label="通知する時刻" value={d.allDayReminderTime} onChange={v => set('allDayReminderTime', v)} />
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <label className="row">
                <span className="row__icon"><BellIcon size={18} /></span>
                <span className="row__body">
                  <span className="row__label">通知</span>
                  <span className="select-wrap">
                    {REMINDER_OPTIONS.find(o => o.value === d.reminder)?.label}
                    <ChevronRight size={16} />
                    <select aria-label="通知" value={d.reminder} onChange={e => set('reminder', e.target.value as Reminder)}>
                      {REMINDER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </span>
                </span>
              </label>
            )}
          </div>

          <label className="card">
            <span className="row" style={{ alignItems: 'flex-start' }}>
              <span className="row__icon" style={{ paddingTop: 16 }}><NoteIcon size={18} /></span>
              <span className="sr-only">メモ</span>
              <textarea className="memo-input" rows={3} placeholder="メモ（持ち物や連絡事項など）" value={d.memo}
                onChange={e => set('memo', e.target.value)} />
            </span>
          </label>

          {editing && onDelete && (
            <button type="button" className="delete-btn" onClick={handleDelete}>
              <TrashIcon size={18} />この予定を削除
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
