import { test, expect, type Page } from '@playwright/test'

async function enterDemoMode(page: Page) {
  // 每日开场页会盖住首页（真实用户按一次就没了），自动化里直接标记为今天已看过
  await page.addInitScript(() => {
    const d = new Date()
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`
    window.localStorage.setItem('timegrid:atmosphere:welcomed', key)
  })
  await page.goto('/login')
  await page.waitForLoadState('networkidle')
  await page.getByTestId('enter-demo-mode').click()
  await expect(page).toHaveURL(/\/calendar/, { timeout: 15000 })
}

async function addScheduleTask(page: Page, title: string) {
  await page.goto('/schedule')
  await expect(page).toHaveURL(/\/schedule/, { timeout: 15000 })
  await page.getByTestId('quick-add-title').fill(title)
  await page.getByTestId('quick-add-save').click()
  const item = page.getByTestId('task-list-item').filter({ hasText: title }).first()
  await expect(item).toBeVisible({ timeout: 10000 })
  return item
}

test.describe('App Smoke Tests', () => {
  test('login page renders in demo/supabase mode', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('button[type="submit"]').first()).toBeVisible()
  })

  test('root redirects to login for unauthenticated users', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 })
  })

  test('/calendar redirects to login for unauthenticated users', async ({ page }) => {
    await page.goto('/calendar')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 })
  })

  test('/habits redirects to login for unauthenticated users', async ({ page }) => {
    await page.goto('/habits')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 })
  })

  test('/settings redirects to login for unauthenticated users', async ({ page }) => {
    await page.goto('/settings')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 })
  })

  test('/focus redirects to login for unauthenticated users', async ({ page }) => {
    await page.goto('/focus')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 })
  })

  test('no internal enum values on login page', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    const bodyText = await page.locator('body').textContent()
    // Raw enum values must never appear in UI
    expect(bodyText).not.toContain('"morning"')
    expect(bodyText).not.toContain('"medium"')
    expect(bodyText).not.toContain('"todo"')
    expect(bodyText).not.toContain('"none"')
  })

  test('mobile viewport renders login page correctly', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('body')).toBeVisible()
  })

  test('local demo mode opens the task-first app and persists after refresh', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    await page.getByTestId('enter-demo-mode').click()
    await expect(page).toHaveURL(/\/calendar/, { timeout: 15000 })
    await expect(page.getByRole('link', { name: '日历', exact: true })).toBeVisible({ timeout: 15000 })

    await page.goto('/schedule')
    await expect(page).toHaveURL(/\/schedule/, { timeout: 15000 })
    await page.reload()
    await expect(page).toHaveURL(/\/schedule/, { timeout: 15000 })
    await expect(page.locator('body')).not.toContainText('[object Object]')
  })

  test('schedule supports task CRUD and keeps undated tasks visible', async ({ page }) => {
    await enterDemoMode(page)
    const title = `e2e schedule ${Date.now()}`
    const updatedTitle = `${title} updated`

    let item = await addScheduleTask(page, title)
    await item.click()
    await page.getByTestId('task-detail-title').fill(updatedTitle)
    await expect(page.getByTestId('task-list-item').filter({ hasText: updatedTitle })).toBeVisible({
      timeout: 10000,
    })

    await page.reload()
    await expect(page.getByTestId('task-list-item').filter({ hasText: updatedTitle })).toBeVisible({
      timeout: 10000,
    })

    item = page.getByTestId('task-list-item').filter({ hasText: updatedTitle }).first()
    await item.getByTestId('task-toggle-complete').click()
    await expect(item).toBeVisible()

    await item.click()
    await page.getByTestId('task-detail-date').fill('')
    await page.reload()
    await page.getByTestId('inbox-toggle').click()
    item = page.getByTestId('task-list-item').filter({ hasText: updatedTitle }).first()
    await expect(item).toBeVisible({ timeout: 10000 })

    await item.click()
    await page.getByTestId('task-detail-delete').click()
    await expect(page.getByTestId('task-list-item').filter({ hasText: updatedTitle })).toHaveCount(0, {
      timeout: 10000,
    })
  })

  test('schedule view and category grouping combinations keep tasks accessible', async ({ page }) => {
    await enterDemoMode(page)
    const title = `e2e grouped ${Date.now()}`
    await addScheduleTask(page, title)

    for (const view of ['today', 'week', 'all']) {
      await page.getByTestId(`schedule-view-${view}`).click()
      await expect(page.getByTestId('task-list-item').filter({ hasText: title })).toBeVisible({
        timeout: 10000,
      })

      await page.getByTestId('schedule-group-category').click()
      await expect(page.getByTestId('task-list-item').filter({ hasText: title })).toBeVisible({
        timeout: 10000,
      })
      await page.getByTestId('schedule-group-category').click()
    }
  })
})
