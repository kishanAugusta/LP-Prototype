import { useEffect, useRef } from 'react'
import { Lock } from 'lucide-react'
import { hoursFromHeadcount, isPastDay, SLOT_COUNT, SLOT_LABELS, toISODate } from '../lib/time'
import { useStore } from '../store/AppContext'
import type { Cell } from '../types'

function cellTone(headcount: number, locked: boolean) {
  if (locked && headcount === 0) return 'bg-slate-100 text-slate-400 cursor-not-allowed'
  if (locked) return 'bg-slate-200 text-slate-600 cursor-not-allowed'
  if (headcount === 0) return 'bg-white hover:bg-green-50 text-slate-300'
  if (headcount <= 3) return 'bg-green-100 text-green-800 font-bold'
  if (headcount <= 6) return 'bg-brand/80 text-white font-bold'
  return 'bg-brand-dark text-white font-bold'
}

export function ScheduleGrid({ dates }: { dates: Date[] }) {
  const { state, dispatch, canPlan } = useStore()
  const dragging = useRef(false)

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

  const unlocked = canPlan && Boolean(state.activityId)

  function getCell(date: string, slot: number): Cell | undefined {
    return state.cells[`${state.farmId}|${state.commodityId}|${state.activityId}|${date}|${slot}`]
  }

  function paint(date: string, slot: number, locked: boolean) {
    if (!unlocked || locked) return
    dispatch({ type: 'fillCells', dates: [date], slots: [slot] })
  }

  const dayHours = dates.map((d) => {
    const date = toISODate(d)
    let hours = 0
    for (let slot = 0; slot < SLOT_COUNT; slot++) {
      hours += hoursFromHeadcount(getCell(date, slot)?.headcount ?? 0)
    }
    return hours
  })
  const grand = dayHours.reduce((a, b) => a + b, 0)

  return (
    <div className="overflow-x-auto overflow-y-auto custom-scroll max-h-[620px] rounded-[8px] border border-slate-200">
      <table className="w-full min-w-[860px] border-collapse grid-select-none text-xs">
        <thead className="sticky top-0 z-20 bg-slate-50 text-slate-600 shadow-sm">
          <tr>
            <th className="w-28 border-b border-r border-slate-200 p-2 text-left font-bold uppercase tracking-wider">
              Time
            </th>
            {dates.map((d) => {
              const locked = isPastDay(toISODate(d))
              return (
                <th key={toISODate(d)} className="border-b border-r border-slate-200 p-2 text-center font-bold">
                  <div className="uppercase tracking-wide">
                    {d.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className="mt-0.5 flex items-center justify-center gap-1 font-semibold text-slate-500">
                    {locked && <Lock className="h-3 w-3" />}
                    {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {SLOT_LABELS.map((label, slot) => (
            <tr key={label}>
              <td className="sticky left-0 z-10 border-b border-r border-slate-200 bg-white px-2 py-1 font-semibold text-slate-500">
                {label}
              </td>
              {dates.map((d) => {
                const date = toISODate(d)
                const locked = isPastDay(date) || !unlocked
                const headcount = getCell(date, slot)?.headcount ?? 0
                return (
                  <td key={date + slot} className="border-b border-r border-slate-100 p-0">
                    <button
                      type="button"
                      onPointerDown={(e) => {
                        e.preventDefault()
                        dragging.current = true
                        paint(date, slot, locked)
                      }}
                      onPointerEnter={() => {
                        if (dragging.current) paint(date, slot, locked)
                      }}
                      className={`flex h-8 w-full touch-none items-center justify-center ${cellTone(headcount, locked)}`}
                    >
                      {headcount || ''}
                    </button>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
        <tfoot className="sticky bottom-0 z-20 bg-slate-100 shadow-md">
          <tr>
            <td className="border-r border-slate-200 p-2 font-bold uppercase text-slate-600">Hours</td>
            {dayHours.map((hours, i) => (
              <td key={i} className="p-2 text-center font-extrabold text-slate-800">
                {hours.toFixed(1)}
              </td>
            ))}
          </tr>
          <tr>
            <td className="bg-brand p-2 font-bold uppercase text-white">Total</td>
            <td className="bg-brand p-2 text-center font-extrabold text-white" colSpan={dates.length}>
              {grand.toFixed(1)} hrs
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
