'use client'

// ============================================================
// 角色资料卡 / 角色详情
//
// 卡片不是"头像 + 名字"：主视觉占卡片主体，作品名做成系列丝带，
// 底部是名字与标签，右上角收藏，选中态有描边与勾选。
// 本地素材包优先使用用户提供的图，没有才退回内置立绘。
// ============================================================

import { useMemo } from 'react'
import { Check, Star, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { renderCharacter } from '@/components/atmosphere/art/registry'
import { seriesAccentOf, seriesKeyOf, type CharacterCategory } from '@/lib/theme/characters'
import type { CharacterExpression } from '@/lib/theme/atmosphere'
import type { ThemeId } from '@/lib/theme/types'
import type { PackDialogue } from '@/lib/atmosphere/pack-dialogue'

export interface LibraryItem {
  id: string
  name: string
  work: string
  tags: string[]
  categories: CharacterCategory[]
  /** 内置立绘 key；本地素材包为 null */
  artId: string | null
  /** 本地素材包 id；内置为 null */
  packId: string | null
  /** 素材包展示图 URL */
  displayUrl: string | null
  /** 素材包状态图解析器 */
  stateUrls: Partial<Record<CharacterExpression, string>> | null
  recommend: { themeId: ThemeId; sceneId: string; accent: string }
  description?: string
  dialogue?: PackDialogue
  /** pending = 只有推荐位，没有图 */
  source: 'builtin' | 'pack' | 'pending'
}

/** 统一的"角色图像"渲染：素材包用 <img>，内置用 SVG */
export function CharacterVisual({
  item,
  expression = 'idle',
  className,
  fit = 'contain',
}: {
  item: LibraryItem
  expression?: CharacterExpression
  className?: string
  fit?: 'contain' | 'cover'
}) {
  const { stateUrls, displayUrl, artId } = item
  const url = useMemo(() => {
    if (!stateUrls) return displayUrl
    return stateUrls[expression] ?? stateUrls.idle ?? displayUrl
  }, [stateUrls, displayUrl, expression])

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- 本地素材是运行时 object URL
      <img
        src={url}
        alt={item.name}
        className={cn(fit === 'cover' ? 'object-cover' : 'object-contain', className)}
        draggable={false}
      />
    )
  }
  if (artId) {
    return renderCharacter(artId, { expression, className })
  }
  return null
}

export function CharacterCard({
  item,
  active,
  favorite,
  onSelect,
  onToggleFavorite,
  onOpen,
  onImport,
}: {
  item: LibraryItem
  active: boolean
  favorite: boolean
  onSelect: () => void
  onToggleFavorite: () => void
  onOpen: () => void
  onImport: () => void
}) {
  // 本地素材包用它自己 manifest 里声明的强调色，内置角色用作品主色
  const accent = item.source === 'pack' ? item.recommend.accent : seriesAccentOf(item.work)
  const missing = item.source === 'pending'

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-lg border transition-[transform,border-color,box-shadow] duration-200',
        active
          ? 'border-primary shadow-[0_0_0_1px_var(--primary),var(--shadow-card)]'
          : 'border-border hover:-translate-y-0.5 hover:border-border-strong hover:shadow-[var(--shadow-card)]'
      )}
      data-testid={`character-card-${item.id}`}
      data-active={active ? 'true' : 'false'}
      data-series={seriesKeyOf(item.work)}
    >
      {/* 主视觉区：占卡片 3/4，系列色做底 */}
      <button
        type="button"
        onClick={missing ? onImport : onOpen}
        // 主视觉按 3:4 立绘比例，避免竖幅图两侧留白
        className="relative block aspect-[3/4] w-full overflow-hidden text-left"
        aria-label={missing ? `为 ${item.name} 导入立绘` : `查看 ${item.name} 详情`}
        style={{
          background: `linear-gradient(160deg, ${accent}22, transparent 58%), var(--surface-2)`,
        }}
      >
        {missing ? (
          <span className="flex h-full flex-col items-center justify-center gap-1.5 text-muted-foreground">
            <Upload className="h-5 w-5" aria-hidden="true" />
            <span className="text-micro">待导入立绘</span>
          </span>
        ) : (
          <CharacterVisual
            item={item}
            className="h-full w-full transition-transform duration-300 group-hover:scale-[1.03]"
          />
        )}

        {/* 系列装饰：不同作品不同的角落气质 */}
        <span className="series-corner" aria-hidden="true" />

        {/* 作品丝带 */}
        <span
          className="absolute left-0 top-0 max-w-[calc(100%-2.5rem)] truncate rounded-br-md px-1.5 py-0.5 text-[10px] font-medium text-white/95 backdrop-blur-[2px]"
          style={{ backgroundColor: `${accent}dd` }}
        >
          {item.work}
        </span>

        {/* 选中标记 */}
        {active && (
          <span className="absolute bottom-1.5 left-1.5 flex items-center gap-0.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground shadow">
            <Check className="h-2.5 w-2.5" aria-hidden="true" />
            使用中
          </span>
        )}
        {item.packId && (
          <span className="absolute bottom-1.5 right-1.5 rounded-full bg-black/55 px-1.5 py-0.5 text-[10px] text-white backdrop-blur-[2px]">
            本地素材
          </span>
        )}
      </button>

      {/* 收藏 */}
      <button
        type="button"
        onClick={onToggleFavorite}
        aria-label={favorite ? `取消收藏 ${item.name}` : `收藏 ${item.name}`}
        aria-pressed={favorite}
        className={cn(
          'absolute right-1 top-1 rounded-full bg-black/25 p-1 backdrop-blur-[2px] transition-colors',
          favorite ? 'text-amber-300' : 'text-white/70 hover:text-white'
        )}
      >
        <Star className={cn('h-3.5 w-3.5', favorite && 'fill-current')} />
      </button>

      {/* 信息区 */}
      <div className="flex items-start justify-between gap-1 px-2 py-1.5">
        <button
          type="button"
          onClick={onSelect}
          disabled={missing}
          className="min-w-0 flex-1 text-left disabled:cursor-not-allowed"
        >
          <span className="block truncate text-caption font-medium text-foreground">{item.name}</span>
          <span className="mt-0.5 flex flex-wrap gap-1">
            {item.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="rounded-sm px-1 py-px text-[10px] leading-tight text-muted-foreground"
                style={{ backgroundColor: `${accent}18` }}
              >
                {tag}
              </span>
            ))}
          </span>
        </button>
        <button
          type="button"
          onClick={onSelect}
          disabled={missing}
          className={cn(
            'mt-0.5 shrink-0 rounded-md px-1.5 py-0.5 text-[10px] ui-transition',
            active
              ? 'bg-primary/12 text-primary'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            missing && 'opacity-40'
          )}
        >
          {active ? '已选' : '选用'}
        </button>
      </div>
    </div>
  )
}
