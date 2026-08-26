interface Props {
  total: number
  completed: number
}

export default function ProgressBar({ total, completed }: Props) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100)

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-600">今日の進捗</span>
        <span className="text-sm font-bold text-indigo-600">{completed} / {total} 完了</span>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-2 text-right text-xs text-gray-400">{pct}%</div>
      {pct === 100 && total > 0 && (
        <p className="mt-2 text-center text-sm font-medium text-indigo-600 animate-bounce">
          🎉 全タスク完了！お疲れさまでした！
        </p>
      )}
    </div>
  )
}
