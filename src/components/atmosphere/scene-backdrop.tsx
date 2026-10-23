'use client'

// ============================================================
// 场景背景层
//
// 固定铺满视口、pointer-events: none，位于内容之下（内容层 z-10）。
// 支持：内置 SVG 场景 / 自定义图片、可见度、模糊、压暗、色相、亮度、遮罩强度。
// 纯净模式（pure）由 resolveAtmosphere 折算成"极淡背景"，无需在这里分支。
// ============================================================

import { useEffect, useMemo, useState } from 'react'
import { useAppearance } from '@/providers/appearance-provider'
import { resolveAtmosphere } from '@/lib/theme/scene-resolve'
import { getAssetUrl } from '@/lib/atmosphere/custom-assets'
import { hexToRgb, rgbToOklch } from '@/lib/theme/color'
import { renderScene } from './art/registry'
import { AtmosphereParticles } from './atmosphere-particles'
import { useCurrentScene } from './use-current-scene'

export function SceneBackdrop() {
  const { state, palette } = useAppearance()
  const atmo = useMemo(() => resolveAtmosphere(state.atmosphere), [state.atmosphere])
  const scene = useCurrentScene()
  const bgId = atmo.customBackgroundId
  const useCustom = atmo.bgSource === 'custom' && !!bgId
  // 记住是哪个 id 解出的 url，切换素材时不会闪现上一张
  const [loadedImage, setLoadedImage] = useState<{ id: string; url: string } | null>(null)
  const customUrl = useCustom && loadedImage?.id === bgId ? loadedImage.url : null

  useEffect(() => {
    if (!useCustom || !bgId) return
    let alive = true
    void getAssetUrl(bgId).then((url) => {
      if (alive && url) setLoadedImage({ id: bgId, url })
    })
    return () => {
      alive = false
    }
  }, [useCustom, bgId])

  const opacity = Math.min(100, Math.max(0, atmo.bgOpacity)) / 100

  /**
   * 氛围色相偏移：把背景整体轻微拉向强调色的色相。
   * 只在"强调色联动/背景取色"下生效，锁定背景模式完全不动画面；
   * 幅度上限 ±32°，并随协调强度缩放——宁可少一点，也不要让樱花变成蓝色。
   */
  const hueShift = useMemo(() => {
    const color = state.color
    if (!color || !palette || color.strength < 20) return 0
    if (color.mode !== 'accent' && color.mode !== 'wallpaper') return 0
    const seedRgb = hexToRgb(palette.seed)
    const tintRgb = scene ? hexToRgb(scene.tint) : null
    if (!seedRgb || !tintRgb) return 0
    const seedHue = rgbToOklch(seedRgb).h
    const tintHue = rgbToOklch(tintRgb).h
    let delta = seedHue - tintHue
    if (delta > 180) delta -= 360
    if (delta < -180) delta += 360
    const clamped = Math.max(-32, Math.min(32, delta * 0.5))
    return clamped * (color.strength / 100)
  }, [state.color, scene, palette])

  const filters = [
    atmo.bgBlur > 0 ? `blur(${atmo.bgBlur}px)` : '',
    atmo.bgHue !== 0 ? `hue-rotate(${atmo.bgHue}deg)` : '',
    atmo.bgBrightness !== 100 ? `brightness(${atmo.bgBrightness}%)` : '',
    hueShift !== 0 ? `hue-rotate(${hueShift.toFixed(1)}deg)` : '',
    hueShift !== 0 ? `saturate(${(1 + state.color.strength / 500).toFixed(2)})` : '',
  ]
    .filter(Boolean)
    .join(' ')

  const art = useCustom
    ? customUrl
      ? // eslint-disable-next-line @next/next/no-img-element -- 用户素材是运行时 object URL，Next/Image 无法优化
        <img src={customUrl} alt="" className="h-full w-full object-cover" />
      : null
    : scene
      ? renderScene(scene.id, 'h-full w-full')
      : null

  if (!atmo.enabled || !art) return null

  return (
    <div className="atmo-backdrop" aria-hidden="true" data-testid="atmosphere-backdrop">
      <div className="atmo-art" style={{ opacity, filter: filters || undefined }}>
        {art}
      </div>
      {/* 压暗层：在遮罩之下，只影响画面亮度不影响卡片 */}
      {atmo.bgDarken > 0 && (
        <div
          className="atmo-darken"
          style={{ backgroundColor: `rgba(0,0,0,${atmo.bgDarken / 100})` }}
        />
      )}
      <div
        className="atmo-scrim"
        style={{ ['--mask-strength' as string]: String(atmo.bgMask / 100) }}
      />
      {atmo.animations && <AtmosphereParticles themeId={state.themeId} />}
    </div>
  )
}
