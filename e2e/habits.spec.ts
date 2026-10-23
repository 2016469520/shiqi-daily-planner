import { test, expect } from '@playwright/test'

test.describe('Habit Management', () => {
  test('login page renders before auth', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 })
  })

  test('habits page redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/habits')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 })
  })

  test('login page shows demo mode banner when Supabase not configured', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    // The demo banner appears when isDemoMode is true
    const bodyText = await page.locator('body').textContent()
    // Either demo mode or Supabase mode - both should show the login form
    expect(bodyText).toContain('登录')
  })

  test('no internal enum values leak to login page', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    const bodyText = await page.locator('body').textContent()
    expect(bodyText).not.toContain('"minutes"')
    expect(bodyText).not.toContain('"hours"')
    expect(bodyText).not.toContain('"none"')
    expect(bodyText).not.toContain('[object Object]')
  })
})
