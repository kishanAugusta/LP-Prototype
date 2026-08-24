import {
  ClipboardList,
  Clock3,
  Filter,
  Layers3,
  Users,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { fteFromHours } from '../lib/calc'
import {
  formatWeekRange,
  hoursFromHeadcount,
  isoWeek,
  monthLabel,
  parseISODate,
  toISODate,
  weekDates,
  weekKeyFromDate,
  weeksInYear,
} from '../lib/time'
import { roleLabel, useStore } from '../store/AppContext'
import type { Cell, GroupBy } from '../types'
import { Accordion } from './Accordion'

interface DetailRow {
  id: string
  period: string
  farm: string
  commodity: string
  activity: string
  activityId: string
  planner: string
  planned: number
  actual: number
}

interface AggRow {
  id: string
  label: string
  hours: number
}

function parseKey(key: string) {
  const parts = key.split('|')
  if (parts.length >= 6) {
    const [farmId, houseId, commodityId, activityId, date, slot] = parts
    return { farmId, houseId, commodityId, activityId, date, slot: Number(slot) }
  }
  const [farmId, commodityId, activityId, date, slot] = parts
  return { farmId, houseId: 'house-mini', commodityId, activityId, date, slot: Number(slot) }
}

export function SummaryTab() {
  const { state, dispatch, visibleFarms, user } = useStore()
  const [analyticsOpen, setAnalyticsOpen] = useState(false)
  const weekStart = new Date(state.weekStartISO + 'T00:00:00')
  const yearWeeks = weeksInYear(state.year)
  const details = detailRows(state, visibleFarms.map((f) => f.id))
  const chartFarm = aggregateBy(details, 'farm')
  const chartCommodity = aggregateBy(details, 'commodity')
  const totalHours = details.reduce((s, r) => s + r.planned, 0)
  const activityCount = new Set(details.map((r) => r.activityId)).size
  const fte = fteFromHours(totalHours)
  const tableRows =
    state.groupBy === 'detailed'
      ? details
      : rollupDetails(details, state.groupBy).map((r) => ({
          id: r.id,
          period: '—',
          farm: state.groupBy === 'farm' ? r.label : '—',
          commodity: state.groupBy === 'commodity' ? r.label : '—',
          activity: state.groupBy === 'activity' ? r.label : '—',
          activityId: r.id,
          planner: state.groupBy === 'planner' ? r.label : '—',
          planned: r.hours,
          actual: r.hours * 0.91,
        }))

  return (
    <div className="lp-workspace lp-page flex flex-1 flex-col">
      <div className="lp-sticky-bar">
        <div className="mb-2 flex items-center gap-2">
          <Filter className="h-4 w-4 text-teal" />
          <div>
            <p className="lp-kicker">Summary</p>
            <h2 className="text-lg font-extrabold tracking-tight text-ink">Planned labour overview</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
          <div className="col-span-2">
            <label className="lp-label">Time horizon</label>
            <div className="mt-0.5 flex flex-wrap gap-1.5">
              <select
                value={state.horizon}
                onChange={(e) =>
                  dispatch({ type: 'setHorizon', horizon: e.target.value as typeof state.horizon })
                }
                className="lp-select min-w-[7.5rem] px-2 py-1.5 text-sm"
              >
                <option value="weekly">Weekly View</option>
                <option value="monthly">Monthly View</option>
                <option value="yearly">Yearly View</option>
              </select>
              {state.horizon === 'weekly' && (
                <select
                  value={state.weekStartISO}
                  onChange={(e) => dispatch({ type: 'setWeek', iso: e.target.value })}
                  className="lp-select px-2 py-1.5 text-sm"
                >
                  {yearWeeks.map((w) => {
                    const iso = toISODate(w)
                    const { week } = isoWeek(w)
                    return (
                      <option key={iso} value={iso}>
                        Week {week}
                      </option>
                    )
                  })}
                </select>
              )}
              {state.horizon === 'monthly' && (
                <select
                  value={state.month}
                  onChange={(e) =>
                    dispatch({ type: 'setMonth', year: state.year, month: Number(e.target.value) })
                  }
                  className="lp-select px-2 py-1.5 text-sm"
                >
                  {Array.from({ length: 12 }, (_, m) => (
                    <option key={m} value={m}>
                      {monthLabel(state.year, m).split(' ')[0]}
                    </option>
                  ))}
                </select>
              )}
              <select
                value={state.year}
                onChange={(e) => dispatch({ type: 'setYear', year: Number(e.target.value) })}
                className="lp-select px-2 py-1.5 text-sm"
                aria-label="Year"
              >
                {[2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Select
            label="Farm scope"
            value={state.summaryFarmId}
            onChange={(v) => dispatch({ type: 'setSummaryFilter', key: 'farm', value: v })}
            options={[
              { id: 'all', name: 'All Farms' },
              ...visibleFarms.map((f) => ({ id: f.id, name: f.name })),
            ]}
          />
          <Select
            label="Commodity"
            value={state.summaryCommodityId}
            onChange={(v) => dispatch({ type: 'setSummaryFilter', key: 'commodity', value: v })}
            options={[{ id: 'all', name: 'All Commodities' }, ...state.commodities]}
          />
          <Select
            label="Activity"
            value={state.summaryActivityId}
            onChange={(v) => dispatch({ type: 'setSummaryFilter', key: 'activity', value: v })}
            options={[{ id: 'all', name: 'All Activities' }, ...state.activities]}
          />
          <Select
            label="Planner"
            value={state.summaryPlannerId}
            onChange={(v) => dispatch({ type: 'setSummaryFilter', key: 'planner', value: v })}
            options={[
              { id: 'all', name: 'All Planners' },
              ...state.users
                .filter((u) => u.role !== 'manager')
                .map((u) => ({ id: u.id, name: u.name })),
            ]}
          />
          <div className="col-span-2 rounded-[12px] border border-brand/30 bg-gradient-to-br from-brand/8 to-teal/5 p-2 lg:col-span-2">
            <label className="lp-label text-brand">Group table by</label>
            <select
              value={state.groupBy}
              onChange={(e) => dispatch({ type: 'setGroupBy', groupBy: e.target.value as GroupBy })}
              className="lp-select mt-0.5 w-full border-brand/40 px-2 py-1.5 text-sm font-bold text-ink"
            >
              <option value="detailed">Detailed View (No Grouping)</option>
              <option value="farm">Farm</option>
              <option value="commodity">Commodity</option>
              <option value="activity">Activity</option>
              <option value="planner">Planner</option>
              <option value="horizon">Horizon / week</option>
            </select>
          </div>
        </div>
        {state.horizon === 'weekly' && (
          <p className="mt-1.5 text-[11px] text-slate-500">{formatWeekRange(weekStart)}</p>
        )}
      </div>

      <div className="mb-2 grid grid-cols-1 gap-2 md:grid-cols-3">
        <Kpi
          label="FTE (Equivalent)"
          value={fte.toFixed(2)}
          hint="Full-time equivalent"
          icon={<Users className="h-4 w-4 text-brand" />}
        />
        <Kpi
          label="Total Planned Hours"
          value={String(Math.round(totalHours))}
          hint="Filtered slot rollup"
          icon={<Clock3 className="h-4 w-4 text-sky-600" />}
        />
        <Kpi
          label="Unique Activities"
          value={String(activityCount)}
          hint="In the current filter set"
          icon={<Layers3 className="h-4 w-4 text-teal" />}
        />
      </div>

      <section className="lp-panel mb-2 min-h-0 flex-1 overflow-hidden">
        <div className="flex items-center justify-between border-b border-line bg-gradient-to-r from-mist to-white px-3 py-2.5">
          <h3 className="text-xs font-bold tracking-wide text-ink uppercase">
            Aggregated Schedule Overview
          </h3>
          <button
            type="button"
            onClick={() => dispatch({ type: 'toggleNotes', open: true })}
            className="lp-btn-ghost flex items-center gap-2 px-2.5 py-1 text-xs"
          >
            <ClipboardList className="h-3.5 w-3.5 text-brand" />
            View Notes
          </button>
        </div>
        <div className="custom-scroll max-h-[min(52vh,480px)] overflow-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 z-[1] border-b border-line bg-[#f7fbf8] text-[10px] text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="p-2.5 font-bold">Period</th>
                <th className="p-2.5 font-bold">Farm</th>
                <th className="p-2.5 font-bold">Commodity</th>
                <th className="p-2.5 font-bold">Activity</th>
                <th className="p-2.5 font-bold">Planner</th>
                <th className="p-2.5 text-right font-bold">Planned Hrs</th>
                <th className="p-2.5 text-right font-bold">Actual Hrs</th>
                <th className="p-2.5 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tableRows.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No planned hours for this filter combination.
                  </td>
                </tr>
              )}
              {tableRows.map((row) => {
                const over = row.actual > row.planned
                return (
                  <tr key={row.id} className="transition-colors hover:bg-mist/80">
                    <td className="p-2.5 font-semibold text-ink">{row.period}</td>
                    <td className="p-2.5">{row.farm}</td>
                    <td className="p-2.5">{row.commodity}</td>
                    <td className="p-2.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          row.activity.toLowerCase().includes('deleaf')
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-sky-100 text-sky-700'
                        }`}
                      >
                        {row.activity}
                      </span>
                    </td>
                    <td className="p-2.5 text-slate-600">{row.planner}</td>
                    <td className="p-2.5 text-right font-bold tabular-nums">{Math.round(row.planned)}</td>
                    <td
                      className={`p-2.5 text-right font-bold tabular-nums ${
                        over ? 'text-rose-600' : 'text-ink'
                      }`}
                    >
                      {Math.round(row.actual)}
                    </td>
                    <td className="p-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => dispatch({ type: 'toggleNotes', open: true })}
                        className="rounded bg-sky-50 px-2 py-1 text-[10px] font-bold text-sky-700 hover:bg-sky-100"
                      >
                        @ Notes
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <Accordion
        id="summary-analytics"
        title="Analytics · Planned vs Actual (Power BI)"
        open={analyticsOpen}
        onToggle={() => setAnalyticsOpen((v) => !v)}
        badge={
          <span className="rounded bg-[#F2C811] px-1.5 py-0.5 text-[9px] font-extrabold text-slate-900 normal-case tracking-normal">
            Embedded
          </span>
        }
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-bold text-slate-500">Planned vs Actual Hours by Farm</p>
            <BarChart data={chartFarm} />
          </div>
          <div>
            <p className="mb-2 text-xs font-bold text-slate-500">Planned Hours Allocation</p>
            <DonutChart rows={chartCommodity} />
          </div>
        </div>
      </Accordion>

      <p className="mt-1 text-[11px] text-slate-400">
        Signed in as {user?.name} ({user ? roleLabel[user.role] : ''}). Actual hours are prototype
        estimates for Power BI embedding demos.
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

function Kpi({
  label,
  value,
  hint,
  icon,
}: {
  label: string
  value: string
  hint: string
  icon: ReactNode
}) {
  return (
    <div className="lp-panel flex items-center gap-3 px-3.5 py-3 transition hover:-translate-y-0.5 hover:shadow-md hover:shadow-navy/5">
      <div className="rounded-[10px] bg-gradient-to-br from-mist to-brand/10 p-2 ring-1 ring-line">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="lp-label">{label}</p>
        <p className="text-2xl font-extrabold tracking-tight text-ink tabular-nums">{value}</p>
        <p className="truncate text-[10px] text-slate-500">{hint}</p>
      </div>
    </div>
  )
}

function BarChart({ data }: { data: AggRow[] }) {
  const rows = data.slice(0, 6).map((r) => ({ ...r, actual: r.hours * 0.88 }))
  const max = Math.max(1, ...rows.flatMap((r) => [r.hours, r.actual]))
  if (rows.length === 0) {
    return <p className="text-sm text-slate-500">Submit schedules to populate this chart.</p>
  }
  return (
    <div>
      <div className="flex h-44 items-end gap-3 border-b border-line pb-1">
        {rows.map((r) => (
          <div key={r.id} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex h-36 w-full items-end justify-center gap-1">
              <div
                className="w-3 rounded-t bg-brand"
                style={{ height: `${(r.hours / max) * 100}%` }}
                title={`Planned ${r.hours.toFixed(0)}`}
              />
              <div
                className="w-3 rounded-t bg-slate-300"
                style={{ height: `${(r.actual / max) * 100}%` }}
                title={`Actual ${r.actual.toFixed(0)}`}
              />
            </div>
            <span className="max-w-full truncate text-[9px] font-bold text-slate-500">{r.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-3 text-[10px] font-bold text-slate-500">
        <span className="flex items-center gap-1">
          <span className="h-2 w-3 rounded bg-brand" /> Planned
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-3 rounded bg-slate-300" /> Actual
        </span>
      </div>
    </div>
  )
}

function DonutChart({ rows }: { rows: AggRow[] }) {
  const total = rows.reduce((s, r) => s + r.hours, 0)
  const slices = pieSlices(rows, total)
  if (rows.length === 0) {
    return <p className="text-sm text-slate-500">No allocation data for this filter.</p>
  }
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      <svg viewBox="0 0 220 220" className="h-44 w-44 shrink-0">
        <circle cx="110" cy="110" r="48" fill="#fff" />
        {slices.map((slice) => (
          <path key={slice.id} d={slice.d} fill={slice.color} stroke="#fff" strokeWidth="2">
            <title>
              {slice.label}: {slice.hours.toFixed(0)} hrs
            </title>
          </path>
        ))}
      </svg>
      <ul className="w-full space-y-1.5">
        {slices.slice(0, 8).map((slice) => (
          <li key={slice.id} className="flex items-center justify-between gap-2 text-[11px]">
            <span className="flex min-w-0 items-center gap-2 font-bold text-ink">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: slice.color }} />
              <span className="truncate">{slice.label}</span>
            </span>
            <span className="text-slate-500">{slice.pct.toFixed(0)}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

const PIE_COLORS = ['#16382d', '#00a63f', '#0f766e', '#ea580c', '#3f7d5a', '#7c9a84', '#c45c26', '#4ade80']

function pieSlices(rows: AggRow[], total: number) {
  const cx = 110
  const cy = 110
  const r = 96
  const inner = 48
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
      d: donutRing(cx, cy, r, inner, start, end),
    }
  })
}

function donutRing(
  cx: number,
  cy: number,
  r: number,
  inner: number,
  start: number,
  end: number,
) {
  if (end - start >= 359.99) {
    return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} L ${cx - 0.01} ${cy - inner} A ${inner} ${inner} 0 1 0 ${cx} ${cy - inner} Z`
  }
  const [x1, y1] = polar(cx, cy, r, start)
  const [x2, y2] = polar(cx, cy, r, end)
  const [x3, y3] = polar(cx, cy, inner, end)
  const [x4, y4] = polar(cx, cy, inner, start)
  const large = end - start > 180 ? 1 : 0
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${inner} ${inner} 0 ${large} 0 ${x4} ${y4} Z`
}

function polar(cx: number, cy: number, r: number, angle: number): [number, number] {
  const a = (angle * Math.PI) / 180
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)]
}

function detailRows(
  state: ReturnType<typeof useStore>['state'],
  farmScope: string[],
): DetailRow[] {
  const map = new Map<string, DetailRow>()
  const weekDatesSet = new Set(
    weekDates(new Date(state.weekStartISO + 'T00:00:00')).map((d) => toISODate(d)),
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

    const farm = state.farms.find((f) => f.id === p.farmId)?.name ?? p.farmId
    const commodity = state.commodities.find((c) => c.id === p.commodityId)?.name ?? p.commodityId
    const activity = state.activities.find((a) => a.id === p.activityId)?.name ?? p.activityId
    const { week, year } = isoWeek(parseISODate(p.date))
    const period = `Wk ${week}, ${year}`
    const id = `${p.farmId}|${p.commodityId}|${p.activityId}|${cell.plannerId}|${weekKeyFromDate(parseISODate(p.date))}`
    const row =
      map.get(id) ??
      ({
        id,
        period,
        farm,
        commodity,
        activity,
        activityId: p.activityId,
        planner: cell.plannerName,
        planned: 0,
        actual: 0,
      } satisfies DetailRow)
    row.planned += hoursFromHeadcount(cell.headcount)
    map.set(id, row)
  }

  return [...map.values()]
    .map((r) => ({ ...r, actual: r.planned * (0.85 + ((r.activityId.length * 7) % 20) / 100) }))
    .sort((a, b) => b.planned - a.planned)
}

function aggregateBy(details: DetailRow[], key: 'farm' | 'commodity'): AggRow[] {
  const map = new Map<string, AggRow>()
  for (const row of details) {
    const label = key === 'farm' ? row.farm : row.commodity
    const cur = map.get(label) ?? { id: label, label, hours: 0 }
    cur.hours += row.planned
    map.set(label, cur)
  }
  return [...map.values()].sort((a, b) => b.hours - a.hours)
}

function rollupDetails(details: DetailRow[], groupBy: GroupBy): AggRow[] {
  const map = new Map<string, AggRow>()
  for (const row of details) {
    let id = row.farm
    let label = row.farm
    if (groupBy === 'commodity') {
      id = row.commodity
      label = row.commodity
    } else if (groupBy === 'activity') {
      id = row.activityId
      label = row.activity
    } else if (groupBy === 'planner') {
      id = row.planner
      label = row.planner
    } else if (groupBy === 'horizon') {
      id = row.period
      label = row.period
    }
    const cur = map.get(id) ?? { id, label, hours: 0 }
    cur.hours += row.planned
    map.set(id, cur)
  }
  return [...map.values()].sort((a, b) => b.hours - a.hours)
}
