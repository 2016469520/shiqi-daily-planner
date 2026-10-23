import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 })
  })

  test('login page renders with form fields', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]').first()).toBeVisible()
  })
})
