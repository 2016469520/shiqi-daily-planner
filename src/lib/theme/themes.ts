// ============================================================
// 主题注册表：六套内置主题的元数据
//
// 新增第七套主题只需要：
// 1. 在 types.ts 的 ThemeId 里加一个 id
// 2. 在 src/styles 下加一个 theme-<id>.css（调色板 + 结构规则）
// 3. 在下方 THEMES 里加一条元数据
// 4. 在 src/styles/themes.css 里 @import 新文件
// 业务页面不需要任何改动。
// ============================================================

import type {
  FontId,
  MotionLevel,
  RadiusSettings,
  ThemeDefinition,
  ThemeId,
  ThemePersonalization,
} from './types'

export const DEFAULT_RADIUS: RadiusSettings = {
  button: 8,
  card: 12,
  input: 8,
  dialog: 16,
}

export const SCALE_OPTIONS = [0.8, 0.9, 1, 1.1, 1.25, 1.5] as const

export const MOTION_OPTIONS: { value: MotionLevel; label: string; hint: string }[] = [
  { value: 'off', label: '关闭', hint: '不做过渡与动画，状态仍用颜色/边框区分' },
  { value: 'low', label: '低', hint: '只保留必要的状态过渡' },
  { value: 'standard', label: '标准', hint: '主题推荐的默认节奏' },
  { value: 'high', label: '高', hint: '更明显的位移、缩放与装饰动效' },
]

export const FONT_OPTIONS: { value: FontId; label: string; stack: string; hint: string }[] = [
  { value: 'theme', label: '跟随主题', stack: '', hint: '使用当前主题自带的字体方案' },
  {
    value: 'system',
    label: '系统无衬线',
    stack: 'var(--font-ui, ui-sans-serif), "Segoe UI", system-ui, "Microsoft YaHei", sans-serif',
    hint: '最稳妥的默认选择',
  },
  {
    value: 'rounded',
    label: '圆润黑体',
    stack: '"Segoe UI Rounded", "Hiragino Maru Gothic ProN", "Yu Gothic UI", "Microsoft YaHei UI", system-ui, sans-serif',
    hint: '亲和力强，适合日系主题',
  },
  {
    value: 'mono',
    label: '等宽字体',
    stack: 'var(--font-geist-mono), "Cascadia Mono", Consolas, "Sarasa Mono SC", ui-monospace, monospace',
    hint: '数码、终端感',
  },
  {
    value: 'serif',
    label: '衬线字体',
    stack: 'Georgia, "Songti SC", "SimSun", "Noto Serif SC", ui-serif, serif',
    hint: '偏书卷气、杂志感',
  },
]

function p(overrides: Partial<ThemePersonalization> = {}): ThemePersonalization {
  return {
    accent: null,
    radius: { ...DEFAULT_RADIUS },
    scale: 1,
    fontId: 'theme',
    typeScale: 1,
    titleScale: 1,
    motion: 'standard',
    ...overrides,
  }
}

export const THEMES: ThemeDefinition[] = [
  {
    id: 'fluent',
    name: '云母',
    latinName: 'Fluent',
    tagline: 'Windows 11 式清爽与层次',
    description:
      '取自 Windows 11 的云母材质：柔和的半透明表面、克制的投影、明确的层级。默认推荐，长时间使用最不容易疲劳。',
    keywords: ['Fluent', 'Acrylic', 'Mica', '桌面'],
    modes: ['light', 'dark'],
    defaultMode: 'light',
    recommended: true,
    preview: {
      light: {
        background: '#f3f3f3',
        surface: '#ffffff',
        text: '#1b1b1f',
        accent: '#0067c0',
        accentSoft: 'rgba(0, 103, 192, 0.12)',
      },
      dark: {
        background: '#202020',
        surface: '#2b2b2b',
        text: '#f5f5f5',
        accent: '#4cc2ff',
        accentSoft: 'rgba(76, 194, 255, 0.16)',
      },
    },
    defaults: p({ radius: { button: 4, card: 8, input: 4, dialog: 12 } }),
  },
  {
    id: 'anime',
    name: '樱色',
    latinName: 'Anime',
    tagline: '日系二次元的轻盈与可爱',
    description:
      '樱花粉、薰衣草与晴空的柔和配色，圆润的卡片、点点星光与轻快弹跳的动效。属于会让人想在睡前多看一眼的界面。',
    keywords: ['Anime', 'Pastel', 'Kawaii', 'Soft UI'],
    modes: ['light', 'dark'],
    defaultMode: 'light',
    preview: {
      light: {
        background: '#fff6fa',
        surface: '#ffffff',
        text: '#43314a',
        accent: '#db2777',
        accentSoft: 'rgba(219, 39, 119, 0.16)',
      },
      dark: {
        background: '#241c2b',
        surface: '#2f2638',
        text: '#f7ecf7',
        accent: '#f9a8d4',
        accentSoft: 'rgba(249, 168, 212, 0.18)',
      },
    },
    defaults: p({ radius: { button: 999, card: 20, input: 12, dialog: 24 }, motion: 'high' }),
  },
  {
    id: 'cyber',
    name: '霓虹终端',
    latinName: 'Cyberpunk',
    tagline: 'HUD 面板与冷光扫描线',
    description:
      '深空底色、青色数据线与切角面板。标题带机械感的字距，状态用指示灯表达，边角有 HUD 括号。为夜间长时间工作准备，克制发光。',
    keywords: ['Cyberpunk', 'HUD', 'Neon', 'Sci-Fi'],
    modes: ['dark'],
    defaultMode: 'dark',
    preview: {
      light: {
        background: '#05070d',
        surface: '#0b1220',
        text: '#d7f7ff',
        accent: '#22d3ee',
        accentSoft: 'rgba(34, 211, 238, 0.16)',
      },
      dark: {
        background: '#05070d',
        surface: '#0b1220',
        text: '#d7f7ff',
        accent: '#22d3ee',
        accentSoft: 'rgba(34, 211, 238, 0.16)',
      },
    },
    defaults: p({ radius: { button: 2, card: 4, input: 2, dialog: 6 }, motion: 'low' }),
  },
  {
    id: 'minimal',
    name: '留白',
    latinName: 'Minimal',
    tagline: '近乎没有装饰的高级感',
    description:
      '去掉边框与投影，全靠留白、字重和精确对齐建立层次。单一强调色，克制的悬停反馈，适合追求长期耐看的桌面工具。',
    keywords: ['Minimal', 'Apple', 'Linear', 'Clean'],
    modes: ['light', 'dark'],
    defaultMode: 'light',
    preview: {
      light: {
        background: '#fbfbfa',
        surface: '#ffffff',
        text: '#111113',
        accent: '#17171a',
        accentSoft: 'rgba(23, 23, 26, 0.06)',
      },
      dark: {
        background: '#0c0c0e',
        surface: '#141417',
        text: '#f4f4f5',
        accent: '#f4f4f5',
        accentSoft: 'rgba(244, 244, 245, 0.1)',
      },
    },
    defaults: p({ radius: { button: 6, card: 10, input: 6, dialog: 14 } }),
  },
  {
    id: 'pixel',
    name: '像素机',
    latinName: 'Retro Pixel',
    tagline: '8-bit 掌机与街机的复古秩序',
    description:
      '硬边边框、零圆角、错位实心投影，标题带像素感字距，选中项用 ▶ 标记。动效是分步跳变而不是缓动，像在对一台老机器下指令。',
    keywords: ['Retro', 'Pixel Art', '8-bit', 'Arcade'],
    modes: ['light', 'dark'],
    defaultMode: 'light',
    preview: {
      light: {
        background: '#f4f1ea',
        surface: '#fffdf6',
        text: '#1a1c2c',
        accent: '#d7263d',
        accentSoft: 'rgba(215, 38, 61, 0.14)',
      },
      dark: {
        background: '#14162b',
        surface: '#1d2040',
        text: '#f4f4f4',
        accent: '#ff5470',
        accentSoft: 'rgba(255, 84, 112, 0.18)',
      },
    },
    defaults: p({ radius: { button: 0, card: 0, input: 0, dialog: 0 }, motion: 'low' }),
  },
  {
    id: 'bento',
    name: '暗格',
    latinName: 'Dark Bento',
    tagline: '深色模块化，数据一目了然',
    description:
      '低饱和深色底上铺开大小不一的模块卡，边框极轻、内层有微光，悬停时轻微上浮。适合把计划、习惯、统计摊在一屏里同时看。',
    keywords: ['Dark', 'Bento', 'Premium', 'SaaS'],
    modes: ['dark'],
    defaultMode: 'dark',
    preview: {
      light: {
        background: '#0a0c11',
        surface: '#12151d',
        text: '#e7eaf0',
        accent: '#7dd3fc',
        accentSoft: 'rgba(125, 211, 252, 0.14)',
      },
      dark: {
        background: '#0a0c11',
        surface: '#12151d',
        text: '#e7eaf0',
        accent: '#7dd3fc',
        accentSoft: 'rgba(125, 211, 252, 0.14)',
      },
    },
    defaults: p({ radius: { button: 10, card: 16, input: 10, dialog: 20 } }),
  },
]

export const THEME_IDS = THEMES.map((t) => t.id)

export const DEFAULT_THEME_ID: ThemeId = 'fluent'

export function getTheme(id: string | null | undefined): ThemeDefinition {
  const found = THEMES.find((t) => t.id === id)
  // 非法 id 一律回退到默认主题，避免坏配置把界面弄成默认浏览器样式
  return found ?? THEMES[0]
}

/** 主题是否支持某个明暗模式 */
export function supportsMode(id: ThemeId, mode: 'light' | 'dark'): boolean {
  return getTheme(id).modes.includes(mode)
}

/** 主题在该模式下的有效模式（只支持一种时强制使用它） */
export function resolveMode(
  id: ThemeId,
  desired: 'light' | 'dark',
  system?: 'light' | 'dark'
): 'light' | 'dark' {
  const theme = getTheme(id)
  if (theme.modes.length === 1) return theme.modes[0]
  return theme.modes.includes(desired) ? desired : (system ?? theme.defaultMode)
}
