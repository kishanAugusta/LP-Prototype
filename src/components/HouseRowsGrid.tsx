import { useEffect, useMemo, useState } from 'react'
import { greenhouseHouses } from '../data/mock'
import { useStore } from '../store/AppContext'

/** MINI / FRED / HARVEST row-wise selector for monthly labour planning. */
export function HouseRowsGrid() {
  const { state, canPlan, dispatch } = useStore()
  const house = greenhouseHouses.find((h) => h.id === state.houseId)
  const rate = state.ratePerHour
  const people = state.people
  const minutesPerRow =
    state.calibrations.find((c) => c.activityId === state.activityId)?.minutesPerRow ?? 10

  const storageKey = useMemo(
    () =>
      `lp-rows|${state.farmId}|${state.houseId}|${state.year}|${state.commodityId}|${state.activityId || 'all'}`,
    [state.farmId, state.houseId, state.year, state.commodityId, state.activityId],
  )

  const [selected, setSelected] = useState<Record<number, boolean>>({})

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(storageKey)
      setSelected(raw ? (JSON.parse(raw) as Record<number, boolean>) : {})
    } catch {
      setSelected({})
    }
  }, [storageKey])

  useEffect(() => {
    sessionStorage.setItem(storageKey, JSON.stringify(selected))
  }, [selected, storageKey])

  if (!house) return null

  const rows = Array.from({ length: house.rows }, (_, i) => i + 1)
  const selectedCount = rows.filter((r) => selected[r]).length
  /** Prototype: selected row · people · (60 / minutesPerRow) hours of labour capacity. */
  const hoursPerSelectedRow = people > 0 ? (people * (60 / minutesPerRow)) / 60 : 0
  const totalHours = selectedCount * hoursPerSelectedRow
  const totalBudget = totalHours * rate

  function toggle(row: number) {
    if (!canPlan) return
    setSelected((prev) => ({ ...prev, [row]: !prev[row] }))
  }

  function selectAll(on: boolean) {
    if (!canPlan) return
    const next: Record<number, boolean> = {}
    if (on) rows.forEach((r) => (next[r] = true))
    setSelected(next)
  }

  return (
    <div className="lp-panel mb-0 overflow-hidden p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-ink">
            {house.name} row selector · {house.rows} rows · {house.acres} ac
          </h3>
          <p className="text-xs text-slate-500">
            Click rows (or the bay chips below) to include them. Uses Number of people and Rate / hr.
            {!state.activityId && (
              <span className="ml-1 font-semibold text-sunset"> Select an activity to calibrate minutes/row.</span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            People
            <input
              type="text"
              inputMode="numeric"
              disabled={!canPlan}
              value={String(people)}
              onChange={(e) => {
                const v = e.target.value
                if (v === '') {
                  dispatch({ type: 'setPeople', people: 0 })
                  return
                }
                if (!/^\d+$/.test(v)) return
                dispatch({ type: 'setPeople', people: Number(v) })
              }}
              className="lp-input w-14 px-2 py-1 font-bold"
            />
          </label>
          <button
            type="button"
            disabled={!canPlan}
            onClick={() => selectAll(true)}
            className="lp-btn-ghost px-3 py-1.5 text-xs disabled:opacity-40"
          >
            Select all
          </button>
          <button
            type="button"
            disabled={!canPlan}
            onClick={() => selectAll(false)}
            className="lp-btn-ghost px-3 py-1.5 text-xs disabled:opacity-40"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Compact bay-style row chips (expected Mini / FRED feel) */}
      <div className="mb-3 rounded-[8px] border border-line bg-mist/40 p-2.5">
        <div className="mb-1.5 flex items-center justify-between text-[11px]">
          <span className="font-extrabold tracking-wide text-ink uppercase">{house.name} rows</span>
          <span className="text-slate-500">
            {selectedCount} / {house.rows} selected
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          {rows.map((row) => {
            const on = Boolean(selected[row])
            return (
              <button
                key={row}
                type="button"
                title={`Row ${row}`}
                disabled={!canPlan}
                onClick={() => toggle(row)}
                className={`flex h-7 min-w-8 items-center justify-center rounded px-1.5 text-[10px] font-bold ${
                  on
                    ? 'bg-brand text-white shadow-sm'
                    : 'border border-line bg-white text-slate-600 hover:bg-green-50'
                } disabled:opacity-40`}
              >
                R{row}
              </button>
            )
          })}
        </div>
      </div>

      <div className="custom-scroll max-h-[min(36vh,320px)] overflow-auto rounded-[8px] border border-line">
        <table className="w-full min-w-[640px] border-collapse text-xs">
          <thead className="sticky top-0 z-[1] bg-mist text-navy">
            <tr>
              <th className="border-b border-line p-2 text-left font-bold uppercase">Row</th>
              <th className="border-b border-line p-2 text-center font-bold uppercase">Selected</th>
              <th className="border-b border-line p-2 text-right font-bold uppercase">People</th>
              <th className="border-b border-line p-2 text-right font-bold uppercase">Est. hours</th>
              <th className="border-b border-line p-2 text-right font-bold uppercase">Budget</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const on = Boolean(selected[row])
              const hours = on ? hoursPerSelectedRow : 0
              const budget = hours * rate
              return (
                <tr key={row} className={on ? 'bg-green-50' : 'hover:bg-mist'}>
                  <td className="border-b border-line p-0">
                    <button
                      type="button"
                      disabled={!canPlan}
                      onClick={() => toggle(row)}
                      className="flex w-full items-center gap-2 px-2 py-2 text-left font-bold text-ink disabled:cursor-not-allowed"
                    >
                      R{row}
                    </button>
                  </td>
                  <td className="border-b border-line p-2 text-center">
                    <input
                      type="checkbox"
                      checked={on}
                      disabled={!canPlan}
                      onChange={() => toggle(row)}
                      className="h-4 w-4 accent-brand"
                    />
                  </td>
                  <td className="border-b border-line p-2 text-right tabular-nums text-slate-600">
                    {on ? people : '—'}
                  </td>
                  <td className="border-b border-line p-2 text-right font-semibold tabular-nums">
                    {on ? hours.toFixed(1) : '—'}
                  </td>
                  <td className="border-b border-line p-2 text-right font-bold tabular-nums text-navy">
                    {on ? `$${budget.toFixed(0)}` : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="bg-navy text-white">
              <td className="p-2 font-bold uppercase" colSpan={2}>
                Selected {selectedCount} / {house.rows} rows
              </td>
              <td className="p-2 text-right tabular-nums">{people}</td>
              <td className="p-2 text-right font-extrabold tabular-nums">{totalHours.toFixed(1)} hrs</td>
              <td className="p-2 text-right font-extrabold tabular-nums">${totalBudget.toFixed(0)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
