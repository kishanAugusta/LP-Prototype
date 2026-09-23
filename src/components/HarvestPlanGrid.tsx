import { Check, Eraser, Lock, Search, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { isPastPlanningWeek, weekKeyFromDate } from '../lib/time'
import { useStore } from '../store/AppContext'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

/** Mini-FRED layout: 95 pickable rows (client). Exact bay map may be refined later. */
const BAY_A = Array.from({ length: 50 }, (_, i) => 95 - i) // 95→46 left→right
const BAY_B = Array.from({ length: 45 }, (_, i) => 1 + i) // 1–45

/** Dot positions along the stem: near number, mid, near bottom (equal spacing). */
const DOT_TOPS = ['8%', '50%', '92%'] as const

const REASON_CODES = Array.from({ length: 24 }, (_, i) => ({
  id: `ST.RM.${String(i + 1).padStart(3, '0')}`,
  label: i % 3 === 0 ? 'Immature' : i % 3 === 1 ? 'Disease hold' : 'Quality reject',
}))

export function HarvestPlanGrid() {
  const { state, dispatch, canPlan } = useStore()
  const [query, setQuery] = useState('')
  /** Selected ST.RM codes → free-text reason (user-typed, not predefined). */
  const [selectedReasons, setSelectedReasons] = useState<Record<string, string>>({})
  const weekKey = weekKeyFromDate(new Date(state.weekStartISO + 'T00:00:00'))
  const pastWeekLocked = isPastPlanningWeek(state.weekStartISO)
  const canEditWeek = canPlan && !pastWeekLocked

  const selectedCodes = Object.keys(selectedReasons)

  function toggleCode(id: string) {
    if (!canEditWeek) return
    setSelectedReasons((prev) => {
      if (id in prev) {
        const next = { ...prev }
        delete next[id]
        return next
      }
      return { ...prev, [id]: '' }
    })
  }

  function setReasonText(id: string, text: string) {
    if (!canEditWeek) return
    setSelectedReasons((prev) => (id in prev ? { ...prev, [id]: text } : prev))
  }

  function rowKey(row: number) {
    return `${state.farmId}|${weekKey}|${state.harvestDay}|${row}`
  }

  function isOn(row: number) {
    return Boolean(state.harvestPicks[rowKey(row)])
  }

  function setRow(row: number, on: boolean) {
    if (!canEditWeek) return
    const currently = isOn(row)
    if (currently === on) return
    dispatch({ type: 'setHarvestRow', rowId: String(row), on })
  }

  function setBay(rows: number[], on: boolean) {
    if (!canEditWeek) return
    for (const row of rows) {
      setRow(row, on)
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
    return REASON_CODES.filter((c) => c.id.toLowerCase().includes(q))
  }, [query])

  return (
    <section className="lp-panel mb-0 p-3">
      {pastWeekLocked ? (
        <p className="mb-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
          <Lock className="h-3.5 w-3.5" aria-hidden />
          Past week — editing is locked.
        </p>
      ) : null}
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
          <span className="hidden text-[10px] text-slate-500 sm:inline">Drag across rows to select</span>
          <button
            type="button"
            disabled={!canEditWeek}
            onClick={() => dispatch({ type: 'clearHarvestDay' })}
            className="lp-btn-ghost flex items-center gap-1 px-3 py-1.5 text-xs disabled:opacity-40"
          >
            <Eraser className="h-3.5 w-3.5" />
            Clear Day
          </button>
          <button
            type="button"
            disabled={!canEditWeek}
            onClick={() => dispatch({ type: 'clearHarvestWeek' })}
            className="flex items-center gap-1 rounded-[8px] border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 disabled:opacity-40"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear Week
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_15rem]">
        <div className="flex min-h-0 flex-col gap-2">
          <Bay
            title="Bay A — North"
            rows={BAY_A}
            isOn={isOn}
            onPaint={setRow}
            onAll={(on) => setBay(BAY_A, on)}
            canPlan={canEditWeek}
          />
          <Bay
            title="Bay B — South"
            rows={BAY_B}
            isOn={isOn}
            onPaint={setRow}
            onAll={(on) => setBay(BAY_B, on)}
            canPlan={canEditWeek}
          />

          {/* Two-pane reasons: codes | selected + free-text input */}
          <div className="flex h-52 flex-col overflow-hidden rounded-[8px] border border-line bg-white">
            <div className="flex shrink-0 items-center gap-2 border-b border-line bg-mist/40 px-2.5 py-1.5">
              <X className="h-3.5 w-3.5 shrink-0 text-rose-500" />
              <h3 className="text-[11px] font-bold tracking-wide text-ink uppercase">
                Reason for Not Picking
              </h3>
            </div>
            <div className="grid min-h-0 flex-1 grid-cols-1 sm:grid-cols-2">
              <div className="flex min-h-0 flex-col border-b border-line sm:border-r sm:border-b-0">
                <div className="relative shrink-0 border-b border-line px-2 py-1.5">
                  <Search className="absolute top-1/2 left-3.5 h-3 w-3 -translate-y-1/2 text-slate-400" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    disabled={!canEditWeek}
                    placeholder="Search ST.RM codes…"
                    className="lp-input w-full py-1 pr-2 pl-7 text-[11px] disabled:opacity-50"
                  />
                </div>
                <p className="shrink-0 border-b border-line bg-mist/30 px-2.5 py-1 text-[9px] font-bold tracking-wide text-slate-400 uppercase">
                  Reason codes
                </p>
                <div className="custom-scroll min-h-0 flex-1 overflow-y-auto">
                  <table className="w-full text-left text-[11px]">
                    <thead className="sticky top-0 bg-mist text-[9px] text-slate-400 uppercase">
                      <tr>
                        <th className="px-2.5 py-1 font-bold">Code</th>
                        <th className="w-8 px-1 py-1" />
                      </tr>
                    </thead>
                    <tbody>
                      {codes.map((c) => {
                        const on = c.id in selectedReasons
                        return (
                          <tr key={c.id}>
                            <td className="p-0" colSpan={2}>
                              <button
                                type="button"
                                disabled={!canEditWeek}
                                onClick={() => toggleCode(c.id)}
                                className={`flex w-full items-center justify-between px-2.5 py-1.5 text-left tabular-nums disabled:cursor-not-allowed disabled:opacity-60 ${
                                  on
                                    ? 'bg-green-50 font-bold text-green-800'
                                    : 'text-ink hover:bg-mist'
                                }`}
                              >
                                <span>{c.id}</span>
                                {on && <Check className="h-3.5 w-3.5 shrink-0 text-brand" />}
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="shrink-0 border-t border-line px-2.5 py-1 text-[9px] text-slate-400">
                  {REASON_CODES.length} codes
                </p>
              </div>
              <div className="flex min-h-0 flex-col">
                <p className="shrink-0 border-b border-line bg-mist/30 px-2.5 py-1.5 text-[9px] font-bold tracking-wide text-slate-400 uppercase">
                  Selected varieties &amp; reasons
                  {selectedCodes.length > 0 && (
                    <span className="ml-1 rounded bg-brand/15 px-1.5 py-0.5 text-[9px] font-bold text-brand normal-case tracking-normal">
                      {selectedCodes.length}
                    </span>
                  )}
                </p>
                <div className="custom-scroll min-h-0 flex-1 overflow-y-auto p-2">
                  {selectedCodes.length === 0 ? (
                    <p className="px-1 py-4 text-center text-[11px] text-slate-500">
                      Select codes on the left. Type your reason in the input on each row.
                    </p>
                  ) : (
                    <ul className="space-y-1.5">
                      {selectedCodes.map((id) => (
                        <li
                          key={id}
                          className="flex items-center gap-2 rounded border border-line bg-white px-2 py-1.5"
                        >
                          <span className="shrink-0 text-[10px] font-bold tabular-nums text-ink">
                            {id}
                          </span>
                          <input
                            type="text"
                            value={selectedReasons[id] ?? ''}
                            disabled={!canEditWeek}
                            onChange={(e) => setReasonText(id, e.target.value)}
                            placeholder="Reason for Not Picking…"
                            className="lp-input min-w-0 flex-1 px-2 py-1 text-[11px] disabled:opacity-50"
                          />
                          <button
                            type="button"
                            disabled={!canEditWeek}
                            onClick={() => toggleCode(id)}
                            className="shrink-0 rounded p-0.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                            title="Remove"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
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
            </div>
          </div>
          <div className="rounded-[8px] border border-line bg-green-50/60 p-3 text-[11px] text-slate-600">
            <p className="font-bold text-navy">Day tip</p>
            <p className="mt-1 leading-relaxed">
              Click or drag across row columns to schedule picking for{' '}
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
  onPaint,
  onAll,
  canPlan,
}: {
  title: string
  rows: number[]
  isOn: (row: number) => boolean
  onPaint: (row: number, on: boolean) => void
  onAll: (on: boolean) => void
  canPlan: boolean
}) {
  const dragging = useRef(false)
  const paintOn = useRef(true)
  const allOn = rows.length > 0 && rows.every(isOn)

  useEffect(() => {
    const stop = () => {
      dragging.current = false
    }
    window.addEventListener('pointerup', stop)
    window.addEventListener('pointercancel', stop)
    return () => {
      window.removeEventListener('pointerup', stop)
      window.removeEventListener('pointercancel', stop)
    }
  }, [])

  return (
    <div className="rounded-[8px] border border-line px-1.5 py-1.5 sm:px-2">
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
          <span className="text-slate-400">{rows.length} rows</span>
        </div>
      </div>
      <div className="grid-select-none flex w-full gap-px">
        {rows.map((row) => {
          const on = isOn(row)
          return (
            <button
              key={row}
              type="button"
              title={`Row ${row}`}
              disabled={!canPlan}
              onPointerDown={(e) => {
                if (!canPlan) return
                e.preventDefault()
                dragging.current = true
                paintOn.current = !on
                onPaint(row, paintOn.current)
              }}
              onPointerEnter={() => {
                if (!dragging.current || !canPlan) return
                onPaint(row, paintOn.current)
              }}
              onClick={(e) => {
                e.preventDefault()
              }}
              className="flex min-w-0 flex-1 touch-none flex-col items-center hover:opacity-90 disabled:cursor-default"
            >
              <span
                className={`mb-0.5 text-[7px] font-bold tabular-nums leading-none sm:text-[8px] ${
                  on ? 'text-brand' : 'text-slate-500'
                }`}
              >
                {row}
              </span>
              <span className="relative h-14 w-full max-w-[0.65rem] sm:h-16">
                <span
                  className={`absolute top-0 bottom-0 left-1/2 w-px -translate-x-1/2 ${
                    on ? 'bg-brand' : 'bg-slate-300'
                  }`}
                />
                {DOT_TOPS.map((top) => (
                  <span
                    key={top}
                    className={`absolute left-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full border sm:h-1.5 sm:w-1.5 ${
                      on ? 'border-brand bg-brand' : 'border-slate-400 bg-white'
                    }`}
                    style={{ top }}
                  />
                ))}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
