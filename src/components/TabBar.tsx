import { House, Layers, Notebook, Timer } from 'lucide-react'
import type { ComponentType } from 'react'

export type Tab = 'home' | 'memo' | 'focus' | 'review'

const TABS: { id: Tab; label: string; Icon: ComponentType<{ size?: number; strokeWidth?: number }> }[] = [
  { id: 'home', label: 'ホーム', Icon: House },
  { id: 'memo', label: 'メモ', Icon: Layers },
  { id: 'focus', label: '集中', Icon: Timer },
  { id: 'review', label: '振り返り', Icon: Notebook },
]

export default function TabBar({
  active,
  onChange,
}: {
  active: Tab
  onChange: (t: Tab) => void
}) {
  return (
    <nav className="safe-b shrink-0 border-t border-line bg-surface">
      <div className="grid grid-cols-4">
        {TABS.map(({ id, label, Icon }) => {
          const on = id === active
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              aria-current={on ? 'page' : undefined}
              className={`flex h-16 flex-col items-center justify-center gap-1 text-[10px] font-medium ${
                on ? 'text-ink' : 'text-ink3'
              }`}
            >
              <Icon size={22} strokeWidth={on ? 1.9 : 1.5} />
              <span>{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
