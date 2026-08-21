import type { ReactNode } from 'react'
import { CalendarDays, ChartPie, HelpCircle, LogOut, Settings, Users } from 'lucide-react'
import { roleLabel, useStore } from '../store/AppContext'
import type { Tab } from '../types'

const tabs: { id: Tab; label: string; icon: typeof CalendarDays; adminOnly?: boolean }[] = [
  { id: 'planner', label: 'Planner', icon: CalendarDays },
  { id: 'summary', label: 'Summary', icon: ChartPie },
  { id: 'admin', label: 'Admin', icon: Settings, adminOnly: true },
]

export function AppShell({ children }: { children: ReactNode }) {
  const { state, user, dispatch, isAdmin, canPlan } = useStore()
  if (!user) return null
  const initials = user.name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)

  return (
    <div className="min-h-svh bg-slate-50 pb-16">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="rounded-[8px] bg-green-50 p-2.5 text-brand">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight text-slate-800">Labour Planner 2.0</h1>
            <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Workforce Allocation Platform · Interactive prototype
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => dispatch({ type: 'toggleHelp', open: true })}
            className="flex items-center gap-1 rounded-[8px] border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
          >
            <HelpCircle className="h-4 w-4" />
            Exploration guide
          </button>
          <div className="hidden text-right md:block">
            <p className="text-sm font-bold text-slate-700">{user.name}</p>
            <p className="text-[11px] font-bold uppercase text-slate-400">{roleLabel[user.role]}</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-green-200 bg-green-100 text-lg font-bold text-brand">
            {initials}
          </div>
          <div className="mx-1 h-8 w-px bg-slate-200" />
          <button
            type="button"
            onClick={() => dispatch({ type: 'logout' })}
            className="flex flex-col items-center gap-1 text-slate-400 transition-colors hover:text-red-500"
            title="Secure logout"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-[9px] font-bold uppercase">Logout</span>
          </button>
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-7xl px-4 py-6 md:px-6">
        <div className="mb-6 flex rounded-[8px] border border-slate-200 bg-white p-1 shadow-sm">
          {tabs.map((tab) => {
            if (tab.adminOnly && !isAdmin) return null
            if (tab.id === 'planner' && !canPlan) return null
            const Icon = tab.icon
            const active = state.tab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => dispatch({ type: 'setTab', tab: tab.id })}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md py-3 text-sm font-bold transition-all ${
                  active ? 'bg-brand text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
        {children}
      </main>
    </div>
  )
}
