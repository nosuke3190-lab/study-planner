import { useState, useMemo } from 'react'
import { Plus, ListTodo } from 'lucide-react'
import { format } from 'date-fns'
import { useTasks } from './hooks/useTasks'
import { useNotifications } from './hooks/useNotifications'
import { type Category, CATEGORIES } from './types'
import DateNav from './components/DateNav'
import TaskItem from './components/TaskItem'
import TaskForm from './components/TaskForm'
import ProgressBar from './components/ProgressBar'
import NotificationBanner from './components/NotificationBanner'

export default function App() {
  const { tasks, addTask, toggleTask, deleteTask } = useTasks()
  const { permission, requestPermission } = useNotifications(tasks)

  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [showForm, setShowForm] = useState(false)
  const [filterCat, setFilterCat] = useState<Category | 'all'>('all')

  const todayTasks = useMemo(
    () => tasks.filter(t => t.date === selectedDate),
    [tasks, selectedDate]
  )

  const filtered = useMemo(
    () => filterCat === 'all' ? todayTasks : todayTasks.filter(t => t.category === filterCat),
    [todayTasks, filterCat]
  )

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1
      if (a.time && b.time) return a.time.localeCompare(b.time)
      if (a.time) return -1
      if (b.time) return 1
      return a.createdAt - b.createdAt
    }),
    [filtered]
  )

  const completedCount = todayTasks.filter(t => t.completed).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center shadow-md">
              <ListTodo size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">デイリープランナー</h1>
              <p className="text-xs text-gray-400">毎日をより良く</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-md transition-all active:scale-95"
          >
            <Plus size={16} />
            追加
          </button>
        </header>

        {/* Notification Banner */}
        <NotificationBanner permission={permission as NotificationPermission} onRequest={requestPermission} />

        {/* Date Navigation */}
        <DateNav selectedDate={selectedDate} onChange={setSelectedDate} />

        {/* Progress */}
        <ProgressBar total={todayTasks.length} completed={completedCount} />

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setFilterCat('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0 transition-all ${
              filterCat === 'all'
                ? 'bg-indigo-500 text-white shadow-sm'
                : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            すべて ({todayTasks.length})
          </button>
          {(Object.keys(CATEGORIES) as Category[]).map(cat => {
            const count = todayTasks.filter(t => t.category === cat).length
            if (count === 0) return null
            return (
              <button
                key={cat}
                onClick={() => setFilterCat(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0 transition-all ${
                  filterCat === cat
                    ? `${CATEGORIES[cat].bg} ${CATEGORIES[cat].color} shadow-sm ring-1 ring-current`
                    : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {CATEGORIES[cat].label} ({count})
              </button>
            )
          })}
        </div>

        {/* Task List */}
        <div className="space-y-2">
          {sorted.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-sm font-medium text-gray-500">タスクがありません</p>
              <p className="text-xs text-gray-400 mt-1">「追加」ボタンでタスクを登録しましょう</p>
            </div>
          ) : (
            sorted.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={toggleTask}
                onDelete={deleteTask}
              />
            ))
          )}
        </div>

        {/* Footer note */}
        {todayTasks.length > 0 && (
          <p className="text-center text-xs text-gray-400 pb-4">
            {todayTasks.length - completedCount > 0
              ? `残り ${todayTasks.length - completedCount} 件のタスクがあります`
              : 'すべて完了しています！'}
          </p>
        )}
      </div>

      {/* Task Form Modal */}
      {showForm && (
        <TaskForm
          onAdd={addTask}
          onClose={() => setShowForm(false)}
          selectedDate={selectedDate}
        />
      )}
    </div>
  )
}
