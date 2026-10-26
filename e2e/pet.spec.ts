import { test, expect } from '@playwright/test'

test('desktop pet: pixel passthrough, talk, drag, expressions and saved settings', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Desktop mouse interaction')
  test.setTimeout(60000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addInitScript(() => {
    const calls = { ignore: [] as boolean[], moves: [] as number[][] }
    Object.assign(window, { petCalls: calls, timegrid: {
      petSetIgnoreMouse: async (ignore: boolean) => { calls.ignore.push(ignore) },
      petMoveBy: async (dx: number, dy: number) => { calls.moves.push([dx, dy]) },
    } })
  })
  await page.goto('/login')
  await page.getByTestId('enter-demo-mode').click()
  await expect(page).toHaveURL(/\/calendar/, { timeout: 15000 })
  await page.evaluate(async () => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 440
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#ff0000'
    ctx.fillRect(220, 0, 220, 440)
    const blob = await new Promise<Blob>(resolve => canvas.toBlob(value => resolve(value!)))
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.open('timegrid-character-packs', 1)
      req.onupgradeneeded = () => { if (!req.result.objectStoreNames.contains('packs')) req.result.createObjectStore('packs', { keyPath: 'id' }) }
      req.onerror = () => reject(req.error)
      req.onsuccess = () => {
        const tx = req.result.transaction('packs', 'readwrite')
        tx.objectStore('packs').put({ id: 'pack-feng-baobao', manifest: { version: 9999, dialogue: { idle: ['在这儿呢'], happy: ['开心咯'] } },
          display: blob, states: { idle: blob, happy: blob }, createdAt: new Date().toISOString() })
        tx.oncomplete = () => { req.result.close(); resolve() }
        tx.onerror = () => reject(tx.error)
      }
    })
  })
  await page.setViewportSize({ width: 280, height: 380 })
  await page.goto('/pet')
  const pet = page.getByTestId('pet-character')
  const image = pet.locator('img')
  await expect(image).toBeVisible()
  await expect(page.getByTestId('pet-bubble')).toContainText('按住拖动')
  const rect = (await image.boundingBox())!
  const body = { x: rect.x + rect.width * 0.75, y: rect.y + rect.height * 0.5 }
  const transparent = { x: rect.x + rect.width * 0.25, y: body.y }
  const lastIgnore = () => page.evaluate(() => (window as unknown as { petCalls: { ignore: boolean[] } }).petCalls.ignore.at(-1))
  await page.mouse.move(body.x, body.y)
  await expect.poll(lastIgnore).toBe(false)
  await page.mouse.move(transparent.x, transparent.y)
  await expect.poll(lastIgnore).toBe(true)
  await page.mouse.click(body.x, body.y)
  await expect(page.getByTestId('pet-bubble')).toContainText('在这儿呢')
  await page.mouse.click(body.x, body.y, { button: 'right' })
  await expect(pet).toHaveAttribute('data-expression', 'happy')
  await expect(page.getByTestId('pet-bubble')).toHaveText('开心咯')
  await page.mouse.move(body.x, body.y)
  await page.mouse.down()
  await page.mouse.move(transparent.x, transparent.y, { steps: 5 })
  await expect.poll(lastIgnore).toBe(false)
  await page.mouse.up()
  await expect.poll(() => page.evaluate(() => (window as unknown as { petCalls: { moves: number[][] } }).petCalls.moves.length)).toBeGreaterThan(0)
  await expect(page.getByTestId('pet-bubble')).toHaveText('开心咯')
  await pet.dispatchEvent('pointerdown', { button: 0, pointerId: 2, screenX: 100, screenY: 100 })
  await pet.dispatchEvent('pointercancel', { pointerId: 2 })
  await expect(page.getByTestId('pet-bubble')).toHaveText('开心咯')
  await page.getByRole('button', { name: '桌宠设置', exact: true }).click()
  const panel = page.getByRole('dialog', { name: '桌宠设置面板' })
  await expect(panel).toBeVisible()
  await page.getByRole('slider', { name: '人物大小' }).fill('160')
  await page.getByRole('checkbox', { name: '轻微动作反馈' }).uncheck()
  await expect(image).toHaveCSS('max-height', '160px')
  const bounds = (await panel.boundingBox())!
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(380)
  await page.keyboard.press('Escape')
  await expect(panel).toHaveCount(0)
  await page.reload()
  await expect(image).toHaveCSS('max-height', '160px')
  await page.getByRole('button', { name: '桌宠设置', exact: true }).click()
  await expect(page.getByRole('checkbox', { name: '轻微动作反馈' })).not.toBeChecked()
})
