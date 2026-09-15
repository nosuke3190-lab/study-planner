/** アプリのしるし。アイコンと同じ形で、画面の中でも使う */
export default function AppMark({
  size = 64,
  className = '',
  rounded = true,
}: {
  size?: number
  className?: string
  rounded?: boolean
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      className={className}
      role="img"
      aria-label="Mindeck"
    >
      <rect width="160" height="160" rx={rounded ? 36 : 0} fill="#0a0a0a" />
      <circle cx="46" cy="54" r="9" fill="#3987e5" />
      <rect x="66" y="46" width="52" height="16" rx="8" fill="#ffffff" />
      <circle cx="46" cy="80" r="9" fill="#d95926" />
      <rect x="66" y="72" width="38" height="16" rx="8" fill="#ffffff" />
      <circle cx="46" cy="106" r="9" fill="#199e70" />
      <rect x="66" y="98" width="46" height="16" rx="8" fill="#ffffff" />
    </svg>
  )
}
