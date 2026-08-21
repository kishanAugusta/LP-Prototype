import { BarChart3, ClipboardList, Filter } from 'lucide-react'
import { fteFromHours } from '../lib/calc'
import {
  formatWeekRange,
  hoursFromHeadcount,
  monthLabel,
  parseISODate,
  weekDates,
  weekKeyFromDate,
} from '../lib/time'
import { roleLabel, useStore } from '../store/AppContext'
import type { Cell, GroupBy } from '../types'

interface AggRow {
  id: string
  label: string
  hours: number
  activities: Set<string>
  planners: Set<string>
}

function parseKey(key: string) {
  const [farmId, commodityId, activityId, date, slot] = key.split('|')
  return { farmId, commodityId, activityId, date, slot: Number(slot) }
}

export function SummaryTab() {
  const { state, dispatch, visibleFarms, user } = useStore()
  const weekStart = new Date(state.weekStartISO + 'T00:00:00')

  const rows = aggregate(state, visibleFarms.map((f) => f.id))
  const totalHours = rows.reduce((s, r) => s + r.hours, 0)
  const activityCount = new Set(rows.flatMap((r) => [...r.activities])).size
  const fte = fteFromHours(totalHours)

  return (
    <div>
      <section className="mb-6 rounded-[8px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <h2 className="text-sm font-bold text-slate-800">Summary Context & View Options</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="md:col-span-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Time horizon
            </label>
            <div className="mt-1 flex gap-2">
              <select
                value={state.horizon}
                onChange={(e) => dispatch({ type: 'setHorizon', horizon: e.target.value as typeof state.horizon })}
                className="w-1/3 rounded-[8px] border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-brand"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
              <div className="flex flex-1 items-center rounded-[8px] border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                {state.horizon === 'weekly'
                  ? formatWeekRange(weekStart)
                  : state.horizon === 'monthly'
                    ? monthLabel(state.year, state.month)
                    : String(state.year)}
              </div>
            </div>
          </div>
          <Select
            label="Farm"
            value={state.summaryFarmId}
            onChange={(v) => dispatch({ type: 'setSummaryFilter', key: 'farm', value: v })}
            options={[
              { id: 'all', name: 'All farms' },
              ...visibleFarms.map((f) => ({ id: f.id, name: f.name })),
            ]}
          />
          <Select
            label="Commodity"
            value={state.summaryCommodityId}
            onChange={(v) => dispatch({ type: 'setSummaryFilter', key: 'commodity', value: v })}
            options={[{ id: 'all', name: 'All commodities' }, ...state.commodities]}
          />
          <Select
            label="Activity"
            value={state.summaryActivityId}
            onChange={(v) => dispatch({ type: 'setSummaryFilter', key: 'activity', value: v })}
            options={[{ id: 'all', name: 'All activities' }, ...state.activities]}
          />
          <Select
            label="Planner"
            value={state.summaryPlannerId}
            onChange={(v) => dispatch({ type: 'setSummaryFilter', key: 'planner', value: v })}
            options={[
              { id: 'all', name: 'All planners' },
              ...state.users
                .filter((u) => u.role !== 'manager')
                .map((u) => ({ id: u.id, name: u.name })),
            ]}
          />
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Group by</label>
            <select
              value={state.groupBy}
              onChange={(e) => dispatch({ type: 'setGroupBy', groupBy: e.target.value as GroupBy })}
              className="mt-1 w-full rounded-[8px] border border-slate-300 bg-blue-50 px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-1 focus:ring-brand"
            >
              <option value="farm">Farm</option>
              <option value="commodity">Commodity</option>
              <option value="activity">Activity</option>
              <option value="planner">Planner</option>
              <option value="horizon">Horizon / week</option>
            </select>
          </div>
        </div>
      </section>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Kpi label="Total planned hours" value={totalHours.toFixed(1)} hint="30-minute slot rollup" />
        <Kpi label="FTE (÷ 40 hrs)" value={fte.toFixed(2)} hint="Full-time equivalent" />
        <Kpi label="Unique activities" value={String(activityCount)} hint="In the current filter set" />
      </div>

      <section className="mb-6 overflow-hidden rounded-[8px] border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800">
            Planned labour by {state.groupBy}
          </h3>
          <button
            type="button"
            onClick={() => dispatch({ type: 'toggleNotes', open: true })}
            className="flex items-center gap-2 rounded-[8px] border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            <ClipboardList className="h-4 w-4 text-brand" />
            View Notes
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="p-4">Group</th>
                <th className="p-4">Planned hours</th>
                <th className="p-4">FTE</th>
                <th className="p-4">Activities</th>
                <th className="p-4">Planners</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-500">
                    No planned hours for this filter combination.
                  </td>
                </tr>
              )}
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="p-4 font-bold text-slate-800">{row.label}</td>
                  <td className="p-4 font-semibold">{row.hours.toFixed(1)}</td>
                  <td className="p-4">{fteFromHours(row.hours).toFixed(2)}</td>
                  <td className="p-4">{row.activities.size}</td>
                  <td className="p-4 text-slate-600">{[...row.planners].join(', ') || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <PowerBI hoursByGroup={rows} />
      <p className="mt-3 text-[11px] text-slate-400">
        Signed in as {user?.name} ({user ? roleLabel[user.role] : ''}). Advanced planned vs actual
        analytics are embedded from Power BI; values below are prototype visuals on the same planned
        data.
      </p>
    </div>
  )
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { id: string; name: string }[]
}) {
  return (
    <div>
      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-[8px] border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-brand"
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
    </div>
  )
}

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-[8px] border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-3xl font-extrabold text-slate-800">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </div>
  )
}

function PowerBI({ hoursByGroup }: { hoursByGroup: AggRow[] }) {
  const max = Math.max(1, ...hoursByGroup.map((r) => r.hours))
  return (
    <section className="rounded-[8px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded bg-[#F2C811] p-1.5">
          <BarChart3 className="h-4 w-4 text-slate-900" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800">Power BI · Planned vs Actual</h3>
          <p className="text-xs text-slate-500">Embedded report surface (prototype visual on planned data)</p>
        </div>
      </div>
      <div className="space-y-3">
        {hoursByGroup.slice(0, 8).map((row) => {
          const actual = row.hours * 0.91
          return (
            <div key={row.id}>
              <div className="mb-1 flex justify-between text-[11px] font-bold">
                <span className="text-slate-700">{row.label}</span>
                <span className="text-slate-500">
                  P {row.hours.toFixed(0)} · A {actual.toFixed(0)} · var{' '}
                  {(((actual - row.hours) / Math.max(row.hours, 1)) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex h-3 overflow-hidden rounded bg-slate-100">
                <div className="bg-brand" style={{ width: `${(row.hours / max) * 100}%` }} />
              </div>
              <div className="mt-1 flex h-2 overflow-hidden rounded bg-slate-100">
                <div className="bg-sunset" style={{ width: `${(actual / max) * 100}%` }} />
              </div>
            </div>
          )
        })}
        {hoursByGroup.length === 0 && (
          <p className="text-sm text-slate-500">Submit a schedule to populate the embedded visual.</p>
        )}
      </div>
      <div className="mt-4 flex gap-4 text-[10px] font-bold uppercase tracking-wide text-slate-500">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-4 rounded bg-brand" /> Planned
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-4 rounded bg-sunset" /> Actual (Priva / Hortimax)
        </span>
      </div>
    </section>
  )
}

function aggregate(
  state: ReturnType<typeof useStore>['state'],
  farmScope: string[],
): AggRow[] {
  const map = new Map<string, AggRow>()
  const weekDatesSet = new Set(
    weekDates(new Date(state.weekStartISO + 'T00:00:00')).map((d) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
    ),
  )

  function includeDate(dateISO: string) {
    const d = parseISODate(dateISO)
    if (state.horizon === 'yearly') return d.getFullYear() === state.year
    if (state.horizon === 'monthly') return d.getFullYear() === state.year && d.getMonth() === state.month
    return weekDatesSet.has(dateISO)
  }

  for (const [key, cell] of Object.entries(state.cells) as [string, Cell][]) {
    const p = parseKey(key)
    if (!farmScope.includes(p.farmId)) continue
    if (!includeDate(p.date)) continue
    if (state.summaryFarmId !== 'all' && p.farmId !== state.summaryFarmId) continue
    if (state.summaryCommodityId !== 'all' && p.commodityId !== state.summaryCommodityId) continue
    if (state.summaryActivityId !== 'all' && p.activityId !== state.summaryActivityId) continue
    if (state.summaryPlannerId !== 'all' && cell.plannerId !== state.summaryPlannerId) continue

    const farmName = state.farms.find((f) => f.id === p.farmId)?.name ?? p.farmId
    const comName = state.commodities.find((c) => c.id === p.commodityId)?.name ?? p.commodityId
    const actName = state.activities.find((a) => a.id === p.activityId)?.name ?? p.activityId
    const weekKey = weekKeyFromDate(parseISODate(p.date))

    let id = farmName
    let label = farmName
    if (state.groupBy === 'commodity') {
      id = p.commodityId
      label = comName
    } else if (state.groupBy === 'activity') {
      id = p.activityId
      label = actName
    } else if (state.groupBy === 'planner') {
      id = cell.plannerId
      label = cell.plannerName
    } else if (state.groupBy === 'horizon') {
      id = weekKey
      label = weekKey
    } else {
      id = p.farmId
      label = farmName
    }

    const row = map.get(id) ?? {
      id,
      label,
      hours: 0,
      activities: new Set<string>(),
      planners: new Set<string>(),
    }
    row.hours += hoursFromHeadcount(cell.headcount)
    row.activities.add(p.activityId)
    row.planners.add(cell.plannerName)
    map.set(id, row)
  }

  return [...map.values()].sort((a, b) => b.hours - a.hours)
}
