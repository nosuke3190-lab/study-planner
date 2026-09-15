import { useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { KINDS, KIND_ORDER, type Kind } from '../types'
import { Card } from './ui'
import { KindDot } from './KindDot'

export default function QuickCapture({
  onCapture,
}: {
  onCapture: (text: string, kind: Kind | null) => void
}) {
  const [text, setText] = useState('')

  const send = (kind: Kind | null) => {
    if (!text.trim()) return
    onCapture(text, kind)
    setText('')
  }

  const empty = text.trim() === ''

  return (
    <Card className="p-3.5">
      <div className="flex items-center gap-2.5">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              send(null)
            }
          }}
          rows={1}
          placeholder="いま思いついたことを書く"
          aria-label="メモを書く"
          className="min-h-11 flex-1 bg-transparent text-[15px] leading-relaxed outline-none placeholder:text-ink3"
        />
        <button
          type="button"
          onClick={() => send(null)}
          disabled={empty}
          aria-label="未整理に送る"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-ink text-inverse transition-opacity disabled:opacity-25"
        >
          <ArrowUp size={20} strokeWidth={2} />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {KIND_ORDER.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => send(k)}
            disabled={empty}
            className="flex h-11 items-center justify-center gap-1.5 rounded-xl border border-line bg-surface text-[13px] font-medium text-ink2 transition-opacity active:bg-canvas disabled:opacity-40"
          >
            <KindDot kind={k} />
            {KINDS[k].label}
          </button>
        ))}
      </div>

      <p className="mt-2.5 text-[11px] leading-relaxed text-ink3">
        種類を選ばずに送ると「未整理」に入ります
      </p>
    </Card>
  )
}
