# Labour Planner — Prototype Memory

Internal reference of everything built in this clickable prototype. Use this when continuing work, demoing, or explaining the product.

**Client:** Mastronardi Produce Farm Operations  
**Built by:** Augusta Hitech  
**App name:** Labour Planner — Workforce Allocation Platform  
**Type:** Interactive React web prototype (not Figma, not production)  
**Data:** Browser `localStorage` only (`labour-planner-prototype-v6`). No Azure, no backend.

---

## What this prototype is

A working website that shows how supervisors plan labour by farm, commodity, activity, and 30-minute time slot; how managers review totals and notes; and how admins manage users and master data.

**Simulated (looks real, not connected):**

- Azure AD SSO (persona picker instead of corporate login)
- Historic recommendations (Priva / Hortimax style)
- Power BI planned-vs-actual charts
- Save to Azure SQL (data stays in this browser)
- Offline / Azure connectivity banner

**Fully interactive:**

- Role-based tabs and farm scope (Planner, Summary, Map View, Admin)
- **Plan type** drives the planner surface (weekly labour, monthly budget, harvest, gantt)
- Cascading farm → commodity filters; activity expand on weekly labour
- Hours and FTE calculations; notes, submit, audit reasons
- Summary KPIs, detailed table, Group by, notes drawer; analytics in accordion
- Admin: SSO lookup, user CRUD, farms / commodities / activities, reports, shifts, guardrails, calibration
- Sticky one-page chrome; Sunset Grown–aligned greens and soft page atmosphere

---

## Stack

| Piece | Choice |
|---|---|
| UI | React 19 + TypeScript |
| Build | Vite 8 (dev server `host: true`, port **5173**) |
| Styling | Tailwind CSS 4 |
| Icons | lucide-react |
| Font | Plus Jakarta Sans |
| Lint | oxlint |
| State | React `useReducer` in `src/store/AppContext.tsx` |

**Brand colours** (`src/index.css`):

- Brand green `#2db84b` / dark `#1f9a3a`
- Forest navy `#163528` (header, chips, login CTA)
- Teal `#1a7a4c` (kickers, accents)
- Mist `#f3faf5` / line `#d5e6da` (page and panel borders)
- Sunset `#e85d04` (accents / audit cues)
- Pastel blue `#ebf5ff` / pastel red `#fff5f5` (admin Edit / Delete)
- Page atmosphere: soft green/orange radial gradients (fixed)
- Rounded panels **12px**; sticky bars / submit **14px**
- Shared classes: `lp-panel`, `lp-input`, `lp-select`, `lp-chip`, `lp-btn-primary`, `lp-btn-ghost`, `lp-sticky-bar`, `lp-accordion*`, `lp-header-glass`, `lp-login-hero`

**Run locally:** `npm install` then `npm run dev` → usually http://localhost:5173  
**Printable guide:** http://localhost:5173/guide.html  
**Share:** Network URL on same Wi-Fi, or deploy `dist` to Vercel / Netlify.

**Reset:** Exploration guide → **Reset prototype data** (clears `localStorage` and reloads).

---

## Screens and navigation

### 1. Login (no user signed in)

- **Sunset Grown · Mastronardi** hero (leaf mark, feature tags) + mist sign-in card
- Azure AD SSO simulation banner
- Persona dropdown: Farm Planner (default), Site Manager, System Admin
- **Authenticate with Azure AD** (Microsoft 4-square mark)
- **Open the exploration guide** (in-app Help modal)
- Link to printable `/guide.html`

Mike Peterson exists in the directory but is **not** a login persona. He exists so Summary already has a second planner’s hours.

### 2. App shell (after login)

Sticky header (forest navy gradient + green→sunset accent bar):

- **LP** mark + title **Labour Planner** + “Sunset Grown · Mastronardi Produce · Farm ops module”
- Tab pills: Planner / Summary / Map View / Admin (role-gated)
- **Guide**, signed-in name, role label, initials avatar, **Logout**

Tabs (role-gated):

| Tab | Farm Planner | Site Manager | System Admin |
|---|---|---|---|
| Planner | Yes | Hidden | Yes |
| Summary | Yes | Yes (lands here) | Yes |
| Map View | Yes | Yes | Yes |
| Admin | Hidden | Hidden | Yes |

Site Manager cannot see or edit the grid. Submit is disabled for them.

---

## Roles and permissions

| Role key | Label | Who | Farms | Tabs | Can paint grid / submit |
|---|---|---|---|---|---|
| `planner` | Farm Planner | Alex Rivera | North Farm, Maroa, Ohio | Planner + Summary + Map | Yes, assigned farms only |
| `manager` | Site Manager | Sarah Johnson | All farms | Summary + Map | No |
| `admin` | System Admin | Jordan Hale | All farms | Planner + Summary + Map + Admin | Yes, all farms |

**Farm restriction:** planners only see farms on their SSO profile. Managers and admins see every farm.

**Login landing:** managers open on Summary; planners and admins open on Planner. Activity is cleared on login so the grid starts locked.

---

## Planner tab

### Plan type (primary control)

Sticky filter bar. **Plan type** swaps the whole workspace:

| Plan type | Grid |
|---|---|
| Labour (Weekly) | Bi-weekly 14-day; expand activity rows to paint 30-min slots |
| Labour (Monthly Budget) | Annual activity × month; need / planned / people; rate $/hr |
| Harvest (Weekly) | Bay A/B row picker, day tabs Mon–Sat, reason codes |
| Tear-Out (Weekly Gantt) | Task rows + crew + Light/Medium/Heavy day cells |
| Planting (Weekly Gantt) | Same Gantt pattern for planting tasks |

- Year selector: **2025, 2026, 2027**. Planning week when the plan type needs it.
- Farm map pin opens greenhouse layout. Commodity shown when the plan type needs it.
- Notes live in a sticky accordion; **Submit Plan** stays one click away.

Past dates stay locked in weekly labour slots.

### Operational scope (cascading filters)

1. **Farm** — limited to the user’s allowed farms. **Show maps** opens the greenhouse layout (MINI / FRED / HARVEST). Changing farm resets commodity to that farm’s first crop and **clears activity**.
2. **Commodity** — only crops grown at the selected farm, further limited by the planner’s assigned commodities.
3. **Active Activity** — required. The grid stays locked until one is picked. Also limited by the planner’s assigned activities.

**Rate / hr ($)** next to headcount. Footer shows labour cost = hours × rate, and estimated rows from Admin speed calibration.

Each **farm + house + commodity + activity** combination is its own plan. Switching MINI / FRED / HARVEST or activity (including Tear-out / Planting) shows a different grid.

**North Farm demo crop filter:** Beef, TOV, Campari only (not Strawberry, Lettuce, Peppers, Snacks).

### Number of people + click-and-drag grid

- Default headcount: **5**
- Digits only. Negatives, decimals, and letters are ignored. Empty field → 0.
- **0 people + drag clears cells.**
- Press on a cell, hold, drag across others (pointer events; works on touch).
- Grid locked until activity is selected, or if the user cannot plan, or if the day is in the past.

**Hours formula**

- 1 slot = 0.5 hours
- Cell hours = people × 0.5
- Example: 5 people × 6 slots = **15.0 hours**
- FTE = planned hours ÷ **40**

Footer: per-day hours + grand total. Planner also shows week hours and FTE next to the grid.

**Cell colours**

| Headcount | Look |
|---|---|
| Empty, unlocked | White, hover green |
| 1–3 | Light green |
| 4–6 | Brand green, white text |
| 7+ | Dark brand green |
| Past / locked | Grey, lock icon on the day header |

Sticky time column, sticky header, sticky footer. Horizontal + vertical scroll. Max height ~620px.

### Historic Baseline Recommendation

Shown after farm, commodity, and activity are selected (and not dismissed).

- Prototype of historic actuals: weeks 16–20, **60% recurrence** threshold, labelled as Priva / Hortimax.
- Pattern is hashed from `farm|commodity|activity` so each combination has a stable morning / midday / afternoon headcount.
- **View Logic** — five sample weeks with recurrence % and avg people.
- **Dismiss** — hide banner for this selection (comes back if farm/commodity/activity/week changes).
- **Apply Recommendation** — fills **unlocked (today and future) slots only**. Past days unchanged. User can still paint over any cell.
- Success toast after apply.

### Labour Schedule Notes + Submit

- Subject + body. Subject defaults to “Operational note” if blank.
- **Save note** — stores with author, timestamp, farm, week, activity. Success toast.
- **Submit Schedule** — packages the grid as if posting to Azure SQL.
  - Disabled when offline or when user cannot plan.
  - Empty grid (no slots with people) is rejected.
  - First submit: success toast with committed hours; audit note “Schedule submitted”.
  - Second submit of the same farm / week / activity: **Reason for change** modal (BR-002). Reason is required and saved as an audit note (“Reason for change” + “Schedule revised”).
- Unsaved note body is also attached on submit if present.

---

## Summary tab

Shared horizon with Planner (weekly / monthly / yearly).

**Filters** (each has an “All …” option):

- Farm (scoped to allowed farms)
- Commodity
- Activity
- Planner (excludes Site Manager from the list)

**Group by:** Farm (default), Commodity, Activity, Planner, Horizon / week.

**KPI cards**

1. Total planned hours (30-minute slot rollup)
2. FTE (hours ÷ 40)
3. Unique activities in the current filter set

**Table:** Group, Planned hours, FTE, Activities count, Planner names. Sorted by hours descending. Empty state: “No planned hours for this filter combination.”

**View Notes** — slide-out drawer (does not leave Summary). Lists notes/audit entries with author, timestamp, farm, activity, week. Filtered by the current summary farm / commodity / activity. Audit kind is labelled.

**Pie chart — Planned hours allocation**

- Full pie (SVG) of share by current Group by
- Legend with hours and %
- Same filter set as the KPI/table

**Bar graph — Power BI planned vs actual (prototype)**

- Grouped vertical bars: planned (green `#00a63f`) vs actual (orange `#ea580c`, simulated as planned × 0.91)
- Axis ticks; legend: Planned / Actual (Priva / Hortimax)
- Max 8 groups shown

Farm Planners only see their assigned farms’ data. Site Managers and Admins see all farms.

---

## Sunset-aligned one-page UX

- Tokens: Sunset-adjacent produce green (`#2db84b`), warm mist page, brand accent bar on header
- Sticky context bars on Planner + Summary; Notes / Analytics in accordions
- Admin: single-open accordion sections (session-remembered)
- Embed framing: “Sunset Grown · Mastronardi Produce · Farm ops module”
- Goal: primary grid/table usable without scrolling past chrome on ~1440×900
- Visual polish: soft page atmosphere (green/orange radials), glass sticky bars, gradient primary buttons, richer login hero + navy header, elevated KPI cards


**Plan type** dropdown drives the entire planner surface:

| Plan type | Grid |
|---|---|
| Labour (Weekly) | Bi-weekly 14-day; expand activity rows to paint 30-min slots |
| Labour (Monthly Budget) | Annual activity × month; need / planned / people; rate $/hr; KPIs |
| Harvest (Weekly) | Bay A/B row picker, day tabs Mon–Sat, reason codes |
| Tear-Out (Weekly Gantt) | Task rows + crew + Light/Medium/Heavy day cells |
| Planting (Weekly Gantt) | Same Gantt pattern for planting tasks |

Also: **Map View** tab, Year + Planning week dropdowns, Farm/Commodity scope only as needed.


### Provision User via SSO

Simulated Azure AD directory search. Type `priya`, `luis`, `emily`, `david`, or `hannah`.

Directory people (not already in the User Directory):

| Name | Email | Department |
|---|---|---|
| Priya Nair | priya.nair@mastronardi.com | Farm Operations |
| Luis Ortega | luis.ortega@mastronardi.com | Greenhouse North |
| Emily Chen | emily.chen@mastronardi.com | FarmOps IT |
| David Okonkwo | david.okonkwo@mastronardi.com | Ohio Site |
| Hannah Brooks | hannah.brooks@mastronardi.com | Site Management |

Already provisioned users (Alex, Sarah, Jordan, Mike) do **not** appear in search.

Flow:

1. Search → click match → **Full name auto-fills** (disabled field)
2. Choose role: Supervisor / Farm Planner, Site Manager, System Admin
3. For **Farm Planner** only: tick farms, commodities, activities
4. Admin / Manager get all farms, commodities (admin also all activities)
5. **Link & Save User** — they appear in User Directory
6. **Cancel** clears the form

Incomplete save (no person or no role) shows a warning toast.

### User Directory

- Filter by name or email
- Columns: Name & email, Role badge, Permissions scope (farm chips green, commodity chips blue), Actions
- **Edit** (pastel blue) — change role and farm scope, Save
- **Delete** (pastel red) — confirm modal. **Cannot delete the signed-in user**

### Global Entity Management

Three cards: **Farms**, **Commodities**, **Activities**.

- Type a name, press **+** or Enter to add
- **Edit** opens a rename modal; **Delete** removes from dropdowns (and from farm crop/activity lists)
- New farm gets the first two commodities and all activities; admins/managers auto-gain that farm
- New activity is added to **all** farm profiles
- On a farm, **Crops** modal sets which commodities that farm grows (this drives Planner’s commodity filter)

### Planning report provisioning

Enable/disable each Power BI labour report. Assign **farms**, **commodities**, and **activities** included in the report via chips.

### Operational guardrails

Master On/Off plus a condition list. Admins can **Add condition** (name, metric, threshold, farm scope, activity scope), then Edit / On-Off / Delete. Matching enabled conditions cap slot headcount and block weekly-hours submit in Planner.

---

## Business rules (enforced in the prototype)

| ID / name | Behaviour |
|---|---|
| BR-001 Temporal lock | Ended calendar days cannot be edited (grey + lock). Apply Recommendation also skips past days. |
| Empty submit | Submit rejected if no slots have people, or no activity selected. |
| BR-002 Audit on change | Re-submitting the same farm / week / activity requires a reason. Reason is stored as an audit note. |
| Farm restriction | Planners only see assigned farms in Planner and Summary. |
| Admin hierarchy | Only System Admin sees the Admin tab. |
| Manager read-only | Site Manager has no Planner tab and cannot submit. |
| Recommendation override | After Apply, cells can still be painted over. |
| Invalid people input | Negatives, decimals, letters ignored. 0 clears on drag. |
| Offline submit | Browser `online`/`offline` events. Amber banner: “Azure connection unavailable”. Submit disabled. |
| Grid lock | No activity selected → grid disabled. |
| Cascading scope | Farm change resets commodity + activity. Commodity change resets activity. |
| Self-delete | Signed-in user cannot be deleted from User Directory. |
| Note required body | Save note does nothing (no toast path) if body is empty. |
| Change reason required | Confirming revision with a blank reason shows a warning toast. |

---

## Sample master data

### Farms and crops

| Farm | Commodities |
|---|---|
| North Farm | Beef, TOV, Campari |
| Maroa | Beef, TOV |
| Ohio | Strawberry |
| Richmond | Campari, Snacks, TOV |
| PepperCo | Snacks, TOV, Peppers |
| Morehead | Beef, Snacks, TOV |

### Commodities

Beef, TOV, Campari, Snacks, Strawberry, Lettuce, Peppers

### Activities (all farms)

Clipping, Deleafing, Lowering, Pruning, Scouting, Twisting

### Provisioned users

| Name | Email | Role | Farms |
|---|---|---|---|
| Jordan Hale | jordan.hale@mastronardi.com | System Admin | All |
| Alex Rivera | alex.rivera@mastronardi.com | Farm Planner | North Farm, Maroa, Ohio |
| Sarah Johnson | sarah.j@mastronardi.com | Site Manager | All |
| Mike Peterson | mike.p@mastronardi.com | Farm Planner | Richmond, Morehead |

### Seeded schedule cells (so Summary / Power BI are not empty)

Pattern: morning full headcount, midday −2, afternoon −3, across all 22 slots.

| Farm | Commodity | Activity | Week | Planner | Base people |
|---|---|---|---|---|---|
| North Farm | Beef | Clipping | This week | Alex | 5 |
| North Farm | Beef | Clipping | Last week | Alex | 6 |
| North Farm | Beef | Clipping | Two weeks ago | Alex | 5 |
| North Farm | TOV | Deleafing | Last week | Alex | 5 |
| Maroa | Beef | Scouting | Last week | Alex | 3 |
| Ohio | Strawberry | Pruning | Last week | Alex | 4 |
| Richmond | Campari | Twisting | Last week | Mike | 7 |
| Morehead | TOV | Lowering | Last week | Mike | 4 |

Last-week (and two-weeks-ago North/Beef/Clipping) rows are **already submitted**.

### Seeded notes

1. **Crew availability** (Alex, last week, North Farm / Beef / Clipping) — operational note
2. **Schedule submitted** (System, last week, same scope) — audit
3. **Weather watch** (Alex, current week, Ohio / Strawberry / Pruning) — operational note

---

## Cross-cutting UX

- **Toasts:** success / error / info / warning. Auto-dismiss after 4.5s. Top-right. Manual close.
- **Offline banner:** full-width amber bar when `navigator.onLine` is false.
- **Help modal:** in-app Exploration guide with 8 sections (start, personas, 15-minute tour, Planner, Summary, Admin, rules, troubleshooting) + printable link + reset.
- **Printable guide:** `public/guide.html` and repo `GUIDE.md`.
- **Modals:** generic overlay (reason for change, edit user, delete confirm, farm crops, help).
- **Persistence:** users, farms, commodities, activities, cells, notes, submissions, current user id. UI-only state (tab, toasts, drafts) is not the source of truth across reload except via that persist shape; current user **is** persisted so refresh stays signed in.
- **Week model:** Monday start (ISO week). Cell key: `farmId|commodityId|activityId|date|slot`. Submission key: `farmId|weekKey|commodityId|activityId`.

---

## Suggested 15-minute demo path

1. Sign in as **Farm Planner**. Header: Alex Rivera / Farm Planner. Planner + Summary, no Admin.
2. Farm = **North Farm**. Commodity list = Beef, TOV, Campari only.
3. Commodity = Beef, Activity = Clipping, people = 5. Drag six unlocked slots → **+15.0 hours**.
4. View Logic → Apply Recommendation → overwrite a few cells.
5. Save a note → Submit Schedule (green toast). Submit again → reason dialog.
6. Summary → KPIs, Group by, **View Notes**.
7. Logout → Site Manager: Summary only.
8. Logout → System Admin → Admin: search `Priya`, provision as Farm Planner; add/delete a farm; set Crops on North Farm.

---

## What production still needs (not in this prototype)

- Real Azure AD SSO (not a persona dropdown)
- Azure SQL persistence (not `localStorage`)
- Live Priva / Hortimax actuals feeds
- Embedded Power BI reports in Mastronardi’s tenant
- Go-live hosting / auth / data contracts

---

## Key source files

| File | What it holds |
|---|---|
| `src/types.ts` | Roles, entities, cells, notes, submissions, toasts |
| `src/data/mock.ts` | Farms, users, directory, seed cells/notes/submissions |
| `src/store/AppContext.tsx` | All state, rules, persist, role helpers |
| `src/lib/time.ts` | Weeks, slots, keys, past-day lock |
| `src/lib/calc.ts` | FTE, historic recommendation |
| `src/components/LoginScreen.tsx` | SSO persona login |
| `src/components/AppShell.tsx` | Header + tabs |
| `src/components/PlannerTab.tsx` | Horizon, filters, rec banner, notes, submit, reason modal |
| `src/components/ScheduleGrid.tsx` | Click-and-drag 30-min grid |
| `src/components/SummaryTab.tsx` | Filters, KPIs, table, pie allocation, bar planned-vs-actual |
| `src/components/AdminTab.tsx` | Provision, directory, entities |
| `src/components/AdminOps.tsx` | Reports, shifts, guardrails, calibration |
| `src/components/FarmMapModal.tsx` | Greenhouse house map |
| `src/components/MonthlyBudgetGrid.tsx` | 12-month planned hours / rate / budget |
| `src/components/HouseRowsGrid.tsx` | House row-wise selector (monthly) |
| `src/components/NotesDrawer.tsx` | Audit / notes side panel |
| `src/components/HelpModal.tsx` | In-app exploration guide + reset |
| `src/components/Toasts.tsx` | Toasts + offline banner |
| `GUIDE.md` / `public/guide.html` | Client-facing exploration guide |
| `memory.md` | Internal feature memory |

---

*Keep this file updated when features, rules, or sample data change.*
