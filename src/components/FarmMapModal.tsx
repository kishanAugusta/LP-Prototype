import { MapPin } from 'lucide-react'
import { greenhouseHouses } from '../data/mock'
import { useStore } from '../store/AppContext'
import type { HouseId } from '../types'
import { Modal } from './Modal'

const layout: { id: HouseId; x: number; y: number; w: number; h: number }[] = [
  { id: 'house-mini', x: 24, y: 36, w: 150, h: 88 },
  { id: 'house-fred', x: 190, y: 36, w: 150, h: 88 },
  { id: 'house-harvest', x: 90, y: 140, w: 184, h: 72 },
]

export function FarmMapModal() {
  const { state, dispatch, farm } = useStore()
  if (!farm) return null

  return (
    <Modal
      open={state.mapOpen}
      title={`${farm.name} greenhouse map`}
      onClose={() => dispatch({ type: 'toggleMap', open: false })}
    >
      <p className="mb-3 text-xs text-slate-600">
        Click a house block for location context on this farm map.

      </p>
      <svg viewBox="0 0 360 240" className="w-full rounded-[8px] border border-line bg-mist">
        <rect x="8" y="8" width="344" height="224" rx="8" fill="#eef4ef" stroke="#d4e2d8" />
        <text x="180" y="26" textAnchor="middle" fontSize="11" fontWeight="700" fill="#16382d">
          {farm.name}
        </text>
        {layout.map((block) => {
          const house = greenhouseHouses.find((h) => h.id === block.id)
          const active = state.houseId === block.id
          return (
            <g
              key={block.id}
              className="cursor-pointer"
              onClick={() => {
                dispatch({ type: 'setHouse', houseId: block.id })
                dispatch({ type: 'toggleMap', open: false })
              }}
            >
              <rect
                x={block.x}
                y={block.y}
                width={block.w}
                height={block.h}
                rx="8"
                fill={active ? '#00a63f' : '#ffffff'}
                stroke={active ? '#008a35' : '#cbd5e1'}
                strokeWidth="2"
              />
              <text
                x={block.x + block.w / 2}
                y={block.y + block.h / 2 - 4}
                textAnchor="middle"
                fontSize="13"
                fontWeight="700"
                fill={active ? '#ffffff' : '#0f172a'}
              >
                {house?.name}
              </text>
              <text
                x={block.x + block.w / 2}
                y={block.y + block.h / 2 + 14}
                textAnchor="middle"
                fontSize="9"
                fill={active ? '#dcfce7' : '#64748b'}
              >
                {house?.rows} rows · {house?.acres} ac
              </text>
            </g>
          )
        })}
      </svg>
      <p className="mt-3 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">
        <MapPin className="h-3.5 w-3.5" />
        Selected house is highlighted on the map.

      </p>
    </Modal>
  )
}
