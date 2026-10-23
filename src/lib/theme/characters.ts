// ============================================================
// 角色库：分类 / 推荐配色 / 本地素材包
//
// 当前内置角色只有 PIX（时栖原创像素冒险者）。
// 其余角色一律来自用户自己的本地素材包：
//   %APPDATA%\时栖\characters\<包名>\manifest.json + 图片
// 见 docs/ATMOSPHERE_PACKS.md。
//
// `artId` 为 null 表示"有推荐位但没有内置立绘"，只会出现在
// 「待导入」列表里，不会被当成已安装角色。
// ============================================================

import type { CharacterExpression } from './atmosphere'
import type { ThemeId } from './types'

export type CharacterCategory = 'original' | 'custom'

export const CATEGORY_LABELS: Record<CharacterCategory, string> = {
  original: '时栖原创',
  custom: '用户自定义',
}

export interface CharacterRecommendation {
  themeId: ThemeId
  sceneId: string
  /** 推荐的强调色（hex） */
  accent: string
}

export interface CharacterEntry {
  id: string
  name: string
  /** 来源作品；原创角色填「时栖」 */
  work: string
  categories: CharacterCategory[]
  tags: string[]
  /** 内置美术的 key；null = 尚未内置立绘 */
  artId: string | null
  /** 素材形态：多表情 / 单立绘 / 仅头像 / 仅默认图 */
  form: 'full' | 'single' | 'avatar' | 'default'
  /** 一句话简介（详情页用） */
  description?: string
  recommend: CharacterRecommendation
}

/** 全部内置角色（本地素材包不走这张表） */
export const CHARACTER_LIBRARY: CharacterEntry[] = [
  {
    id: 'pixel-pix',
    name: 'PIX',
    work: '时栖',
    categories: ['original'],
    tags: ['像素', '冒险者', '原创'],
    artId: 'pixel-pix',
    form: 'full',
    recommend: { themeId: 'pixel', sceneId: 'pixel-town', accent: '#d7263d' },
  },
]

export const CHARACTER_IDS = CHARACTER_LIBRARY.map((c) => c.id)

/** 已内置立绘的角色 */
export function installedCharacters(): CharacterEntry[] {
  return CHARACTER_LIBRARY.filter((c) => c.artId !== null)
}

/** 只有推荐位、等用户导入的角色 */
export function pendingCharacters(): CharacterEntry[] {
  return CHARACTER_LIBRARY.filter((c) => c.artId === null)
}

export function getCharacterEntry(id: string | null | undefined): CharacterEntry | null {
  if (!id) return null
  return CHARACTER_LIBRARY.find((c) => c.id === id) ?? null
}

/** 关键词搜索：角色名、作品名、标签（本地素材包在上层单独过滤） */
export function searchCharacters(query: string): CharacterEntry[] {
  const q = query.trim().toLowerCase()
  if (!q) return CHARACTER_LIBRARY
  return CHARACTER_LIBRARY.filter((c) => {
    const haystack = [c.name, c.work, ...c.tags].join(' ').toLowerCase()
    return haystack.includes(q)
  })
}

/** 分类过滤（'all' 表示全部） */
export function filterByCategory(
  list: CharacterEntry[],
  category: CharacterCategory | 'all'
): CharacterEntry[] {
  if (category === 'all') return list
  return list.filter((c) => c.categories.includes(category))
}

/** 统计每个分类下的角色数量（只算已安装的） */
export function categoryCounts(): Record<string, number> {
  const installed = installedCharacters()
  const counts: Record<string, number> = { all: installed.length }
  for (const key of Object.keys(CATEGORY_LABELS) as CharacterCategory[]) {
    counts[key] = installed.filter((c) => c.categories.includes(key)).length
  }
  return counts
}

/** 按作品分组（用于"按作品筛选"） */
export function worksOf(list: CharacterEntry[]): string[] {
  return Array.from(new Set(list.map((c) => c.work)))
}

/** 角色支持的表情：默认 5 态 */
export function expressionsOf(_entry: CharacterEntry): CharacterExpression[] {
  return ['idle', 'happy', 'thinking', 'working', 'error']
}

/** 解析出可直接渲染的角色形象；没有内置美术时返回 null */
export function figureOf(id: string | null | undefined): {
  id: string
  name: string
  artId: string
  work: string
  expressions: CharacterExpression[]
} | null {
  const entry = getCharacterEntry(id)
  if (!entry || !entry.artId) return null
  return {
    id: entry.id,
    name: entry.name,
    artId: entry.artId,
    work: entry.work,
    expressions: expressionsOf(entry),
  }
}

/** 作品 → 系列主色（卡片装饰的视觉锚点） */
export const SERIES_ACCENT: Record<string, string> = {
  时栖: '#d7263d',
}

export function seriesAccentOf(work: string): string {
  return SERIES_ACCENT[work] ?? '#7c6bb0'
}

/** 本地素材包在库里的 id 前缀，用来区分来源 */
export const PACK_ID_PREFIX = 'pack-'

export function isPackId(id: string | null | undefined): boolean {
  return !!id && id.startsWith(PACK_ID_PREFIX)
}

/** 一句话简介（详情页展示） */
const DESCRIPTIONS: Record<string, string> = {
  'pixel-pix': '时栖的像素冒险者。把所有待办都当成主线任务。',
}

export function descriptionOf(id: string | null | undefined): string | undefined {
  return id ? DESCRIPTIONS[id] : undefined
}

/** 作品 → 系列装饰 key（卡片角落装饰，纯 CSS） */
export type SeriesKey = 'original' | 'custom'

export function seriesKeyOf(work: string): SeriesKey {
  return work === '时栖' ? 'original' : 'custom'
}
