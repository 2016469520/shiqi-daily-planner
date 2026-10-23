// ============================================================
// 像素机主题 · 冒险者 PIX
// ------------------------------------------------------------
// 角色画在 28 × 33 的像素网格上（1 单位 = 4px，整体平移 4,4），
// 所有坐标都是整数，5 种状态共用同一具身体，只换脸、换手、换头顶小道具。
// 墨色描边 + 地面阴影块保证在米白纸感与深夜机台两种底子上都看得清。
// ============================================================

import type { CharacterExpression } from '@/lib/theme/atmosphere'
import type { CharacterArt } from './types'

const INK = '#1a1c2c'
const RED = '#d7263d'
const RED_DARK = '#9e1b30'
const RED_LIGHT = '#ff5470'
const BLUE = '#29adff'
const BLUE_DARK = '#1c6fb0'
const ICE = '#bfe3ff'
const CREAM = '#f4f1ea'
const SKIN = '#ffcd75'
const SKIN_DARK = '#e0a94f'
const BLUSH = '#f08a7a'
const GOLD = '#ffcd75'
const BROWN = '#8a5a32'
const BROWN_LIGHT = '#a86f3f'
const BROWN_DARK = '#4f2f18'
const SILVER = '#e6effb'
const PANTS = '#2c3157'
const PANTS_LIGHT = '#3a4068'

interface FaceProps {
  expression: CharacterExpression
}

/** 只画脸：坐标固定在脸部 9..18 × 10..16 的范围内 */
function PixFace({ expression }: FaceProps) {
  switch (expression) {
    // 开心：^ ^ 眼睛 + 上扬嘴角
    case 'happy':
      return (
        <>
          <rect x={10} y={13} width={2} height={1} fill={BLUSH} />
          <rect x={16} y={13} width={2} height={1} fill={BLUSH} />
          <rect x={10} y={12} width={1} height={1} fill={INK} />
          <rect x={11} y={11} width={1} height={1} fill={INK} />
          <rect x={12} y={12} width={1} height={1} fill={INK} />
          <rect x={15} y={12} width={1} height={1} fill={INK} />
          <rect x={16} y={11} width={1} height={1} fill={INK} />
          <rect x={17} y={12} width={1} height={1} fill={INK} />
          <rect x={12} y={14} width={1} height={1} fill={INK} />
          <rect x={13} y={15} width={2} height={1} fill={INK} />
          <rect x={15} y={14} width={1} height={1} fill={INK} />
        </>
      )

    // 思考：眼睛往上瞟、嘴抿成一条线
    case 'thinking':
      return (
        <>
          <rect x={10} y={13} width={2} height={1} fill={BLUSH} />
          <rect x={16} y={13} width={2} height={1} fill={BLUSH} />
          <rect x={11} y={10} width={2} height={2} fill={INK} />
          <rect x={16} y={10} width={2} height={2} fill={INK} />
          <rect x={11} y={10} width={1} height={1} fill={CREAM} />
          <rect x={16} y={10} width={1} height={1} fill={CREAM} />
          <rect x={13} y={15} width={2} height={1} fill={INK} />
        </>
      )

    // 工作：眉毛下压、眼睛眯成一条，嘴抿紧
    case 'working':
      return (
        <>
          <rect x={10} y={13} width={2} height={1} fill={BLUSH} />
          <rect x={16} y={13} width={2} height={1} fill={BLUSH} />
          <rect x={10} y={10} width={2} height={1} fill={INK} />
          <rect x={16} y={10} width={2} height={1} fill={INK} />
          <rect x={11} y={11} width={2} height={1} fill={INK} />
          <rect x={16} y={11} width={2} height={1} fill={INK} />
          <rect x={13} y={14} width={2} height={1} fill={INK} />
        </>
      )

    // 出错：X X 眼睛 + 皱眉
    case 'error':
      return (
        <>
          <rect x={10} y={10} width={1} height={1} fill={INK} />
          <rect x={13} y={10} width={1} height={1} fill={INK} />
          <rect x={11} y={11} width={2} height={1} fill={INK} />
          <rect x={11} y={12} width={2} height={1} fill={INK} />
          <rect x={10} y={13} width={1} height={1} fill={INK} />
          <rect x={13} y={13} width={1} height={1} fill={INK} />
          <rect x={15} y={10} width={1} height={1} fill={INK} />
          <rect x={18} y={10} width={1} height={1} fill={INK} />
          <rect x={16} y={11} width={2} height={1} fill={INK} />
          <rect x={16} y={12} width={2} height={1} fill={INK} />
          <rect x={15} y={13} width={1} height={1} fill={INK} />
          <rect x={18} y={13} width={1} height={1} fill={INK} />
          <rect x={12} y={16} width={1} height={1} fill={INK} />
          <rect x={13} y={15} width={2} height={1} fill={INK} />
          <rect x={15} y={16} width={1} height={1} fill={INK} />
        </>
      )

    // 待机 / 未定义的困倦状态：平视 + 小嘴
    default:
      return (
        <>
          <rect x={10} y={13} width={2} height={1} fill={BLUSH} />
          <rect x={16} y={13} width={2} height={1} fill={BLUSH} />
          <rect x={11} y={11} width={2} height={2} fill={INK} />
          <rect x={16} y={11} width={2} height={2} fill={INK} />
          <rect x={11} y={11} width={1} height={1} fill={CREAM} />
          <rect x={16} y={11} width={1} height={1} fill={CREAM} />
          <rect x={13} y={15} width={2} height={1} fill={INK} />
        </>
      )
  }
}

/** 待机的手臂：自然垂下 */
function PixArms({ droop = false }: { droop?: boolean }) {
  return (
    <g transform={droop ? 'translate(0 1)' : undefined}>
      {/* 左臂 */}
      <rect x={7} y={18} width={4} height={7} fill={INK} />
      <rect x={8} y={18} width={2} height={4} fill={RED} />
      <rect x={8} y={21} width={2} height={1} fill={CREAM} />
      <rect x={8} y={22} width={2} height={3} fill={SKIN} />
      <rect x={9} y={22} width={1} height={1} fill={SKIN_DARK} />
      {/* 右臂 */}
      <rect x={17} y={18} width={4} height={7} fill={INK} />
      <rect x={18} y={18} width={2} height={4} fill={RED} />
      <rect x={18} y={21} width={2} height={1} fill={CREAM} />
      <rect x={18} y={22} width={2} height={3} fill={SKIN} />
      <rect x={18} y={22} width={1} height={1} fill={SKIN_DARK} />
    </g>
  )
}

/** 工作状态：右手举起一把小剑 */
function PixSwordArm() {
  return (
    <>
      {/* 小剑：尖头 + 三像素银刃 + 金色护手与剑柄 */}
      <rect x={26} y={2} width={1} height={1} fill={INK} />
      <rect x={24} y={3} width={4} height={11} fill={INK} />
      <rect x={25} y={4} width={2} height={9} fill={SILVER} />
      <rect x={25} y={4} width={1} height={4} fill={CREAM} />
      <rect x={22} y={13} width={6} height={2} fill={INK} />
      <rect x={22} y={13} width={5} height={1} fill={GOLD} />
      <rect x={24} y={15} width={3} height={4} fill={INK} />
      <rect x={24} y={15} width={2} height={3} fill={BROWN} />
      <rect x={23} y={18} width={4} height={1} fill={GOLD} />
      {/* 举起的右臂 */}
      <rect x={17} y={15} width={5} height={6} fill={INK} />
      <rect x={18} y={15} width={2} height={3} fill={RED} />
      <rect x={18} y={18} width={2} height={1} fill={CREAM} />
      <rect x={22} y={15} width={3} height={3} fill={SKIN} />
      <rect x={22} y={15} width={1} height={1} fill={SKIN_DARK} />
      {/* 左臂仍自然垂下 */}
      <rect x={7} y={18} width={4} height={7} fill={INK} />
      <rect x={8} y={18} width={2} height={4} fill={RED} />
      <rect x={8} y={21} width={2} height={1} fill={CREAM} />
      <rect x={8} y={22} width={2} height={3} fill={SKIN} />
      <rect x={9} y={22} width={1} height={1} fill={SKIN_DARK} />
    </>
  )
}

export const PIXEL_CHARACTERS: Record<string, CharacterArt> = {
  'pixel-pix': ({ expression, className, reacting }) => {
    const lean = expression === 'working' ? 'translate(1 0)' : undefined
    const headShift =
      expression === 'thinking' ? 'translate(2 0)' : expression === 'error' ? 'translate(0 1)' : undefined

    return (
      <svg viewBox="0 0 120 140" className={className} aria-hidden="true" shapeRendering="crispEdges">
        <g transform={reacting ? 'translate(2 -2)' : undefined}>
          <g transform="translate(4 4) scale(4)">
            {/* 地面阴影块 */}
            <rect x={7} y={31} width={16} height={2} fill={INK} opacity={0.2} />
            <rect x={5} y={32} width={13} height={1} fill={INK} opacity={0.12} />

            {/* 披风：先铺在最后面，只露出两侧 */}
            <g transform={lean}>
              <rect x={6} y={15} width={5} height={13} fill={INK} />
              <rect x={7} y={16} width={3} height={10} fill={BLUE_DARK} />
              <rect x={7} y={16} width={3} height={5} fill={BLUE} />
              <rect x={7} y={25} width={3} height={2} fill={BLUE_DARK} />
              <rect x={6} y={16} width={1} height={9} fill={ICE} opacity={0.55} />
              <rect x={17} y={15} width={5} height={13} fill={INK} />
              <rect x={18} y={16} width={3} height={10} fill={BLUE_DARK} />
              <rect x={18} y={16} width={3} height={5} fill={BLUE} />
              <rect x={18} y={25} width={3} height={2} fill={BLUE_DARK} />
              {/* 下摆向两侧张开，让披风更好认 */}
              <rect x={5} y={23} width={7} height={4} fill={INK} />
              <rect x={6} y={24} width={5} height={2} fill={BLUE_DARK} />
              <rect x={17} y={23} width={7} height={4} fill={INK} />
              <rect x={17} y={24} width={5} height={2} fill={BLUE_DARK} />
            </g>

            {/* 腿与靴子：工作前倾时保持站定 */}
            <rect x={10} y={24} width={9} height={9} fill={INK} />
            <rect x={11} y={25} width={3} height={5} fill={PANTS} />
            <rect x={15} y={25} width={3} height={5} fill={PANTS} />
            <rect x={11} y={25} width={1} height={5} fill={PANTS_LIGHT} />
            <rect x={15} y={25} width={1} height={5} fill={PANTS_LIGHT} />
            <rect x={10} y={30} width={4} height={2} fill={BROWN} />
            <rect x={15} y={30} width={4} height={2} fill={BROWN} />
            <rect x={10} y={31} width={1} height={1} fill={BROWN_DARK} />
            <rect x={18} y={31} width={1} height={1} fill={BROWN_DARK} />

            {/* 身体：红色背心 + 腰带 + 斜挎带 */}
            <g transform={lean}>
              <rect x={9} y={17} width={10} height={9} fill={INK} />
              <rect x={10} y={18} width={8} height={7} fill={RED} />
              <rect x={16} y={18} width={2} height={7} fill={RED_DARK} />
              <rect x={10} y={18} width={2} height={2} fill={RED_LIGHT} />
              <rect x={10} y={23} width={8} height={2} fill={BROWN_DARK} />
              <rect x={13} y={23} width={2} height={2} fill={GOLD} />
              <rect x={11} y={18} width={1} height={1} fill={CREAM} />
              <rect x={12} y={19} width={1} height={1} fill={CREAM} />
              <rect x={13} y={20} width={1} height={1} fill={CREAM} />
              <rect x={14} y={21} width={1} height={1} fill={CREAM} />
              <rect x={15} y={22} width={1} height={1} fill={CREAM} />

              {/* 小背包：从右肩后面露出一角 */}
              <rect x={20} y={16} width={4} height={8} fill={INK} />
              <rect x={21} y={17} width={2} height={6} fill={BROWN} />
              <rect x={21} y={17} width={2} height={2} fill={BROWN_LIGHT} />
              <rect x={21} y={21} width={2} height={1} fill={BROWN_DARK} />
              <rect x={22} y={19} width={1} height={1} fill={GOLD} />

              {/* 手部：待机/出错时垂下，工作时举剑 */}
              {expression === 'working' ? <PixSwordArm /> : <PixArms droop={expression === 'error'} />}

              {/* 头 + 宽檐帽 + 脸；思考时整体侧移，出错时垂下去 */}
              <g transform={headShift}>
                <rect x={8} y={8} width={12} height={10} fill={INK} />
                <rect x={9} y={9} width={10} height={8} fill={SKIN} />
                <rect x={16} y={9} width={2} height={8} fill={SKIN_DARK} />
                <rect x={9} y={15} width={9} height={1} fill={SKIN_DARK} opacity={0.55} />

                {/* 宽檐帽 */}
                <rect x={8} y={1} width={12} height={6} fill={INK} />
                <rect x={3} y={7} width={22} height={3} fill={INK} />
                <rect x={9} y={2} width={10} height={4} fill={RED} />
                <rect x={10} y={2} width={3} height={2} fill={RED_LIGHT} />
                <rect x={16} y={2} width={2} height={3} fill={RED_DARK} />
                <rect x={9} y={6} width={10} height={1} fill={CREAM} />
                <rect x={4} y={7} width={20} height={2} fill={RED} />
                <rect x={4} y={8} width={20} height={1} fill={RED_DARK} />
                <rect x={4} y={7} width={7} height={1} fill={RED_LIGHT} />
                {/* 帽侧羽毛 */}
                <rect x={22} y={1} width={2} height={3} fill={BLUE} />
                <rect x={21} y={3} width={2} height={2} fill={BLUE} />
                <rect x={20} y={5} width={2} height={2} fill={BLUE_DARK} />
                <rect x={23} y={0} width={1} height={1} fill={CREAM} />

                <PixFace expression={expression} />
              </g>
            </g>

            {/* 状态小道具：开心的小星星 */}
            {expression === 'happy' ? (
              <g>
                <rect x={3} y={2} width={1} height={1} fill={INK} />
                <rect x={2} y={3} width={1} height={1} fill={INK} />
                <rect x={3} y={3} width={1} height={1} fill={INK} />
                <rect x={4} y={3} width={1} height={1} fill={INK} />
                <rect x={3} y={4} width={1} height={1} fill={INK} />
                <rect x={2} y={1} width={1} height={1} fill={GOLD} />
                <rect x={1} y={2} width={1} height={1} fill={GOLD} />
                <rect x={2} y={2} width={1} height={1} fill={GOLD} />
                <rect x={3} y={2} width={1} height={1} fill={GOLD} />
                <rect x={2} y={3} width={1} height={1} fill={GOLD} />
                <rect x={5} y={0} width={1} height={1} fill={CREAM} />
              </g>
            ) : null}

            {/* 状态小道具：思考的问号 */}
            {expression === 'thinking' ? (
              <g fill={BLUE}>
                <rect x={1} y={2} width={2} height={1} />
                <rect x={2} y={3} width={1} height={1} />
                <rect x={1} y={4} width={1} height={1} />
                <rect x={1} y={5} width={1} height={1} />
                <rect x={1} y={7} width={1} height={1} />
              </g>
            ) : null}

            {/* 状态小道具：出错的汗滴 */}
            {expression === 'error' ? (
              <g>
                <rect x={2} y={1} width={1} height={1} fill={BLUE} />
                <rect x={1} y={2} width={3} height={1} fill={BLUE} />
                <rect x={1} y={3} width={3} height={1} fill={BLUE} />
                <rect x={2} y={4} width={1} height={1} fill={BLUE} />
                <rect x={1} y={2} width={1} height={1} fill={CREAM} />
              </g>
            ) : null}
          </g>
        </g>
      </svg>
    )
  },
}
