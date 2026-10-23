'use client'

// ============================================================
// 角色库（资料卡版）
//
// 三种来源合并成一个列表：
// 1. 本地素材包（模式 A，优先）—— 用户放进 characters/ 的文件夹
// 2. 内置立绘（模式 B，分系列重绘）
// 3. 待导入推荐位 —— 只有配色与主题推荐
//
// 卡片是"资料卡"而不是头像卡：主视觉、作品丝带、标签、收藏、选中态。
// 点卡片开详情，点「选用」直接换成陪伴角色。
// ============================================================

import { useEffect, useMemo, useRef, useState } from 'react'
import { FolderPlus, Heart, Link2, Search, Upload, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useAppearance } from '@/providers/appearance-provider'
import {
  CATEGORY_LABELS,
  installedCharacters,
  pendingCharacters,
  descriptionOf,
  worksOf,
  type CharacterCategory,
  type CharacterEntry,
} from '@/lib/theme/characters'
import { addAsset } from '@/lib/atmosphere/custom-assets'
import {
  deletePack,
  displayUrl,
  importPackFiles,
  importPackFromUrl,
  importScannedPacks,
  scanDesktopPacks,
  stateUrl,
  useCharacterPacks,
  useLoadPacks,
} from '@/lib/atmosphere/character-packs'
import type { CharacterExpression } from '@/lib/theme/atmosphere'
import type { ThemeId } from '@/lib/theme/types'
import { CharacterCard, type LibraryItem } from './character-card'
import { CharacterDetail } from './character-detail'

const CATEGORY_ORDER: (CharacterCategory | 'all')[] = ['all', 'original', 'custom']

const DEFAULT_RECOMMEND = {
  themeId: 'bento' as ThemeId,
  sceneId: 'bento-mesh',
  accent: '#7c6bb0',
}

function fromEntry(entry: CharacterEntry): LibraryItem {
  return {
    id: entry.id,
    name: entry.name,
    work: entry.work,
    tags: entry.tags,
    categories: entry.categories,
    artId: entry.artId,
    packId: null,
    displayUrl: null,
    stateUrls: null,
    recommend: entry.recommend,
    description: entry.description ?? descriptionOf(entry.id),
    source: entry.artId ? 'builtin' : 'pending',
  }
}

export function CharacterLibraryPanel() {
  const {
    state,
    patchAtmosphere,
    setThemeId,
    applySeed,
    selectCharacter,
    toggleFavoriteCharacter,
  } = useAppearance()
  const packs = useCharacterPacks()
  useLoadPacks()
  const [note, setNote] = useState<string | null>(null)

  // 桌面版：打开设置页时顺手扫一次 <userData>/characters
  useEffect(() => {
    let cancelled = false
    void (async () => {
      const scanned = await scanDesktopPacks()
      if (cancelled || scanned.length === 0) return
      const result = await importScannedPacks(scanned)
      if (!cancelled && result.imported.length > 0) {
        setNote(`已从本地目录载入 ${result.imported.length} 个角色包：${result.imported.join('、')}`)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CharacterCategory | 'all'>('all')
  const [work, setWork] = useState<string>('all')
  const [detailId, setDetailId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [urlOpen, setUrlOpen] = useState(false)
  const [urlValue, setUrlValue] = useState('')
  const folderInput = useRef<HTMLInputElement>(null)
  const singleInput = useRef<HTMLInputElement>(null)

  const allItems = useMemo<LibraryItem[]>(() => {
    const builtin = installedCharacters().map(fromEntry)
    const packItems: LibraryItem[] = packs.map((pack) => {
      const stateUrls: Partial<Record<CharacterExpression, string>> = {}
      for (const st of ['idle', 'happy', 'thinking', 'working', 'error', 'sleepy'] as CharacterExpression[]) {
        const url = stateUrl(pack, st)
        if (url) stateUrls[st] = url
      }
      const manifest = pack.manifest
      const accent = manifest.preferred_accent
      return {
        id: pack.id,
        name: manifest.name ?? '未命名角色',
        work: manifest.series ?? '本地素材',
        tags: manifest.tags ?? [],
        categories: ['custom'],
        artId: null,
        packId: pack.id,
        displayUrl: displayUrl(pack),
        stateUrls,
        recommend: {
          themeId: (manifest.preferred_theme as ThemeId) ?? DEFAULT_RECOMMEND.themeId,
          sceneId: manifest.preferred_background ?? DEFAULT_RECOMMEND.sceneId,
          accent:
            accent && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(accent)
              ? accent
              : DEFAULT_RECOMMEND.accent,
        },
        description: manifest.description,
        dialogue: manifest.dialogue,
        source: 'pack' as const,
      }
    })
    const pending = pendingCharacters().map(fromEntry)
    return [...packItems, ...builtin, ...pending]
  }, [packs])

  const installedItems = useMemo(
    () => allItems.filter((i) => i.source !== 'pending'),
    [allItems]
  )
  const favorites = state.characterLibrary.favorites
  const recent = state.characterLibrary.recent
  const selectedId = state.atmosphere.characterId

  const list = useMemo(() => {
    let out = allItems
    const q = query.trim().toLowerCase()
    if (q) {
      out = out.filter((i) => [i.name, i.work, ...i.tags].join(' ').toLowerCase().includes(q))
    }
    if (category === 'custom') out = out.filter((i) => i.source === 'pack')
    else if (category !== 'all') out = out.filter((i) => i.categories.includes(category))
    if (work !== 'all') out = out.filter((i) => i.work === work)
    return out
  }, [allItems, query, category, work])

  const works = useMemo(
    () => worksOf(installedItems.map((i) => ({ work: i.work } as CharacterEntry))),
    [installedItems]
  )

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: installedItems.length, custom: packs.length }
    for (const key of Object.keys(CATEGORY_LABELS) as CharacterCategory[]) {
      c[key] = installedItems.filter((i) => i.categories.includes(key)).length
    }
    return c
  }, [installedItems, packs.length])

  const favoriteItems = useMemo(
    () =>
      favorites
        .map((id) => allItems.find((i) => i.id === id))
        .filter((i): i is LibraryItem => !!i),
    [favorites, allItems]
  )
  const recentItems = useMemo(
    () =>
      recent
        .map((id) => allItems.find((i) => i.id === id))
        .filter((i): i is LibraryItem => !!i)
        .slice(0, 6),
    [recent, allItems]
  )

  const detail = useMemo(
    () => (detailId ? allItems.find((i) => i.id === detailId) ?? null : null),
    [detailId, allItems]
  )

  const applyRecommendationOf = (item: LibraryItem) => {
    const { themeId, sceneId, accent } = item.recommend
    setThemeId(themeId)
    patchAtmosphere({
      enabled: true,
      mode: 'immersive',
      sceneByTheme: { ...state.atmosphere.sceneByTheme, [themeId]: sceneId },
      bgSource: 'scene',
    })
    applySeed(accent, 'accent')
    setNote(`已应用「${item.name}」的推荐搭配`)
  }

  const handleFolder = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setBusy(true)
    const result = await importPackFiles(files)
    setBusy(false)
    if (result.imported.length > 0) {
      setNote(
        `导入 ${result.imported.length} 个角色包：${result.imported.join('、')}` +
          (result.skipped.length ? `；跳过 ${result.skipped.join('、')}` : '')
      )
    } else {
      setNote(result.error ?? '导入失败')
    }
  }

  const handleSingle = async (item: LibraryItem | null, file: File | undefined) => {
    if (!file) return
    const result = await addAsset(file, {
      kind: 'character',
      name: item ? `${item.name}（导入）` : '自定义角色',
    })
    if (!result.ok) {
      setNote(result.error)
      return
    }
    patchAtmosphere({
      customCharacterId: result.asset.id,
      characterEnabled: true,
      mode: 'immersive',
    })
    setNote(`已导入 ${file.name}`)
  }

  return (
    <section className="surface p-4" data-testid="character-library">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <UserRound className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h2 className="text-section text-foreground">角色库</h2>
            <p className="mt-0.5 text-caption text-muted-foreground">
              {packs.length > 0 && `${packs.length} 个本地素材包 · `}
              内置 {installedItems.length - packs.length} 个角色 · {pendingCharacters().length} 个待导入
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1"
            disabled={busy}
            onClick={() => folderInput.current?.click()}
            data-testid="import-character-pack"
          >
            <FolderPlus className="h-3.5 w-3.5" />
            {busy ? '导入中…' : '导入角色包'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1"
            onClick={() => setUrlOpen((v) => !v)}
            data-testid="import-from-url"
          >
            <Link2 className="h-3.5 w-3.5" />
            从链接添加
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 gap-1 text-muted-foreground"
            onClick={() => singleInput.current?.click()}
          >
            <Upload className="h-3.5 w-3.5" />
            单张立绘
          </Button>
          <input
            ref={folderInput}
            type="file"
            multiple
            className="hidden"
            {...({ webkitdirectory: '', directory: '' } as Record<string, string>)}
            onChange={(e) => {
              void handleFolder(e.target.files)
              e.target.value = ''
            }}
          />
          <input
            ref={singleInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              void handleSingle(null, e.target.files?.[0])
              e.target.value = ''
            }}
          />
        </div>
      </div>

      {urlOpen && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 rounded-md border border-border bg-surface-2/60 p-2">
          <Input
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
            placeholder="粘贴图片直链，例如 https://…/baobao.png"
            className="h-8 min-w-48 flex-1"
            aria-label="图片链接"
            data-testid="url-input"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                void (async () => {
                  setBusy(true)
                  const r = await importPackFromUrl(urlValue)
                  setBusy(false)
                  setNote(r.ok ? `已添加 ${r.imported[0]}` : r.error ?? '导入失败')
                  if (r.ok) {
                    setUrlValue('')
                    setUrlOpen(false)
                  }
                })()
              }
            }}
          />
          <Button
            size="sm"
            className="h-8"
            disabled={busy || !urlValue.trim()}
            data-testid="url-submit"
            onClick={async () => {
              setBusy(true)
              const r = await importPackFromUrl(urlValue)
              setBusy(false)
              setNote(r.ok ? `已添加 ${r.imported[0]}` : r.error ?? '导入失败')
              if (r.ok) {
                setUrlValue('')
                setUrlOpen(false)
              }
            }}
          >
            添加
          </Button>
          <span className="text-micro text-muted-foreground">
            图片只存在本机；需要对方允许跨域读取
          </span>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
        <div className="relative min-w-40 flex-1">
          <Search
            className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜角色名 / 作品名 / 标签…"
            className="h-8 pl-7"
            aria-label="搜索角色"
            data-testid="character-search"
          />
        </div>
        <select
          value={work}
          onChange={(e) => setWork(e.target.value)}
          className="h-8 rounded-md border border-input bg-background px-2 text-caption"
          aria-label="按作品筛选"
        >
          <option value="all">全部作品</option>
          {works.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        {CATEGORY_ORDER.map((key) => {
          const label = key === 'all' ? '全部角色' : CATEGORY_LABELS[key as CharacterCategory]
          const count = counts[key] ?? 0
          return (
            <button
              key={key}
              type="button"
              aria-pressed={category === key}
              onClick={() => setCategory(key)}
              disabled={count === 0 && key !== 'all'}
              className={cn(
                'flex h-7 items-center gap-1 rounded-full px-2.5 text-caption ui-transition',
                category === key
                  ? 'bg-primary/12 font-medium text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                count === 0 && key !== 'all' && 'opacity-40'
              )}
            >
              {label}
              <span className="text-[10px] tabular-nums opacity-70">{count}</span>
            </button>
          )
        })}
      </div>

      {(favoriteItems.length > 0 || recentItems.length > 0) && (
        <div className="mt-2 flex flex-wrap items-center gap-3 text-micro text-muted-foreground">
          {favoriteItems.length > 0 && (
            <span className="flex flex-wrap items-center gap-1">
              <Heart className="h-3 w-3" aria-hidden="true" />
              收藏
              {favoriteItems.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setDetailId(c.id)}
                  className={cn(
                    'rounded-full px-1.5 py-0.5 ui-transition hover:bg-accent',
                    selectedId === c.id && 'bg-primary/12 text-primary'
                  )}
                >
                  {c.name}
                </button>
              ))}
            </span>
          )}
          {recentItems.length > 0 && (
            <span className="flex flex-wrap items-center gap-1">
              最近
              {recentItems.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setDetailId(c.id)}
                  className={cn(
                    'rounded-full px-1.5 py-0.5 ui-transition hover:bg-accent',
                    selectedId === c.id && 'bg-primary/12 text-primary'
                  )}
                >
                  {c.name}
                </button>
              ))}
            </span>
          )}
        </div>
      )}

      <div className="mt-2 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
        {list.map((item) => (
          <CharacterCard
            key={item.id}
            item={item}
            active={selectedId === item.id}
            favorite={favorites.includes(item.id)}
            onSelect={() => selectCharacter(item.id)}
            onToggleFavorite={() => toggleFavoriteCharacter(item.id)}
            onOpen={() => setDetailId(item.id)}
            onImport={() => {
              setDetailId(item.id)
              singleInput.current?.click()
            }}
          />
        ))}
        {list.length === 0 && (
          <p className="col-span-full py-6 text-center text-caption text-muted-foreground">
            没有匹配的角色，换个关键词试试
          </p>
        )}
      </div>

      {note && <p className="mt-2 text-micro text-muted-foreground">{note}</p>}

      <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
        想用自己收藏的高清立绘？把 <span className="font-mono">characters/角色名/manifest.json</span>{' '}
        连同图片放进一个文件夹，点「导入角色包」选中整个文件夹即可；图片只存在本机，不上传。
        内置立绘为本项目绘制的同人风演绎（非官方素材），仅供本地体验。
      </p>

      {detail && (
        <CharacterDetail
          item={detail}
          active={selectedId === detail.id}
          favorite={favorites.includes(detail.id)}
          onClose={() => setDetailId(null)}
          onSelect={() => {
            selectCharacter(detail.id)
            setDetailId(null)
          }}
          onToggleFavorite={() => toggleFavoriteCharacter(detail.id)}
          onApplyRecommendation={() => applyRecommendationOf(detail)}
          onReplace={() => {
            setDetailId(null)
            singleInput.current?.click()
          }}
          onDeletePack={
            detail.packId
              ? async () => {
                  await deletePack(detail.packId as string)
                  if (selectedId === detail.id) selectCharacter(null)
                  setDetailId(null)
                  setNote(`已删除「${detail.name}」的本地素材包`)
                }
              : undefined
          }
        />
      )}
    </section>
  )
}
