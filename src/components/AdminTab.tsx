import { useMemo, useState, type ReactNode } from 'react'
import { Search, Shield, Trash2, UserPlus, Warehouse } from 'lucide-react'
import { directory } from '../data/mock'
import { ADMIN_GROUPS } from '../lib/adminAccordion'
import { useAdminAccordion } from '../lib/useAdminAccordion'
import { roleLabel, useStore } from '../store/AppContext'
import type { Role, User } from '../types'
import { Accordion } from './Accordion'
import { AdminActionBar } from './AdminActionBar'
import {
  CalibrationCard,
  FarmDayShiftScheduler,
  GuardrailsCard,
  ReportProvisioning,
} from './AdminOps'
import { Modal } from './Modal'

const SECTION_CONTENT = {
  provision: ProvisionCard,
  directory: UserDirectory,
  entities: EntityCards,
  calibration: () => <CalibrationCard embedded />,
  report: () => <ReportProvisioning embedded />,
  shifts: () => <FarmDayShiftScheduler embedded />,
  guardrails: () => <GuardrailsCard embedded />,
} as const

export function AdminTab() {
  const { groupId, setGroup, openId, toggle, sections } = useAdminAccordion()
  const activeGroup = ADMIN_GROUPS.find((group) => group.id === groupId) ?? ADMIN_GROUPS[0]

  return (
    <div className="lp-page flex flex-1 flex-col">
      <div className="mb-3">
        <p className="lp-kicker">Admin</p>
        <h1 className="text-lg font-extrabold tracking-tight text-ink">Users and master data</h1>
        <p className="text-xs text-slate-500">
          Group related settings, then open one section at a time.
        </p>
      </div>

      <div
        role="tablist"
        aria-label="Admin groups"
        className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3"
      >
        {ADMIN_GROUPS.map((group) => {
          const selected = group.id === groupId
          return (
            <button
              key={group.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setGroup(group.id)}
              className={`min-h-11 rounded-[10px] border px-3 py-2 text-left transition ${
                selected
                  ? 'border-brand bg-brand/10 text-ink shadow-sm'
                  : 'border-line bg-white/90 text-slate-600 hover:border-brand/40 hover:bg-mist'
              }`}
            >
              <span className="block text-xs font-extrabold tracking-wide uppercase">
                {group.label}
              </span>
              <span className="mt-0.5 block text-[11px] leading-snug text-slate-500">
                {group.description}
              </span>
            </button>
          )
        })}
      </div>

      <p className="mb-2 text-xs font-bold tracking-wide text-slate-400 uppercase">
        {activeGroup.label}
      </p>

      {sections.map((section) => {
        const Content = SECTION_CONTENT[section.id]
        return (
          <Accordion
            key={section.id}
            id={section.id}
            title={section.title}
            open={openId === section.id}
            onToggle={() => toggle(section.id)}
          >
            <Content />
          </Accordion>
        )
      })}
    </div>
  )
}

function ProvisionCard() {
  const { state, dispatch } = useStore()
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [role, setRole] = useState<Role | ''>('')
  const [farmIds, setFarmIds] = useState<string[]>([])
  const [commodityIds, setCommodityIds] = useState<string[]>([])
  const [activityIds, setActivityIds] = useState<string[]>([])

  const existingEmails = new Set(state.users.map((u) => u.email.toLowerCase()))
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return directory.filter(
      (p) =>
        !existingEmails.has(p.email.toLowerCase()) &&
        (p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q)),
    )
  }, [query, existingEmails])

  const person = directory.find((p) => p.id === selectedId)

  function toggle(list: string[], id: string, setter: (v: string[]) => void) {
    setter(list.includes(id) ? list.filter((x) => x !== id) : [...list, id])
  }

  function resetForm() {
    setQuery('')
    setSelectedId('')
    setRole('')
    setFarmIds([])
    setCommodityIds([])
    setActivityIds([])
  }

  function save() {
    if (!person || !role) {
      dispatch({
        type: 'toast',
        toast: { tone: 'warning', title: 'Incomplete', message: 'Search a directory user and select a role.' },
      })
      return
    }
    const user: User = {
      id: `user-${crypto.randomUUID().slice(0, 8)}`,
      name: person.name,
      email: person.email,
      role,
      farmIds,
      commodityIds,
      activityIds: activityIds,
    }
    dispatch({ type: 'provisionUser', user })
    resetForm()
  }

  const canSave = Boolean(person && role)

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <div className="rounded-[8px] bg-navy p-1.5 text-white">
          <UserPlus className="h-4 w-4" />
        </div>
        <p className="text-sm text-slate-500">Search Azure AD, assign scope, then link the user.</p>
      </div>
      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="relative">
          <label className="lp-label">Directory email lookup</label>
          <div className="relative mt-1">
            <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setSelectedId('')
              }}
              placeholder="Search Azure AD…"
              className="lp-input w-full py-2 pr-4 pl-8 text-sm"
            />
          </div>
          {matches.length > 0 && !selectedId && (
            <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-[8px] border border-slate-200 bg-white shadow-lg">
              {matches.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(p.id)
                      setQuery(p.email)
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-mist"
                  >
                    <span className="font-bold text-ink">{p.name}</span>
                    <span className="block text-xs text-slate-500">
                      {p.email} · {p.department}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <label className="lp-label">Full name (auto-fill)</label>
          <input
            disabled
            value={person?.name ?? ''}
            placeholder="Pending search…"
            className="lp-input mt-1 w-full bg-mist px-4 py-2 text-sm text-slate-600"
          />
        </div>
        <div>
          <label className="lp-label">Role selection</label>
          <select
            value={role}
            onChange={(e) => {
              const next = e.target.value as Role
              setRole(next)
              if (next === 'admin' || next === 'manager') {
                setFarmIds(state.farms.map((f) => f.id))
                setCommodityIds(state.commodities.map((c) => c.id))
                setActivityIds(state.activities.map((a) => a.id))
              }
            }}
            className="lp-select mt-1 w-full px-4 py-2 text-sm"
          >
            <option value="">Select role…</option>
            <option value="planner">Supervisor / Farm Planner</option>
            <option value="manager">Site Manager</option>
            <option value="admin">System Admin</option>
          </select>
        </div>
      </div>
      <div className="mb-6 grid grid-cols-1 gap-8 rounded-[8px] border border-line bg-mist p-4 md:grid-cols-3">
        <CheckList
          title="Assign farm(s)"
          items={state.farms}
          selected={farmIds}
          onToggle={(id) => toggle(farmIds, id, setFarmIds)}
        />
        <CheckList
          title="Assign commodity"
          items={state.commodities}
          selected={commodityIds}
          onToggle={(id) => toggle(commodityIds, id, setCommodityIds)}
        />
        <CheckList
          title="Assign activity"
          items={state.activities}
          selected={activityIds}
          onToggle={(id) => toggle(activityIds, id, setActivityIds)}
        />
      </div>
      <AdminActionBar
        onCancel={resetForm}
        onPrimary={save}
        primaryLabel="Link & Save User"
        primaryDisabled={!canSave}
      />
    </div>
  )
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
      <label className="mb-2 block w-full border-b border-line pb-1 text-xs font-bold text-ink">
        {title}
      </label>
      <div className="custom-scroll h-32 space-y-2 overflow-y-auto">
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

function UserDirectory() {
  const { state, dispatch } = useStore()
  const [filter, setFilter] = useState('')
  const [editing, setEditing] = useState<User | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const rows = state.users.filter((u) => {
    const q = filter.toLowerCase()
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
  })

  return (
    <div id="admin-users" className="overflow-hidden rounded-[8px] border border-line">
      <div className="flex flex-col gap-2 border-b border-line bg-mist p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-teal" />
          <h3 className="text-xs font-bold tracking-wide text-ink uppercase">Filter directory</h3>
        </div>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter users…"
          className="lp-input w-full px-4 py-2 text-xs sm:w-64"
        />
      </div>
      <table className="w-full text-left text-xs">
        <thead className="border-b border-line text-slate-500 uppercase tracking-wider">
          <tr>
            <th className="p-4">Name & email</th>
            <th className="p-4">Role</th>
            <th className="p-4">Permissions scope</th>
            <th className="p-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((u) => (
            <tr key={u.id} className="hover:bg-mist">
              <td className="p-4">
                <p className="font-bold text-ink">{u.name}</p>
                <p className="text-slate-500">{u.email}</p>
              </td>
              <td className="p-4">
                <span className="rounded-[8px] bg-navy/10 px-2 py-0.5 font-bold text-navy">
                  {roleLabel[u.role]}
                </span>
              </td>
              <td className="p-4">
                <div className="mb-1 flex flex-wrap gap-1">
                  {u.farmIds
                    .map((id) => state.farms.find((f) => f.id === id)?.name)
                    .filter(Boolean)
                    .slice(0, 4)
                    .map((name) => (
                      <span
                        key={name}
                        className="rounded border border-green-200 bg-green-50 px-1.5 py-0.5 font-bold text-green-700"
                      >
                        {name}
                      </span>
                    ))}
                </div>
                <div className="flex flex-wrap gap-1">
                  {u.commodityIds
                    .map((id) => state.commodities.find((c) => c.id === id)?.name)
                    .filter(Boolean)
                    .slice(0, 4)
                    .map((name) => (
                      <span
                        key={name}
                        className="rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 font-bold text-blue-700"
                      >
                        {name}
                      </span>
                    ))}
                </div>
              </td>
              <td className="p-4 text-right">
                <button
                  type="button"
                  onClick={() => setEditing({ ...u })}
                  className="mr-1 rounded bg-pastel-blue px-2 py-1.5 font-bold text-blue-600 hover:bg-blue-100"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmId(u.id)}
                  className="rounded bg-pastel-red px-2 py-1.5 font-bold text-red-600 hover:bg-red-100"
                >
                  <Trash2 className="inline h-3.5 w-3.5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Modal open={Boolean(editing)} title="Edit user access" onClose={() => setEditing(null)}>
        {editing && (
          <div className="space-y-3">
            <p className="text-sm font-bold text-slate-800">{editing.name}</p>
            <select
              value={editing.role}
              onChange={(e) => setEditing({ ...editing, role: e.target.value as Role })}
              className="lp-select w-full px-3 py-2 text-sm"
            >
              <option value="planner">Farm Planner</option>
              <option value="manager">Site Manager</option>
              <option value="admin">System Admin</option>
            </select>
            <CheckList
              title="Assign farm(s)"
              items={state.farms}
              selected={editing.farmIds}
              onToggle={(id) =>
                setEditing({
                  ...editing,
                  farmIds: editing.farmIds.includes(id)
                    ? editing.farmIds.filter((x) => x !== id)
                    : [...editing.farmIds, id],
                })
              }
            />
            <CheckList
              title="Assign commodity"
              items={state.commodities}
              selected={editing.commodityIds}
              onToggle={(id) =>
                setEditing({
                  ...editing,
                  commodityIds: editing.commodityIds.includes(id)
                    ? editing.commodityIds.filter((x) => x !== id)
                    : [...editing.commodityIds, id],
                })
              }
            />
            <CheckList
              title="Assign activity"
              items={state.activities}
              selected={editing.activityIds}
              onToggle={(id) =>
                setEditing({
                  ...editing,
                  activityIds: editing.activityIds.includes(id)
                    ? editing.activityIds.filter((x) => x !== id)
                    : [...editing.activityIds, id],
                })
              }
            />
            <AdminActionBar
              onCancel={() => setEditing(null)}
              onPrimary={() => {
                dispatch({ type: 'updateUser', user: editing })
                dispatch({
                  type: 'toast',
                  toast: {
                    tone: 'success',
                    title: 'User updated',
                    message: `${editing.name}'s access was saved.`,
                  },
                })
                setEditing(null)
              }}
              primaryLabel="Save"
            />
          </div>
        )}
      </Modal>

      <Modal open={Boolean(confirmId)} title="Remove user?" onClose={() => setConfirmId(null)}>
        <p className="mb-4 text-sm text-slate-600">This removes the user from Labor Planner entitlements.</p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
          <button
            type="button"
            onClick={() => setConfirmId(null)}
            className="lp-btn-ghost min-h-11 w-full px-4 py-2 text-sm sm:w-auto"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirmId) dispatch({ type: 'deleteUser', id: confirmId })
              setConfirmId(null)
            }}
            className="min-h-11 w-full rounded-[8px] bg-red-600 px-4 py-2 text-sm font-bold text-white sm:w-auto"
          >
            Delete
          </button>
        </div>
      </Modal>
    </div>
  )
}

function EntityCards() {
  const { state, dispatch } = useStore()
  const [farmName, setFarmName] = useState('')
  const [comName, setComName] = useState('')
  const [actName, setActName] = useState('')
  const [cropFarm, setCropFarm] = useState<string | null>(null)
  const [editing, setEditing] = useState<{ kind: 'farm' | 'commodity' | 'activity'; id: string; name: string } | null>(
    null,
  )

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Warehouse className="h-4 w-4 text-teal" />
        <p className="text-xs text-slate-500">Add, edit, or delete master data. Crops links commodities to a farm.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <EntityColumn
          title="Manage Farms"
          placeholder="Add farm…"
          items={state.farms}
          value={farmName}
          onChange={setFarmName}
          onAdd={() => {
            dispatch({ type: 'addFarm', name: farmName })
            setFarmName('')
          }}
          onEdit={(item) => setEditing({ kind: 'farm', id: item.id, name: item.name })}
          onRemove={(id) => dispatch({ type: 'removeFarm', id })}
          extra={(farm) => (
            <button
              type="button"
              onClick={() => setCropFarm(farm.id)}
              className="text-[10px] font-bold text-blue-600 hover:underline"
            >
              Crops
            </button>
          )}
        />
        <EntityColumn
          title="Manage Commodities"
          placeholder="Add crop…"
          items={state.commodities}
          value={comName}
          onChange={setComName}
          onAdd={() => {
            dispatch({ type: 'addCommodity', name: comName })
            setComName('')
          }}
          onEdit={(item) => setEditing({ kind: 'commodity', id: item.id, name: item.name })}
          onRemove={(id) => dispatch({ type: 'removeCommodity', id })}
        />
        <EntityColumn
          title="Manage Activities"
          placeholder="Add task…"
          items={state.activities}
          value={actName}
          onChange={setActName}
          onAdd={() => {
            dispatch({ type: 'addActivity', name: actName })
            setActName('')
          }}
          onEdit={(item) => setEditing({ kind: 'activity', id: item.id, name: item.name })}
          onRemove={(id) => dispatch({ type: 'removeActivity', id })}
        />
      </div>

      <Modal
        open={Boolean(cropFarm)}
        title="Crops grown at this farm"
        onClose={() => setCropFarm(null)}
      >
        {cropFarm && (
          <div className="space-y-2">
            {state.commodities.map((c) => {
              const farm = state.farms.find((f) => f.id === cropFarm)
              const checked = farm?.commodityIds.includes(c.id) ?? false
              return (
                <label key={c.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      if (!farm) return
                      const commodityIds = checked
                        ? farm.commodityIds.filter((id) => id !== c.id)
                        : [...farm.commodityIds, c.id]
                      dispatch({ type: 'updateFarmCrops', id: farm.id, commodityIds })
                    }}
                  />
                  {c.name}
                </label>
              )
            })}
            <AdminActionBar onPrimary={() => setCropFarm(null)} primaryLabel="Done" />
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(editing)}
        title={
          editing?.kind === 'farm'
            ? 'Edit farm'
            : editing?.kind === 'commodity'
              ? 'Edit commodity'
              : 'Edit activity'
        }
        onClose={() => setEditing(null)}
      >
        {editing && (
          <div className="space-y-3">
            <label className="lp-label">
              Name
              <input
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                className="lp-input mt-1 w-full px-3 py-2 text-sm"
                autoFocus
              />
            </label>
            <AdminActionBar
              onCancel={() => setEditing(null)}
              onPrimary={() => {
                const name = editing.name.trim()
                if (!name) return
                if (editing.kind === 'farm') dispatch({ type: 'renameFarm', id: editing.id, name })
                if (editing.kind === 'commodity') dispatch({ type: 'renameCommodity', id: editing.id, name })
                if (editing.kind === 'activity') dispatch({ type: 'renameActivity', id: editing.id, name })
                dispatch({
                  type: 'toast',
                  toast: { tone: 'success', title: 'Updated', message: `Renamed to ${name}.` },
                })
                setEditing(null)
              }}
              primaryLabel="Save"
              primaryDisabled={!editing.name.trim()}
            />
          </div>
        )}
      </Modal>
    </div>
  )
}

function EntityColumn({
  title,
  placeholder,
  items,
  value,
  onChange,
  onAdd,
  onEdit,
  onRemove,
  extra,
}: {
  title: string
  placeholder: string
  items: { id: string; name: string }[]
  value: string
  onChange: (v: string) => void
  onAdd: () => void
  onEdit: (item: { id: string; name: string }) => void
  onRemove: (id: string) => void
  extra?: (item: { id: string; name: string }) => ReactNode
}) {
  return (
    <div className="flex flex-col rounded-[8px] border border-line">
      <div className="border-b border-line bg-mist p-3 text-xs font-bold uppercase text-navy">
        {title}
      </div>
      <div className="flex gap-2 p-3">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onAdd()
          }}
          placeholder={placeholder}
          className="lp-input flex-1 px-3 py-1.5 text-sm"
        />
        <button type="button" onClick={onAdd} className="lp-btn-primary min-h-11 min-w-11 px-3 py-1.5">
          +
        </button>
      </div>
      <div className="custom-scroll max-h-48 space-y-2 overflow-y-auto p-3 pt-0">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-[8px] border border-line px-2 py-1.5 text-sm">
            <span className="font-medium text-ink">{item.name}</span>
            <div className="flex items-center gap-2">
              {extra?.(item)}
              <button
                type="button"
                onClick={() => onEdit(item)}
                className="rounded bg-pastel-blue px-2 py-1 text-[10px] font-bold text-blue-600"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="rounded bg-pastel-red px-2 py-1 text-[10px] font-bold text-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
