import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react'
import {
  activities as seedActivities,
  commodities as seedCommodities,
  demoUsers,
  farms as seedFarms,
  seedCalibrations,
  seedCells,
  seedFarmDaySchedules,
  seedGuardrails,
  seedNotes,
  seedReports,
  seedShifts,
  seedSubmissions,
} from '../data/mock'
import { buildRecommendation, fteFromHours } from '../lib/calc'
import {
  addDays,
  cellKey,
  hoursFromHeadcount,
  SLOT_COUNT,
  startOfWeek,
  submissionKey,
  toISODate,
  weekDates,
  weekKeyFromDate,
} from '../lib/time'
import type {
  Activity,
  ActivityCalibration,
  Cell,
  Commodity,
  Farm,
  FarmDaySchedule,
  GroupBy,
  GuardrailCondition,
  GuardrailMetric,
  Guardrails,
  Horizon,
  HouseId,
  LogicGate,
  Note,
  PlanType,
  PlanningReport,
  Recommendation,
  Role,
  ShiftTemplate,
  Submission,
  Tab,
  Toast,
  User,
} from '../types'

const STORAGE_KEY = 'labour-planner-prototype-v6'

interface PersistShape {
  users: User[]
  farms: Farm[]
  commodities: Commodity[]
  activities: Activity[]
  cells: Record<string, Cell>
  notes: Note[]
  submissions: Record<string, Submission>
  currentUserId: string | null
  houseId: HouseId
  ratePerHour: number
  shifts: ShiftTemplate[]
  farmDaySchedules: FarmDaySchedule[]
  guardrails: Guardrails
  calibrations: ActivityCalibration[]
  reports: PlanningReport[]
  planType: PlanType
  /** farm|weekKey|day|rowId → selected for harvest */
  harvestPicks: Record<string, boolean>
  /** plan|farm|weekKey|taskId → { rows, crew } */
  ganttMeta: Record<string, { rows: number; crew: number }>
  /** plan|farm|weekKey|taskId|date → intensity 1|2|3 */
  ganttDays: Record<string, 1 | 2 | 3>
  /** farm|year|activityId|month → planned hours */
  monthlyPlan: Record<string, number>
}

export interface AppState extends PersistShape {
  tab: Tab
  horizon: Horizon
  year: number
  month: number
  weekStartISO: string
  expandedWeekISO: string | null
  farmId: string
  commodityId: string
  activityId: string
  people: number
  recDismissed: boolean
  notesOpen: boolean
  helpOpen: boolean
  reasonOpen: boolean
  pendingReason: string
  noteSubject: string
  noteBody: string
  toasts: Toast[]
  online: boolean
  groupBy: GroupBy
  summaryFarmId: string
  summaryCommodityId: string
  summaryActivityId: string
  summaryPlannerId: string
  mapOpen: boolean
  harvestDay: number
}

type Action =
  | { type: 'hydrate'; payload: Partial<AppState> }
  | { type: 'login'; userId: string }
  | { type: 'logout' }
  | { type: 'setTab'; tab: Tab }
  | { type: 'setHorizon'; horizon: Horizon }
  | { type: 'setPlanType'; planType: PlanType }
  | { type: 'shiftWeek'; delta: number }
  | { type: 'setWeek'; iso: string }
  | { type: 'setMonth'; year: number; month: number }
  | { type: 'setYear'; year: number }
  | { type: 'expandWeek'; iso: string | null }
  | { type: 'setFarm'; farmId: string }
  | { type: 'setCommodity'; commodityId: string }
  | { type: 'setActivity'; activityId: string }
  | { type: 'setHouse'; houseId: HouseId }
  | { type: 'setPeople'; people: number }
  | { type: 'setRate'; ratePerHour: number }
  | { type: 'toggleMap'; open?: boolean }
  | { type: 'shiftMonth'; delta: number }
  | { type: 'setHarvestDay'; day: number }
  | { type: 'toggleHarvestRow'; rowId: string }
  | { type: 'setHarvestRow'; rowId: string; on: boolean }
  | { type: 'clearHarvestDay' }
  | { type: 'clearHarvestWeek' }
  | { type: 'setGanttMeta'; key: string; rows: number; crew: number }
  | { type: 'cycleGanttDay'; key: string }
  | { type: 'setMonthlyPlan'; key: string; hours: number }
  | { type: 'fillCells'; dates: string[]; slots: number[]; activityId?: string }
  | {
      type: 'clearCells'
      dates: string[]
      slots?: number[]
      activityId?: string
    }
  | { type: 'applyShift'; shiftId: string }
  | { type: 'applyRecommendation' }
  | { type: 'dismissRec' }
  | { type: 'setNoteDraft'; subject?: string; body?: string }
  | { type: 'addNote' }
  | { type: 'toggleNotes'; open?: boolean }
  | { type: 'toggleHelp'; open?: boolean }
  | { type: 'requestSubmit' }
  | { type: 'setPendingReason'; reason: string }
  | { type: 'confirmSubmit' }
  | { type: 'cancelReason' }
  | { type: 'toast'; toast: Omit<Toast, 'id'> }
  | { type: 'dismissToast'; id: string }
  | { type: 'setOnline'; online: boolean }
  | { type: 'setGroupBy'; groupBy: GroupBy }
  | { type: 'setSummaryFilter'; key: 'farm' | 'commodity' | 'activity' | 'planner'; value: string }
  | { type: 'addFarm'; name: string }
  | { type: 'addCommodity'; name: string }
  | { type: 'addActivity'; name: string }
  | { type: 'renameFarm'; id: string; name: string }
  | { type: 'renameCommodity'; id: string; name: string }
  | { type: 'renameActivity'; id: string; name: string }
  | { type: 'removeFarm'; id: string }
  | { type: 'removeCommodity'; id: string }
  | { type: 'removeActivity'; id: string }
  | { type: 'updateFarmCrops'; id: string; commodityIds: string[] }
  | { type: 'provisionUser'; user: User }
  | { type: 'updateUser'; user: User }
  | { type: 'deleteUser'; id: string }
  | { type: 'setGuardrails'; guardrails: Partial<Guardrails> }
  | { type: 'addGuardrailCondition'; condition: Omit<GuardrailCondition, 'id'> }
  | { type: 'updateGuardrailCondition'; condition: GuardrailCondition }
  | { type: 'removeGuardrailCondition'; id: string }
  | { type: 'addLogicGate'; gate: Omit<LogicGate, 'id' | 'code'> }
  | { type: 'updateLogicGate'; gate: LogicGate }
  | { type: 'removeLogicGate'; id: string }
  | { type: 'setFarmDaySchedule'; schedule: FarmDaySchedule }
  | { type: 'setCalibration'; activityId: string; minutesPerRow: number }
  | { type: 'addShift'; shift: Omit<ShiftTemplate, 'id'> }
  | { type: 'updateShift'; shift: ShiftTemplate }
  | { type: 'removeShift'; id: string }
  | { type: 'toggleReport'; id: string }
  | { type: 'setReportScope'; id: string; key: 'farmIds' | 'commodityIds' | 'activityIds'; ids: string[] }

function todayParts(d = new Date()) {
  const weekStart = startOfWeek(d)
  return {
    year: d.getFullYear(),
    month: d.getMonth(),
    weekStartISO: toISODate(weekStart),
  }
}

function allowedFarms(user: User | null, farms: Farm[]): Farm[] {
  if (!user) return []
  if (user.role === 'admin' || user.role === 'manager') return farms
  return farms.filter((f) => user.farmIds.includes(f.id))
}

function firstScope(user: User | null, farms: Farm[]) {
  const visible = allowedFarms(user, farms)
  const farm = visible[0]
  const commodityId = farm?.commodityIds[0] ?? ''
  const activityId = farm?.activityIds[0] ?? ''
  return { farmId: farm?.id ?? '', commodityId, activityId }
}

/** Lowest enabled threshold for a metric that matches current farm/activity scope. */
function guardrailThreshold(state: AppState, metric: GuardrailMetric): number | null {
  if (!state.guardrails.enabled) return null
  const matches = state.guardrails.conditions.filter((c) => {
    if (!c.enabled || c.metric !== metric) return false
    if (c.farmId !== 'all' && c.farmId !== state.farmId) return false
    if (c.activityId !== 'all' && c.activityId !== state.activityId) return false
    return true
  })
  if (matches.length === 0) return null
  return Math.min(...matches.map((c) => c.threshold))
}

function canEditPlan(state: AppState): boolean {
  const user = currentUser(state)
  return Boolean(user && user.role !== 'manager')
}

function harvestDayPrefix(state: AppState): string {
  const weekKey = weekKeyFromDate(new Date(state.weekStartISO + 'T00:00:00'))
  return `${state.farmId}|${weekKey}|${state.harvestDay}|`
}

function harvestKey(state: AppState, rowId: string): string {
  return `${harvestDayPrefix(state)}${rowId}`
}

function initialState(): AppState {
  const now = new Date()
  const parts = todayParts(now)
  const base: AppState = {
    users: demoUsers,
    farms: seedFarms,
    commodities: seedCommodities,
    activities: seedActivities,
    cells: seedCells(now),
    notes: seedNotes(now),
    submissions: seedSubmissions(now),
    currentUserId: null,
    tab: 'planner',
    horizon: 'weekly',
    year: parts.year,
    month: parts.month,
    weekStartISO: parts.weekStartISO,
    expandedWeekISO: null,
    farmId: seedFarms[0].id,
    commodityId: seedFarms[0].commodityIds[0],
    activityId: '',
    people: 5,
    recDismissed: false,
    notesOpen: false,
    helpOpen: false,
    reasonOpen: false,
    pendingReason: '',
    noteSubject: '',
    noteBody: '',
    toasts: [],
    online: typeof navigator === 'undefined' ? true : navigator.onLine,
    groupBy: 'detailed',
    summaryFarmId: 'all',
    summaryCommodityId: 'all',
    summaryActivityId: 'all',
    summaryPlannerId: 'all',
    houseId: 'house-mini',
    ratePerHour: 18,
    mapOpen: false,
    shifts: seedShifts(),
    farmDaySchedules: seedFarmDaySchedules(seedFarms.map((f) => f.id)),
    guardrails: seedGuardrails,
    calibrations: seedCalibrations,
    reports: seedReports(
      seedFarms.map((f) => f.id),
      seedCommodities.map((c) => c.id),
      seedActivities.map((a) => a.id),
    ),
    planType: 'labour-weekly',
    harvestPicks: {},
    ganttMeta: {},
    ganttDays: {},
    monthlyPlan: {},
    harvestDay: 0,
  }
  const persisted = loadPersisted()
  if (!persisted) return base
  return {
    ...base,
    ...persisted,
    farmDaySchedules: persisted.farmDaySchedules ?? base.farmDaySchedules,
    guardrails: {
      ...base.guardrails,
      ...persisted.guardrails,
      conditions: persisted.guardrails?.conditions ?? base.guardrails.conditions,
      logicGates: persisted.guardrails?.logicGates ?? base.guardrails.logicGates,
    },
  }
}

function currentUser(state: AppState): User | null {
  return state.users.find((u) => u.id === state.currentUserId) ?? null
}

function pushToast(state: AppState, toast: Omit<Toast, 'id'>): AppState {
  return {
    ...state,
    toasts: [...state.toasts, { ...toast, id: crypto.randomUUID() }],
  }
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'hydrate':
      return { ...state, ...action.payload }
    case 'login': {
      const user = state.users.find((u) => u.id === action.userId)
      if (!user) return state
      const scope = firstScope(user, state.farms)
      return {
        ...state,
        currentUserId: user.id,
        tab: user.role === 'manager' ? 'summary' : 'planner',
        ...scope,
        activityId: '',
        recDismissed: false,
      }
    }
    case 'logout':
      return { ...state, currentUserId: null, toasts: [] }
    case 'setTab':
      return { ...state, tab: action.tab }
    case 'setHorizon':
      return { ...state, horizon: action.horizon, expandedWeekISO: null }
    case 'setPlanType': {
      const planType = action.planType
      const horizon: Horizon = planType === 'labour-monthly' ? 'monthly' : 'weekly'
      const activityId =
        planType === 'labour-weekly' || planType === 'labour-monthly' ? state.activityId : state.activityId
      return {
        ...state,
        planType,
        horizon,
        expandedWeekISO: null,
        activityId: planType === 'harvest-weekly' ? '' : activityId,
        recDismissed: false,
      }
    }
    case 'setHarvestDay':
      return { ...state, harvestDay: Math.max(0, Math.min(5, action.day)) }
    case 'toggleHarvestRow': {
      if (!canEditPlan(state)) return state
      const key = harvestKey(state, action.rowId)
      const harvestPicks = { ...state.harvestPicks }
      if (harvestPicks[key]) delete harvestPicks[key]
      else harvestPicks[key] = true
      return { ...state, harvestPicks }
    }
    case 'setHarvestRow': {
      if (!canEditPlan(state)) return state
      const key = harvestKey(state, action.rowId)
      const harvestPicks = { ...state.harvestPicks }
      if (action.on) harvestPicks[key] = true
      else delete harvestPicks[key]
      return { ...state, harvestPicks }
    }
    case 'clearHarvestDay': {
      if (!canEditPlan(state)) return state
      const prefix = harvestDayPrefix(state)
      const harvestPicks = { ...state.harvestPicks }
      for (const key of Object.keys(harvestPicks)) {
        if (key.startsWith(prefix)) delete harvestPicks[key]
      }
      return { ...state, harvestPicks }
    }
    case 'clearHarvestWeek': {
      if (!canEditPlan(state)) return state
      const prefix = `${state.farmId}|${weekKeyFromDate(new Date(state.weekStartISO + 'T00:00:00'))}|`
      const harvestPicks = { ...state.harvestPicks }
      for (const key of Object.keys(harvestPicks)) {
        if (key.startsWith(prefix)) delete harvestPicks[key]
      }
      return { ...state, harvestPicks }
    }
    case 'setGanttMeta':
      if (!canEditPlan(state)) return state
      return {
        ...state,
        ganttMeta: {
          ...state.ganttMeta,
          [action.key]: { rows: action.rows, crew: action.crew },
        },
      }
    case 'cycleGanttDay': {
      if (!canEditPlan(state)) return state
      const cur = state.ganttDays[action.key]
      const ganttDays = { ...state.ganttDays }
      if (!cur) ganttDays[action.key] = 1
      else if (cur === 1) ganttDays[action.key] = 2
      else if (cur === 2) ganttDays[action.key] = 3
      else delete ganttDays[action.key]
      return { ...state, ganttDays }
    }
    case 'setMonthlyPlan':
      if (!canEditPlan(state)) return state
      return {
        ...state,
        monthlyPlan: { ...state.monthlyPlan, [action.key]: action.hours },
      }
    case 'shiftWeek': {
      const next = addDays(new Date(state.weekStartISO + 'T00:00:00'), action.delta * 7)
      return {
        ...state,
        weekStartISO: toISODate(next),
        year: next.getFullYear(),
        month: next.getMonth(),
        recDismissed: false,
      }
    }
    case 'setWeek': {
      const d = new Date(action.iso + 'T00:00:00')
      return {
        ...state,
        weekStartISO: action.iso,
        year: d.getFullYear(),
        month: d.getMonth(),
        recDismissed: false,
      }
    }
    case 'setMonth':
      return {
        ...state,
        year: action.year,
        month: action.month,
        horizon: 'monthly',
        expandedWeekISO: null,
      }
    case 'setYear': {
      const current = new Date(state.weekStartISO + 'T00:00:00')
      const weekStart = startOfWeek(new Date(action.year, current.getMonth(), current.getDate()))
      return {
        ...state,
        year: action.year,
        weekStartISO: toISODate(weekStart),
        month: weekStart.getMonth(),
        expandedWeekISO: null,
      }
    }
    case 'shiftMonth': {
      const d = new Date(state.year, state.month + action.delta, 1)
      return { ...state, year: d.getFullYear(), month: d.getMonth(), expandedWeekISO: null }
    }
    case 'setHouse':
      return { ...state, houseId: action.houseId, recDismissed: false }
    case 'setRate':
      return { ...state, ratePerHour: action.ratePerHour }
    case 'toggleMap':
      return { ...state, mapOpen: action.open ?? !state.mapOpen }
    case 'expandWeek': {
      if (!action.iso) return { ...state, expandedWeekISO: null }
      const d = new Date(action.iso + 'T00:00:00')
      return {
        ...state,
        expandedWeekISO: action.iso,
        weekStartISO: action.iso,
        year: d.getFullYear(),
        month: d.getMonth(),
        recDismissed: false,
      }
    }
    case 'setFarm': {
      const farm = state.farms.find((f) => f.id === action.farmId)
      return {
        ...state,
        farmId: action.farmId,
        commodityId: farm?.commodityIds[0] ?? '',
        activityId: '',
        recDismissed: false,
      }
    }
    case 'setCommodity':
      return { ...state, commodityId: action.commodityId, activityId: '', recDismissed: false }
    case 'setActivity':
      return { ...state, activityId: action.activityId, recDismissed: false }
    case 'setPeople':
      return { ...state, people: action.people }
    case 'fillCells': {
      const user = currentUser(state)
      const activityId = action.activityId ?? state.activityId
      if (!user || user.role === 'manager' || !activityId) return state
      let people = state.people
      let warned = false
      const scoped = { ...state, activityId }
      const maxSlot = guardrailThreshold(scoped, 'maxHeadcountPerSlot')
      if (maxSlot != null && people > maxSlot) {
        people = maxSlot
        warned = true
      }
      const cells = { ...state.cells }
      for (const date of action.dates) {
        for (const slot of action.slots) {
          const key = cellKey({
            farmId: state.farmId,
            houseId: state.houseId,
            commodityId: state.commodityId,
            activityId,
            date,
            slot,
          })
          if (people === 0) delete cells[key]
          else {
            cells[key] = {
              headcount: people,
              plannerId: user.id,
              plannerName: user.name,
            }
          }
        }
      }
      const next = { ...state, cells, activityId }
      return warned
        ? pushToast(next, {
            tone: 'warning',
            title: 'Guardrail applied',
            message: `Max ${maxSlot} people per slot. Extra headcount was capped.`,
          })
        : next
    }
    case 'clearCells': {
      const user = currentUser(state)
      const activityId = action.activityId ?? state.activityId
      if (!user || user.role === 'manager' || !activityId) return state
      const slots =
        action.slots ?? Array.from({ length: SLOT_COUNT }, (_, i) => i)
      const cells = { ...state.cells }
      for (const date of action.dates) {
        for (const slot of slots) {
          const key = cellKey({
            farmId: state.farmId,
            houseId: state.houseId,
            commodityId: state.commodityId,
            activityId,
            date,
            slot,
          })
          delete cells[key]
        }
      }
      return { ...state, cells, activityId }
    }
    case 'applyShift': {
      const user = currentUser(state)
      const shift = state.shifts.find((s) => s.id === action.shiftId)
      if (!user || !shift || !state.activityId) return state
      const dates = weekDates(new Date(state.weekStartISO + 'T00:00:00')).map(toISODate)
      const todayISO = toISODate(new Date())
      const slots = Array.from({ length: shift.endSlot - shift.startSlot }, (_, i) => shift.startSlot + i)
      const cells = { ...state.cells }
      for (const date of dates) {
        if (date < todayISO) continue
        for (const slot of slots) {
          cells[
            cellKey({
              farmId: state.farmId,
              houseId: state.houseId,
              commodityId: state.commodityId,
              activityId: state.activityId,
              date,
              slot,
            })
          ] = {
            headcount: shift.defaultHeadcount,
            plannerId: user.id,
            plannerName: user.name,
          }
        }
      }
      return pushToast(
        { ...state, cells },
        {
          tone: 'success',
          title: `${shift.name} shift applied`,
          message: `${shift.defaultHeadcount} people filled unlocked slots from the shift template.`,
        },
      )
    }
    case 'applyRecommendation': {
      const user = currentUser(state)
      if (!user || !state.activityId) return state
      const rec = buildRecommendation(state.farmId, state.commodityId, state.activityId)
      const dates = weekDates(new Date(state.weekStartISO + 'T00:00:00')).map(toISODate)
      const cells = { ...state.cells }
      const todayISO = toISODate(new Date())
      for (const date of dates) {
        if (date < todayISO) continue
        for (let slot = 0; slot < SLOT_COUNT; slot++) {
          const key = cellKey({
            farmId: state.farmId,
            houseId: state.houseId,
            commodityId: state.commodityId,
            activityId: state.activityId,
            date,
            slot,
          })
          cells[key] = {
            headcount: rec.slotHeadcount[slot],
            plannerId: user.id,
            plannerName: user.name,
          }
        }
      }
      return pushToast(
        { ...state, cells, recDismissed: true },
        {
          tone: 'success',
          title: 'Recommendation applied',
          message: 'Historic baseline filled the unlocked slots. You can still overwrite any cell.',
        },
      )
    }
    case 'dismissRec':
      return { ...state, recDismissed: true }
    case 'setNoteDraft':
      return {
        ...state,
        noteSubject: action.subject ?? state.noteSubject,
        noteBody: action.body ?? state.noteBody,
      }
    case 'addNote': {
      const user = currentUser(state)
      if (!user || !state.noteBody.trim()) return state
      const note: Note = {
        id: crypto.randomUUID(),
        farmId: state.farmId,
        commodityId: state.commodityId,
        activityId: state.activityId,
        weekKey: weekKeyFromDate(new Date(state.weekStartISO + 'T00:00:00')),
        subject: state.noteSubject.trim() || 'Operational note',
        body: state.noteBody.trim(),
        author: user.name,
        timestamp: new Date().toISOString(),
        kind: 'note',
      }
      return pushToast(
        { ...state, notes: [note, ...state.notes], noteSubject: '', noteBody: '' },
        { tone: 'success', title: 'Note saved', message: 'The note is attached to this farm, week, and activity.' },
      )
    }
    case 'toggleNotes':
      return { ...state, notesOpen: action.open ?? !state.notesOpen }
    case 'toggleHelp':
      return { ...state, helpOpen: action.open ?? !state.helpOpen }
    case 'requestSubmit': {
      if (!state.online) {
        return pushToast(state, {
          tone: 'error',
          title: 'Offline',
          message: 'Submit is disabled until Azure connectivity is restored.',
        })
      }
      const weekKey = weekKeyFromDate(new Date(state.weekStartISO + 'T00:00:00'))
      let filled = 0
      let plannedHours = 0

      if (state.planType === 'labour-weekly') {
        const dates = weekDates(new Date(state.weekStartISO + 'T00:00:00')).map(toISODate)
        for (const date of dates) {
          for (const activity of state.activities) {
            for (let slot = 0; slot < SLOT_COUNT; slot++) {
              const key = cellKey({
                farmId: state.farmId,
                houseId: state.houseId,
                commodityId: state.commodityId,
                activityId: activity.id,
                date,
                slot,
              })
              const head = state.cells[key]?.headcount ?? 0
              if (head) filled += 1
              plannedHours += hoursFromHeadcount(head)
            }
          }
        }
      } else if (state.planType === 'labour-monthly') {
        filled = Object.keys(state.monthlyPlan).filter((k) => k.startsWith(`${state.farmId}|${state.year}|`))
          .length
        plannedHours = Object.entries(state.monthlyPlan)
          .filter(([k]) => k.startsWith(`${state.farmId}|${state.year}|`))
          .reduce((s, [, h]) => s + h, 0)
        if (filled === 0) filled = 1 // defaults count as planned
      } else if (state.planType === 'harvest-weekly') {
        const prefix = `${state.farmId}|${weekKey}|`
        filled = Object.keys(state.harvestPicks).filter((k) => k.startsWith(prefix)).length
      } else {
        const prefix = `${state.planType}|${state.farmId}|${state.weekStartISO}|`
        filled = Object.keys(state.ganttDays).filter((k) => k.startsWith(prefix)).length
      }

      if (filled === 0) {
        return pushToast(state, {
          tone: 'error',
          title: 'Empty plan',
          message: 'Add at least one allocation before submitting this plan type.',
        })
      }
      const maxWeekly = guardrailThreshold(state, 'maxWeeklyHours')
      if (
        maxWeekly != null &&
        plannedHours > maxWeekly &&
        (state.planType === 'labour-weekly' || state.planType === 'labour-monthly')
      ) {
        return pushToast(state, {
          tone: 'warning',
          title: 'Weekly hours guardrail',
          message: `${plannedHours.toFixed(1)} hrs exceeds the ${maxWeekly} hr weekly cap. Reduce allocation before submit.`,
        })
      }
      const activityId = state.activityId || state.planType
      const subKey = submissionKey(
        state.farmId,
        state.houseId,
        weekKey,
        state.commodityId || 'all',
        activityId,
      )
      if (state.submissions[subKey]) {
        return { ...state, reasonOpen: true, pendingReason: '' }
      }
      return confirmSubmit(state, subKey)
    }
    case 'setPendingReason':
      return { ...state, pendingReason: action.reason }
    case 'confirmSubmit': {
      if (!state.pendingReason.trim()) {
        return pushToast(state, {
          tone: 'warning',
          title: 'Reason required',
          message: 'Changing a submitted schedule requires an audit reason.',
        })
      }
      const subKey = submissionKey(
        state.farmId,
        state.houseId,
        weekKeyFromDate(new Date(state.weekStartISO + 'T00:00:00')),
        state.commodityId,
        state.activityId,
      )
      return confirmSubmit(state, subKey, state.pendingReason.trim())
    }
    case 'cancelReason':
      return { ...state, reasonOpen: false, pendingReason: '' }
    case 'toast':
      return pushToast(state, action.toast)
    case 'dismissToast':
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) }
    case 'setOnline':
      return { ...state, online: action.online }
    case 'setGroupBy':
      return { ...state, groupBy: action.groupBy }
    case 'setSummaryFilter': {
      if (action.key === 'farm') return { ...state, summaryFarmId: action.value }
      if (action.key === 'commodity') return { ...state, summaryCommodityId: action.value }
      if (action.key === 'activity') return { ...state, summaryActivityId: action.value }
      return { ...state, summaryPlannerId: action.value }
    }
    case 'addFarm': {
      const name = action.name.trim()
      if (!name) return state
      const farm: Farm = {
        id: `farm-${crypto.randomUUID().slice(0, 8)}`,
        name,
        commodityIds: state.commodities.slice(0, 2).map((c) => c.id),
        activityIds: state.activities.map((a) => a.id),
      }
      const users = state.users.map((u) =>
        u.role === 'admin' || u.role === 'manager' ? { ...u, farmIds: [...u.farmIds, farm.id] } : u,
      )
      return pushToast(
        {
          ...state,
          farms: [...state.farms, farm],
          users,
          farmDaySchedules: [
            ...state.farmDaySchedules,
            ...Array.from({ length: 7 }, (_, day) => ({
              farmId: farm.id,
              day,
              work: day >= 1 && day <= 6,
              start: '06:00',
              end: '16:00',
            })),
          ],
        },
        { tone: 'success', title: 'Farm added', message: `${name} is now available in filters.` },
      )
    }
    case 'addCommodity': {
      const name = action.name.trim()
      if (!name) return state
      const commodity: Commodity = { id: `com-${crypto.randomUUID().slice(0, 8)}`, name }
      return pushToast(
        { ...state, commodities: [...state.commodities, commodity] },
        { tone: 'success', title: 'Commodity added', message: `${name} was added to the master list.` },
      )
    }
    case 'addActivity': {
      const name = action.name.trim()
      if (!name) return state
      const activity: Activity = { id: `act-${crypto.randomUUID().slice(0, 8)}`, name }
      const farms = state.farms.map((f) => ({ ...f, activityIds: [...f.activityIds, activity.id] }))
      return pushToast(
        {
          ...state,
          activities: [...state.activities, activity],
          farms,
          calibrations: [...state.calibrations, { activityId: activity.id, minutesPerRow: 10 }],
        },
        { tone: 'success', title: 'Activity added', message: `${name} was added to all farm profiles.` },
      )
    }
    case 'renameFarm': {
      const name = action.name.trim()
      if (!name) return state
      return {
        ...state,
        farms: state.farms.map((f) => (f.id === action.id ? { ...f, name } : f)),
      }
    }
    case 'renameCommodity': {
      const name = action.name.trim()
      if (!name) return state
      return {
        ...state,
        commodities: state.commodities.map((c) => (c.id === action.id ? { ...c, name } : c)),
      }
    }
    case 'renameActivity': {
      const name = action.name.trim()
      if (!name) return state
      return {
        ...state,
        activities: state.activities.map((a) => (a.id === action.id ? { ...a, name } : a)),
      }
    }
    case 'removeFarm':
      return {
        ...state,
        farms: state.farms.filter((f) => f.id !== action.id),
        farmId: state.farmId === action.id ? state.farms.find((f) => f.id !== action.id)?.id ?? '' : state.farmId,
      }
    case 'removeCommodity':
      return {
        ...state,
        commodities: state.commodities.filter((c) => c.id !== action.id),
        farms: state.farms.map((f) => ({
          ...f,
          commodityIds: f.commodityIds.filter((id) => id !== action.id),
        })),
      }
    case 'removeActivity':
      return {
        ...state,
        activities: state.activities.filter((a) => a.id !== action.id),
        farms: state.farms.map((f) => ({
          ...f,
          activityIds: f.activityIds.filter((id) => id !== action.id),
        })),
      }
    case 'updateFarmCrops':
      return {
        ...state,
        farms: state.farms.map((f) =>
          f.id === action.id ? { ...f, commodityIds: action.commodityIds } : f,
        ),
      }
    case 'provisionUser':
      return pushToast(
        { ...state, users: [...state.users, action.user] },
        { tone: 'success', title: 'User linked', message: `${action.user.name} can now sign in with the assigned scope.` },
      )
    case 'updateUser':
      return {
        ...state,
        users: state.users.map((u) => (u.id === action.user.id ? action.user : u)),
      }
    case 'deleteUser':
      if (action.id === state.currentUserId) {
        return pushToast(state, {
          tone: 'warning',
          title: 'Cannot delete',
          message: 'You cannot delete the signed-in user during this session.',
        })
      }
      return { ...state, users: state.users.filter((u) => u.id !== action.id) }
    case 'setGuardrails':
      return { ...state, guardrails: { ...state.guardrails, ...action.guardrails } }
    case 'addGuardrailCondition': {
      const condition: GuardrailCondition = {
        ...action.condition,
        id: `gr-${crypto.randomUUID().slice(0, 8)}`,
      }
      return pushToast(
        {
          ...state,
          guardrails: {
            ...state.guardrails,
            conditions: [...state.guardrails.conditions, condition],
          },
        },
        { tone: 'success', title: 'Guardrail added', message: `${condition.name} is now active when Enabled.` },
      )
    }
    case 'updateGuardrailCondition':
      return {
        ...state,
        guardrails: {
          ...state.guardrails,
          conditions: state.guardrails.conditions.map((c) =>
            c.id === action.condition.id ? action.condition : c,
          ),
        },
      }
    case 'removeGuardrailCondition':
      return {
        ...state,
        guardrails: {
          ...state.guardrails,
          conditions: state.guardrails.conditions.filter((c) => c.id !== action.id),
        },
      }
    case 'addLogicGate': {
      const n = state.guardrails.logicGates.length + 1
      const gate: LogicGate = {
        ...action.gate,
        id: `lg-${crypto.randomUUID().slice(0, 8)}`,
        code: `R-${String(n).padStart(2, '0')}`,
      }
      return pushToast(
        {
          ...state,
          guardrails: {
            ...state.guardrails,
            logicGates: [...state.guardrails.logicGates, gate],
          },
        },
        { tone: 'success', title: 'Rule added', message: `${gate.code} is now an active logic gate.` },
      )
    }
    case 'updateLogicGate':
      return {
        ...state,
        guardrails: {
          ...state.guardrails,
          logicGates: state.guardrails.logicGates.map((g) =>
            g.id === action.gate.id ? action.gate : g,
          ),
        },
      }
    case 'removeLogicGate':
      return {
        ...state,
        guardrails: {
          ...state.guardrails,
          logicGates: state.guardrails.logicGates.filter((g) => g.id !== action.id),
        },
      }
    case 'setFarmDaySchedule': {
      const key = (s: FarmDaySchedule) => `${s.farmId}|${s.day}`
      const exists = state.farmDaySchedules.some(
        (s) => key(s) === key(action.schedule),
      )
      return {
        ...state,
        farmDaySchedules: exists
          ? state.farmDaySchedules.map((s) =>
              key(s) === key(action.schedule) ? action.schedule : s,
            )
          : [...state.farmDaySchedules, action.schedule],
      }
    }
    case 'setCalibration': {
      const exists = state.calibrations.some((c) => c.activityId === action.activityId)
      return {
        ...state,
        calibrations: exists
          ? state.calibrations.map((c) =>
              c.activityId === action.activityId ? { ...c, minutesPerRow: action.minutesPerRow } : c,
            )
          : [...state.calibrations, { activityId: action.activityId, minutesPerRow: action.minutesPerRow }],
      }
    }
    case 'addShift': {
      const shift: ShiftTemplate = { ...action.shift, id: `shift-${crypto.randomUUID().slice(0, 8)}` }
      return pushToast(
        { ...state, shifts: [...state.shifts, shift] },
        { tone: 'success', title: 'Shift added', message: `${shift.name} is available on the planner.` },
      )
    }
    case 'updateShift':
      return {
        ...state,
        shifts: state.shifts.map((s) => (s.id === action.shift.id ? action.shift : s)),
      }
    case 'removeShift':
      return { ...state, shifts: state.shifts.filter((s) => s.id !== action.id) }
    case 'toggleReport':
      return {
        ...state,
        reports: state.reports.map((r) => (r.id === action.id ? { ...r, enabled: !r.enabled } : r)),
      }
    case 'setReportScope':
      return {
        ...state,
        reports: state.reports.map((r) =>
          r.id === action.id ? { ...r, [action.key]: action.ids } : r,
        ),
      }
    default:
      return state
  }
}

function confirmSubmit(state: AppState, subKey: string, reason?: string): AppState {
  const user = currentUser(state)
  if (!user) return state
  const now = new Date().toISOString()
  const notes = [...state.notes]
  if (state.noteBody.trim()) {
    notes.unshift({
      id: crypto.randomUUID(),
      farmId: state.farmId,
      commodityId: state.commodityId,
      activityId: state.activityId,
      weekKey: weekKeyFromDate(new Date(state.weekStartISO + 'T00:00:00')),
      subject: state.noteSubject.trim() || 'Schedule note',
      body: state.noteBody.trim(),
      author: user.name,
      timestamp: now,
      kind: 'note',
    })
  }
  if (reason) {
    notes.unshift({
      id: crypto.randomUUID(),
      farmId: state.farmId,
      commodityId: state.commodityId,
      activityId: state.activityId,
      weekKey: weekKeyFromDate(new Date(state.weekStartISO + 'T00:00:00')),
      subject: 'Reason for change',
      body: reason,
      author: user.name,
      timestamp: now,
      kind: 'audit',
    })
  }
  notes.unshift({
    id: crypto.randomUUID(),
    farmId: state.farmId,
    commodityId: state.commodityId,
    activityId: state.activityId,
    weekKey: weekKeyFromDate(new Date(state.weekStartISO + 'T00:00:00')),
    subject: reason ? 'Schedule revised' : 'Schedule submitted',
    body: reason
      ? `Previously submitted plan was updated. Reason: ${reason}`
      : 'Schedule submitted and ready for Azure SQL persistence and Power BI.',
    author: user.name,
    timestamp: now,
    kind: 'audit',
  })
  const hours = weekDates(new Date(state.weekStartISO + 'T00:00:00'))
    .map(toISODate)
    .reduce((sum, date) => {
      let h = 0
      for (let slot = 0; slot < SLOT_COUNT; slot++) {
        const key = cellKey({
          farmId: state.farmId,
          houseId: state.houseId,
          commodityId: state.commodityId,
          activityId: state.activityId,
          date,
          slot,
        })
        h += hoursFromHeadcount(state.cells[key]?.headcount ?? 0)
      }
      return sum + h
    }, 0)
  return pushToast(
    {
      ...state,
      notes,
      noteSubject: '',
      noteBody: '',
      reasonOpen: false,
      pendingReason: '',
      submissions: {
        ...state.submissions,
        [subKey]: { key: subKey, submittedAt: now, submittedBy: user.name },
      },
    },
    {
      tone: 'success',
      title: 'Schedule submitted',
      message: `${hours.toFixed(1)} planned hours committed. Summary and FTE cards have refreshed.`,
    },
  )
}

function loadPersisted(): Partial<AppState> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PersistShape
  } catch {
    return null
  }
}

interface StoreValue {
  state: AppState
  user: User | null
  visibleFarms: Farm[]
  farm: Farm | undefined
  farmCommodities: Commodity[]
  farmActivities: Activity[]
  recommendation: Recommendation | null
  weekHours: number
  weekFte: number
  isAdmin: boolean
  canPlan: boolean
  dispatch: Dispatch<Action>
}

const StoreContext = createContext<StoreValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState)

  useEffect(() => {
    const payload: PersistShape = {
      users: state.users,
      farms: state.farms,
      commodities: state.commodities,
      activities: state.activities,
      cells: state.cells,
      notes: state.notes,
      submissions: state.submissions,
      currentUserId: state.currentUserId,
      houseId: state.houseId,
      ratePerHour: state.ratePerHour,
      shifts: state.shifts,
      farmDaySchedules: state.farmDaySchedules,
      guardrails: state.guardrails,
      calibrations: state.calibrations,
      reports: state.reports,
      planType: state.planType,
      harvestPicks: state.harvestPicks,
      ganttMeta: state.ganttMeta,
      ganttDays: state.ganttDays,
      monthlyPlan: state.monthlyPlan,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  }, [
    state.users,
    state.farms,
    state.commodities,
    state.activities,
    state.cells,
    state.notes,
    state.submissions,
    state.currentUserId,
    state.houseId,
    state.ratePerHour,
    state.shifts,
    state.farmDaySchedules,
    state.guardrails,
    state.calibrations,
    state.reports,
    state.planType,
    state.harvestPicks,
    state.ganttMeta,
    state.ganttDays,
    state.monthlyPlan,
  ])

  useEffect(() => {
    const on = () => dispatch({ type: 'setOnline', online: true })
    const off = () => dispatch({ type: 'setOnline', online: false })
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  const user = useMemo(() => currentUser(state), [state])
  const visibleFarms = useMemo(() => allowedFarms(user, state.farms), [user, state.farms])
  const farm = state.farms.find((f) => f.id === state.farmId)
  const farmCommodities = state.commodities.filter((c) => {
    if (!farm?.commodityIds.includes(c.id)) return false
    if (user?.role === 'planner' && user.commodityIds.length > 0 && !user.commodityIds.includes(c.id)) {
      return false
    }
    return true
  })
  const farmActivities = state.activities.filter((a) => {
    if (!farm?.activityIds.includes(a.id)) return false
    if (user?.role === 'planner' && user.activityIds.length > 0 && !user.activityIds.includes(a.id)) {
      return false
    }
    return true
  })
  const recommendation = useMemo(() => {
    if (!state.farmId || !state.commodityId || !state.activityId) return null
    return buildRecommendation(state.farmId, state.commodityId, state.activityId)
  }, [state.farmId, state.commodityId, state.activityId])

  const weekHours = useMemo(() => {
    if (!state.activityId) return 0
    let hours = 0
    for (const date of weekDates(new Date(state.weekStartISO + 'T00:00:00')).map(toISODate)) {
      for (let slot = 0; slot < SLOT_COUNT; slot++) {
        const key = cellKey({
          farmId: state.farmId,
          houseId: state.houseId,
          commodityId: state.commodityId,
          activityId: state.activityId,
          date,
          slot,
        })
        hours += hoursFromHeadcount(state.cells[key]?.headcount ?? 0)
      }
    }
    return hours
  }, [state.activityId, state.weekStartISO, state.farmId, state.houseId, state.commodityId, state.cells])

  const value = useMemo<StoreValue>(
    () => ({
      state,
      user,
      visibleFarms,
      farm,
      farmCommodities,
      farmActivities,
      recommendation,
      weekHours,
      weekFte: fteFromHours(weekHours),
      isAdmin: user?.role === 'admin',
      canPlan: user?.role === 'admin' || user?.role === 'planner',
      dispatch,
    }),
    [
      state,
      user,
      visibleFarms,
      farm,
      farmCommodities,
      farmActivities,
      recommendation,
      weekHours,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within AppProvider')
  return ctx
}

export const roleLabel: Record<Role, string> = {
  admin: 'System Admin',
  planner: 'Farm Planner',
  manager: 'Site Manager',
}
