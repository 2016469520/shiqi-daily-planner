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
})
