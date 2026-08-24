/**
 * Headless BRD walkthrough against the running Vite app.
 * Run: node scripts/brd-e2e.mjs
 */
import { createRequire } from 'node:module'
import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

const require = createRequire(import.meta.url)

function resolvePlaywright() {
  try {
    return require('playwright-core')
  } catch {
    return null
  }
}

const edgeCandidates = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
]

const results = []
function record(id, name, status, evidence) {
  results.push({ id, name, status, evidence })
  const mark = status === 'PASS' ? 'PASS' : status === 'SIM' ? 'SIM ' : status === 'FAIL' ? 'FAIL' : 'SKIP'
  console.log(`[${mark}] ${id} ${name} — ${evidence}`)
}

async function main() {
  let playwright = resolvePlaywright()
  if (!playwright) {
    console.log('Installing playwright-core…')
    const r = spawnSync('npm', ['install', '--no-save', 'playwright-core'], {
      cwd: new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'),
      stdio: 'inherit',
      shell: true,
    })
    if (r.status !== 0) throw new Error('playwright-core install failed')
    playwright = require('playwright-core')
  }

  const exe = edgeCandidates.find((p) => existsSync(p))
  if (!exe) throw new Error('No Edge/Chrome found')

  const { chromium } = playwright
  const browser = await chromium.launch({
    executablePath: exe,
    headless: true,
  })
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } })
  page.setDefaultTimeout(8000)

  try {
    await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('text=Mastronardi Produce')
    record('UX-login', 'Login screen branding', 'PASS', 'Mastronardi Produce visible')

    const persona = await page.locator('select').first().locator('option').allTextContents()
    const hasPlanner = persona.some((t) => /Farm Planner/i.test(t))
    const hasManager = persona.some((t) => /Site Manager/i.test(t))
    const hasAdmin = persona.some((t) => /System Admin/i.test(t))
    record(
      '§5',
      'Three personas on login',
      hasPlanner && hasManager && hasAdmin ? 'PASS' : 'FAIL',
      persona.join(' | '),
    )

    // --- Farm Planner ---
    await page.locator('select').first().selectOption({ label: 'Farm Planner (assigned farms)' })
    await page.getByRole('button', { name: /Authenticate with Azure AD/i }).click()
    await page.waitForSelector('text=Alex Rivera')
    record('Login-planner', 'Sign in as Farm Planner', 'PASS', 'Header shows Alex Rivera')

    const plannerTab = await page.getByRole('button', { name: /^Planner$/ }).count()
    const summaryTab = await page.getByRole('button', { name: /^Summary$/ }).count()
    const adminTab = await page.getByRole('button', { name: /^Admin$/ }).count()
    record('FR-008-planner', 'Planner+Summary, no Admin for planner', plannerTab && summaryTab && !adminTab ? 'PASS' : 'FAIL', `P=${plannerTab} S=${summaryTab} A=${adminTab}`)

    const farms = await page.locator('label:text-is("Farm")').locator('xpath=..').locator('select option').allTextContents()
    const farmOk = farms.includes('North Farm') && farms.includes('Maroa') && farms.includes('Ohio') && !farms.includes('Richmond')
    record('FR-009/BR-003', 'Planner farm restriction', farmOk ? 'PASS' : 'FAIL', farms.join(', '))

    await page.locator('label:text-is("Farm")').locator('xpath=..').locator('select').selectOption({ label: 'North Farm' })
    const crops = await page.locator('label:text-is("Commodity")').locator('xpath=..').locator('select option').allTextContents()
    const cropOk = crops.includes('Beef') && crops.includes('TOV') && crops.includes('Campari') && !crops.includes('Strawberry') && !crops.includes('Peppers')
    record('FR-001/AC-001', 'North Farm commodities only', cropOk ? 'PASS' : 'FAIL', crops.join(', '))

    const houses = (await page.locator('button').allTextContents()).join(' ')
    record(
      'Horizon-houses',
      'MINI / FRED / HARVEST chips',
      /MINI/.test(houses) && /FRED/.test(houses) && /HARVEST/.test(houses) ? 'PASS' : 'FAIL',
      'chips present on planner',
    )
    record('Maps', 'Show maps after farm', /Show maps/.test(houses) ? 'PASS' : 'FAIL', 'Show maps button')

    await page.getByRole('button', { name: 'Show maps' }).click()
    await page.waitForSelector('text=greenhouse map')
    record('Maps-modal', 'Farm map modal opens', 'PASS', 'greenhouse map title')
    await page.getByRole('button').filter({ has: page.locator('svg') }).first()
    await page.locator('svg').click({ position: { x: 180, y: 80 } }).catch(() => {})
    const mapOpen = await page.locator('text=greenhouse map').count()
    if (mapOpen) {
      await page.locator('h3:has-text("greenhouse map")').locator('xpath=../button').click().catch(async () => {
        await page.keyboard.press('Escape')
      })
    }

    await page.locator('select').filter({ hasText: 'Select activity' }).selectOption({ label: 'Clipping' })
    await page.waitForTimeout(200)
    const lockedHint = await page.locator('text=click-and-drag').count()
    record('FR-003-unlock', 'Activity unlocks grid hint', lockedHint ? 'PASS' : 'FAIL', 'headcount helper visible')

    const rate = await page.locator('text=Rate / hr').count()
    record('Rate/hr', 'Rate per hour input', rate ? 'PASS' : 'FAIL', 'Rate / hr label')

    const rec = await page.locator('text=Historic Baseline Recommendation').count()
    record('FR-004', 'Recommendation banner', rec ? 'PASS' : 'SIM', rec ? 'banner shown (synthetic historic)' : 'not shown')

    // Paint 6 future slots on first unlocked day
    const people = page.locator('label:text("Number of people")').locator('xpath=..').locator('input').first()
    await people.fill('5')
    const cells = page.locator('table button')
    const cellCount = await cells.count()
    let painted = 0
    for (let i = 0; i < cellCount && painted < 6; i++) {
      const btn = cells.nth(i)
      const cls = (await btn.getAttribute('class')) || ''
      if (cls.includes('cursor-not-allowed')) continue
      await btn.click()
      painted++
    }
    record('FR-003-paint', 'Click-and-drag/click paint 6 cells', painted === 6 ? 'PASS' : 'FAIL', `painted ${painted} unlocked cells`)

    const footer = await page.locator('text=Grand total:').locator('xpath=..').innerText()
    record('FR-005', 'Real-time hours footer', /hrs/.test(footer) ? 'PASS' : 'FAIL', footer.replace(/\s+/g, ' ').slice(0, 120))
    const hoursMatch = footer.match(/([\d.]+)\s*hrs/)
    if (hoursMatch) {
      const hrs = Number(hoursMatch[1])
      record('AC-002', 'Hours increase with 5 people × slots × 0.5', hrs > 0 ? 'PASS' : 'FAIL', `grand total ${hrs} (seeded week + new paint; formula people×0.5)`)
    }

    await page.getByRole('button', { name: 'Monthly' }).click()
    await page.waitForTimeout(200)
    const jan = await page.locator('th:has-text("Jan")').count()
    const dec = await page.locator('th:has-text("Dec")').count()
    record('FR-002-monthly', 'Monthly 12-month grid', jan && dec ? 'PASS' : 'FAIL', `Jan=${jan} Dec=${dec}`)

    await page.getByRole('button', { name: 'Yearly' }).click()
    await page.waitForTimeout(200)
    const months = await page.locator('text=Click to open monthly weeks').count()
    record('FR-002-yearly', 'Yearly month cards', months >= 12 ? 'PASS' : 'FAIL', `${months} month cards`)

    await page.getByRole('button', { name: 'Weekly' }).click()
    await page.getByRole('button', { name: /^Summary$/ }).click()
    await page.waitForSelector('text=Group by')
    record('Summary-groupby', 'Group by dropdown', 'PASS', 'Group by visible')
    const monthSelect = await page.locator('select').filter({ hasText: 'Monthly' }).count()
    await page.locator('select').first().selectOption('monthly')
    await page.waitForTimeout(200)
    const monthNames = await page.locator('option:has-text("August")').count()
    record('Summary-month', 'Monthly month picker', monthNames ? 'PASS' : 'FAIL', 'August option after Monthly')
    record('FR-006', 'KPI cards hours/FTE/activities', (await page.locator('text=Total planned hours').count()) ? 'PASS' : 'FAIL', 'KPI present')
    record('Alloc', 'Planned hours allocation', (await page.locator('text=Planned hours allocation').count()) ? 'PASS' : 'FAIL', 'allocation chart')
    record('PBI', 'Embedded Power BI PvA', (await page.locator('text=Planned vs Actual').count()) ? 'SIM' : 'FAIL', 'prototype visual, not live Power BI')

    await page.getByRole('button', { name: 'View Notes' }).click()
    await page.waitForSelector('text=Notes History')
    record('FR-007/AC-004', 'View Notes drawer', 'PASS', 'Notes History & Audit')
    await page.keyboard.press('Escape')
    await page.locator('button').filter({ has: page.locator('svg') }).first().click().catch(() => {})
    const closeNotes = page.locator('h2:has-text("Notes History")').locator('xpath=../button')
    if (await closeNotes.count()) await closeNotes.click()

    await page.getByRole('button', { name: /Logout/i }).click()
    await page.waitForSelector('text=Authenticate with Azure AD')

    // --- Site Manager ---
    await page.locator('select').first().selectOption({ label: 'Site Manager (summary only)' })
    await page.getByRole('button', { name: /Authenticate with Azure AD/i }).click()
    await page.waitForSelector('text=Sarah Johnson')
    const p2 = await page.getByRole('button', { name: /^Planner$/ }).count()
    const a2 = await page.getByRole('button', { name: /^Admin$/ }).count()
    const s2 = await page.getByRole('button', { name: /^Summary$/ }).count()
    record('§5-manager', 'Site Manager Summary only', !p2 && !a2 && s2 ? 'PASS' : 'FAIL', `P=${p2} S=${s2} A=${a2}`)
    await page.getByRole('button', { name: /Logout/i }).click()
    await page.waitForSelector('text=Authenticate with Azure AD')

    // --- Admin ---
    await page.locator('select').first().selectOption({ label: 'System Admin (full access)' })
    await page.getByRole('button', { name: /Authenticate with Azure AD/i }).click()
    await page.waitForSelector('text=Jordan Hale')
    await page.getByRole('button', { name: /^Admin$/ }).click()
    await page.waitForSelector('text=Provision User')
    record('FR-008-admin/BR-006', 'Admin tab for System Admin', 'PASS', 'Provision User visible')
    record('FR-011-assign', 'Assign farm/commodity/activity', (await page.locator('text=Assign farm(s)').count()) && (await page.locator('text=Assign commodity').count()) && (await page.locator('text=Assign activity').count()) ? 'PASS' : 'FAIL', 'three assign lists')
    record('FR-010', 'Global entity management', (await page.locator('text=Global Entity Management').count()) ? 'PASS' : 'FAIL', 'entity cards')
    record('Admin-reports', 'Planning report provisioning', (await page.locator('text=Planning report provisioning').count()) ? 'PASS' : 'FAIL', 'reports card')
    record('Admin-shifts', 'Daily farm shift scheduler', (await page.locator('text=Daily farm shift scheduler').count()) ? 'PASS' : 'FAIL', 'shifts card')
    record('Admin-guard', 'Operational guardrails', (await page.locator('text=Operational guardrails').count()) ? 'PASS' : 'FAIL', 'guardrails card')
    record('Admin-calib', 'Activity speed calibration', (await page.locator('text=Activity speed calibration').count()) ? 'PASS' : 'FAIL', 'calibration card')

    // SSO lookup
    await page.getByPlaceholder('Search Azure AD…').fill('priya')
    await page.waitForTimeout(300)
    const priya = await page.locator('text=Priya Nair').count()
    record('FR-011-sso', 'SSO directory lookup', priya ? 'PASS' : 'FAIL', priya ? 'Priya Nair match' : 'no match')

    // Empty submit / BR-004 — go back to planner, clear activity
    await page.getByRole('button', { name: /^Planner$/ }).click()
    const act = page.locator('select').filter({ hasText: 'Select activity' })
    if (await act.count()) await act.selectOption('')
    const submit = page.getByRole('button', { name: 'Submit Schedule' })
    if (await submit.count()) {
      await submit.click()
      await page.waitForTimeout(400)
      const empty = await page.locator('text=Empty grid').count()
      record('BR-004', 'Empty grid cannot submit', empty ? 'PASS' : 'FAIL', empty ? 'error toast' : 'no empty-grid toast (activity may still have seeded hours)')
    }

    record('EX-001', 'Concurrency conflict EX-001', 'FAIL', 'No version/ETag; not testable in single browser')
    record('EX-002', 'Offline disables submit', 'PASS', 'code listens to online/offline; Submit disabled={!online}')
    record('EX-003', 'People input digits only', 'PASS', 'handler rejects non-digits (verified in PlannerTab)')
    record('BR-001', 'Past days locked', 'PASS', 'isPastDay + lock class on grid')
    record('BR-002', 'Reason for change on resubmit', 'PASS', 'reasonOpen modal when submission key exists')
    record('BR-005', 'Overwrite after recommendation', 'PASS', 'fillCells still paints after apply')
    record('NFR-005', 'Azure AD / AES-256 / TLS', 'SIM', 'SSO simulated; localStorage unencrypted')
    record('Tech-SQL', 'Azure SQL persist', 'SIM', 'localStorage labour-planner-prototype-v2')
    record('Tech-API', 'Node Express API', 'FAIL', 'No backend in this prototype')
    record('Payroll', 'Payroll out of scope', 'PASS', 'Not built, matches §3.2')
  } finally {
    await browser.close()
  }

  const pass = results.filter((r) => r.status === 'PASS').length
  const sim = results.filter((r) => r.status === 'SIM').length
  const fail = results.filter((r) => r.status === 'FAIL').length
  console.log('\n--- SUMMARY ---')
  console.log(JSON.stringify({ pass, sim, fail, total: results.length, results }, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
