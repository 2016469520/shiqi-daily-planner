'use client'

// ============================================================
// 智能配色面板
//
// 四个模式：
// - theme     跟随主题（不动任何变量）
// - wallpaper 从背景提取主色，生成整套调色板
// - accent    用你选的强调色推导背景氛围/卡片/边框
// - locked    锁住背景原图，只调 UI，并在冲突时给提示
//
// 协调强度只缩放"叠加层"（氛围光/蒙层/卡片/边框），
// 背景图与角色图本身永远不会被染色。
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Check,
  Contrast,
  Droplet,
  Palette,
  Pipette,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Undo2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import { useAppearance } from '@/providers/appearance-provider'
import { buildPalette, contrastRatio, hueClash, paletteSwatches } from '@/lib/theme/color'
import { getAssetUrl } from '@/lib/atmosphere/custom-assets'
import { palettesFromImageUrl } from '@/lib/theme/palette-from-image'
import { getScene } from '@/lib/theme/atmosphere'
import { useCurrentScene } from '@/components/atmosphere/use-current-scene'
import type { ColorMode, ColorSettings } from '@/lib/theme/types'

const MODES: { value: ColorMode; label: string; hint: string; icon: typeof Palette }[] = [
  {
    value: 'theme',
    label: '主题默认',
    hint: '完全使用主题自带的配色，不做任何联动',
    icon: Palette,
  },
  {
    value: 'wallpaper',
    label: '背景取色',
    hint: '分析当前背景的主色，生成协调的整套配色',
    icon: Pipette,
  },
  {
    value: 'accent',
    label: '强调色联动',
    hint: '改一个颜色，背景氛围/卡片/边框一起跟着变',
    icon: Droplet,
  },
  {
    value: 'locked',
    label: '锁定背景',
    hint: '背景原图不动，只调 UI，并提示冲突程度',
    icon: ShieldCheck,
  },
]

const PRESETS = ['#db2777', '#2563eb', '#7c3aed', '#059669', '#ea580c', '#0891b2', '#b45309', '#475569']

export function ColorPanel() {
  const { state, theme, patchColor, applySeed, setColorStrength, resetColor } = useAppearance()
  const color = state.color
  const scene = useCurrentScene()
  const snapshot = useRef<ColorSettings>(color)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)

  // 进入面板时留一份快照，供"撤销"使用
  useEffect(() => {
    snapshot.current = color
    // 只在首次挂载时记录，之后由用户显式撤销
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const palette = color.palette
  const seed = color.seed ?? (palette ? palette.seed : null)

  const customUrl = useRef<string | null>(null)

  const pickFromBackground = useCallback(async () => {
    setBusy(true)
    setNote(null)
    try {
      if (state.atmosphere.bgSource === 'custom' && state.atmosphere.customBackgroundId) {
        const url = customUrl.current ?? (await getAssetUrl(state.atmosphere.customBackgroundId))
        customUrl.current = url
        if (!url) {
          setNote('自定义背景还没加载好，稍后再试')
          return
        }
        const results = await palettesFromImageUrl(url, { strength: color.strength })
        if (results.length === 0) {
          setNote('这张图取不出合适的颜色，换一张试试')
          return
        }
        const best = results[0]
        patchColor({
          mode: 'wallpaper',
          seed: best.seed,
          palette: best,
          candidates: results.map((r) => r.seed),
          lockedSeed: results[0].seed,
        })
        setNote(`已从壁纸提取 ${results.length} 组配色`)
      } else {
        // 内置场景：用场景自带的主色调作为种子（比把 SVG 栅格化更稳、也更快）
        const tint = scene ? getScene(scene.id)?.tint : null
        if (!tint) {
          setNote('当前没有可分析的背景')
          return
        }
        const built = buildPalette(tint, color.strength, state.mode === 'dark')
        patchColor({
          mode: 'wallpaper',
          seed: built.seed,
          palette: built,
          candidates: [built.seed],
          lockedSeed: built.seed,
        })
        setNote('已按当前场景取色')
      }
    } finally {
      setBusy(false)
    }
  }, [
    color.strength,
    patchColor,
    scene,
    state.atmosphere.bgSource,
    state.atmosphere.customBackgroundId,
    state.mode,
  ])

  const clash =
    color.mode === 'locked' && color.lockedSeed && palette
      ? hueClash(color.lockedSeed, palette.primary)
      : null

  const readable = palette ? contrastRatio(palette.onPrimary, palette.primary) : null

  return (
    <section className="surface p-4" data-testid="color-panel">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Palette className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h2 className="text-section text-foreground">智能配色</h2>
            <p className="mt-0.5 text-caption text-muted-foreground">
              让强调色、背景氛围、卡片与边框一起协调，而不是只把按钮涂成一种颜色
            </p>
          </div>
        </div>
        <span className="shrink-0 text-micro text-muted-foreground">{theme.name}</span>
      </div>

      {/* 模式 */}
      <div className="grid grid-cols-2 gap-2 border-t border-border pt-3 sm:grid-cols-4">
        {MODES.map((mode) => {
          const active = color.mode === mode.value
          return (
            <button
              key={mode.value}
              type="button"
              onClick={() => {
                if (mode.value === 'theme') resetColor()
                else patchColor({ mode: mode.value })
              }}
              aria-pressed={active}
              data-testid={`color-mode-${mode.value}`}
              className={cn(
                'atmo-thumb flex flex-col gap-1 border p-2 text-left ui-transition',
                active
                  ? 'border-primary/60 bg-primary/[0.06]'
                  : 'border-border hover:bg-accent/60'
              )}
            >
              <span className="flex items-center gap-1.5 text-caption font-medium text-foreground">
                <mode.icon className="h-3.5 w-3.5" aria-hidden="true" />
                {mode.label}
              </span>
              <span className="text-[10px] leading-tight text-muted-foreground">{mode.hint}</span>
            </button>
          )
        })}
      </div>

      {/* 取色与种子色 */}
      <div className="mt-3 border-t border-border pt-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1"
            disabled={busy}
            onClick={() => void pickFromBackground()}
            data-testid="color-pick"
          >
            <Pipette className="h-3.5 w-3.5" />
            {busy ? '分析中…' : '从当前背景取色'}
          </Button>
          <label className="flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-border px-2.5 text-caption text-muted-foreground ui-transition hover:text-foreground">
            自定义主色
            <input
              type="color"
              value={seed ?? '#7c3aed'}
              onChange={(e) => applySeed(e.target.value, 'accent')}
              className="h-4 w-4 cursor-pointer border-0 bg-transparent p-0"
              aria-label="自定义主色"
            />
          </label>
          {PRESETS.map((hex) => (
            <button
              key={hex}
              type="button"
              aria-label={`主色 ${hex}`}
              onClick={() => applySeed(hex, 'accent')}
              className={cn(
                'h-7 w-7 rounded-full border-2 ui-transition',
                seed === hex ? 'border-foreground' : 'border-transparent'
              )}
              style={{ backgroundColor: hex }}
            >
              {seed === hex && <Check className="mx-auto h-3.5 w-3.5 text-white drop-shadow" />}
            </button>
          ))}
        </div>

        {(color.candidates.length > 1 || (palette && color.mode === 'wallpaper')) && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-micro text-muted-foreground">候选配色</span>
            {color.candidates.map((hex) => (
              <button
                key={hex}
                type="button"
                onClick={() => applySeed(hex, 'wallpaper')}
                aria-label={`候选 ${hex}`}
                className="h-5 w-5 rounded-full border border-border ui-transition hover:scale-110"
                style={{ backgroundColor: hex }}
              />
            ))}
          </div>
        )}
        {note && <p className="mt-2 text-micro text-muted-foreground">{note}</p>}
      </div>

      {/* 强度 */}
      <div className="mt-3 border-t border-border pt-3">
        <div className="flex items-center gap-3">
          <Label className="w-16 shrink-0 text-caption text-muted-foreground">协调强度</Label>
          <Slider
            value={[color.strength]}
            onValueChange={(v) => setColorStrength((v as number[])[0])}
            min={0}
            max={100}
            step={5}
            className="flex-1"
            aria-label="协调强度"
          />
          <span className="w-11 shrink-0 text-right text-caption tabular-nums text-muted-foreground">
            {color.strength}%
          </span>
        </div>
        <p className="mt-1 text-micro text-muted-foreground">
          0% 只换按钮颜色，100% 让背景光、蒙层与卡片一起参与；背景图与角色图本身不会被染色
        </p>
      </div>

      {/* 调色板 */}
      {palette && (
        <div className="mt-3 border-t border-border pt-3">
          <p className="mb-2 flex items-center gap-1.5 text-caption text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            当前调色板
          </p>
          <div className="flex flex-wrap gap-2">
            {paletteSwatches(palette).map((s) => (
              <div key={s.label} className="flex items-center gap-1.5">
                <span
                  className="h-6 w-6 rounded-md border border-border"
                  style={{ backgroundColor: s.value }}
                />
                <span className="text-micro text-muted-foreground">{s.label}</span>
              </div>
            ))}
          </div>

          {/* 实时预览：按钮 + 卡片 + 边框 */}
          <div
            className="mt-2 flex items-center gap-3 rounded-md border p-3"
            style={{
              borderColor: palette.borderTint,
              backgroundImage: `linear-gradient(180deg, ${palette.cardTint}, transparent 70%)`,
            }}
          >
            <span
              className="rounded-md px-3 py-1.5 text-caption font-medium"
              style={{ backgroundColor: palette.primary, color: palette.onPrimary }}
            >
              主要操作
            </span>
            <span
              className="rounded-md px-3 py-1.5 text-caption"
              style={{ backgroundColor: palette.primaryContainer, color: palette.primary }}
            >
              次要操作
            </span>
            <span className="text-micro text-muted-foreground">
              文字对比度 {readable ? readable.toFixed(1) : '—'}:1
            </span>
          </div>

          {clash !== null && (
            <p
              className={cn(
                'mt-2 flex items-center gap-1.5 text-micro',
                clash > 0.55 ? 'text-warning' : 'text-muted-foreground'
              )}
            >
              <Contrast className="h-3 w-3" aria-hidden="true" />
              {clash > 0.55
                ? `当前主色与背景色相冲突（${Math.round(clash * 100)}%），建议试试候选配色，或用较低协调强度`
                : `与背景协调度尚可（冲突 ${Math.round(clash * 100)}%）`}
            </p>
          )}
        </div>
      )}

      {/* 操作 */}
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1"
          onClick={() => patchColor({ ...snapshot.current })}
        >
          <Undo2 className="h-3.5 w-3.5" />
          撤销本次修改
        </Button>
        <Button size="sm" variant="outline" className="h-8 gap-1" onClick={resetColor}>
          <RotateCcw className="h-3.5 w-3.5" />
          恢复主题默认配色
        </Button>
        <span className="text-micro text-muted-foreground">
          配色设置随外观一起保存，重启后恢复
        </span>
      </div>
    </section>
  )
}
