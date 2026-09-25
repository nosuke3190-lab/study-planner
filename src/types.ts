export type Category = 'work' | 'study' | 'health' | 'personal' | 'other'

export interface Task {
  id: string
  title: string
  category: Category
  date: string       // YYYY-MM-DD
  time?: string      // HH:MM (optional, for reminders)
  completed: boolean
  reminderSet: boolean
  createdAt: number
}

export const CATEGORIES: Record<Category, { label: string; color: string; bg: string; dot: string }> = {
  work:     { label: '仕事',     color: 'text-blue-700',   bg: 'bg-blue-100', dot: 'bg-blue-500' },
  study:    { label: '勉強',     color: 'text-purple-700', bg: 'bg-purple-100', dot: 'bg-purple-500' },
  health:   { label: '健康',     color: 'text-green-700',  bg: 'bg-green-100', dot: 'bg-green-500' },
  personal: { label: 'プライベート', color: 'text-orange-700', bg: 'bg-orange-100', dot: 'bg-orange-500' },
  other:    { label: 'その他',   color: 'text-gray-700',   bg: 'bg-gray-100', dot: 'bg-gray-400' },
}
