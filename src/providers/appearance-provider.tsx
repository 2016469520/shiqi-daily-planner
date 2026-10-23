'use client'

// ============================================================
// 外观 Provider：主题 + 个性化设置的唯一真源
//
// 状态放在 lib/theme/store 这个外部 store 里，组件通过
// useSyncExternalStore 订阅：服务端快照为默认值，挂载后 hydrate 一次，
// 因此既没有水合不一致，也不需要在 effect 里 setState。
//
// 之前明暗模式由 next-themes 负责，主题系统接管后必须由同一个地方同时
// 控制 `.dark` 类与 `data-theme`，否则两套状态会互相覆盖。
// ============================================================

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import { applyPalette, applyToDocument } from '@/lib/theme/apply'
import { buildPalette } from '@/lib/theme/color'
import {
  defaultAtmosphere,
  defaultColor,
  defaultState,
  exportState,
  importState,
  personalizationFor,
} from '@/lib/theme/storage'
import {
  getAppearanceState,
  getServerAppearanceState,
  hydrateAppearance,
  isAppearanceReady,
  subscribeAppearance,
  updateAppearance,
} from '@/lib/theme/store'
import { useMediaQuery } from '@/hooks/use-media-query'
import { getTheme, resolveMode } from '@/lib/theme/themes'
import type {
  AppearanceState,
  AtmosphereSettings,
  ColorMode,
  ColorPaletteSnapshot,
  ColorSettings,
  ThemeDefinition,
  ThemeId,
  ThemeMode,
  ThemePersonalization,
  UserPreset,
} from '@/lib/theme/types'

interface AppearanceContextValue {
  ready: boolean
  state: AppearanceState
  theme: ThemeDefinition
  personalization: ThemePersonalization
  /** 实际生效的明暗（主题强制模式时可能与 state.mode 不同） */
  mode: ThemeMode
  isCustomized: boolean
  presets: UserPreset[]
  setThemeId: (id: ThemeId) => void
  setMode: (mode: ThemeMode) => void
  setFollowSystem: (value: boolean) => void
  patchPersonalization: (patch: Partial<ThemePersonalization>) => void
  /** 沉浸氛围设置 */
  patchAtmosphere: (patch: Partial<AtmosphereSettings>) => void
  /** 智能配色 */
  /** 当前生效的调色板（已按 seed 兜底推导） */
  palette: ColorPaletteSnapshot | null
  patchColor: (patch: Partial<ColorSettings>) => void
  applySeed: (seedHex: string, mode?: ColorMode) => void
  setColorStrength: (strength: number) => void
  resetColor: () => void
  /** 角色库 */
  selectCharacter: (id: string | null) => void
  toggleFavoriteCharacter: (id: string) => void
  /** 当前主题的场景列表（供设置页渲染缩略图） */
  resetAtmosphere: () => void
  resetCurrentTheme: () => void
  resetAll: () => void
  savePreset: (name: string) => UserPreset | null
  applyPreset: (id: string) => void
  renamePreset: (id: string, name: string) => void
  deletePreset: (id: string) => void
  exportJson: () => string
  importJson: (text: string) => { ok: boolean; error?: string }
}

const AppearanceContext = createContext<AppearanceContextValue | null>(null)

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(
    subscribeAppearance,
    getAppearanceState,
    getServerAppearanceState
  )
  const ready = useSyncExternalStore(
    subscribeAppearance,
    isAppearanceReady,
    () => false
  )
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)')
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const systemMode: ThemeMode = prefersDark ? 'dark' : 'light'

  // 客户端挂载后把持久化配置接进来（store 内部只广播，不 setState）
  useEffect(() => {
    hydrateAppearance()
  }, [])

  const theme = useMemo(() => getTheme(state.themeId), [state.themeId])
  const personalization = useMemo(() => personalizationFor(state, state.themeId), [state])
  const mode = useMemo(
    () =>
      resolveMode(state.themeId, state.followSystem ? systemMode : state.mode, systemMode),
    [state.themeId, state.mode, state.followSystem, systemMode]
  )

  const isCustomized = useMemo(() => {
    const d = theme.defaults
    return (
      personalization.accent !== d.accent ||
      personalization.radius.button !== d.radius.button ||
      personalization.radius.card !== d.radius.card ||
      personalization.radius.input !== d.radius.input ||
      personalization.radius.dialog !== d.radius.dialog ||
      personalization.scale !== d.scale ||
      personalization.fontId !== d.fontId ||
      personalization.typeScale !== d.typeScale ||
      personalization.titleScale !== d.titleScale ||
      personalization.motion !== d.motion
    )
  }, [personalization, theme.defaults])

  // 有效调色板：优先用持久化的快照；只有 seed 时（例如导入了配置）即时推导一份
  const effectivePalette = useMemo(() => {
    const color = state.color
    if (!color || color.mode === 'theme') return null
    if (color.palette) return color.palette
    if (!color.seed) return null
    return buildPalette(color.seed, color.strength, mode === 'dark')
  }, [state.color, mode])

  // 应用主题：属性 + 内联覆盖变量
  useEffect(() => {
    const root = document.documentElement
    // 主色的唯一来源：调色板优先，其次是用户强调色，最后回落到主题自带主色
    const effectivePersonalization = effectivePalette
      ? { ...personalization, accent: effectivePalette.primary }
      : personalization
    applyToDocument(root, theme, effectivePersonalization, mode, reducedMotion)
    // 智能配色覆盖在主题与个性化之上（mode='theme' 时会自动清空）
    applyPalette(root, effectivePalette, state.color?.mode ?? 'theme')
    root.classList.toggle('dark', mode === 'dark')
    root.style.colorScheme = mode
    // 让 CSS 知道当前是否开着沉浸氛围（日历格子会轻微透出背景）
    root.dataset.atmo = state.atmosphere.enabled ? 'on' : 'off'
  }, [theme, personalization, mode, reducedMotion, state.atmosphere.enabled, state.color, effectivePalette])

  // ---------------- 智能配色 ----------------

  const patchColor = useCallback((patch: Partial<ColorSettings>) => {
    updateAppearance((prev) => ({ ...prev, color: { ...prev.color, ...patch } }))
  }, [])

  /** 用某个种子色生成整套调色板（强调色联动 / 背景取色共用） */
  const applySeed = useCallback((seedHex: string, nextMode?: ColorMode) => {
    updateAppearance((prev) => {
      const dark = prev.mode === 'dark'
      const palette = buildPalette(seedHex, prev.color.strength, dark)
      return {
        ...prev,
        color: {
          ...prev.color,
          mode: nextMode ?? prev.color.mode,
          seed: palette.seed,
          palette,
        },
      }
    })
  }, [])

  /** 协调强度变化时重算调色板（保持同一色相） */
  const setColorStrength = useCallback((strength: number) => {
    updateAppearance((prev) => {
      const seed = prev.color.seed ?? prev.color.palette?.seed
      const palette = seed ? buildPalette(seed, strength, prev.mode === 'dark') : prev.color.palette
      return { ...prev, color: { ...prev.color, strength, palette } }
    })
  }, [])

  const resetColor = useCallback(() => {
    updateAppearance((prev) => ({ ...prev, color: defaultColor() }))
  }, [])

  // ---------------- 角色库 ----------------

  const selectCharacter = useCallback((id: string | null) => {
    updateAppearance((prev) => {
      const recent = id
        ? [id, ...prev.characterLibrary.recent.filter((x) => x !== id)].slice(0, 8)
        : prev.characterLibrary.recent
      return {
        ...prev,
        atmosphere: { ...prev.atmosphere, characterId: id },
        characterLibrary: { ...prev.characterLibrary, recent },
      }
    })
  }, [])

  const toggleFavoriteCharacter = useCallback((id: string) => {
    updateAppearance((prev) => {
      const favorites = prev.characterLibrary.favorites.includes(id)
        ? prev.characterLibrary.favorites.filter((x) => x !== id)
        : [id, ...prev.characterLibrary.favorites].slice(0, 24)
      return { ...prev, characterLibrary: { ...prev.characterLibrary, favorites } }
    })
  }, [])

  const patchAtmosphere = useCallback((patch: Partial<AtmosphereSettings>) => {
    updateAppearance((prev) => ({
      ...prev,
      atmosphere: { ...prev.atmosphere, ...patch },
    }))
  }, [])

  const resetAtmosphere = useCallback(() => {
    updateAppearance((prev) => ({ ...prev, atmosphere: defaultAtmosphere() }))
  }, [])

  const patchPersonalization = useCallback((patch: Partial<ThemePersonalization>) => {
    updateAppearance((prev) => {
      const current = personalizationFor(prev, prev.themeId)
      return {
        ...prev,
        perTheme: { ...prev.perTheme, [prev.themeId]: { ...current, ...patch } },
      }
    })
  }, [])

  const setThemeId = useCallback((id: ThemeId) => {
    updateAppearance((prev) => {
      const next = getTheme(id)
      const nextMode = next.modes.includes(prev.mode) ? prev.mode : next.defaultMode
      return { ...prev, themeId: id, mode: nextMode }
    })
  }, [])

  const setMode = useCallback((next: ThemeMode) => {
    updateAppearance((prev) => ({ ...prev, mode: next, followSystem: false }))
  }, [])

  const setFollowSystem = useCallback((value: boolean) => {
    updateAppearance((prev) => ({ ...prev, followSystem: value }))
  }, [])

  const resetCurrentTheme = useCallback(() => {
    updateAppearance((prev) => {
      const next = { ...prev.perTheme }
      delete next[prev.themeId]
      return { ...prev, perTheme: next }
    })
  }, [])

  const resetAll = useCallback(() => {
    // 只重置外观与氛围，业务数据完全不动
    const fresh = defaultState()
    updateAppearance(() => fresh)
  }, [])

  const savePreset = useCallback((name: string): UserPreset | null => {
    const trimmed = name.trim()
    if (!trimmed) return null
    let created: UserPreset | null = null
    updateAppearance((prev) => {
      if (prev.presets.length >= 30) return prev
      const preset: UserPreset = {
        id: `preset-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        name: trimmed.slice(0, 40),
        baseThemeId: prev.themeId,
        personalization: personalizationFor(prev, prev.themeId),
        createdAt: new Date().toISOString(),
      }
      created = preset
      return { ...prev, presets: [...prev.presets, preset] }
    })
    return created
  }, [])

  const applyPreset = useCallback((id: string) => {
    updateAppearance((prev) => {
      const preset = prev.presets.find((p) => p.id === id)
      if (!preset) return prev
      const nextTheme = getTheme(preset.baseThemeId)
      return {
        ...prev,
        themeId: preset.baseThemeId,
        mode: nextTheme.modes.includes(prev.mode) ? prev.mode : nextTheme.defaultMode,
        perTheme: { ...prev.perTheme, [preset.baseThemeId]: { ...preset.personalization } },
      }
    })
  }, [])

  const renamePreset = useCallback((id: string, name: string) => {
    const trimmed = name.trim().slice(0, 40)
    if (!trimmed) return
    updateAppearance((prev) => ({
      ...prev,
      presets: prev.presets.map((p) => (p.id === id ? { ...p, name: trimmed } : p)),
    }))
  }, [])

  const deletePreset = useCallback((id: string) => {
    updateAppearance((prev) => ({
      ...prev,
      presets: prev.presets.filter((p) => p.id !== id),
    }))
  }, [])

  const exportJson = useCallback(() => exportState(getAppearanceState()), [])

  const importJson = useCallback((text: string) => {
    const result = importState(text)
    if (!result.ok) return { ok: false, error: result.error }
    updateAppearance(() => result.state)
    return { ok: true }
  }, [])

  const value = useMemo<AppearanceContextValue>(
    () => ({
      ready,
      state,
      theme,
      personalization,
      mode,
      isCustomized,
      presets: state.presets,
      setThemeId,
      setMode,
      setFollowSystem,
      patchPersonalization,
      patchAtmosphere,
      palette: effectivePalette,
      patchColor,
      applySeed,
      setColorStrength,
      resetColor,
      selectCharacter,
      toggleFavoriteCharacter,
      resetAtmosphere,
      resetCurrentTheme,
      resetAll,
      savePreset,
      applyPreset,
      renamePreset,
      deletePreset,
      exportJson,
      importJson,
    }),
    [
      ready,
      state,
      theme,
      personalization,
      mode,
      isCustomized,
      setThemeId,
      setMode,
      setFollowSystem,
      patchPersonalization,
      patchAtmosphere,
      patchColor,
      applySeed,
      setColorStrength,
      resetColor,
      selectCharacter,
      toggleFavoriteCharacter,
      resetAtmosphere,
      resetCurrentTheme,
      resetAll,
      savePreset,
      applyPreset,
      renamePreset,
      deletePreset,
      exportJson,
      importJson,
    ]
  )

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>
}

export function useAppearance(): AppearanceContextValue {
  const ctx = useContext(AppearanceContext)
  if (!ctx) throw new Error('useAppearance 必须在 AppearanceProvider 内使用')
  return ctx
}

/** 兼容只需要明暗模式的老调用方 */
export function useAppearanceMode(): ThemeMode {
  return useAppearance().mode
}