import { isPastPlanningWeek } from './time'
import type { PlanType } from '../types'

/** Plan types scoped to a planning week (BR-001 temporal locking). */
export function isWeekScopedPlanType(planType: PlanType): boolean {
  return (
    planType === 'labor-weekly' ||
    planType === 'harvest-weekly' ||
    planType === 'tearout-gantt' ||
    planType === 'planting-gantt'
  )
}

/**
 * Past planning weeks are read-only.
 * Current and future weeks remain fully editable (all days in that week).
 */
export function isPastWeeklyPlanLocked(
  planType: PlanType,
  weekStartISO: string,
  today = new Date(),
): boolean {
  return isWeekScopedPlanType(planType) && isPastPlanningWeek(weekStartISO, today)
}
