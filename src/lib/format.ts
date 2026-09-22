const dtf = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
const tf = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })
const wdf = new Intl.DateTimeFormat('vi-VN', { weekday: 'long' })
const rtf = new Intl.RelativeTimeFormat('vi', { numeric: 'auto' })

export const formatDate = (iso: string) => dtf.format(new Date(iso))
export const formatTime = (iso: string) => tf.format(new Date(iso))
export const formatDateTime = (iso: string) => `${formatTime(iso)}, ${formatDate(iso)}`
export const formatWeekday = (iso: string) => wdf.format(new Date(iso))

export function relativeTime(iso: string, now = Date.now()) {
  const diff = new Date(iso).getTime() - now
  const abs = Math.abs(diff)
  const min = 60_000
  if (abs < min) return 'Vừa xong'
  if (abs < 60 * min) return rtf.format(Math.round(diff / min), 'minute')
  if (abs < 24 * 60 * min) return rtf.format(Math.round(diff / (60 * min)), 'hour')
  if (abs < 7 * 24 * 60 * min) return rtf.format(Math.round(diff / (24 * 60 * min)), 'day')
  return formatDate(iso)
}

export function isSameDay(a: string | Date, b: string | Date = new Date()) {
  const x = new Date(a)
  const y = new Date(b)
  return x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth() && x.getDate() === y.getDate()
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  return (parts.length === 1 ? parts[0].slice(0, 2) : parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase()
}

export const caseCode = (kind: 'incident' | 'counseling', id: string) =>
  `${kind === 'incident' ? 'BC' : 'TV'}-${id.replace(/-/g, '').slice(0, 6).toUpperCase()}`
