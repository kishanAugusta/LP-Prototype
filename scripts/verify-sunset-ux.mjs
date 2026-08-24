import { createRequire } from 'node:module'
import { existsSync } from 'node:fs'

const require = createRequire(import.meta.url)
const { chromium } = require('playwright-core')
const exe = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
].find(existsSync)

const b = await chromium.launch({ executablePath: exe, headless: true })
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
p.setDefaultTimeout(15000)
await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
await p.evaluate(() => localStorage.clear())
await p.reload({ waitUntil: 'networkidle' })
await p.locator('select').first().selectOption({ label: 'System Admin (full access)' })
await p.getByRole('button', { name: /Authenticate/ }).click()
await p.waitForSelector('text=Jordan Hale')
const sticky = await p.locator('.lp-sticky-bar').count()
const submit = await p.getByRole('button', { name: /Submit Plan/ }).isVisible()
await p.getByRole('button', { name: /^Admin$/i }).click()
await p.waitForSelector('text=Provision user via SSO')
const accordionOpen = await p.locator('.lp-accordion-trigger[aria-expanded="true"]').count()
await p.getByRole('button', { name: /User directory/i }).click()
await p.waitForTimeout(200)
const after = await p.locator('.lp-accordion-trigger[aria-expanded="true"]').count()
await p.getByRole('button', { name: /^Summary$/i }).click()
await p.waitForSelector('text=Aggregated Schedule Overview')
const analyticsClosed = await p.getByRole('button', { name: /Analytics/i }).getAttribute('aria-expanded')
console.log(JSON.stringify({ sticky, submit, accordionOpen, afterToggle: after, analyticsClosed }, null, 2))
await b.close()
