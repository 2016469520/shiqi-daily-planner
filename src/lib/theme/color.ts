// ============================================================
// 智能色彩引擎（纯函数，可在 node 里单测）
//
// 目标：选一个颜色或选一张背景之后，界面不是"只有按钮变色"，
// 而是背景蒙层、氛围光、卡片、边框、选中态一起协调。
//
// 做法：
// 1. 在 OKLCH 感知空间里做色相/明度/彩度运算（比 HSL 更符合人眼）
// 2. 由种子色推导一套语义色（primary/onPrimary/container/secondary/
//    tertiary/ambient/overlay/cardTint/borderTint/selection）
// 3. 用 WCAG 对比度校验并自动修正明度，保证文字可读
// 4. 强度 0-100 只缩放"叠加层"的不透明度，不破坏背景图与角色图
// ============================================================

export interface Rgb {
  r: number
  g: number
  b: number
}

export interface Oklch {
  /** 0-1 */
  l: number
  /** 0-0.4 */
  c: number
  /** 0-360 */
  h: number
}

export interface ColorPalette {
  /** 种子色（取自背景或用户选择） */
  seed: string
  primary: string
  onPrimary: string
  primaryContainer: string
  secondary: string
  tertiary: string
  /** 背景氛围光（叠加在场景上的径向光） */
  ambient: string
  /** 蒙层色（带 alpha，强度越高越明显） */
  overlay: string
  /** 卡片色调 */
  cardTint: string
  /** 边框色调 */
  borderTint: string
  /** 选中态底色 */
  selection: string
  /** 是否按深色背景计算 */
  dark: boolean
}

// ------------------------------------------------------------
// 颜色转换
// ------------------------------------------------------------

export function hexToRgb(hex: string): Rgb | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return null
  let v = m[1]
  if (v.length === 3) v = v.split('').map((c) => c + c).join('')
  return {
    r: parseInt(v.slice(0, 2), 16),
    g: parseInt(v.slice(2, 4), 16),
    b: parseInt(v.slice(4, 6), 16),
  }
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const to = (n: number) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0')
  return `#${to(r)}${to(g)}${to(b)}`
}

function srgbToLinear(c: number): number {
  const v = c / 255
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}

function linearToSrgb(v: number): number {
  const c = v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055
  return c * 255
}

/** sRGB → OKLab → OKLCH（Björn Ottosson 的标准公式） */
export function rgbToOklch({ r, g, b }: Rgb): Oklch {
  const lr = srgbToLinear(r)
  const lg = srgbToLinear(g)
  const lb = srgbToLinear(b)

  const l_ = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const m_ = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  const s_ = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)

  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_
  const bb = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_

  const c = Math.sqrt(a * a + bb * bb)
  let h = (Math.atan2(bb, a) * 180) / Math.PI
  if (h < 0) h += 360
  return { l: L, c, h }
}

/** OKLCH → sRGB hex（超出色域时按色度收敛，避免发灰） */
export function oklchToHex({ l, c, h }: Oklch): string {
  const L = Math.min(1, Math.max(0, l))
  let C = Math.max(0, c)
  const hRad = (h * Math.PI) / 180

  // 逐步收敛色度，直到落回 sRGB 色域
  for (let i = 0; i < 24; i++) {
    const a = C * Math.cos(hRad)
    const bb = C * Math.sin(hRad)

    const l_ = L + 0.3963377774 * a + 0.2158037573 * bb
    const m_ = L - 0.1055613458 * a - 0.0638541728 * bb
    const s_ = L - 0.0894841775 * a - 1.291485548 * bb

    const l3 = l_ * l_ * l_
    const m3 = m_ * m_ * m_
    const s3 = s_ * s_ * s_

    const rl = 4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3
    const gl = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3
    const bl = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3

    const inGamut = [rl, gl, bl].every((v) => v >= -0.0005 && v <= 1.0005)
    if (inGamut) {
      return rgbToHex({
        r: linearToSrgb(Math.max(0, rl)),
        g: linearToSrgb(Math.max(0, gl)),
        b: linearToSrgb(Math.max(0, bl)),
      })
    }
    C *= 0.94
  }
  // 极端情况退化成灰阶
  const grey = Math.round(L * 255)
  return rgbToHex({ r: grey, g: grey, b: grey })
}

// ------------------------------------------------------------
// 对比度
// ------------------------------------------------------------

function relativeLuminance(rgb: Rgb): number {
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(srgbToLinear)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG 对比度（1-21） */
export function contrastRatio(a: string, b: string): number {
  const ra = hexToRgb(a)
  const rb = hexToRgb(b)
  if (!ra || !rb) return 1
  const la = relativeLuminance(ra)
  const lb = relativeLuminance(rb)
  const [hi, lo] = la > lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

/**
 * 让 fg 在 bg 上达到目标对比度：只调 fg 的明度，保留色相。
 * 返回修正后的 hex（如果本来就达标则原样返回）。
 */
export function ensureContrast(fg: string, bg: string, target = 4.5): string {
  const base = hexToRgb(fg)
  const bgRgb = hexToRgb(bg)
  if (!base || !bgRgb) return fg
  const bgLum = relativeLuminance(bgRgb)
  // 背景偏亮就往暗调，背景偏暗就往亮调
  const goDark = bgLum > 0.4
  const lch = rgbToOklch(base)

  let best = fg
  for (let step = 0; step <= 20; step++) {
    const l = goDark ? Math.max(0, lch.l - step * 0.05) : Math.min(1, lch.l + step * 0.05)
    const candidate = oklchToHex({ ...lch, l })
    best = candidate
    if (contrastRatio(candidate, bg) >= target) return candidate
  }
  return best
}

/** 判断一个颜色是否偏暗（用于选 onPrimary 与 dark 模式推断） */
export function isDarkColor(hex: string): boolean {
  const rgb = hexToRgb(hex)
  if (!rgb) return false
  return relativeLuminance(rgb) < 0.42
}

// ------------------------------------------------------------
// 调色板推导
// ------------------------------------------------------------

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}

function rotate(h: number, delta: number): number {
  return (h + delta + 360) % 360
}

function withAlpha(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  return `rgba(${Math.round(rgb.r)}, ${Math.round(rgb.g)}, ${Math.round(rgb.b)}, ${clamp(alpha, 0, 1).toFixed(3)})`
}

/**
 * 由种子色生成整套语义色。
 * @param seedHex 用户选的强调色，或从背景提取的主色
 * @param strength 0-100，只影响叠加层的透明度与卡片/边框的染色强度
 * @param dark 是否深色背景（决定 primary 的明度走向）
 */
export function buildPalette(seedHex: string, strength = 60, dark = false): ColorPalette {
  const rgb = hexToRgb(seedHex)
  const seed = rgb ? rgbToHex(rgb) : '#7c5cff'
  const base = rgbToOklch(hexToRgb(seed) as Rgb)
  const s = clamp(strength, 0, 100) / 100
  const seedIsDark = isDarkColor(seed)

  // 主色：深色背景下提亮，浅色背景下压暗，保证在按钮上可读
  const primaryL = dark ? clamp(Math.max(base.l, 0.66), 0.62, 0.86) : clamp(Math.min(base.l, 0.56), 0.34, 0.6)
  const primaryChroma = clamp(base.c, 0.05, 0.26)
  let primary = oklchToHex({ l: primaryL, c: primaryChroma, h: base.h })

  // 主色上的文字：在白与近黑里挑对比度更高的那个。
  // 如果两者都不够 4.5:1（中明度色会遇到这种"两边都差一点"的情况），
  // 就把按钮底色往暗/往亮推一点——调整背景比调整文字更符合直觉。
  const white = '#ffffff'
  const ink = '#0d0d10'
  const bestText = (bg: string) =>
    contrastRatio(white, bg) >= contrastRatio(ink, bg) ? white : ink

  for (let step = 0; step < 12; step++) {
    if (contrastRatio(bestText(primary), primary) >= 4.5) break
    const nextL = dark
      ? Math.min(0.97, primaryL + 0.03 * (step + 1))
      : Math.max(0.16, primaryL - 0.03 * (step + 1))
    primary = oklchToHex({ l: nextL, c: primaryChroma, h: base.h })
  }
  const onPrimary = bestText(primary)

  // 容器色：同色相、低彩度、贴近背景明度
  const primaryContainer = oklchToHex({
    l: dark ? 0.32 : 0.94,
    c: clamp(base.c * 0.5, 0.02, 0.1),
    h: base.h,
  })

  // 次级 / 三级：色轮上错开，避免整屏一个颜色
  const secondary = oklchToHex({
    l: dark ? 0.7 : 0.52,
    c: clamp(base.c * 0.7, 0.03, 0.18),
    h: rotate(base.h, 38),
  })
  const tertiary = oklchToHex({
    l: dark ? 0.74 : 0.58,
    c: clamp(base.c * 0.8, 0.03, 0.2),
    h: rotate(base.h, -42),
  })

  return {
    seed,
    primary,
    onPrimary,
    primaryContainer,
    secondary,
    tertiary,
    ambient: withAlpha(primary, (dark ? 0.26 : 0.18) * (0.35 + s * 0.65)),
    overlay: withAlpha(seedIsDark && !dark ? seed : primary, 0.16 * s),
    cardTint: withAlpha(primary, 0.05 * s + 0.01),
    borderTint: withAlpha(primary, 0.14 * s + 0.02),
    selection: withAlpha(primary, 0.14 * s + 0.04),
    dark,
  }
}

/** 从一组候选色里挑"最有性格"的那个：彩度高、明度不过亮过暗 */
export function scoreSeed(hex: string): number {
  const rgb = hexToRgb(hex)
  if (!rgb) return -1
  const lch = rgbToOklch(rgb)
  const chromaScore = Math.min(lch.c / 0.2, 1) * 60
  const lumScore = 40 * (1 - Math.abs(lch.l - 0.55) / 0.55)
  return chromaScore + lumScore
}

/** 供 UI 展示：把调色板变成可读的色卡列表 */
export function paletteSwatches(p: ColorPalette): { label: string; value: string }[] {
  return [
    { label: '主色', value: p.primary },
    { label: '主色容器', value: p.primaryContainer },
    { label: '次级', value: p.secondary },
    { label: '三级', value: p.tertiary },
    { label: '氛围光', value: p.ambient },
    { label: '卡片色', value: p.cardTint },
  ]
}

/**
 * 色相冲突程度（0-1）：用于"锁背景"模式给出提醒。
 * 依据：色相角差 + 彩度对比。
 */
export function hueClash(a: string, b: string): number {
  const ra = hexToRgb(a)
  const rb = hexToRgb(b)
  if (!ra || !rb) return 0
  const A = rgbToOklch(ra)
  const B = rgbToOklch(rb)
  let diff = Math.abs(A.h - B.h)
  if (diff > 180) diff = 360 - diff
  const hueGap = Math.min(diff / 180, 1)
  // 互补色差 180° 时并不一定冲突，真正难看的是"高彩度 + 中等色相差"
  const saturation = Math.min(Math.max(A.c, B.c) / 0.2, 1)
  return clamp(hueGap * saturation, 0, 1)
}
