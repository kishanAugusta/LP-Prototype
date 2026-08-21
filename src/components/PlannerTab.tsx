import { useState, type ReactNode } from 'react'
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  Info,
  Lock,
  WandSparkles,
} from 'lucide-react'
import {
  formatWeekRange,
  monthLabel,
  toISODate,
  weekDates,
  weeksInMonth,
} from '../lib/time'
import { useStore } from '../store/AppContext'
import { ScheduleGrid } from './ScheduleGrid'
import type { Horizon } from '../types'

export function PlannerTab() {
  const {
    state,
    dispatch,
    visibleFarms,
    farmCommodities,
    farmActivities,
    recommendation,
    weekHours,
    weekFte,
    canPlan,
  } = useStore()
  const [showLogic, setShowLogic] = useState(false)
  const weekStart = new Date(state.weekStartISO + 'T00:00:00')
  const dates = weekDates(weekStart)
  const gridReady = Boolean(state.activityId)
  const showRec = gridReady && recommendation && !state.recDismissed && canPlan

  return (
    <div>
      <section className="mb-4 rounded-[8px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 border-b border-slate-100 pb-5">
          <div className="mb-3 flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-bold text-slate-800">Planning Horizon</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['weekly', 'monthly', 'yearly'] as Horizon[]).map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => dispatch({ type: 'setHorizon', horizon: h })}
                className={`rounded-[8px] px-4 py-2 text-sm font-bold capitalize ${
                  state.horizon === h
                    ? 'bg-green-50 text-brand ring-2 ring-brand'
                    : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {h}
              </button>
            ))}
            <select
              value={state.year}
              onChange={(e) => dispatch({ type: 'setYear', year: Number(e.target.value) })}
              className="w-24 rounded-[8px] border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
            >
              {[2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          {state.horizon === 'weekly' && (
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={() => dispatch({ type: 'shiftWeek', delta: -1 })}
                className="rounded-[8px] border border-slate-200 p-2 hover:bg-slate-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <p className="text-sm font-bold text-slate-800">{formatWeekRange(weekStart)}</p>
              <button
                type="button"
                onClick={() => dispatch({ type: 'shiftWeek', delta: 1 })}
                className="rounded-[8px] border border-slate-200 p-2 hover:bg-slate-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-bold text-slate-800">Operational Scope</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Field label="Farm">
              <select
                value={state.farmId}
                onChange={(e) => dispatch({ type: 'setFarm', farmId: e.target.value })}
                className="w-full rounded-[8px] border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-brand"
              >
                {visibleFarms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Commodity">
              <select
                value={state.commodityId}
                onChange={(e) => dispatch({ type: 'setCommodity', commodityId: e.target.value })}
                className="w-full rounded-[8px] border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-brand"
              >
                {farmCommodities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <div className="space-y-1 rounded-md border border-slate-200 bg-slate-50 p-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                Active Activity (unlocks grid)
              </label>
              <select
                value={state.activityId}
                onChange={(e) => dispatch({ type: 'setActivity', activityId: e.target.value })}
                className="w-full rounded-[8px] border border-slate-300 px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-brand"
              >
                <option value="">Select activity…</option>
                {farmActivities.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {state.horizon !== 'weekly' && <HorizonDrilldown />}

      {showRec && recommendation && (
        <div className="mb-6 rounded-[8px] border border-blue-200 bg-blue-50 p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <WandSparkles className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-bold text-blue-900">Historic Baseline Recommendation</p>
                <p className="text-xs text-blue-700">{recommendation.sourceLabel}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowLogic((v) => !v)}
                className="flex items-center gap-1 rounded px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-100"
              >
                <ChevronDown className={`h-3 w-3 ${showLogic ? 'rotate-180' : ''}`} />
                View Logic
              </button>
              <button
                type="button"
                onClick={() => dispatch({ type: 'dismissRec' })}
                className="rounded px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-100"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={() => dispatch({ type: 'applyRecommendation' })}
                className="rounded bg-blue-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
              >
                Apply Recommendation
              </button>
            </div>
          </div>
          {showLogic && (
            <div className="mt-4 grid grid-cols-1 gap-3 border-t border-blue-200 pt-4 md:grid-cols-5">
              {recommendation.reasons.map((r) => (
                <div key={r.week} className="rounded-[8px] bg-white p-3 text-xs">
                  <p className="font-bold text-blue-900">{r.week}</p>
                  <p className="text-slate-600">{Math.round(r.frequency * 100)}% recurrence</p>
                  <p className="font-bold text-slate-800">{r.avgHeadcount} avg people</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {(state.horizon === 'weekly' || state.expandedWeekISO) && (
        <section className="mb-6 rounded-[8px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-xs font-semibold text-slate-500">Number of people</label>
              <input
                type="text"
                inputMode="numeric"
                value={String(state.people)}
                disabled={!gridReady || !canPlan}
                onChange={(e) => {
                  const v = e.target.value
                  if (v === '') {
                    dispatch({ type: 'setPeople', people: 0 })
                    return
                  }
                  if (!/^\d+$/.test(v)) return
                  dispatch({ type: 'setPeople', people: Number(v) })
                }}
                className="w-20 rounded-[8px] border border-slate-300 px-3 py-1 text-sm outline-none focus:ring-1 focus:ring-brand disabled:bg-slate-100 disabled:text-slate-400"
              />
              <span className="rounded border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                {gridReady
                  ? 'Enter a headcount, then click-and-drag across 30-minute slots.'
                  : 'Select an activity header to unlock the grid.'}
              </span>
            </div>
            <div className="rounded bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
              {state.horizon === 'weekly' ? 'Weekly 30-minute view' : 'Expanded week'}
            </div>
          </div>
          <ScheduleGrid
            dates={
              state.horizon === 'weekly'
                ? dates
                : weekDates(new Date((state.expandedWeekISO ?? state.weekStartISO) + 'T00:00:00'))
            }
          />
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
            <span className="text-slate-500">
              <Info className="mr-1 inline h-3.5 w-3.5" />
              Past days are locked (BR-001). 5 people × 6 slots = 15.0 hours.
            </span>
            <span className="rounded border border-slate-200 bg-slate-100 px-3 py-1 font-bold text-slate-800 shadow-sm">
              Grand total:{' '}
              <span className="ml-1 font-extrabold text-brand">{weekHours.toFixed(1)} hrs</span>
              <span className="ml-3 text-slate-500">FTE {weekFte.toFixed(2)}</span>
            </span>
          </div>
        </section>
      )}

      <section className="rounded-[8px] border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 border-b border-slate-100 pb-2 text-sm font-bold text-slate-800">
          Labour Schedule Notes
        </h3>
        <input
          value={state.noteSubject}
          onChange={(e) => dispatch({ type: 'setNoteDraft', subject: e.target.value })}
          placeholder="Subject (e.g. Weather Delay, Historic Override)"
          className="mb-3 w-full rounded-[8px] border border-slate-300 px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-brand"
        />
        <textarea
          rows={3}
          value={state.noteBody}
          onChange={(e) => dispatch({ type: 'setNoteDraft', body: e.target.value })}
          placeholder="Add operational notes or reason for overriding historic recommendation..."
          className="mb-4 w-full rounded-[8px] border border-slate-300 px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-brand"
        />
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => dispatch({ type: 'addNote' })}
            className="rounded-[8px] border border-slate-300 bg-white px-5 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            Save note
          </button>
          <button
            type="button"
            disabled={!state.online || !canPlan}
            onClick={() => dispatch({ type: 'requestSubmit' })}
            className="rounded-[8px] bg-brand px-8 py-2 font-bold text-white shadow transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            Submit Schedule
          </button>
        </div>
      </section>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</label>
      {children}
    </div>
  )
}

function HorizonDrilldown() {
  const { state, dispatch, weekHours } = useStore()
  if (state.horizon === 'yearly') {
    return (
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 12 }, (_, month) => (
          <button
            key={month}
            type="button"
            onClick={() => dispatch({ type: 'setMonth', year: state.year, month })}
            className="rounded-[8px] border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-brand"
          >
            <p className="text-sm font-bold text-slate-800">{monthLabel(state.year, month)}</p>
            <p className="mt-1 text-xs text-slate-500">Click to open monthly weeks</p>
          </button>
        ))}
      </div>
    )
  }

  const weeks = weeksInMonth(state.year, state.month)
  return (
    <div className="mb-6 rounded-[8px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800">{monthLabel(state.year, state.month)}</h3>
        <p className="text-xs text-slate-500">Click a week to expand the 30-minute grid</p>
      </div>
      <div className="space-y-2">
        {weeks.map((ws) => {
          const iso = toISODate(ws)
          const open = state.expandedWeekISO === iso
          return (
            <button
              key={iso}
              type="button"
              onClick={() => dispatch({ type: 'expandWeek', iso: open ? null : iso })}
              className={`flex w-full items-center justify-between rounded-[8px] border px-4 py-3 text-left ${
                open ? 'border-brand bg-green-50' : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span className="text-sm font-bold text-slate-800">{formatWeekRange(ws)}</span>
              <span className="text-xs font-bold text-slate-500">
                {open ? `Expanded · ${weekHours.toFixed(1)} hrs` : 'Expand'}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function ReasonModal() {
  const { state, dispatch } = useStore()
  if (!state.reasonOpen) return null
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50"
        onClick={() => dispatch({ type: 'cancelReason' })}
      />
      <div className="relative w-full max-w-md rounded-[8px] bg-white p-6 shadow-2xl">
        <div className="mb-3 flex items-center gap-2 text-amber-600">
          <Lock className="h-5 w-5" />
          <h3 className="text-sm font-bold text-slate-800">Reason for change required</h3>
        </div>
        <p className="mb-3 text-xs text-slate-600">
          This farm / week / activity was already submitted. BR-002 requires an audit reason before the
          revision can be saved.
        </p>
        <textarea
          rows={4}
          value={state.pendingReason}
          onChange={(e) => dispatch({ type: 'setPendingReason', reason: e.target.value })}
          className="mb-4 w-full rounded-[8px] border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-brand"
          placeholder="Why is this schedule being changed?"
        />
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => dispatch({ type: 'cancelReason' })}
            className="rounded-[8px] border border-slate-300 px-4 py-2 text-sm font-bold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => dispatch({ type: 'confirmSubmit' })}
            className="rounded-[8px] bg-brand px-4 py-2 text-sm font-bold text-white"
          >
            Save revision
          </button>
        </div>
      </div>
    </div>
  )
}
