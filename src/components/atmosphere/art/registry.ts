// ============================================================
// 美术注册表：场景 id / 角色 id → SVG 组件
// 六套主题的美术文件各自导出映射，这里合并成运行时唯一入口。
// 缺少某个素材时返回 undefined，调用方会降级（不渲染背景）。
// ============================================================

import { ANIME_SCENES } from './scenes-anime'
import { CYBER_SCENES } from './scenes-cyber'
import { FLUENT_SCENES } from './scenes-fluent'
import { MINIMAL_SCENES } from './scenes-minimal'
import { PIXEL_SCENES } from './scenes-pixel'
import { BENTO_SCENES } from './scenes-bento'
import { PIXEL_CHARACTERS } from './characters-pixel'
import type { ReactNode } from 'react'
import type { CharacterArt, CharacterArtProps, SceneArt } from './types'

export const SCENE_ART: Record<string, SceneArt> = {
  ...ANIME_SCENES,
  ...CYBER_SCENES,
  ...FLUENT_SCENES,
  ...MINIMAL_SCENES,
  ...PIXEL_SCENES,
  ...BENTO_SCENES,
}

export const CHARACTER_ART: Record<string, CharacterArt> = {
  ...PIXEL_CHARACTERS,
}

export function getSceneArt(id: string | null | undefined): SceneArt | null {
  if (!id) return null
  return SCENE_ART[id] ?? null
}

export function getCharacterArt(id: string | null | undefined): CharacterArt | null {
  if (!id) return null
  return CHARACTER_ART[id] ?? null
}

/**
 * 渲染场景。
 * 这些美术组件都是纯函数（无 hooks、无状态），因此直接调用返回元素，
 * 而不是把函数体当组件挂载——这样既省一层组件实例，也避免在渲染期
 * "动态创建组件"。
 */
export function renderScene(
  id: string | null | undefined,
  className?: string
): ReactNode {
  const Art = getSceneArt(id)
  return Art ? Art({ className }) : null
}

export function renderCharacter(
  id: string | null | undefined,
  props: CharacterArtProps
): ReactNode {
  const Art = getCharacterArt(id)
  return Art ? Art(props) : null
}
