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

const browser = await chromium.launch({ executablePath: exe, headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 980 } })
page.setDefaultTimeout(20000)

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.clear())
await page.reload({ waitUntil: 'networkidle' })
await page.waitForSelector('text=Mastronardi Produce')

await page.locator('select').first().selectOption({ label: 'Farm Planner (assigned farms)' })
await page.getByRole('button', { name: /Authenticate with Azure AD/i }).click()
await page.waitForSelector('text=Alex Rivera')

await page.getByRole('button', { name: /^Summary$/ }).click()
await page.waitForSelector('text=Time horizon')
const yearSelect = page.locator('select[aria-label="Year"]')
console.log('year weekly', await yearSelect.isVisible(), await yearSelect.inputValue())
await page.screenshot({ path: join(dir, '18-summary-year-weekly.png') })

await page.locator('select').filter({ hasText: 'Weekly' }).first().selectOption('yearly')
await page.waitForTimeout(300)
console.log('year yearly', await yearSelect.isVisible(), await yearSelect.inputValue())
await page.screenshot({ path: join(dir, '19-summary-year-yearly.png') })

await page.getByRole('button', { name: /^Planner$/ }).click()
await page.locator('select').filter({ hasText: 'Select activity' }).selectOption({ label: 'Clipping' })
await page.waitForTimeout(300)
const miniTotal = await page.locator('tfoot tr').last().innerText()
await page.getByRole('button', { name: /^FRED$/ }).click()
await page.waitForTimeout(300)
const fredTotal = await page.locator('tfoot tr').last().innerText()
await page.getByRole('button', { name: /^HARVEST$/ }).click()
await page.waitForTimeout(300)
const harvestTotal = await page.locator('tfoot tr').last().innerText()
console.log('mini', miniTotal.trim())
console.log('fred', fredTotal.trim())
console.log('harvest', harvestTotal.trim())
console.log('grids differ', miniTotal !== fredTotal || fredTotal !== harvestTotal)
await page.screenshot({ path: join(dir, '20-house-grid-switch.png') })

await browser.close()
