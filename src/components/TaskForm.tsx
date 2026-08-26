import { useState } from 'react'
import { Plus, X, Bell } from 'lucide-react'
import { type Category, CATEGORIES, type Task } from '../types'

interface Props {
  onAdd: (task: Omit<Task, 'id' | 'createdAt'>) => void
  onClose: () => void
  selectedDate: string
}

export default function TaskForm({ onAdd, onClose, selectedDate }: Props) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<Category>('personal')
  const [time, setTime] = useState('')
  const [reminderSet, setReminderSet] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onAdd({
      title: title.trim(),
      category,
      date: selectedDate,
      time: time || undefined,
      completed: false,
      reminderSet: reminderSet && !!time,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">タスクを追加</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">タスク名 *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="例: 英語の勉強 30分"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">カテゴリ</label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(CATEGORIES) as Category[]).map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    category === cat
                      ? `${CATEGORIES[cat].bg} ${CATEGORIES[cat].color} ring-2 ring-offset-1 ring-current`
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {CATEGORIES[cat].label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">日付</label>
            <input
              type="date"
              value={selectedDate}
              disabled
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">時間（任意）</label>
            <input
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {time && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={reminderSet}
                onChange={e => setReminderSet(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-500 accent-indigo-500"
              />
              <Bell size={14} className="text-indigo-500" />
              <span className="text-sm text-gray-700">5分前にリマインダー通知を受け取る</span>
            </label>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="flex-1 py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              追加する
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
