// ============================================================
// 预加载脚本：只暴露最小必要的桌面能力（无 Node 权限）
// ============================================================

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('timegrid', {
  isDesktop: true,
  hideWidget: () => ipcRenderer.invoke('widget:hide'),
  toggleWidget: () => ipcRenderer.invoke('widget:toggle'),
  showWidget: () => ipcRenderer.invoke('widget:show'),
  isWidgetVisible: () => ipcRenderer.invoke('widget:is-visible'),
  openMain: () => ipcRenderer.invoke('main:show'),
  // 扫描 <userData>/characters 下的角色包
  scanCharacterPacks: () => ipcRenderer.invoke('packs:scan'),
  togglePin: () => ipcRenderer.invoke('widget:toggle-pin'),
  isPinned: () => ipcRenderer.invoke('widget:is-pinned'),
  quit: () => ipcRenderer.invoke('app:quit'),
  // 贴边隐藏（浮窗停靠到屏幕边缘，鼠标碰一下弹回）
  getDockState: () => ipcRenderer.invoke('widget:get-dock-state'),
  setDockEnabled: (enabled) => ipcRenderer.invoke('widget:set-dock-enabled', enabled),
  undockWidget: () => ipcRenderer.invoke('widget:undock'),
  onDockChanged: (callback) => {
    const listener = (_event, state) => callback(state)
    ipcRenderer.on('widget:dock-changed', listener)
    return () => ipcRenderer.removeListener('widget:dock-changed', listener)
  },
  // 桌宠（浮窗的桌宠形态）
  setPetEnabled: (enabled) => ipcRenderer.invoke('pet:set-enabled', enabled),
  isPetEnabled: () => ipcRenderer.invoke('pet:is-enabled'),
  petMoveBy: (dx, dy) => ipcRenderer.invoke('pet:move-by', dx, dy),
  petSetIgnoreMouse: (ignore) => ipcRenderer.invoke('pet:set-ignore-mouse', ignore),
})
