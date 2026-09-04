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

const dir = join(process.cwd(), 'scripts', 'presend-shots')
mkdirSync(dir, { recursive: true })

async function main() {
  const browser = await chromium.launch({ executablePath: exe, headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  page.setDefaultTimeout(12000)
  const checks = []

  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => {
    localStorage.removeItem('labor-planner-prototype-v1')
    localStorage.removeItem('labor-planner-prototype-v2')
  })
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForSelector('text=Mastronardi Produce')

  await page.getByRole('button', { name: /exploration guide/i }).click()
  await page.waitForSelector('text=You can explore this without a presenter')
  const resetBtn = page.getByRole('button', { name: 'Reset prototype data' })
  checks.push({ step: 'Login Exploration guide', ok: true })
  checks.push({ step: 'Reset prototype data button visible', ok: (await resetBtn.count()) > 0 })
  await resetBtn.click()
  await page.waitForSelector('text=Mastronardi Produce')
  checks.push({ step: 'Reset ran (back on login)', ok: true })

  async function login(label, name, expect) {
    await page.locator('select').first().selectOption({ label })
    await page.getByRole('button', { name: /Authenticate with Azure AD/i }).click()
    await page.waitForSelector(`text=${name}`)
    const planner = (await page.getByRole('button', { name: /^Planner$/ }).count()) > 0
    const summary = (await page.getByRole('button', { name: /^Summary$/ }).count()) > 0
    const admin = (await page.getByRole('button', { name: /^Admin$/ }).count()) > 0
    const guide = (await page.getByRole('button', { name: 'Exploration guide' }).count()) > 0
    const ok =
      planner === expect.planner && summary === expect.summary && admin === expect.admin && guide
    checks.push({
      step: `${name} tabs`,
      ok,
      detail: `Planner=${planner} Summary=${summary} Admin=${admin} Guide=${guide}`,
    })
    await page.screenshot({ path: join(dir, expect.file) })
    await page.getByRole('button', { name: /Logout/i }).click()
    await page.waitForSelector('text=Authenticate with Azure AD')
  }

  await login('Farm Planner (assigned farms)', 'Alex Rivera', {
    planner: true,
    summary: true,
    admin: false,
    file: 'planner.png',
  })
  await login('Site Manager (summary only)', 'Sarah Johnson', {
    planner: false,
    summary: true,
    admin: false,
    file: 'manager.png',
  })
  await login('System Admin (full access)', 'Jordan Hale', {
    planner: true,
    summary: true,
    admin: true,
    file: 'admin.png',
  })

  console.log(JSON.stringify(checks, null, 2))
  if (checks.some((c) => !c.ok)) process.exit(1)
  await browser.close()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
