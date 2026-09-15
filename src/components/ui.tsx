import type { ReactNode } from 'react'

export function Card({
  children,
  className = '',
  tone = 'plain',
}: {
  children: ReactNode
  className?: string
  tone?: 'plain' | 'muted'
}) {
  const bg = tone === 'muted' ? 'bg-surface2 border-linestrong' : 'bg-surface border-line'
  return <div className={`rounded-2xl border ${bg} ${className}`}>{children}</div>
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="text-[11px] font-medium tracking-[0.09em] text-ink3">{children}</div>
  )
}

export function Row({
  children,
  last = false,
  onClick,
  className = '',
}: {
  children: ReactNode
  last?: boolean
  onClick?: () => void
  className?: string
}) {
  const shared = `flex w-full items-center gap-3 px-3.5 text-left ${
    last ? '' : 'border-b border-line'
  } ${className}`
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${shared} active:bg-canvas`}>
        {children}
      </button>
    )
  }
  return <div className={shared}>{children}</div>
}

export function Toggle({
  on,
  onChange,
  label,
}: {
  on: boolean
  onChange: (next: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={`flex h-[30px] w-[50px] shrink-0 items-center rounded-full p-[3px] transition-colors ${
        on ? 'justify-end bg-ink' : 'justify-start bg-linestrong'
      }`}
    >
      <span className="block size-6 rounded-full bg-surface shadow-sm" />
    </button>
  )
}

export function Pill({
  children,
  on = false,
  onClick,
  className = '',
  disabled = false,
}: {
  children: ReactNode
  on?: boolean
  onClick?: () => void
  className?: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={onClick ? on : undefined}
      className={`flex h-11 items-center justify-center gap-1.5 rounded-xl border text-[13px] font-medium transition-colors disabled:opacity-40 ${
        on
          ? 'border-ink bg-ink font-bold text-inverse'
          : 'border-line bg-surface text-ink2 active:bg-canvas'
      } ${className}`}
    >
      {children}
    </button>
  )
}

export function BigButton({
  children,
  onClick,
  disabled = false,
  className = '',
  type = 'button',
}: {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
  type?: 'button' | 'submit'
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-14 w-full items-center justify-center gap-2 rounded-[13px] bg-ink text-[15px] font-bold text-inverse transition-opacity active:opacity-80 disabled:opacity-30 ${className}`}
    >
      {children}
    </button>
  )
}

export function Empty({ title, hint }: { title: string; hint?: string }) {
  return (
    <Card className="px-6 py-10 text-center">
      <p className="text-sm font-medium text-ink2">{title}</p>
      {hint && <p className="mt-1.5 text-xs leading-relaxed text-ink3">{hint}</p>}
    </Card>
  )
}
