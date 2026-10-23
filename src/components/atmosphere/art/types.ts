// 氛围美术的组件契约
// 场景与角色都是纯 SVG 组件：随包离线、可无限缩放、体积极小。

import type { ReactElement } from 'react'
import type { CharacterExpression } from '@/lib/theme/atmosphere'

export interface SceneArtProps {
  className?: string
}

export interface CharacterArtProps {
  expression: CharacterExpression
  className?: string
  /** 点击角色时的轻微反应（例如点头/跳跃），由外层控制 */
  reacting?: boolean
}

export type SceneArt = (props: SceneArtProps) => ReactElement
export type CharacterArt = (props: CharacterArtProps) => ReactElement
