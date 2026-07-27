const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const timeFormat = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' })
const dayFormat = new Intl.DateTimeFormat(undefined, { weekday: 'long' })
const shortFormat = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' })
const longFormat = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})
const fullFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  )
}

/** Compact stamp for the note list: `14:32`, `Yesterday`, `Tue`, `12 Mar`. */
export function listDate(timestamp: number, now = Date.now()): string {
  const date = new Date(timestamp)
  const today = new Date(now)

  if (sameDay(date, today)) return timeFormat.format(date)

  const yesterday = new Date(now - DAY)
  if (sameDay(date, yesterday)) return 'Yesterday'

  if (now - timestamp < 6 * DAY) return dayFormat.format(date)
  if (date.getFullYear() === today.getFullYear()) return shortFormat.format(date)
  return longFormat.format(date)
}

export function fullDate(timestamp: number): string {
  return fullFormat.format(new Date(timestamp))
}

export function relativeDate(timestamp: number, now = Date.now()): string {
  const diff = now - timestamp
  if (diff < MINUTE) return 'just now'
  if (diff < HOUR) {
    const minutes = Math.round(diff / MINUTE)
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  }
  if (diff < DAY) {
    const hours = Math.round(diff / HOUR)
    return `${hours} hour${hours === 1 ? '' : 's'} ago`
  }
  const days = Math.round(diff / DAY)
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`
  return fullDate(timestamp)
}
