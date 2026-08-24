import { useState } from 'react'
import { BookOpen, Leaf, ShieldCheck } from 'lucide-react'
import { loginOptions } from '../data/mock'
import { useStore } from '../store/AppContext'

export function LoginScreen() {
  const { dispatch } = useStore()
  const [userId, setUserId] = useState(loginOptions[1].userId)

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between bg-navy p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-brand">
            <Leaf className="h-5 w-5" />
          </span>
          <span className="text-sm font-semibold tracking-[0.2em] uppercase text-white/70">
            Mastronardi Produce
          </span>
        </div>
        <div>
          <p className="text-sm font-semibold tracking-[0.18em] text-brand uppercase">Farm operations</p>
          <h1 className="mt-3 max-w-md text-5xl font-extrabold leading-[1.1] tracking-tight">Labour Planner</h1>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/70">
            Allocate crews by farm, greenhouse house, commodity, and 30-minute slot. One schedule for
            supervisors, managers, and admins.
          </p>
        </div>
        <p className="text-xs text-white/40">Workforce allocation · greenhouse labour</p>
      </div>

      <div className="flex items-center justify-center bg-mist p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <p className="text-xs font-bold tracking-[0.2em] text-teal uppercase">Mastronardi Produce</p>
            <h1 className="mt-1 text-3xl font-extrabold text-ink">Labour Planner</h1>
          </div>
          <div className="lp-panel p-8">
            <h2 className="text-xl font-bold text-ink">Sign in</h2>
            <p className="mt-1 text-sm text-slate-500">Choose a role to explore the planner.</p>

            <div className="mt-6 rounded-[8px] border border-teal/20 bg-teal/5 p-4 text-xs leading-relaxed text-teal">
              <ShieldCheck className="mr-1 inline h-3.5 w-3.5" />
              <strong>Azure AD SSO simulation:</strong> pick a persona to see role-based farms, tabs, and
              permissions. Production will use corporate single sign-on.
            </div>

            <div className="mt-6">
              <label className="mb-2 block text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                Simulate login as
              </label>
              <select
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="lp-select w-full px-4 py-3 text-sm font-semibold text-ink"
              >
                {loginOptions.map((opt) => (
                  <option key={opt.userId} value={opt.userId}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => dispatch({ type: 'login', userId })}
              className="mt-5 flex w-full items-center justify-center gap-3 rounded-[8px] bg-navy py-3.5 font-bold text-white transition-colors hover:bg-[#1c4a3a]"
            >
              <MicrosoftMark />
              Authenticate with Azure AD
            </button>

            <div className="mt-5 flex flex-col gap-2 text-center">
              <button
                type="button"
                onClick={() => dispatch({ type: 'toggleHelp', open: true })}
                className="inline-flex items-center justify-center gap-2 text-sm font-bold text-brand hover:underline"
              >
                <BookOpen className="h-4 w-4" />
                Open the exploration guide
              </button>
              <a href="/guide.html" className="text-xs font-semibold text-slate-500 hover:text-ink">
                Or open the printable document
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MicrosoftMark() {
  return (
    <svg viewBox="0 0 23 23" className="h-5 w-5" aria-hidden="true">
      <rect fill="#f25022" x="1" y="1" width="10" height="10" />
      <rect fill="#00a4ef" x="12" y="1" width="10" height="10" />
      <rect fill="#7fba00" x="1" y="12" width="10" height="10" />
      <rect fill="#ffb900" x="12" y="12" width="10" height="10" />
    </svg>
  )
}
