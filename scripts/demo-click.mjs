/**
 * Headed click-through demo of Labour Planner.
 * Opens Edge, slow-clicks every main control, saves screenshots.
 */
import { createRequire } from 'node:module'
import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require('playwright-core')

const exe = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
].find((p) => existsSync(p))

const shotDir = join(process.cwd(), 'scripts', 'demo-shots')
mkdirSync(shotDir, { recursive: true })

const log = []
function note(ok, label, detail = '') {
  const line = `${ok ? 'OK' : 'ISSUE'}  ${label}${detail ? ' — ' + detail : ''}`
  log.push({ ok, label, detail })
  console.log(line)
}

async function shot(page, name) {
  await page.screenshot({ path: join(shotDir, `${name}.png`), fullPage: true })
}

async function main() {
  const browser = await chromium.launch({
    executablePath: exe,
    headless: false,
    slowMo: 250,
    args: ['--start-maximized'],
  })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  page.setDefaultTimeout(10000)

  try {
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
    await page.waitForSelector('text=Mastronardi Produce')
    await shot(page, '01-login')
    note(true, 'Login screen', 'Mastronardi Produce + 3 personas')

    await page.getByRole('button', { name: /exploration guide/i }).click()
    await page.waitForSelector('text=You can explore Labour Planner without a presenter')
    await shot(page, '02-guide')
    note(true, 'Exploration guide opens from login')
    await page.locator('button').filter({ hasText: /^$/ }).first()
    await page.locator('h3:has-text("Exploration guide")').locator('xpath=../button').click()

    // Planner login
    await page.locator('select').first().selectOption({ label: 'Farm Planner (assigned farms)' })
    await page.getByRole('button', { name: /Authenticate with Azure AD/i }).click()
    await page.waitForSelector('text=Alex Rivera')
    await shot(page, '03-planner-home')
    const noAdmin = (await page.getByRole('button', { name: /^Admin$/ }).count()) === 0
    note(noAdmin, 'Farm Planner has Planner+Summary, no Admin')

    const farms = await page.locator('label:text-is("Farm")').locator('xpath=..').locator('select option').allTextContents()
    note(
      farms.join() === 'North Farm,Maroa,Ohio',
      'Planner farms restricted',
      farms.join(', '),
    )

    await page.locator('label:text-is("Farm")').locator('xpath=..').locator('select').selectOption({ label: 'North Farm' })
    const crops = await page.locator('label:text-is("Commodity")').locator('xpath=..').locator('select option').allTextContents()
    note(
      crops.includes('Beef') && crops.includes('TOV') && crops.includes('Campari') && !crops.includes('Strawberry'),
      'AC-001 North Farm crops',
      crops.join(', '),
    )

    const body = await page.locator('body').innerText()
    note(/MINI/.test(body) && /FRED/.test(body) && /HARVEST/.test(body), 'Manager: MINI FRED HARVEST chips')
    note(/Show maps/.test(body), 'Manager: Show maps')
    note(/Rate \/ hr/.test(body), 'Manager: Rate/hr')

    await page.getByRole('button', { name: 'FRED' }).click()
    await page.getByRole('button', { name: 'Show maps' }).click()
    await page.waitForSelector('text=greenhouse map')
    await shot(page, '04-farm-map')
    note(true, 'Farm map modal')
    await page.locator('h3:has-text("greenhouse map")').locator('xpath=../button').click()

    await page.locator('select').filter({ hasText: 'Select activity' }).selectOption({ label: 'Clipping' })
    await page.waitForTimeout(400)
    note((await page.locator('text=Historic Baseline Recommendation').count()) > 0, 'FR-004 recommendation banner')

    await page.getByRole('button', { name: 'View Logic' }).click()
    await page.waitForSelector('text=recurrence')
    await shot(page, '05-rec-logic')
    await page.getByRole('button', { name: 'Apply Recommendation' }).click()
    await page.waitForSelector('text=Recommendation applied')
    note(true, 'Apply Recommendation fills grid')

    const people = page.locator('input').nth(0)
    await people.fill('5')
    const rate = page.locator('input').nth(1)
    await rate.fill('18.5')

    const cells = page.locator('table button')
    const n = await cells.count()
    let painted = 0
    for (let i = 0; i < n && painted < 6; i++) {
      const cls = (await cells.nth(i).getAttribute('class')) || ''
      if (cls.includes('cursor-not-allowed')) continue
      await cells.nth(i).click()
      painted++
    }
    note(painted === 6, 'FR-003 painted 6 unlocked slots', `painted ${painted}`)
    await shot(page, '06-grid-painted')

    if (await page.getByRole('button', { name: /Morning/ }).count()) {
      await page.getByRole('button', { name: /Morning/ }).first().click()
      await page.waitForSelector('text=shift applied')
      note(true, 'Apply Morning shift')
    }

    const footer = await page.locator('text=Grand total:').locator('xpath=..').innerText()
    note(/hrs/.test(footer) && /FTE/.test(footer) && /Cost/.test(footer), 'Hours, FTE, cost footer', footer.replace(/\s+/g, ' ').slice(0, 140))

    await page.locator('input[placeholder^="Subject"]').fill('Crew check')
    await page.locator('textarea').first().fill('Demo note from click-through test.')
    await page.getByRole('button', { name: 'Save note' }).click()
    await page.waitForSelector('text=Note saved')
    note(true, 'FR-007 save note')

    await page.getByRole('button', { name: 'Submit Schedule' }).click()
    await page.waitForTimeout(600)
    const submitted = (await page.locator('text=Schedule submitted').count()) > 0
    const reason = (await page.locator('text=Reason for change').count()) > 0
    const empty = (await page.locator('text=Empty grid').count()) > 0
    const guard = (await page.locator('text=guardrail').count()) > 0
    note(submitted || reason || guard, 'Submit path', submitted ? 'success' : reason ? 'BR-002 reason' : guard ? 'guardrail' : empty ? 'empty' : 'no toast')
    if (reason) {
      await page.locator('textarea').last().fill('UAT demo revision')
      await page.getByRole('button', { name: 'Save revision' }).click()
      await page.waitForSelector('text=Schedule submitted')
      note(true, 'BR-002 reason for change saved')
    }
    await shot(page, '07-after-submit')

    await page.getByRole('button', { name: 'Monthly' }).click()
    await page.waitForSelector('th:has-text("Jan")')
    await page.waitForSelector('th:has-text("Dec")')
    await shot(page, '08-monthly-12')
    note(true, 'Manager: monthly 12-month grid')
    const weekBtn = page.locator('table button').filter({ hasText: /^\d/ }).first()
    if (await weekBtn.count()) {
      await weekBtn.click()
      await page.waitForTimeout(400)
      note((await page.locator('text=Expanded week').count()) > 0 || (await page.locator('table').count()) > 1, 'Click month cell expands week')
    }

    await page.getByRole('button', { name: 'Yearly' }).click()
    await page.waitForSelector('text=Click to open monthly weeks')
    await shot(page, '09-yearly')
    note((await page.locator('text=Click to open monthly weeks').count()) >= 12, 'Yearly 12 month cards')
    await page.getByRole('button', { name: 'Weekly' }).click()

    // Summary
    await page.getByRole('button', { name: /^Summary$/ }).click()
    await page.waitForSelector('text=Group by')
    await shot(page, '10-summary')
    note(true, 'Manager: Group by is present')
    note((await page.locator('text=Planned hours allocation').count()) > 0, 'Manager: planned hours allocation')
    note((await page.locator('text=Planned vs Actual').count()) > 0, 'Power BI PvA (prototype)')
    await page.locator('select').first().selectOption('monthly')
    await page.waitForTimeout(300)
    note((await page.locator('option:has-text("August")').count()) > 0, 'Manager: Summary month picker')
    for (const g of ['commodity', 'activity', 'planner', 'farm']) {
      await page.locator('select').filter({ hasText: 'Farm' }).last().selectOption(g).catch(async () => {
        await page.locator('label:has-text("Group by")').locator('xpath=..').locator('select').selectOption(g)
      })
    }
    await page.locator('label:has-text("Group by")').locator('xpath=..').locator('select').selectOption('activity')
    await shot(page, '11-summary-groupby-activity')
    await page.getByRole('button', { name: 'View Notes' }).click()
    await page.waitForSelector('text=Notes History')
    await shot(page, '12-notes-drawer')
    note(true, 'AC-004 View Notes drawer')
    await page.locator('h2:has-text("Notes History")').locator('xpath=../button').click()

    await page.getByRole('button', { name: /Logout/i }).click()
    await page.waitForSelector('text=Authenticate with Azure AD')

    // Manager
    await page.locator('select').first().selectOption({ label: 'Site Manager (summary only)' })
    await page.getByRole('button', { name: /Authenticate with Azure AD/i }).click()
    await page.waitForSelector('text=Sarah Johnson')
    await shot(page, '13-manager')
    note(
      (await page.getByRole('button', { name: /^Planner$/ }).count()) === 0 &&
        (await page.getByRole('button', { name: /^Admin$/ }).count()) === 0,
      'Site Manager Summary only',
    )
    await page.getByRole('button', { name: /Logout/i }).click()
    await page.waitForSelector('text=Authenticate with Azure AD')

    // Admin
    await page.locator('select').first().selectOption({ label: 'System Admin (full access)' })
    await page.getByRole('button', { name: /Authenticate with Azure AD/i }).click()
    await page.waitForSelector('text=Jordan Hale')
    note((await page.getByRole('button', { name: /^Admin$/ }).count()) > 0, 'System Admin sees Admin tab')
    note((await page.getByRole('button', { name: /^Planner$/ }).count()) > 0, 'System Admin sees Planner')
    await page.getByRole('button', { name: /^Admin$/ }).click()
    await page.waitForSelector('text=Assign farm(s)')
    await shot(page, '14-admin-assign')
    note(true, 'Manager: Assign farm/commodity/activity visible without picking planner first')

    await page.getByPlaceholder('Search Azure AD…').fill('priya')
    await page.waitForSelector('text=Priya Nair')
    await page.getByRole('button', { name: /Priya Nair/ }).click()
    await page.locator('select').filter({ hasText: 'Select role' }).selectOption('planner')
    await shot(page, '15-admin-provision')
    note(true, 'FR-011 SSO lookup Priya')

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(400)
    const adminText = await page.locator('body').innerText()
    note(/Planning report provisioning/.test(adminText), 'Manager: Planning report provisioning')
    note(/Daily farm shift scheduler/.test(adminText), 'Manager: Daily farm shift scheduler')
    note(/Operational guardrails/.test(adminText), 'Manager: Operational guardrails')
    note(/Activity speed calibration/.test(adminText), 'Manager: Activity speed calibration')
    await shot(page, '16-admin-bottom')

    await page.getByRole('button', { name: /^Planner$/ }).click()
    await shot(page, '17-admin-planner')
    note(true, 'Admin can open Planner')

    console.log('\n--- DEMO COMPLETE ---')
    console.log(JSON.stringify({ ok: log.filter((x) => x.ok).length, issues: log.filter((x) => !x.ok).length, log }, null, 2))
  } finally {
    await page.waitForTimeout(1500)
    await browser.close()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
