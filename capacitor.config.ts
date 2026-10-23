import type { CapacitorConfig } from '@capacitor/cli'

/**
 * 安卓壳：直接加载 `out/` 静态导出的本地应用。
 * WebView 用 https://localhost 作为来源，IndexedDB 因此可以稳定持久化。
 */
const config: CapacitorConfig = {
  // 新应用新身份：appId 独立于旧版，全新安装
  appId: 'app.shiqi.planner',
  appName: '时栖',
  webDir: 'out',
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  server: {
    androidScheme: 'https',
  },
}

export default config
