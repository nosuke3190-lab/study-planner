import type { CalendarEvent } from '../types'
import { eventsOn, formatDayLabel } from '../lib/date'
import EventRow from './EventRow'

interface Props {
  dayKey: string
  holiday: string
  events: CalendarEvent[]
  onOpen: (event: CalendarEvent) => void
}

export default function DaySheet({ dayKey, holiday, events, onOpen }: Props) {
  const dayEvents = eventsOn(events, dayKey)
  return (
    <section className="day-sheet">
      <div className="day-sheet__title">
        <h2>{formatDayLabel(dayKey)}</h2>
        {holiday && <span className="day-sheet__holiday">{holiday}</span>}
      </div>
      <div className="day-sheet__list">
        {dayEvents.length === 0
          ? <p className="empty-note">予定はありません</p>
          : dayEvents.map(e => <EventRow key={e.id} event={e} dayKey={dayKey} onOpen={onOpen} />)}
      </div>
    </section>
  )
}
