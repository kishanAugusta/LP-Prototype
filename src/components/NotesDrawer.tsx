import { X } from 'lucide-react'
import { useStore } from '../store/AppContext'

export function NotesDrawer() {
  const { state, dispatch } = useStore()
  const notes = state.notes.filter((n) => {
    if (state.summaryFarmId !== 'all' && n.farmId !== state.summaryFarmId) return false
    if (state.summaryCommodityId !== 'all' && n.commodityId !== state.summaryCommodityId) return false
    if (state.summaryActivityId !== 'all' && n.activityId !== state.summaryActivityId) return false
    return true
  })

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity ${
          state.notesOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => dispatch({ type: 'toggleNotes', open: false })}
      />
      <aside
        className={`fixed top-0 right-0 z-50 flex h-full w-full max-w-sm flex-col border-l border-slate-200 bg-white shadow-2xl transition-transform ${
          state.notesOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 p-4">
          <h2 className="text-sm font-bold uppercase text-slate-800">Notes History & Audit</h2>
          <button
            type="button"
            onClick={() => dispatch({ type: 'toggleNotes', open: false })}
            className="text-slate-400 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="custom-scroll flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
          {notes.length === 0 && (
            <p className="text-sm text-slate-500">No notes match the current summary filters.</p>
          )}
          {notes.map((note) => {
            const farm = state.farms.find((f) => f.id === note.farmId)?.name
            const activity = state.activities.find((a) => a.id === note.activityId)?.name
            return (
              <article key={note.id} className="rounded-[8px] border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <p className="text-xs font-bold text-slate-800">{note.subject}</p>
                  <p className="text-[9px] font-bold text-slate-400">
                    {new Date(note.timestamp).toLocaleString()}
                  </p>
                </div>
                <p className="text-xs leading-relaxed text-slate-600">{note.body}</p>
                <p className="mt-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  {note.author} · {farm} · {activity} · {note.weekKey}
                  {note.kind === 'audit' ? ' · Audit' : ''}
                </p>
              </article>
            )
          })}
        </div>
      </aside>
    </>
  )
}
