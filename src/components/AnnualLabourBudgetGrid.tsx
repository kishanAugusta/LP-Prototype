import { useStore } from '../store/AppContext'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const HA = [38, 38, 42, 50, 52, 55, 55, 52, 48, 44, 40, 38]

const LABOUR_ACTIVITY_IDS = [
  'act-clipping',
  'act-deleafing',
  'act-lowering',
  'act-pruning',
  'act-scouting',
  'act-twisting',
]

function needHours(activityId: string, month: number): number {
  const base = 280 + (activityId.length % 5) * 40 + month * 12
  return Math.round(base + ((month * 17 + activityId.charCodeAt(4)) % 90))
}

function tone(planned: number, need: number): string {
  if (planned <= 0) return 'bg-mist text-slate-400'
  const ratio = planned / Math.max(need, 1)
  if (ratio <= 1.05) return 'bg-green-100 text-green-800 border-green-200'
  if (ratio <= 1.1) return 'bg-amber-100 text-amber-800 border-amber-200'
  return 'bg-rose-100 text-rose-800 border-rose-200'
}

export function AnnualLabourBudgetGrid() {
  const { state, dispatch, farmActivities, canPlan } = useStore()
  const activities = farmActivities.filter((a) => LABOUR_ACTIVITY_IDS.includes(a.id))
  const rate = state.ratePerHour

  function planKey(activityId: string, month: number) {
    return `${state.farmId}|${state.year}|${activityId}|${month}`
  }

  function planned(activityId: string, month: number): number {
    const key = planKey(activityId, month)
    if (key in state.monthlyPlan) return state.monthlyPlan[key]
    // Seed default near need so the grid looks populated like the mock
    return Math.round(needHours(activityId, month) * 1.15)
  }

  const monthCosts = MONTHS.map((_, m) =>
    activities.reduce((sum, a) => sum + planned(a.id, m) * rate, 0),
  )
  const derived = activities.reduce(
    (sum, a) => sum + MONTHS.reduce((s, _, m) => s + needHours(a.id, m), 0),
    0,
  )
  const plannedTotal = activities.reduce(
    (sum, a) => sum + MONTHS.reduce((s, _, m) => s + planned(a.id, m), 0),
    0,
  )
  const annualCost = plannedTotal * rate
  const peakIdx = monthCosts.indexOf(Math.max(...monthCosts))

  return (
    <section className="lp-panel mb-0 p-3">
      <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-ink">Annual Labour Budget</h3>
          <p className="text-[11px] text-slate-500">Need vs planned by activity × month.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <label className="font-semibold text-slate-500">
            Rate $/hr
            <input
              value={String(rate)}
              disabled={!canPlan}
              onChange={(e) => {
                const v = e.target.value
                if (v === '' || /^\d*\.?\d{0,2}$/.test(v)) {
                  dispatch({ type: 'setRate', ratePerHour: Number(v || 0) })
                }
              }}
              className="lp-input ml-2 w-16 px-2 py-1 font-bold"
            />
          </label>
          <span className="rounded bg-green-50 px-2 py-1 font-bold text-green-700">On target</span>
          <span className="rounded bg-amber-50 px-2 py-1 font-bold text-amber-700">Tight (≤10%)</span>
          <span className="rounded bg-rose-50 px-2 py-1 font-bold text-rose-700">Over need</span>
        </div>
      </div>

      <div className="custom-scroll max-h-[min(52vh,480px)] overflow-auto rounded-[8px] border border-line">
        <table className="w-full min-w-[1100px] border-collapse text-[11px]">
          <thead className="sticky top-0 z-10 bg-navy text-white">
            <tr>
              <th className="sticky left-0 z-20 bg-navy p-2 text-left">Activity</th>
              {MONTHS.map((m, i) => (
                <th key={m} className="border-l border-white/10 p-2 text-center">
                  <div className="font-bold">{m}</div>
                  <div className="font-normal text-white/55">{HA[i]} ha</div>
                </th>
              ))}
              <th className="border-l border-white/10 p-2 text-center font-bold">Year</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((activity) => {
              const yearHours = MONTHS.reduce((s, _, m) => s + planned(activity.id, m), 0)
              return (
                <tr key={activity.id} className="border-b border-line">
                  <td className="sticky left-0 z-[1] bg-white p-2 font-bold text-ink">{activity.name}</td>
                  {MONTHS.map((_, m) => {
                    const need = needHours(activity.id, m)
                    const plan = planned(activity.id, m)
                    const ppl = Math.max(1, Math.round(plan / 160))
                    return (
                      <td key={m} className="border-l border-line p-1.5 text-center align-top">
                        <div className="text-[9px] text-slate-400">need {need}h</div>
                        <input
                          disabled={!canPlan}
                          value={String(plan)}
                          onChange={(e) => {
                            if (!/^\d*$/.test(e.target.value)) return
                            dispatch({
                              type: 'setMonthlyPlan',
                              key: planKey(activity.id, m),
                              hours: Number(e.target.value || 0),
                            })
                          }}
                          className={`mt-0.5 w-14 rounded border px-1 py-0.5 text-center text-xs font-bold ${tone(plan, need)}`}
                        />
                        <div className="mt-0.5 text-[9px] text-slate-500">{ppl} ppl</div>
                      </td>
                    )
                  })}
                  <td className="border-l border-line bg-mist p-2 text-center font-extrabold tabular-nums text-navy">
                    {yearHours.toLocaleString()}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="bg-[#e8eef5] font-bold text-navy">
              <td className="sticky left-0 bg-[#e8eef5] p-2">Monthly cost</td>
              {monthCosts.map((c, i) => (
                <td key={i} className="border-l border-line p-2 text-center tabular-nums">
                  ${c.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </td>
              ))}
              <td className="border-l border-line bg-navy p-2 text-center text-white tabular-nums">
                ${annualCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Derived hours" value={derived.toLocaleString()} hint="workload from history" />
        <Kpi label="Planned hours" value={plannedTotal.toLocaleString()} hint="crew × hrs/head" />
        <Kpi
          label="Annual cost"
          value={`$${annualCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          hint={`@ $${rate}/hr`}
        />
        <Kpi
          label="Peak month"
          value={MONTHS[peakIdx]}
          hint={`$${monthCosts[peakIdx].toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
        />
      </div>
    </section>
  )
}

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-[8px] border border-line bg-white p-4">
      <p className="text-[10px] font-bold tracking-wide text-slate-400 uppercase">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-ink tabular-nums">{value}</p>
      <p className="text-xs text-slate-500">{hint}</p>
    </div>
  )
}
