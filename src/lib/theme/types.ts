// ============================================================
// 主题系统的类型契约
//
// 分工：
// - CSS（src/styles/theme-*.css）保存每套主题的调色板与结构规则
// - 本模块只保存元数据（名称、描述、预览色、默认个性化）
// 这样调色板只有一份，不会出现 TS 与 CSS 两处漂移。
// ============================================================

export type ThemeMode = 'light' | 'dark'

export type ThemeId = 'fluent' | 'anime' | 'cyber' | 'minimal' | 'pixel' | 'bento'

export type MotionLevel = 'off' | 'low' | 'standard' | 'high'

export type FontId = 'theme' | 'system' | 'rounded' | 'mono' | 'serif'

/** 可调的四类圆角（px） */
export interface RadiusSettings {
  button: number
  card: number
  input: number
  dialog: number
}

/** 单套主题下的个性化覆盖（每套主题各存一份，互不污染） */
export interface ThemePersonalization {
  /** 自定义强调色；空表示用主题自带强调色 */
  accent: string | null
  radius: RadiusSettings
  /** 界面缩放 0.8 / 0.9 / 1 / 1.1 / 1.25 / 1.5 */
  scale: number
  fontId: FontId
  /** 正文基准字号倍率 */
  typeScale: number
  /** 标题倍率 */
  titleScale: number
  motion: MotionLevel
}

export interface ThemePreview {
  background: string
  surface: string
  text: string
  accent: string
  accentSoft: string
}

export interface ThemeDefinition {
  id: ThemeId
  /** 中文名 */
  name: string
  /** 英文名，用于强调 */
  latinName: string
  /** 一句话定位 */
  tagline: string
  /** 详细描述（设置页展示） */
  description: string
  /** 设计关键词 */
  keywords: string[]
  /** 支持的明暗模式；只有一个表示该主题会强制该模式 */
  modes: ThemeMode[]
  defaultMode: ThemeMode
  /** 预览卡配色（与 CSS 调色板保持一致，仅用于小尺寸预览） */
  preview: Record<ThemeMode, ThemePreview>
  /** 该主题的默认个性化参数 */
  defaults: ThemePersonalization
  /** 是否为新用户默认推荐 */
  recommended?: boolean
}

/** 用户保存的自定义预设 */
export interface UserPreset {
  id: string
  name: string
  baseThemeId: ThemeId
  personalization: ThemePersonalization
  createdAt: string
}

/** 沉浸氛围：场景、角色、短句、动画 */
/** 沉浸 / 纯净两种工作模式 */
export type AtmosphereMode = 'immersive' | 'pure'

/** 角色停靠位置 */
export type CharacterPosition = 'bottom-left' | 'bottom-right' | 'hero' | 'sidebar'

export interface AtmosphereSettings {
  /** 总开关：关掉后只剩基础 UI */
  enabled: boolean
  /** 沉浸模式（全开） / 纯净工作模式（隐藏角色、弱化背景、减少动画） */
  mode: AtmosphereMode
  /** 氛围动画（樱花/星点/扫描线/像素粒子） */
  animations: boolean
  /** 每套主题各自选中的场景；没有则用该主题默认场景 */
  sceneByTheme: Partial<Record<ThemeId, string>>
  /** 每天首次打开时轮换一张（同一天稳定） */
  rotateScenes: boolean
  /** 是否显示角色 */
  characterEnabled: boolean
  /** 每套主题各自选中的角色 */
  characterByTheme: Partial<Record<ThemeId, string>>
  /** 角色尺寸百分比 60-160 */
  characterSize: number
  /** 角色停靠位置 */
  characterPosition: CharacterPosition
  /** 角色不透明度 30-100 */
  characterOpacity: number
  /** 角色待机/切换动画 */
  characterAnimate: boolean
  /** 表情跟随真实状态自动切换 */
  characterAutoState: boolean
  /** 角色说欢迎语/台词 */
  characterWelcome: boolean
  /** 选中的自定义角色素材 id */
  customCharacterId: string | null
  /** 角色库里的角色 id（优先于按主题的默认角色） */
  characterId: string | null
  /** 是否显示每日一句 */
  quoteEnabled: boolean
  /** 用户自定义短句（按主题分开） */
  customQuotes: Partial<Record<ThemeId, string[]>>
  /** 背景来源：内置场景 / 自定义图片 */
  bgSource: 'scene' | 'custom'
  /** 选中的自定义背景素材 id */
  customBackgroundId: string | null
  /** 背景可见度 0-100 */
  bgOpacity: number
  /** 背景模糊 0-20px */
  bgBlur: number
  /** 背景压暗 0-60（越大越暗） */
  bgDarken: number
  /** 遮罩强度 0-100（保证文字可读） */
  bgMask: number
  /** 色相偏移 -30..30 */
  bgHue: number
  /** 亮度 70-130 */
  bgBrightness: number
  /** 完成任务时是否放轻量庆祝效果 */
  celebration: boolean
  /** 是否显示每日开场页 */
  welcome: boolean
}

/** 配色联动模式 */
export type ColorMode = 'theme' | 'wallpaper' | 'accent' | 'locked'

export interface ColorSettings {
  /** theme=跟随主题；wallpaper=背景取色；accent=强调色联动；locked=锁背景只调 UI */
  mode: ColorMode
  /** 协调强度 0-100，只影响叠加层与卡片/边框染色 */
  strength: number
  /** 当前生效的种子色 */
  seed: string | null
  /** 已解析的调色板（持久化，重启不必重新取色） */
  palette: ColorPaletteSnapshot | null
  /** 背景取色得到的候选种子 */
  candidates: string[]
  /** 锁定模式下的背景主色，用于提示冲突程度 */
  lockedSeed: string | null
}

/** 调色板快照（与 color.ts 的 ColorPalette 同构，独立声明以免 storage 依赖运行时模块） */
export interface ColorPaletteSnapshot {
  seed: string
  primary: string
  onPrimary: string
  primaryContainer: string
  secondary: string
  tertiary: string
  ambient: string
  overlay: string
  cardTint: string
  borderTint: string
  selection: string
  dark: boolean
}

/** 持久化的整体外观状态 */
export interface AppearanceState {
  version: number
  themeId: ThemeId
  mode: ThemeMode
  /** 明暗跟随系统（仅对支持双模式的主题生效） */
  followSystem: boolean
  /** 每套主题各自的个性化覆盖 */
  perTheme: Partial<Record<ThemeId, ThemePersonalization>>
  presets: UserPreset[]
  atmosphere: AtmosphereSettings
  /** 智能配色 */
  color: ColorSettings
  /** 角色库收藏与最近使用 */
  characterLibrary: { favorites: string[]; recent: string[] }
}
