import { Check, Trash2, Clock, Bell } from 'lucide-react'
import { type Task, CATEGORIES } from '../types'

interface Props {
  task: Task
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}

export default function TaskItem({ task, onToggle, onDelete }: Props) {
  const cat = CATEGORIES[task.category]

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${
        task.completed
          ? 'bg-gray-50 border-gray-100 opacity-60'
          : 'bg-white border-gray-200 hover:border-indigo-200 hover:shadow-sm'
      }`}
    >
      <button
        onClick={() => onToggle(task.id)}
        className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
          task.completed
            ? 'bg-indigo-500 border-indigo-500'
            : 'border-gray-300 hover:border-indigo-400'
        }`}
      >
        {task.completed && <Check size={12} className="text-white" strokeWidth={3} />}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${task.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cat.bg} ${cat.color}`}>
            {cat.label}
          </span>
          {task.time && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Clock size={11} />
              {task.time}
            </span>
          )}
          {task.reminderSet && (
            <span className="flex items-center gap-1 text-xs text-indigo-400">
              <Bell size={11} />
              通知あり
            </span>
          )}
        </div>
      </div>

      <button
        onClick={() => onDelete(task.id)}
        className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors flex-shrink-0"
      >
        <Trash2 size={15} />
      </button>
    </div>
  )
}
