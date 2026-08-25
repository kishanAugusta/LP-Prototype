import { hoursForWeek, monthLabel, weeksInMonth } from '../lib/time'
import { useStore } from '../store/AppContext'

const MONTHS = Array.from({ length: 12 }, (_, i) => i)

function budgetKey(farmId: string, houseId: string, year: number, month: number) {
  return `${farmId}|${year}|${houseId}|month:${month}`
}

export function MonthlyBudgetGrid() {
  const { state, dispatch, farm, canPlan } = useStore()
  const activityIds = state.activityId
    ? [state.activityId]
    : (farm?.activityIds ?? state.activities.map((a) => a.id))
  const commodityId = state.commodityId || farm?.commodityIds[0] || ''
  const rate = state.ratePerHour

  const rows = MONTHS.map((month) => {
    const key = budgetKey(state.farmId, state.houseId, state.year, month)
    const weeks = weeksInMonth(state.year, month)
    const fromCells = weeks.reduce(
      (sum, weekStart) =>
        sum +
        hoursForWeek({
          cells: state.cells,
          farmId: state.farmId,
          houseId: state.houseId,
          commodityId,
          activityIds,
          weekStart,
        }),
      0,
    )
    const hours = key in state.monthlyPlan ? state.monthlyPlan[key] : fromCells
    const people =
      hours > 0 ? Math.max(1, Math.round(hours / 160)) : 0
    const budget = hours * rate
    return { month, hours, people, budget, key, fromCells }
  })

  const totalHours = rows.reduce((s, r) => s + r.hours, 0)
  const totalBudget = rows.reduce((s, r) => s + r.budget, 0)

  return (
    <div className="lp-panel mb-3 overflow-x-auto p-4">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-ink">{state.year} monthly budget plan · all 12 months</h3>
          <p className="text-xs text-slate-500">
            Enter planned hours (or people) per month. Budget = hours × rate / hr.
          </p>
        </div>
        <div className="rounded-[8px] border border-line bg-mist px-3 py-2 text-xs font-bold text-ink">
          Rate / hr <span className="text-brand">${rate.toFixed(2)}</span>
        </div>
      </div>
      <table className="w-full min-w-[780px] border-collapse text-xs">
        <thead>
          <tr className="bg-mist text-navy">
            <th className="border-b border-line p-2 text-left font-bold uppercase">Month</th>
            <th className="border-b border-line p-2 text-right font-bold uppercase">People</th>
            <th className="border-b border-line p-2 text-right font-bold uppercase">Planned hours</th>
            <th className="border-b border-line p-2 text-right font-bold uppercase">Rate / hr</th>
            <th className="border-b border-line p-2 text-right font-bold uppercase">Planned budget</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.month} className={row.month === state.month ? 'bg-green-50' : ''}>
              <td className="border-b border-line p-2 font-bold text-ink">
                {monthLabel(state.year, row.month)}
              </td>
              <td className="border-b border-line p-2 text-right">
                <input
                  type="text"
                  inputMode="numeric"
                  disabled={!canPlan}
                  value={row.people ? String(row.people) : ''}
                  placeholder="0"
                  onChange={(e) => {
                    const v = e.target.value
                    if (v !== '' && !/^\d+$/.test(v)) return
                    const ppl = v === '' ? 0 : Number(v)
                    dispatch({
                      type: 'setMonthlyPlan',
                      key: row.key,
                      hours: ppl * 160,
                    })
                  }}
                  className="lp-input ml-auto w-16 px-2 py-1 text-right font-bold tabular-nums"
                />
              </td>
              <td className="border-b border-line p-2 text-right">
                <input
                  type="text"
                  inputMode="decimal"
                  disabled={!canPlan}
                  value={row.hours ? String(row.hours) : ''}
                  placeholder="0"
                  onChange={(e) => {
                    const v = e.target.value
                    if (v !== '' && !/^\d*\.?\d*$/.test(v)) return
                    dispatch({
                      type: 'setMonthlyPlan',
                      key: row.key,
                      hours: v === '' ? 0 : Number(v),
                    })
                  }}
                  className="lp-input ml-auto w-24 px-2 py-1 text-right font-semibold tabular-nums"
                />
              </td>
              <td className="border-b border-line p-2 text-right tabular-nums text-slate-600">
                ${rate.toFixed(2)}
              </td>
              <td className="border-b border-line p-2 text-right font-bold tabular-nums text-navy">
                ${row.budget.toFixed(0)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-navy text-white">
            <td className="p-2 font-bold uppercase" colSpan={2}>
              Consolidated budget plan
            </td>
            <td className="p-2 text-right font-extrabold tabular-nums">{totalHours.toFixed(1)} hrs</td>
            <td className="p-2 text-right tabular-nums">${rate.toFixed(2)}</td>
            <td className="p-2 text-right font-extrabold tabular-nums">${totalBudget.toFixed(0)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
