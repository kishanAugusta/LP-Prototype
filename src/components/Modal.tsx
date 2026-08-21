import { X } from 'lucide-react'
import type { ReactNode } from 'react'

export function Modal({
  open,
  title,
  children,
  onClose,
  size = 'md',
}: {
  open: boolean
  title: string
  children: ReactNode
  onClose: () => void
  size?: 'md' | 'xl'
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative flex w-full flex-col rounded-[8px] border border-slate-200 bg-white shadow-2xl ${
          size === 'xl' ? 'h-[min(90vh,840px)] max-w-5xl' : 'max-w-lg'
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h3 className="text-sm font-bold text-slate-800">{title}</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className={size === 'xl' ? 'min-h-0 flex-1 overflow-hidden' : 'p-5'}>{children}</div>
      </div>
    </div>
  )
}
