import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const fakeBridge = {
  hideWidget: async () => {},
  toggleWidget: async () => true,
  showWidget: async () => true,
  isWidgetVisible: async () => true,
  openMain: async () => {},
  togglePin: async () => true,
  isPinned: async () => true,
  quit: async () => {},
}

describe('桌面桥快照稳定性', () => {
  beforeEach(() => {
    vi.resetModules()
    delete (window as unknown as { timegrid?: unknown }).timegrid
  })

  afterEach(() => {
    delete (window as unknown as { timegrid?: unknown }).timegrid
  })

  it('重复调用返回同一个对象引用', async () => {
    // useSyncExternalStore 用 Object.is 比较快照，每次返回新对象会导致无限重渲染（React #185 白屏）
    ;(window as unknown as { timegrid: typeof fakeBridge }).timegrid = fakeBridge
    const { getDesktopBridge } = await import('@/lib/desktop-bridge')

    const first = getDesktopBridge()
    const second = getDesktopBridge()

    expect(first).not.toBeNull()
    expect(second).toBe(first)
  })

  it('没有 bridge 时稳定返回 null', async () => {
    const { getDesktopBridge } = await import('@/lib/desktop-bridge')
    expect(getDesktopBridge()).toBeNull()
    expect(getDesktopBridge()).toBeNull()
  })

  it('暴露的每个方法都能调用', async () => {
    ;(window as unknown as { timegrid: typeof fakeBridge }).timegrid = fakeBridge
    const { getDesktopBridge, isDesktopApp } = await import('@/lib/desktop-bridge')
    const bridge = getDesktopBridge()

    expect(isDesktopApp()).toBe(true)
    expect(bridge).not.toBeNull()
    await expect(bridge!.toggleWidget()).resolves.toBe(true)
    await expect(bridge!.isWidgetVisible()).resolves.toBe(true)
    await expect(bridge!.togglePin()).resolves.toBe(true)
    await expect(bridge!.showWidget()).resolves.toBe(true)
  })
})
