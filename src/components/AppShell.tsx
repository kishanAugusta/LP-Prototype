import type { ReactNode } from 'react'
import { CalendarDays, ChartPie, HelpCircle, LogOut, Settings } from 'lucide-react'
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
    <div className="min-h-svh bg-mist pb-16">
      <header className="sticky top-0 z-40 bg-navy text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-brand text-sm font-extrabold">
              LP
            </span>
            <div className="min-w-0">
              <h1 className="text-lg font-extrabold tracking-tight">Labour Planner</h1>
              <p className="truncate text-[11px] font-medium tracking-wide text-white/55">
                Mastronardi Produce · Farm operations
              </p>
            </div>
          </div>
          <nav className="hidden items-center gap-1 rounded-[8px] bg-white/10 p-1 md:flex">
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
                  className={`flex items-center gap-2 rounded-[8px] px-4 py-2 text-sm font-bold ${
                    active ? 'bg-brand text-white' : 'text-white/75 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => dispatch({ type: 'toggleHelp', open: true })}
              className="hidden items-center gap-1 rounded-[8px] border border-white/20 px-3 py-2 text-xs font-bold text-white/80 hover:bg-white/10 sm:flex"
            >
              <HelpCircle className="h-4 w-4" />
              Guide
            </button>
            <div className="hidden text-right lg:block">
              <p className="text-sm font-bold">{user.name}</p>
              <p className="text-[11px] font-semibold tracking-wide text-brand uppercase">
                {roleLabel[user.role]}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/20 text-sm font-bold text-white ring-1 ring-white/20">
              {initials}
            </div>
            <button
              type="button"
              onClick={() => dispatch({ type: 'logout' })}
              className="rounded-[8px] p-2 text-white/60 hover:bg-white/10 hover:text-white"
              title="Secure logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="flex gap-1 border-t border-white/10 px-4 py-2 md:hidden">
          {tabs.map((tab) => {
            if (tab.adminOnly && !isAdmin) return null
            if (tab.id === 'planner' && !canPlan) return null
            const active = state.tab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => dispatch({ type: 'setTab', tab: tab.id })}
                className={`flex-1 rounded-[8px] py-2 text-xs font-bold ${
                  active ? 'bg-brand text-white' : 'text-white/70'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-7xl px-4 py-6 md:px-6">{children}</main>
    </div>
  )
}
