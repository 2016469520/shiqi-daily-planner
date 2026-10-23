// ============================================================
// 氛围事件总线
//
// 角色表情与庆祝效果必须由**真实的软件事件**驱动，不能演假进度。
// 目前接入的事件：
//   - 完成任务（setTaskCompletion 成功）→ happy + 庆祝
//   - 专注计时开始 / 结束 → working / happy
//   - 保存失败等错误 → error
// ============================================================

import type { CharacterExpression } from '@/lib/theme/atmosphere'

export type AtmosphereEvent =
  | { type: 'mood'; mood: CharacterExpression }
  | { type: 'celebrate' }
  /** 用户点了角色，角色回一句台词 */
  | { type: 'poke' }

type Listener = (event: AtmosphereEvent) => void

const listeners = new Set<Listener>()

export function subscribeAtmosphere(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function emitAtmosphere(event: AtmosphereEvent): void {
  for (const listener of listeners) {
    try {
      listener(event)
    } catch {
      // 一个监听器出错不影响其它监听器
    }
  }
}

export const atmosphereEvents = {
  happy: () => emitAtmosphere({ type: 'mood', mood: 'happy' }),
  working: () => emitAtmosphere({ type: 'mood', mood: 'working' }),
  thinking: () => emitAtmosphere({ type: 'mood', mood: 'thinking' }),
  error: () => emitAtmosphere({ type: 'mood', mood: 'error' }),
  idle: () => emitAtmosphere({ type: 'mood', mood: 'idle' }),
  celebrate: () => emitAtmosphere({ type: 'celebrate' }),
  poke: () => emitAtmosphere({ type: 'poke' }),
}
