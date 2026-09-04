import { useState } from 'react'
import { BookOpen, Leaf, ShieldCheck, Sparkles } from 'lucide-react'
import { loginOptions } from '../data/mock'
import { useStore } from '../store/AppContext'

export function LoginScreen() {
  const { dispatch } = useStore()
  const [userId, setUserId] = useState(loginOptions[1].userId)

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="lp-login-hero relative hidden flex-col justify-between overflow-hidden p-12 text-white lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '22px 22px',
          }}
          aria-hidden
        />
        <div className="relative flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-gradient-to-br from-brand to-brand-dark shadow-lg shadow-brand/40 ring-1 ring-white/20">
            <Leaf className="h-5 w-5" />
          </span>
          <span className="text-sm font-semibold tracking-[0.2em] uppercase text-white/75">
            Sunset Grown · Mastronardi
          </span>
        </div>
        <div className="relative">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold tracking-[0.14em] text-[#9dffb0] uppercase backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Farm operations
          </p>
          <h1 className="mt-4 max-w-md text-5xl font-extrabold leading-[1.08] tracking-tight">
            Labor Planner
          </h1>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/70">
            Allocate crews by farm, greenhouse house, commodity, and 30-minute slot. One schedule for
            supervisors, managers, and admins — ready to embed under Sunset Grown.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {['Weekly labor', 'Harvest rows', 'Budget plan'].map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold text-white/80"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-white/40">Workforce allocation · greenhouse labor</p>
      </div>

      <div className="flex items-center justify-center bg-gradient-to-br from-[#f6fbf7] via-mist to-[#e8f3eb] p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <p className="text-xs font-bold tracking-[0.2em] text-teal uppercase">Sunset Grown</p>
            <h1 className="mt-1 text-3xl font-extrabold text-ink">Labor Planner</h1>
          </div>
          <div className="lp-panel p-8 shadow-xl shadow-navy/5">
            <h2 className="text-xl font-extrabold tracking-tight text-ink">Sign in</h2>
            <p className="mt-1 text-sm text-slate-500">Choose a role to explore the planner.</p>

            <div className="mt-6 rounded-[12px] border border-brand/20 bg-gradient-to-br from-brand/5 to-teal/5 p-4 text-xs leading-relaxed text-teal">
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
              className="mt-5 flex w-full items-center justify-center gap-3 rounded-[12px] bg-gradient-to-b from-navy to-[#0f221a] py-3.5 font-bold text-white shadow-lg shadow-navy/25 transition hover:brightness-110"
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
