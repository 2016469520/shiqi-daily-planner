'use client'

// ============================================================
// 从背景图提取主色（浏览器端）
//
// 做法：把图片缩到 48×48 画到 canvas，取像素后在 OKLCH 空间里做
// 轻量 k-means（固定初始种子，结果可复现），再按"彩度 + 明度适中"
// 排序，返回前几个候选调色板。
//
// 不取平均色：平均色会把所有颜色糊成一团灰。
// 不读像素跨域：只处理本地 Blob / object URL，天然同源。
// ============================================================

import { buildPalette, rgbToOklch, scoreSeed, type ColorPalette, type Rgb, rgbToHex } from './color'

const SAMPLE_SIZE = 48
const MAX_CLUSTERS = 6

interface Cluster {
  center: Rgb
  weight: number
}

function distanceSq(a: Rgb, b: Rgb): number {
  const dr = a.r - b.r
  const dg = a.g - b.g
  const db = a.b - b.b
  return dr * dr + dg * dg + db * db
}

/** 轻量 k-means：固定种子（按亮度分位取点），保证同样输入得到同样输出 */
export function quantize(pixels: Rgb[], k = MAX_CLUSTERS): Cluster[] {
  if (pixels.length === 0) return []
  const sorted = [...pixels].sort((a, b) => a.r + a.g + a.b - (b.r + b.g + b.b))
  const clusters: Cluster[] = []
  for (let i = 0; i < k; i++) {
    const idx = Math.floor(((i + 0.5) / k) * sorted.length)
    clusters.push({ center: { ...sorted[idx] }, weight: 0 })
  }

  for (let iter = 0; iter < 8; iter++) {
    const sums = clusters.map(() => ({ r: 0, g: 0, b: 0, n: 0 }))
    for (const px of pixels) {
      let best = 0
      let bestDist = Infinity
      for (let i = 0; i < clusters.length; i++) {
        const d = distanceSq(px, clusters[i].center)
        if (d < bestDist) {
          bestDist = d
          best = i
        }
      }
      sums[best].r += px.r
      sums[best].g += px.g
      sums[best].b += px.b
      sums[best].n += 1
    }
    for (let i = 0; i < clusters.length; i++) {
      const s = sums[i]
      if (s.n === 0) continue
      clusters[i] = { center: { r: s.r / s.n, g: s.g / s.n, b: s.b / s.n }, weight: s.n }
    }
  }

  return clusters
    .filter((c) => c.weight > 0)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, k)
}

/**
 * 从图片 URL 提取候选调色板。
 * 返回按"推荐度"排序的调色板（最多 4 个），第一个最推荐。
 */
export async function palettesFromImageUrl(
  url: string,
  opts: { dark?: boolean; strength?: number } = {}
): Promise<ColorPalette[]> {
  if (typeof document === 'undefined') return []
  const img = await loadImage(url)
  const canvas = document.createElement('canvas')
  canvas.width = SAMPLE_SIZE
  canvas.height = SAMPLE_SIZE
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return []
  ctx.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE)
  let data: Uint8ClampedArray
  try {
    data = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data
  } catch {
    // 跨域图片会抛 SecurityError；本地 object URL 不会
    return []
  }

  const pixels: Rgb[] = []
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3]
    if (a < 128) continue
    pixels.push({ r: data[i], g: data[i + 1], b: data[i + 2] })
  }
  if (pixels.length === 0) return []

  const clusters = quantize(pixels)
  // 均值决定深色/浅色
  const avgLum =
    pixels.reduce((sum, p) => sum + (p.r + p.g + p.b) / 3, 0) / pixels.length / 255
  const dark = opts.dark ?? avgLum < 0.45

  const seeds = clusters
    .map((c) => rgbToHex(c.center))
    .filter((hex) => scoreSeed(hex) >= 0)
    .sort((a, b) => scoreSeed(b) - scoreSeed(a))
    .slice(0, 4)

  // 去重：色相太接近的只留一个
  const unique: string[] = []
  for (const hex of seeds) {
    const rgb = hexToRgbSafe(hex)
    if (!rgb) continue
    const h = rgbToOklch(rgb).h
    const tooClose = unique.some((u) => {
      const urgb = hexToRgbSafe(u)
      if (!urgb) return false
      const uh = rgbToOklch(urgb).h
      let d = Math.abs(h - uh)
      if (d > 180) d = 360 - d
      return d < 24
    })
    if (!tooClose) unique.push(hex)
  }

  return unique.map((hex) => buildPalette(hex, opts.strength ?? 60, dark))
}

function hexToRgbSafe(hex: string): Rgb | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex)
  if (!m) return null
  const v = m[1]
  return {
    r: parseInt(v.slice(0, 2), 16),
    g: parseInt(v.slice(2, 4), 16),
    b: parseInt(v.slice(4, 6), 16),
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('图片加载失败'))
    img.src = url
  })
}

/** 内置 SVG 场景取色：把 SVG 序列化后画到 canvas（同源，可读像素） */
export async function palettesFromSvg(svgMarkup: string, opts: { dark?: boolean } = {}) {
  const blob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  try {
    return await palettesFromImageUrl(url, opts)
  } catch {
    return []
  } finally {
    URL.revokeObjectURL(url)
  }
}
