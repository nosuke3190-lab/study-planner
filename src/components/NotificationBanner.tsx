import { Bell, BellOff, X } from 'lucide-react'
import { useState } from 'react'

interface Props {
  permission: NotificationPermission | 'unsupported'
  onRequest: () => void
}

export default function NotificationBanner({ permission, onRequest }: Props) {
  const [dismissed, setDismissed] = useState(false)

  if (permission === 'granted' || permission === 'unsupported' || dismissed) return null

  if (permission === 'denied') {
    return (
      <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm">
        <BellOff size={16} className="text-red-400 flex-shrink-0" />
        <p className="text-red-600 flex-1">通知がブロックされています。ブラウザの設定から許可してください。</p>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
      <Bell size={16} className="text-indigo-500 flex-shrink-0" />
      <p className="text-sm text-indigo-700 flex-1">リマインダー通知を有効にしますか？</p>
      <button
        onClick={onRequest}
        className="text-xs bg-indigo-500 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-600 transition-colors font-medium flex-shrink-0"
      >
        有効にする
      </button>
      <button onClick={() => setDismissed(true)} className="text-indigo-300 hover:text-indigo-500 flex-shrink-0">
        <X size={16} />
      </button>
    </div>
  )
}
