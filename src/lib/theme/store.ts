// ============================================================
// 外观状态的外部 store
//
// 为什么不用 useState + useEffect 初始化：
// 1. 在 effect 里 setState 会触发 react-hooks/set-state-in-effect
// 2. localStorage 只能在客户端读，若放进 useState 初始化器会造成水合不一致
// 用 useSyncExternalStore 后：服务端快照恒为默认值，客户端挂载时 hydrate
// 一次，之后所有变更同步广播，没有中间态。
// ============================================================

import {
  defaultState,
  loadState,
  personalizationFor,
  saveState,
} from './storage'
import type { AppearanceState, ThemeId, ThemePersonalization } from './types'

type Listener = () => void

/** 服务端与首帧使用的稳定快照（引用必须恒定） */
const SERVER_SNAPSHOT: AppearanceState = defaultState()

let state: AppearanceState = SERVER_SNAPSHOT
let hydrated = false
let saveTimer: ReturnType<typeof setTimeout> | null = null
const listeners = new Set<Listener>()

function emit() {
  for (const listener of listeners) listener()
}

function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer)
  // 拖动滑杆时会高频变更，这里合并写入
  saveTimer = setTimeout(() => {
    saveTimer = null
    saveState(state)
  }, 120)
}

export function subscribeAppearance(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getAppearanceState(): AppearanceState {
  return state
}

export function getServerAppearanceState(): AppearanceState {
  return SERVER_SNAPSHOT
}

/** 客户端挂载后调用一次：把 localStorage 里的配置接进来 */
export function hydrateAppearance(): void {
  if (hydrated) return
  hydrated = true
  state = loadState()
  emit()
}

/** 是否已完成 hydrate（用于显示"已保存"之类的状态） */
export function isAppearanceReady(): boolean {
  return hydrated
}

export function updateAppearance(
  updater: (prev: AppearanceState) => AppearanceState
): void {
  const next = updater(state)
  if (next === state) return
  state = next
  scheduleSave()
  emit()
}

/** 读取某主题当下的个性化参数（含默认回退） */
export function currentPersonalization(id: ThemeId): ThemePersonalization {
  return personalizationFor(state, id)
}
