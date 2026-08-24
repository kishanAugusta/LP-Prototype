import type { ReactNode } from 'react'
import { CalendarDays, ChartPie, HelpCircle, LogOut, MapPinned, Settings } from 'lucide-react'
import { roleLabel, useStore } from '../store/AppContext'
import type { Tab } from '../types'

const tabs: { id: Tab; label: string; icon: typeof CalendarDays; adminOnly?: boolean }[] = [
  { id: 'planner', label: 'Planner', icon: CalendarDays },
  { id: 'summary', label: 'Summary', icon: ChartPie },
  { id: 'map', label: 'Map View', icon: MapPinned },
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
    <div className="lp-shell-bg flex min-h-svh flex-col">
      <header className="lp-header-glass sticky top-0 z-40 shrink-0 text-white">
        <div
          className="h-1 w-full bg-gradient-to-r from-brand via-[#7ddf8a] to-sunset"
          aria-hidden
        />
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-brand to-brand-dark text-xs font-extrabold shadow-lg shadow-brand/30 ring-1 ring-white/20">
              LP
            </span>
            <div className="min-w-0">
              <h1 className="text-base font-extrabold tracking-tight">Labour Planner</h1>
              <p className="truncate text-[10px] font-medium tracking-wide text-white/55">
                Sunset Grown · Mastronardi Produce · Farm ops module
              </p>
            </div>
          </div>
          <nav className="lp-nav-pill hidden items-center gap-1 rounded-[12px] p-1 md:flex">
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
                  className={`flex items-center gap-2 rounded-[10px] px-3.5 py-1.5 text-sm font-bold transition ${
                    active
                      ? 'bg-brand text-white shadow-md shadow-brand/30'
                      : 'text-white/75 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => dispatch({ type: 'toggleHelp', open: true })}
              className="hidden items-center gap-1 rounded-[10px] border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-bold text-white/85 hover:bg-white/10 sm:flex"
            >
              <HelpCircle className="h-4 w-4" />
              Guide
            </button>
            <div className="hidden text-right lg:block">
              <p className="text-sm font-bold leading-tight">{user.name}</p>
              <p className="text-[10px] font-semibold tracking-wide text-[#8dff9f] uppercase">
                {roleLabel[user.role]}
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand/40 to-white/10 text-xs font-bold text-white ring-2 ring-white/15">
              {initials}
            </div>
            <button
              type="button"
              onClick={() => dispatch({ type: 'logout' })}
              className="rounded-[10px] p-2 text-white/60 hover:bg-white/10 hover:text-white"
              title="Secure logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="flex gap-1 border-t border-white/10 px-3 py-1.5 md:hidden">
          {tabs.map((tab) => {
            if (tab.adminOnly && !isAdmin) return null
            if (tab.id === 'planner' && !canPlan) return null
            const active = state.tab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => dispatch({ type: 'setTab', tab: tab.id })}
                className={`flex-1 rounded-[10px] py-1.5 text-[11px] font-bold ${
                  active ? 'bg-brand text-white' : 'text-white/70'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </header>

      <main className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col px-3 py-3 md:px-6 md:py-4">
        {children}
      </main>
    </div>
  )
}
