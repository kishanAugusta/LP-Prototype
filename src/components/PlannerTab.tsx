import { useMemo, useState, type ReactNode } from 'react'
import { Lock, MapPin } from 'lucide-react'
import {
  formatWeekRange,
  isoWeek,
  toISODate,
  weeksInYear,
} from '../lib/time'
import { useStore } from '../store/AppContext'
import { Accordion } from './Accordion'
import { AnnualLabourBudgetGrid } from './AnnualLabourBudgetGrid'
import { BiWeeklyLabourGrid } from './BiWeeklyLabourGrid'
import { FarmMapModal } from './FarmMapModal'
import { GanttPlanGrid } from './GanttPlanGrid'
import { HarvestPlanGrid } from './HarvestPlanGrid'
import { PLAN_TYPE_OPTIONS, type PlanType } from '../types'

const GROUPS = [...new Set(PLAN_TYPE_OPTIONS.map((o) => o.group))]

export function PlannerTab() {
  const {
    state,
    dispatch,
    visibleFarms,
    farmCommodities,
    canPlan,
  } = useStore()
  const [notesOpen, setNotesOpen] = useState(false)
  const yearWeeks = useMemo(() => weeksInYear(state.year), [state.year])
  const showWeek = state.planType !== 'labour-monthly'
  const showCommodity =
    state.planType === 'labour-weekly' ||
    state.planType === 'labour-monthly' ||
    state.planType === 'tearout-gantt' ||
    state.planType === 'planting-gantt'

  return (
    <div className="lp-workspace lp-page flex flex-1 flex-col">
      <div className="lp-sticky-bar">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div>
            <p className="lp-kicker">Planner</p>
            <h2 className="text-lg font-extrabold tracking-tight text-ink">Labour schedule</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-5">
          <Field label="Plan type">
            <select
              value={state.planType}
              onChange={(e) => dispatch({ type: 'setPlanType', planType: e.target.value as PlanType })}
              className="lp-select w-full border-brand px-2.5 py-1.5 text-sm font-bold ring-1 ring-brand/30"
            >
              {GROUPS.map((group) => (
                <optgroup key={group} label={group}>
                  {PLAN_TYPE_OPTIONS.filter((o) => o.group === group).map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </Field>
          {showWeek && (
            <Field label="Planning week">
              <select
                value={state.weekStartISO}
                onChange={(e) => dispatch({ type: 'setWeek', iso: e.target.value })}
                className="lp-select w-full px-2.5 py-1.5 text-sm"
              >
                {yearWeeks.map((w) => {
                  const iso = toISODate(w)
                  const { week } = isoWeek(w)
                  return (
                    <option key={iso} value={iso}>
                      Week {week} · {formatWeekRange(w).split(' · ')[1]}
                    </option>
                  )
                })}
              </select>
            </Field>
          )}
          <Field label="Year">
            <select
              value={state.year}
              onChange={(e) => dispatch({ type: 'setYear', year: Number(e.target.value) })}
              className="lp-select w-full px-2.5 py-1.5 text-sm"
            >
              {[2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Farm">
            <div className="flex gap-1.5">
              <select
                value={state.farmId}
                onChange={(e) => dispatch({ type: 'setFarm', farmId: e.target.value })}
                className="lp-select w-full px-2.5 py-1.5 text-sm"
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
                className="lp-btn-ghost shrink-0 px-2 py-1.5"
                title="Show map"
              >
                <MapPin className="h-3.5 w-3.5 text-brand" />
              </button>
            </div>
          </Field>
          {showCommodity && (
            <Field label="Commodity">
              <select
                value={state.commodityId}
                onChange={(e) => dispatch({ type: 'setCommodity', commodityId: e.target.value })}
                className="lp-select w-full px-2.5 py-1.5 text-sm"
              >
                {farmCommodities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
          )}
        </div>
      </div>

      <FarmMapModal />

      <div className="lp-workspace-main min-h-0">
        {state.planType === 'labour-weekly' && <BiWeeklyLabourGrid />}
        {state.planType === 'labour-monthly' && <AnnualLabourBudgetGrid />}
        {state.planType === 'harvest-weekly' && <HarvestPlanGrid />}
        {state.planType === 'tearout-gantt' && <GanttPlanGrid planType="tearout-gantt" />}
        {state.planType === 'planting-gantt' && <GanttPlanGrid planType="planting-gantt" />}
      </div>

      <div className="lp-sticky-submit p-3">
        <Accordion
          id="planner-notes"
          title="Notes & submit"
          open={notesOpen}
          onToggle={() => setNotesOpen((v) => !v)}
          badge={
            state.noteBody.trim() ? (
              <span className="rounded bg-brand/15 px-1.5 py-0.5 text-[9px] font-bold text-brand normal-case tracking-normal">
                Draft
              </span>
            ) : null
          }
        >
          <input
            value={state.noteSubject}
            onChange={(e) => dispatch({ type: 'setNoteDraft', subject: e.target.value })}
            placeholder="Subject (e.g. Weather Delay, Historic Override)"
            className="lp-input mb-2 w-full px-3 py-2 text-sm"
          />
          <textarea
            rows={2}
            value={state.noteBody}
            onChange={(e) => dispatch({ type: 'setNoteDraft', body: e.target.value })}
            placeholder="Add operational notes…"
            className="lp-input mb-3 w-full px-3 py-2 text-sm"
          />
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => dispatch({ type: 'addNote' })}
              className="lp-btn-ghost px-4 py-2 text-sm"
            >
              Save note
            </button>
            <button
              type="button"
              disabled={!state.online || !canPlan}
              onClick={() => dispatch({ type: 'requestSubmit' })}
              className="lp-btn-primary px-6 py-2 text-sm"
            >
              Submit Plan
            </button>
          </div>
        </Accordion>
        {!notesOpen && (
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              disabled={!state.online || !canPlan}
              onClick={() => dispatch({ type: 'requestSubmit' })}
              className="lp-btn-primary px-6 py-2 text-sm"
            >
              Submit Plan
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 space-y-0.5">
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
      <div className="relative w-full max-w-md rounded-[14px] border border-line bg-white p-6 shadow-2xl shadow-navy/20">
        <div className="mb-3 flex items-center gap-2 text-sunset">
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-orange-50 ring-1 ring-orange-100">
            <Lock className="h-4 w-4" />
          </span>
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
