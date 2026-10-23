// ============================================================
// 把「主题 + 个性化」翻译成 CSS 变量并写到 <html> 上
//
// 设计约束：
// - 调色板由 CSS 提供（[data-theme] 选择器），这里只写用户覆盖项
// - 恢复默认时必须 removeProperty，否则内联变量会一直压住主题
// ============================================================

import type {
  ColorMode,
  ColorPaletteSnapshot,
  MotionLevel,
  ThemeDefinition,
  ThemePersonalization,
} from './types'
import { FONT_OPTIONS } from './themes'

/** 会被个性化覆盖的变量清单，重置时按这个列表清空 */
const OVERRIDE_VARS = [
  '--primary',
  '--primary-foreground',
  '--ring',
  '--sidebar-primary',
  '--chart-1',
  '--accent-strong',
  '--radius',
  '--radius-sm',
  '--radius-md',
  '--radius-lg',
  '--radius-xl',
  '--radius-2xl',
  '--radius-3xl',
  '--radius-4xl',
  '--font-sans',
  '--font-heading',
  '--type-scale',
  '--title-scale',
  '--motion-fast',
  '--motion-base',
  '--motion-slow',
] as const

/** #rgb / #rrggbb → 0-1 相对亮度；无法解析返回 null */
function hexLuminance(hex: string): number | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return null
  let value = m[1]
  if (value.length === 3) {
    value = value
      .split('')
      .map((c) => c + c)
      .join('')
  }
  const r = parseInt(value.slice(0, 2), 16) / 255
  const g = parseInt(value.slice(2, 4), 16) / 255
  const b = parseInt(value.slice(4, 6), 16) / 255
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

/** 强调色上的文字颜色：亮底用深色字，暗底用白字 */
export function foregroundFor(accent: string): string {
  const lum = hexLuminance(accent)
  if (lum === null) return '#ffffff'
  return lum > 0.55 ? '#101014' : '#ffffff'
}

/** 生成一组基于卡片圆角的阶梯，保证各处半径仍然协调 */
function radiusScale(button: number, card: number, input: number, dialog: number) {
  return {
    '--radius': `${card}px`,
    '--radius-sm': `${Math.max(0, Math.round(button * 0.6))}px`,
    '--radius-md': `${button}px`,
    '--radius-lg': `${card}px`,
    '--radius-xl': `${dialog}px`,
    '--radius-2xl': `${Math.round(card * 1.35)}px`,
    '--radius-3xl': `${Math.round(card * 1.7)}px`,
    '--radius-4xl': `${Math.round(card * 2.1)}px`,
    // 输入框单独一档，允许和按钮区分
    '--radius-input': `${input}px`,
  } as Record<string, string>
}

const MOTION_DURATIONS: Record<MotionLevel, [string, string, string]> = {
  off: ['0ms', '0ms', '0ms'],
  low: ['90ms', '120ms', '160ms'],
  standard: ['140ms', '200ms', '280ms'],
  high: ['180ms', '260ms', '380ms'],
}

export interface AppliedOverrides {
  [key: string]: string
}

/**
 * 计算需要写入 <html> 的内联变量。
 * 只包含用户覆盖过的项，未覆盖的交给主题 CSS。
 */
export function computeOverrides(p: ThemePersonalization): AppliedOverrides {
  const vars: AppliedOverrides = {}

  if (p.accent) {
    vars['--primary'] = p.accent
    vars['--primary-foreground'] = foregroundFor(p.accent)
    vars['--ring'] = p.accent
    vars['--sidebar-primary'] = p.accent
    vars['--chart-1'] = p.accent
    vars['--accent-strong'] = p.accent
  }

  Object.assign(vars, radiusScale(p.radius.button, p.radius.card, p.radius.input, p.radius.dialog))

  if (p.fontId !== 'theme') {
    const font = FONT_OPTIONS.find((f) => f.value === p.fontId)
    if (font?.stack) {
      vars['--font-sans'] = font.stack
      vars['--font-heading'] = font.stack
    }
  }

  vars['--type-scale'] = String(p.typeScale)
  vars['--title-scale'] = String(p.titleScale)

  const [fast, base, slow] = MOTION_DURATIONS[p.motion]
  vars['--motion-fast'] = fast
  vars['--motion-base'] = base
  vars['--motion-slow'] = slow

  return vars
}

/** 主题自带的默认值（用于「恢复当前主题默认」按钮的比较） */
export function isDefaultPersonalization(
  def: ThemeDefinition,
  p: ThemePersonalization
): boolean {
  const d = def.defaults
  return (
    (p.accent ?? null) === (d.accent ?? null) &&
    p.radius.button === d.radius.button &&
    p.radius.card === d.radius.card &&
    p.radius.input === d.radius.input &&
    p.radius.dialog === d.radius.dialog &&
    p.scale === d.scale &&
    p.fontId === d.fontId &&
    p.typeScale === d.typeScale &&
    p.titleScale === d.titleScale &&
    p.motion === d.motion
  )
}

/** 把覆盖项写到 <html>，并同步缩放与动效相关属性 */
export function applyToDocument(
  root: HTMLElement,
  def: ThemeDefinition,
  p: ThemePersonalization,
  mode: 'light' | 'dark',
  reducedMotion: boolean
): void {
  root.dataset.theme = def.id
  root.dataset.mode = mode
  root.dataset.motion = reducedMotion ? 'off' : p.motion
  root.style.fontSize = `${(16 * p.scale).toFixed(2)}px`

  // 先清空旧的覆盖，避免切换主题后残留上一套的参数
  for (const name of OVERRIDE_VARS) root.style.removeProperty(name)
  const vars = computeOverrides(p)
  for (const [name, value] of Object.entries(vars)) {
    root.style.setProperty(name, value)
  }
}

/**
 * 智能配色只负责"叠加层"变量。
 *
 * 主色（--primary / --ring / --chart-1 …）由 applyToDocument 统一写入：
 * 个性化强调色与调色板主色只能有一个来源，否则两者会互相覆盖。
 */
const PALETTE_VARS = [
  '--accent',
  '--accent-foreground',
  '--ambient-1',
  '--ambient-2',
  '--overlay-tint',
  '--card-tint',
  '--border-tint',
  '--selection-tint',
] as const

/**
 * 把智能配色写进 <html>。
 * mode='theme' 或不传调色板时移除叠加层变量，回到主题自带的氛围。
 */
export function applyPalette(
  root: HTMLElement,
  palette: ColorPaletteSnapshot | null,
  mode: ColorMode
): void {
  for (const name of PALETTE_VARS) root.style.removeProperty(name)
  if (!palette || mode === 'theme') return

  // 主色不在这里写（见上面的说明），只处理"次级强调"与氛围层
  root.style.setProperty('--accent', palette.primaryContainer)
  root.style.setProperty('--accent-foreground', palette.primary)
  // 氛围层：背景光 + 蒙层 + 卡片/边框/选中态染色
  root.style.setProperty('--ambient-1', palette.ambient)
  root.style.setProperty('--ambient-2', palette.primaryContainer)
  root.style.setProperty('--overlay-tint', palette.overlay)
  root.style.setProperty('--card-tint', palette.cardTint)
  root.style.setProperty('--border-tint', palette.borderTint)
  root.style.setProperty('--selection-tint', palette.selection)
}

/** 卸载/关闭主题系统时清理 */
export function clearFromDocument(root: HTMLElement): void {
  for (const name of OVERRIDE_VARS) root.style.removeProperty(name)
  for (const name of PALETTE_VARS) root.style.removeProperty(name)
  root.style.removeProperty('font-size')
  delete root.dataset.theme
  delete root.dataset.mode
  delete root.dataset.motion
}
