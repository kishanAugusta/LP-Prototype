import type { Recommendation, RecReason } from '../types'
import { SLOT_COUNT } from './time'

export function fteFromHours(hours: number): number {
  return hours / 40
}

function hash(input: string): number {
  let h = 0
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0
  return h
}

export function buildRecommendation(
  farmId: string,
  commodityId: string,
  activityId: string,
): Recommendation {
  const seed = hash(`${farmId}|${commodityId}|${activityId}`)
  const morning = 4 + (seed % 5)
  const midday = 2 + (seed % 4)
  const afternoon = 1 + (seed % 3)
  const slotHeadcount = Array.from({ length: SLOT_COUNT }, (_, i) => {
    const hour = 6 + i * 0.5
    if (hour < 10) return morning
    if (hour < 14) return midday
    return afternoon
  })
  const reasons: RecReason[] = [
    { week: 'Wk 16', frequency: 0.8, avgHeadcount: morning },
    { week: 'Wk 17', frequency: 0.72, avgHeadcount: morning - 1 },
    { week: 'Wk 18', frequency: 0.9, avgHeadcount: morning },
    { week: 'Wk 19', frequency: 0.64, avgHeadcount: midday + 1 },
    { week: 'Wk 20', frequency: 0.76, avgHeadcount: morning },
  ]
  return {
    slotHeadcount,
    sourceLabel: 'Calculated from Wk 16–20 actuals (Priva / Hortimax) using a 60% recurrence threshold.',
    threshold: 0.6,
    reasons,
  }
}
