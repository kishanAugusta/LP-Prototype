import { useState, type ReactNode } from 'react'
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  Info,
  Lock,
  MapPin,
  WandSparkles,
} from 'lucide-react'
import { greenhouseHouses } from '../data/mock'
import {
  formatWeekRange,
  SLOT_LABELS,
  weekDates,
} from '../lib/time'
import { useStore } from '../store/AppContext'
import { FarmMapModal } from './FarmMapModal'
import { HouseRowsGrid } from './HouseRowsGrid'
import { MonthlyBudgetGrid } from './MonthlyBudgetGrid'
import { ScheduleGrid } from './ScheduleGrid'
import type { Horizon, HouseId } from '../types'

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
  const minutesPerRow = state.calibrations.find((c) => c.activityId === state.activityId)?.minutesPerRow
  const estRows = minutesPerRow && weekHours > 0 ? (weekHours * 60) / minutesPerRow : null
  const farmShifts = state.shifts.filter((s) => s.farmId === state.farmId || s.farmId === 'all')

  return (
    <div>
      <div className="mb-5">
        <p className="lp-kicker">Planner</p>
        <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-ink">Labour schedule</h2>
      </div>
      <section className="lp-panel mb-4 p-6">
        <div className="mb-5 border-b border-line pb-5">
          <div className="mb-3 flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-teal" />
            <h2 className="text-sm font-bold text-ink">Planning Horizon</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['weekly', 'monthly'] as Horizon[]).map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => dispatch({ type: 'setHorizon', horizon: h })}
                className={`lp-chip px-4 py-2 capitalize ${
                  state.horizon === h ? 'lp-chip-on' : 'text-slate-600 hover:bg-[#f4faf5]'
                }`}
              >
                {h}
              </button>
            ))}
            <span className="mx-1 hidden h-8 w-px bg-line sm:inline-block" aria-hidden />
            {greenhouseHouses.map((house) => (
              <button
                key={house.id}
                type="button"
                onClick={() => dispatch({ type: 'setHouse', houseId: house.id as HouseId })}
                className={`lp-chip px-4 py-2 ${
                  state.houseId === house.id ? 'lp-chip-on' : 'text-slate-600 hover:bg-[#f4faf5]'
                }`}
              >
                {house.name}
              </button>
            ))}
            <select
              value={state.year}
              onChange={(e) => dispatch({ type: 'setYear', year: Number(e.target.value) })}
              className="lp-select w-24 px-3 py-2 text-sm"
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
                className="lp-btn-ghost p-2"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <p className="text-sm font-bold text-ink">{formatWeekRange(weekStart)}</p>
              <button
                type="button"
                onClick={() => dispatch({ type: 'shiftWeek', delta: 1 })}
                className="lp-btn-ghost p-2"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2">
            <Filter className="h-4 w-4 text-teal" />
            <h2 className="text-sm font-bold text-ink">Operational Scope</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Field label="Farm">
              <div className="flex gap-2">
                <select
                  value={state.farmId}
                  onChange={(e) => dispatch({ type: 'setFarm', farmId: e.target.value })}
                  className="lp-select w-full px-3 py-2 text-sm"
                >
                  {visibleFarms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'toggleMap', open: true })}
                  className="lp-btn-ghost flex shrink-0 items-center gap-1 px-3 py-2 text-xs"
                >
                  <MapPin className="h-3.5 w-3.5 text-brand" />
                  Show maps
                </button>
              </div>
            </Field>
            <Field label="Commodity">
              <select
                value={state.commodityId}
                onChange={(e) => dispatch({ type: 'setCommodity', commodityId: e.target.value })}
                className="lp-select w-full px-3 py-2 text-sm"
              >
                {farmCommodities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <div className="space-y-1 rounded-[8px] border border-teal/25 bg-teal/5 p-2">
              <label className="lp-label text-teal">Active Activity (unlocks grid)</label>
              <select
                value={state.activityId}
                onChange={(e) => dispatch({ type: 'setActivity', activityId: e.target.value })}
                className="lp-select w-full px-3 py-2 text-sm font-bold"
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

      {state.horizon === 'monthly' && (
        <>
          <section className="lp-panel mb-4 flex flex-wrap items-center gap-3 p-4">
            <label className="text-xs font-semibold text-slate-500">Number of people</label>
            <input
              type="text"
              inputMode="numeric"
              value={String(state.people)}
              disabled={!canPlan}
              onChange={(e) => {
                const v = e.target.value
                if (v === '') {
                  dispatch({ type: 'setPeople', people: 0 })
                  return
                }
                if (!/^\d+$/.test(v)) return
                dispatch({ type: 'setPeople', people: Number(v) })
              }}
              className="lp-input w-20 px-3 py-1 text-sm disabled:bg-mist disabled:text-slate-400"
            />
            <label className="text-xs font-semibold text-slate-500">Rate / hr ($)</label>
            <input
              type="text"
              inputMode="decimal"
              value={String(state.ratePerHour)}
              disabled={!canPlan}
              onChange={(e) => {
                const v = e.target.value
                if (v === '') {
                  dispatch({ type: 'setRate', ratePerHour: 0 })
                  return
                }
                if (!/^\d*\.?\d{0,2}$/.test(v)) return
                dispatch({ type: 'setRate', ratePerHour: Number(v) })
              }}
              className="lp-input w-20 px-3 py-1 text-sm disabled:bg-mist disabled:text-slate-400"
            />
            <span className="rounded-[8px] bg-navy px-3 py-1 text-xs font-bold text-white">
              Monthly budget + {greenhouseHouses.find((h) => h.id === state.houseId)?.name} rows
            </span>
          </section>
          <MonthlyBudgetGrid />
          <HouseRowsGrid />
        </>
      )}
      <FarmMapModal />

      {showRec && recommendation && (
        <div className="mb-6 rounded-[8px] border border-teal/25 bg-teal/5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <WandSparkles className="h-5 w-5 text-teal" />
              <div>
                <p className="text-sm font-bold text-navy">Historic Baseline Recommendation</p>
                <p className="text-xs text-teal">{recommendation.sourceLabel}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowLogic((v) => !v)}
                className="flex items-center gap-1 rounded-[8px] px-3 py-1.5 text-xs font-bold text-teal hover:bg-white"
              >
                <ChevronDown className={`h-3 w-3 ${showLogic ? 'rotate-180' : ''}`} />
                View Logic
              </button>
              <button
                type="button"
                onClick={() => dispatch({ type: 'dismissRec' })}
                className="rounded-[8px] px-3 py-1.5 text-xs font-bold text-teal hover:bg-white"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={() => dispatch({ type: 'applyRecommendation' })}
                className="rounded-[8px] bg-navy px-4 py-1.5 text-xs font-bold text-white hover:bg-[#1c4a3a]"
              >
                Apply Recommendation
              </button>
            </div>
          </div>
          {showLogic && (
            <div className="mt-4 grid grid-cols-1 gap-3 border-t border-teal/20 pt-4 md:grid-cols-5">
              {recommendation.reasons.map((r) => (
                <div key={r.week} className="rounded-[8px] bg-white p-3 text-xs">
                  <p className="font-bold text-navy">{r.week}</p>
                  <p className="text-slate-600">{Math.round(r.frequency * 100)}% recurrence</p>
                  <p className="font-bold text-slate-800">{r.avgHeadcount} avg people</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {(state.horizon === 'weekly' || state.expandedWeekISO) && (
        <section className="lp-panel mb-6 p-4">
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
                className="lp-input w-20 px-3 py-1 text-sm disabled:bg-mist disabled:text-slate-400"
              />
              <label className="text-xs font-semibold text-slate-500">Rate / hr ($)</label>
              <input
                type="text"
                inputMode="decimal"
                value={String(state.ratePerHour)}
                disabled={!canPlan}
                onChange={(e) => {
                  const v = e.target.value
                  if (v === '') {
                    dispatch({ type: 'setRate', ratePerHour: 0 })
                    return
                  }
                  if (!/^\d*\.?\d{0,2}$/.test(v)) return
                  dispatch({ type: 'setRate', ratePerHour: Number(v) })
                }}
                className="lp-input w-20 px-3 py-1 text-sm disabled:bg-mist disabled:text-slate-400"
              />
              <span className="rounded-[8px] border border-line bg-mist px-3 py-1 text-xs font-bold text-slate-600">
                {gridReady
                  ? 'Enter a headcount, then click-and-drag across 30-minute slots.'
                  : 'Select an activity header to unlock the grid.'}
              </span>
            </div>
            <div className="rounded-[8px] bg-navy px-3 py-1 text-xs font-bold text-white">
              {state.horizon === 'weekly' ? 'Weekly 30-minute view' : 'Expanded week'}
            </div>
          </div>
          {canPlan && farmShifts.length > 0 && gridReady && (
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="lp-label">Apply shift</span>
              {farmShifts.map((shift) => (
                <button
                  key={shift.id}
                  type="button"
                  onClick={() => dispatch({ type: 'applyShift', shiftId: shift.id })}
                  className="lp-chip px-3 py-1 text-xs text-slate-700 hover:bg-[#f4faf5]"
                >
                  {shift.name} · {SLOT_LABELS[shift.startSlot]}–{SLOT_LABELS[Math.max(0, shift.endSlot - 1)]} ·{' '}
                  {shift.defaultHeadcount} ppl
                </button>
              ))}
            </div>
          )}
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
              Past days are locked (BR-001). 5 people × 6 slots = 15.0 hours. House:{' '}
              {greenhouseHouses.find((h) => h.id === state.houseId)?.name}.
            </span>
            <span className="rounded-[8px] border border-line bg-mist px-3 py-1 font-bold text-ink">
              Grand total:{' '}
              <span className="ml-1 font-extrabold text-brand">{weekHours.toFixed(1)} hrs</span>
              <span className="ml-3 text-slate-500">FTE {weekFte.toFixed(2)}</span>
              <span className="ml-3 text-slate-500">
                Cost ${(weekHours * state.ratePerHour).toFixed(0)}
              </span>
              {estRows != null && (
                <span className="ml-3 text-slate-500">Est. {estRows.toFixed(0)} rows</span>
              )}
            </span>
          </div>
        </section>
      )}

      <section className="lp-panel p-6">
        <h3 className="mb-4 border-b border-line pb-2 text-sm font-bold text-ink">
          Labour Schedule Notes
        </h3>
        <input
          value={state.noteSubject}
          onChange={(e) => dispatch({ type: 'setNoteDraft', subject: e.target.value })}
          placeholder="Subject (e.g. Weather Delay, Historic Override)"
          className="lp-input mb-3 w-full px-4 py-2 text-sm"
        />
        <textarea
          rows={3}
          value={state.noteBody}
          onChange={(e) => dispatch({ type: 'setNoteDraft', body: e.target.value })}
          placeholder="Add operational notes or reason for overriding historic recommendation..."
          className="lp-input mb-4 w-full px-4 py-2 text-sm"
        />
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => dispatch({ type: 'addNote' })}
            className="lp-btn-ghost px-5 py-2 text-sm"
          >
            Save note
          </button>
          <button
            type="button"
            disabled={!state.online || !canPlan}
            onClick={() => dispatch({ type: 'requestSubmit' })}
            className="lp-btn-primary px-8 py-2"
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
      <label className="lp-label">{label}</label>
      {children}
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
      <div className="relative w-full max-w-md rounded-[8px] border border-line bg-white p-6 shadow-2xl">
        <div className="mb-3 flex items-center gap-2 text-sunset">
          <Lock className="h-5 w-5" />
          <h3 className="text-sm font-bold text-ink">Reason for change required</h3>
        </div>
        <p className="mb-3 text-xs text-slate-600">
          This farm / week / activity was already submitted. BR-002 requires an audit reason before the
          revision can be saved.
        </p>
        <textarea
          rows={4}
          value={state.pendingReason}
          onChange={(e) => dispatch({ type: 'setPendingReason', reason: e.target.value })}
          className="lp-input mb-4 w-full px-3 py-2 text-sm"
          placeholder="Why is this schedule being changed?"
        />
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => dispatch({ type: 'cancelReason' })}
            className="lp-btn-ghost px-4 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => dispatch({ type: 'confirmSubmit' })}
            className="lp-btn-primary px-4 py-2 text-sm"
          >
            Save revision
          </button>
        </div>
      </div>
    </div>
  )
}
