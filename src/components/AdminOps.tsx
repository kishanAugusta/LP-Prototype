import { useState } from 'react'
import {
  CalendarClock,
  FileBarChart,
  FlaskConical,
  Gauge,
  Pencil,
  ShieldAlert,
  Trash2,
} from 'lucide-react'
import { useStore } from '../store/AppContext'
import type {
  LogicBuffer,
  LogicGate,
  LogicRequirement,
  PlanningReport,
} from '../types'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const BUFFER_LABELS: Record<LogicBuffer, string> = {
  immediately: 'Immediately',
  '1day': '1 day',
  '1week': '1 week',
  '2weeks': '2 weeks',
}
const REF_EVENTS = [
  'Removing crop',
  'Planting',
  'Deleafing',
  'Harvest start',
  'Tear-out complete',
]

const CALIBRATION_LABELS: Record<string, string> = {
  'act-tearout': 'TEAR OUT - VINES',
  'act-planting': 'PLANTING - SLABS',
  'act-clipping': 'CLIPPING',
  'act-deleafing': 'DELEAFING',
  'act-lowering': 'LOWERING',
  'act-pruning': 'PRUNING',
  'act-scouting': 'SCOUTING',
  'act-twisting': 'TWISTING',
}

export function AdminOps() {
  return (
    <div className="space-y-6">
      <ReportProvisioning />
      <FarmDayShiftScheduler />
      <GuardrailsCard />
      <CalibrationCard />
    </div>
  )
}

export function ReportProvisioning({ embedded = false }: { embedded?: boolean }) {
  const { state, dispatch } = useStore()
  const [reportId, setReportId] = useState(state.reports[0]?.id ?? '')
  const report = state.reports.find((r) => r.id === reportId) ?? state.reports[0]

  if (!report) return null

  const body = (
    <>
      <div className="mb-4 max-w-md">
        <label className="lp-label">Select planning report</label>
        <select
          value={report.id}
          onChange={(e) => setReportId(e.target.value)}
          className="lp-select mt-1 w-full px-3 py-2 text-sm font-bold"
        >
          {state.reports.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-4 grid grid-cols-1 gap-4 rounded-[8px] border border-line bg-mist p-4 md:grid-cols-3">
        <CheckList
          title="Assign farm(s)"
          items={state.farms}
          selected={report.farmIds}
          onToggle={(id) => toggleReportIds(report, 'farmIds', id, dispatch)}
        />
        <CheckList
          title="Assign commodity"
          items={state.commodities}
          selected={report.commodityIds}
          onToggle={(id) => toggleReportIds(report, 'commodityIds', id, dispatch)}
        />
        <CheckList
          title="Assign activity"
          items={state.activities}
          selected={report.activityIds}
          onToggle={(id) => toggleReportIds(report, 'activityIds', id, dispatch)}
        />
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() =>
            dispatch({
              type: 'toast',
              toast: {
                tone: 'success',
                title: 'Report config saved',
                message: `${report.name} scope was saved for Power BI publishing.`,
              },
            })
          }
          className="rounded-[8px] bg-[#5b4b8a] px-5 py-2 text-sm font-bold text-white hover:bg-[#4a3c72]"
        >
          Save Report Config
        </button>
      </div>
    </>
  )

  if (embedded) return body
  return (
    <section className="lp-panel p-6">
      <div className="mb-4 flex items-center gap-2">
        <FileBarChart className="h-4 w-4 text-teal" />
        <h3 className="text-sm font-bold tracking-wide text-ink uppercase">
          Planning report provisioning
        </h3>
      </div>
      {body}
    </section>
  )
}

function toggleReportIds(
  report: PlanningReport,
  key: 'farmIds' | 'commodityIds' | 'activityIds',
  id: string,
  dispatch: ReturnType<typeof useStore>['dispatch'],
) {
  const current = report[key]
  const ids = current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
  dispatch({ type: 'setReportScope', id: report.id, key, ids })
}

function CheckList({
  title,
  items,
  selected,
  onToggle,
}: {
  title: string
  items: { id: string; name: string }[]
  selected: string[]
  onToggle: (id: string) => void
}) {
  return (
    <div>
      <label className="mb-2 block border-b border-line pb-1 text-xs font-bold text-ink">{title}</label>
      <div className="custom-scroll h-36 space-y-2 overflow-y-auto">
        {items.map((item) => (
          <label key={item.id} className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={selected.includes(item.id)}
              onChange={() => onToggle(item.id)}
            />
            {item.name}
          </label>
        ))}
      </div>
    </div>
  )
}

export function FarmDayShiftScheduler({ embedded = false }: { embedded?: boolean }) {
  const { state, dispatch } = useStore()

  function get(farmId: string, day: number) {
    return (
      state.farmDaySchedules.find((s) => s.farmId === farmId && s.day === day) ?? {
        farmId,
        day,
        work: day >= 1 && day <= 6,
        start: '06:00',
        end: '16:00',
      }
    )
  }

  return (
    <section className={embedded ? undefined : 'lp-panel p-6'}>
      {!embedded && (
        <div className="mb-4 flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-teal" />
          <h3 className="text-sm font-bold tracking-wide text-ink uppercase">
            Daily farm shift scheduler
          </h3>
        </div>
      )}
      <p className="mb-3 text-xs text-slate-500">
        Set work days and start/end times for each farm. Saved schedules apply to weekly planning
        windows.
      </p>
      <div className="custom-scroll max-h-[320px] overflow-auto rounded-[8px] border border-line">
        <table className="w-full min-w-[900px] border-collapse text-xs">
          <thead className="sticky top-0 bg-mist">
            <tr>
              <th className="border-b border-line p-2 text-left font-bold text-navy">Farm</th>
              {DAY_LABELS.map((d) => (
                <th key={d} className="border-b border-line p-2 text-center font-bold text-navy">
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {state.farms.map((farm) => (
              <tr key={farm.id} className="border-b border-line">
                <td className="p-2 font-bold text-ink">{farm.name}</td>
                {DAY_LABELS.map((_, day) => {
                  const row = get(farm.id, day)
                  return (
                    <td key={day} className="p-1.5 align-top">
                      <label className="mb-1 flex items-center justify-center gap-1 text-[10px] font-bold text-brand">
                        <input
                          type="checkbox"
                          checked={row.work}
                          onChange={(e) =>
                            dispatch({
                              type: 'setFarmDaySchedule',
                              schedule: { ...row, work: e.target.checked },
                            })
                          }
                        />
                        Work
                      </label>
                      <input
                        type="time"
                        value={row.start}
                        disabled={!row.work}
                        onChange={(e) =>
                          dispatch({
                            type: 'setFarmDaySchedule',
                            schedule: { ...row, start: e.target.value },
                          })
                        }
                        className="lp-input mb-1 w-full px-1 py-1 text-[10px] disabled:bg-mist"
                      />
                      <input
                        type="time"
                        value={row.end}
                        disabled={!row.work}
                        onChange={(e) =>
                          dispatch({
                            type: 'setFarmDaySchedule',
                            schedule: { ...row, end: e.target.value },
                          })
                        }
                        className="lp-input w-full px-1 py-1 text-[10px] disabled:bg-mist"
                      />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={() =>
            dispatch({
              type: 'toast',
              toast: {
                tone: 'success',
                title: 'Schedules saved',
                message: 'Farm day work windows were stored for this prototype session.',
              },
            })
          }
          className="rounded-[8px] bg-sunset px-5 py-2 text-sm font-bold text-white"
        >
          Save Schedules
        </button>
      </div>
    </section>
  )
}

export function GuardrailsCard({ embedded = false }: { embedded?: boolean }) {
  const { state, dispatch } = useStore()
  const [activityId, setActivityId] = useState(state.activities[0]?.id ?? '')
  const [requirement, setRequirement] = useState<LogicRequirement>('before')
  const [buffer, setBuffer] = useState<LogicBuffer>('immediately')
  const [referenceEvent, setReferenceEvent] = useState(REF_EVENTS[0])
  const [editing, setEditing] = useState<LogicGate | null>(null)

  function reset() {
    setEditing(null)
    setActivityId(state.activities[0]?.id ?? '')
    setRequirement('before')
    setBuffer('immediately')
    setReferenceEvent(REF_EVENTS[0])
  }

  function save() {
    if (!activityId) return
    if (editing) {
      dispatch({
        type: 'updateLogicGate',
        gate: { ...editing, activityId, requirement, buffer, referenceEvent },
      })
    } else {
      dispatch({
        type: 'addLogicGate',
        gate: { activityId, requirement, buffer, referenceEvent },
      })
    }
    reset()
  }

  function describe(gate: LogicGate) {
    const act = state.activities.find((a) => a.id === gate.activityId)?.name ?? gate.activityId
    return `${act} must complete ${BUFFER_LABELS[gate.buffer]} ${gate.requirement} ${gate.referenceEvent}`
  }

  return (
    <section className={embedded ? undefined : 'lp-panel p-6'}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        {!embedded ? (
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-teal" />
            <h3 className="text-sm font-bold tracking-wide text-ink uppercase">Operational guardrails</h3>
          </div>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={() =>
            dispatch({
              type: 'toast',
              toast: {
                tone: 'info',
                title: 'Rules tested',
                message: `${state.guardrails.logicGates.length} active logic gates evaluated with no conflicts in this prototype.`,
              },
            })
          }
          className="lp-btn-ghost flex items-center gap-1 px-3 py-1.5 text-xs"
        >
          <FlaskConical className="h-3.5 w-3.5" />
          Test Rules
        </button>
      </div>

      <p className="mb-2 text-xs font-bold tracking-wide text-slate-400 uppercase">Create new guardrail</p>
      <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-5">
        <select
          value={activityId}
          onChange={(e) => setActivityId(e.target.value)}
          className="lp-select px-3 py-2 text-sm"
        >
          {state.activities.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <select
          value={requirement}
          onChange={(e) => setRequirement(e.target.value as LogicRequirement)}
          className="lp-select px-3 py-2 text-sm"
        >
          <option value="before">Before</option>
          <option value="after">After</option>
        </select>
        <select
          value={buffer}
          onChange={(e) => setBuffer(e.target.value as LogicBuffer)}
          className="lp-select px-3 py-2 text-sm"
        >
          {(Object.keys(BUFFER_LABELS) as LogicBuffer[]).map((b) => (
            <option key={b} value={b}>
              {BUFFER_LABELS[b]}
            </option>
          ))}
        </select>
        <select
          value={referenceEvent}
          onChange={(e) => setReferenceEvent(e.target.value)}
          className="lp-select px-3 py-2 text-sm"
        >
          {REF_EVENTS.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
        <button type="button" onClick={save} className="lp-btn-primary px-3 py-2 text-sm">
          {editing ? 'Save' : '+ Add'}
        </button>
      </div>

      <p className="mb-2 text-xs font-bold tracking-wide text-slate-400 uppercase">Active logic gates</p>
      <div className="space-y-2">
        {state.guardrails.logicGates.map((gate) => (
          <div
            key={gate.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-[8px] border border-line px-3 py-2 text-sm"
          >
            <div>
              <span className="mr-2 rounded bg-navy/10 px-1.5 py-0.5 text-[10px] font-extrabold text-navy">
                {gate.code}
              </span>
              <span className="text-ink">{describe(gate)}</span>
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => {
                  setEditing(gate)
                  setActivityId(gate.activityId)
                  setRequirement(gate.requirement)
                  setBuffer(gate.buffer)
                  setReferenceEvent(gate.referenceEvent)
                }}
                className="rounded bg-pastel-blue p-1.5 text-blue-600"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => dispatch({ type: 'removeLogicGate', id: gate.id })}
                className="rounded bg-pastel-red p-1.5 text-red-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
        {state.guardrails.logicGates.length === 0 && (
          <p className="text-xs text-slate-400">No logic gates yet. Add a rule above.</p>
        )}
      </div>
    </section>
  )
}

export function CalibrationCard({ embedded = false }: { embedded?: boolean }) {
  const { state, dispatch } = useStore()
  const ids = Object.keys(CALIBRATION_LABELS)

  return (
    <section className={embedded ? undefined : 'lp-panel p-6'}>
      {!embedded && (
        <div className="mb-4 flex items-center gap-2">
          <Gauge className="h-4 w-4 text-teal" />
          <h3 className="text-sm font-bold tracking-wide text-ink uppercase">
            Activity speed calibration (time per row)
          </h3>
        </div>
      )}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {ids.map((activityId) => {
          const row = state.calibrations.find((c) => c.activityId === activityId)
          return (
            <label
              key={activityId}
              className="flex items-center justify-between gap-3 rounded-[8px] border border-line px-3 py-2 text-sm"
            >
              <span className="text-[11px] font-extrabold tracking-wide text-ink">
                {CALIBRATION_LABELS[activityId]}
              </span>
              <span className="flex items-center gap-2 text-xs text-slate-500">
                <input
                  value={String(row?.minutesPerRow ?? 10)}
                  onChange={(e) => {
                    if (!/^\d+$/.test(e.target.value)) return
                    dispatch({
                      type: 'setCalibration',
                      activityId,
                      minutesPerRow: Number(e.target.value),
                    })
                  }}
                  className="lp-input w-16 px-2 py-1 text-sm font-bold text-ink"
                />
                min
              </span>
            </label>
          )
        })}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-500">Enter target completion time in minutes per row.</p>
        <button
          type="button"
          onClick={() =>
            dispatch({
              type: 'toast',
              toast: {
                tone: 'success',
                title: 'Calibration saved',
                message: 'Minutes-per-row targets were stored for planner estimates.',
              },
            })
          }
          className="rounded-[8px] bg-navy px-5 py-2 text-sm font-bold text-white"
        >
          Save Calibration
        </button>
      </div>
    </section>
  )
}
