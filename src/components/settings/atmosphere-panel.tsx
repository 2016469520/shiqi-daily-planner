'use client'

// ============================================================
// 氛围设置面板
//
// 组织：模式 → 背景 → 角色 → 每日一句 → 效果 → 恢复。
// 自定义素材（角色图片/壁纸）走 lib/atmosphere/custom-assets，
// 存在独立 IndexedDB 里，不碰业务数据。
// ============================================================

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Check,
  ImageIcon,
  MessageSquareQuote,
  RotateCcw,
  Sparkles,
  Sunrise,
  Trash2,
  Upload,
  UserRound,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { useAppearance } from '@/providers/appearance-provider'
import {
  EXPRESSION_LABELS,
  charactersForTheme,
  quotesForTheme,
  scenesForTheme,
  type CharacterExpression,
} from '@/lib/theme/atmosphere'
import type { CharacterPosition } from '@/lib/theme/types'
import { renderCharacter, renderScene } from '@/components/atmosphere/art/registry'
import { QuoteStrip } from '@/components/atmosphere/quote-strip'
import {
  addAsset,
  deleteAsset,
  refreshAssets,
  useAssetsLoaded,
  useCustomAssets,
} from '@/lib/atmosphere/custom-assets'

function Row({
  label,
  description,
  children,
}: {
  label: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <div className="min-w-0">
        <p className="text-body text-foreground">{label}</p>
        {description && <p className="mt-0.5 text-micro text-muted-foreground">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function SliderRow({
  label,
  value,
  min,
  max,
  step = 1,
  suffix = '',
  onChange,
  ariaLabel,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  suffix?: string
  onChange: (value: number) => void
  ariaLabel: string
}) {
  return (
    <div className="flex items-center gap-3">
      <Label className="w-16 shrink-0 text-caption text-muted-foreground">{label}</Label>
      <Slider
        value={[value]}
        onValueChange={(v) => onChange((v as number[])[0])}
        min={min}
        max={max}
        step={step}
        className="flex-1"
        aria-label={ariaLabel}
      />
      <span className="w-11 shrink-0 text-right text-caption tabular-nums text-muted-foreground">
        {value}
        {suffix}
      </span>
    </div>
  )
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
  ariaLabel: string
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="inline-flex flex-wrap items-center gap-0.5 rounded-full bg-surface-2 p-0.5"
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          aria-pressed={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'h-7 rounded-full px-2.5 text-caption ui-transition',
            value === opt.value
              ? 'bg-primary/12 font-medium text-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

/** 角色包文件名 → 状态（normal/happy/thinking/working/success/error 等） */
const STATE_ALIASES: Record<string, CharacterExpression> = {
  normal: 'idle',
  idle: 'idle',
  default: 'idle',
  happy: 'happy',
  smile: 'happy',
  thinking: 'thinking',
  think: 'thinking',
  working: 'working',
  work: 'working',
  success: 'happy',
  done: 'happy',
  error: 'error',
  fail: 'error',
  sleepy: 'sleepy',
  sleep: 'sleepy',
}

const POSITIONS: { value: CharacterPosition; label: string }[] = [
  { value: 'bottom-left', label: '左下' },
  { value: 'bottom-right', label: '右下' },
  { value: 'hero', label: '主视觉' },
  { value: 'sidebar', label: '侧栏' },
]

export function AtmospherePanel() {
  const { state, theme, patchAtmosphere, resetAtmosphere } = useAppearance()
  const atmo = state.atmosphere
  const [customQuote, setCustomQuote] = useState('')
  const [importError, setImportError] = useState<string | null>(null)
  const [importOk, setImportOk] = useState<string | null>(null)
  const bgInput = useRef<HTMLInputElement>(null)
  const charInput = useRef<HTMLInputElement>(null)

  const assets = useCustomAssets()
  const assetsLoaded = useAssetsLoaded()

  useEffect(() => {
    if (!assetsLoaded) void refreshAssets()
  }, [assetsLoaded])

  const scenes = useMemo(() => scenesForTheme(state.themeId), [state.themeId])
  const characters = useMemo(() => charactersForTheme(state.themeId), [state.themeId])
  const activeSceneId = atmo.sceneByTheme[state.themeId] ?? scenes[0]?.id
  const activeCharacter =
    characters.find((c) => c.id === atmo.characterByTheme[state.themeId]) ?? characters[0]
  const customList = atmo.customQuotes[state.themeId] ?? []
  const builtinCount = quotesForTheme(state.themeId).length
  const customCharacters = assets.filter((a) => a.kind === 'character')
  const customBackgrounds = assets.filter((a) => a.kind === 'background')

  const setScene = (id: string) =>
    patchAtmosphere({
      sceneByTheme: { ...atmo.sceneByTheme, [state.themeId]: id },
      bgSource: 'scene',
    })

  const setCharacter = (id: string) =>
    patchAtmosphere({
      characterByTheme: { ...atmo.characterByTheme, [state.themeId]: id },
      customCharacterId: null,
    })

  const addCustomQuote = () => {
    const text = customQuote.trim()
    if (!text) return
    patchAtmosphere({
      customQuotes: {
        ...atmo.customQuotes,
        [state.themeId]: [...customList, text].slice(0, 20),
      },
    })
    setCustomQuote('')
  }

  const handleUpload = async (
    file: File | undefined,
    kind: 'character' | 'background',
    reqState?: CharacterExpression
  ) => {
    if (!file) return
    setImportError(null)
    setImportOk(null)
    const result = await addAsset(file, { kind, name: file.name, state: reqState })
    if (!result.ok) {
      setImportError(result.error)
      return
    }
    setImportOk(result.asset.name)
    if (kind === 'background') {
      patchAtmosphere({ bgSource: 'custom', customBackgroundId: result.asset.id })
    } else {
      patchAtmosphere({
        customCharacterId: result.asset.id,
        characterEnabled: true,
        mode: 'immersive',
      })
    }
  }

  /** 多选导入：文件名命中状态词就绑定该状态，否则当作通用立绘 */
  const handleCharacterPack = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    // 先把 FileList 拍成数组：调用方会立刻清空 input，之后再读 files[0] 就是 undefined
    const picked = Array.from(files).slice(0, 8)
    if (picked.length === 0) return
    setImportError(null)
    setImportOk(null)
    const groupId = `group-${Date.now().toString(36)}`
    const stripExt = (name: string) => name.replace(/\.[^.]+$/, '')
    const packName = stripExt(picked[0].name)
    const isPack = picked.length > 1
    let selectedId: string | null = null

    for (const file of picked) {
      const base = stripExt(file.name).toLowerCase()
      const mapped = STATE_ALIASES[base]
      const result = await addAsset(file, {
        kind: 'character',
        name: isPack ? packName : stripExt(file.name),
        state: mapped,
        groupId,
      })
      if (!result.ok) {
        setImportError(result.error)
        continue
      }
      // 优先选通用图（没有命中状态词的那张）作为入口
      if (!selectedId || mapped === undefined) selectedId = result.asset.id
    }

    if (selectedId) {
      setImportOk(isPack ? `${picked.length} 张表情` : packName)
      patchAtmosphere({
        customCharacterId: selectedId,
        characterEnabled: true,
        mode: 'immersive',
      })
    }
  }

  return (
    <section className="surface p-4" data-testid="atmosphere-panel">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h2 className="text-section text-foreground">沉浸氛围</h2>
            <p className="mt-0.5 text-caption text-muted-foreground">
              场景、角色、每日一句与动画。全部随包离线，可一键切回纯净工作模式
            </p>
          </div>
        </div>
        <Switch
          checked={atmo.enabled}
          onCheckedChange={(v) => patchAtmosphere({ enabled: v, mode: v ? 'immersive' : atmo.mode })}
          aria-label="沉浸氛围开关"
        />
      </div>

      {/* 模式 */}
      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
        <Segmented
          value={atmo.mode}
          onChange={(mode) => patchAtmosphere({ mode, enabled: true })}
          options={[
            { value: 'immersive', label: '沉浸模式' },
            { value: 'pure', label: '纯净工作模式' },
          ]}
          ariaLabel="氛围模式"
        />
        <span className="text-micro text-muted-foreground">
          {atmo.mode === 'immersive'
            ? '显示背景、角色、每日一句与动画'
            : '隐藏角色、压暗背景、停止动画，但保留主题配色'}
        </span>
      </div>

      <div className={cn(!atmo.enabled && 'pointer-events-none opacity-50')}>
        {/* 背景 */}
        <div className="border-t border-border pt-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-caption text-muted-foreground">
              <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
              {theme.name} · 场景
            </p>
            <div className="flex items-center gap-1">
              <span className="text-micro text-muted-foreground">{scenes.length} 张</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 gap-1 px-1.5 text-micro text-muted-foreground"
                onClick={() => bgInput.current?.click()}
              >
                <Upload className="h-3 w-3" />
                导入壁纸
              </Button>
              <input
                ref={bgInput}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  void handleUpload(e.target.files?.[0], 'background')
                  e.target.value = ''
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {scenes.map((scene) => {
              const active = atmo.bgSource === 'scene' && activeSceneId === scene.id
              return (
                <button
                  key={scene.id}
                  type="button"
                  onClick={() => setScene(scene.id)}
                  aria-pressed={active}
                  data-testid={`scene-${scene.id}`}
                  className={cn(
                    'atmo-thumb group relative border-2 text-left ui-transition',
                    active
                      ? 'border-primary shadow-[var(--shadow-card)]'
                      : 'border-transparent hover:border-border-strong'
                  )}
                >
                  <div className="relative h-20 w-full overflow-hidden bg-surface-2">
                    {renderScene(scene.id, 'h-full w-full')}
                  </div>
                  <div className="flex items-center justify-between gap-1 px-1.5 py-1">
                    <span className="truncate text-micro text-foreground">{scene.name}</span>
                    {active && <Check className="h-3 w-3 shrink-0 text-primary" aria-hidden="true" />}
                  </div>
                </button>
              )
            })}
          </div>

          {customBackgrounds.length > 0 && (
            <div className="mt-2 space-y-1">
              <p className="text-micro text-muted-foreground">我的壁纸</p>
              {customBackgrounds.map((asset) => {
                const active = atmo.bgSource === 'custom' && atmo.customBackgroundId === asset.id
                return (
                  <div
                    key={asset.id}
                    className={cn(
                      'flex items-center gap-2 rounded-md border px-2 py-1',
                      active ? 'border-primary/50 bg-primary/[0.06]' : 'border-border'
                    )}
                  >
                    <button
                      type="button"
                      className="min-w-0 flex-1 truncate text-left text-caption text-foreground"
                      onClick={() =>
                        patchAtmosphere({ bgSource: 'custom', customBackgroundId: asset.id })
                      }
                    >
                      {asset.name}
                      {active && <span className="ml-1.5 text-primary">使用中</span>}
                    </button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="text-muted-foreground hover:text-destructive"
                      aria-label={`删除壁纸 ${asset.name}`}
                      onClick={() => {
                        void deleteAsset(asset.id)
                        if (atmo.customBackgroundId === asset.id) {
                          patchAtmosphere({ bgSource: 'scene', customBackgroundId: null })
                        }
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )
              })}
            </div>
          )}

          <Row label="随机轮换" description="每天首次打开时换一张（同一天内稳定）">
            <Switch
              checked={atmo.rotateScenes}
              onCheckedChange={(v) => patchAtmosphere({ rotateScenes: v })}
              aria-label="随机轮换场景"
            />
          </Row>

          <div className="mt-1 space-y-2.5">
            <SliderRow
              label="可见度"
              value={atmo.bgOpacity}
              min={0}
              max={100}
              step={5}
              suffix="%"
              ariaLabel="背景可见度"
              onChange={(v) => patchAtmosphere({ bgOpacity: v })}
            />
            <SliderRow
              label="模糊"
              value={atmo.bgBlur}
              min={0}
              max={20}
              suffix="px"
              ariaLabel="背景模糊"
              onChange={(v) => patchAtmosphere({ bgBlur: v })}
            />
            <SliderRow
              label="压暗"
              value={atmo.bgDarken}
              min={0}
              max={60}
              step={5}
              suffix="%"
              ariaLabel="背景压暗"
              onChange={(v) => patchAtmosphere({ bgDarken: v })}
            />
            <SliderRow
              label="遮罩"
              value={atmo.bgMask}
              min={0}
              max={100}
              step={5}
              suffix="%"
              ariaLabel="遮罩强度"
              onChange={(v) => patchAtmosphere({ bgMask: v })}
            />
            <SliderRow
              label="色相"
              value={atmo.bgHue}
              min={-30}
              max={30}
              suffix="°"
              ariaLabel="背景色相"
              onChange={(v) => patchAtmosphere({ bgHue: v })}
            />
            <SliderRow
              label="亮度"
              value={atmo.bgBrightness}
              min={70}
              max={130}
              suffix="%"
              ariaLabel="背景亮度"
              onChange={(v) => patchAtmosphere({ bgBrightness: v })}
            />
          </div>
        </div>

        {/* 角色 */}
        <div className="border-t border-border pt-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-caption text-muted-foreground">
              <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
              角色伙伴
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 gap-1 px-1.5 text-micro text-muted-foreground"
                onClick={() => charInput.current?.click()}
              >
                <Upload className="h-3 w-3" />
                导入角色图
              </Button>
              <input
                ref={charInput}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  void handleCharacterPack(e.target.files)
                  e.target.value = ''
                }}
              />
              <Switch
                checked={atmo.characterEnabled}
                onCheckedChange={(v) => patchAtmosphere({ characterEnabled: v })}
                aria-label="角色显示开关"
              />
            </div>
          </div>

          {characters.length > 0 && (
            <div className="space-y-2">
              {characters.map((character) => {
                const active = !atmo.customCharacterId && activeCharacter?.id === character.id
                return (
                  <button
                    key={character.id}
                    type="button"
                    onClick={() => setCharacter(character.id)}
                    aria-pressed={active}
                    data-testid={`character-${character.id}`}
                    className={cn(
                      'atmo-thumb flex w-full items-center gap-3 border p-2 text-left ui-transition',
                      active
                        ? 'border-primary/50 bg-primary/[0.06]'
                        : 'border-border hover:bg-accent/60'
                    )}
                  >
                    <span className="atmo-thumb flex h-16 w-14 shrink-0 items-center justify-center bg-surface-2">
                      {renderCharacter(character.id, {
                        expression: 'idle',
                        className: 'h-full w-full',
                      })}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="text-body font-medium text-foreground">
                          {character.name}
                        </span>
                        {active && (
                          <span className="rounded-full bg-primary/12 px-1.5 py-0.5 text-[10px] text-primary">
                            使用中
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block text-micro text-muted-foreground">
                        {character.description}
                      </span>
                      <span className="mt-1 flex flex-wrap gap-1">
                        {character.expressions.map((e) => (
                          <span
                            key={e}
                            className="rounded-full bg-surface-2 px-1.5 py-0.5 text-[10px] text-muted-foreground"
                          >
                            {EXPRESSION_LABELS[e]}
                          </span>
                        ))}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {customCharacters.length > 0 && (
            <div className="mt-2 space-y-1">
              <p className="text-micro text-muted-foreground">我的角色图</p>
              {customCharacters.map((asset) => {
                const active = atmo.customCharacterId === asset.id
                return (
                  <div
                    key={asset.id}
                    className={cn(
                      'flex items-center gap-2 rounded-md border px-2 py-1',
                      active ? 'border-primary/50 bg-primary/[0.06]' : 'border-border'
                    )}
                  >
                    <button
                      type="button"
                      className="min-w-0 flex-1 truncate text-left text-caption text-foreground"
                      onClick={() =>
                        patchAtmosphere({
                          customCharacterId: asset.id,
                          characterEnabled: true,
                          mode: 'immersive',
                        })
                      }
                    >
                      {asset.name}
                      {active && <span className="ml-1.5 text-primary">使用中</span>}
                    </button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="text-muted-foreground hover:text-destructive"
                      aria-label={`删除角色图 ${asset.name}`}
                      onClick={() => {
                        void deleteAsset(asset.id)
                        if (atmo.customCharacterId === asset.id) {
                          patchAtmosphere({ customCharacterId: null })
                        }
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )
              })}
            </div>
          )}

          <div className="mt-2 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label className="text-caption text-muted-foreground">位置</Label>
              <Segmented
                value={atmo.characterPosition}
                onChange={(v) => patchAtmosphere({ characterPosition: v })}
                options={POSITIONS}
                ariaLabel="角色位置"
              />
            </div>
            <SliderRow
              label="尺寸"
              value={atmo.characterSize}
              min={60}
              max={160}
              step={5}
              suffix="%"
              ariaLabel="角色尺寸"
              onChange={(v) => patchAtmosphere({ characterSize: v })}
            />
            <SliderRow
              label="不透明"
              value={atmo.characterOpacity}
              min={30}
              max={100}
              step={5}
              suffix="%"
              ariaLabel="角色不透明度"
              onChange={(v) => patchAtmosphere({ characterOpacity: v })}
            />
          </div>

          <Row label="自动状态" description="表情跟随真实的完成/专注/失败事件切换">
            <Switch
              checked={atmo.characterAutoState}
              onCheckedChange={(v) => patchAtmosphere({ characterAutoState: v })}
              aria-label="自动状态开关"
            />
          </Row>
          <Row label="表情动画" description="待机轻晃与切换动画；关闭后完全静止">
            <Switch
              checked={atmo.characterAnimate}
              onCheckedChange={(v) => patchAtmosphere({ characterAnimate: v })}
              aria-label="表情动画开关"
            />
          </Row>
          <Row label="欢迎语" description="完成任务/出错时让角色开口">
            <Switch
              checked={atmo.characterWelcome}
              onCheckedChange={(v) => patchAtmosphere({ characterWelcome: v })}
              aria-label="角色欢迎语开关"
            />
          </Row>
        </div>

        {/* 每日一句 */}
        <div className="border-t border-border pt-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-caption text-muted-foreground">
              <MessageSquareQuote className="h-3.5 w-3.5" aria-hidden="true" />
              每日一句
            </p>
            <Switch
              checked={atmo.quoteEnabled}
              onCheckedChange={(v) => patchAtmosphere({ quoteEnabled: v })}
              aria-label="每日一句开关"
            />
          </div>

          <QuoteStrip className="mb-2" />

          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={customQuote}
              onChange={(e) => setCustomQuote(e.target.value)}
              placeholder="加一句自己的话…"
              maxLength={120}
              className="h-8 w-56"
              aria-label="自定义短句"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addCustomQuote()
                }
              }}
            />
            <Button
              size="sm"
              variant="outline"
              className="h-8"
              disabled={!customQuote.trim() || customList.length >= 20}
              onClick={addCustomQuote}
            >
              添加
            </Button>
            <span className="text-micro text-muted-foreground">
              内置 {builtinCount} 句 · 自定义 {customList.length}/20
            </span>
          </div>

          {customList.length > 0 && (
            <ul className="mt-2 space-y-1">
              {customList.map((text, i) => (
                <li
                  key={`${text}-${i}`}
                  className="flex items-center justify-between gap-2 rounded-md bg-surface-2 px-2 py-1"
                >
                  <span className="min-w-0 truncate text-caption text-foreground">{text}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 shrink-0 px-1.5 text-micro text-muted-foreground hover:text-destructive"
                    onClick={() =>
                      patchAtmosphere({
                        customQuotes: {
                          ...atmo.customQuotes,
                          [state.themeId]: customList.filter((_, idx) => idx !== i),
                        },
                      })
                    }
                  >
                    删除
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 效果 */}
        <div className="border-t border-border pt-3">
          <Row label="氛围动画" description="花瓣、星点、扫描线、像素粒子（低帧耗）">
            <Switch
              checked={atmo.animations}
              onCheckedChange={(v) => patchAtmosphere({ animations: v })}
              aria-label="氛围动画开关"
            />
          </Row>
          <Row label="完成庆祝" description="勾选完成时撒一点彩带">
            <Switch
              checked={atmo.celebration}
              onCheckedChange={(v) => patchAtmosphere({ celebration: v })}
              aria-label="完成庆祝开关"
            />
          </Row>
          <Row label="每日开场页" description="每天第一次打开首页时展示场景与问候">
            <Switch
              checked={atmo.welcome}
              onCheckedChange={(v) => patchAtmosphere({ welcome: v })}
              aria-label="开场页开关"
            />
          </Row>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <Button variant="outline" size="sm" className="h-8 gap-1" onClick={resetAtmosphere}>
            <RotateCcw className="h-3.5 w-3.5" />
            恢复主题默认视觉素材
          </Button>
          <span className="flex items-center gap-1 text-micro text-muted-foreground">
            <Sunrise className="h-3 w-3" aria-hidden="true" />
            内置素材为原创 SVG；自定义图片只存在本机
          </span>
          {importError && <span className="text-micro text-destructive">{importError}</span>}
          {importOk && <span className="text-micro text-success">已导入 {importOk}</span>}
        </div>
      </div>
    </section>
  )
}
