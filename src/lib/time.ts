export const SLOT_COUNT = 22
export const DAY_START_HOUR = 6

export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function startOfWeek(d: Date): Date {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  return date
}

export function addDays(d: Date, n: number): Date {
  const next = new Date(d)
  next.setDate(next.getDate() + n)
  return next
}

export function weekDates(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
}

export function isPastDay(iso: string, today = new Date()): boolean {
  const a = parseISODate(iso)
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return a < t
}

export function isoWeek(d: Date): { year: number; week: number } {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return { year: date.getUTCFullYear(), week }
}

export function weekKeyFromDate(d: Date): string {
  const { year, week } = isoWeek(d)
  return `${year}-W${String(week).padStart(2, '0')}`
}

export function formatWeekRange(weekStart: Date): string {
  const end = addDays(weekStart, 6)
  const { week } = isoWeek(weekStart)
  const sameMonth = weekStart.getMonth() === end.getMonth()
  const startLbl = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const endLbl = end.toLocaleDateString('en-US', {
    month: sameMonth ? undefined : 'short',
    day: 'numeric',
    year: 'numeric',
  })
  return `Week ${week} · ${startLbl}–${endLbl}`
}

export function monthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
}

export function weeksInMonth(year: number, month: number): Date[] {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const weeks: Date[] = []
  let cursor = startOfWeek(first)
  while (cursor <= last) {
    weeks.push(new Date(cursor))
    cursor = addDays(cursor, 7)
  }
  return weeks
}

export function slotLabel(index: number): string {
  const minutes = DAY_START_HOUR * 60 + index * 30
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

export const SLOT_LABELS = Array.from({ length: SLOT_COUNT }, (_, i) => slotLabel(i))

export function cellKey(parts: {
  farmId: string
  commodityId: string
  activityId: string
  date: string
  slot: number
}): string {
  return `${parts.farmId}|${parts.commodityId}|${parts.activityId}|${parts.date}|${parts.slot}`
}

export function submissionKey(
  farmId: string,
  weekKey: string,
  commodityId: string,
  activityId: string,
): string {
  return `${farmId}|${weekKey}|${commodityId}|${activityId}`
}

export function hoursFromHeadcount(headcount: number): number {
  return headcount * 0.5
}

export function hoursForWeek(args: {
  cells: Record<string, { headcount: number }>
  farmId: string
  commodityId: string
  activityIds: string[]
  weekStart: Date
}): number {
  let hours = 0
  for (const day of weekDates(args.weekStart)) {
    const date = toISODate(day)
    for (const activityId of args.activityIds) {
      for (let slot = 0; slot < SLOT_COUNT; slot++) {
        const key = cellKey({
          farmId: args.farmId,
          commodityId: args.commodityId,
          activityId,
          date,
          slot,
        })
        hours += hoursFromHeadcount(args.cells[key]?.headcount ?? 0)
      }
    }
  }
  return hours
}
