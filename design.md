# Labor Planner — Design System & UI Reference

> **Source of truth** for all visual design, interaction patterns, and UI architecture in the Labor Planner prototype.
> Production frontend (`labor-planner-fe`) must follow this document when porting screens.

---

## 1. Product context

| Item | Value |
|------|-------|
| Product | Labor Planner |
| Client / brand | Mastronardi Produce · Sunset Grown |
| Domain | Greenhouse farm labor allocation |
| Users | System Admin, Farm Planner, Site Manager |
| Prototype stack | React 19 · Vite · Tailwind CSS v4 · lucide-react |
| State | Single `AppContext` reducer + `localStorage` persistence |

The prototype is a **fully interactive demo** — every control works with mock data in the browser. It is not wired to Azure AD or a backend API.

---

## 2. Design principles

1. **Produce-first palette** — greens and earth tones evoke greenhouse operations; sunset orange is an accent only.
2. **Glass + gradient depth** — dark navy header, frosted panels, soft radial backgrounds. Avoid flat grey enterprise UI.
3. **Dense but legible** — planners work with grids and filters; use uppercase kickers, bold labels, and tight spacing without clutter.
4. **Role-aware chrome** — navigation and tabs hide/show based on persona (admin, planner, manager).
5. **Sticky context** — filters and submit bars stay visible while scrolling long grids.
6. **Progressive disclosure** — Admin uses single-open accordions; Planner nests grids in accordions.
7. **Feedback everywhere** — toasts, offline banner, lock icons on past days, reason modal on resubmit.

---

## 3. Brand & copy

| Element | Copy |
|---------|------|
| App title | Labor Planner |
| Subtitle (header) | Sunset Grown · Mastronardi Produce · Farm ops module |
| Login hero kicker | Farm operations |
| Login tagline | Allocate crews by farm, greenhouse house, commodity, and 30-minute slot. |
| SSO button | Authenticate with Azure AD |
| SSO note | Azure AD SSO simulation — production will use corporate single sign-on |

**Logo mark:** `LP` in a rounded square with `from-brand to-brand-dark` gradient, or `Leaf` icon on login.

---

## 4. Color tokens

Defined in `src/index.css` via Tailwind `@theme`:

| Token | Hex | Usage |
|-------|-----|-------|
| `brand` | `#2db84b` | Primary actions, active nav, medium grid cells |
| `brand-dark` | `#1f9a3a` | Hover states, high headcount cells |
| `teal` | `#1a7a4c` | Kickers, info accents, alert text |
| `sunset` | `#e85d04` | Header gradient accent (right end) |
| `navy` | `#163528` | Header bg, modal title bar, table headers |
| `ink` | `#12241c` | Primary text |
| `mist` | `#f3faf5` | Light surfaces |
| `line` | `#d5e6da` | Borders, grid lines |
| `pastel-blue` | `#ebf5ff` | Info backgrounds (rare) |
| `pastel-red` | `#fff5f5` | Error backgrounds (rare) |

**Body background:** layered radial gradients on `#e8f3eb` → `#f6fbf7` (fixed attachment).

**Header accent strip:** `h-1` gradient `from-brand via-[#7ddf8a] to-sunset`.

**Role badge color:** `#8dff9f` (uppercase role label in header).

---

## 5. Typography

| Setting | Value |
|---------|-------|
| Font family | **Plus Jakarta Sans** (Google Fonts) |
| Body | `text-sm` (14px), `text-ink` |
| Page title | `text-lg font-extrabold tracking-tight` |
| Kicker | `.lp-kicker` — 11px, 800 weight, 0.16em letter-spacing, uppercase, `text-teal` |
| Label | `.lp-label` — 10px, 800 weight, 0.12em letter-spacing, uppercase, `#5c7464` |
| Header title | `text-base font-extrabold` |
| Header meta | `text-[10px] font-medium text-white/55` |

Load font in `index.html`:

```html
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap" rel="stylesheet" />
```

---

## 6. Spacing & layout

| Pattern | Spec |
|---------|------|
| Max content width | `max-w-7xl` (shell main) |
| Shell padding | `px-3 py-3 md:px-6 md:py-4` |
| Header padding | `px-4 py-2.5 md:px-6` |
| Panel radius | `12px` (`.lp-panel`, accordions) |
| Input radius | `10px` |
| Nav pill radius | `12px` container, `10px` buttons |
| Sticky bar | `border-radius: 14px`, `z-index: 30` |

**Breakpoints:** Tailwind defaults — mobile nav collapses to bottom tab row under `md`.

---

## 7. CSS utility library (`lp-*` classes)

All custom classes live in `src/index.css`. Use these instead of one-off styles.

### Surfaces

| Class | Purpose |
|-------|---------|
| `.lp-panel` | Frosted white card — login form, content cards |
| `.lp-shell-bg` | Authenticated app background |
| `.lp-header-glass` | Dark gradient sticky header |
| `.lp-nav-pill` | Semi-transparent nav container |
| `.lp-login-hero` | Full-height login left panel gradient |

### Form controls

| Class | Purpose |
|-------|---------|
| `.lp-input` / `.lp-select` | Text inputs and selects |
| `.lp-chip` | Pill filter button (off state) |
| `.lp-chip-on` | Pill filter button (active) |

### Buttons

| Class | Purpose |
|-------|---------|
| `.lp-btn-primary` | Green gradient CTA |
| `.lp-btn-ghost` | Outlined secondary |

### Layout helpers

| Class | Purpose |
|-------|---------|
| `.lp-workspace` | Flex column page container |
| `.lp-workspace-main` | Scrollable grid area |
| `.lp-sticky-bar` | Top filter/context strip |
| `.lp-sticky-submit` | Bottom submit bar |
| `.lp-page` | Page enter animation |

### Accordion

| Class | Purpose |
|-------|---------|
| `.lp-accordion` | Container |
| `.lp-accordion-trigger` | Header button (`aria-expanded`) |
| `.lp-accordion-body` | Content panel |
| `.lp-accordion-chevron` | Rotates 180° when open |

### Grid / schedule

| Class | Purpose |
|-------|---------|
| `.lp-cell` | Schedule cell base |
| `.lp-cell-live` | Hover scale on editable cells |
| `.lp-step` / `.lp-step-on` | Wizard step chips |
| `.custom-scroll` | Styled scrollbars for grids |
| `.grid-select-none` | Disable text selection during drag |

### Animation

```css
@keyframes lp-in {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: none; }
}
```

Duration: `0.32s cubic-bezier(0.22, 1, 0.36, 1)` on pages; `0.2s` on accordion body.

---

## 8. Icons

**Library:** `lucide-react` only. Do not mix icon sets.

| Area | Icons |
|------|-------|
| Nav | `CalendarDays` (Planner), `ChartPie` (Summary), `MapPinned` (Map), `Settings` (Admin) |
| Header | `HelpCircle`, `LogOut` |
| Login | `Leaf`, `Sparkles`, `ShieldCheck`, `BookOpen` |
| Planner | `MapPin`, `Lock` |
| Summary | `Filter`, `ClipboardList`, `Clock3`, `Layers3`, `Users` |
| Admin | `Search`, `Shield`, `Trash2`, `UserPlus`, `Warehouse` |
| Toasts | `CheckCircle2`, `AlertTriangle`, `Info`, `WifiOff`, `X` |
| Modal | `X` |

**Icon sizing:** `h-4 w-4` in nav/buttons; `h-5 w-5` in header actions; `h-3.5 w-3.5` inline in chips.

---

## 9. Component inventory

### App shell

| Component | File | Role |
|-----------|------|------|
| `App` | `src/App.tsx` | Provider + auth gate |
| `LoginScreen` | `components/LoginScreen.tsx` | Landing / SSO simulation |
| `AppShell` | `components/AppShell.tsx` | Header + main outlet |
| `HelpModal` | `components/HelpModal.tsx` | Exploration guide |
| `Toasts` | `components/Toasts.tsx` | Toast stack |
| `OfflineBanner` | `components/Toasts.tsx` | Connectivity strip |
| `NotesDrawer` | `components/NotesDrawer.tsx` | Side drawer for notes/audit |

### Feature tabs

| Tab | Component | Key children |
|-----|-----------|--------------|
| Planner | `PlannerTab.tsx` | `ScheduleGrid`, `BiWeeklyLaborGrid`, `MonthlyBudgetGrid`, `HarvestPlanGrid`, `GanttPlanGrid`, `AnnualLaborBudgetGrid`, `FarmMapModal` |
| Summary | `SummaryTab.tsx` | Filters, KPI cards, charts, detail table, notes link |
| Map | `MapViewTab.tsx` | Farm chips + `FarmMapModal` |
| Admin | `AdminTab.tsx` | `Accordion` sections, `AdminOps` cards |

### Shared primitives

| Component | File | Pattern |
|-----------|------|---------|
| `Modal` | `Modal.tsx` | Overlay `z-[70]`, navy title bar, `md` / `xl` sizes |
| `Accordion` | `Accordion.tsx` | Single-open groups in Admin |
| `Field` | inline in `PlannerTab` | Label + control wrapper |

---

## 10. Screen layouts

### 10.1 Login (`LoginScreen`)

```
┌─────────────────────┬─────────────────────┐
│  lp-login-hero      │  gradient bg        │
│  (lg only)          │  ┌───────────────┐  │
│  · brand row        │  │  lp-panel     │  │
│  · kicker badge     │  │  Sign in      │  │
│  · H1 + tags        │  │  role select  │  │
│  · footer tagline   │  │  Azure button │  │
│                     │  └───────────────┘  │
└─────────────────────┴─────────────────────┘
```

- **Desktop:** 2-column `lg:grid-cols-2`
- **Mobile:** right panel only; compact title above form
- **CTA:** full-width navy gradient button with Microsoft 4-square SVG

### 10.2 Authenticated shell (`AppShell`)

```
┌──────────────────────────────────────────────────────────┐
│ ▓ brand → sunset accent strip (1px)                      │
│ [LP] Labor Planner          [Nav pills]    User · Logout│
│      Sunset Grown · ...                                  │
├──────────────────────────────────────────────────────────┤
│ mobile: Planner | Summary | Map | Admin (full width)     │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  max-w-7xl main · page content                           │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

- Nav uses **state tab switching** (`dispatch setTab`), not URL routes
- Active tab: `bg-brand text-white shadow-md shadow-brand/30`
- Inactive: `text-white/75 hover:bg-white/10`

### 10.3 Planner tab

**Structure:**

1. `.lp-sticky-bar` — kicker + title + filter grid (plan type, week, year, farm, commodity, activity, house, headcount)
2. Recommendation banner (dismissible)
3. Accordion sections per grid type
4. `.lp-sticky-submit` — hours summary + Submit Schedule

**Plan types** (`PLAN_TYPE_OPTIONS`):

| ID | Label | Group |
|----|-------|-------|
| `labor-weekly` | Labor (Weekly) | Labor Plans |
| `labor-monthly` | Labor (Monthly Budget) | Labor Plans |
| `harvest-weekly` | Harvest (Weekly) | Mini-FRED Harvest Plans |
| `tearout-gantt` | Tear-Out (Weekly Gantt) | Tear-Out / Cleanout |
| `planting-gantt` | Planting (Weekly Gantt) | Planting |

### 10.4 Schedule grid (`ScheduleGrid`)

| Element | Style |
|---------|-------|
| Container | `max-h-[620px]`, `custom-scroll`, `border-line` |
| Header row | `bg-navy text-white sticky top-0` |
| Time column | `w-28`, uppercase labels |
| Past days | `Lock` icon, cells locked (`bg-slate-100/200`) |
| Empty cell | `bg-white hover:bg-green-50` |
| Low headcount (1–3) | `bg-green-100 text-green-800` |
| Medium (4–6) | `bg-brand/80 text-white` |
| High (7+) | `bg-brand-dark text-white` |
| Interaction | Click + drag to paint cells (`pointerup` ends drag) |

**Time model:** 30-minute slots (`SLOT_COUNT` slots per day). Hours = headcount × 0.5h per slot.

### 10.5 Summary tab

- Sticky filter bar: horizon (weekly/monthly/yearly), year, week, farm, commodity, activity, planner, group-by
- KPI row: total hours, FTE, activity count, etc.
- Bar chart accordions (by farm, commodity)
- Detail / rollup table
- Link to notes drawer

### 10.6 Admin tab

- Page intro kicker + title
- **Single-open accordion** (state in `sessionStorage` key `lp-admin-accordion`)
- Sections: Provision SSO, Report provisioning, Shift scheduler, Guardrails, User directory, Entity management, Calibration

### 10.7 Map view

- Farm chip row (`.lp-chip` / `.lp-chip-on`)
- Opens `FarmMapModal` (xl modal)

---

## 11. Modal & overlay patterns

| Layer | z-index | Component |
|-------|---------|-----------|
| Sticky bar | 30 | Filter strips |
| Header | 40 | App shell |
| Modal backdrop | 70 | `Modal` |
| Toasts | 80 | `Toasts` |

**Modal anatomy:**

- Backdrop: `bg-navy/45 backdrop-blur-sm`
- Panel: `rounded-[8px] border-line bg-white shadow-2xl`
- Title bar: `bg-navy px-5 py-3 text-white`
- Sizes: `max-w-lg` (md) · `max-w-5xl h-[min(90vh,840px)]` (xl)

**Toast anatomy:**

- Fixed `right-4 bottom-4`, max-width `sm`
- Tones: `success` (brand icon), `error`, `info`, `warning`
- Auto-dismiss ~4.5s

---

## 12. Role-based UI

| Role | `roleLabel` | Planner tab | Summary tab | Map tab | Admin tab |
|------|-------------|-------------|-------------|---------|-----------|
| `admin` | System Admin | ✅ | ✅ | ✅ | ✅ |
| `planner` | Farm Planner | ✅ | ✅ | ✅ | ❌ |
| `manager` | Site Manager | ❌ | ✅ | ✅ | ❌ |

**Demo users** (`src/data/mock.ts`):

| Persona | Name | Email |
|---------|------|-------|
| System Admin | Jordan Hale | jordan.hale@mastronardi.com |
| Farm Planner | Alex Rivera | alex.rivera@mastronardi.com |
| Site Manager | (see mock) | — |

**Farm scoping:** planners only see assigned `farmIds`; commodities/activities filter per farm.

---

## 13. Interaction & business rules (UI-visible)

| Rule | UI behaviour |
|------|--------------|
| Past days locked | Grey cells + lock icon in header |
| Submitted week edit | `ReasonModal` requires reason text |
| Empty grid submit | Blocked with error toast |
| Offline | `OfflineBanner` at top |
| Recommendation | Banner with Apply / Dismiss |
| Notes | Drawer from Summary or Planner |
| Prototype reset | Help modal → Reset prototype data |

---

## 14. Data & domain types (UI-relevant)

Key types in `src/types.ts`:

- `Role`, `Tab`, `Horizon`, `GroupBy`, `PlanType`, `HouseId`
- `User`, `Farm`, `Commodity`, `Activity`, `Cell`, `Note`, `Toast`
- `GreenhouseHouse`, `ShiftTemplate`, `Guardrails`, `PlanningReport`

Cell key format: `farmId|houseId|commodityId|activityId|date|slot`

---

## 15. File map (design-related)

```
src/
├── index.css              ← ALL design tokens + lp-* classes
├── App.tsx                ← Shell routing (auth gate)
├── types.ts               ← Domain + plan type labels
├── data/mock.ts           ← Demo personas, farms, seed grid data
├── store/AppContext.tsx   ← Tab state, UI flags, toasts
└── components/
    ├── LoginScreen.tsx    ← Landing page
    ├── AppShell.tsx       ← Header + nav
    ├── PlannerTab.tsx     ← Planner layout pattern
    ├── SummaryTab.tsx     ← Summary layout pattern
    ├── AdminTab.tsx       ← Accordion admin pattern
    ├── MapViewTab.tsx     ← Map chips
    ├── ScheduleGrid.tsx   ← Grid cell colours + interaction
    ├── Modal.tsx          ← Dialog primitive
    ├── Accordion.tsx      ← Collapse primitive
    └── Toasts.tsx         ← Feedback primitives
```

---

## 16. Porting checklist (for `labor-planner-fe`)

When copying a screen to production:

1. Copy **JSX structure + Tailwind classes** from the prototype component.
2. Copy required **`.lp-*` rules** into `labor-planner-fe/src/index.css` (do not duplicate `@theme`).
3. Replace `useStore` / `dispatch` with **React Router** (`NavLink`, `useNavigate`) or feature hooks.
4. Replace tab switching with **route paths** (`/planner`, `/summary`, `/admin`).
5. Keep **lucide-react** icon names identical.
6. Preserve **aria** attributes on accordions and modals.
7. Do not change colours, radii, or copy without updating this file first.

---

## 17. Related docs

| File | Purpose |
|------|---------|
| `README.md` | How to run and demo the prototype |
| `GUIDE.md` | Client exploration guide (in-app + printable) |
| `../labor-planner-fe/design.md` | Production implementation map |
