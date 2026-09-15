import { createContext, useContext } from 'react'
import type {
  Completion,
  Exam,
  FocusSession,
  Item,
  JournalEntry,
  Kind,
  Priority,
  Settings,
} from '../types'

export interface Store {
  items: Item[]
  completions: Completion[]
  exams: Exam[]
  sessions: FocusSession[]
  journal: JournalEntry[]
  settings: Settings
  storageFailed: boolean

  captureMemo: (text: string, kind?: Kind | null) => string
  updateItem: (id: string, patch: Partial<Item>) => void
  deleteItem: (id: string) => void
  fileItem: (id: string, kind: Kind, opts?: { date?: string | null; priority?: Priority }) => void
  toggleTask: (id: string) => void
  addSubtask: (id: string, title: string) => void
  toggleSubtask: (id: string, subId: string) => void
  deleteSubtask: (id: string, subId: string) => void

  addExam: (name: string, date: string) => void
  updateExam: (id: string, patch: Partial<Exam>) => void
  deleteExam: (id: string) => void

  addSession: (s: Omit<FocusSession, 'id'>) => void
  saveJournal: (date: string, body: string) => void
  journalFor: (date: string) => JournalEntry | undefined

  setSettings: (patch: Partial<Settings>) => void
  resetEverything: () => void
}

export const StoreContext = createContext<Store | null>(null)

export function useStore(): Store {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore は StoreProvider の中でだけ使えます')
  return ctx
}
