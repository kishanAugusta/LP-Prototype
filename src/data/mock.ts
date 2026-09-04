import type {
  Activity,
  ActivityCalibration,
  Cell,
  Commodity,
  DirectoryPerson,
  Farm,
  FarmDaySchedule,
  GreenhouseHouse,
  Guardrails,
  Note,
  PlanningReport,
  ShiftTemplate,
  User,
} from '../types'
import {
  addDays,
  cellKey,
  startOfWeek,
  toISODate,
  weekDates,
  weekKeyFromDate,
} from '../lib/time'

export const ALL_ACTIVITY_IDS = [
  'act-clipping',
  'act-deleafing',
  'act-lowering',
  'act-pruning',
  'act-scouting',
  'act-twisting',
  'act-tearout',
  'act-planting',
]

export const commodities: Commodity[] = [
  { id: 'com-beef', name: 'Beef' },
  { id: 'com-tov', name: 'TOV' },
  { id: 'com-campari', name: 'Campari' },
  { id: 'com-snacks', name: 'Snacks' },
  { id: 'com-strawberry', name: 'Strawberry' },
  { id: 'com-lettuce', name: 'Lettuce' },
  { id: 'com-peppers', name: 'Peppers' },
]

export const activities: Activity[] = [
  { id: 'act-clipping', name: 'Clipping' },
  { id: 'act-deleafing', name: 'Deleafing' },
  { id: 'act-lowering', name: 'Lowering' },
  { id: 'act-pruning', name: 'Pruning' },
  { id: 'act-scouting', name: 'Scouting' },
  { id: 'act-twisting', name: 'Twisting' },
  { id: 'act-tearout', name: 'Tear-out' },
  { id: 'act-planting', name: 'Planting' },
]

export const farms: Farm[] = [
  {
    id: 'farm-north',
    name: 'North Farm',
    commodityIds: ['com-beef', 'com-tov', 'com-campari'],
    activityIds: [...ALL_ACTIVITY_IDS],
  },
  {
    id: 'farm-maroa',
    name: 'Maroa',
    commodityIds: ['com-beef', 'com-tov'],
    activityIds: [...ALL_ACTIVITY_IDS],
  },
  {
    id: 'farm-ohio',
    name: 'Ohio',
    commodityIds: ['com-strawberry'],
    activityIds: [...ALL_ACTIVITY_IDS],
  },
  {
    id: 'farm-richmond',
    name: 'Richmond',
    commodityIds: ['com-campari', 'com-snacks', 'com-tov'],
    activityIds: [...ALL_ACTIVITY_IDS],
  },
  {
    id: 'farm-pepperco',
    name: 'PepperCo',
    commodityIds: ['com-snacks', 'com-tov', 'com-peppers'],
    activityIds: [...ALL_ACTIVITY_IDS],
  },
  {
    id: 'farm-morehead',
    name: 'Morehead',
    commodityIds: ['com-beef', 'com-snacks', 'com-tov'],
    activityIds: [...ALL_ACTIVITY_IDS],
  },
]

export const demoUsers: User[] = [
  {
    id: 'user-admin',
    name: 'Jordan Hale',
    email: 'jordan.hale@mastronardi.com',
    role: 'admin',
    farmIds: farms.map((f) => f.id),
    commodityIds: commodities.map((c) => c.id),
    activityIds: [...ALL_ACTIVITY_IDS],
  },
  {
    id: 'user-planner',
    name: 'Alex Rivera',
    email: 'alex.rivera@mastronardi.com',
    role: 'planner',
    farmIds: ['farm-north', 'farm-maroa', 'farm-ohio'],
    commodityIds: ['com-beef', 'com-tov', 'com-campari', 'com-strawberry'],
    activityIds: [...ALL_ACTIVITY_IDS],
  },
  {
    id: 'user-manager',
    name: 'Sarah Johnson',
    email: 'sarah.j@mastronardi.com',
    role: 'manager',
    farmIds: farms.map((f) => f.id),
    commodityIds: commodities.map((c) => c.id),
    activityIds: [...ALL_ACTIVITY_IDS],
  },
  {
    id: 'user-mike',
    name: 'Mike Peterson',
    email: 'mike.p@mastronardi.com',
    role: 'planner',
    farmIds: ['farm-richmond', 'farm-morehead'],
    commodityIds: ['com-campari', 'com-snacks', 'com-tov', 'com-beef'],
    activityIds: [...ALL_ACTIVITY_IDS],
  },
]

export const directory: DirectoryPerson[] = [
  {
    id: 'ad-1',
    name: 'Priya Nair',
    email: 'priya.nair@mastronardi.com',
    department: 'Farm Operations',
  },
  {
    id: 'ad-2',
    name: 'Luis Ortega',
    email: 'luis.ortega@mastronardi.com',
    department: 'Greenhouse North',
  },
  {
    id: 'ad-3',
    name: 'Emily Chen',
    email: 'emily.chen@mastronardi.com',
    department: 'FarmOps IT',
  },
  {
    id: 'ad-4',
    name: 'David Okonkwo',
    email: 'david.okonkwo@mastronardi.com',
    department: 'Ohio Site',
  },
  {
    id: 'ad-5',
    name: 'Hannah Brooks',
    email: 'hannah.brooks@mastronardi.com',
    department: 'Site Management',
  },
]

export const greenhouseHouses: GreenhouseHouse[] = [
  { id: 'house-mini', name: 'MINI', label: 'Mini house', rows: 42, acres: 4.2 },
  { id: 'house-fred', name: 'FRED', label: 'Fred house', rows: 38, acres: 3.8 },
  { id: 'house-harvest', name: 'HARVEST', label: 'Harvest house', rows: 56, acres: 6.1 },
]

export const seedGuardrails: Guardrails = {
  enabled: true,
  conditions: [
    {
      id: 'gr-slot',
      name: 'Max people per slot',
      metric: 'maxHeadcountPerSlot',
      threshold: 12,
      farmId: 'all',
      activityId: 'all',
      enabled: true,
    },
    {
      id: 'gr-week',
      name: 'Max weekly hours',
      metric: 'maxWeeklyHours',
      threshold: 400,
      farmId: 'all',
      activityId: 'all',
      enabled: true,
    },
    {
      id: 'gr-ot',
      name: 'Overtime FTE warn',
      metric: 'overtimeFteWarn',
      threshold: 1.25,
      farmId: 'all',
      activityId: 'all',
      enabled: true,
    },
  ],
  logicGates: [
    {
      id: 'lg-1',
      code: 'R-01',
      activityId: 'act-twisting',
      requirement: 'before',
      buffer: '1week',
      referenceEvent: 'Removing crop',
    },
    {
      id: 'lg-2',
      code: 'R-02',
      activityId: 'act-tearout',
      requirement: 'before',
      buffer: 'immediately',
      referenceEvent: 'Planting',
    },
    {
      id: 'lg-3',
      code: 'R-03',
      activityId: 'act-scouting',
      requirement: 'after',
      buffer: '1day',
      referenceEvent: 'Deleafing',
    },
  ],
}

export const seedFarmDaySchedules = (farmIds: string[]): FarmDaySchedule[] =>
  farmIds.flatMap((farmId) =>
    Array.from({ length: 7 }, (_, day) => ({
      farmId,
      day,
      work: day >= 1 && day <= 6,
      start: '06:00',
      end: '16:00',
    })),
  )

export const seedCalibrations: ActivityCalibration[] = [
  { activityId: 'act-clipping', minutesPerRow: 8 },
  { activityId: 'act-deleafing', minutesPerRow: 12 },
  { activityId: 'act-lowering', minutesPerRow: 10 },
  { activityId: 'act-pruning', minutesPerRow: 9 },
  { activityId: 'act-scouting', minutesPerRow: 6 },
  { activityId: 'act-twisting', minutesPerRow: 7 },
  { activityId: 'act-tearout', minutesPerRow: 15 },
  { activityId: 'act-planting', minutesPerRow: 11 },
]

export const seedShifts = (): ShiftTemplate[] => [
  { id: 'shift-am', farmId: 'all', name: 'Morning', startSlot: 0, endSlot: 8, defaultHeadcount: 6 },
  { id: 'shift-mid', farmId: 'all', name: 'Midday', startSlot: 8, endSlot: 16, defaultHeadcount: 4 },
  { id: 'shift-pm', farmId: 'all', name: 'Afternoon', startSlot: 16, endSlot: 22, defaultHeadcount: 3 },
]

export const seedReports = (
  farmIds: string[],
  commodityIds: string[],
  activityIds: string[],
): PlanningReport[] => [
  {
    id: 'rep-weekly',
    name: 'Weekly planned hours',
    cadence: 'Weekly',
    enabled: true,
    farmIds,
    commodityIds,
    activityIds,
  },
  {
    id: 'rep-fte',
    name: 'FTE by farm',
    cadence: 'Weekly',
    enabled: true,
    farmIds,
    commodityIds,
    activityIds,
  },
  {
    id: 'rep-pva',
    name: 'Planned vs actual',
    cadence: 'Weekly',
    enabled: true,
    farmIds,
    commodityIds,
    activityIds,
  },
  {
    id: 'rep-harvest',
    name: 'Harvest labor forecast',
    cadence: 'Monthly',
    enabled: false,
    farmIds,
    commodityIds,
    activityIds,
  },
]

export const loginOptions = [
  { userId: 'user-admin', label: 'System Admin (full access)' },
  { userId: 'user-planner', label: 'Farm Planner (assigned farms)' },
  { userId: 'user-manager', label: 'Site Manager (summary only)' },
]

function fillPattern(
  cells: Record<string, Cell>,
  farmId: string,
  houseId: string,
  commodityId: string,
  activityId: string,
  weekStart: Date,
  planner: User,
  base: number,
) {
  for (const day of weekDates(weekStart)) {
    const date = toISODate(day)
    for (let slot = 0; slot < 22; slot++) {
      const hour = 6 + slot * 0.5
      const headcount = hour < 10 ? base : hour < 14 ? Math.max(1, base - 2) : Math.max(1, base - 3)
      cells[cellKey({ farmId, houseId, commodityId, activityId, date, slot })] = {
        headcount,
        plannerId: planner.id,
        plannerName: planner.name,
      }
    }
  }
}

export function seedCells(today = new Date()): Record<string, Cell> {
  const cells: Record<string, Cell> = {}
  const thisMonday = startOfWeek(today)
  const lastMonday = addDays(thisMonday, -7)
  const prevMonday = addDays(thisMonday, -14)
  const alex = demoUsers[1]
  const mike = demoUsers[3]

  // Distinct patterns per house so switching MINI / FRED / HARVEST changes the grid
  fillPattern(cells, 'farm-north', 'house-mini', 'com-beef', 'act-clipping', lastMonday, alex, 6)
  fillPattern(cells, 'farm-north', 'house-fred', 'com-beef', 'act-clipping', lastMonday, alex, 4)
  fillPattern(cells, 'farm-north', 'house-harvest', 'com-beef', 'act-clipping', lastMonday, alex, 8)
  fillPattern(cells, 'farm-north', 'house-mini', 'com-tov', 'act-deleafing', lastMonday, alex, 5)
  fillPattern(cells, 'farm-north', 'house-mini', 'com-beef', 'act-tearout', lastMonday, alex, 7)
  fillPattern(cells, 'farm-north', 'house-fred', 'com-beef', 'act-planting', lastMonday, alex, 3)
  fillPattern(cells, 'farm-maroa', 'house-mini', 'com-beef', 'act-scouting', lastMonday, alex, 3)
  fillPattern(cells, 'farm-ohio', 'house-mini', 'com-strawberry', 'act-pruning', lastMonday, alex, 4)
  fillPattern(cells, 'farm-richmond', 'house-harvest', 'com-campari', 'act-twisting', lastMonday, mike, 7)
  fillPattern(cells, 'farm-north', 'house-mini', 'com-beef', 'act-clipping', prevMonday, alex, 5)
  fillPattern(cells, 'farm-morehead', 'house-fred', 'com-tov', 'act-lowering', lastMonday, mike, 4)
  fillPattern(cells, 'farm-north', 'house-mini', 'com-beef', 'act-clipping', thisMonday, alex, 5)
  fillPattern(cells, 'farm-north', 'house-fred', 'com-beef', 'act-clipping', thisMonday, alex, 3)
  fillPattern(cells, 'farm-north', 'house-harvest', 'com-beef', 'act-clipping', thisMonday, alex, 7)
  fillPattern(cells, 'farm-north', 'house-mini', 'com-beef', 'act-planting', thisMonday, alex, 4)
  fillPattern(cells, 'farm-north', 'house-harvest', 'com-beef', 'act-tearout', thisMonday, alex, 9)
  return cells
}

export function seedNotes(today = new Date()): Note[] {
  const week = weekKeyFromDate(today)
  const last = weekKeyFromDate(addDays(startOfWeek(today), -7))
  return [
    {
      id: 'note-1',
      farmId: 'farm-north',
      commodityId: 'com-beef',
      activityId: 'act-clipping',
      weekKey: last,
      subject: 'Crew availability',
      body: 'Two seasonal workers confirmed for morning clipping. Afternoon remains at baseline.',
      author: 'Alex Rivera',
      timestamp: new Date(today.getTime() - 86400000 * 3).toISOString(),
      kind: 'note',
    },
    {
      id: 'note-2',
      farmId: 'farm-north',
      commodityId: 'com-beef',
      activityId: 'act-clipping',
      weekKey: last,
      subject: 'Schedule submitted',
      body: 'Schedule originally submitted and locked. Variances will be calculated via Priva integration.',
      author: 'System',
      timestamp: new Date(today.getTime() - 86400000 * 2).toISOString(),
      kind: 'audit',
    },
    {
      id: 'note-3',
      farmId: 'farm-ohio',
      commodityId: 'com-strawberry',
      activityId: 'act-pruning',
      weekKey: week,
      subject: 'Weather watch',
      body: 'Humidity spike expected Thursday. Keep scouting overlap if pruning overruns.',
      author: 'Alex Rivera',
      timestamp: new Date(today.getTime() - 3600000 * 6).toISOString(),
      kind: 'note',
    },
  ]
}

export function seedSubmissions(today = new Date()): Record<string, { key: string; submittedAt: string; submittedBy: string }> {
  const last = weekKeyFromDate(addDays(startOfWeek(today), -7))
  const prev = weekKeyFromDate(addDays(startOfWeek(today), -14))
  const at = new Date(today.getTime() - 86400000 * 2).toISOString()
  return {
    [`farm-north|${last}|com-beef|act-clipping`]: {
      key: `farm-north|${last}|com-beef|act-clipping`,
      submittedAt: at,
      submittedBy: 'Alex Rivera',
    },
    [`farm-north|${last}|com-tov|act-deleafing`]: {
      key: `farm-north|${last}|com-tov|act-deleafing`,
      submittedAt: at,
      submittedBy: 'Alex Rivera',
    },
    [`farm-maroa|${last}|com-beef|act-scouting`]: {
      key: `farm-maroa|${last}|com-beef|act-scouting`,
      submittedAt: at,
      submittedBy: 'Alex Rivera',
    },
    [`farm-ohio|${last}|com-strawberry|act-pruning`]: {
      key: `farm-ohio|${last}|com-strawberry|act-pruning`,
      submittedAt: at,
      submittedBy: 'Alex Rivera',
    },
    [`farm-richmond|${last}|com-campari|act-twisting`]: {
      key: `farm-richmond|${last}|com-campari|act-twisting`,
      submittedAt: at,
      submittedBy: 'Mike Peterson',
    },
    [`farm-morehead|${last}|com-tov|act-lowering`]: {
      key: `farm-morehead|${last}|com-tov|act-lowering`,
      submittedAt: at,
      submittedBy: 'Mike Peterson',
    },
    [`farm-north|${prev}|com-beef|act-clipping`]: {
      key: `farm-north|${prev}|com-beef|act-clipping`,
      submittedAt: new Date(today.getTime() - 86400000 * 9).toISOString(),
      submittedBy: 'Alex Rivera',
    },
  }
}
