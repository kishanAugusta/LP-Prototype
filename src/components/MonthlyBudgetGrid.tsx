import { hoursForWeek, monthLabel, weeksInMonth } from '../lib/time'
import { useStore } from '../store/AppContext'

const MONTHS = Array.from({ length: 12 }, (_, i) => i)

export function MonthlyBudgetGrid() {
  const { state, farm } = useStore()
  const activityIds = state.activityId
    ? [state.activityId]
    : (farm?.activityIds ?? state.activities.map((a) => a.id))
  const commodityId = state.commodityId || farm?.commodityIds[0] || ''
  const rate = state.ratePerHour

  const rows = MONTHS.map((month) => {
    const weeks = weeksInMonth(state.year, month)
    const hours = weeks.reduce(
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
    const budget = hours * rate
    return { month, hours, budget }
  })

  const totalHours = rows.reduce((s, r) => s + r.hours, 0)
  const totalBudget = rows.reduce((s, r) => s + r.budget, 0)

  return (
    <div className="lp-panel mb-6 overflow-x-auto p-4">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-ink">{state.year} monthly budget plan · all 12 months</h3>
          <p className="text-xs text-slate-500">
            Planned hours, rate / hr, and budget by month. Consolidated totals at the bottom.
          </p>
        </div>
        <div className="rounded-[8px] border border-line bg-mist px-3 py-2 text-xs font-bold text-ink">
          Rate / hr{' '}
          <span className="text-brand">${rate.toFixed(2)}</span>
        </div>
      </div>
      <table className="w-full min-w-[720px] border-collapse text-xs">
        <thead>
          <tr className="bg-mist text-navy">
            <th className="border-b border-line p-2 text-left font-bold uppercase">Month</th>
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
              <td className="border-b border-line p-2 text-right font-semibold tabular-nums">
                {row.hours.toFixed(1)}
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
            <td className="p-2 font-bold uppercase">Consolidated budget plan</td>
            <td className="p-2 text-right font-extrabold tabular-nums">{totalHours.toFixed(1)} hrs</td>
            <td className="p-2 text-right tabular-nums">${rate.toFixed(2)}</td>
            <td className="p-2 text-right font-extrabold tabular-nums">${totalBudget.toFixed(0)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
