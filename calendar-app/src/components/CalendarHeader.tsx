import { ChevronLeft, ChevronRight, GearIcon, SearchIcon } from './Icons'

interface Props {
  title: string
  unit: '月' | '週'
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  onSearch: () => void
  onSettings: () => void
}

export default function CalendarHeader({ title, unit, onPrev, onNext, onToday, onSearch, onSettings }: Props) {
  return (
    <header className={`cal-header${unit === '週' ? ' is-week' : ''}`}>
      <div className="cal-header__left">
        <h1>{title}</h1>
        <div className="cal-header__nav">
          <button type="button" className="nav-btn" aria-label={`前の${unit}`} onClick={onPrev}><ChevronLeft /></button>
          <button type="button" className="nav-btn" aria-label={`次の${unit}`} onClick={onNext}><ChevronRight /></button>
        </div>
      </div>
      <div className="cal-header__right">
        <button type="button" className="today-btn" onClick={onToday}>今日</button>
        <button type="button" className="icon-btn" aria-label="検索" onClick={onSearch}><SearchIcon size={21} /></button>
        <button type="button" className="icon-btn" aria-label="設定" onClick={onSettings}><GearIcon size={21} /></button>
      </div>
    </header>
  )
}
