import { hoursForWeek, monthLabel, toISODate, weeksInMonth } from '../lib/time'
import { useStore } from '../store/AppContext'

const MONTHS = Array.from({ length: 12 }, (_, i) => i)

export function YearHoursGrid() {
  const { state, dispatch, farm } = useStore()
  const activityIds = state.activityId
    ? [state.activityId]
    : (farm?.activityIds ?? state.activities.map((a) => a.id))
  const commodityId = state.commodityId || farm?.commodityIds[0] || ''

  const maxWeeks = Math.max(
    ...MONTHS.map((month) => weeksInMonth(state.year, month).length),
    4,
  )

  return (
    <div className="lp-panel mb-6 overflow-x-auto p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-ink">
            {state.year} monthly grid · all 12 months
          </h3>
          <p className="text-xs text-slate-500">
            Planned hours by week. Click a cell to expand the 30-minute schedule for that week.
          </p>
        </div>
      </div>
      <table className="w-full min-w-[920px] border-collapse text-xs">
        <thead>
          <tr>
            <th className="border-b border-line p-2 text-left font-bold uppercase text-navy">
              Week
            </th>
            {MONTHS.map((month) => (
              <th
                key={month}
                className={`border-b border-line p-2 text-center font-bold ${
                  month === state.month ? 'bg-green-50 text-brand' : 'text-ink'
                }`}
              >
                {monthLabel(state.year, month).split(' ')[0]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: maxWeeks }, (_, row) => (
            <tr key={row}>
              <td className="border-b border-line p-2 font-bold text-navy">W{row + 1}</td>
              {MONTHS.map((month) => {
                const weeks = weeksInMonth(state.year, month)
                const weekStart = weeks[row]
                if (!weekStart) {
                  return (
                    <td key={month} className="border-b border-line bg-mist p-1 text-center text-slate-300">
                      —
                    </td>
                  )
                }
                const iso = toISODate(weekStart)
                const hours = hoursForWeek({
                  cells: state.cells,
                  farmId: state.farmId,
                  commodityId,
                  activityIds,
                  weekStart,
                })
                const open = state.expandedWeekISO === iso
                return (
                  <td key={month} className="border-b border-line p-1">
                    <button
                      type="button"
                      onClick={() => {
                        dispatch({ type: 'setMonth', year: state.year, month })
                        dispatch({ type: 'expandWeek', iso: open ? null : iso })
                      }}
                      className={`w-full rounded-[8px] px-2 py-2 font-bold ${
                        open
                          ? 'bg-brand text-white'
                          : hours > 0
                            ? 'bg-green-50 text-brand hover:bg-green-100'
                            : 'bg-white text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      {hours > 0 ? hours.toFixed(0) : '·'}
                    </button>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
