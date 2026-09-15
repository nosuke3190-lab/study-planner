import { useCallback, useEffect, useMemo, type ReactNode } from 'react'
import {
  DEFAULT_SETTINGS,
  type Completion,
  type Exam,
  type FocusSession,
  type Item,
  type JournalEntry,
  type Kind,
  type Priority,
  type Settings,
  type SubTask,
} from '../types'
import { useLocalStorage } from '../lib/storage'
import { newId } from '../lib/id'
import { extractTags } from '../lib/tags'
import { daysUntil, nextOccurrence, todayStr } from '../lib/date'
import { K } from './keys'
import { StoreContext, type Store } from './context'

function asArray<T>(raw: unknown): T[] {
  return Array.isArray(raw) ? (raw as T[]) : []
}

function reviveItems(raw: unknown): Item[] {
  return asArray<Partial<Item>>(raw).map((it) => ({
    id: it.id ?? newId(),
    text: it.text ?? '',
    kind: it.kind ?? null,
    createdAt: it.createdAt ?? Date.now(),
    updatedAt: it.updatedAt ?? it.createdAt ?? Date.now(),
    tags: Array.isArray(it.tags) ? it.tags : [],
    date: it.date,
    done: it.done,
    priority: it.priority,
    subtasks: Array.isArray(it.subtasks) ? it.subtasks : undefined,
    repeat: it.repeat,
    notify: it.notify ?? null,
  }))
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [items, setItems, itemsState] = useLocalStorage<Item[]>(K.items, [], reviveItems)
  const [completions, setCompletions] = useLocalStorage<Completion[]>(K.completions, [], (r) =>
    asArray<Completion>(r),
  )
  const [exams, setExams] = useLocalStorage<Exam[]>(K.exams, [], (r) => asArray<Exam>(r))
  const [sessions, setSessions] = useLocalStorage<FocusSession[]>(K.sessions, [], (r) =>
    asArray<FocusSession>(r),
  )
  const [journal, setJournal] = useLocalStorage<JournalEntry[]>(K.journal, [], (r) =>
    asArray<JournalEntry>(r),
  )
  const [settings, setSettingsRaw, settingsState] = useLocalStorage<Settings>(
    K.settings,
    DEFAULT_SETTINGS,
    (r) => ({ ...DEFAULT_SETTINGS, ...(r as object) }),
  )

  /* 繰り返しタスクを今日まで送る。起動時と日付が変わったときに走る */
  useEffect(() => {
    const roll = () => {
      const today = todayStr()
      setItems((prev) => {
        let touched = false
        const next = prev.map((it) => {
          if (it.kind !== 'task' || !it.repeat || it.repeat.type === 'none') return it
          if (!it.date || daysUntil(it.date, today) >= 0) return it
          const upcoming = nextOccurrence(it.date, it.repeat, today)
          if (!upcoming) return it
          touched = true
          return { ...it, date: upcoming, done: false, updatedAt: Date.now() }
        })
        return touched ? next : prev
      })
    }
    roll()
    const timer = window.setInterval(roll, 60_000)
    return () => window.clearInterval(timer)
  }, [setItems])

  const captureMemo = useCallback(
    (text: string, kind: Kind | null = null) => {
      const trimmed = text.trim()
      if (!trimmed) return ''
      const id = newId()
      const now = Date.now()
      const base: Item = {
        id,
        text: trimmed,
        kind,
        createdAt: now,
        updatedAt: now,
        tags: extractTags(trimmed),
        notify: null,
      }
      if (kind === 'task') {
        base.date = todayStr()
        base.done = false
        base.priority = 'should'
      }
      setItems((prev) => [base, ...prev])
      return id
    },
    [setItems],
  )

  const updateItem = useCallback(
    (id: string, patch: Partial<Item>) => {
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, ...patch, updatedAt: Date.now() } : it)),
      )
    },
    [setItems],
  )

  const deleteItem = useCallback(
    (id: string) => {
      setItems((prev) => prev.filter((it) => it.id !== id))
    },
    [setItems],
  )

  const fileItem = useCallback(
    (id: string, kind: Kind, opts?: { date?: string | null; priority?: Priority }) => {
      setItems((prev) =>
        prev.map((it) => {
          if (it.id !== id) return it
          const next: Item = { ...it, kind, updatedAt: Date.now() }
          if (kind === 'task') {
            next.date = opts?.date === undefined ? todayStr() : opts.date
            next.done = next.done ?? false
            next.priority = opts?.priority ?? next.priority ?? 'should'
          } else {
            next.date = undefined
            next.done = undefined
            next.priority = undefined
            next.repeat = undefined
          }
          return next
        }),
      )
    },
    [setItems],
  )

  const toggleTask = useCallback(
    (id: string) => {
      const today = todayStr()
      const target = items.find((it) => it.id === id)
      if (!target) return
      const nowDone = !target.done
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, done: nowDone, updatedAt: Date.now() } : it)),
      )
      setCompletions((prev) => {
        if (nowDone) {
          return [
            ...prev,
            { id: newId(), itemId: id, title: target.text, date: today, at: Date.now() },
          ]
        }
        // 直近の同じ日の記録だけ取り消す
        const idx = [...prev].reverse().findIndex((c) => c.itemId === id && c.date === today)
        if (idx === -1) return prev
        const realIdx = prev.length - 1 - idx
        return prev.filter((_, i) => i !== realIdx)
      })
    },
    [items, setItems, setCompletions],
  )

  const addSubtask = useCallback(
    (id: string, title: string) => {
      const trimmed = title.trim()
      if (!trimmed) return
      const sub: SubTask = { id: newId(), title: trimmed, done: false }
      setItems((prev) =>
        prev.map((it) =>
          it.id === id
            ? { ...it, subtasks: [...(it.subtasks ?? []), sub], updatedAt: Date.now() }
            : it,
        ),
      )
    },
    [setItems],
  )

  const toggleSubtask = useCallback(
    (id: string, subId: string) => {
      setItems((prev) =>
        prev.map((it) =>
          it.id === id
            ? {
                ...it,
                subtasks: (it.subtasks ?? []).map((s) =>
                  s.id === subId ? { ...s, done: !s.done } : s,
                ),
                updatedAt: Date.now(),
              }
            : it,
        ),
      )
    },
    [setItems],
  )

  const deleteSubtask = useCallback(
    (id: string, subId: string) => {
      setItems((prev) =>
        prev.map((it) =>
          it.id === id
            ? { ...it, subtasks: (it.subtasks ?? []).filter((s) => s.id !== subId), updatedAt: Date.now() }
            : it,
        ),
      )
    },
    [setItems],
  )

  const addExam = useCallback(
    (name: string, date: string) => {
      const trimmed = name.trim()
      if (!trimmed || !date) return
      setExams((prev) => [...prev, { id: newId(), name: trimmed, date, createdAt: Date.now() }])
    },
    [setExams],
  )

  const updateExam = useCallback(
    (id: string, patch: Partial<Exam>) => {
      setExams((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)))
    },
    [setExams],
  )

  const deleteExam = useCallback(
    (id: string) => {
      setExams((prev) => prev.filter((e) => e.id !== id))
    },
    [setExams],
  )

  const addSession = useCallback(
    (s: Omit<FocusSession, 'id'>) => {
      setSessions((prev) => [...prev, { ...s, id: newId() }])
    },
    [setSessions],
  )

  const saveJournal = useCallback(
    (date: string, body: string) => {
      setJournal((prev) => {
        const rest = prev.filter((e) => e.date !== date)
        if (!body.trim()) return rest
        return [...rest, { date, body, updatedAt: Date.now() }].sort((a, b) =>
          a.date.localeCompare(b.date),
        )
      })
    },
    [setJournal],
  )

  const journalFor = useCallback(
    (date: string) => journal.find((e) => e.date === date),
    [journal],
  )

  const setSettings = useCallback(
    (patch: Partial<Settings>) => {
      setSettingsRaw((prev) => ({ ...prev, ...patch }))
    },
    [setSettingsRaw],
  )

  const resetEverything = useCallback(() => {
    setItems([])
    setCompletions([])
    setExams([])
    setSessions([])
    setJournal([])
    setSettingsRaw(DEFAULT_SETTINGS)
  }, [setItems, setCompletions, setExams, setSessions, setJournal, setSettingsRaw])

  const value = useMemo<Store>(
    () => ({
      items,
      completions,
      exams,
      sessions,
      journal,
      settings,
      storageFailed: itemsState.failed || settingsState.failed,
      captureMemo,
      updateItem,
      deleteItem,
      fileItem,
      toggleTask,
      addSubtask,
      toggleSubtask,
      deleteSubtask,
      addExam,
      updateExam,
      deleteExam,
      addSession,
      saveJournal,
      journalFor,
      setSettings,
      resetEverything,
    }),
    [
      items, completions, exams, sessions, journal, settings,
      itemsState.failed, settingsState.failed,
      captureMemo, updateItem, deleteItem, fileItem, toggleTask,
      addSubtask, toggleSubtask, deleteSubtask,
      addExam, updateExam, deleteExam, addSession, saveJournal, journalFor,
      setSettings, resetEverything,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

