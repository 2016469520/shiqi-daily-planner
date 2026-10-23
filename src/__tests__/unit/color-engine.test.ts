import { describe, it, expect } from 'vitest'
import {
  buildPalette,
  contrastRatio,
  ensureContrast,
  hexToRgb,
  hueClash,
  isDarkColor,
  oklchToHex,
  paletteSwatches,
  rgbToHex,
  rgbToOklch,
  scoreSeed,
} from '@/lib/theme/color'
import { quantize } from '@/lib/theme/palette-from-image'
import { sanitizeColor, defaultColor } from '@/lib/theme/storage'
import {
  categoryCounts,
  figureOf,
  filterByCategory,
  installedCharacters,
  pendingCharacters,
  searchCharacters,
  CHARACTER_LIBRARY,
} from '@/lib/theme/characters'

// hexToOklch 在模块里叫 rgbToOklch，这里包一层方便断言
function oklch(hex: string) {
  const rgb = hexToRgb(hex)
  if (!rgb) throw new Error('bad hex')
  return rgbToOklch(rgb)
}

describe('颜色空间转换', () => {
  it('黑白与三原色的转换是稳定的', () => {
    expect(rgbToHex(hexToRgb('#ffffff')!)).toBe('#ffffff')
    expect(rgbToHex(hexToRgb('#000000')!)).toBe('#000000')
    expect(rgbToHex(hexToRgb('#ff0000')!)).toBe('#ff0000')
  })

  it('hex → oklch → hex 能回到原色（容差 2）', () => {
    for (const hex of ['#7c3aed', '#db2777', '#22d3ee', '#0a0c11', '#f3f3f3']) {
      const back = oklchToHex(oklch(hex))
      const a = hexToRgb(hex)!
      const b = hexToRgb(back)!
      expect(Math.abs(a.r - b.r)).toBeLessThanOrEqual(2)
      expect(Math.abs(a.g - b.g)).toBeLessThanOrEqual(2)
      expect(Math.abs(a.b - b.b)).toBeLessThanOrEqual(2)
    }
  })

  it('白底黑字对比度是 21', () => {
    expect(Math.round(contrastRatio('#000000', '#ffffff'))).toBe(21)
  })

  it('识别深色与浅色', () => {
    expect(isDarkColor('#0a0c11')).toBe(true)
    expect(isDarkColor('#f7f7f8')).toBe(false)
  })
})

describe('对比度修正', () => {
  it('浅底上的浅色字会被压暗到 4.5:1 以上', () => {
    const fixed = ensureContrast('#cccccc', '#ffffff', 4.5)
    expect(contrastRatio(fixed, '#ffffff')).toBeGreaterThanOrEqual(4.4)
  })

  it('深底上的深色字会被提亮', () => {
    const fixed = ensureContrast('#111111', '#0a0c11', 4.5)
    expect(contrastRatio(fixed, '#0a0c11')).toBeGreaterThanOrEqual(4.4)
  })

  it('本来就达标时保持原样', () => {
    expect(ensureContrast('#000000', '#ffffff', 4.5)).toBe('#000000')
  })
})

describe('调色板推导', () => {
  it('主色在按钮上始终可读（≥4.5:1）', () => {
    for (const seed of ['#db2777', '#2563eb', '#7c3aed', '#059669', '#ea580c', '#eab308']) {
      for (const dark of [false, true]) {
        const p = buildPalette(seed, 60, dark)
        expect(contrastRatio(p.onPrimary, p.primary)).toBeGreaterThanOrEqual(4.4)
      }
    }
  })

  it('次级与三级不是同一个色相，避免整屏一个颜色', () => {
    const p = buildPalette('#db2777', 60, false)
    const hPrimary = oklch(p.primary).h
    const hSecondary = oklch(p.secondary).h
    const hTertiary = oklch(p.tertiary).h
    expect(Math.abs(hSecondary - hPrimary)).toBeGreaterThan(15)
    expect(Math.abs(hTertiary - hPrimary)).toBeGreaterThan(15)
  })

  it('强度越高，叠加层越明显', () => {
    const low = buildPalette('#2563eb', 0, false)
    const high = buildPalette('#2563eb', 100, false)
    const alpha = (v: string) => Number(/,\s*([\d.]+)\)/.exec(v)?.[1] ?? 0)
    expect(alpha(high.ambient)).toBeGreaterThan(alpha(low.ambient))
    expect(alpha(high.cardTint)).toBeGreaterThan(alpha(low.cardTint))
  })

  it('非法种子色会退回安全主色而不是崩溃', () => {
    const p = buildPalette('not-a-color', 50, false)
    expect(p.primary).toMatch(/^#/)
  })

  it('色卡数量固定为 6 个', () => {
    expect(paletteSwatches(buildPalette('#059669', 50, false))).toHaveLength(6)
  })

  it('冲突度随色相拉近而下降', () => {
    const near = hueClash('#db2777', '#e05263')
    const far = hueClash('#db2777', '#22d3ee')
    expect(near).toBeLessThan(far)
  })

  it('彩度低的颜色不被当成"有性格"的种子', () => {
    expect(scoreSeed('#808080')).toBeLessThan(scoreSeed('#db2777'))
  })
})

describe('背景取色（离线量化）', () => {
  it('三种明显不同的颜色会被分成三簇', () => {
    const pixels = []
    for (let i = 0; i < 40; i++) pixels.push({ r: 240, g: 20, b: 40 })
    for (let i = 0; i < 40; i++) pixels.push({ r: 20, g: 200, b: 60 })
    for (let i = 0; i < 40; i++) pixels.push({ r: 30, g: 60, b: 230 })
    const clusters = quantize(pixels, 3)
    const hexes = clusters.map((c) => rgbToHex(c.center))
    expect(hexes).toHaveLength(3)
    // 每个簇中心都应接近某个原色
    const near = (hex: string, target: string) => {
      const a = hexToRgb(hex)!
      const b = hexToRgb(target)!
      return Math.abs(a.r - b.r) + Math.abs(a.g - b.g) + Math.abs(a.b - b.b) < 60
    }
    expect(hexes.some((h) => near(h, '#f01428'))).toBe(true)
    expect(hexes.some((h) => near(h, '#14c83c'))).toBe(true)
    expect(hexes.some((h) => near(h, '#1e3ce6'))).toBe(true)
  })

  it('空输入不会抛错', () => {
    expect(quantize([], 4)).toEqual([])
  })
})

describe('配色设置校验', () => {
  it('强度被限制在 0-100', () => {
    expect(sanitizeColor({ strength: 500 }).strength).toBe(100)
    expect(sanitizeColor({ strength: -20 }).strength).toBe(0)
  })

  it('非法模式回退到 theme', () => {
    expect(sanitizeColor({ mode: 'neon' }).mode).toBe('theme')
    expect(sanitizeColor({ mode: 'wallpaper' }).mode).toBe('wallpaper')
  })

  it('非法种子色被丢弃', () => {
    expect(sanitizeColor({ seed: 'red' }).seed).toBeNull()
    expect(sanitizeColor({ seed: '#db2777' }).seed).toBe('#db2777')
  })

  it('候选色最多保留 6 个', () => {
    const list = Array.from({ length: 12 }, (_, i) => `#${(100000 + i * 1111).toString(16).slice(0, 6)}`)
    expect(sanitizeColor({ candidates: list }).candidates.length).toBeLessThanOrEqual(6)
  })

  it('调色板快照缺字段时补默认值', () => {
    const c = sanitizeColor({ palette: { primary: '#123456' } })
    expect(c.palette?.primary).toBe('#123456')
    expect(c.palette?.onPrimary).toMatch(/^#/)
  })

  it('空配置等于默认值', () => {
    expect(sanitizeColor(null)).toEqual(defaultColor())
  })
})

describe('角色库', () => {
  it('内置角色与待导入分离，候选不会被当成已安装', () => {
    const installed = installedCharacters()
    const pending = pendingCharacters()
    // 内置只剩 PIX；其余角色全部来自本地素材包
    expect(installed.map((c) => c.id)).toEqual(['pixel-pix'])
    expect(pending).toHaveLength(0)
    expect(installed.every((c) => c.artId !== null)).toBe(true)
    expect(installed.length + pending.length).toBe(CHARACTER_LIBRARY.length)
  })

  it('每个已安装角色都有推荐主题/场景/强调色', () => {
    for (const c of installedCharacters()) {
      expect(c.recommend.themeId).toBeTruthy()
      expect(c.recommend.sceneId).toBeTruthy()
      expect(c.recommend.accent).toMatch(/^#/)
    }
  })

  it('分类计数与分类过滤一致', () => {
    const counts = categoryCounts()
    expect(counts.all).toBe(installedCharacters().length)
    const original = filterByCategory(installedCharacters(), 'original')
    expect(original.length).toBe(counts.original)
    expect(original.every((c) => c.categories.includes('original'))).toBe(true)
  })

  it('搜索能命中角色名与作品名', () => {
    expect(searchCharacters('PIX').some((c) => c.id === 'pixel-pix')).toBe(true)
    expect(searchCharacters('时栖').every((c) => c.work === '时栖')).toBe(true)
    expect(searchCharacters('不存在的角色名').length).toBe(0)
  })

  it('已删除的角色解析为 null（渲染时会安全回退）', () => {
    expect(figureOf('feng-baobao')).toBeNull()
    expect(figureOf('xiyangyang')).toBeNull()
    expect(figureOf('pixel-pix')?.name).toBe('PIX')
    expect(figureOf(null)).toBeNull()
  })

  it('PIX 支持 5 种表情', () => {
    expect(figureOf('pixel-pix')?.expressions).toHaveLength(5)
  })
})
