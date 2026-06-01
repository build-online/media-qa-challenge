import { test, expect } from '../../fixtures/auth.fixture'
import dotenv from 'dotenv'

dotenv.config()

declare global {
  interface Window {
    __lcp: number
  }
}

const BASE_URL = process.env.BASE_URL || 'https://media.tithelyqa.com'

test.describe('Performance', () => {

  test('PERF-1: home page LCP is under 3000ms on desktop viewport',
  async ({ browser }) => {

    // Use browser directly to set viewport to desktop size
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
    })
    const page = await context.newPage()

    // Inject LCP observer BEFORE navigating
    // This script listens for largest-contentful-paint entries
    await page.addInitScript(() => {
      window.__lcp = 0
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const last = entries[entries.length - 1]
        if (last) {
          window.__lcp = last.startTime
        }
      })
      observer.observe({ type: 'largest-contentful-paint', buffered: true })
    })

    // Navigate and wait for network idle
    const startTime = Date.now()
    await page.goto(BASE_URL + '/home', { waitUntil: 'networkidle' })

    // Wait a bit for LCP to be recorded after load
    await page.waitForTimeout(1000)

    // Read the LCP value from the window object
    const lcp = await page.evaluate(() => window.__lcp || 0)

    const totalTime = Date.now() - startTime

    console.log(`LCP: ${lcp.toFixed(0)}ms`)
    console.log(`Total navigation time: ${totalTime}ms`)

    // Assert LCP is under 3 seconds
    expect(lcp, `LCP was ${lcp.toFixed(0)}ms, expected under 3000ms`).toBeLessThan(3000)

    // Also assert LCP is greater than 0 (observer actually fired)
    expect(lcp, 'LCP observer did not capture any value').toBeGreaterThan(0)

    await context.close()
  })
})
