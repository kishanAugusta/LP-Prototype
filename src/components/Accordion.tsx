import { ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'

export function Accordion({
  id,
  title,
  open,
  onToggle,
  children,
  badge,
}: {
  id: string
  title: string
  open: boolean
  onToggle: () => void
  children: ReactNode
  badge?: ReactNode
}) {
  const panelId = `${id}-panel`
  return (
    <div className="lp-accordion">
      <button
        type="button"
        id={`${id}-trigger`}
        className="lp-accordion-trigger"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate">{title}</span>
          {badge}
        </span>
        <ChevronDown className="lp-accordion-chevron h-4 w-4 shrink-0 opacity-80" />
      </button>
      {open && (
        <div id={panelId} role="region" aria-labelledby={`${id}-trigger`} className="lp-accordion-body">
          {children}
        </div>
      )}
    </div>
  )
}

/** Single-open accordion group helper state shape. */
export type AccordionId = string
