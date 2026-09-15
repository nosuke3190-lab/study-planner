import { KINDS, type Kind } from '../types'

export function KindDot({ kind, size = 7 }: { kind: Kind; size?: number }) {
  return (
    <span
      aria-hidden
      className="block shrink-0 rounded-full"
      style={{ width: size, height: size, background: KINDS[kind].colorVar }}
    />
  )
}

export function KindTag({ kind }: { kind: Kind }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-ink3">
      <KindDot kind={kind} size={6} />
      {KINDS[kind].label}
    </span>
  )
}
