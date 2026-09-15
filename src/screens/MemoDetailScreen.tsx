import { useMemo, useState } from 'react'
import { ChevronLeft, Plus, Trash2, X } from 'lucide-react'
import { useStore } from '../store/context'
import { extractTags } from '../lib/tags'
import {
  KINDS,
  KIND_ORDER,
  PRIORITIES,
  type Priority,
  type Repeat,
} from '../types'
import { dayOf, localStamp, repeatLabel, shiftDay, shortDay, todayStr } from '../lib/date'
import { Card, Pill, Row, SectionLabel, Toggle } from '../components/ui'
import { KindDot } from '../components/KindDot'

const WEEK = ['日', '月', '火', '水', '木', '金', '土']

function RepeatPicker({ value, onChange }: { value: Repeat; onChange: (r: Repeat) => void }) {
  const days = value.type === 'weekly' ? value.days : []
  return (
    <div className="px-3.5 pb-3.5">
      <div className="grid grid-cols-3 gap-2">
        <Pill on={value.type === 'none'} onClick={() => onChange({ type: 'none' })}>
          なし
        </Pill>
        <Pill on={value.type === 'daily'} onClick={() => onChange({ type: 'daily' })}>
          毎日
        </Pill>
        <Pill
          on={value.type === 'weekly'}
          onClick={() => onChange({ type: 'weekly', days: days.length ? days : [new Date().getDay()] })}
        >
          毎週
        </Pill>
      </div>
      {value.type === 'weekly' && (
        <div className="mt-2 grid grid-cols-7 gap-1.5">
          {WEEK.map((w, i) => {
            const on = days.includes(i)
            return (
              <button
                key={w}
                type="button"
                aria-pressed={on}
                onClick={() =>
                  onChange({
                    type: 'weekly',
                    days: on ? days.filter((d) => d !== i) : [...days, i],
                  })
                }
                className={`h-11 rounded-xl border text-[13px] font-medium ${
                  on ? 'border-ink bg-ink text-inverse' : 'border-line bg-surface text-ink2'
                }`}
              >
                {w}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function MemoDetailScreen({
  id,
  onBack,
  onStartFocus,
}: {
  id: string
  onBack: () => void
  onStartFocus: (itemId: string, label: string) => void
}) {
  const { items, updateItem, deleteItem, fileItem, addSubtask, toggleSubtask, deleteSubtask } =
    useStore()
  const item = items.find((it) => it.id === id)
  const [subDraft, setSubDraft] = useState('')
  const [openRepeat, setOpenRepeat] = useState<'task' | 'notify' | null>(null)

  const created = useMemo(() => (item ? shortDay(dayOf(item.createdAt)) : ''), [item])
  const today = todayStr()
  const tomorrow = shiftDay(today, 1)

  if (!item) {
    return (
      <div className="px-4.5 pt-1">
        <header className="flex h-13 items-center gap-0.5 -ml-3">
          <button type="button" onClick={onBack} aria-label="戻る" className="flex size-11 items-center justify-center">
            <ChevronLeft size={21} strokeWidth={1.8} />
          </button>
          <h1 className="text-[17px] font-bold">メモ</h1>
        </header>
        <p className="mt-6 text-sm text-ink2">このメモは削除されています。</p>
      </div>
    )
  }

  const isTask = item.kind === 'task'
  const notify = item.notify
  const subs = item.subtasks ?? []

  const setText = (text: string) => updateItem(id, { text, tags: extractTags(text) })

  const setNotifyOn = (on: boolean) => {
    if (!on) {
      updateItem(id, { notify: null })
      return
    }
    const base = new Date()
    base.setMinutes(0, 0, 0)
    base.setHours(base.getHours() + 1)
    updateItem(id, { notify: { at: localStamp(base), repeat: { type: 'none' } } })
  }

  return (
    <div className="flex min-h-full flex-col gap-3.5 px-4.5 pb-4 pt-1">
      <header className="-ml-3 flex h-13 items-center justify-between">
        <div className="flex items-center gap-0.5">
          <button type="button" onClick={onBack} aria-label="戻る" className="flex size-11 items-center justify-center">
            <ChevronLeft size={21} strokeWidth={1.8} />
          </button>
          <h1 className="text-[17px] font-bold">メモ</h1>
        </div>
        <button type="button" onClick={onBack} className="text-[12.5px] font-medium text-ink2">
          完了
        </button>
      </header>

      <Card className="flex min-h-[150px] flex-col p-4">
        <textarea
          value={item.text}
          onChange={(e) => setText(e.target.value)}
          aria-label="メモの本文"
          className="min-h-20 flex-1 bg-transparent text-[15px] leading-relaxed outline-none"
        />
        <p className="mt-3.5 border-t border-line pt-2.5 text-[11px] text-ink3">
          {created} に書いたメモ
        </p>
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-line px-3.5 py-3">
          <SectionLabel>種類</SectionLabel>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {KIND_ORDER.map((k) => (
              <Pill key={k} on={item.kind === k} onClick={() => fileItem(id, k)}>
                <KindDot kind={k} />
                {KINDS[k].label}
              </Pill>
            ))}
          </div>
        </div>
        <Row last>
          <span className="flex-1 py-3.5 text-sm font-medium">タグ</span>
          <span className="py-3.5 text-[13px] text-ink2">
            {item.tags.length ? item.tags.map((t) => '#' + t).join(' ') : '本文に # で書く'}
          </span>
        </Row>
      </Card>

      {isTask && (
        <section>
          <SectionLabel>タスクの設定</SectionLabel>
          <Card className="mt-1.5 overflow-hidden">
            <div className="border-b border-line px-3.5 py-3">
              <p className="text-sm font-medium">いつやる</p>
              <div className="mt-2 grid grid-cols-4 gap-2">
                <Pill on={item.date === today} onClick={() => updateItem(id, { date: today })}>
                  今日
                </Pill>
                <Pill on={item.date === tomorrow} onClick={() => updateItem(id, { date: tomorrow })}>
                  明日
                </Pill>
                <label className="flex h-11 items-center justify-center rounded-xl border border-line bg-surface text-[13px] font-medium text-ink2">
                  <span className="sr-only">日付を選ぶ</span>
                  <input
                    type="date"
                    value={item.date ?? ''}
                    onChange={(e) => updateItem(id, { date: e.target.value || null })}
                    className="w-full bg-transparent px-1 text-center text-[11px] outline-none"
                  />
                </label>
                <Pill on={item.date === null} onClick={() => updateItem(id, { date: null })}>
                  いつか
                </Pill>
              </div>
            </div>

            <div className="border-b border-line px-3.5 py-3">
              <p className="text-sm font-medium">優先度</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(Object.keys(PRIORITIES) as Priority[]).map((p) => (
                  <Pill key={p} on={item.priority === p} onClick={() => updateItem(id, { priority: p })}>
                    {PRIORITIES[p].label}
                  </Pill>
                ))}
              </div>
            </div>

            <Row onClick={() => setOpenRepeat(openRepeat === 'task' ? null : 'task')} last={openRepeat === 'task'}>
              <span className="flex-1 py-3.5 text-sm font-medium">くり返し</span>
              <span className="py-3.5 text-[13px] text-ink2">{repeatLabel(item.repeat)}</span>
            </Row>
            {openRepeat === 'task' && (
              <RepeatPicker
                value={item.repeat ?? { type: 'none' }}
                onChange={(r) => updateItem(id, { repeat: r })}
              />
            )}
          </Card>

          <SectionLabel>
            <span className="mt-3.5 block">サブタスク</span>
          </SectionLabel>
          <Card className="mt-1.5 overflow-hidden">
            {subs.map((s) => (
              <div key={s.id} className="flex items-center gap-3 border-b border-line px-3.5">
                <button
                  type="button"
                  onClick={() => toggleSubtask(id, s.id)}
                  aria-pressed={s.done}
                  className="flex min-h-[52px] flex-1 items-center gap-3 text-left"
                >
                  <span
                    className={`size-[18px] shrink-0 rounded-full border-[1.5px] ${
                      s.done ? 'border-ink bg-ink' : 'border-linestrong'
                    }`}
                  />
                  <span className={`text-[13.5px] ${s.done ? 'text-ink3 line-through' : ''}`}>
                    {s.title}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => deleteSubtask(id, s.id)}
                  aria-label="サブタスクを消す"
                  className="flex size-11 items-center justify-center text-ink3"
                >
                  <X size={15} />
                </button>
              </div>
            ))}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                addSubtask(id, subDraft)
                setSubDraft('')
              }}
              className="flex items-center gap-3 px-3.5"
            >
              <Plus size={17} className="shrink-0 text-ink3" />
              <input
                value={subDraft}
                onChange={(e) => setSubDraft(e.target.value)}
                placeholder="小さく分けて書く"
                aria-label="サブタスクを足す"
                className="min-h-[52px] flex-1 bg-transparent text-[13.5px] outline-none placeholder:text-ink3"
              />
            </form>
          </Card>
        </section>
      )}

      <section>
        <SectionLabel>このメモの通知</SectionLabel>
        <Card className="mt-1.5 overflow-hidden">
          <Row last={!notify}>
            <span className="flex-1 py-3.5 text-sm font-medium">スマホに通知する</span>
            <Toggle on={notify !== null && notify !== undefined} onChange={setNotifyOn} label="スマホに通知する" />
          </Row>
          {notify && (
            <>
              <Row>
                <span className="flex-1 py-3 text-sm font-medium">日時</span>
                <input
                  type="datetime-local"
                  value={notify.at}
                  onChange={(e) =>
                    updateItem(id, { notify: { ...notify, at: e.target.value, firedFor: undefined } })
                  }
                  aria-label="通知する日時"
                  className="num bg-transparent py-3 text-right text-[13px] font-medium outline-none"
                />
              </Row>
              <Row onClick={() => setOpenRepeat(openRepeat === 'notify' ? null : 'notify')} last={openRepeat !== 'notify'}>
                <span className="flex-1 py-3.5 text-sm font-medium">くり返し</span>
                <span className="py-3.5 text-[13px] text-ink2">{repeatLabel(notify.repeat)}</span>
              </Row>
              {openRepeat === 'notify' && (
                <RepeatPicker
                  value={notify.repeat}
                  onChange={(r) => updateItem(id, { notify: { ...notify, repeat: r } })}
                />
              )}
            </>
          )}
        </Card>
        <p className="mt-2 px-0.5 text-[11px] leading-relaxed text-ink3">
          設定した時刻にスマホへ通知が届きます。まとめて見直したいノートに向いています。
        </p>
      </section>

      <div className="mt-auto grid grid-cols-2 gap-2.5 pt-2">
        <Pill
          className="h-12"
          onClick={() => onStartFocus(id, item.text)}
        >
          これに集中する
        </Pill>
        <button
          type="button"
          onClick={() => {
            deleteItem(id)
            onBack()
          }}
          className="flex h-12 items-center justify-center gap-1.5 text-[13px] font-medium text-ink3"
        >
          <Trash2 size={15} />
          削除する
        </button>
      </div>
    </div>
  )
}
