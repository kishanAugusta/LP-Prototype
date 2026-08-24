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

const dir = join(process.cwd(), 'scripts', 'verify-shots')
mkdirSync(dir, { recursive: true })

async function main() {
  const browser = await chromium.launch({ executablePath: exe, headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 980 } })
  page.setDefaultTimeout(12000)

  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => localStorage.clear())
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForSelector('text=Mastronardi Produce')

  await page.locator('select').first().selectOption({ label: 'Farm Planner (assigned farms)' })
  await page.getByRole('button', { name: /Authenticate with Azure AD/i }).click()
  await page.waitForSelector('text=Alex Rivera')
  await page.screenshot({ path: join(dir, '01-horizon-houses.png') })

  await page.getByRole('button', { name: 'Show maps' }).click()
  await page.waitForSelector('text=greenhouse map')
  await page.screenshot({ path: join(dir, '02-show-maps.png') })
  await page.locator('h3:has-text("greenhouse map")').locator('xpath=../button').click()

  await page.getByRole('button', { name: 'Monthly' }).click()
  await page.waitForSelector('text=all 12 months')
  await page.screenshot({ path: join(dir, '03-monthly-12.png'), fullPage: true })

  await page.getByRole('button', { name: 'Weekly' }).click()
  await page.locator('select').filter({ hasText: 'Select activity' }).selectOption({ label: 'Clipping' })
  await page.waitForTimeout(300)
  await page.screenshot({ path: join(dir, '04-rate-hr.png') })

  await page.getByRole('button', { name: /^Summary$/ }).click()
  await page.waitForSelector('text=Group by')
  await page.screenshot({ path: join(dir, '05-summary-groupby-allocation.png'), fullPage: true })

  await page.locator('select').first().selectOption('monthly')
  await page.waitForTimeout(300)
  await page.screenshot({ path: join(dir, '06-summary-month-picker.png') })

  await page.getByRole('button', { name: /Logout/i }).click()
  await page.waitForSelector('text=Authenticate')
  await page.locator('select').first().selectOption({ label: 'System Admin (full access)' })
  await page.getByRole('button', { name: /Authenticate with Azure AD/i }).click()
  await page.waitForSelector('text=Jordan Hale')
  await page.getByRole('button', { name: /^Admin$/ }).click()
  await page.waitForSelector('text=Assign farm(s)')
  await page.screenshot({ path: join(dir, '07-admin-assign.png'), fullPage: true })

  await page.locator('text=Planning report provisioning').scrollIntoViewIfNeeded()
  await page.screenshot({ path: join(dir, '08-admin-reports.png') })
  await page.locator('text=Daily farm shift scheduler').scrollIntoViewIfNeeded()
  await page.screenshot({ path: join(dir, '09-admin-shifts.png') })
  await page.locator('text=Operational guardrails').scrollIntoViewIfNeeded()
  await page.screenshot({ path: join(dir, '10-admin-guardrails.png') })
  await page.locator('text=Activity speed calibration').scrollIntoViewIfNeeded()
  await page.screenshot({ path: join(dir, '11-admin-calibration.png') })

  console.log('shots saved', dir)
  await browser.close()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
