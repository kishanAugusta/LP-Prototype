# Labour Planner — Self-Exploration Guide

Use this guide to click through the prototype on your own. You do not need a presenter, Figma, or Azure access. Every button in the app is live; this document tells you what to try and what you should see.

**Prototype type:** clickable web application (not a static mock)  
**Brand framing:** Sunset Grown · Mastronardi Produce (farm ops module)  
**Data:** stored in your browser only  
**Reset:** header → **Guide** → **Reset prototype data**

---

## 1. What you are looking at

Labour Planner is the proposed workforce allocation application for Mastronardi Produce Farm Operations, styled to sit under the **Sunset Grown** parent brand. Supervisors plan labour by farm, commodity, activity, and time; managers review totals and notes; admins manage users and master data.

This prototype shows how that website will look and behave. The following are **simulated** so you can explore without production systems:

- Azure AD sign-in (choose a persona instead of a corporate password)
- Historic recommendations (Priva / Hortimax style)
- Power BI planned-versus-actual charts
- Save to Azure SQL (data stays in this browser)

Everything else — plan types, filters, grids, calculations, notes, roles, and admin actions — works for real in the prototype.

---

## 2. How to open the prototype

1. Open the prototype URL you were given (for example `http://localhost:5173` or a shared HTTPS link).
2. You should see the **Sunset Grown · Mastronardi** sign-in screen.
3. Keep this guide nearby, or click **Open the exploration guide** on sign-in / **Guide** in the app header.

If the app looks empty or “stuck” after an earlier session, reset prototype data from the guide panel and sign in again.

---

## 3. Sign in as a persona (5 minutes)

Production will use Azure AD. Here you pick a role so you can see different permissions.

| Persona | Who it represents | What you can do |
|---|---|---|
| **Farm Planner (assigned farms)** | Supervisor — Alex Rivera | Planner + Summary + Map. Only North Farm, Maroa, and Ohio. |
| **Site Manager (summary only)** | Operations — Sarah Johnson | Summary + Map. All farms. Cannot edit the grid or open Admin. |
| **System Admin (full access)** | FarmOps IT — Jordan Hale | Planner, Summary, Map, and Admin. All farms. |

**Try this**

1. Leave the dropdown on **Farm Planner**.
2. Click **Authenticate with Azure AD**.
3. Confirm the header shows **Alex Rivera / Farm Planner** and the Sunset Grown subtitle.
4. Confirm you see **Planner**, **Summary**, and **Map View** tabs, and **no Admin tab**.
5. Click **Logout** (top right), sign in as **Site Manager**, and confirm there is **no Planner tab**.
6. Log out again and sign in as **System Admin**. Confirm the **Admin** tab appears.

Stay signed in as **Farm Planner** for the next section.

---

## 4. Suggested 15-minute tour

Follow these steps in order the first time. After that, jump to any section below.

### Step A — Plan type + farm scope

1. Open the **Planner** tab. The sticky **Plan type** bar stays at the top.
2. Leave **Plan type** on **Labour (Weekly)**.
3. Set **Farm** to **North Farm**.
4. Open the **Commodity** dropdown.

**You should see only Beef, TOV, and Campari.** Other crops belong to other farms.

### Step B — Expand an activity and paint hours

1. Set **Commodity** to **Beef**.
2. In the bi-weekly grid, expand **Clipping** (or another activity row).
3. Set headcount if prompted, then click an unlocked 30-minute cell and drag across **six** slots.

**You should see hours increase** (people × slots × 0.5). Totals update immediately.

Grey / locked cells are **past days**. You cannot edit them.

### Step C — Switch plan types (quick look)

1. Change **Plan type** to **Labour (Monthly Budget)** — annual activity × month budget.
2. Change to **Harvest (Weekly)** — bay/row picking and reason codes.
3. Change to **Tear-Out** or **Planting** Gantt — Light/Medium/Heavy day cells.
4. Switch back to **Labour (Weekly)** for submit.

### Step D — Notes and submit

1. Open the **Notes & submit** accordion (or use the sticky **Submit Plan** button).
2. Subject: `Crew availability`. Body: any short operational comment.
3. Click **Save note**, then **Submit Plan**.
4. You should get a success toast. Submit again on the same scope to see the **reason for change** dialog.

### Step E — Summary and notes drawer

1. Open the **Summary** tab. Sticky filters stay visible.
2. Read the three KPI cards: FTE, Total Planned Hours, Unique Activities.
3. Change **Group table by** (highlighted green control).
4. Click **View Notes** / **@ Notes**. Analytics (charts) live in a collapsed accordion below.

### Step F — Map + other roles

1. Open **Map View**, pick a farm, **Show map**.
2. Log out. Sign in as **Site Manager** (Summary + Map only).
3. Log out. Sign in as **System Admin** → **Admin**: search Azure AD for `Priya`, provision her as a Farm Planner. Sections open one-at-a-time in accordions.

---

## 5. Planner tab — what each control does

### Plan type

| Plan type | What you get |
|---|---|
| **Labour (Weekly)** | Bi-weekly 14-day grid; expand an activity to paint 30-min slots. |
| **Labour (Monthly Budget)** | Annual activity × month need / planned / people; rate $/hr. |
| **Harvest (Weekly)** | Bay A/B rows, day tabs Mon–Sat, reason codes. |
| **Tear-Out (Weekly Gantt)** | Task rows, crew, Light/Medium/Heavy day cells. |
| **Planting (Weekly Gantt)** | Same Gantt pattern for planting. |

Year and planning week appear when the plan type needs them. Past dates stay locked on weekly labour.

### Operational scope

| Control | Behaviour |
|---|---|
| **Farm** | Limited to farms on your SSO profile. Map pin opens greenhouse layout. |
| **Commodity** | Only crops grown at the selected farm (when the plan type needs it). |
| **Activity rows** | On Labour Weekly, expand a row to paint; each activity is its own plan. |

### Hours + click-and-drag (Labour Weekly)

1. Expand an activity. Type a whole number for people (0 clears as you drag).
2. Press on a cell and drag across others.
3. Each filled slot = that many people for 30 minutes.

**Hours for a cell** = people × 0.5  
**Example:** 5 people across 6 slots = 15.0 hours

### Notes and Submit Plan

- Sticky bar keeps **Submit Plan** one click away; notes sit in an accordion.
- **Save note** stores the comment with your name and timestamp.
- Empty labour grids cannot be submitted.
- If the browser goes offline, Submit is disabled.

---

## 6. Summary tab

Use this as a manager or after you have submitted plans.

| Area | What to try |
|---|---|
| **Sticky filters** | Time horizon (Weekly / Monthly / Yearly). Year is always available; Monthly also shows a month picker. |
| **Filters** | Farm, commodity, activity, planner. **All** shows the full allowed scope. |
| **Group table by** | Detailed (default) or Farm / Commodity / Activity / Planner / Horizon. Highlighted green control. |
| **KPI cards** | FTE (hours ÷ 40), planned hours, unique activities. |
| **Table** | Period, Farm, Commodity, Activity, Planner, Planned / Actual hrs, **@ Notes**. |
| **Analytics accordion** | Collapsed by default — Power BI–style pie + planned vs actual bars. |

Farm Planners only see their assigned farms here. Site Managers and Admins see all farms.

---

## 7. Map View tab

Pick a farm chip, then **Show map** for the greenhouse layout (MINI / FRED / HARVEST). Available to all signed-in roles.

---

## 8. Admin tab (System Admin only)

Sections open **one at a time** in accordions (less scroll).

### Provision User via SSO

1. Type `priya`, `luis`, `emily`, `david`, or `hannah` in directory lookup.
2. Click a match. **Full name** auto-fills.
3. Choose a role. For **Farm Planner**, assign farms / commodities / activities.
4. **Link & Save User**. **Cancel** clears the form.

### Planning report provisioning

Each report can be Enabled/Disabled. Assign farms, commodities, and activities via lists.

### Farm × day shift scheduler + guardrails

Configure daily shifts per farm. Guardrails use logic-gate style conditions (metric, threshold, optional scope).

### User Directory + Global Entity Management

- Directory: filter, pastel **Edit** / **Delete** (cannot delete yourself).
- Entities: Farms, Commodities, Activities — add, Edit rename, Delete. Farm **Crops** drives Planner commodity lists.

### Speed calibration

Minutes-per-row style calibration for activities.

---

## 9. Business rules you will notice

| Rule | What happens |
|---|---|
| Temporal lock | Ended calendar days cannot be edited. |
| Empty submit | Submit is rejected if no slots have people. |
| Audit on change | Editing an already submitted farm / week / activity requires a reason. |
| Farm restriction | Planners only see assigned farms. |
| Admin hierarchy | Only System Admin sees the Admin tab. |
| Recommendation override | After Apply Recommendation, you can still paint over cells. |
| Invalid people input | Negatives, decimals, and letters are ignored. |

---

## 10. Sample data already in the prototype

You do not start from a blank system.

**Farms:** North Farm, Maroa, Ohio, Richmond, PepperCo, Morehead  

**Directory users already provisioned**

- Jordan Hale — System Admin  
- Alex Rivera — Farm Planner (North Farm, Maroa, Ohio)  
- Sarah Johnson — Site Manager  
- Mike Peterson — Farm Planner (Richmond, Morehead)

Prior weeks already contain planned hours so Summary and charts are populated before you enter anything.

---

## 11. If something looks wrong

| Issue | What to do |
|---|---|
| Grid will not accept clicks | On Labour Weekly, expand an activity. Check that the day is not in the past. |
| Commodity list looks “wrong” | Change **Farm** first. North Farm is the clean demo for crop filtering. |
| No Admin tab | You are not signed in as System Admin. Log out and switch persona. |
| Submit is greyed out | You are offline, or you are a Site Manager. |
| Numbers look like an old session | **Guide** → **Reset prototype data**, then sign in again. |
| Want to start the 15-minute tour over | Reset, then sign in as Farm Planner and return to section 4. |

---

## 12. What production will add later

This prototype is for look, flow, and rules — not go-live hosting.

Still to connect in the real build: Azure AD SSO, Azure SQL persistence, live Priva / Hortimax feeds, and embedded Power BI reports inside Mastronardi’s tenant (embed-ready under Sunset Grown).

---

*Labour Planner · Augusta Hitech for Mastronardi Produce / Sunset Grown*
