import { expect, test } from '@playwright/test'

for (const position of ['bottom-right', 'hero']) {
test(`local pack ${position}: left click talks, right click cycles and selection survives reload`, async ({ page }) => {
  test.setTimeout(60000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addInitScript((characterPosition) => {
    if (!localStorage.getItem('timegrid:appearance:v1')) {
      localStorage.setItem('timegrid:appearance:v1', JSON.stringify({
        version: 1, atmosphere: { welcome: false, characterPosition, characterAutoState: false, characterAnimate: false },
      }))
    }
    Object.defineProperty(window, 'timegrid', { value: {
      hideWidget: async () => {}, toggleWidget: async () => false, showWidget: async () => false,
      isWidgetVisible: async () => false, openMain: async () => {}, togglePin: async () => false,
      isPinned: async () => false, quit: async () => {},
      scanCharacterPacks: async () => ({ root: 'fixture', error: null, packs: [{
        dir: 'cutout-test', manifest: { id: 'cutout-test', name: '测试伙伴',
          dialogue: { idle: ['看啥看？'], happy: ['哦哦哦～'], thinking: ['认真思考中', '啥呢？'] } },
        images: Object.fromEntries(['half_body', 'happy', 'thinking', 'working', 'error', 'sleepy'].map(key => [key, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII='])),
      }] }),
    } })
  }, position)
  await page.goto('/login')
  await page.waitForLoadState('networkidle')
  await page.getByTestId('enter-demo-mode').click()
  await expect(page).toHaveURL(/\/calendar/, { timeout: 15000 })
  await page.goto('/settings')
  const card = page.getByTestId('character-card-pack-cutout-test')
  await card.getByRole('button', { name: '查看 测试伙伴 详情' }).click()
  const detail = page.getByTestId('character-detail')
  await detail.getByRole('button', { name: '思考', exact: true }).click()
  await expect(detail.getByRole('status')).toHaveText('认真思考中')
  await detail.getByRole('button', { name: '换句台词' }).click()
  await expect(detail.getByRole('status')).toHaveText('啥呢？')
  await detail.getByRole('button', { name: '关闭详情' }).click()
  await card.getByRole('button', { name: '选用', exact: true }).click()
  await expect(card).toHaveAttribute('data-active', 'true')
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('timegrid:appearance:v1')!).atmosphere.characterId)).toBe('pack-cutout-test')
  if (position === 'hero') await page.goto('/schedule')
  const companion = page.getByTestId('atmosphere-character')
  await expect(companion.getByRole('button')).toHaveCSS('animation-name', 'none')
  await companion.getByRole('button', { name: '测试伙伴，当前状态：待机' }).click()
  await expect(companion.getByRole('status')).toHaveText('看啥看？')
  await expect(companion).toHaveAttribute('data-mood', 'idle')
  await expect(companion.getByRole('status')).toBeHidden({ timeout: 7000 })
  const idleImage = await companion.locator('img').getAttribute('src')
  await companion.getByRole('button').click({ button: 'right' })
  await expect(companion).toHaveAttribute('data-mood', 'happy')
  await expect(companion.getByRole('status')).toHaveCount(0)
  await expect(companion.locator('img')).not.toHaveAttribute('src', idleImage!)
  await companion.getByRole('button').click()
  await expect(companion.getByRole('status')).toHaveText('哦哦哦～')
  await expect(companion).toHaveAttribute('data-mood', 'happy')
  for (const mood of ['thinking', 'working', 'error', 'sleepy', 'idle']) {
    await companion.getByRole('button').click({ button: 'right' })
    await expect(companion).toHaveAttribute('data-mood', mood)
    await expect(companion.getByRole('status')).toHaveCount(0)
  }
  await page.reload()
  if (position !== 'hero') await expect(page.getByTestId('character-card-pack-cutout-test')).toHaveAttribute('data-active', 'true')
  await expect(companion).toHaveAttribute('data-character', 'pack-cutout-test')
})
}
