import { describe, it, expect } from 'vitest'
import { getDesktopBridge, isDesktopApp } from '@/lib/desktop-bridge'
import { notifyDataChanged, subscribeDataChanged } from '@/lib/widget-sync'

describe('桌面能力桥（非 Electron 环境）', () => {
  it('浏览器里没有 bridge 时返回 null，不抛错', () => {
    expect(getDesktopBridge()).toBeNull()
    expect(isDesktopApp()).toBe(false)
  })
})

describe('跨窗口数据广播', () => {
  it('没有 BroadcastChannel 时订阅返回可调用的取消函数', () => {
    const unsubscribe = subscribeDataChanged(() => {})
    expect(typeof unsubscribe).toBe('function')
    expect(() => unsubscribe()).not.toThrow()
  })

  it('通知在无窗口环境下静默失败而不是抛错', () => {
    expect(() => notifyDataChanged('tasks')).not.toThrow()
  })
})
