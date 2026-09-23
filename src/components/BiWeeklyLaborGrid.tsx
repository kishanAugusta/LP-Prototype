import { useEffect, useRef, useState } from 'react'
import { ChevronRight, Eraser, Layers, Lock } from 'lucide-react'
import {
  isCellInRect,
  rectSelection,
  resolveSlotPaintMode,
  type SlotPaintMode,
} from '../lib/slotSelection'
import {
  biWeekDates,
  hoursFromHeadcount,
  isPastPlanningWeek,
  SLOT_COUNT,
  SLOT_LABELS,
  toISODate,
  weekDates,
} from '../lib/time'
import { useStore } from '../store/AppContext'

/** Labor activities shown in the bi-weekly planner (excludes tear-out / planting). */
const LABOR_ACTIVITY_IDS = [
  'act-clipping',
  'act-deleafing',
  'act-lowering',
  'act-pruning',
  'act-scouting',
  'act-twisting',
]

type DaySpan = 7 | 14

type DragRect = {
  mode: SlotPaintMode
  startDay: number
  startSlot: number
  endDay: number
  endSlot: number
}

export function BiWeeklyLaborGrid() {
  const { state, dispatch, farmActivities, canPlan } = useStore()
  const [daySpan, setDaySpan] = useState<DaySpan>(14)
  const weekStart = new Date(state.weekStartISO + 'T00:00:00')
  const dates = daySpan === 14 ? biWeekDates(weekStart) : weekDates(weekStart)
  const dateISOs = dates.map(toISODate)
  const pastWeekLocked = isPastPlanningWeek(state.weekStartISO)
  const canEditWeek = canPlan && !pastWeekLocked
  const activities = farmActivities.filter((a) => LABOR_ACTIVITY_IDS.includes(a.id))
  const selectedActivityId = state.activityId
  const activityExpanded = Boolean(selectedActivityId)
  const expandedActivity = activities.find((a) => a.id === selectedActivityId)

  function dayHours(activityId: string, date: string): number {
    let hours = 0
    for (let slot = 0; slot < SLOT_COUNT; slot++) {
      const key = `${state.farmId}|${state.houseId}|${state.commodityId}|${activityId}|${date}|${slot}`
      hours += hoursFromHeadcount(state.cells[key]?.headcount ?? 0)
    }
    return hours
  }

  function applyRect(
    activityId: string,
    mode: SlotPaintMode,
    dayStart: number,
    dayEnd: number,
    slotStart: number,
    slotEnd: number,
  ) {
    if (!canEditWeek) return
    const { dates: selectedDates, slots } = rectSelection({
      dateISOs,
      startDay: dayStart,
      endDay: dayEnd,
      startSlot: slotStart,
      endSlot: slotEnd,
    })
    if (selectedDates.length === 0 || slots.length === 0) return

    if (mode === 'erase') {
      dispatch({
        type: 'clearCells',
        dates: selectedDates,
        slots,
        activityId,
      })
      return
    }
    if (state.people < 1) return
    dispatch({
      type: 'fillCells',
      dates: selectedDates,
      slots,
      activityId,
    })
  }

  function toggleActivity(activityId: string) {
    dispatch({
      type: 'setActivity',
      activityId: selectedActivityId === activityId ? '' : activityId,
    })
  }

  function clearSelectedActivity() {
    if (!canEditWeek || !selectedActivityId) return
    dispatch({
      type: 'clearCells',
      dates: dateISOs,
      activityId: selectedActivityId,
    })
  }

  const dayTotals = dates.map((d) => {
    const date = toISODate(d)
    return activities.reduce((sum, a) => sum + dayHours(a.id, date), 0)
  })
  const grand = dayTotals.reduce((a, b) => a + b, 0)
  const todayISO = toISODate(new Date())

  return (
    <section className="lp-panel mb-0 p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        {pastWeekLocked ? (
          <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
            <Lock className="h-3.5 w-3.5" aria-hidden />
            Past week — editing is locked.
          </p>
        ) : activityExpanded ? (
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-[11px] font-bold text-navy" htmlFor="weekly-people">
              People
            </label>
            <input
              id="weekly-people"
              type="text"
              inputMode="numeric"
              value={String(state.people)}
              disabled={!canEditWeek}
              onChange={(e) => {
                const v = e.target.value
                if (v === '') return
                if (!/^\d+$/.test(v)) return
                dispatch({ type: 'setPeople', people: Number(v) })
              }}
              className="lp-input w-14 px-2 py-1 text-[11px] font-semibold disabled:opacity-50"
              title="People to paint. 0 or matching a filled cell starts erase."
            />
            <button
              type="button"
              disabled={!canEditWeek}
              onClick={clearSelectedActivity}
              className="lp-btn-ghost flex items-center gap-1 px-2.5 py-1 text-[11px] disabled:opacity-40"
              title="Clear all slots for the expanded activity"
            >
              <Eraser className="h-3.5 w-3.5" />
              Clear activity
            </button>
            {expandedActivity && (
              <span className="text-[11px] text-slate-500">
                Editing{' '}
                <span className="font-semibold text-navy">{expandedActivity.name}</span>
                {' · '}
                Drag a square to fill. Start on the same number (or People 0) to erase.
              </span>
            )}
          </div>
        ) : (
          <p className="text-[11px] text-slate-500">
            Expand an activity below to edit people and time slots.
          </p>
        )}
        <div
          role="group"
          aria-label="Week view"
          className="inline-flex rounded-[8px] bg-navy p-0.5 text-[10px] font-bold text-white"
        >
          {(
            [
              { days: 7 as const, label: '7 day' },
              { days: 14 as const, label: '14 day' },
            ] as const
          ).map(({ days, label }) => {
            const selected = daySpan === days
            return (
              <button
                key={days}
                type="button"
                aria-pressed={selected}
                onClick={() => setDaySpan(days)}
                className={`rounded-[6px] px-2.5 py-1 transition ${
                  selected
                    ? 'bg-white text-navy'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      <div
        className={`custom-scroll overflow-auto rounded-[8px] border border-line ${
          activityExpanded ? '' : 'max-h-[min(58vh,520px)]'
        }`}
      >
        <table
          className={`w-full border-collapse grid-select-none text-[11px] ${
            daySpan === 14 ? 'min-w-[980px]' : 'min-w-[560px]'
          }`}
        >
          <thead className="sticky top-0 z-10 bg-navy text-white">
            <tr>
              <th className="sticky left-0 z-20 bg-navy px-2 py-1.5 text-left font-bold uppercase">
                Time
              </th>
              {dates.map((d, i) => {
                const dateISO = toISODate(d)
                const isToday = dateISO === todayISO
                return (
                  <th
                    key={dateISO}
                    aria-current={isToday ? 'date' : undefined}
                    className={`border-l border-white/10 px-1 py-1 text-center font-bold leading-tight ${
                      isToday ? 'bg-brand' : ''
                    }`}
                  >
                    <div>
                      {daySpan === 14 ? `W${i < 7 ? 1 : 2}-` : ''}
                      {d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
                    </div>
                    <div
                      className={`text-[10px] font-normal ${isToday ? 'text-white/90' : 'text-white/60'}`}
                    >
                      {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {activities.map((activity) => {
              const open = selectedActivityId === activity.id
              return (
                <ActivityBlock
                  key={activity.id}
                  name={activity.name}
                  open={open}
                  onToggle={() => toggleActivity(activity.id)}
                  dates={dates}
                  dayHours={(date) => dayHours(activity.id, date)}
                  canEdit={canEditWeek && open}
                  locked={pastWeekLocked}
                  activityId={activity.id}
                  farmId={state.farmId}
                  houseId={state.houseId}
                  commodityId={state.commodityId}
                  cells={state.cells}
                  people={state.people}
                  onRectCommit={(mode, dayStart, dayEnd, slotStart, slotEnd) =>
                    applyRect(activity.id, mode, dayStart, dayEnd, slotStart, slotEnd)
                  }
                />
              )
            })}
          </tbody>
          <tfoot>
            <tr className="bg-mist font-semibold text-navy">
              <td className="sticky left-0 bg-mist p-1.5 text-[10px] tracking-wide uppercase">
                Grand Totals
              </td>
              {dayTotals.map((h, i) => (
                <td key={i} className="border-l border-line p-1.5 text-center tabular-nums">
                  {h > 0 ? h.toFixed(1) : '—'}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="mt-3 flex justify-end text-[11px] text-slate-500">
        <span>
          Grand Total Hours:{' '}
          <span className="font-semibold text-navy tabular-nums">{grand.toFixed(1)}</span>
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
  canEdit,
  locked,
  activityId,
  farmId,
  houseId,
  commodityId,
  cells,
  people,
  onRectCommit,
}: {
  name: string
  open: boolean
  onToggle: () => void
  dates: Date[]
  dayHours: (date: string) => number
  canEdit: boolean
  locked: boolean
  activityId: string
  farmId: string
  houseId: string
  commodityId: string
  cells: Record<string, { headcount: number }>
  people: number
  onRectCommit: (
    mode: SlotPaintMode,
    dayStart: number,
    dayEnd: number,
    slotStart: number,
    slotEnd: number,
  ) => void
}) {
  const [drag, setDrag] = useState<DragRect | null>(null)
  const dragRef = useRef<DragRect | null>(null)
  const onRectCommitRef = useRef(onRectCommit)

  useEffect(() => {
    onRectCommitRef.current = onRectCommit
  }, [onRectCommit])

  useEffect(() => {
    const finish = () => {
      const active = dragRef.current
      if (!active) return
      dragRef.current = null
      setDrag(null)
      onRectCommitRef.current(
        active.mode,
        active.startDay,
        active.endDay,
        active.startSlot,
        active.endSlot,
      )
    }
    const cancel = () => {
      dragRef.current = null
      setDrag(null)
    }
    const onMove = (e: PointerEvent) => {
      if (!dragRef.current) return
      const el = document.elementFromPoint(e.clientX, e.clientY)
      const cell = el?.closest('[data-slot-cell]') as HTMLElement | null
      if (!cell || cell.dataset.activityId !== activityId) return
      const dayIdx = Number(cell.dataset.dayIdx)
      const slotIdx = Number(cell.dataset.slot)
      if (Number.isNaN(dayIdx) || Number.isNaN(slotIdx)) return
      const next = {
        ...dragRef.current,
        endDay: dayIdx,
        endSlot: slotIdx,
      }
      dragRef.current = next
      setDrag(next)
    }
    window.addEventListener('pointerup', finish)
    window.addEventListener('pointercancel', cancel)
    window.addEventListener('pointermove', onMove)
    return () => {
      window.removeEventListener('pointerup', finish)
      window.removeEventListener('pointercancel', cancel)
      window.removeEventListener('pointermove', onMove)
    }
  }, [activityId])

  function startDrag(dayIdx: number, slot: number, head: number) {
    if (!canEdit) return
    const next: DragRect = {
      mode: resolveSlotPaintMode(people, head),
      startDay: dayIdx,
      startSlot: slot,
      endDay: dayIdx,
      endSlot: slot,
    }
    dragRef.current = next
    setDrag(next)
  }

  function extendDrag(dayIdx: number, slot: number) {
    if (!dragRef.current) return
    const next = {
      ...dragRef.current,
      endDay: dayIdx,
      endSlot: slot,
    }
    dragRef.current = next
    setDrag(next)
  }

  return (
    <>
      <tr
        className={`border-b border-line bg-white hover:bg-green-50/40 ${
          open ? 'bg-green-50/60 ring-1 ring-inset ring-brand/20' : ''
        }`}
      >
        <td className="sticky left-0 z-[1] bg-inherit p-0">
          <button
            type="button"
            onClick={onToggle}
            className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-[11px] font-bold text-navy uppercase"
          >
            <ChevronRight
              className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition ${open ? 'rotate-90' : ''}`}
            />
            {name}
            <Layers className="ml-auto h-3.5 w-3.5 text-slate-300" />
          </button>
        </td>
        {dates.map((d) => {
          const date = toISODate(d)
          const h = dayHours(date)
          return (
            <td
              key={date}
              className="border-l border-line px-1 py-0.5 text-center tabular-nums font-normal text-slate-600"
            >
              {h > 0 ? h.toFixed(1) : ''}
            </td>
          )
        })}
      </tr>
      {open &&
        SLOT_LABELS.map((label, slot) => (
          <tr key={`${activityId}-${slot}`} className="bg-mist/40">
            <td className="sticky left-0 z-[1] border-b border-line bg-mist/90 px-2 py-0 text-[9px] leading-none font-semibold text-slate-500">
              {label}
            </td>
            {dates.map((d, dayIdx) => {
              const date = toISODate(d)
              const key = `${farmId}|${houseId}|${commodityId}|${activityId}|${date}|${slot}`
              const head = cells[key]?.headcount ?? 0
              const preview = drag ? isCellInRect(dayIdx, slot, drag) : false
              const previewWrite = preview && drag?.mode === 'write'
              const previewErase = preview && drag?.mode === 'erase'
              return (
                <td key={date} className="border-b border-l border-line p-0">
                  <button
                    type="button"
                    data-slot-cell
                    data-activity-id={activityId}
                    data-day-idx={dayIdx}
                    data-slot={slot}
                    disabled={!canEdit}
                    onPointerDown={(e) => {
                      if (!canEdit) return
                      e.preventDefault()
                      startDrag(dayIdx, slot, head)
                    }}
                    onPointerEnter={() => {
                      extendDrag(dayIdx, slot)
                    }}
                    onClick={(e) => {
                      e.preventDefault()
                    }}
                    className={`flex h-4 w-full touch-none items-center justify-center text-[9px] leading-none font-semibold ${
                      locked
                        ? head
                          ? 'cursor-not-allowed bg-slate-200 text-slate-500'
                          : 'cursor-not-allowed bg-slate-100 text-slate-400'
                        : previewErase
                          ? 'bg-rose-200/80 text-rose-900 ring-1 ring-inset ring-rose-300'
                          : previewWrite
                            ? 'bg-brand/70 text-white ring-1 ring-inset ring-brand'
                            : head
                              ? 'bg-brand text-white'
                              : 'bg-white text-slate-300 hover:bg-green-50'
                    }`}
                  >
                    {head || (previewWrite && people > 0 ? people : '')}
                  </button>
                </td>
              )
            })}
          </tr>
        ))}
    </>
  )
}
