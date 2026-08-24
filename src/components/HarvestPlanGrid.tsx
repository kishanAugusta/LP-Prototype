import { Check, Eraser, Search, Trash2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { weekKeyFromDate } from '../lib/time'
import { useStore } from '../store/AppContext'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

const BAY_A = Array.from({ length: 51 }, (_, i) => 46 + i) // 46–96
const BAY_B = Array.from({ length: 45 }, (_, i) => 1 + i) // 1–45
const WALKWAYS = new Set([50, 60, 70, 80, 90, 10, 20, 30, 40])

const REASON_CODES = Array.from({ length: 24 }, (_, i) => ({
  id: `ST.RM.${String(i + 1).padStart(3, '0')}`,
  label: i % 3 === 0 ? 'Immature' : i % 3 === 1 ? 'Disease hold' : 'Quality reject',
}))

export function HarvestPlanGrid() {
  const { state, dispatch, canPlan } = useStore()
  const [query, setQuery] = useState('')
  const [selectedCodes, setSelectedCodes] = useState<string[]>([])
  const weekKey = weekKeyFromDate(new Date(state.weekStartISO + 'T00:00:00'))

  function rowKey(row: number) {
    return `${state.farmId}|${weekKey}|${state.harvestDay}|${row}`
  }

  function isOn(row: number) {
    return Boolean(state.harvestPicks[rowKey(row)])
  }

  function toggleRow(row: number) {
    if (!canPlan || WALKWAYS.has(row)) return
    dispatch({ type: 'toggleHarvestRow', rowId: String(row) })
  }

  function setBay(rows: number[], on: boolean) {
    if (!canPlan) return
    for (const row of rows) {
      if (WALKWAYS.has(row)) continue
      const key = rowKey(row)
      const currently = Boolean(state.harvestPicks[key])
      if (on !== currently) dispatch({ type: 'toggleHarvestRow', rowId: String(row) })
    }
  }

  const dayCounts = DAYS.map((_, day) => {
    const prefix = `${state.farmId}|${weekKey}|${day}|`
    return Object.keys(state.harvestPicks).filter((k) => k.startsWith(prefix)).length
  })
  const selectedToday = dayCounts[state.harvestDay] ?? 0
  const totalRows = dayCounts.reduce((a, b) => a + b, 0)

  const codes = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return REASON_CODES
    return REASON_CODES.filter((c) => c.id.toLowerCase().includes(q) || c.label.toLowerCase().includes(q))
  }, [query])

  return (
    <section className="lp-panel mb-0 p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1">
          {DAYS.map((d, i) => (
            <button
              key={d}
              type="button"
              onClick={() => dispatch({ type: 'setHarvestDay', day: i })}
              className={`rounded-[8px] px-3 py-1.5 text-xs font-bold ${
                state.harvestDay === i ? 'bg-brand text-white' : 'bg-mist text-slate-600 hover:bg-green-50'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 rounded-[8px] border border-line px-2 py-1 text-xs font-bold text-slate-600">
            <Check className="h-3.5 w-3.5 text-brand" />
            {selectedToday} rows selected
          </span>
          <button
            type="button"
            disabled={!canPlan}
            onClick={() => dispatch({ type: 'clearHarvestDay' })}
            className="lp-btn-ghost flex items-center gap-1 px-3 py-1.5 text-xs"
          >
            <Eraser className="h-3.5 w-3.5" />
            Clear Day
          </button>
          <button
            type="button"
            disabled={!canPlan}
            onClick={() => dispatch({ type: 'clearHarvestWeek' })}
            className="flex items-center gap-1 rounded-[8px] border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear Week
          </button>
        </div>
      </div>

      {/* One compact block: bays + summary + reasons fill the panel together */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_15rem]">
        <div className="flex min-h-0 flex-col gap-2">
          <Bay
            title="Bay A — North"
            rows={BAY_A}
            isOn={isOn}
            onToggle={toggleRow}
            onAll={(on) => setBay(BAY_A, on)}
            canPlan={canPlan}
          />
          <Bay
            title="Bay B — South"
            rows={BAY_B}
            isOn={isOn}
            onToggle={toggleRow}
            onAll={(on) => setBay(BAY_B, on)}
            canPlan={canPlan}
          />

          {/* Fills the former blank area under the bays */}
          <div className="flex min-h-[11rem] flex-1 flex-col rounded-[8px] border border-line bg-mist/40 p-3">
            <div className="mb-2 flex items-center gap-2">
              <X className="h-3.5 w-3.5 text-rose-500" />
              <h3 className="text-xs font-bold tracking-wide text-ink uppercase">
                Reason for Not Picking
              </h3>
            </div>
            <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="flex min-h-0 flex-col">
                <div className="relative mb-1.5">
                  <Search className="absolute top-1/2 left-2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search reason codes…"
                    className="lp-input w-full py-1.5 pr-3 pl-8 text-xs"
                  />
                </div>
                <div className="custom-scroll min-h-[7rem] flex-1 space-y-0.5 overflow-y-auto rounded-[8px] border border-line bg-white p-1.5">
                  {codes.map((c) => {
                    const on = selectedCodes.includes(c.id)
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() =>
                          setSelectedCodes((prev) =>
                            on ? prev.filter((x) => x !== c.id) : [...prev, c.id],
                          )
                        }
                        className={`flex w-full items-center justify-between rounded px-2 py-1 text-left text-[11px] ${
                          on ? 'bg-green-50 font-bold text-green-800' : 'hover:bg-mist'
                        }`}
                      >
                        <span>{c.id}</span>
                        <span className="text-slate-400">{c.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="flex min-h-[7rem] flex-col rounded-[8px] border border-dashed border-line bg-white p-2 text-xs text-slate-500">
                {selectedCodes.length === 0 ? (
                  <p className="m-auto px-2 text-center text-[11px]">
                    Select reason codes on the left to attach them to unscheduled rows.
                  </p>
                ) : (
                  <ul className="custom-scroll max-h-40 space-y-1 overflow-y-auto">
                    {selectedCodes.map((id) => (
                      <li
                        key={id}
                        className="rounded border border-line bg-mist px-2 py-1.5 font-bold text-ink"
                      >
                        {id}
                        <span className="ml-2 font-normal text-slate-500">
                          {REASON_CODES.find((c) => c.id === id)?.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>

        <aside className="flex flex-col gap-2">
          <div className="rounded-[8px] border border-line bg-mist p-3 text-xs">
            <p className="mb-2 font-bold tracking-wide text-ink uppercase">Week summary</p>
            <ul className="space-y-1">
              {DAYS.map((d, i) => (
                <li key={d} className="flex justify-between text-slate-600">
                  <span>{d}</span>
                  <span className="font-bold tabular-nums">{dayCounts[i]}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 flex justify-between border-t border-line pt-2 font-extrabold text-ink">
              <span>Total rows</span>
              <span>{totalRows}</span>
            </p>
          </div>
          <div className="rounded-[8px] border border-line bg-white p-3 text-[10px] text-slate-500">
            <p className="mb-2 font-bold tracking-wide text-slate-400 uppercase">Legend</p>
            <div className="space-y-1.5">
              <p className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm bg-brand" /> Scheduled for
                picking
              </p>
              <p className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm border border-line bg-white" />{' '}
                Unscheduled row
              </p>
              <p className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm bg-sky-100" /> Walkway /
                aisle
              </p>
            </div>
          </div>
          <div className="flex flex-1 flex-col justify-end rounded-[8px] border border-line bg-green-50/60 p-3 text-[11px] text-slate-600">
            <p className="font-bold text-navy">Day tip</p>
            <p className="mt-1 leading-relaxed">
              Tap rows to schedule picking for{' '}
              <span className="font-bold text-ink">{DAYS[state.harvestDay]}</span>. Use reason codes
              below the bays for rows you skip.
            </p>
            <p className="mt-2 font-extrabold text-brand tabular-nums">
              {selectedToday} selected · {totalRows} week total
            </p>
          </div>
        </aside>
      </div>
    </section>
  )
}

function Bay({
  title,
  rows,
  isOn,
  onToggle,
  onAll,
  canPlan,
}: {
  title: string
  rows: number[]
  isOn: (row: number) => boolean
  onToggle: (row: number) => void
  onAll: (on: boolean) => void
  canPlan: boolean
}) {
  const selectable = rows.filter((r) => !WALKWAYS.has(r))
  const allOn = selectable.every(isOn)
  return (
    <div className="rounded-[8px] border border-line px-2.5 py-2">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="text-[11px] font-extrabold tracking-wide text-ink uppercase">{title}</p>
        <div className="flex items-center gap-2 text-[11px]">
          <button
            type="button"
            disabled={!canPlan}
            onClick={() => onAll(!allOn)}
            className="rounded border border-line px-2 py-0.5 font-bold text-slate-600 hover:bg-mist"
          >
            {allOn ? 'All Off' : 'All On'}
          </button>
          <span className="text-slate-400">{selectable.length} rows</span>
        </div>
      </div>
      <div className="flex flex-wrap content-start gap-0.5">
        {rows.map((row) => {
          const walk = WALKWAYS.has(row)
          const on = isOn(row)
          return (
            <button
              key={row}
              type="button"
              title={`Row ${row}`}
              disabled={!canPlan || walk}
              onClick={() => onToggle(row)}
              className={`h-6 w-2.5 shrink-0 rounded-sm ${
                walk
                  ? 'cursor-default bg-sky-100'
                  : on
                    ? 'bg-brand text-white'
                    : 'border border-line bg-white hover:bg-green-50'
              }`}
            />
          )
        })}
      </div>
    </div>
  )
}
