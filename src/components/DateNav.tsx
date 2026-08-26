import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { format, addDays, isToday, parseISO } from 'date-fns'
import { ja } from 'date-fns/locale'

interface Props {
  selectedDate: string
  onChange: (date: string) => void
}

export default function DateNav({ selectedDate, onChange }: Props) {
  const date = parseISO(selectedDate)
  const today = format(new Date(), 'yyyy-MM-dd')

  return (
    <div className="flex items-center justify-between bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
      <button
        onClick={() => onChange(format(addDays(date, -1), 'yyyy-MM-dd'))}
        className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
      >
        <ChevronLeft size={18} className="text-gray-500" />
      </button>

      <div className="text-center">
        <div className="flex items-center gap-2 justify-center">
          <CalendarDays size={16} className="text-indigo-500" />
          <span className="text-base font-bold text-gray-800">
            {format(date, 'M月d日（E）', { locale: ja })}
          </span>
          {isToday(date) && (
            <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-medium">今日</span>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-0.5">{format(date, 'yyyy年')}</p>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(format(addDays(date, 1), 'yyyy-MM-dd'))}
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <ChevronRight size={18} className="text-gray-500" />
        </button>
        {selectedDate !== today && (
          <button
            onClick={() => onChange(today)}
            className="text-xs text-indigo-500 hover:text-indigo-700 px-2 py-1 rounded-lg hover:bg-indigo-50 transition-colors font-medium"
          >
            今日へ
          </button>
        )}
      </div>
    </div>
  )
}
