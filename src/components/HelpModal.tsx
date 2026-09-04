import { useState } from 'react'
import { BookOpen, ExternalLink } from 'lucide-react'
import { useStore } from '../store/AppContext'
import { Modal } from './Modal'

const sections = [
  { id: 'start', label: '1. Start here' },
  { id: 'personas', label: '2. Sign-in personas' },
  { id: 'tour', label: '3. 15-minute tour' },
  { id: 'planner', label: '4. Planner tab' },
  { id: 'summary', label: '5. Summary tab' },
  { id: 'admin', label: '6. Admin tab' },
  { id: 'rules', label: '7. Business rules' },
  { id: 'help', label: '8. If something looks wrong' },
] as const

type SectionId = (typeof sections)[number]['id']

export function HelpModal() {
  const { state, dispatch } = useStore()
  const [section, setSection] = useState<SectionId>('start')

  return (
    <Modal
      open={state.helpOpen}
      title="Exploration guide — click through the prototype yourself"
      size="xl"
      onClose={() => dispatch({ type: 'toggleHelp', open: false })}
    >
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <nav className="custom-scroll flex gap-1 overflow-x-auto border-b border-line bg-mist p-3 md:w-52 md:flex-col md:overflow-y-auto md:border-r md:border-b-0">
          {sections.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              className={`shrink-0 rounded-[8px] px-3 py-2 text-left text-xs font-bold ${
                section === item.id ? 'bg-navy text-white' : 'text-slate-600 hover:bg-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="custom-scroll min-h-0 flex-1 overflow-y-auto p-5 text-sm leading-relaxed text-slate-700">
          {section === 'start' && <Start />}
          {section === 'personas' && <Personas />}
          {section === 'tour' && <Tour />}
          {section === 'planner' && <Planner />}
          {section === 'summary' && <Summary />}
          {section === 'admin' && <Admin />}
          {section === 'rules' && <Rules />}
          {section === 'help' && <Trouble />}
          <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-4">
            <a
              href="/guide.html"
              target="_blank"
              rel="noreferrer"
              className="lp-btn-primary inline-flex items-center gap-2 px-4 py-2 text-xs"
            >
              <BookOpen className="h-4 w-4" />
              Open printable guide
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <button
              type="button"
              onClick={() => {
                for (const prefix of ['labor-planner-prototype', 'labour-planner-prototype']) {
                  for (let v = 1; v <= 6; v++) localStorage.removeItem(`${prefix}-v${v}`)
                }
                window.location.reload()
              }}
              className="lp-btn-ghost px-4 py-2 text-xs"
            >
              Reset prototype data
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

function Start() {
  return (
    <div className="space-y-3">
      <h4 className="text-base font-bold text-ink">You can explore Labor Planner without a presenter</h4>
      <p>
        This is a working website, not a Figma file. Click anything. Your changes stay in this browser
        until you reset.
      </p>
      <p>
        Production Azure AD, Azure SQL, Priva/Hortimax feeds, and live Power BI are simulated. Filters,
        the 30-minute grid, totals, notes, roles, and admin actions are fully interactive.
      </p>
      <ol className="list-decimal space-y-1 pl-5">
        <li>Sign in as <strong>Farm Planner</strong> for the first pass.</li>
        <li>Follow the <strong>15-minute tour</strong> in this panel.</li>
        <li>
          Open the <strong>printable guide</strong> if you want a document to keep beside the screen or
          save as PDF (File → Print).
        </li>
      </ol>
    </div>
  )
}

function Personas() {
  return (
    <div className="space-y-3">
      <h4 className="text-base font-bold text-slate-900">Sign-in personas</h4>
      <p>Production will use corporate SSO. Here you pick a role to see different permissions.</p>
      <ul className="space-y-2">
        <li>
          <strong>Farm Planner — Alex Rivera:</strong> Planner + Summary. Farms: North Farm, Maroa,
          Ohio. No Admin tab.
        </li>
        <li>
          <strong>Site Manager — Sarah Johnson:</strong> Summary only. All farms. Cannot edit the grid.
        </li>
        <li>
          <strong>System Admin — Jordan Hale:</strong> Planner, Summary, and Admin. All farms.
        </li>
      </ul>
      <p className="text-xs text-slate-500">
        Log out (top right) to switch. After you compare roles, sign back in as Farm Planner for the
        tour.
      </p>
    </div>
  )
}

function Tour() {
  return (
    <div className="space-y-4">
      <h4 className="text-base font-bold text-slate-900">15-minute tour</h4>
      <ol className="list-decimal space-y-3 pl-5">
        <li>
          <strong>North Farm filter.</strong> Planner → Farm = North Farm. Commodity should list only
          Beef, TOV, and Campari.
        </li>
        <li>
          <strong>Paint the grid.</strong> Commodity = Beef, Activity = Clipping. Number of people =
          5. Click-and-drag six unlocked slots. Hours should rise by <strong>15.0</strong> (5 × 6 ×
          0.5). Grey locked cells are past days — leave them.
        </li>
        <li>
          <strong>Recommendation.</strong> View Logic → Apply Recommendation, then overwrite a few
          cells with a different headcount.
        </li>
        <li>
          <strong>Submit.</strong> Add a note, Save note, Submit Schedule (green confirmation). Submit
          again to see the required reason-for-change dialog.
        </li>
        <li>
          <strong>Summary.</strong> Open Summary, change Group by, click View Notes.
        </li>
        <li>
          <strong>Other roles.</strong> Site Manager = Summary only. System Admin = Admin tab. Search
          Azure AD for “Priya” and link her as a planner.
        </li>
      </ol>
    </div>
  )
}

function Planner() {
  return (
    <div className="space-y-3">
      <h4 className="text-base font-bold text-slate-900">Planner tab</h4>
      <p>
        Sticky <strong>Plan type</strong> bar stays visible. Changing plan type swaps the whole
        workspace (Labor weekly / monthly budget / Harvest / Tear-Out / Planting Gantt). Notes sit in
        an accordion; <strong>Submit Plan</strong> stays one click away.
      </p>
      <ul className="list-disc space-y-1 pl-5">
        <li>
          <strong>Labor (Weekly)</strong> — bi-weekly 14-day; expand an activity, then click-drag to
          paint. Use Erase, People = 0, or Clear activity to remove labor.
        </li>
        <li>
          <strong>Labor (Monthly Budget)</strong> — enter people or planned hours per month; optional
          annual activity × month detail in an accordion.
        </li>
        <li>
          <strong>Harvest (Weekly)</strong> — bay/row picking + reason codes in one filled panel.
        </li>
        <li>
          <strong>Tear-Out / Planting Gantt</strong> — rows, crew, day cells show intensity{' '}
          <strong>1 / 2 / 3</strong> (Light / Medium / Heavy).
        </li>
      </ul>
      <p>
        Visual language aligns with <strong>Sunset Grown</strong> greens for future embed under the
        parent brand site.
      </p>
    </div>
  )
}

function Summary() {
  return (
    <div className="space-y-3">
      <h4 className="text-base font-bold text-slate-900">Summary tab</h4>
      <p>
        Sticky filters stay visible. KPI cards show FTE, planned hours, and unique activities.
        <strong> Group table by</strong> (highlighted green) rebuilds the detailed table — Detailed,
        Farm, Commodity, Activity, Planner, or Horizon. Monthly view includes a month and year
        picker; Year is always available.
      </p>
      <p>
        <strong>View Notes</strong> / <strong>@ Notes</strong> opens a side drawer. Power BI–style
        pie and planned-vs-actual bars sit in a collapsed <strong>Analytics</strong> accordion below
        the table.
      </p>
    </div>
  )
}

function Admin() {
  return (
    <div className="space-y-3">
      <h4 className="text-base font-bold text-slate-900">Admin tab</h4>
      <p>Visible only to System Admin.</p>
      <ul className="list-disc space-y-1 pl-5">
        <li>
          Search Azure AD for priya, luis, emily, david, or hannah. Name auto-fills. Choose a role,
          assign scope for planners, then Link & Save User.
        </li>
        <li>User Directory: filter, pastel Edit, pastel Delete. You cannot delete yourself.</li>
        <li>
          Entity cards: add, Edit (rename), and delete Farms, Commodities, Activities. On a farm,
          Crops controls which commodities appear in Planner.
        </li>
        <li>
          Assign farm / commodity / activity is always visible on Provision User and on Edit.
        </li>
        <li>
          Also: planning report provisioning (farms, commodities, activities per report), daily farm
          shift scheduler, operational guardrails (add/edit conditions), and activity speed
          calibration (minutes per row). Admin sections open one-at-a-time in accordions to reduce
          scroll.
        </li>
      </ul>
    </div>
  )
}

function Rules() {
  return (
    <div className="space-y-3">
      <h4 className="text-base font-bold text-slate-900">Rules the prototype enforces</h4>
      <ul className="list-disc space-y-1 pl-5">
        <li>Past calendar days cannot be edited.</li>
        <li>An empty grid cannot be submitted.</li>
        <li>Changing a submitted farm / week / activity requires an audit reason.</li>
        <li>Planners only see assigned farms. Only Admin sees Admin.</li>
        <li>Recommendations can always be overwritten.</li>
        <li>Number of people rejects negatives, decimals, and letters.</li>
        <li>If the browser is offline, Submit is disabled.</li>
      </ul>
    </div>
  )
}

function Trouble() {
  return (
    <div className="space-y-3">
      <h4 className="text-base font-bold text-slate-900">If something looks wrong</h4>
      <ul className="list-disc space-y-1 pl-5">
        <li>Grid will not click: pick an activity, and use a day that is not in the past.</li>
        <li>Odd commodity list: change Farm first. Use North Farm to demo crop filtering.</li>
        <li>No Admin tab: log out and sign in as System Admin.</li>
        <li>Submit disabled: you are offline, or you are a Site Manager.</li>
        <li>Stale numbers from an old session: Reset prototype data below, then sign in again.</li>
      </ul>
    </div>
  )
}
