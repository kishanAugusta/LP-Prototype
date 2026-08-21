import { AlertTriangle, CheckCircle2, Info, WifiOff, X } from 'lucide-react'
import { useEffect } from 'react'
import { useStore } from '../store/AppContext'

const toneClass = {
  success: 'border-brand/30 bg-white',
  error: 'border-red-200 bg-white',
  info: 'border-blue-200 bg-white',
  warning: 'border-amber-200 bg-white',
} as const

const icon = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
  warning: AlertTriangle,
} as const

const iconClass = {
  success: 'text-brand',
  error: 'text-red-500',
  info: 'text-blue-500',
  warning: 'text-amber-500',
} as const

export function Toasts() {
  const { state, dispatch } = useStore()
  useEffect(() => {
    if (state.toasts.length === 0) return
    const id = state.toasts[0].id
    const t = window.setTimeout(() => dispatch({ type: 'dismissToast', id }), 4500)
    return () => window.clearTimeout(t)
  }, [state.toasts, dispatch])
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[80] flex w-full max-w-sm flex-col gap-2">
      {state.toasts.map((toast) => {
        const Icon = icon[toast.tone]
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex gap-3 rounded-[8px] border p-3 shadow-lg ${toneClass[toast.tone]}`}
          >
            <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${iconClass[toast.tone]}`} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-800">{toast.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{toast.message}</p>
            </div>
            <button
              type="button"
              onClick={() => dispatch({ type: 'dismissToast', id: toast.id })}
              className="text-slate-400 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

export function OfflineBanner() {
  const { state } = useStore()
  if (state.online) return null
  return (
    <div className="flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-xs font-bold text-white">
      <WifiOff className="h-4 w-4" />
      Azure connection unavailable — Submit Schedule is disabled until you are back online.
    </div>
  )
}
