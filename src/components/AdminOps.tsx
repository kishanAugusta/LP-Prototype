import { useState } from 'react'
import { Gauge, ShieldAlert, CalendarClock, FileBarChart } from 'lucide-react'
import { SLOT_LABELS } from '../lib/time'
import { useStore } from '../store/AppContext'

export function AdminOps() {
  return (
    <div className="space-y-6">
      <ReportProvisioning />
      <ShiftScheduler />
      <GuardrailsCard />
      <CalibrationCard />
    </div>
  )
}

function ReportProvisioning() {
  const { state, dispatch } = useStore()
  return (
    <section className="lp-panel p-6">
      <div className="mb-4 flex items-center gap-2">
        <FileBarChart className="h-4 w-4 text-teal" />
        <h3 className="text-sm font-bold tracking-wide text-ink uppercase">
          Planning report provisioning
        </h3>
      </div>
      <p className="mb-4 text-xs text-slate-500">
        Enable which labour reports are published to Power BI for each farm.
      </p>
      <div className="space-y-3">
        {state.reports.map((report) => (
          <div key={report.id} className="rounded-[8px] border border-line p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-ink">{report.name}</p>
                <p className="text-[11px] font-bold uppercase text-slate-400">{report.cadence}</p>
              </div>
              <button
                type="button"
                onClick={() => dispatch({ type: 'toggleReport', id: report.id })}
                className={`rounded-[8px] px-3 py-1.5 text-xs font-bold ${
                  report.enabled ? 'bg-brand text-white' : 'bg-mist text-slate-500'
                }`}
              >
                {report.enabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {state.farms.map((farm) => {
                const on = report.farmIds.includes(farm.id)
                return (
                  <button
                    key={farm.id}
                    type="button"
                    onClick={() => {
                      const farmIds = on
                        ? report.farmIds.filter((id) => id !== farm.id)
                        : [...report.farmIds, farm.id]
                      dispatch({ type: 'setReportFarms', id: report.id, farmIds })
                    }}
                    className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      on ? 'bg-green-50 text-green-700' : 'bg-mist text-slate-400'
                    }`}
                  >
                    {farm.name}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function ShiftScheduler() {
  const { state, dispatch } = useStore()
  const [farmId, setFarmId] = useState(state.farms[0]?.id ?? '')
  const [name, setName] = useState('Evening')
  const [startSlot, setStartSlot] = useState(16)
  const [endSlot, setEndSlot] = useState(22)
  const [headcount, setHeadcount] = useState(3)

  return (
    <section className="lp-panel p-6">
      <div className="mb-4 flex items-center gap-2">
        <CalendarClock className="h-4 w-4 text-teal" />
        <h3 className="text-sm font-bold tracking-wide text-ink uppercase">
          Daily farm shift scheduler
        </h3>
      </div>
      <p className="mb-4 text-xs text-slate-500">
        Define named shifts. Planners can apply a shift to unlocked slots from the weekly grid.
      </p>
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
        <select
          value={farmId}
          onChange={(e) => setFarmId(e.target.value)}
          className="lp-select px-3 py-2 text-sm"
        >
          <option value="all">All farms</option>
          {state.farms.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Shift name"
          className="lp-input px-3 py-2 text-sm"
        />
        <select
          value={startSlot}
          onChange={(e) => setStartSlot(Number(e.target.value))}
          className="lp-select px-3 py-2 text-sm"
        >
          {SLOT_LABELS.map((label, i) => (
            <option key={label} value={i}>
              Start {label}
            </option>
          ))}
        </select>
        <select
          value={endSlot}
          onChange={(e) => setEndSlot(Number(e.target.value))}
          className="lp-select px-3 py-2 text-sm"
        >
          {SLOT_LABELS.map((label, i) => (
            <option key={label} value={i + 1}>
              End {label}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <input
            value={String(headcount)}
            onChange={(e) => {
              if (!/^\d+$/.test(e.target.value)) return
              setHeadcount(Number(e.target.value))
            }}
            className="lp-input w-16 px-2 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => {
              if (!name.trim() || endSlot <= startSlot) return
              dispatch({
                type: 'addShift',
                shift: { farmId, name: name.trim(), startSlot, endSlot, defaultHeadcount: headcount },
              })
            }}
            className="lp-btn-primary px-3 py-2 text-sm"
          >
            Add
          </button>
        </div>
      </div>
      <div className="space-y-2">
        {state.shifts.map((shift) => (
          <div
            key={shift.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-[8px] border border-line px-3 py-2 text-sm"
          >
            <span className="font-bold text-ink">{shift.name}</span>
            <span className="text-xs text-slate-500">
              {shift.farmId === 'all' ? 'All farms' : state.farms.find((f) => f.id === shift.farmId)?.name} ·{' '}
              {SLOT_LABELS[shift.startSlot]}–{SLOT_LABELS[Math.max(0, shift.endSlot - 1)]} · {shift.defaultHeadcount}{' '}
              people
            </span>
            <button
              type="button"
              onClick={() => dispatch({ type: 'removeShift', id: shift.id })}
              className="rounded bg-pastel-red px-2 py-1 text-[10px] font-bold text-red-600"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}

function GuardrailsCard() {
  const { state, dispatch } = useStore()
  const g = state.guardrails
  return (
    <section className="lp-panel p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-teal" />
          <h3 className="text-sm font-bold tracking-wide text-ink uppercase">Operational guardrails</h3>
        </div>
        <button
          type="button"
          onClick={() => dispatch({ type: 'setGuardrails', guardrails: { enabled: !g.enabled } })}
          className={`rounded-[8px] px-3 py-1.5 text-xs font-bold ${
            g.enabled ? 'bg-brand text-white' : 'bg-mist text-slate-500'
          }`}
        >
          {g.enabled ? 'On' : 'Off'}
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <NumberField
          label="Max people per slot"
          value={g.maxHeadcountPerSlot}
          onChange={(n) => dispatch({ type: 'setGuardrails', guardrails: { maxHeadcountPerSlot: n } })}
        />
        <NumberField
          label="Max weekly hours"
          value={g.maxWeeklyHours}
          onChange={(n) => dispatch({ type: 'setGuardrails', guardrails: { maxWeeklyHours: n } })}
        />
        <NumberField
          label="Overtime FTE warn (×)"
          value={g.overtimeFteWarn}
          decimal
          onChange={(n) => dispatch({ type: 'setGuardrails', guardrails: { overtimeFteWarn: n } })}
        />
      </div>
      <p className="mt-3 text-xs text-slate-500">
        When on, the planner caps slot headcount and blocks submit above the weekly hours cap.
      </p>
    </section>
  )
}

function CalibrationCard() {
  const { state, dispatch } = useStore()
  return (
    <section className="lp-panel p-6">
      <div className="mb-4 flex items-center gap-2">
        <Gauge className="h-4 w-4 text-teal" />
        <h3 className="text-sm font-bold tracking-wide text-ink uppercase">
          Activity speed calibration (time per row)
        </h3>
      </div>
      <p className="mb-4 text-xs text-slate-500">
        Minutes per greenhouse row. Planner estimates rows completed from planned hours.
      </p>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {state.activities.map((activity) => {
          const row = state.calibrations.find((c) => c.activityId === activity.id)
          return (
            <label key={activity.id} className="flex items-center justify-between gap-3 rounded-[8px] border border-line px-3 py-2 text-sm">
              <span className="font-bold text-ink">{activity.name}</span>
              <span className="flex items-center gap-2 text-xs text-slate-500">
                <input
                  value={String(row?.minutesPerRow ?? 10)}
                  onChange={(e) => {
                    if (!/^\d+$/.test(e.target.value)) return
                    dispatch({
                      type: 'setCalibration',
                      activityId: activity.id,
                      minutesPerRow: Number(e.target.value),
                    })
                  }}
                  className="lp-input w-16 px-2 py-1 text-sm font-bold text-ink"
                />
                min / row
              </span>
            </label>
          )
        })}
      </div>
    </section>
  )
}

function NumberField({
  label,
  value,
  onChange,
  decimal,
}: {
  label: string
  value: number
  onChange: (n: number) => void
  decimal?: boolean
}) {
  return (
    <label className="text-xs font-bold text-slate-600">
      {label}
      <input
        value={String(value)}
        onChange={(e) => {
          const v = e.target.value
          if (v === '') {
            onChange(0)
            return
          }
          if (decimal ? !/^\d*\.?\d{0,2}$/.test(v) : !/^\d+$/.test(v)) return
          onChange(Number(v))
        }}
        className="lp-input mt-1 w-full px-3 py-2 text-sm font-semibold"
      />
    </label>
  )
}
