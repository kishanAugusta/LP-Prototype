import { useState } from 'react'
import { BookOpen, Leaf, ShieldCheck } from 'lucide-react'
import { loginOptions } from '../data/mock'
import { useStore } from '../store/AppContext'

export function LoginScreen() {
  const { dispatch } = useStore()
  const [userId, setUserId] = useState(loginOptions[1].userId)

  return (
    <div className="flex min-h-svh items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md rounded-[8px] border border-slate-200 bg-white p-10 text-center shadow-2xl">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-green-50 shadow-sm">
          <Leaf className="h-10 w-10 text-brand" />
        </div>
        <h1 className="text-3xl font-bold text-slate-800">Mastronardi Produce</h1>
        <p className="mt-2 text-sm font-medium uppercase tracking-wide text-slate-500">
          Labour Planner 2.0 · Prototype
        </p>

        <div className="mt-8 space-y-5 text-left">
          <div className="rounded-[8px] border border-blue-200 bg-blue-50 p-4 text-xs leading-relaxed text-blue-800">
            <ShieldCheck className="mr-1 inline h-3.5 w-3.5" />
            <strong>Azure AD SSO simulation:</strong> pick a persona to see role-based farms, tabs, and
            permissions. Production will use corporate single sign-on.
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase text-slate-500">
              Simulate login as
            </label>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full rounded-[8px] border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-brand"
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
            className="mt-2 flex w-full items-center justify-center gap-3 rounded-[8px] bg-navy py-3.5 font-bold text-white shadow-md transition-colors hover:bg-[#242485]"
          >
            <MicrosoftMark />
            Authenticate with Azure AD
          </button>

          <div className="flex flex-col gap-2 pt-1 text-center">
            <button
              type="button"
              onClick={() => dispatch({ type: 'toggleHelp', open: true })}
              className="inline-flex items-center justify-center gap-2 text-sm font-bold text-brand hover:underline"
            >
              <BookOpen className="h-4 w-4" />
              Open the exploration guide
            </button>
            <a href="/guide.html" className="text-xs font-semibold text-slate-500 hover:text-slate-700">
              Or open the printable document
            </a>
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
