/**
 * 桌面端（Electron）能力桥。
 *
 * 打包版由 preload 注入 window.timegrid；网页/安卓端该对象不存在，
 * 所有调用都退化为安全空操作，调用方不需要分支判断。
 */

export interface DesktopBridge {
  isDesktop: boolean
  /** 隐藏浮窗（只留主窗口） */
  hideWidget: () => Promise<void>
  /** 显示/隐藏浮窗，返回显示后的状态 */
  toggleWidget: () => Promise<boolean>
  /** 无条件唤起浮窗（会矫正到屏幕内） */
  showWidget: () => Promise<boolean>
  /** 浮窗当前是否可见 */
  isWidgetVisible: () => Promise<boolean>
  /** 打开并聚焦主窗口 */
  openMain: () => Promise<void>
  /** 切换浮窗置顶，返回切换后的状态 */
  togglePin: () => Promise<boolean>
  /** 查询浮窗是否置顶 */
  isPinned: () => Promise<boolean>
  /** 退出整个应用 */
  quit: () => Promise<void>
  /** 扫描 <userData>/characters 下的角色包（返回 manifest 与 data URL 图片） */
  scanCharacterPacks?: () => Promise<{ root: string; packs: unknown[]; error: string | null }>
}

interface BridgeWindow {
  timegrid?: Omit<DesktopBridge, 'isDesktop'>
}

/**
 * bridge 包装对象只创建一次。
 *
 * 这个对象会被 useSyncExternalStore 当作快照读取，React 用 Object.is 比较前后两次快照；
 * 如果每次调用都返回新对象，就会被判定成"一直在变"，进而无限重渲染（React #185 白屏）。
 */
let cachedBridge: DesktopBridge | null = null

export function getDesktopBridge(): DesktopBridge | null {
  if (typeof window === 'undefined') return null
  if (cachedBridge) return cachedBridge

  const bridge = (window as unknown as BridgeWindow).timegrid
  if (!bridge) return null

  cachedBridge = {
    isDesktop: true,
    hideWidget: () => bridge.hideWidget(),
    toggleWidget: () => bridge.toggleWidget(),
    showWidget: () => bridge.showWidget(),
    isWidgetVisible: () => bridge.isWidgetVisible(),
    openMain: () => bridge.openMain(),
    togglePin: () => bridge.togglePin(),
    isPinned: () => bridge.isPinned(),
    quit: () => bridge.quit(),
    scanCharacterPacks: bridge.scanCharacterPacks
      ? () => (bridge.scanCharacterPacks as () => Promise<{ root: string; packs: unknown[]; error: string | null }>)()
      : undefined,
  }

  return cachedBridge
}

export function isDesktopApp(): boolean {
  return getDesktopBridge() !== null
}
