import { Check, Eraser, Search, Trash2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { weekKeyFromDate } from '../lib/time'
import { useStore } from '../store/AppContext'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

const BAY_A = Array.from({ length: 51 }, (_, i) => 96 - i) // 96→46 left→right (46 on the right)
const BAY_B = Array.from({ length: 45 }, (_, i) => 1 + i) // 1–45
const WALKWAYS = new Set([50, 60, 70, 80, 90, 10, 20, 30, 40])

/** Dot positions along the stem: near number, mid, near bottom (equal spacing). */
const DOT_TOPS = ['8%', '50%', '92%'] as const

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

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_15rem]">
        <div className="flex min-h-0 flex-col gap-2">
          {/* Bay A (46–96) on top, then Bay B (1–45) */}
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

          {/* Compact reasons: ~1/3 prior height, internal scroll */}
          <div className="flex h-52 flex-col overflow-hidden rounded-[8px] border border-line bg-mist/40">
            <div className="flex shrink-0 items-center gap-2 border-b border-line px-2.5 py-1.5">
              <X className="h-3.5 w-3.5 shrink-0 text-rose-500" />
              <h3 className="text-[11px] font-bold tracking-wide text-ink uppercase">
                Reason for Not Picking
              </h3>
              {selectedCodes.length > 0 && (
                <span className="ml-auto rounded bg-brand/15 px-1.5 py-0.5 text-[9px] font-bold text-brand">
                  {selectedCodes.length} selected
                </span>
              )}
            </div>
            <div className="relative shrink-0 border-b border-line px-2 py-1.5">
              <Search className="absolute top-1/2 left-3.5 h-3 w-3 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search reason codes…"
                className="lp-input w-full py-1 pr-2 pl-7 text-[11px]"
              />
            </div>
            <div className="custom-scroll min-h-0 flex-1 overflow-y-auto px-1.5 py-1">
              <div className="space-y-0.5">
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
                      className={`flex w-full items-center justify-between rounded px-2 py-1 text-left text-[10px] ${
                        on ? 'bg-green-50 font-bold text-green-800' : 'hover:bg-white'
                      }`}
                    >
                      <span className="tabular-nums">{c.id}</span>
                      <span className="text-slate-400">{c.label}</span>
                    </button>
                  )
                })}
              </div>
              {selectedCodes.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1 border-t border-line pt-1.5">
                  {selectedCodes.map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSelectedCodes((prev) => prev.filter((x) => x !== id))}
                      className="rounded border border-line bg-white px-1.5 py-0.5 text-[9px] font-bold text-ink hover:border-rose-200 hover:text-rose-700"
                      title="Remove"
                    >
                      {id} ×
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="flex flex-col gap-2">
          <div className="rounded-[8px] border border-line bg-mist p-3 text-xs">
            <p className="mb-2 font-bold tracking-wide text-ink uppercase">Week summary</p>
            <ul className="space-y-1">
              {DAYS.map((d, i) => (
                <li
                  key={d}
                  className={`flex justify-between rounded px-1.5 py-0.5 text-slate-600 ${
                    state.harvestDay === i ? 'bg-green-50 font-bold text-ink' : ''
                  }`}
                >
                  <span>{d}</span>
                  <span className="tabular-nums">{dayCounts[i]}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 flex justify-between border-t border-line pt-2 font-extrabold text-ink">
              <span>Total rows</span>
              <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] text-white">
                {totalRows}
              </span>
            </p>
          </div>
          <div className="rounded-[8px] border border-line bg-white p-3 text-[10px] text-slate-500">
            <p className="mb-2 font-bold tracking-wide text-slate-400 uppercase">Legend</p>
            <div className="space-y-1.5">
              <p className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-brand" /> Scheduled
                for picking
              </p>
              <p className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full border border-line bg-white" />{' '}
                Unscheduled row
              </p>
              <p className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(135deg, #bae6fd 0 2px, #e0f2fe 2px 4px)',
                  }}
                />{' '}
                Walkway / aisle
              </p>
            </div>
          </div>
          <div className="rounded-[8px] border border-line bg-green-50/60 p-3 text-[11px] text-slate-600">
            <p className="font-bold text-navy">Day tip</p>
            <p className="mt-1 leading-relaxed">
              Tap a row column to schedule picking for{' '}
              <span className="font-bold text-ink">{DAYS[state.harvestDay]}</span>. Use reason codes
              below for rows you skip.
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
  const allOn = selectable.length > 0 && selectable.every(isOn)
  return (
    <div className="rounded-[8px] border border-line px-2.5 py-2">
      <div className="mb-2 flex items-center justify-between gap-2">
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
      <div className="custom-scroll flex gap-0.5 overflow-x-auto pb-1">
        {rows.map((row) => {
          const walk = WALKWAYS.has(row)
          const on = isOn(row)
          return (
            <button
              key={row}
              type="button"
              title={walk ? `Walkway ${row}` : `Row ${row}`}
              disabled={!canPlan || walk}
              onClick={() => onToggle(row)}
              className={`flex w-5 shrink-0 flex-col items-center disabled:cursor-default ${
                walk ? '' : 'hover:opacity-90'
              }`}
            >
              <span
                className={`mb-0.5 text-[8px] font-bold tabular-nums leading-none ${
                  on ? 'text-brand' : 'text-slate-500'
                }`}
              >
                {row}
              </span>
              {walk ? (
                <span
                  className="h-[4.5rem] w-3 rounded-sm border border-sky-200"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(135deg, #bae6fd 0 2px, #e0f2fe 2px 4px)',
                  }}
                />
              ) : (
                <span className="relative h-[4.5rem] w-3">
                  <span
                    className={`absolute top-0 bottom-0 left-1/2 w-px -translate-x-1/2 ${
                      on ? 'bg-brand' : 'bg-slate-300'
                    }`}
                  />
                  {DOT_TOPS.map((top) => (
                    <span
                      key={top}
                      className={`absolute left-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full border ${
                        on
                          ? 'border-brand bg-brand'
                          : 'border-slate-400 bg-white'
                      }`}
                      style={{ top }}
                    />
                  ))}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
