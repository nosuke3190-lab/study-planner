export type Kind = 'task' | 'note' | 'idea'

export type Priority = 'must' | 'should' | 'someday'

export type Repeat =
  | { type: 'none' }
  | { type: 'daily' }
  | { type: 'weekly'; days: number[] } // 0 = 日曜

export interface SubTask {
  id: string
  title: string
  done: boolean
}

export interface Notify {
  /** ローカル日時 'YYYY-MM-DDTHH:mm' */
  at: string
  repeat: Repeat
  /** 最後に通知を出した at の値。同じ予定で二度鳴らさないための印 */
  firedFor?: string
}

export interface Item {
  id: string
  text: string
  /** null は未整理 */
  kind: Kind | null
  createdAt: number
  updatedAt: number
  tags: string[]
  /** kind === 'task' のときだけ使う。null は「いつか」 */
  date?: string | null
  done?: boolean
  priority?: Priority
  subtasks?: SubTask[]
  repeat?: Repeat
  notify?: Notify | null
}

export interface Completion {
  id: string
  itemId: string
  title: string
  /** YYYY-MM-DD */
  date: string
  at: number
}

export interface Exam {
  id: string
  name: string
  /** YYYY-MM-DD */
  date: string
  createdAt: number
}

export interface FocusSession {
  id: string
  /** YYYY-MM-DD */
  date: string
  startedAt: number
  endedAt: number
  plannedMin: number
  actualSec: number
  label: string
  itemId?: string
  completed: boolean
}

export interface JournalEntry {
  /** YYYY-MM-DD */
  date: string
  body: string
  updatedAt: number
}

export interface Settings {
  journalReminder: { enabled: boolean; time: string }
  memoNotify: boolean
  timerDone: boolean
  lastTimerMin: number
  installDismissed: boolean
  /** Web Push を中継するサーバーの URL。空なら push は使わない */
  pushEndpoint: string
  /** サーバーが発行した VAPID 公開鍵 */
  pushPublicKey: string
}

export const KINDS: Record<Kind, { label: string; colorVar: string; dot: string }> = {
  task: { label: 'タスク', colorVar: 'var(--c-task)', dot: 'bg-task' },
  note: { label: 'ノート', colorVar: 'var(--c-note)', dot: 'bg-note' },
  idea: { label: 'アイデア', colorVar: 'var(--c-idea)', dot: 'bg-idea' },
}

export const KIND_ORDER: Kind[] = ['task', 'note', 'idea']

export const PRIORITIES: Record<Priority, { label: string; weight: number }> = {
  must: { label: '必ず', weight: 0 },
  should: { label: 'できれば', weight: 1 },
  someday: { label: 'いつか', weight: 2 },
}

export const DEFAULT_SETTINGS: Settings = {
  journalReminder: { enabled: true, time: '00:00' },
  memoNotify: true,
  timerDone: true,
  lastTimerMin: 25,
  installDismissed: false,
  pushEndpoint: '',
  pushPublicKey: '',
}
