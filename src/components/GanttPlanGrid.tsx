import { GitBranch, Lock } from 'lucide-react'
import { addDays, isPastPlanningWeek, toISODate, weekDates } from '../lib/time'
import { useStore } from '../store/AppContext'
import type { PlanType } from '../types'

const TEAROUT_TASKS = [
  { id: 'to-vines', name: 'Tear Out - Vines' },
  { id: 'to-strings', name: 'Tear Out - Strings' },
  { id: 'to-plastic', name: 'Tear Out - Plastic' },
  { id: 'co-sweep', name: 'Cleanout - Sweeping' },
  { id: 'co-wash', name: 'Cleanout - Washing' },
  { id: 'co-disinfect', name: 'Cleanout - Disinfecting' },
  { id: 'to-support', name: 'Vine support cleaning' },
  { id: 'to-lights', name: 'Bag lights' },
]

const PLANTING_TASKS = [
  { id: 'pl-slabs', name: 'Planting - Slabs' },
  { id: 'pl-plants', name: 'Planting - Plants' },
  { id: 'pl-wifi', name: 'Cover signal wifi box' },
  { id: 'pl-drip', name: 'Install drip lines' },
  { id: 'pl-clips', name: 'Plant clips / hooks' },
  { id: 'pl-labels', name: 'Row labels' },
]

const INTENSITY: Record<1 | 2 | 3, string> = {
  1: 'bg-green-200 text-green-900',
  2: 'bg-amber-200 text-amber-900',
  3: 'bg-rose-300 text-rose-900',
}

export function GanttPlanGrid({ planType }: { planType: Extract<PlanType, 'tearout-gantt' | 'planting-gantt'> }) {
  const { state, dispatch, canPlan } = useStore()
  const tasks = planType === 'tearout-gantt' ? TEAROUT_TASKS : PLANTING_TASKS
  const title = planType === 'tearout-gantt' ? 'Tear-Out / Cleanout Gantt Schedule' : 'Planting Gantt Schedule'
  const weekStart = new Date(state.weekStartISO + 'T00:00:00')
  const dates = [...weekDates(weekStart), ...weekDates(addDays(weekStart, 7))]
  const pastWeekLocked = isPastPlanningWeek(state.weekStartISO)
  const canEditWeek = canPlan && !pastWeekLocked

  function metaKey(taskId: string) {
    return `${planType}|${state.farmId}|${state.weekStartISO}|${taskId}`
  }

  function dayKey(taskId: string, date: string) {
    return `${metaKey(taskId)}|${date}`
  }

  function meta(taskId: string) {
    return state.ganttMeta[metaKey(taskId)] ?? { rows: 100, crew: 2 }
  }

  function laborHrs(taskId: string) {
    const m = meta(taskId)
    const cal =
      state.calibrations.find((c) =>
        planType === 'tearout-gantt' ? c.activityId === 'act-tearout' : c.activityId === 'act-planting',
      )?.minutesPerRow ?? 10
    return (m.rows * cal) / 60
  }

  function elapsedHrs(taskId: string) {
    const m = meta(taskId)
    return laborHrs(taskId) / Math.max(1, m.crew)
  }

  let totalLabor = 0
  let totalElapsed = 0
  for (const task of tasks) {
    const scheduled = dates.some((d) => state.ganttDays[dayKey(task.id, toISODate(d))])
    if (scheduled) {
      totalLabor += laborHrs(task.id)
      totalElapsed += elapsedHrs(task.id)
    }
  }

  return (
    <section className="lp-panel mb-0 p-3">
      {pastWeekLocked ? (
        <p className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
          <Lock className="h-3.5 w-3.5" aria-hidden />
          Past week — editing is locked.
        </p>
      ) : null}
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-sunset" />
            <h3 className="text-sm font-bold text-ink">{title}</h3>
          </div>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Rows & crew · click days to cycle intensity (1 → 2 → 3). Hours from calibration.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] font-bold">
          <span className="rounded bg-green-100 px-2 py-1 text-green-800">1 Light</span>
          <span className="rounded bg-amber-100 px-2 py-1 text-amber-800">2 Medium</span>
          <span className="rounded bg-rose-100 px-2 py-1 text-rose-800">3 Heavy</span>
        </div>
      </div>

      <div className="custom-scroll max-h-[min(55vh,500px)] overflow-auto rounded-[8px] border border-line">
        <table className="w-full min-w-[1100px] border-collapse text-[11px]">
          <thead className="sticky top-0 z-10 bg-navy text-white">
            <tr>
              <th className="p-2 text-left">Task</th>
              <th className="p-2 text-center">Rows</th>
              <th className="p-2 text-center">Crew</th>
              <th className="p-2 text-center">Labor hrs</th>
              <th className="p-2 text-center">Elapsed hrs</th>
              {dates.map((d, i) => (
                <th key={toISODate(d)} className="border-l border-white/10 p-1 text-center font-bold">
                  <div>
                    W{i < 7 ? 1 : 2} {d.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => {
              const m = meta(task.id)
              const labor = laborHrs(task.id)
              const elapsed = elapsedHrs(task.id)
              return (
                <tr key={task.id} className="border-b border-line">
                  <td className="p-2 font-bold text-ink">{task.name}</td>
                  <td className="p-1 text-center">
                    <input
                      disabled={!canEditWeek}
                      value={String(m.rows)}
                      onChange={(e) => {
                        if (!/^\d*$/.test(e.target.value)) return
                        dispatch({
                          type: 'setGanttMeta',
                          key: metaKey(task.id),
                          rows: Number(e.target.value || 0),
                          crew: m.crew,
                        })
                      }}
                      className="lp-input w-14 px-1 py-1 text-center text-xs disabled:opacity-50"
                    />
                  </td>
                  <td className="p-1 text-center">
                    <input
                      disabled={!canEditWeek}
                      value={String(m.crew)}
                      onChange={(e) => {
                        if (!/^\d*$/.test(e.target.value)) return
                        dispatch({
                          type: 'setGanttMeta',
                          key: metaKey(task.id),
                          rows: m.rows,
                          crew: Number(e.target.value || 0),
                        })
                      }}
                      className="lp-input w-12 px-1 py-1 text-center text-xs disabled:opacity-50"
                    />
                  </td>
                  <td className="p-2 text-center tabular-nums font-semibold">{labor.toFixed(1)}</td>
                  <td className="p-2 text-center tabular-nums font-bold text-sunset">{elapsed.toFixed(1)}</td>
                  {dates.map((d) => {
                    const date = toISODate(d)
                    const key = dayKey(task.id, date)
                    const intensity = state.ganttDays[key]
                    return (
                      <td key={date} className="border-l border-line p-0.5">
                        <button
                          type="button"
                          disabled={!canEditWeek}
                          onClick={() => dispatch({ type: 'cycleGanttDay', key })}
                          className={`flex h-8 w-full items-center justify-center rounded text-[10px] font-bold disabled:cursor-not-allowed ${
                            pastWeekLocked
                              ? intensity
                                ? `${INTENSITY[intensity]} opacity-70`
                                : 'bg-slate-100 text-slate-400'
                              : intensity
                                ? INTENSITY[intensity]
                                : 'bg-white text-slate-300 hover:bg-green-50'
                          }`}
                        >
                          {intensity ? intensity : ''}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex flex-wrap justify-end gap-4 text-sm font-bold">
        <span>
          Total labor: <span className="text-ink">{totalLabor.toFixed(1)} hrs</span>
        </span>
        <span className="text-sunset">
          Total elapsed (with crews): {totalElapsed.toFixed(1)} hrs
        </span>
      </div>
    </section>
  )
}
