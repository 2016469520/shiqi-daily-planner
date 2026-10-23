// ============================================================
// 暗格 Dark Bento · 深色质感背景（3 张）
//
// 纯程序化 SVG：不引用外部资源，不使用位图、文本节点、外嵌 HTML，
// 也不使用 hooks / 随机数 / 滤镜。所有散点由整数散列生成，
// 同一次构建在服务端与浏览器输出完全一致。
//
// 三张只服务深色主题，共同规则：
// - 底色固定 #0a0c11 一档，局部只加 ≤0.10 的彩色径向光；
// - 亮部只有细线、微粒和 1px 边缘，任何亮面都不超过画面的 15%；
// - 光晕一律用 radialGradient，不做整屏模糊。
// ============================================================

import type { SceneArt, SceneArtProps } from './types'

// ------------------------------------------------------------
// 工具（模块级纯函数，输出确定）
// ------------------------------------------------------------

/** 用一条 path 承载整张网格：横竖线合并，省下大量元素 */
function buildGrid(step: number): string {
  const parts: string[] = []
  for (let x = 0; x <= 1440; x += step) parts.push(`M${x} 0V900`)
  for (let y = 0; y <= 900; y += step) parts.push(`M0 ${y}H1440`)
  return parts.join(' ')
}

/**
 * 整数散列 → [0,1)。
 * 用来铺微粒的位置，替代随机数：相同种子永远得到同一点，
 * 避免服务端与客户端渲染出不同的画面。
 */
function hash01(seed: number): number {
  let x = (seed + 0x9e3779b9) | 0
  x = Math.imul(x ^ (x >>> 16), 0x21f0aaad)
  x = Math.imul(x ^ (x >>> 15), 0x735a2d97)
  x = (x ^ (x >>> 15)) >>> 0
  return x / 4294967296
}

interface Grain {
  x: number
  y: number
  size: number
  opacity: number
  fill: string
}

/** 均匀散布的微粒：位置取整，透明度压到 0.02–0.11 */
function makeGrain(
  count: number,
  seed: number,
  colors: readonly string[],
  minOpacity: number,
  maxOpacity: number,
  maxSize: number,
  yFrom = 0,
  yTo = 900,
): Grain[] {
  const grains: Grain[] = []
  for (let i = 0; i < count; i += 1) {
    const base = seed + i * 977
    const x = Math.round(hash01(base) * 1440)
    const y = Math.round(yFrom + hash01(base + 1) * (yTo - yFrom))
    const size = 1 + Math.floor(hash01(base + 2) * maxSize)
    const opacity = Number((minOpacity + hash01(base + 3) * (maxOpacity - minOpacity)).toFixed(3))
    const fill = colors[Math.floor(hash01(base + 4) * colors.length)]
    grains.push({ x, y, size, opacity, fill })
  }
  return grains
}

/** 沿斜向柔光分布的微粒：让光带里有被照亮的浮尘，而不是一层糊 */
function makeBeamGrain(count: number, seed: number, colors: readonly string[]): Grain[] {
  const grains: Grain[] = []
  for (let i = 0; i < count; i += 1) {
    const base = seed + i * 613
    const x = Math.round(hash01(base) * 1440)
    const drift = (hash01(base + 1) - 0.5) * 220
    const y = Math.round(452 - 0.49 * (x - 720) + drift)
    const size = 1 + Math.floor(hash01(base + 2) * 3)
    const opacity = Number((0.035 + hash01(base + 3) * 0.085).toFixed(3))
    const fill = colors[Math.floor(hash01(base + 4) * colors.length)]
    grains.push({ x, y, size, opacity, fill })
  }
  return grains
}

interface OceanDot {
  cx: number
  cy: number
  r: number
  opacity: number
  fill: string
}

// 网格：32px 细格 + 128px 主格
const MESH_GRID_MINOR = buildGrid(32)
const MESH_GRID_MAJOR = buildGrid(128)

// 噪点：冷白为主，少量冰蓝，极少数暖金呼应右上光
const MESH_GRAIN_COLORS = ['#e6edf7', '#e6edf7', '#dbe4f0', '#c3cede', '#7dd3fc', '#f59e0b'] as const
const GRAIN_COLORS = [
  '#e6edf7',
  '#e6edf7',
  '#e6edf7',
  '#e6edf7',
  '#dbe4f0',
  '#dbe4f0',
  '#cdd8e8',
  '#cdd8e8',
  '#7dd3fc',
  '#7dd3fc',
  '#f59e0b',
  '#b9c6d8',
] as const

const MESH_GRAIN = makeGrain(96, 1101, MESH_GRAIN_COLORS, 0.02, 0.075, 2)
const GRAIN_DUST: readonly Grain[] = [
  ...makeGrain(92, 5101, GRAIN_COLORS, 0.03, 0.11, 3),
  ...makeBeamGrain(96, 7301, GRAIN_COLORS),
]

// 洋流里的浮游微粒：贴着三条流带分布
const OCEAN_DOT_COLORS = ['#7dd3fc', '#a5f3fc', '#e0f2fe'] as const
const OCEAN_BAND_CENTERS = [324, 452, 618] as const
const OCEAN_DOTS: readonly OceanDot[] = Array.from({ length: 30 }, (_, i) => {
  const base = 4001 + i * 331
  const bandCenter = OCEAN_BAND_CENTERS[i % 3]
  return {
    cx: Math.round(hash01(base) * 1440),
    cy: Math.round(bandCenter + (hash01(base + 1) - 0.5) * 170),
    r: Number((0.7 + hash01(base + 2) * 1.1).toFixed(2)),
    opacity: Number((0.1 + hash01(base + 3) * 0.24).toFixed(3)),
    fill: OCEAN_DOT_COLORS[i % 3],
  }
})

// ------------------------------------------------------------
// 三张场景
// ------------------------------------------------------------

export const BENTO_SCENES: Record<string, SceneArt> = {
  // 1 · 暗金网格：近黑底 + 32px 网格 + 右上暖金 / 左下冰蓝
  'bento-mesh': ({ className }: SceneArtProps) => (
    <svg
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="bt-mesh-base" x1="0" y1="0" x2="0.9" y2="1">
          <stop offset="0" stopColor="#0b0e14" />
          <stop offset="0.5" stopColor="#0a0c11" />
          <stop offset="1" stopColor="#080a0f" />
        </linearGradient>
        <linearGradient id="bt-mesh-wash" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7dd3fc" stopOpacity="0.035" />
          <stop offset="0.45" stopColor="#7dd3fc" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="bt-mesh-center" gradientUnits="userSpaceOnUse" cx="720" cy="470" r="720">
          <stop offset="0" stopColor="#7dd3fc" stopOpacity="0.03" />
          <stop offset="1" stopColor="#7dd3fc" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="bt-mesh-gold" gradientUnits="userSpaceOnUse" cx="1180" cy="80" r="620">
          <stop offset="0" stopColor="#f59e0b" stopOpacity="0.1" />
          <stop offset="0.42" stopColor="#d97706" stopOpacity="0.042" />
          <stop offset="1" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>
        <radialGradient
          id="bt-mesh-gold-core"
          gradientUnits="userSpaceOnUse"
          cx="1250"
          cy="40"
          r="300"
        >
          <stop offset="0" stopColor="#fbbf24" stopOpacity="0.07" />
          <stop offset="0.5" stopColor="#f59e0b" stopOpacity="0.03" />
          <stop offset="1" stopColor="#fbbf24" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="bt-mesh-ice" gradientUnits="userSpaceOnUse" cx="120" cy="830" r="580">
          <stop offset="0" stopColor="#7dd3fc" stopOpacity="0.085" />
          <stop offset="0.45" stopColor="#38bdf8" stopOpacity="0.032" />
          <stop offset="1" stopColor="#38bdf8" stopOpacity="0" />
        </radialGradient>
        <radialGradient
          id="bt-mesh-ice-core"
          gradientUnits="userSpaceOnUse"
          cx="60"
          cy="780"
          r="300"
        >
          <stop offset="0" stopColor="#bae6fd" stopOpacity="0.05" />
          <stop offset="1" stopColor="#bae6fd" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="bt-mesh-grid-fade" x1="1" y1="0" x2="0.05" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="0.55" stopColor="#ffffff" stopOpacity="0.72" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.42" />
        </linearGradient>
        <mask id="bt-mesh-grid-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="1440" height="900">
          <rect width="1440" height="900" fill="url(#bt-mesh-grid-fade)" />
        </mask>
        <linearGradient id="bt-mesh-shade" x1="1" y1="0" x2="0.1" y2="1">
          <stop offset="0" stopColor="#04060a" stopOpacity="0" />
          <stop offset="0.62" stopColor="#04060a" stopOpacity="0.18" />
          <stop offset="1" stopColor="#04060a" stopOpacity="0.55" />
        </linearGradient>
        <radialGradient
          id="bt-mesh-vignette"
          gradientUnits="userSpaceOnUse"
          cx="760"
          cy="420"
          r="880"
        >
          <stop offset="0.48" stopColor="#04060a" stopOpacity="0" />
          <stop offset="1" stopColor="#04060a" stopOpacity="0.5" />
        </radialGradient>
        <linearGradient id="bt-mesh-topline" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="0.55" stopColor="#ffffff" stopOpacity="0.05" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* 底色：近黑偏蓝，右下再深一档 */}
      <rect width="1440" height="900" fill="url(#bt-mesh-base)" />

      {/* 中部极淡冷光 + 顶部一层冷白，让黑不是一块死板 */}
      <rect width="1440" height="900" fill="url(#bt-mesh-center)" />
      <rect width="1440" height="900" fill="url(#bt-mesh-wash)" />

      {/* 右上暖金：外层铺开，内层做核 */}
      <rect width="1440" height="900" fill="url(#bt-mesh-gold)" />
      <rect width="1440" height="900" fill="url(#bt-mesh-gold-core)" />

      {/* 左下冰蓝冷光，透明度压到 0.085 */}
      <rect width="1440" height="900" fill="url(#bt-mesh-ice)" />
      <rect width="1440" height="900" fill="url(#bt-mesh-ice-core)" />

      {/* 32px 网格：靠近右上光处更亮，左下渐隐 */}
      <g mask="url(#bt-mesh-grid-mask)">
        <path
          d={MESH_GRID_MINOR}
          fill="none"
          stroke="#cfd8e6"
          strokeOpacity="0.045"
          strokeWidth="1"
        />
        <path d={MESH_GRID_MAJOR} fill="none" stroke="#e8eef7" strokeOpacity="0.05" strokeWidth="1" />
      </g>

      {/* 两块极淡的模块轮廓，呼应"暗格"：只描边，不填色 */}
      <g fill="none" stroke="#ffffff" strokeOpacity="0.045">
        <rect x="96" y="96" width="352" height="224" rx="16" />
        <rect x="1056" y="576" width="288" height="192" rx="16" />
      </g>

      {/* 左下压暗，拉开明暗对角 */}
      <rect width="1440" height="900" fill="url(#bt-mesh-shade)" />
      <rect width="1440" height="1" fill="url(#bt-mesh-topline)" />

      {/* 暖光里的浮尘 */}
      <g fill="#fbbf24">
        <circle cx="1042" cy="128" r="1.4" opacity="0.28" />
        <circle cx="1128" cy="86" r="1" opacity="0.22" />
        <circle cx="1256" cy="150" r="1.8" opacity="0.2" />
        <circle cx="1332" cy="64" r="1.1" opacity="0.26" />
        <circle cx="988" cy="236" r="1" opacity="0.16" />
        <circle cx="1194" cy="248" r="1.6" opacity="0.14" />
        <circle cx="1380" cy="196" r="1.2" opacity="0.18" />
        <circle cx="866" cy="120" r="1" opacity="0.12" />
      </g>

      {/* 稀疏噪点：1–2px 半透明小方块，用 crispEdges 保持锐利 */}
      <g shapeRendering="crispEdges">
        {MESH_GRAIN.map((g, i) => (
          <rect
            key={i}
            x={g.x}
            y={g.y}
            width={g.size}
            height={g.size}
            fill={g.fill}
            opacity={g.opacity}
          />
        ))}
      </g>

      <rect width="1440" height="900" fill="url(#bt-mesh-vignette)" />
    </svg>
  ),

  // 2 · 深蓝洋流：深蓝→墨黑，三条平行层流，右下一点极淡的光
  'bento-ocean': ({ className }: SceneArtProps) => (
    <svg
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="bt-ocean-base" x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0" stopColor="#0b1728" />
          <stop offset="0.45" stopColor="#081120" />
          <stop offset="1" stopColor="#05080f" />
        </linearGradient>
        <radialGradient id="bt-ocean-top" gradientUnits="userSpaceOnUse" cx="720" cy="-140" r="820">
          <stop offset="0" stopColor="#0ea5e9" stopOpacity="0.075" />
          <stop offset="0.5" stopColor="#0284c7" stopOpacity="0.025" />
          <stop offset="1" stopColor="#0ea5e9" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="bt-ocean-surface" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#7dd3fc" stopOpacity="0" />
          <stop offset="0.35" stopColor="#7dd3fc" stopOpacity="0.05" />
          <stop offset="0.55" stopColor="#bae6fd" stopOpacity="0.07" />
          <stop offset="0.8" stopColor="#7dd3fc" stopOpacity="0.028" />
          <stop offset="1" stopColor="#7dd3fc" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="bt-ocean-band" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#0ea5e9" stopOpacity="0" />
          <stop offset="0.18" stopColor="#0ea5e9" stopOpacity="0.045" />
          <stop offset="0.5" stopColor="#38bdf8" stopOpacity="0.08" />
          <stop offset="0.82" stopColor="#0ea5e9" stopOpacity="0.04" />
          <stop offset="1" stopColor="#0ea5e9" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="bt-ocean-edge" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#7dd3fc" stopOpacity="0" />
          <stop offset="0.16" stopColor="#7dd3fc" stopOpacity="0.1" />
          <stop offset="0.48" stopColor="#a5f3fc" stopOpacity="0.24" />
          <stop offset="0.8" stopColor="#7dd3fc" stopOpacity="0.09" />
          <stop offset="1" stopColor="#7dd3fc" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="bt-ocean-bokeh" gradientUnits="userSpaceOnUse" cx="420" cy="770" r="95">
          <stop offset="0" stopColor="#38bdf8" stopOpacity="0.055" />
          <stop offset="1" stopColor="#38bdf8" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="bt-ocean-glow" gradientUnits="userSpaceOnUse" cx="1270" cy="850" r="350">
          <stop offset="0" stopColor="#38bdf8" stopOpacity="0.085" />
          <stop offset="0.5" stopColor="#0ea5e9" stopOpacity="0.03" />
          <stop offset="1" stopColor="#0ea5e9" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="bt-ocean-deep" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.5" stopColor="#04070d" stopOpacity="0" />
          <stop offset="1" stopColor="#04070d" stopOpacity="0.55" />
        </linearGradient>
        <radialGradient
          id="bt-ocean-vignette"
          gradientUnits="userSpaceOnUse"
          cx="740"
          cy="380"
          r="900"
        >
          <stop offset="0.48" stopColor="#03060c" stopOpacity="0" />
          <stop offset="1" stopColor="#03060c" stopOpacity="0.45" />
        </radialGradient>
      </defs>

      <rect width="1440" height="900" fill="url(#bt-ocean-base)" />
      <rect width="1440" height="900" fill="url(#bt-ocean-top)" />

      {/* 海面透下来的两道光弧 */}
      <path
        d="M 210 -40 C 470 96 760 108 1080 -40"
        fill="none"
        stroke="url(#bt-ocean-surface)"
        strokeWidth="54"
      />
      <path
        d="M 330 -30 C 560 90 800 96 1040 -30"
        fill="none"
        stroke="url(#bt-ocean-surface)"
        strokeWidth="18"
      />

      {/* 深水里的两团虚焦 */}
      <rect width="1440" height="900" fill="url(#bt-ocean-bokeh)" />

      {/* 三条平行层流：宽度不同，起止位置错开 */}
      <path
        d="M -80 342 C 220 288 448 306 664 268 S 1080 168 1520 196"
        fill="none"
        stroke="url(#bt-ocean-band)"
        strokeWidth="104"
        strokeLinecap="round"
      />
      <path
        d="M -80 466 C 236 414 470 442 726 398 S 1140 296 1520 326"
        fill="none"
        stroke="url(#bt-ocean-band)"
        strokeWidth="66"
        strokeLinecap="round"
      />
      <path
        d="M -80 652 C 250 604 520 646 828 592 S 1200 494 1520 518"
        fill="none"
        stroke="url(#bt-ocean-band)"
        strokeWidth="146"
        strokeLinecap="round"
      />
      <path
        d="M -80 402 C 210 350 460 366 700 322 S 1130 226 1520 254"
        fill="none"
        stroke="url(#bt-ocean-band)"
        strokeWidth="26"
        strokeLinecap="round"
      />

      {/* 流带的上缘细光：只 1–1.6px，负责勾出层流的边 */}
      <path
        d="M -60 290 C 220 248 448 258 660 222 S 1080 124 1500 150"
        fill="none"
        stroke="url(#bt-ocean-edge)"
        strokeWidth="1.2"
      />
      <path
        d="M -60 428 C 236 386 470 408 726 366 S 1140 268 1500 294"
        fill="none"
        stroke="url(#bt-ocean-edge)"
        strokeWidth="1"
      />
      <path
        d="M -60 579 C 250 531 520 573 828 519 S 1200 421 1500 445"
        fill="none"
        stroke="url(#bt-ocean-edge)"
        strokeWidth="1.6"
      />

      {/* 流带之间的细丝 */}
      <path
        d="M 40 512 C 330 458 620 494 880 442 S 1290 350 1440 362"
        fill="none"
        stroke="#7dd3fc"
        strokeOpacity="0.07"
        strokeWidth="0.8"
      />
      <path
        d="M 220 706 C 460 660 720 694 960 646 S 1330 566 1460 578"
        fill="none"
        stroke="#7dd3fc"
        strokeOpacity="0.05"
        strokeWidth="0.8"
      />
      <path
        d="M 760 236 C 980 208 1160 190 1380 196"
        fill="none"
        stroke="#a5f3fc"
        strokeOpacity="0.06"
        strokeWidth="0.8"
      />

      {/* 浮游微粒：贴着流带分布 */}
      <g>
        {OCEAN_DOTS.map((d, i) => (
          <circle key={i} cx={d.cx} cy={d.cy} r={d.r} fill={d.fill} opacity={d.opacity} />
        ))}
      </g>

      {/* 右下角一点点光，几乎只是提亮 */}
      <rect width="1440" height="900" fill="url(#bt-ocean-glow)" />

      {/* 深海压暗 + 暗角 */}
      <rect width="1440" height="900" fill="url(#bt-ocean-deep)" />
      <rect width="1440" height="900" fill="url(#bt-ocean-vignette)" />
    </svg>
  ),

  // 3 · 颗粒渐变：#0a0c11→#121826 对角渐变 + 斜向柔光 + 细颗粒
  'bento-grain': ({ className }: SceneArtProps) => (
    <svg
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="bt-grain-base" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0a0c11" />
          <stop offset="0.52" stopColor="#0e121b" />
          <stop offset="1" stopColor="#121826" />
        </linearGradient>
        <radialGradient id="bt-grain-cool" gradientUnits="userSpaceOnUse" cx="1010" cy="160" r="640">
          <stop offset="0" stopColor="#7dd3fc" stopOpacity="0.06" />
          <stop offset="0.5" stopColor="#38bdf8" stopOpacity="0.022" />
          <stop offset="1" stopColor="#38bdf8" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="bt-grain-beam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7dd3fc" stopOpacity="0" />
          <stop offset="0.3" stopColor="#7dd3fc" stopOpacity="0.012" />
          <stop offset="0.44" stopColor="#7dd3fc" stopOpacity="0.034" />
          <stop offset="0.5" stopColor="#e2f0ff" stopOpacity="0.052" />
          <stop offset="0.56" stopColor="#7dd3fc" stopOpacity="0.028" />
          <stop offset="0.72" stopColor="#7dd3fc" stopOpacity="0.01" />
          <stop offset="1" stopColor="#7dd3fc" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="bt-grain-beam-echo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7dd3fc" stopOpacity="0" />
          <stop offset="0.5" stopColor="#bae6fd" stopOpacity="0.032" />
          <stop offset="1" stopColor="#7dd3fc" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="bt-grain-shade" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#05070b" stopOpacity="0.45" />
          <stop offset="0.45" stopColor="#05070b" stopOpacity="0.12" />
          <stop offset="1" stopColor="#05070b" stopOpacity="0" />
        </linearGradient>
        <radialGradient
          id="bt-grain-vignette"
          gradientUnits="userSpaceOnUse"
          cx="760"
          cy="430"
          r="880"
        >
          <stop offset="0.45" stopColor="#04060a" stopOpacity="0" />
          <stop offset="1" stopColor="#04060a" stopOpacity="0.5" />
        </radialGradient>
        <linearGradient id="bt-grain-topline" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.04" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect width="1440" height="900" fill="url(#bt-grain-base)" />
      <rect width="1440" height="900" fill="url(#bt-grain-cool)" />

      {/* 一条主柔光 + 两条回声，整组旋转 24°，斜穿画面 */}
      <g transform="rotate(-24 720 450)">
        <rect x="-460" y="300" width="2420" height="220" fill="url(#bt-grain-beam)" />
        <rect x="-460" y="409" width="2420" height="1.2" fill="#e6f2ff" opacity="0.05" />
        <rect x="-460" y="600" width="2420" height="90" fill="url(#bt-grain-beam-echo)" />
        <rect
          x="-460"
          y="182"
          width="2420"
          height="26"
          fill="url(#bt-grain-beam-echo)"
          opacity="0.7"
        />
      </g>

      {/* 颗粒：一半均匀、一半沿斜光分布，全部 ≤3px */}
      <g shapeRendering="crispEdges">
        {GRAIN_DUST.map((g, i) => (
          <rect
            key={i}
            x={g.x}
            y={g.y}
            width={g.size}
            height={g.size}
            fill={g.fill}
            opacity={g.opacity}
          />
        ))}
      </g>

      {/* 左上压暗，避免对角渐变发平 */}
      <rect width="1440" height="900" fill="url(#bt-grain-shade)" />
      <rect width="1440" height="1" fill="url(#bt-grain-topline)" />
      <rect width="1440" height="900" fill="url(#bt-grain-vignette)" />
    </svg>
  ),
}
