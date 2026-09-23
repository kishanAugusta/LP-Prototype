/** Lettucemeet-style paint mode from People value + start cell headcount. */
export type SlotPaintMode = 'write' | 'erase'

/**
 * Write when People is a new value vs the start cell.
 * Erase when People is 0 or matches the start cell headcount.
 */
export function resolveSlotPaintMode(people: number, startHeadcount: number): SlotPaintMode {
  if (people === 0) return 'erase'
  if (startHeadcount === people) return 'erase'
  return 'write'
}

export function inclusiveRange(a: number, b: number): number[] {
  const lo = Math.min(a, b)
  const hi = Math.max(a, b)
  return Array.from({ length: hi - lo + 1 }, (_, i) => lo + i)
}

/** Dates and slot indices covered by a drag rectangle (inclusive). */
export function rectSelection(args: {
  dateISOs: string[]
  startDay: number
  endDay: number
  startSlot: number
  endSlot: number
}): { dates: string[]; slots: number[] } {
  const dayIdxs = inclusiveRange(args.startDay, args.endDay)
  const slots = inclusiveRange(args.startSlot, args.endSlot)
  return {
    dates: dayIdxs.map((i) => args.dateISOs[i]).filter((d): d is string => Boolean(d)),
    slots,
  }
}

export function isCellInRect(
  dayIdx: number,
  slot: number,
  rect: {
    startDay: number
    endDay: number
    startSlot: number
    endSlot: number
  },
): boolean {
  const d0 = Math.min(rect.startDay, rect.endDay)
  const d1 = Math.max(rect.startDay, rect.endDay)
  const s0 = Math.min(rect.startSlot, rect.endSlot)
  const s1 = Math.max(rect.startSlot, rect.endSlot)
  return dayIdx >= d0 && dayIdx <= d1 && slot >= s0 && slot <= s1
}
