'use client'

// ============================================================
// 角色详情面板（轻量弹窗）
//
// 大图 + 名称/作品/简介 + 推荐主题/场景/配色 + 设为陪伴角色 + 收藏。
// 素材包还可以在这里替换图片。
// ============================================================

import { useState } from 'react'
import { Check, Heart, Sparkles, Trash2, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getTheme } from '@/lib/theme/themes'
import { EXPRESSION_LABELS, getScene, type CharacterExpression } from '@/lib/theme/atmosphere'
import { packLinesFor } from '@/lib/atmosphere/pack-dialogue'
import { seriesAccentOf } from '@/lib/theme/characters'
import { CharacterVisual, type LibraryItem } from './character-card'

export function CharacterDetail({
  item,
  active,
  favorite,
  onClose,
  onSelect,
  onToggleFavorite,
  onApplyRecommendation,
  onReplace,
  onDeletePack,
}: {
  item: LibraryItem
  active: boolean
  favorite: boolean
  onClose: () => void
  onSelect: () => void
  onToggleFavorite: () => void
  onApplyRecommendation: () => void
  onReplace: () => void
  onDeletePack?: () => void
}) {
  const accent = seriesAccentOf(item.work)
  const [expression, setExpression] = useState<CharacterExpression>('idle')
  const [lineIndex, setLineIndex] = useState(0)
  const previewLines = packLinesFor(item.dialogue, expression)
  const previewLine = previewLines[lineIndex % (previewLines.length || 1)]
  const sceneName = getScene(item.recommend.sceneId)?.name ?? item.recommend.sceneId

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`${item.name} 的角色详情`}
      onClick={onClose}
      data-testid="character-detail"
    >
      <div
        className="surface relative max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-xl sm:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-2 top-2 z-10 rounded-full bg-black/25 p-1.5 text-white backdrop-blur-[2px] ui-transition hover:bg-black/40"
          aria-label="关闭详情"
        >
          <X className="h-4 w-4" />
        </button>

        {/* 大图 */}
        <div
          className="relative mx-auto flex h-72 w-[216px] items-center justify-center overflow-hidden rounded-md"
          data-testid="detail-art"
          style={{
            background: `radial-gradient(120% 90% at 50% 0%, ${accent}33, transparent 62%), var(--surface-2)`,
          }}
        >
          <CharacterVisual item={item} expression={expression} className="h-full w-full" />
          <span
            className="absolute left-0 top-0 rounded-br-md px-2 py-1 text-micro font-medium text-white/95"
            style={{ backgroundColor: `${accent}dd` }}
          >
            {item.work}
          </span>
        </div>

        <div className="space-y-3 p-4">
          {item.packId && (
            <div className="space-y-2" aria-label="表情与台词预览">
              <div className="flex flex-wrap gap-1">
                {(Object.keys(EXPRESSION_LABELS) as CharacterExpression[]).map((mood) => (
                  <button key={mood} type="button" aria-pressed={expression === mood}
                    className={cn('rounded-md border px-2 py-1 text-caption', expression === mood && 'border-primary text-primary')}
                    onClick={() => { setExpression(mood); setLineIndex(0) }}>
                    {EXPRESSION_LABELS[mood]}
                  </button>
                ))}
              </div>
              {previewLine && <div className="rounded-lg border border-border bg-surface-2 p-3 text-caption" role="status">{previewLine}</div>}
              {previewLines.length > 1 && <button type="button" className="text-caption text-primary" onClick={() => setLineIndex((i) => i + 1)}>换句台词</button>}
              <p className="text-micro text-muted-foreground">点击角色可弹出台词；没有独立表情图时使用默认图。</p>
            </div>
          )}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-title text-foreground">{item.name}</h3>
              <p className="mt-0.5 text-caption text-muted-foreground">
                {item.work}
                {item.packId && ' · 本地素材'}
              </p>
            </div>
            <button
              type="button"
              onClick={onToggleFavorite}
              aria-pressed={favorite}
              aria-label={favorite ? '取消收藏' : '收藏'}
              className={cn(
                'rounded-full border border-border p-2 ui-transition',
                favorite ? 'text-amber-500' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Heart className={cn('h-4 w-4', favorite && 'fill-current')} />
            </button>
          </div>

          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full px-2 py-0.5 text-micro text-muted-foreground"
                  style={{ backgroundColor: `${accent}18` }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {item.description && (
            <p className="text-caption leading-relaxed text-muted-foreground">{item.description}</p>
          )}

          {/* 推荐搭配 */}
          <div className="rounded-md border border-border bg-surface-2/60 p-2.5">
            <p className="flex flex-wrap items-center gap-1.5 text-micro text-muted-foreground">
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              推荐搭配
              <span className="text-foreground">{getTheme(item.recommend.themeId).name}</span>
              <span aria-hidden="true">·</span>
              <span className="text-foreground">{sceneName}</span>
              <span aria-hidden="true">·</span>
              <span
                className="inline-block h-3 w-3 rounded-full border border-border"
                style={{ backgroundColor: item.recommend.accent }}
              />
              <span className="font-mono text-[10px]">{item.recommend.accent}</span>
            </p>
            <Button
              size="sm"
              variant="outline"
              className="mt-2 h-7 w-full text-caption"
              onClick={onApplyRecommendation}
              data-testid="detail-apply-recommend"
            >
              应用这套搭配
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              className="h-9 flex-1 gap-1"
              onClick={onSelect}
              disabled={active}
              data-testid="detail-select"
            >
              {active ? (
                <>
                  <Check className="h-4 w-4" />
                  正在陪伴
                </>
              ) : (
                '设为陪伴角色'
              )}
            </Button>
            <Button variant="outline" className="h-9 gap-1" onClick={onReplace}>
              <Upload className="h-3.5 w-3.5" />
              替换图片
            </Button>
            {onDeletePack && (
              <Button
                variant="ghost"
                className="h-9 px-2 text-muted-foreground hover:text-destructive"
                onClick={onDeletePack}
                aria-label="删除这个本地角色包"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
