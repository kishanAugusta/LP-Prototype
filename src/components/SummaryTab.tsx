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
      <div className="mb-5">
        <p className="lp-kicker">Summary</p>
        <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-ink">Planned labour overview</h2>
      </div>
      <section className="lp-panel mb-6 p-6">
        <div className="mb-4 flex items-center gap-2">
          <Filter className="h-4 w-4 text-teal" />
          <h2 className="text-sm font-bold text-ink">Summary Context & View Options</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="md:col-span-2">
            <label className="lp-label">Time horizon</label>
            <div className="mt-1 flex flex-wrap gap-2">
              <select
                value={state.horizon}
                onChange={(e) => dispatch({ type: 'setHorizon', horizon: e.target.value as typeof state.horizon })}
                className="lp-select min-w-[8rem] px-3 py-2 text-sm"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
              {state.horizon === 'weekly' && (
                <div className="flex flex-1 items-center gap-2 rounded-[8px] border border-line bg-mist px-3 py-2 text-sm font-semibold text-ink">
                  {formatWeekRange(weekStart)}
                </div>
              )}
              {state.horizon === 'monthly' && (
                <>
                  <select
                    value={state.month}
                    onChange={(e) =>
                      dispatch({ type: 'setMonth', year: state.year, month: Number(e.target.value) })
                    }
                    className="lp-select px-3 py-2 text-sm"
                  >
                    {Array.from({ length: 12 }, (_, m) => (
                      <option key={m} value={m}>
                        {monthLabel(state.year, m).split(' ')[0]}
                      </option>
                    ))}
                  </select>
                  <select
                    value={state.year}
                    onChange={(e) => dispatch({ type: 'setYear', year: Number(e.target.value) })}
                    className="lp-select px-3 py-2 text-sm"
                  >
                    {[2025, 2026, 2027].map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </>
              )}
              {state.horizon === 'yearly' && (
                <select
                  value={state.year}
                  onChange={(e) => dispatch({ type: 'setYear', year: Number(e.target.value) })}
                  className="lp-select px-3 py-2 text-sm"
                >
                  {[2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              )}
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
          <div className="rounded-[8px] border-2 border-brand/40 bg-green-50 p-2">
            <label className="lp-label text-brand">Group by</label>
            <select
              value={state.groupBy}
              onChange={(e) => dispatch({ type: 'setGroupBy', groupBy: e.target.value as GroupBy })}
              className="lp-select mt-1 w-full border-brand px-3 py-2 text-sm font-bold text-ink"
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

      <section className="lp-panel mb-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-line bg-mist p-4">
          <h3 className="text-sm font-bold tracking-wide text-ink uppercase">
            Planned labour by {state.groupBy}
          </h3>
          <button
            type="button"
            onClick={() => dispatch({ type: 'toggleNotes', open: true })}
            className="lp-btn-ghost flex items-center gap-2 px-3 py-1.5 text-xs"
          >
            <ClipboardList className="h-4 w-4 text-brand" />
            View Notes
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-line text-slate-500 uppercase tracking-wider">
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
                <tr key={row.id} className="hover:bg-mist">
                  <td className="p-4 font-bold text-ink">{row.label}</td>
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

      <AllocationChart rows={rows} groupBy={state.groupBy} />
      <PowerBI hoursByGroup={rows} />
      <p className="mt-3 text-[11px] text-slate-400">
        Signed in as {user?.name} ({user ? roleLabel[user.role] : ''}). Advanced planned vs actual
        analytics are embedded from Power BI; values below are prototype visuals on the same planned
        data.
      </p>
    </div>
  )
}

function AllocationChart({ rows, groupBy }: { rows: AggRow[]; groupBy: GroupBy }) {
  const total = rows.reduce((s, r) => s + r.hours, 0)
  const slices = pieSlices(rows, total)
  return (
    <section className="lp-panel mb-6 p-6">
      <h3 className="text-sm font-bold text-ink">Planned hours allocation</h3>
      <p className="mb-4 text-xs text-slate-500">Share of planned hours by {groupBy}.</p>
      {rows.length === 0 && (
        <p className="text-sm text-slate-500">No planned hours for this filter combination.</p>
      )}
      {rows.length > 0 && (
        <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
          <svg viewBox="0 0 220 220" className="h-56 w-56 shrink-0">
            {slices.map((slice) => (
              <path key={slice.id} d={slice.d} fill={slice.color} stroke="#fff" strokeWidth="1.5">
                <title>
                  {slice.label}: {slice.hours.toFixed(1)} hrs ({slice.pct.toFixed(0)}%)
                </title>
              </path>
            ))}
          </svg>
          <ul className="w-full space-y-2">
            {slices.map((slice) => (
              <li key={slice.id} className="flex items-center justify-between gap-3 text-xs">
                <span className="flex min-w-0 items-center gap-2 font-bold text-ink">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: slice.color }} />
                  <span className="truncate">{slice.label}</span>
                </span>
                <span className="shrink-0 text-slate-500">
                  {slice.hours.toFixed(1)} hrs · {slice.pct.toFixed(0)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
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
      <label className="lp-label">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="lp-select mt-1 w-full px-3 py-2 text-sm"
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
    <div className="lp-panel p-5">
      <p className="lp-label">{label}</p>
      <p className="mt-1 text-3xl font-extrabold text-ink">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </div>
  )
}

function PowerBI({ hoursByGroup }: { hoursByGroup: AggRow[] }) {
  const data = hoursByGroup.slice(0, 8).map((row) => ({
    ...row,
    actual: row.hours * 0.91,
  }))
  const max = Math.max(1, ...data.flatMap((r) => [r.hours, r.actual]))
  const w = 640
  const h = 220
  const pad = { t: 16, r: 12, b: 48, l: 36 }
  const innerW = w - pad.l - pad.r
  const innerH = h - pad.t - pad.b
  const groupW = data.length > 0 ? innerW / data.length : innerW
  const barW = Math.min(22, groupW * 0.32)

  return (
    <section className="lp-panel p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-[8px] bg-[#F2C811] p-1.5">
          <BarChart3 className="h-4 w-4 text-slate-900" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-ink">Power BI · Planned vs Actual</h3>
          <p className="text-xs text-slate-500">Embedded report surface (prototype visual on planned data)</p>
        </div>
      </div>
      {data.length === 0 && (
        <p className="text-sm text-slate-500">Submit a schedule to populate the embedded visual.</p>
      )}
      {data.length > 0 && (
        <div className="overflow-x-auto">
          <svg viewBox={`0 0 ${w} ${h}`} className="min-w-[520px] w-full">
            {[0, 0.25, 0.5, 0.75, 1].map((t) => {
              const y = pad.t + innerH * (1 - t)
              return (
                <g key={t}>
                  <line x1={pad.l} x2={w - pad.r} y1={y} y2={y} stroke="#d4e2d8" strokeWidth="1" />
                  <text x={pad.l - 6} y={y + 3} textAnchor="end" fontSize="9" fill="#5c7464">
                    {Math.round(max * t)}
                  </text>
                </g>
              )
            })}
            {data.map((row, i) => {
              const cx = pad.l + i * groupW + groupW / 2
              const plannedH = (row.hours / max) * innerH
              const actualH = (row.actual / max) * innerH
              return (
                <g key={row.id}>
                  <rect
                    x={cx - barW - 2}
                    y={pad.t + innerH - plannedH}
                    width={barW}
                    height={plannedH}
                    rx="3"
                    fill="#00a63f"
                  >
                    <title>
                      {row.label} planned {row.hours.toFixed(1)} hrs
                    </title>
                  </rect>
                  <rect
                    x={cx + 2}
                    y={pad.t + innerH - actualH}
                    width={barW}
                    height={actualH}
                    rx="3"
                    fill="#ea580c"
                  >
                    <title>
                      {row.label} actual {row.actual.toFixed(1)} hrs
                    </title>
                  </rect>
                  <text
                    x={cx}
                    y={h - 16}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="700"
                    fill="#14261f"
                  >
                    {row.label.length > 12 ? `${row.label.slice(0, 11)}…` : row.label}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      )}
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

const PIE_COLORS = ['#16382d', '#00a63f', '#0f766e', '#ea580c', '#3f7d5a', '#7c9a84', '#c45c26', '#4ade80']

function pieSlices(rows: AggRow[], total: number) {
  const cx = 110
  const cy = 110
  const r = 96
  let angle = -90
  return rows.map((row, i) => {
    const pct = total > 0 ? (row.hours / total) * 100 : 0
    const sweep = total > 0 ? (row.hours / total) * 360 : 0
    const start = angle
    const end = angle + sweep
    angle = end
    return {
      id: row.id,
      label: row.label,
      hours: row.hours,
      pct,
      color: PIE_COLORS[i % PIE_COLORS.length],
      d: donutSlice(cx, cy, r, start, end),
    }
  })
}

function donutSlice(cx: number, cy: number, r: number, start: number, end: number) {
  if (end - start >= 359.99) {
    return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`
  }
  const [x1, y1] = polar(cx, cy, r, start)
  const [x2, y2] = polar(cx, cy, r, end)
  const large = end - start > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`
}

function polar(cx: number, cy: number, r: number, angle: number): [number, number] {
  const a = (angle * Math.PI) / 180
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)]
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
