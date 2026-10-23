'use client'

// ============================================================
// 组件侧的薄封装：把纯函数解析与当前外观状态接起来
// ============================================================

import { useMemo } from 'react'
import { useAppearance } from '@/providers/appearance-provider'
import { resolveCharacter, resolveScene, type CharacterFigure } from '@/lib/theme/scene-resolve'
import type { SceneDefinition } from '@/lib/theme/atmosphere'

export { todayKey } from '@/lib/theme/scene-resolve'

export function useCurrentScene(): SceneDefinition | null {
  const { state } = useAppearance()
  return useMemo(
    () => resolveScene(state.themeId, state.atmosphere),
    [state.themeId, state.atmosphere]
  )
}

export function useCurrentCharacter(): CharacterFigure | null {
  const { state } = useAppearance()
  return useMemo(
    () => resolveCharacter(state.themeId, state.atmosphere),
    [state.themeId, state.atmosphere]
  )
}
