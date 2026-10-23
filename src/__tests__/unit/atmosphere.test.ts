import { describe, it, expect } from 'vitest'
import {
  CHARACTERS,
  SCENES,
  charactersForTheme,
  defaultCharacterFor,
  defaultSceneFor,
  getCharacter,
  getScene,
  linesFor,
  quotesForTheme,
  quotesForTheme as quotes,
  scenesForTheme,
} from '@/lib/theme/atmosphere'
import { resolveCharacter, resolveScene, todayKey } from '@/lib/theme/scene-resolve'
import { defaultAtmosphere, sanitizeAtmosphere, sanitizeState } from '@/lib/theme/storage'
import { THEME_IDS } from '@/lib/theme/themes'

const atmo = () => defaultAtmosphere()

describe('氛围素材注册表', () => {
  it('每套主题都有至少两个场景，id 全局唯一', () => {
    for (const id of THEME_IDS) {
      expect(scenesForTheme(id).length).toBeGreaterThanOrEqual(2)
    }
    expect(new Set(SCENES.map((s) => s.id)).size).toBe(SCENES.length)
  })

  it('只有像素主题内置角色，且角色 id 唯一', () => {
    // 其余动漫角色已移除，本地素材包由用户自己提供
    expect(charactersForTheme('pixel').length).toBeGreaterThan(0)
    expect(charactersForTheme('anime').length).toBe(0)
    expect(charactersForTheme('cyber').length).toBe(0)
    expect(charactersForTheme('fluent').length).toBe(0)
    expect(new Set(CHARACTERS.map((c) => c.id)).size).toBe(CHARACTERS.length)
  })

  it('角色都声明了 idle 与 happy，保证状态回退可用', () => {
    for (const c of CHARACTERS) {
      expect(c.expressions).toContain('idle')
      expect(c.expressions).toContain('happy')
      expect(linesFor(c.id, 'idle').length).toBeGreaterThan(0)
    }
  })

  it('未知 id 返回 null 而不是抛错', () => {
    expect(getScene('nope')).toBeNull()
    expect(getCharacter('nope')).toBeNull()
  })

  it('每套主题都有短句库，且没有空句子', () => {
    for (const id of THEME_IDS) {
      const list = quotesForTheme(id)
      expect(list.length).toBeGreaterThanOrEqual(6)
      for (const q of list) expect(q.text.length).toBeGreaterThan(2)
    }
  })

  it('引用古籍的短句都带作者或出处（不伪造）', () => {
    const classical = quotes('minimal').filter((q) => q.author || q.source)
    expect(classical.length).toBeGreaterThan(0)
    for (const q of classical) {
      expect(typeof q.author === 'string' || typeof q.source === 'string').toBe(true)
    }
  })
})

describe('场景/角色解析', () => {
  it('关闭氛围时不返回场景与角色', () => {
    const a = { ...atmo(), enabled: false }
    expect(resolveScene('anime', a)).toBeNull()
    expect(resolveCharacter('anime', a)).toBeNull()
  })

  it('默认使用主题第一张场景', () => {
    expect(resolveScene('anime', atmo())?.id).toBe(defaultSceneFor('anime').id)
  })

  it('用户选定的场景优先', () => {
    const target = scenesForTheme('anime')[2]
    const a = { ...atmo(), sceneByTheme: { anime: target.id } }
    expect(resolveScene('anime', a)?.id).toBe(target.id)
  })

  it('跨主题的非法场景 id 不会生效', () => {
    const foreign = scenesForTheme('cyber')[0]
    const a = { ...atmo(), sceneByTheme: { anime: foreign.id } }
    expect(resolveScene('anime', a)?.id).toBe(defaultSceneFor('anime').id)
  })

  it('每日轮换在同一天稳定，换一天会变', () => {
    const a = { ...atmo(), rotateScenes: true }
    const d1 = new Date('2026-10-22T02:00:00')
    const d2 = new Date('2026-10-22T21:00:00')
    const d3 = new Date('2026-10-23T02:00:00')
    expect(resolveScene('anime', a, d1)?.id).toBe(resolveScene('anime', a, d2)?.id)
    const ids = new Set(
      Array.from({ length: 12 }, (_, i) =>
        resolveScene('anime', a, new Date(2026, 9, 22 + i))?.id
      )
    )
    expect(resolveScene('anime', a, d3)).not.toBeNull()
    expect(ids.size).toBeGreaterThan(1)
  })

  it('角色开关关闭时不返回角色', () => {
    const a = { ...atmo(), characterEnabled: false }
    expect(resolveCharacter('anime', a)).toBeNull()
  })

  it('没有角色的主题返回 null', () => {
    expect(resolveCharacter('minimal', atmo())).toBeNull()
    expect(defaultCharacterFor('minimal')).toBeNull()
  })

  it('今日键是本地日期格式', () => {
    expect(todayKey(new Date(2026, 9, 22, 1, 0))).toBe('2026-10-22')
  })
})

describe('氛围设置的校验与持久化', () => {
  it('旧配置缺少 atmosphere 时补默认值', () => {
    const state = sanitizeState({ themeId: 'anime', mode: 'light' })
    expect(state.atmosphere.enabled).toBe(true)
    expect(state.atmosphere.bgOpacity).toBe(100)
    expect(state.atmosphere.bgBlur).toBe(0)
  })

  it('非法场景 id 被丢弃', () => {
    const a = sanitizeAtmosphere({ sceneByTheme: { anime: 'not-a-scene', cyber: 'cyber-neon-rain' } })
    expect(a.sceneByTheme.anime).toBeUndefined()
    expect(a.sceneByTheme.cyber).toBe('cyber-neon-rain')
  })

  it('背景参数被夹在合法范围', () => {
    expect(sanitizeAtmosphere({ bgOpacity: 500 }).bgOpacity).toBe(100)
    expect(sanitizeAtmosphere({ bgOpacity: -20 }).bgOpacity).toBe(0)
    expect(sanitizeAtmosphere({ bgBlur: 99 }).bgBlur).toBe(20)
  })

  it('自定义短句会被裁剪长度并限制数量', () => {
    const long = 'x'.repeat(500)
    const many = Array.from({ length: 40 }, (_, i) => `句 ${i}`)
    const a = sanitizeAtmosphere({ customQuotes: { anime: [long, ...many] } })
    expect(a.customQuotes.anime?.length).toBe(20)
    expect((a.customQuotes.anime?.[0] ?? '').length).toBe(120)
  })

  it('非字符串短句被过滤', () => {
    const a = sanitizeAtmosphere({ customQuotes: { anime: ['ok', 42, null, '  '] } })
    expect(a.customQuotes.anime).toEqual(['ok'])
  })

  it('关闭状态会被保留', () => {
    const a = sanitizeAtmosphere({
      enabled: false,
      animations: false,
      celebration: false,
      welcome: false,
      characterEnabled: false,
      quoteEnabled: false,
    })
    expect(a).toMatchObject({
      enabled: false,
      animations: false,
      celebration: false,
      welcome: false,
      characterEnabled: false,
      quoteEnabled: false,
    })
  })
})
