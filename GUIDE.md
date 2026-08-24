# Labour Planner — Self-Exploration Guide

Use this guide to click through the prototype on your own. You do not need a presenter, Figma, or Azure access. Every button in the app is live; this document tells you what to try and what you should see.

**Prototype type:** clickable web application (not a static mock)  
**Data:** stored in your browser only  
**Reset:** header → **Exploration guide** → **Reset prototype data**

---

## 1. What you are looking at

Labour Planner is the proposed workforce allocation application for Mastronardi Produce Farm Operations. Supervisors plan labour by farm, commodity, activity, and 30-minute time slot. Managers review totals and notes. Admins manage users and master data.

This prototype shows how that website will look and behave. The following are **simulated** so you can explore without production systems:

- Azure AD sign-in (choose a persona instead of a corporate password)
- Historic recommendations (Priva / Hortimax style)
- Power BI planned-versus-actual charts
- Save to Azure SQL (data stays in this browser)

Everything else — filters, the grid, calculations, notes, roles, and admin actions — works for real in the prototype.

---

## 2. How to open the prototype

1. Open the prototype URL you were given (for example `http://localhost:5173` or a shared HTTPS link).
2. You should see the **Mastronardi Produce** sign-in screen.
3. Keep this guide nearby, or click **Exploration guide** on the sign-in screen / in the app header.

If the app looks empty or “stuck” after an earlier session, reset prototype data from the guide panel and sign in again.

---

## 3. Sign in as a persona (5 minutes)

Production will use Azure AD. Here you pick a role so you can see different permissions.

| Persona | Who it represents | What you can do |
|---|---|---|
| **Farm Planner (assigned farms)** | Supervisor — Alex Rivera | Planner + Summary. Only North Farm, Maroa, and Ohio. |
| **Site Manager (summary only)** | Operations — Sarah Johnson | Summary only. All farms. Cannot edit the grid or open Admin. |
| **System Admin (full access)** | FarmOps IT — Jordan Hale | Planner, Summary, and Admin. All farms. |

**Try this**

1. Leave the dropdown on **Farm Planner**.
2. Click **Authenticate with Azure AD**.
3. Confirm the header shows **Alex Rivera / Farm Planner**.
4. Confirm you see **Planner** and **Summary** tabs, and **no Admin tab**.
5. Click **Logout** (top right), sign in as **Site Manager**, and confirm there is **no Planner tab**.
6. Log out again and sign in as **System Admin**. Confirm the **Admin** tab appears.

Stay signed in as **Farm Planner** for the next section.

---

## 4. Suggested 15-minute tour

Follow these steps in order the first time. After that, jump to any section below.

### Step A — Cascading filters (North Farm)

1. Open the **Planner** tab.
2. Set **Farm** to **North Farm**.
3. Open the **Commodity** dropdown.

**You should see only Beef, TOV, and Campari.** Other crops (Strawberry, Lettuce, Peppers, Snacks) belong to other farms. This is the farm-to-commodity rule.

### Step B — Unlock the grid and paint hours

1. Set **Commodity** to **Beef**.
2. Set **Active Activity** to **Clipping**. The grid unlocks.
3. Set **Number of people** to **5** (digits only; decimals and letters are rejected).
4. Click the first open (unlocked) 30-minute cell, hold, and drag across **six** slots.

**You should see 15.0 hours added** (5 people × 6 slots × 0.5 hours). Footer totals and FTE update immediately. FTE = planned hours ÷ 40.

Grey cells with a lock are **past days**. You cannot edit them.

### Step C — Historic recommendation

1. If the blue **Historic Baseline Recommendation** banner is visible, click **View Logic**, then **Apply Recommendation**.
2. The unlocked slots fill from the historic pattern.
3. Enter a different headcount and drag over a few cells to overwrite the recommendation.

### Step D — Notes and submit

1. Scroll to **Labour Schedule Notes**.
2. Subject: `Crew availability`. Body: any short operational comment.
3. Click **Save note**, then **Submit Schedule**.
4. You should get a green success message and hours committed.

Submit a second time on the same farm / week / activity. The app will ask for a **reason for change** before it saves (audit rule).

### Step E — Summary and notes drawer

1. Open the **Summary** tab.
2. Read the three KPI cards: Total planned hours, FTE, Unique activities.
3. Change **Group by** to Farm, Commodity, Activity, Planner, and Horizon / week.
4. Click **View Notes**. The drawer lists comments with author, timestamp, farm, activity, and week.

### Step F — Other roles

1. Log out. Sign in as **Site Manager** and stay on Summary (read-only).
2. Log out. Sign in as **System Admin**.
3. Open **Admin**: search Azure AD for `Priya`, provision her as a Farm Planner, then add or delete a farm in **Global Entity Management**.

---

## 5. Planner tab — what each control does

### Planning horizon

- **Weekly** — default. Seven days, 6:00 AM–5:00 PM, in 30-minute slots. Use the arrows to change week.
- **Monthly** — all 12 months in one budget grid (planned hours, rate / hr, planned budget) plus a consolidated budget plan. With **MINI / FRED / HARVEST** selected, a row-wise house grid replaces the old week×month hours grid.
- **MINI / FRED / HARVEST** — house chips live in Planning Horizon (not a separate Greenhouse house section).

Past dates in the weekly grid stay locked.

### Operational scope

| Control | Behaviour |
|---|---|
| **Farm** | Limited to farms on your SSO profile. Changing farm resets commodity and activity. |
| **Commodity** | Only crops grown at the selected farm. |
| **Active Activity** | Required. The grid stays locked until you pick one. |

Each farm + commodity + activity combination is its own plan. Switching activity shows a different grid.

### Number of people + click-and-drag

1. Type a whole number (0 is allowed and clears cells as you drag).
2. Press on a cell and drag across others.
3. Each filled slot = that many people for 30 minutes.

**Hours for a cell** = people × 0.5  
**Example:** 5 people across 6 slots = 15.0 hours

### Recommendation banner

Shown after farm, commodity, and activity are selected. Values are a prototype of historic actuals (weeks 16–20, 60% recurrence).

- **View Logic** — sample weekly averages
- **Dismiss** — hide the banner for this selection
- **Apply Recommendation** — fill unlocked (future) slots; you can still overwrite any cell

### Notes and Submit Schedule

- **Save note** stores the comment with your name and timestamp against farm, week, and activity.
- **Submit Schedule** packages the grid as if it were posting to Azure SQL.
- Empty grids cannot be submitted.
- If the browser goes offline, Submit is disabled.

---

## 6. Summary tab

Use this as a manager or after you have submitted plans.

| Area | What to try |
|---|---|
| **Time horizon** | Weekly / Monthly / Yearly — KPIs and the table follow the same period as Planner. |
| **Filters** | Farm, commodity, activity, planner. **All** shows the full allowed scope. |
| **Group by** | Rebuilds the table instantly. |
| **KPI cards** | Hours, FTE (hours ÷ 40), unique activities. |
| **View Notes** | Slide-out audit history. Does not leave the Summary screen. |
| **Pie chart** | Planned hours allocation — share by the current Group by. |
| **Bar graph** | Power BI planned (green) vs actual (orange) from Priva / Hortimax. |

Farm Planners only see their assigned farms here. Site Managers and Admins see all farms.

---

## 7. Admin tab (System Admin only)

### Provision User via SSO

1. In **Directory email lookup**, type `priya`, `luis`, `emily`, `david`, or `hannah`.
2. Click a match. **Full name** auto-fills.
3. Choose a role. For **Farm Planner**, tick farms / commodities / activities.
4. **Link & Save User**. They appear in the User Directory. **Cancel** clears the form.

People already in the directory (Alex, Sarah, Jordan, Mike) will not appear in search.

### User Directory

- Filter by name or email.
- **Edit** (pastel blue) — change role and farm scope.
- **Delete** (pastel red) — confirm first. You cannot delete the user you are signed in as.

### Global Entity Management

Three cards: **Farms**, **Commodities**, **Activities**.

- Type a name and press **+** or Enter to add.
- **Delete** removes it from dropdowns.
- On a farm, **Crops** sets which commodities that farm grows (this is what North Farm filtering uses).

---

## 8. Business rules you will notice

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

## 9. Sample data already in the prototype

You do not start from a blank system.

**Farms:** North Farm, Maroa, Ohio, Richmond, PepperCo, Morehead  

**Directory users already provisioned**

- Jordan Hale — System Admin  
- Alex Rivera — Farm Planner (North Farm, Maroa, Ohio)  
- Sarah Johnson — Site Manager  
- Mike Peterson — Farm Planner (Richmond, Morehead)

Prior weeks already contain planned hours so Summary and Power BI are populated before you enter anything.

---

## 10. If something looks wrong

| Issue | What to do |
|---|---|
| Grid will not accept clicks | Select an **Active Activity**. Check that the day is not in the past. |
| Commodity list looks “wrong” | Change **Farm** first. North Farm is the clean demo for crop filtering. |
| No Admin tab | You are not signed in as System Admin. Log out and switch persona. |
| Submit is greyed out | You are offline, or you are a Site Manager. |
| Numbers look like an old session | **Exploration guide** → **Reset prototype data**, then sign in again. |
| Want to start the 15-minute tour over | Reset, then sign in as Farm Planner and return to section 4. |

---

## 11. What production will add later

This prototype is for look, flow, and rules — not go-live hosting.

Still to connect in the real build: Azure AD SSO, Azure SQL persistence, live Priva / Hortimax feeds, and embedded Power BI reports inside Mastronardi’s tenant.

---

*Labour Planner · Augusta Hitech for Mastronardi Produce Farm Operations*
