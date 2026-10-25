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
  /** 贴边隐藏：当前是否开启 + 浮窗是否停靠中 */
  getDockState: () => Promise<DockState>
  /** 开关「拖到屏幕边缘时缩成小条」 */
  setDockEnabled: (enabled: boolean) => Promise<DockState>
  /** 手动展开停靠中的浮窗 */
  undockWidget: () => Promise<DockState>
  /** 订阅停靠状态变化，返回取消订阅函数 */
  onDockChanged: (callback: (state: DockState) => void) => () => void
  /** 桌宠：开启（浮窗收起、宝儿姐上桌） */
  setPetEnabled: (enabled: boolean) => Promise<boolean>
  /** 桌宠当前是否开启 */
  isPetEnabled: () => Promise<boolean>
  /** 按位移移动桌宠窗口（拖动用） */
  petMoveBy: (dx: number, dy: number) => Promise<void>
  /** 切换桌宠窗口的鼠标穿透（透明区域点穿到桌面） */
  petSetIgnoreMouse: (ignore: boolean) => Promise<void>
}

export interface DockState {
  enabled: boolean
  edge: 'left' | 'right' | 'top' | 'bottom' | null
}

interface BridgeWindow {
  timegrid?: Partial<Omit<DesktopBridge, 'isDesktop'>>
}

/**
 * bridge 包装对象只创建一次。
 *
 * 这个对象会被 useSyncExternalStore 当作快照读取，React 用 Object.is 比较前后两次快照；
 * 如果每次调用都返回新对象，就会被判定成"一直在变"，进而无限重渲染（React #185 白屏）。
 *
 * 新能力（贴边隐藏 / 桌宠）按可选处理：旧版 preload 注入的 bridge 没有这些方法时，
 * 包装层给出安全空实现，页面不会因为缺方法而崩（e2e 里的 mock bridge 也是这种形态）。
 */
const NO_DOCK: DockState = { enabled: false, edge: null }

let cachedBridge: DesktopBridge | null = null

export function getDesktopBridge(): DesktopBridge | null {
  if (typeof window === 'undefined') return null
  if (cachedBridge) return cachedBridge

  const bridge = (window as unknown as BridgeWindow).timegrid
  if (!bridge) return null

  cachedBridge = {
    isDesktop: true,
    hideWidget: () => bridge.hideWidget?.() ?? Promise.resolve(),
    toggleWidget: () => bridge.toggleWidget?.() ?? Promise.resolve(false),
    showWidget: () => bridge.showWidget?.() ?? Promise.resolve(false),
    isWidgetVisible: () => bridge.isWidgetVisible?.() ?? Promise.resolve(false),
    openMain: () => bridge.openMain?.() ?? Promise.resolve(),
    togglePin: () => bridge.togglePin?.() ?? Promise.resolve(false),
    isPinned: () => bridge.isPinned?.() ?? Promise.resolve(false),
    quit: () => bridge.quit?.() ?? Promise.resolve(),
    scanCharacterPacks: bridge.scanCharacterPacks ? () => bridge.scanCharacterPacks!() : undefined,
    getDockState: () => bridge.getDockState?.() ?? Promise.resolve(NO_DOCK),
    setDockEnabled: (enabled: boolean) => bridge.setDockEnabled?.(enabled) ?? Promise.resolve(NO_DOCK),
    undockWidget: () => bridge.undockWidget?.() ?? Promise.resolve(NO_DOCK),
    onDockChanged: (callback: (state: DockState) => void) => bridge.onDockChanged?.(callback) ?? (() => {}),
    setPetEnabled: (enabled: boolean) => bridge.setPetEnabled?.(enabled) ?? Promise.resolve(false),
    isPetEnabled: () => bridge.isPetEnabled?.() ?? Promise.resolve(false),
    petMoveBy: (dx: number, dy: number) => bridge.petMoveBy?.(dx, dy) ?? Promise.resolve(),
    petSetIgnoreMouse: (ignore: boolean) => bridge.petSetIgnoreMouse?.(ignore) ?? Promise.resolve(),
  }

  return cachedBridge
}

export function isDesktopApp(): boolean {
  return getDesktopBridge() !== null
}
