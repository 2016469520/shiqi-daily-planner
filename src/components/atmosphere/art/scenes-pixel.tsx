// ============================================================
// 像素机主题 · 原创像素场景
// ------------------------------------------------------------
// 三张 8-bit 场景全部由整数网格上的 <rect> 堆出来：没有 stroke 细线、
// 没有渐变、没有外部资源。场景内部坐标系是 240 × 150
// （1 单位 = 6px，整体 scale(6) 铺满 1440 × 900），
// 配合 shapeRendering="crispEdges"，放大后依然是硬边像素块。
// ============================================================

import type { SceneArt } from './types'

interface Band {
  y: number
  h: number
  c: string
}

interface Star {
  x: number
  y: number
  c: string
}

// ------------------------------------------------------------
// 场景 1 · 像素小镇（黄昏广场，中调）
// ------------------------------------------------------------

const TOWN_SKY: Band[] = [
  { y: 0, h: 34, c: '#232345' },
  { y: 34, h: 18, c: '#2b2a5a' },
  { y: 52, h: 12, c: '#3a3166' },
  { y: 64, h: 8, c: '#5b3a70' },
  { y: 72, h: 10, c: '#a84460' }, // 晚霞色带 1
  { y: 82, h: 10, c: '#f2915a' }, // 晚霞色带 2
  { y: 92, h: 6, c: '#ffd79a' }, // 地平线余晖
]

const TOWN_STARS: Star[] = [
  { x: 14, y: 12, c: '#f4f1ea' },
  { x: 36, y: 26, c: '#ffe9a8' },
  { x: 58, y: 8, c: '#f4f1ea' },
  { x: 84, y: 22, c: '#f4f1ea' },
  { x: 150, y: 10, c: '#ffe9a8' },
  { x: 176, y: 16, c: '#f4f1ea' },
  { x: 206, y: 8, c: '#bfe3ff' },
  { x: 228, y: 28, c: '#f4f1ea' },
  { x: 44, y: 50, c: '#f4f1ea' },
  { x: 198, y: 50, c: '#ffe9a8' },
]

const TOWN_TWINKLES: Star[] = [
  { x: 24, y: 8, c: '#f4f1ea' },
  { x: 52, y: 34, c: '#f4f1ea' },
  { x: 72, y: 20, c: '#bfe3ff' },
  { x: 96, y: 12, c: '#f4f1ea' },
  { x: 124, y: 8, c: '#f4f1ea' },
  { x: 140, y: 32, c: '#ffe9a8' },
  { x: 164, y: 28, c: '#f4f1ea' },
  { x: 186, y: 38, c: '#f4f1ea' },
  { x: 216, y: 16, c: '#f4f1ea' },
  { x: 232, y: 44, c: '#f4f1ea' },
  { x: 8, y: 36, c: '#f4f1ea' },
  { x: 68, y: 42, c: '#f4f1ea' },
  { x: 108, y: 44, c: '#bfe3ff' },
  { x: 132, y: 18, c: '#f4f1ea' },
]

// 远山：所有山体都压在同一条地平线 y = 98 上
const TOWN_HILLS: ReadonlyArray<readonly [number, number, number, number]> = [
  [0, 94, 240, 4],
  [4, 91, 26, 7],
  [38, 92, 20, 6],
  [60, 89, 26, 9],
  [96, 93, 24, 5],
  [128, 90, 22, 8],
  [162, 92, 20, 6],
  [186, 89, 26, 9],
  [216, 91, 20, 7],
]

// 广场石板路：越靠近镜头越宽，一行行错开
const TOWN_PATH: ReadonlyArray<readonly [number, number, number, number]> = [
  [104, 98, 32, 6],
  [96, 104, 48, 6],
  [86, 110, 68, 6],
  [74, 116, 92, 6],
  [62, 122, 116, 6],
  [48, 128, 144, 6],
  [32, 134, 176, 6],
  [14, 140, 212, 5],
  [0, 145, 240, 5],
]

const TOWN_PATH_LIGHT: ReadonlyArray<readonly [number, number, number, number]> = [
  [108, 104, 24, 6],
  [98, 110, 44, 6],
  [86, 116, 68, 6],
  [74, 122, 92, 6],
  [60, 128, 120, 6],
  [44, 134, 152, 6],
  [26, 140, 188, 5],
  [8, 145, 224, 5],
]

const TOWN_JOINTS: ReadonlyArray<readonly [number, number]> = [
  [104, 48],
  [110, 68],
  [116, 92],
  [122, 116],
  [128, 144],
  [134, 176],
  [140, 212],
  [145, 240],
]

const TOWN_SEAMS: ReadonlyArray<readonly [number, number]> = [
  [86, 116],
  [138, 116],
  [112, 104],
  [128, 110],
  [104, 116],
  [126, 116],
  [96, 122],
  [140, 122],
  [70, 122],
  [118, 122],
  [92, 128],
  [150, 128],
  [60, 134],
  [130, 134],
  [198, 134],
  [42, 140],
  [108, 140],
  [176, 140],
]

/** 亮灯的窗户：3 个像素块（墨框 / 窗光 / 高光） */
function TownWindow({ x, y, lit = true }: { x: number; y: number; lit?: boolean }) {
  return (
    <>
      <rect x={x} y={y} width={10} height={10} fill="#1a1c2c" />
      <rect x={x + 1} y={y + 1} width={8} height={8} fill={lit ? '#ffcd75' : '#2a2850'} />
      <rect x={x + 2} y={y + 2} width={3} height={3} fill={lit ? '#fff0bf' : '#3a3768'} />
    </>
  )
}

// ------------------------------------------------------------
// 场景 2 · 像素森林（深绿，深调）
// ------------------------------------------------------------

const FOREST_SKY: Band[] = [
  { y: 0, h: 34, c: '#0e2b1e' },
  { y: 34, h: 18, c: '#123122' },
  { y: 52, h: 16, c: '#173a28' },
  { y: 68, h: 12, c: '#1d4630' },
  { y: 80, h: 10, c: '#245436' },
  { y: 90, h: 10, c: '#2f6b45' }, // 林间天光
]

const FOREST_GROUND: Band[] = [
  { y: 98, h: 10, c: '#16402a' },
  { y: 108, h: 10, c: '#0f3120' },
  { y: 118, h: 14, c: '#0a2416' },
  { y: 132, h: 18, c: '#061a10' },
]

// 远处林线：一条低矮的深绿带 + 几簇尖顶，雾一盖就有纵深
const FOREST_WALL: ReadonlyArray<readonly [number, number, number, number]> = [
  [0, 86, 240, 14],
  [6, 82, 26, 4],
  [14, 79, 12, 3],
  [40, 84, 22, 2],
  [46, 82, 10, 2],
  [70, 80, 30, 6],
  [80, 77, 12, 3],
  [104, 83, 24, 3],
  [112, 80, 10, 3],
  [134, 81, 28, 5],
  [144, 78, 12, 3],
  [166, 84, 20, 2],
  [172, 82, 8, 2],
  [192, 82, 26, 4],
  [200, 79, 12, 3],
  [220, 84, 20, 2],
  [226, 82, 8, 2],
]

// 云杉模板：一列宽窄交替的像素行堆出锯齿轮廓，近大远小共用
const PINE_ROWS: ReadonlyArray<readonly [number, number]> = [
  [-18, 24],
  [-21, 18],
  [-24, 22],
  [-27, 16],
  [-30, 18],
  [-33, 12],
  [-36, 14],
  [-39, 8],
  [-42, 10],
  [-45, 4],
]

// 受光面贴着轮廓左缘，勾出树形
const PINE_LIGHT: ReadonlyArray<readonly [number, number, number, number]> = [
  [-12, -18, 4, 3],
  [-11, -24, 3, 3],
  [-7, -36, 3, 3],
  [-5, -42, 3, 3],
  [-2, -45, 4, 3],
]

interface ForestTreeProps {
  x: number
  ground: number
  scale: number
  flip?: boolean
  trunk: string
  bark: string
  canopy: string
  light: string
  opacity?: number
}

interface TreePlace {
  x: number
  ground: number
  scale: number
  flip?: boolean
}

/** 一棵云杉：细树干 + 十行锯齿树冠 + 左缘受光面，全部落在整数网格上 */
function ForestTree({
  x,
  ground,
  scale,
  flip = false,
  trunk,
  bark,
  canopy,
  light,
  opacity = 1,
}: ForestTreeProps) {
  return (
    <g
      transform={`translate(${x} ${ground}) scale(${flip ? -scale : scale} ${scale})`}
      opacity={opacity}
    >
      <rect x={-1} y={-20} width={2} height={20} fill={trunk} />
      <rect x={-1} y={-20} width={1} height={20} fill={bark} />
      <rect x={-2} y={-2} width={4} height={2} fill={trunk} />
      {PINE_ROWS.map(([dy, w], i) => (
        <rect key={`r${i}`} x={-w / 2} y={dy} width={w} height={3} fill={canopy} />
      ))}
      {PINE_LIGHT.map(([dx, dy, w, h], i) => (
        <rect key={`l${i}`} x={dx} y={dy} width={w} height={h} fill={light} />
      ))}
    </g>
  )
}

const FOREST_FAR_TREES = [16, 46, 78, 116, 160, 200, 228]
const FOREST_MID_TREES: TreePlace[] = [
  { x: 28, ground: 118, scale: 2 },
  { x: 74, ground: 118, scale: 2 },
  { x: 190, ground: 116, scale: 2 },
]

const FOREST_PATH: ReadonlyArray<readonly [number, number, number, number]> = [
  [106, 100, 12, 6],
  [104, 106, 14, 6],
  [100, 112, 16, 6],
  [96, 118, 18, 6],
  [92, 124, 20, 7],
  [88, 131, 22, 7],
  [84, 138, 26, 7],
  [80, 145, 28, 5],
]

interface Beam {
  x: number
  y: number
  dx: number
  w: number
  h: number
  n: number
  o: number
  c: string
}

// 斜光条：用一列阶梯状像素块堆出斜线，不用 stroke
const FOREST_BEAMS: Beam[] = [
  { x: 190, y: -8, dx: -6, w: 16, h: 8, n: 14, o: 0.1, c: '#b9f5a0' },
  { x: 132, y: -20, dx: -5, w: 9, h: 9, n: 9, o: 0.07, c: '#d6ffb0' },
  { x: 232, y: 0, dx: -9, w: 12, h: 8, n: 8, o: 0.08, c: '#b9f5a0' },
]

const FOREST_FIREFLIES = [
  { x: 46, y: 120 },
  { x: 70, y: 132 },
  { x: 96, y: 108 },
  { x: 120, y: 124 },
  { x: 148, y: 116 },
  { x: 170, y: 132 },
  { x: 192, y: 120 },
  { x: 58, y: 96 },
  { x: 154, y: 94 },
  { x: 206, y: 104 },
  { x: 86, y: 140 },
  { x: 134, y: 142 },
  { x: 178, y: 106 },
  { x: 64, y: 84 },
]

const FOREST_TUFTS: ReadonlyArray<readonly [number, number]> = [
  [22, 146],
  [44, 146],
  [196, 144],
  [222, 144],
  [30, 120],
  [212, 116],
  [90, 124],
  [114, 132],
]

/** 蘑菇：红伞 + 米白斑点 + 米白柄 */
function Mushroom({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={0} y={0} width={8} height={3} fill="#c9463c" />
      <rect x={1} y={3} width={6} height={1} fill="#8e2f30" />
      <rect x={3} y={4} width={2} height={4} fill="#e8dcc0" />
      <rect x={1} y={0} width={2} height={1} fill="#f4f1ea" />
      <rect x={5} y={1} width={1} height={1} fill="#f4f1ea" />
    </g>
  )
}

// ------------------------------------------------------------
// 场景 3 · 像素夜空（八位机星空，深调）
// ------------------------------------------------------------

const SKY_BANDS: Band[] = [
  { y: 0, h: 30, c: '#08081a' },
  { y: 30, h: 24, c: '#0d0d28' },
  { y: 54, h: 22, c: '#141336' },
  { y: 76, h: 20, c: '#1b1745' },
  { y: 96, h: 16, c: '#241d52' },
  { y: 112, h: 14, c: '#2c235c' },
]

// 大星 = 2 × 2 的正方形（四像素）
const SKY_STARS_BIG: Star[] = [
  { x: 14, y: 10, c: '#f4f1ea' },
  { x: 38, y: 24, c: '#ffe9a8' },
  { x: 60, y: 6, c: '#f4f1ea' },
  { x: 84, y: 34, c: '#f4f1ea' },
  { x: 112, y: 12, c: '#bfe3ff' },
  { x: 142, y: 22, c: '#f4f1ea' },
  { x: 166, y: 48, c: '#ffe9a8' },
  { x: 210, y: 14, c: '#f4f1ea' },
  { x: 228, y: 30, c: '#f4f1ea' },
  { x: 24, y: 46, c: '#f4f1ea' },
  { x: 58, y: 56, c: '#ffe9a8' },
  { x: 98, y: 52, c: '#f4f1ea' },
  { x: 126, y: 44, c: '#bfe3ff' },
  { x: 154, y: 66, c: '#f4f1ea' },
  { x: 202, y: 62, c: '#f4f1ea' },
  { x: 226, y: 86, c: '#ffe9a8' },
]

// 小星 = 1 × 1 的方块
const SKY_STARS_SMALL: Star[] = [
  { x: 8, y: 22, c: '#f4f1ea' },
  { x: 20, y: 30, c: '#bfe3ff' },
  { x: 30, y: 12, c: '#f4f1ea' },
  { x: 46, y: 8, c: '#f4f1ea' },
  { x: 52, y: 40, c: '#ffe9a8' },
  { x: 66, y: 30, c: '#f4f1ea' },
  { x: 74, y: 18, c: '#f4f1ea' },
  { x: 90, y: 8, c: '#bfe3ff' },
  { x: 102, y: 30, c: '#f4f1ea' },
  { x: 118, y: 26, c: '#f4f1ea' },
  { x: 130, y: 8, c: '#ffe9a8' },
  { x: 138, y: 56, c: '#f4f1ea' },
  { x: 148, y: 34, c: '#f4f1ea' },
  { x: 158, y: 12, c: '#bfe3ff' },
  { x: 178, y: 58, c: '#f4f1ea' },
  { x: 188, y: 52, c: '#ffe9a8' },
  { x: 196, y: 46, c: '#f4f1ea' },
  { x: 204, y: 34, c: '#f4f1ea' },
  { x: 216, y: 48, c: '#f4f1ea' },
  { x: 234, y: 20, c: '#f4f1ea' },
  { x: 234, y: 60, c: '#bfe3ff' },
  { x: 6, y: 60, c: '#f4f1ea' },
  { x: 16, y: 72, c: '#f4f1ea' },
  { x: 32, y: 64, c: '#ffe9a8' },
  { x: 48, y: 78, c: '#f4f1ea' },
  { x: 62, y: 86, c: '#f4f1ea' },
  { x: 78, y: 74, c: '#bfe3ff' },
  { x: 94, y: 66, c: '#f4f1ea' },
  { x: 108, y: 58, c: '#f4f1ea' },
  { x: 120, y: 72, c: '#f4f1ea' },
  { x: 134, y: 84, c: '#ffe9a8' },
  { x: 146, y: 90, c: '#f4f1ea' },
  { x: 176, y: 80, c: '#f4f1ea' },
  { x: 192, y: 88, c: '#f4f1ea' },
  { x: 214, y: 76, c: '#bfe3ff' },
  { x: 226, y: 68, c: '#f4f1ea' },
  { x: 42, y: 54, c: '#f4f1ea' },
  { x: 68, y: 50, c: '#ffe9a8' },
  { x: 88, y: 90, c: '#f4f1ea' },
  { x: 160, y: 96, c: '#f4f1ea' },
]

// 像素月亮：十三行方块拼出的圆，配五块环形坑
const MOON_ROWS: ReadonlyArray<readonly [number, number, number]> = [
  [182, 13, 8],
  [180, 15, 12],
  [178, 17, 16],
  [176, 19, 20],
  [175, 21, 22],
  [174, 23, 24],
  [174, 25, 24],
  [174, 27, 24],
  [175, 29, 22],
  [176, 31, 20],
  [178, 33, 16],
  [180, 35, 12],
  [182, 37, 8],
]

const MOON_CRATERS: ReadonlyArray<readonly [number, number, number, number]> = [
  [179, 20, 5, 4],
  [187, 27, 6, 5],
  [177, 30, 4, 3],
  [189, 17, 3, 3],
  [184, 24, 3, 3],
]

const MOON_SHADOWS: ReadonlyArray<readonly [number, number, number, number]> = [
  [180, 22, 2, 1],
  [189, 29, 3, 2],
  [178, 31, 2, 1],
]

// 山脊：每座山由自下而上收窄的像素行堆成，行宽为偶数保证坐标对齐
interface SkyPeak {
  x: number
  widths: number[]
}

const SKY_FAR_PEAKS: SkyPeak[] = [
  { x: 16, widths: [64, 54, 44, 34, 22, 10] },
  { x: 72, widths: [56, 46, 36, 26, 14] },
  { x: 124, widths: [68, 58, 48, 38, 28, 18, 8] },
  { x: 180, widths: [60, 50, 40, 30, 16] },
  { x: 228, widths: [64, 54, 44, 34, 22, 10] },
]

const SKY_NEAR_PEAKS: SkyPeak[] = [
  { x: 4, widths: [48, 40, 32, 20] },
  { x: 58, widths: [56, 46, 36, 26, 14] },
  { x: 118, widths: [44, 36, 24] },
  { x: 172, widths: [52, 44, 36, 24] },
  { x: 226, widths: [56, 46, 36, 26, 14] },
]

const SKY_HORIZON_GLOW: Band[] = [
  { y: 120, h: 3, c: '#1c6fb0' },
  { y: 121, h: 1, c: '#29adff' },
  { y: 122, h: 1, c: '#d8f7ff' },
]

const SKY_GROUND: Band[] = [
  { y: 123, h: 4, c: '#0a0a18' },
  { y: 127, h: 10, c: '#07070f' },
  { y: 137, h: 13, c: '#04040a' },
]

const SKY_METEOR: ReadonlyArray<readonly [number, number, number, number, number]> = [
  [62, 30, 2, 2, 1],
  [58, 32, 2, 2, 0.8],
  [54, 34, 2, 1, 0.6],
  [50, 35, 1, 1, 0.4],
  [46, 36, 1, 1, 0.25],
]

// ------------------------------------------------------------
// 导出
// ------------------------------------------------------------

export const PIXEL_SCENES: Record<string, SceneArt> = {
  'pixel-town': ({ className }) => (
    <svg
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden="true"
      shapeRendering="crispEdges"
    >
      <g transform="scale(6)">
        {/* 天空与两道晚霞 */}
        {TOWN_SKY.map((b, i) => (
          <rect key={`sky-${i}`} x={0} y={b.y} width={240} height={b.h} fill={b.c} />
        ))}

        {/* 四像素星星 */}
        {TOWN_STARS.map((s, i) => (
          <rect key={`star-${i}`} x={s.x} y={s.y} width={2} height={2} fill={s.c} />
        ))}
        {TOWN_TWINKLES.map((s, i) => (
          <rect key={`tw-${i}`} x={s.x} y={s.y} width={1} height={1} fill={s.c} opacity={0.7} />
        ))}

        {/* 远山剪影 */}
        {TOWN_HILLS.map(([x, y, w, h], i) => (
          <rect key={`hill-${i}`} x={x} y={y} width={w} height={h} fill="#3a2a50" />
        ))}

        {/* 远处钟楼剪影 */}
        <rect x={80} y={42} width={2} height={4} fill="#241d3d" />
        <rect x={78} y={46} width={6} height={3} fill="#241d3d" />
        <rect x={76} y={49} width={10} height={3} fill="#241d3d" />
        <rect x={74} y={52} width={14} height={46} fill="#2f2750" />
        <rect x={84} y={52} width={4} height={46} fill="#241d3d" />
        <rect x={74} y={52} width={14} height={1} fill="#3b3263" />
        <rect x={76} y={58} width={10} height={10} fill="#241d3d" />
        <rect x={77} y={59} width={8} height={8} fill="#8d7a5a" />
        <rect x={80} y={60} width={1} height={3} fill="#241d3d" />
        <rect x={80} y={62} width={3} height={1} fill="#241d3d" />
        <rect x={78} y={74} width={2} height={6} fill="#1a1630" />
        <rect x={82} y={84} width={2} height={6} fill="#1a1630" />

        {/* 左侧三层小楼 */}
        <rect x={10} y={46} width={6} height={9} fill="#5b2b36" />
        <rect x={9} y={45} width={8} height={2} fill="#3a1e28" />
        <rect x={16} y={52} width={20} height={3} fill="#8c2f3c" />
        <rect x={12} y={55} width={28} height={3} fill="#8c2f3c" />
        <rect x={8} y={58} width={32} height={3} fill="#8c2f3c" />
        <rect x={6} y={61} width={36} height={5} fill="#8c2f3c" />
        <rect x={16} y={52} width={20} height={1} fill="#a83b48" />
        <rect x={6} y={65} width={36} height={1} fill="#1a1c2c" />
        <rect x={6} y={66} width={40} height={32} fill="#d6c3a0" />
        <rect x={34} y={66} width={12} height={32} fill="#bda882" />
        <rect x={6} y={66} width={1} height={32} fill="#1a1c2c" />
        <rect x={45} y={66} width={1} height={32} fill="#1a1c2c" />
        <TownWindow x={11} y={72} />
        <TownWindow x={27} y={72} />
        <TownWindow x={11} y={84} />
        <rect x={21} y={82} width={11} height={16} fill="#1a1c2c" />
        <rect x={22} y={83} width={9} height={15} fill="#8c2f3c" />
        <rect x={23} y={84} width={6} height={2} fill="#a83b48" />
        <rect x={28} y={89} width={2} height={2} fill="#ffcd75" />
        <rect x={20} y={96} width={13} height={2} fill="#8f8470" />

        {/* 左侧二层小楼 */}
        <rect x={58} y={67} width={4} height={3} fill="#3a3f6b" />
        <rect x={55} y={70} width={10} height={3} fill="#3a3f6b" />
        <rect x={52} y={73} width={16} height={4} fill="#3a3f6b" />
        <rect x={58} y={67} width={4} height={1} fill="#4a5084" />
        <rect x={52} y={77} width={18} height={1} fill="#1a1c2c" />
        <rect x={50} y={78} width={20} height={20} fill="#c9b48f" />
        <rect x={64} y={78} width={6} height={20} fill="#b09b78" />
        <rect x={50} y={78} width={1} height={20} fill="#1a1c2c" />
        <rect x={69} y={78} width={1} height={20} fill="#1a1c2c" />
        <TownWindow x={52} y={81} />
        <rect x={62} y={87} width={7} height={11} fill="#1a1c2c" />
        <rect x={63} y={88} width={5} height={10} fill="#1c6fb0" />
        <rect x={66} y={92} width={1} height={2} fill="#ffcd75" />

        {/* 右侧三层小楼 */}
        <rect x={204} y={36} width={6} height={10} fill="#5b2b36" />
        <rect x={203} y={35} width={8} height={2} fill="#3a1e28" />
        <rect x={188} y={43} width={16} height={3} fill="#8c2f3c" />
        <rect x={183} y={46} width={24} height={3} fill="#8c2f3c" />
        <rect x={179} y={49} width={30} height={3} fill="#8c2f3c" />
        <rect x={176} y={52} width={38} height={5} fill="#8c2f3c" />
        <rect x={188} y={43} width={16} height={1} fill="#a83b48" />
        <rect x={176} y={56} width={38} height={1} fill="#1a1c2c" />
        <rect x={176} y={57} width={38} height={41} fill="#d6c3a0" />
        <rect x={202} y={57} width={12} height={41} fill="#bda882" />
        <rect x={176} y={57} width={1} height={41} fill="#1a1c2c" />
        <rect x={213} y={57} width={1} height={41} fill="#1a1c2c" />
        <TownWindow x={182} y={63} />
        <TownWindow x={198} y={63} />
        <TownWindow x={182} y={74} />
        <TownWindow x={198} y={74} lit={false} />
        <TownWindow x={182} y={86} />
        <rect x={195} y={84} width={11} height={14} fill="#1a1c2c" />
        <rect x={196} y={85} width={9} height={13} fill="#8c2f3c" />
        <rect x={197} y={86} width={6} height={2} fill="#a83b48" />
        <rect x={202} y={91} width={2} height={2} fill="#ffcd75" />
        <rect x={194} y={96} width={13} height={2} fill="#8f8470" />

        {/* 右侧二层小楼 */}
        <rect x={222} y={57} width={10} height={3} fill="#3a3f6b" />
        <rect x={218} y={60} width={16} height={3} fill="#3a3f6b" />
        <rect x={216} y={63} width={22} height={4} fill="#3a3f6b" />
        <rect x={222} y={57} width={10} height={1} fill="#4a5084" />
        <rect x={216} y={67} width={22} height={1} fill="#1a1c2c" />
        <rect x={216} y={68} width={22} height={30} fill="#c9b48f" />
        <rect x={232} y={68} width={6} height={30} fill="#b09b78" />
        <rect x={216} y={68} width={1} height={30} fill="#1a1c2c" />
        <rect x={237} y={68} width={1} height={30} fill="#1a1c2c" />
        <TownWindow x={220} y={72} />
        <TownWindow x={220} y={84} />

        {/* 地面与广场石板 */}
        <rect x={0} y={98} width={240} height={52} fill="#38314f" />
        <rect x={0} y={98} width={240} height={2} fill="#272240" />
        <rect x={0} y={100} width={240} height={6} fill="#3d3557" />
        {TOWN_PATH.map(([x, y, w, h], i) => (
          <rect key={`path-${i}`} x={x} y={y} width={w} height={h} fill="#4c4368" />
        ))}
        {TOWN_PATH_LIGHT.map(([x, y, w, h], i) => (
          <rect key={`pl-${i}`} x={x} y={y} width={w} height={h} fill="#565076" />
        ))}
        {TOWN_JOINTS.map(([y, w], i) => (
          <rect key={`joint-${i}`} x={(240 - w) / 2} y={y} width={w} height={1} fill="#3b3457" />
        ))}
        {TOWN_SEAMS.map(([x, y], i) => (
          <rect key={`seam-${i}`} x={x} y={y} width={1} height={5} fill="#3b3457" />
        ))}

        {/* 房屋脚下的阴影块，把人造物落到地面上 */}
        <rect x={3} y={98} width={46} height={3} fill="#1a1c2c" opacity={0.32} />
        <rect x={48} y={98} width={24} height={3} fill="#1a1c2c" opacity={0.32} />
        <rect x={173} y={98} width={44} height={3} fill="#1a1c2c" opacity={0.32} />
        <rect x={213} y={98} width={27} height={3} fill="#1a1c2c" opacity={0.32} />

        {/* 街灯 1 */}
        <rect x={71} y={110} width={3} height={24} fill="#241f3d" />
        <rect x={71} y={110} width={1} height={24} fill="#423c68" />
        <rect x={65} y={108} width={15} height={2} fill="#241f3d" />
        <rect x={67} y={102} width={11} height={7} fill="#1a1c2c" />
        <rect x={68} y={103} width={9} height={5} fill="#ffcd75" />
        <rect x={69} y={104} width={3} height={2} fill="#fff3c4" />
        <rect x={69} y={99} width={7} height={3} fill="#241f3d" />
        <rect x={72} y={97} width={1} height={2} fill="#241f3d" />
        <rect x={70} y={134} width={5} height={2} fill="#241f3d" />
        <rect x={70} y={132} width={9} height={1} fill="#ffcd75" opacity={0.16} />
        <rect x={66} y={133} width={17} height={2} fill="#ffcd75" opacity={0.1} />
        <rect x={62} y={135} width={25} height={2} fill="#ffcd75" opacity={0.06} />

        {/* 街灯 2（更靠近镜头） */}
        <rect x={167} y={112} width={4} height={28} fill="#241f3d" />
        <rect x={167} y={112} width={1} height={28} fill="#423c68" />
        <rect x={160} y={110} width={17} height={2} fill="#241f3d" />
        <rect x={162} y={102} width={14} height={8} fill="#1a1c2c" />
        <rect x={163} y={103} width={12} height={6} fill="#ffcd75" />
        <rect x={164} y={104} width={4} height={3} fill="#fff3c4" />
        <rect x={163} y={99} width={12} height={3} fill="#241f3d" />
        <rect x={168} y={97} width={2} height={2} fill="#241f3d" />
        <rect x={164} y={140} width={10} height={2} fill="#241f3d" />
        <rect x={166} y={137} width={11} height={1} fill="#ffcd75" opacity={0.16} />
        <rect x={160} y={138} width={23} height={2} fill="#ffcd75" opacity={0.1} />
        <rect x={154} y={140} width={35} height={2} fill="#ffcd75" opacity={0.06} />

        {/* 近景碎石与画面压边 */}
        <rect x={30} y={146} width={10} height={3} fill="#4a4266" />
        <rect x={52} y={141} width={6} height={2} fill="#4a4266" />
        <rect x={186} y={147} width={12} height={3} fill="#4a4266" />
        <rect x={0} y={144} width={22} height={6} fill="#241f3d" />
        <rect x={218} y={144} width={22} height={6} fill="#241f3d" />
      </g>
    </svg>
  ),

  'pixel-forest': ({ className }) => (
    <svg
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden="true"
      shapeRendering="crispEdges"
    >
      <g transform="scale(6)">
        {/* 天空底色：越靠近地平线越亮 */}
        <rect x={0} y={0} width={240} height={150} fill="#061a10" />
        {FOREST_SKY.map((b, i) => (
          <rect key={`fsky-${i}`} x={0} y={b.y} width={240} height={b.h} fill={b.c} />
        ))}

        {/* 远处林线：一条起伏的深绿带 */}
        {FOREST_WALL.map(([x, y, w, h], i) => (
          <rect key={`wall-${i}`} x={x} y={y} width={w} height={h} fill="#2a6b49" />
        ))}

        {/* 远景树：小、淡、贴着地平线 */}
        {FOREST_FAR_TREES.map((x, i) => (
          <ForestTree
            key={`far-${i}`}
            x={x}
            ground={100}
            scale={1}
            trunk="#244c36"
            bark="#3a7050"
            canopy="#2a6446"
            light="#4a9469"
            opacity={0.95}
          />
        ))}

        {/* 斜光条：从树冠缝隙里斜插下来，压在中景树之前 */}
        {FOREST_BEAMS.map((b, bi) =>
          Array.from({ length: b.n }, (_, i) => (
            <rect
              key={`beam-${bi}-${i}`}
              x={b.x + i * b.dx}
              y={b.y + i * b.h}
              width={b.w}
              height={b.h}
              fill={b.c}
              opacity={b.o}
            />
          )),
        )}

        {/* 光束里浮着的光尘 */}
        <rect x={150} y={26} width={1} height={1} fill="#eaffb0" opacity={0.55} />
        <rect x={138} y={44} width={1} height={1} fill="#eaffb0" opacity={0.45} />
        <rect x={126} y={64} width={2} height={2} fill="#eaffb0" opacity={0.35} />
        <rect x={112} y={82} width={1} height={1} fill="#eaffb0" opacity={0.3} />
        <rect x={196} y={20} width={1} height={1} fill="#eaffb0" opacity={0.4} />
        <rect x={184} y={44} width={1} height={1} fill="#eaffb0" opacity={0.35} />
        <rect x={170} y={62} width={1} height={1} fill="#eaffb0" opacity={0.3} />
        <rect x={128} y={8} width={1} height={1} fill="#eaffb0" opacity={0.45} />

        {/* 林间薄雾：把远景树脚压淡，拉开前后层次 */}
        <rect x={0} y={93} width={240} height={7} fill="#4a9a6c" opacity={0.22} />
        <rect x={0} y={97} width={240} height={3} fill="#7fdfa4" opacity={0.16} />

        {/* 地面 */}
        <rect x={0} y={98} width={240} height={52} fill="#061a10" />
        {FOREST_GROUND.map((b, i) => (
          <rect key={`g-${i}`} x={0} y={b.y} width={240} height={b.h} fill={b.c} />
        ))}

        {/* 林间小径：一条向左弯的窄土路，靠草丛与石块打散边缘 */}
        {FOREST_PATH.map(([x, y, w, h], i) => (
          <rect key={`p-${i}`} x={x} y={y} width={w} height={h} fill="#55502f" />
        ))}
        <rect x={108} y={108} width={5} height={2} fill="#6f6840" />
        <rect x={100} y={120} width={6} height={2} fill="#6f6840" />
        <rect x={94} y={133} width={6} height={2} fill="#6f6840" />
        <rect x={88} y={144} width={7} height={2} fill="#6f6840" />

        {/* 中景树 */}
        {FOREST_MID_TREES.map((t, i) => (
          <ForestTree
            key={`mid-${i}`}
            x={t.x}
            ground={t.ground}
            scale={t.scale}
            flip={t.flip}
            trunk="#2a2016"
            bark="#463624"
            canopy="#1b4a33"
            light="#3c8a5e"
          />
        ))}

        {/* 地图边缘：两侧近景树干直接顶到画外，把画面框住 */}
        {/* 左侧树干 */}
        <rect x={0} y={0} width={18} height={150} fill="#1a120c" />
        <rect x={13} y={0} width={5} height={150} fill="#0d0906" />
        <rect x={5} y={0} width={2} height={150} fill="#33241a" />
        <rect x={9} y={40} width={1} height={46} fill="#33241a" opacity={0.55} />
        <rect x={2} y={82} width={6} height={3} fill="#0d0906" />
        <rect x={6} y={120} width={7} height={3} fill="#0d0906" />
        <rect x={14} y={38} width={8} height={5} fill="#1a120c" />
        <rect x={20} y={35} width={14} height={4} fill="#1a120c" />
        <rect x={32} y={33} width={9} height={3} fill="#1a120c" />
        <rect x={16} y={46} width={10} height={4} fill="#1a120c" />
        <rect x={24} y={44} width={12} height={3} fill="#1a120c" />
        <rect x={26} y={22} width={26} height={9} fill="#0a2317" />
        <rect x={36} y={16} width={16} height={7} fill="#0a2317" />
        <rect x={28} y={24} width={7} height={4} fill="#1e5a38" />
        <rect x={38} y={18} width={5} height={4} fill="#2f7a44" opacity={0.7} />
        {/* 右侧树干 */}
        <rect x={222} y={0} width={18} height={150} fill="#1a120c" />
        <rect x={222} y={0} width={5} height={150} fill="#0d0906" />
        <rect x={233} y={0} width={2} height={150} fill="#33241a" />
        <rect x={228} y={54} width={1} height={44} fill="#33241a" opacity={0.55} />
        <rect x={220} y={92} width={6} height={3} fill="#0d0906" />
        <rect x={210} y={21} width={12} height={5} fill="#1a120c" />
        <rect x={200} y={19} width={12} height={4} fill="#1a120c" />
        <rect x={192} y={38} width={14} height={4} fill="#1a120c" />
        <rect x={184} y={37} width={10} height={3} fill="#1a120c" />
        <rect x={190} y={14} width={28} height={9} fill="#0a2317" />
        <rect x={195} y={8} width={17} height={7} fill="#0a2317" />
        <rect x={194} y={16} width={6} height={4} fill="#1e5a38" />
        <rect x={204} y={10} width={5} height={4} fill="#2f7a44" opacity={0.7} />

        {/* 蘑菇 */}
        <Mushroom x={26} y={140} />
        <Mushroom x={202} y={126} />
        <Mushroom x={216} y={144} />
        <Mushroom x={96} y={142} />

        {/* 萤火虫：一圈微光 + 两个像素的亮点 */}
        {FOREST_FIREFLIES.map((f, i) => (
          <g key={`fly-${i}`}>
            <rect x={f.x - 3} y={f.y - 3} width={7} height={7} fill="#b9ff7a" opacity={0.13} />
            <rect x={f.x} y={f.y} width={2} height={2} fill="#eaff9e" />
          </g>
        ))}

        {/* 草丛 */}
        {FOREST_TUFTS.map(([x, y], i) => (
          <g key={`tuft-${i}`} transform={`translate(${x} ${y})`}>
            <rect x={0} y={0} width={2} height={4} fill="#2f7a44" />
            <rect x={3} y={1} width={2} height={3} fill="#256237" />
            <rect x={-2} y={2} width={2} height={2} fill="#256237" />
          </g>
        ))}

        {/* 前景蕨叶 */}
        <g transform="translate(14 136)">
          <rect x={0} y={2} width={2} height={8} fill="#1e5a38" />
          <rect x={-4} y={4} width={4} height={2} fill="#256237" />
          <rect x={2} y={6} width={4} height={2} fill="#2f7a44" />
          <rect x={-2} y={9} width={5} height={2} fill="#1e5a38" />
        </g>
        <g transform="translate(212 140)">
          <rect x={0} y={2} width={2} height={8} fill="#1e5a38" />
          <rect x={2} y={4} width={5} height={2} fill="#256237" />
          <rect x={-4} y={6} width={4} height={2} fill="#2f7a44" />
          <rect x={-2} y={9} width={5} height={2} fill="#1e5a38" />
        </g>

        {/* 画框底边：再压一层黑，拉开纵深 */}
        <rect x={0} y={147} width={240} height={3} fill="#04120b" />

        {/* 近景树冠：压在最上沿，形成"站在树底下"的取景框 */}
        <rect x={0} y={0} width={240} height={10} fill="#071c12" />
        <rect x={0} y={10} width={38} height={8} fill="#071c12" />
        <rect x={30} y={10} width={26} height={5} fill="#071c12" />
        <rect x={60} y={10} width={20} height={10} fill="#071c12" />
        <rect x={96} y={10} width={30} height={6} fill="#071c12" />
        <rect x={130} y={10} width={22} height={9} fill="#071c12" />
        <rect x={166} y={10} width={30} height={5} fill="#071c12" />
        <rect x={204} y={10} width={36} height={8} fill="#071c12" />
        <rect x={10} y={3} width={14} height={4} fill="#1e5a38" />
        <rect x={70} y={2} width={12} height={4} fill="#1e5a38" />
        <rect x={150} y={4} width={10} height={4} fill="#1e5a38" />
        <rect x={214} y={2} width={12} height={4} fill="#1e5a38" />
      </g>
    </svg>
  ),

  'pixel-sky': ({ className }) => (
    <svg
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden="true"
      shapeRendering="crispEdges"
    >
      <g transform="scale(6)">
        {/* 深蓝紫夜空：一级一级压下去 */}
        {SKY_BANDS.map((b, i) => (
          <rect key={`nsky-${i}`} x={0} y={b.y} width={240} height={b.h} fill={b.c} />
        ))}

        {/* 大小两档正方形星星 */}
        {SKY_STARS_BIG.map((s, i) => (
          <rect key={`big-${i}`} x={s.x} y={s.y} width={2} height={2} fill={s.c} />
        ))}
        {SKY_STARS_SMALL.map((s, i) => (
          <rect key={`small-${i}`} x={s.x} y={s.y} width={1} height={1} fill={s.c} opacity={0.8} />
        ))}

        {/* 像素月亮：十三行月面 + 环形坑（不铺方形光晕，避免出现色块） */}
        {MOON_ROWS.map(([x, y, w], i) => (
          <rect key={`moon-${i}`} x={x} y={y} width={w} height={2} fill="#ffe9a8" />
        ))}
        <rect x={180} y={16} width={4} height={2} fill="#fff2c0" />
        {MOON_CRATERS.map(([x, y, w, h], i) => (
          <rect key={`crater-${i}`} x={x} y={y} width={w} height={h} fill="#e8cc8c" />
        ))}
        {MOON_SHADOWS.map(([x, y, w, h], i) => (
          <rect key={`cshadow-${i}`} x={x} y={y} width={w} height={h} fill="#d6b874" />
        ))}

        {/* 流星：一列递减的像素块 */}
        {SKY_METEOR.map(([x, y, w, h, o], i) => (
          <rect
            key={`meteor-${i}`}
            x={x}
            y={y}
            width={w}
            height={h}
            fill={i === 0 ? '#fff6d0' : '#ffe9a8'}
            opacity={o}
          />
        ))}

        {/* 远山脊：一层层收窄的像素行堆出山峰 */}
        {SKY_FAR_PEAKS.map((p, pi) =>
          p.widths.map((w, i) => (
            <rect
              key={`fp-${pi}-${i}`}
              x={p.x - w / 2}
              y={120 - 4 * (i + 1)}
              width={w}
              height={4}
              fill="#171334"
            />
          )),
        )}

        {/* 近山脊：更黑更矮，压住地平线 */}
        {SKY_NEAR_PEAKS.map((p, pi) =>
          p.widths.map((w, i) => (
            <rect
              key={`np-${pi}-${i}`}
              x={p.x - w / 2}
              y={120 - 4 * (i + 1)}
              width={w}
              height={4}
              fill="#0b0a1f"
            />
          )),
        )}

        {/* 地平线光带 */}
        {SKY_HORIZON_GLOW.map((b, i) => (
          <rect key={`glow-${i}`} x={0} y={b.y} width={240} height={b.h} fill={b.c} />
        ))}

        {/* 地面 */}
        {SKY_GROUND.map((b, i) => (
          <rect key={`ground-${i}`} x={0} y={b.y} width={240} height={b.h} fill={b.c} />
        ))}
      </g>
    </svg>
  ),
}
