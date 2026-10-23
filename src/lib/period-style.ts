// ============================================================
// 时段（上午/下午/晚上）的统一样式与顺序
// 之前 day-view / week-view / task-list-item / widget-task-form /
// template-manager / import-export-dialog / search-filter / 两个 page
// 各自维护了一份同样的常量，改一次要同步八处。这里收敛为唯一来源。
// ============================================================

import type { Period } from '@/types'

/** 时段的固定展示顺序 */
export const PERIOD_ORDER: Period[] = ['morning', 'afternoon', 'evening']

/**
 * 时段 → 装饰类名。
 * 配合 globals.css 里的 `.p-morning` 等工具类设置 `--period`，
 * 再叠加 `.period-chip` / `.period-dot` / `.period-bar` / `.period-rail` 使用。
 */
export const PERIOD_CLASS: Record<Period, string> = {
  morning: 'p-morning',
  afternoon: 'p-afternoon',
  evening: 'p-evening',
}

/** 时段胶囊（背景 14% + 文字混色 + 30% 描边） */
export const PERIOD_CHIP_CLASS = 'period-chip'

/** 时段小圆点 */
export const PERIOD_DOT_CLASS = 'period-dot'

/** 时段左侧竖线 */
export const PERIOD_RAIL_CLASS = 'period-rail'
