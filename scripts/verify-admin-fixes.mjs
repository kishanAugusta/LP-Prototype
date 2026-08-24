import { createRequire } from 'node:module'
import { existsSync } from 'node:fs'

const require = createRequire(import.meta.url)
const { chromium } = require('playwright-core')

const exe = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
].find(existsSync)

const b = await chromium.launch({ executablePath: exe, headless: true })
const p = await b.newPage({ viewport: { width: 1440, height: 1100 } })
p.setDefaultTimeout(15000)

await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
await p.evaluate(() => localStorage.clear())
await p.reload({ waitUntil: 'networkidle' })
await p.locator('select').first().selectOption({ label: 'System Admin (full access)' })
await p.getByRole('button', { name: /Authenticate/ }).click()
await p.waitForSelector('text=Jordan Hale')
await p.getByRole('button', { name: /^Admin$/i }).click()
await p.waitForSelector('text=Planning report provisioning')

const editCount = await p.getByRole('button', { name: 'Edit' }).count()
const addCond = await p.getByRole('button', { name: /Add condition/ }).isVisible()
const farmsLabel = await p.getByText('Farms', { exact: true }).count()
const commoditiesLabel = await p.getByText('Commodities', { exact: true }).count()
const activitiesLabel = await p.getByText('Activities', { exact: true }).count()
const seedCond = await p.getByText('Max people per slot').count()
const conditionDeletes = await p
  .locator('section')
  .filter({ hasText: 'Operational guardrails' })
  .getByRole('button', { name: 'Delete' })
  .count()

const entitySection = p.locator('section').filter({ hasText: 'Global Entity Management' })
await entitySection.getByRole('button', { name: 'Edit' }).first().click()
await p.waitForSelector('text=Edit farm')
await p.locator('.fixed input').fill('North Farm Renamed')
await p.locator('.fixed').getByRole('button', { name: 'Save' }).click()
await p.waitForTimeout(200)
const renamed = await p.getByText('North Farm Renamed').count()

await p.getByPlaceholder('Condition name').fill('North Farm slot cap')
await p.getByPlaceholder('Threshold').fill('8')
await p.getByRole('button', { name: /Add condition/ }).click()
await p.waitForTimeout(300)
const northCond = await p.getByText('North Farm slot cap').count()

const reportSection = p.locator('section').filter({ hasText: 'Planning report provisioning' })
const reportHasFarms = (await reportSection.getByText('Farms', { exact: true }).count()) > 0
const reportHasCom = (await reportSection.getByText('Commodities', { exact: true }).count()) > 0
const reportHasAct = (await reportSection.getByText('Activities', { exact: true }).count()) > 0

console.log(
  JSON.stringify(
    {
      editCount,
      addCond,
      farmsLabel,
      commoditiesLabel,
      activitiesLabel,
      seedCond,
      conditionDeletes,
      renamed,
      northCond,
      reportHasFarms,
      reportHasCom,
      reportHasAct,
    },
    null,
    2,
  ),
)

await p.screenshot({ path: 'scripts/verify-shots/21-admin-fixes.png', fullPage: true })
await b.close()
