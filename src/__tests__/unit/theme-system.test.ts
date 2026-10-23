import { describe, it, expect } from 'vitest'
import {
  defaultPersonalization,
  defaultState,
  exportState,
  importState,
  sanitizePersonalization,
  sanitizeState,
} from '@/lib/theme/storage'
import { computeOverrides, foregroundFor } from '@/lib/theme/apply'
import { getTheme, resolveMode, supportsMode, THEMES, THEME_IDS } from '@/lib/theme/themes'

describe('主题注册表', () => {
  it('六套主题齐全且 id 唯一', () => {
    expect(THEMES).toHaveLength(6)
    expect(new Set(THEME_IDS).size).toBe(6)
  })

  it('未知 id 回退到默认主题而不是抛错', () => {
    expect(getTheme('does-not-exist').id).toBe('fluent')
    expect(getTheme(null).id).toBe('fluent')
    expect(getTheme(undefined).id).toBe('fluent')
  })

  it('只支持单模式的主题会强制该模式', () => {
    expect(supportsMode('cyber', 'light')).toBe(false)
    expect(resolveMode('cyber', 'light')).toBe('dark')
    expect(resolveMode('bento', 'light')).toBe('dark')
    expect(resolveMode('fluent', 'dark')).toBe('dark')
  })

  it('每套主题都有明暗预览色与默认参数', () => {
    for (const theme of THEMES) {
      expect(theme.preview.light.accent).toMatch(/^#/)
      expect(theme.preview.dark.accent).toMatch(/^#/)
      expect(theme.defaults.radius.card).toBeGreaterThanOrEqual(0)
      expect(['theme', 'system', 'rounded', 'mono', 'serif']).toContain(theme.defaults.fontId)
    }
  })
})

describe('个性化参数校验', () => {
  it('非法强调色被丢弃，只接受 hex', () => {
    expect(sanitizePersonalization('fluent', { accent: 'red' }).accent).toBeNull()
    expect(sanitizePersonalization('fluent', { accent: '#12345' }).accent).toBeNull()
    expect(sanitizePersonalization('fluent', { accent: '#10b981' }).accent).toBe('#10b981')
    expect(sanitizePersonalization('fluent', { accent: '#abc' }).accent).toBe('#abc')
  })

  it('圆角被限制在 0-32', () => {
    const p = sanitizePersonalization('fluent', {
      radius: { button: -10, card: 200, input: 4, dialog: 12 },
    })
    expect(p.radius.button).toBe(0)
    expect(p.radius.card).toBe(32)
    expect(p.radius.input).toBe(4)
  })

  it('缩放只接受白名单档位', () => {
    expect(sanitizePersonalization('fluent', { scale: 1.25 }).scale).toBe(1.25)
    expect(sanitizePersonalization('fluent', { scale: 1.37 }).scale).toBe(1)
    // 字符串形式也会被转成数字并落在白名单里（兼容导入的 JSON）
    expect(sanitizePersonalization('fluent', { scale: '1.5' }).scale).toBe(1.5)
  })

  it('字号越界时收敛到边界值，动效/字体非法时回退默认', () => {
    const p = sanitizePersonalization('fluent', {
      typeScale: 5,
      titleScale: 0.1,
      motion: 'turbo',
      fontId: 'comic',
    })
    const base = defaultPersonalization('fluent')
    expect(p.typeScale).toBe(1.2) // 上限
    expect(p.titleScale).toBe(0.85) // 下限
    expect(p.motion).toBe(base.motion)
    expect(p.fontId).toBe(base.fontId)
  })

  it('整体状态：坏配置回退默认值', () => {
    const state = sanitizeState({ themeId: 'nope', mode: 'neon', perTheme: 'oops', presets: 42 })
    expect(state.themeId).toBe('fluent')
    expect(state.mode).toBe('light')
    expect(state.presets).toEqual([])
  })

  it('整体状态：只保留合法预设', () => {
    const state = sanitizeState({
      themeId: 'anime',
      mode: 'light',
      presets: [
        { name: '坏主题', baseThemeId: 'nope', personalization: {} },
        { name: '夜间写作', baseThemeId: 'anime', personalization: { accent: '#10b981' } },
      ],
    })
    expect(state.presets).toHaveLength(1)
    expect(state.presets[0].name).toBe('夜间写作')
    expect(state.presets[0].personalization.accent).toBe('#10b981')
  })

  it('导出再导入应保持一致', () => {
    const original = sanitizeState({
      themeId: 'pixel',
      mode: 'dark',
      perTheme: { pixel: { accent: '#ff5470', radius: { button: 0, card: 0, input: 0, dialog: 0 } } },
      presets: [{ name: '街机', baseThemeId: 'pixel', personalization: {} }],
    })
    const json = exportState(original)
    const result = importState(json)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.state.themeId).toBe('pixel')
      expect(result.state.mode).toBe('dark')
      expect(result.state.perTheme.pixel?.accent).toBe('#ff5470')
      expect(result.state.presets).toHaveLength(1)
    }
  })

  it('导入非法 JSON 给出错误而不是崩溃', () => {
    expect(importState('not json').ok).toBe(false)
    expect(importState('{}').ok).toBe(false)
    expect(importState(JSON.stringify({ state: { themeId: 'ghost' } })).ok).toBe(false)
  })

  it('默认状态是云母浅色', () => {
    const state = defaultState()
    expect(state.themeId).toBe('fluent')
    expect(state.mode).toBe('light')
    expect(state.presets).toEqual([])
  })
})

describe('个性化 → CSS 变量', () => {
  it('强调色同时驱动 primary/ring/chart/sidebar', () => {
    const vars = computeOverrides({
      ...defaultPersonalization('fluent'),
      accent: '#10b981',
    })
    expect(vars['--primary']).toBe('#10b981')
    expect(vars['--ring']).toBe('#10b981')
    expect(vars['--chart-1']).toBe('#10b981')
    expect(vars['--sidebar-primary']).toBe('#10b981')
  })

  it('亮色强调色配深色文字，暗色强调色配白字', () => {
    expect(foregroundFor('#f9fafb')).toBe('#101014')
    expect(foregroundFor('#111113')).toBe('#ffffff')
    // 非法输入退回白字，保证可读
    expect(foregroundFor('oklch(0.5 0.2 200)')).toBe('#ffffff')
  })

  it('圆角映射到四类组件的变量', () => {
    const vars = computeOverrides({
      ...defaultPersonalization('fluent'),
      radius: { button: 20, card: 12, input: 6, dialog: 24 },
    })
    expect(vars['--radius-md']).toBe('20px') // 按钮/输入框主档
    expect(vars['--radius-input']).toBe('6px')
    expect(vars['--radius-lg']).toBe('12px') // 卡片
    expect(vars['--radius-xl']).toBe('24px') // 弹窗
  })

  it('动效强度换算成时长', () => {
    const off = computeOverrides({ ...defaultPersonalization('fluent'), motion: 'off' })
    expect(off['--motion-fast']).toBe('0ms')
    const high = computeOverrides({ ...defaultPersonalization('fluent'), motion: 'high' })
    expect(high['--motion-fast']).toBe('180ms')
  })

  it('跟随主题字体时不覆盖字体变量', () => {
    const vars = computeOverrides(defaultPersonalization('fluent'))
    expect(vars['--font-sans']).toBeUndefined()
    const mono = computeOverrides({
      ...defaultPersonalization('fluent'),
      fontId: 'mono',
    })
    expect(mono['--font-sans']).toContain('monospace')
  })
})
