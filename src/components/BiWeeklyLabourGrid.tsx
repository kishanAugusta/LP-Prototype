import { useState } from 'react'
import { ChevronRight, Layers } from 'lucide-react'
import {
  biWeekDates,
  hoursFromHeadcount,
  isPastDay,
  SLOT_COUNT,
  SLOT_LABELS,
  toISODate,
} from '../lib/time'
import { useStore } from '../store/AppContext'

/** Labour activities shown in the bi-weekly planner (excludes tear-out / planting). */
const LABOUR_ACTIVITY_IDS = [
  'act-clipping',
  'act-deleafing',
  'act-lowering',
  'act-pruning',
  'act-scouting',
  'act-twisting',
]

export function BiWeeklyLabourGrid() {
  const { state, dispatch, farmActivities, canPlan } = useStore()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const weekStart = new Date(state.weekStartISO + 'T00:00:00')
  const dates = biWeekDates(weekStart)
  const activities = farmActivities.filter((a) => LABOUR_ACTIVITY_IDS.includes(a.id))

  function dayHours(activityId: string, date: string): number {
    let hours = 0
    for (let slot = 0; slot < SLOT_COUNT; slot++) {
      const key = `${state.farmId}|${state.houseId}|${state.commodityId}|${activityId}|${date}|${slot}`
      hours += hoursFromHeadcount(state.cells[key]?.headcount ?? 0)
    }
    return hours
  }

  function paint(activityId: string, date: string, slot: number) {
    if (!canPlan || isPastDay(date)) return
    dispatch({ type: 'fillCells', dates: [date], slots: [slot], activityId })
  }

  const dayTotals = dates.map((d) => {
    const date = toISODate(d)
    return activities.reduce((sum, a) => sum + dayHours(a.id, date), 0)
  })
  const grand = dayTotals.reduce((a, b) => a + b, 0)

  return (
    <section className="lp-panel mb-0 p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs font-semibold text-slate-500">People</label>
          <input
            type="text"
            inputMode="numeric"
            value={String(state.people)}
            disabled={!canPlan}
            onChange={(e) => {
              const v = e.target.value
              if (v === '') {
                dispatch({ type: 'setPeople', people: 0 })
                return
              }
              if (!/^\d+$/.test(v)) return
              dispatch({ type: 'setPeople', people: Number(v) })
            }}
            className="lp-input w-14 px-2 py-1 text-sm"
          />
          <span className="text-[11px] text-slate-500">Expand an activity to paint slots.</span>
        </div>
        <span className="rounded-[8px] bg-navy px-2.5 py-1 text-[10px] font-bold text-white">
          Bi-Weekly 14-Day
        </span>
      </div>

      <div className="custom-scroll max-h-[min(58vh,520px)] overflow-auto rounded-[8px] border border-line">
        <table className="w-full min-w-[980px] border-collapse text-[11px]">
          <thead className="sticky top-0 z-10 bg-navy text-white">
            <tr>
              <th className="sticky left-0 z-20 bg-navy p-2 text-left font-bold uppercase">Time</th>
              {dates.map((d, i) => (
                <th key={toISODate(d)} className="border-l border-white/10 p-1.5 text-center font-bold">
                  <div>W{i < 7 ? 1 : 2}-{d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}</div>
                  <div className="font-normal text-white/60">
                    {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {activities.map((activity) => {
              const open = expandedId === activity.id
              return (
                <ActivityBlock
                  key={activity.id}
                  name={activity.name}
                  open={open}
                  onToggle={() => {
                    setExpandedId(open ? null : activity.id)
                    dispatch({ type: 'setActivity', activityId: activity.id })
                  }}
                  dates={dates}
                  dayHours={(date) => dayHours(activity.id, date)}
                  canPlan={canPlan}
                  people={state.people}
                  activityId={activity.id}
                  farmId={state.farmId}
                  houseId={state.houseId}
                  commodityId={state.commodityId}
                  cells={state.cells}
                  onPaint={(date, slot) => paint(activity.id, date, slot)}
                />
              )
            })}
          </tbody>
          <tfoot>
            <tr className="bg-mist font-bold text-brand">
              <td className="sticky left-0 bg-mist p-2 uppercase">Grand Totals</td>
              {dayTotals.map((h, i) => (
                <td key={i} className="border-l border-line p-2 text-center tabular-nums">
                  {h.toFixed(1)}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span>14-Day bi-weekly schedule. Click an activity bar to expand and drag across cells.</span>
        <span className="font-bold text-ink">
          Grand Total Hours: <span className="text-brand">{grand.toFixed(1)}</span>
        </span>
      </div>
    </section>
  )
}

function ActivityBlock({
  name,
  open,
  onToggle,
  dates,
  dayHours,
  canPlan,
  activityId,
  farmId,
  houseId,
  commodityId,
  cells,
  onPaint,
}: {
  name: string
  open: boolean
  onToggle: () => void
  dates: Date[]
  dayHours: (date: string) => number
  canPlan: boolean
  people: number
  activityId: string
  farmId: string
  houseId: string
  commodityId: string
  cells: Record<string, { headcount: number }>
  onPaint: (date: string, slot: number) => void
}) {
  return (
    <>
      <tr className="border-b border-line bg-white hover:bg-green-50/40">
        <td className="sticky left-0 z-[1] bg-inherit p-0">
          <button
            type="button"
            onClick={onToggle}
            className="flex w-full items-center gap-2 px-2 py-2.5 text-left text-xs font-extrabold tracking-wide text-ink uppercase"
          >
            <ChevronRight className={`h-3.5 w-3.5 text-slate-400 transition ${open ? 'rotate-90' : ''}`} />
            {name}
            <Layers className="ml-auto h-3.5 w-3.5 text-slate-300" />
          </button>
        </td>
        {dates.map((d) => {
          const date = toISODate(d)
          const h = dayHours(date)
          return (
            <td key={date} className="border-l border-line p-1 text-center tabular-nums text-slate-600">
              {h > 0 ? h.toFixed(1) : ''}
            </td>
          )
        })}
      </tr>
      {open &&
        SLOT_LABELS.map((label, slot) => (
          <tr key={`${activityId}-${slot}`} className="bg-mist/40">
            <td className="sticky left-0 z-[1] bg-mist/90 px-3 py-1 text-[10px] font-semibold text-slate-500">
              {label}
            </td>
            {dates.map((d) => {
              const date = toISODate(d)
              const locked = isPastDay(date)
              const key = `${farmId}|${houseId}|${commodityId}|${activityId}|${date}|${slot}`
              const head = cells[key]?.headcount ?? 0
              return (
                <td key={date} className="border-l border-line p-0.5">
                  <button
                    type="button"
                    disabled={!canPlan || locked}
                    onClick={() => onPaint(date, slot)}
                    className={`flex h-7 w-full items-center justify-center rounded text-[10px] font-bold ${
                      locked
                        ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                        : head
                          ? 'bg-brand text-white'
                          : 'bg-white text-slate-300 hover:bg-green-50'
                    }`}
                  >
                    {head || ''}
                  </button>
                </td>
              )
            })}
          </tr>
        ))}
    </>
  )
}
