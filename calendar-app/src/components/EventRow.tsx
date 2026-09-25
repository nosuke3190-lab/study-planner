import type { CalendarEvent } from '../types'
import { COLOR_MAP } from '../types'
import { timeLabels } from '../lib/date'
import { PinIcon } from './Icons'

interface Props {
  event: CalendarEvent
  dayKey: string
  onOpen: (event: CalendarEvent) => void
}

export default function EventRow({ event, dayKey, onOpen }: Props) {
  const [top, bottom] = timeLabels(event, dayKey)
  return (
    <button type="button" className="event-row" onClick={() => onOpen(event)}>
      <span className="event-row__time">
        <b>{top}</b>
        {bottom && <span>{bottom}</span>}
      </span>
      <span className="event-row__bar" style={{ background: COLOR_MAP[event.color].main }} />
      <span className="event-row__body">
        <span className="event-row__title">{event.title || '（タイトルなし）'}</span>
        {event.location && (
          <span className="event-row__place"><PinIcon size={12} />{event.location}</span>
        )}
      </span>
    </button>
  )
}
