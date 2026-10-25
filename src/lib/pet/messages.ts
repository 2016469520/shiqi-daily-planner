// ============================================================
// 桌宠气泡文案（纯函数，便于单元测试）
// 桌宠 = 浮窗的另一种形态：左键轮播 问候 / 剩余任务 / 专注状态
// ============================================================

import { formatClock } from '@/lib/focus/focus-core'
import type { FocusSession, TimerMode } from '@/types'

export type PetBubbleKind = 'greeting' | 'tasks' | 'focus' | 'dialogue'

export const PET_BUBBLE_CYCLE: PetBubbleKind[] = ['greeting', 'tasks', 'focus', 'dialogue']

export function nextBubbleKind(current: PetBubbleKind): PetBubbleKind {
  const index = PET_BUBBLE_CYCLE.indexOf(current)
  return PET_BUBBLE_CYCLE[(index + 1) % PET_BUBBLE_CYCLE.length]
}

/** 按当前小时返回问候语 */
export function greetingByHour(hour: number): string {
  if (hour < 5) return '夜深了'
  if (hour < 9) return '早上好'
  if (hour < 12) return '上午好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  if (hour < 23) return '晚上好'
  return '夜深了'
}

/** 问候气泡：问候语 + 一句角色台词（台词可以是空数组） */
export function buildGreetingBubble(hour: number, dialogueLines: string[]): string {
  const greeting = greetingByHour(hour)
  const line = dialogueLines.length
    ? dialogueLines[Math.floor(Math.random() * dialogueLines.length)]
    : ''
  return line ? `${greeting}～\n${line}` : `${greeting}～`
}

/** 剩余任务气泡：还剩几件 + 最多列三件 */
export function buildTasksBubble(remainingTitles: string[]): string {
  if (remainingTitles.length === 0) return '今天的事都做完啦\n真棒'
  const preview = remainingTitles.slice(0, 3).join('、')
  const more = remainingTitles.length > 3 ? ` 等 ${remainingTitles.length} 件` : ''
  return `还剩 ${remainingTitles.length} 件事\n${preview}${more}`
}

/** 专注状态气泡：倒计时给剩余，正计时给已持续 */
export function buildFocusBubble(session: FocusSession | null, now: number): string {
  if (!session || (session.status !== 'running' && session.status !== 'paused')) {
    return '现在没有进行中的专注\n点浮窗的「专注」开一个吧'
  }
  const mode: TimerMode = session.timer_mode || 'countdown'
  const start = session.started_at ? new Date(session.started_at).getTime() : now
  const reference = session.paused_at ? new Date(session.paused_at).getTime() : now
  const elapsed = Math.max(0, Math.floor((reference - start) / 1000))

  if (mode === 'stopwatch') {
    const prefix = session.status === 'paused' ? '专注暂停中\n已专注' : '已专注'
    return `${prefix} ${formatClock(elapsed)}`
  }
  const remaining = Math.max(0, session.planned_minutes * 60 - elapsed)
  const prefix = session.status === 'paused' ? '专注暂停中\n还剩' : '专注还剩'
  return `${prefix} ${formatClock(remaining)}`
}

/** 桌宠形态（表情）的中文标签 */
export const PET_EXPRESSION_LABELS: Record<string, string> = {
  idle: '待机',
  happy: '开心',
  thinking: '思考',
  working: '工作',
  error: '出错',
  sleepy: '困倦',
}
