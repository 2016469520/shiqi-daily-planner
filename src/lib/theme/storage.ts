// ============================================================
// 外观设置的持久化：读取、校验、迁移、导入导出
//
// 原则：任何一步校验失败都回退到安全默认值，绝不把坏配置应用到界面。
// 存储用 localStorage：Web / Electron(app://) / Android(Capacitor) 都可用。
// ============================================================

import type {
  AtmosphereSettings,
  AppearanceState,
  ColorPaletteSnapshot,
  ColorSettings,
  MotionLevel,
  ThemeId,
  ThemePersonalization,
  UserPreset,
} from './types'
import {
  DEFAULT_RADIUS,
  DEFAULT_THEME_ID,
  MOTION_OPTIONS,
  SCALE_OPTIONS,
  THEMES,
  THEME_IDS,
  getTheme,
} from './themes'
import { CHARACTERS, SCENES } from './atmosphere'
import { CHARACTER_IDS, PACK_ID_PREFIX } from './characters'

export const STORAGE_KEY = 'timegrid:appearance:v1'
/** 3：新增智能配色 color 与角色库偏好 characterLibrary（旧配置自动补默认） */
export const APPEARANCE_VERSION = 3

const MOTION_VALUES = MOTION_OPTIONS.map((m) => m.value)
const FONT_VALUES = ['theme', 'system', 'rounded', 'mono', 'serif']
const POSITION_VALUES = ['bottom-left', 'bottom-right', 'hero', 'sidebar']

export function defaultPersonalization(id: ThemeId): ThemePersonalization {
  return { ...getTheme(id).defaults, radius: { ...getTheme(id).defaults.radius } }
}

export function defaultAtmosphere(): AtmosphereSettings {
  return {
    enabled: true,
    mode: 'immersive',
    animations: true,
    sceneByTheme: {},
    rotateScenes: false,
    characterEnabled: true,
    characterByTheme: {},
    characterSize: 100,
    characterPosition: 'hero',
    characterOpacity: 100,
    characterAnimate: true,
    characterAutoState: true,
    characterWelcome: true,
    customCharacterId: null,
    characterId: null,
    quoteEnabled: true,
    customQuotes: {},
    bgSource: 'scene',
    customBackgroundId: null,
    bgOpacity: 100,
    bgBlur: 0,
    bgDarken: 0,
    bgMask: 55,
    bgHue: 0,
    bgBrightness: 100,
    celebration: true,
    welcome: true,
  }
}

export function defaultColor(): ColorSettings {
  return {
    mode: 'theme',
    strength: 60,
    seed: null,
    palette: null,
    candidates: [],
    lockedSeed: null,
  }
}

export function defaultState(): AppearanceState {
  return {
    version: APPEARANCE_VERSION,
    themeId: DEFAULT_THEME_ID,
    mode: getTheme(DEFAULT_THEME_ID).defaultMode,
    followSystem: false,
    perTheme: {},
    presets: [],
    atmosphere: defaultAtmosphere(),
    color: defaultColor(),
    characterLibrary: { favorites: [], recent: [] },
  }
}

function clamp(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

function validThemeId(value: unknown): ThemeId | null {
  return typeof value === 'string' && THEME_IDS.includes(value as ThemeId)
    ? (value as ThemeId)
    : null
}

/** 校验单份个性化参数；任何非法字段都退回主题默认 */
export function sanitizePersonalization(
  id: ThemeId,
  raw: unknown
): ThemePersonalization {
  const base = defaultPersonalization(id)
  if (!raw || typeof raw !== 'object') return base
  const input = raw as Record<string, unknown>

  const radiusInput = (input.radius ?? {}) as Record<string, unknown>
  const radius = {
    button: clamp(radiusInput.button, 0, 32, base.radius.button),
    card: clamp(radiusInput.card, 0, 32, base.radius.card),
    input: clamp(radiusInput.input, 0, 32, base.radius.input),
    dialog: clamp(radiusInput.dialog, 0, 32, base.radius.dialog),
  }

  const scaleInput = typeof input.scale === 'number' ? input.scale : Number(input.scale)
  const scale = (SCALE_OPTIONS as readonly number[]).includes(scaleInput) ? scaleInput : base.scale

  const accent =
    typeof input.accent === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(input.accent.trim())
      ? input.accent.trim()
      : null

  return {
    accent,
    radius,
    scale,
    fontId: FONT_VALUES.includes(String(input.fontId))
      ? (input.fontId as ThemePersonalization['fontId'])
      : base.fontId,
    typeScale: clamp(input.typeScale, 0.85, 1.2, base.typeScale),
    titleScale: clamp(input.titleScale, 0.85, 1.25, base.titleScale),
    motion: MOTION_VALUES.includes(input.motion as MotionLevel)
      ? (input.motion as MotionLevel)
      : base.motion,
  }
}

function sanitizePresets(raw: unknown): UserPreset[] {
  if (!Array.isArray(raw)) return []
  const out: UserPreset[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const rec = item as Record<string, unknown>
    const baseThemeId = validThemeId(rec.baseThemeId)
    if (!baseThemeId) continue
    if (typeof rec.name !== 'string' || !rec.name.trim()) continue
    out.push({
      id: typeof rec.id === 'string' && rec.id ? rec.id : `preset-${Date.now()}-${out.length}`,
      name: rec.name.trim().slice(0, 40),
      baseThemeId,
      personalization: sanitizePersonalization(baseThemeId, rec.personalization),
      createdAt: typeof rec.createdAt === 'string' ? rec.createdAt : new Date().toISOString(),
    })
    if (out.length >= 30) break
  }
  return out
}

/** 校验氛围设置；缺失字段一律补默认值（兼容 v1 旧配置） */
export function sanitizeAtmosphere(raw: unknown): AtmosphereSettings {
  const base = defaultAtmosphere()
  if (!raw || typeof raw !== 'object') return base
  const input = raw as Record<string, unknown>

  const sceneByTheme: Partial<Record<ThemeId, string>> = {}
  const sceneInput = (input.sceneByTheme ?? {}) as Record<string, unknown>
  for (const id of THEME_IDS) {
    const value = sceneInput[id]
    if (typeof value === 'string' && SCENES.some((s) => s.id === value && s.themeId === id)) {
      sceneByTheme[id] = value
    }
  }

  const characterByTheme: Partial<Record<ThemeId, string>> = {}
  const charInput = (input.characterByTheme ?? {}) as Record<string, unknown>
  for (const id of THEME_IDS) {
    const value = charInput[id]
    if (
      typeof value === 'string' &&
      CHARACTERS.some((c) => c.id === value && c.themeId === id)
    ) {
      characterByTheme[id] = value
    }
  }

  const customQuotes: Partial<Record<ThemeId, string[]>> = {}
  const quotesInput = (input.customQuotes ?? {}) as Record<string, unknown>
  for (const id of THEME_IDS) {
    const list = quotesInput[id]
    if (Array.isArray(list)) {
      const cleaned = list
        .filter((q): q is string => typeof q === 'string')
        .map((q) => q.trim().slice(0, 120))
        .filter(Boolean)
        .slice(0, 20)
      if (cleaned.length) customQuotes[id] = cleaned
    }
  }

  return {
    enabled: input.enabled !== false,
    mode: input.mode === 'pure' ? 'pure' : 'immersive',
    animations: input.animations !== false,
    sceneByTheme,
    rotateScenes: input.rotateScenes === true,
    characterEnabled: input.characterEnabled !== false,
    characterByTheme,
    characterSize: clamp(input.characterSize, 60, 160, base.characterSize),
    characterPosition: POSITION_VALUES.includes(String(input.characterPosition))
      ? (input.characterPosition as AtmosphereSettings['characterPosition'])
      : base.characterPosition,
    characterOpacity: clamp(input.characterOpacity, 30, 100, base.characterOpacity),
    characterAnimate: input.characterAnimate !== false,
    characterAutoState: input.characterAutoState !== false,
    characterWelcome: input.characterWelcome !== false,
    customCharacterId:
      typeof input.customCharacterId === 'string' && input.customCharacterId
        ? input.customCharacterId
        : null,
    // 本地素材包的 id 以 pack- 开头，也要接受，否则重载后选择会丢失
    characterId:
      typeof input.characterId === 'string' &&
      (CHARACTER_IDS.includes(input.characterId) || input.characterId.startsWith(PACK_ID_PREFIX))
        ? input.characterId
        : null,
    quoteEnabled: input.quoteEnabled !== false,
    customQuotes,
    bgSource: input.bgSource === 'custom' ? 'custom' : 'scene',
    customBackgroundId:
      typeof input.customBackgroundId === 'string' && input.customBackgroundId
        ? input.customBackgroundId
        : null,
    bgOpacity: clamp(input.bgOpacity, 0, 100, base.bgOpacity),
    bgBlur: clamp(input.bgBlur, 0, 20, base.bgBlur),
    bgDarken: clamp(input.bgDarken, 0, 60, base.bgDarken),
    bgMask: clamp(input.bgMask, 0, 100, base.bgMask),
    bgHue: clamp(input.bgHue, -30, 30, base.bgHue),
    bgBrightness: clamp(input.bgBrightness, 70, 130, base.bgBrightness),
    celebration: input.celebration !== false,
    welcome: input.welcome !== false,
  }
}

/** 校验配色设置（兼容 v1/v2 旧配置） */
export function sanitizeColor(raw: unknown): ColorSettings {
  const base = defaultColor()
  if (!raw || typeof raw !== 'object') return base
  const input = raw as Record<string, unknown>
  const MODES = ['theme', 'wallpaper', 'accent', 'locked']
  const snap = input.palette as Record<string, unknown> | null | undefined
  const palette: ColorPaletteSnapshot | null =
    snap && typeof snap === 'object' && typeof snap.primary === 'string'
      ? {
          seed: String(snap.seed ?? '#7c5cff'),
          primary: String(snap.primary),
          onPrimary: String(snap.onPrimary ?? '#ffffff'),
          primaryContainer: String(snap.primaryContainer ?? '#eeeeee'),
          secondary: String(snap.secondary ?? '#888888'),
          tertiary: String(snap.tertiary ?? '#888888'),
          ambient: String(snap.ambient ?? 'transparent'),
          overlay: String(snap.overlay ?? 'transparent'),
          cardTint: String(snap.cardTint ?? 'transparent'),
          borderTint: String(snap.borderTint ?? 'transparent'),
          selection: String(snap.selection ?? 'transparent'),
          dark: snap.dark === true,
        }
      : null

  const hexOk = (v: unknown): string | null =>
    typeof v === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v.trim()) ? v.trim() : null

  return {
    mode: MODES.includes(String(input.mode)) ? (input.mode as ColorSettings['mode']) : base.mode,
    strength: clamp(input.strength, 0, 100, base.strength),
    seed: hexOk(input.seed),
    palette,
    candidates: Array.isArray(input.candidates)
      ? input.candidates.map(hexOk).filter((v): v is string => !!v).slice(0, 6)
      : [],
    lockedSeed: hexOk(input.lockedSeed),
  }
}

/** 校验角色库偏好 */
function sanitizeLibrary(raw: unknown): { favorites: string[]; recent: string[] } {
  const base = { favorites: [], recent: [] }
  if (!raw || typeof raw !== 'object') return base
  const input = raw as Record<string, unknown>
  const pick = (v: unknown) =>
    Array.isArray(v)
      ? v
          .filter(
            (id): id is string =>
              typeof id === 'string' &&
              (CHARACTER_IDS.includes(id) || id.startsWith(PACK_ID_PREFIX))
          )
          .slice(0, 12)
      : []
  return { favorites: pick(input.favorites), recent: pick(input.recent) }
}

/** 校验整体状态（也用于导入 JSON） */
export function sanitizeState(raw: unknown): AppearanceState {
  const fallback = defaultState()
  if (!raw || typeof raw !== 'object') return fallback
  const input = raw as Record<string, unknown>

  const themeId = validThemeId(input.themeId) ?? fallback.themeId
  const theme = getTheme(themeId)

  const perThemeInput = (input.perTheme ?? {}) as Record<string, unknown>
  const perTheme: Partial<Record<ThemeId, ThemePersonalization>> = {}
  for (const id of THEME_IDS) {
    if (perThemeInput[id] !== undefined) {
      perTheme[id] = sanitizePersonalization(id, perThemeInput[id])
    }
  }

  const desiredMode = input.mode === 'dark' ? 'dark' : input.mode === 'light' ? 'light' : null

  return {
    version: APPEARANCE_VERSION,
    themeId,
    mode: theme.modes.length === 1 ? theme.modes[0] : (desiredMode ?? theme.defaultMode),
    followSystem: input.followSystem === true,
    perTheme,
    presets: sanitizePresets(input.presets),
    atmosphere: sanitizeAtmosphere(input.atmosphere),
    color: sanitizeColor(input.color),
    characterLibrary: sanitizeLibrary(input.characterLibrary),
  }
}

export function loadState(): AppearanceState {
  if (typeof window === 'undefined') return defaultState()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState()
    return sanitizeState(JSON.parse(raw))
  } catch {
    // 坏 JSON 直接重置，避免每次启动都抛错
    return defaultState()
  }
}

export function saveState(state: AppearanceState): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // 存储被禁用（隐私模式/配额满）时静默跳过，界面仍然可用
  }
}

/** 导出为可读 JSON */
export function exportState(state: AppearanceState): string {
  const payload = {
    app: 'timegrid',
    kind: 'appearance',
    version: APPEARANCE_VERSION,
    exportedAt: new Date().toISOString(),
    state,
  }
  return JSON.stringify(payload, null, 2)
}

export type ImportResult =
  | { ok: true; state: AppearanceState }
  | { ok: false; error: string }

/** 导入：严格校验结构 + 数值范围 */
export function importState(text: string): ImportResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return { ok: false, error: '不是合法的 JSON 文件' }
  }
  if (!parsed || typeof parsed !== 'object') {
    return { ok: false, error: '文件内容为空或格式不对' }
  }
  const rec = parsed as Record<string, unknown>
  const state = rec.state && typeof rec.state === 'object' ? rec.state : rec
  if (typeof (state as Record<string, unknown>).themeId !== 'string') {
    return { ok: false, error: '缺少主题字段，可能不是外观配置文件' }
  }
  if (!validThemeId((state as Record<string, unknown>).themeId)) {
    return { ok: false, error: '主题标识无法识别' }
  }
  return { ok: true, state: sanitizeState(state) }
}

/** 取某主题的有效个性化（没有就用主题默认） */
export function personalizationFor(
  state: AppearanceState,
  id: ThemeId
): ThemePersonalization {
  return state.perTheme[id] ?? defaultPersonalization(id)
}

export { DEFAULT_RADIUS, THEMES }
