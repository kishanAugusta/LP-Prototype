export type Role = 'admin' | 'planner' | 'manager'
export type Horizon = 'weekly' | 'monthly' | 'yearly'
export type Tab = 'planner' | 'summary' | 'admin' | 'map'
export type GroupBy = 'detailed' | 'horizon' | 'planner' | 'farm' | 'commodity' | 'activity'
export type HouseId = 'house-mini' | 'house-fred' | 'house-harvest'
export type PlanType =
  | 'labor-weekly'
  | 'labor-monthly'
  | 'harvest-weekly'
  | 'tearout-gantt'
  | 'planting-gantt'

export const PLAN_TYPE_OPTIONS: { id: PlanType; label: string; group: string }[] = [
  { id: 'labor-weekly', label: 'Labor (Weekly)', group: 'Labor Plans' },
  { id: 'labor-monthly', label: 'Labor (Monthly Budget)', group: 'Labor Plans' },
  { id: 'harvest-weekly', label: 'Harvest (Weekly)', group: 'Mini-FRED Harvest Plans' },
  { id: 'tearout-gantt', label: 'Tear-Out (Weekly Gantt)', group: 'Tear-Out / Cleanout' },
  { id: 'planting-gantt', label: 'Planting (Weekly Gantt)', group: 'Planting' },
]

export interface User {
  id: string
  name: string
  email: string
  role: Role
  farmIds: string[]
  commodityIds: string[]
  activityIds: string[]
}

export interface DirectoryPerson {
  id: string
  name: string
  email: string
  department: string
}

export interface Farm {
  id: string
  name: string
  commodityIds: string[]
  activityIds: string[]
}

export interface NamedEntity {
  id: string
  name: string
}

export type Commodity = NamedEntity
export type Activity = NamedEntity

export interface Cell {
  headcount: number
  plannerId: string
  plannerName: string
}

export interface Note {
  id: string
  farmId: string
  commodityId: string
  activityId: string
  weekKey: string
  subject: string
  body: string
  author: string
  timestamp: string
  kind: 'note' | 'audit'
}

export interface Submission {
  key: string
  submittedAt: string
  submittedBy: string
}

export interface Toast {
  id: string
  tone: 'success' | 'error' | 'info' | 'warning'
  title: string
  message: string
}

export interface RecReason {
  week: string
  frequency: number
  avgHeadcount: number
}

export interface Recommendation {
  slotHeadcount: number[]
  sourceLabel: string
  threshold: number
  reasons: RecReason[]
}

export interface GreenhouseHouse {
  id: HouseId
  name: string
  label: string
  rows: number
  acres: number
}

export interface ShiftTemplate {
  id: string
  farmId: string
  name: string
  startSlot: number
  endSlot: number
  defaultHeadcount: number
}

export type GuardrailMetric = 'maxHeadcountPerSlot' | 'maxWeeklyHours' | 'overtimeFteWarn'

export interface GuardrailCondition {
  id: string
  name: string
  metric: GuardrailMetric
  threshold: number
  farmId: string
  activityId: string
  enabled: boolean
}

export type LogicRequirement = 'before' | 'after'
export type LogicBuffer = 'immediately' | '1day' | '1week' | '2weeks'

export interface LogicGate {
  id: string
  code: string
  activityId: string
  requirement: LogicRequirement
  buffer: LogicBuffer
  referenceEvent: string
}

export interface Guardrails {
  enabled: boolean
  conditions: GuardrailCondition[]
  logicGates: LogicGate[]
}

/** Per-farm daily work window (Admin shift scheduler). day: 0=Sun … 6=Sat */
export interface FarmDaySchedule {
  farmId: string
  day: number
  work: boolean
  start: string
  end: string
}

export interface ActivityCalibration {
  activityId: string
  minutesPerRow: number
}

export interface PlanningReport {
  id: string
  name: string
  cadence: string
  enabled: boolean
  farmIds: string[]
  commodityIds: string[]
  activityIds: string[]
}
