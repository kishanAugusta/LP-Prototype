type AdminActionBarProps = {
  onCancel?: () => void
  onPrimary: () => void
  primaryLabel: string
  cancelLabel?: string
  primaryDisabled?: boolean
  primaryBusy?: boolean
}

/** Shared Admin footer: ghost Cancel + primary Save, right-aligned. */
export function AdminActionBar({
  onCancel,
  onPrimary,
  primaryLabel,
  cancelLabel = 'Cancel',
  primaryDisabled = false,
  primaryBusy = false,
}: AdminActionBarProps) {
  return (
    <div className="flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end sm:gap-3">
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          disabled={primaryBusy}
          className="lp-btn-ghost min-h-11 w-full px-5 py-2 text-sm sm:w-auto"
        >
          {cancelLabel}
        </button>
      )}
      <button
        type="button"
        onClick={onPrimary}
        disabled={primaryDisabled || primaryBusy}
        className="lp-btn-primary min-h-11 w-full px-5 py-2 text-sm sm:w-auto"
      >
        {primaryBusy ? 'Saving…' : primaryLabel}
      </button>
    </div>
  )
}
