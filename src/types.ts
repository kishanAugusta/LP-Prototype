export type Role = 'admin' | 'planner' | 'manager'
export type Horizon = 'weekly' | 'monthly' | 'yearly'
export type Tab = 'planner' | 'summary' | 'admin'
export type GroupBy = 'horizon' | 'planner' | 'farm' | 'commodity' | 'activity'
export type HouseId = 'house-mini' | 'house-fred' | 'house-harvest'

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

export interface Guardrails {
  maxHeadcountPerSlot: number
  maxWeeklyHours: number
  overtimeFteWarn: number
  enabled: boolean
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
}
