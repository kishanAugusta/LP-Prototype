import { MapPin } from 'lucide-react'
import { useStore } from '../store/AppContext'
import { FarmMapModal } from './FarmMapModal'

/** Map View tab — compact farm picker + map modal. */
export function MapViewTab() {
  const { dispatch, visibleFarms, state } = useStore()
  return (
    <div className="lp-page">
      <div className="lp-sticky-bar mb-3">
        <p className="lp-kicker">Map View</p>
        <h2 className="text-lg font-extrabold tracking-tight text-ink">Farm locations</h2>
        <p className="mt-1 text-xs text-slate-500">Pick a farm, then open the greenhouse map.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {visibleFarms.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                dispatch({ type: 'setFarm', farmId: f.id })
                dispatch({ type: 'toggleMap', open: true })
              }}
              className={`lp-chip px-3 py-1.5 text-xs ${
                state.farmId === f.id ? 'lp-chip-on' : 'text-slate-600 hover:bg-[#f4faf5]'
              }`}
            >
              <MapPin className="mr-1 inline h-3.5 w-3.5" />
              {f.name}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => dispatch({ type: 'toggleMap', open: true })}
          className="lp-btn-primary mt-3 px-4 py-2 text-sm"
        >
          Show map
        </button>
      </div>
      <FarmMapModal />
    </div>
  )
}
