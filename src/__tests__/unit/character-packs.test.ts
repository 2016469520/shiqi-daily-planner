import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  __testing,
  clearPacks,
  importPackFiles,
  listPacks,
  savePack,
  displayUrl,
} from '@/lib/atmosphere/character-packs'

const { STATE_ALIASES, KIND_PRIORITY, packDirOf, baseName } = __testing

/** 造一个带 webkitRelativePath 的 File，模拟目录选择 */
function makeFile(relativePath: string, content: string, type = 'image/png'): File {
  const name = relativePath.split('/').pop() ?? relativePath
  const file = new File([content], name, { type })
  Object.defineProperty(file, 'webkitRelativePath', { value: relativePath })
  return file
}

function manifest(json: unknown): string {
  return JSON.stringify(json)
}

describe('角色包解析', () => {
  it('从路径里取出包目录与文件名', () => {
    expect(packDirOf('characters/feng_baobao/full_body.png')).toBe('feng_baobao')
    expect(packDirOf('feng_baobao/manifest.json')).toBe('feng_baobao')
    expect(packDirOf('manifest.json')).toBeNull()
    expect(baseName('characters/x/happy.png')).toBe('happy')
  })

  it('展示图优先级是 full_body > half_body > portrait > preview', () => {
    expect(KIND_PRIORITY).toEqual(['full_body', 'half_body', 'portrait', 'preview'])
  })

  it('状态词映射覆盖六种情绪与常见别名', () => {
    expect(STATE_ALIASES.normal).toBe('idle')
    expect(STATE_ALIASES.success).toBe('happy')
    expect(STATE_ALIASES.fail).toBe('error')
    expect(STATE_ALIASES.sleep).toBe('sleepy')
    expect(STATE_ALIASES.work).toBe('working')
  })
})

describe('导入角色包', () => {
  beforeEach(async () => {
    await clearPacks()
  })

  it('reimporting a same-size image invalidates its object URL and preserves dialogue', async () => {
    const create = vi.fn().mockReturnValueOnce('blob:first').mockReturnValueOnce('blob:second')
    const revoke = vi.fn()
    vi.stubGlobal('URL', Object.assign(class extends URL {}, { createObjectURL: create, revokeObjectURL: revoke }))
    try {
      const pack = { id: 'pack-refresh', manifest: { dialogue: { idle: ['看啥看？'] } }, states: {}, display: new Blob(['one']), createdAt: '2026-01-01' }
      await savePack(pack)
      expect(displayUrl(pack)).toBe('blob:first')
      const updated = { ...pack, display: new Blob(['two']) }
      await savePack(updated)
      expect(revoke).toHaveBeenCalledWith('blob:first')
      expect(displayUrl(updated)).toBe('blob:second')
      expect((await listPacks())[0].manifest.dialogue?.idle).toEqual(['看啥看？'])
    } finally { await clearPacks(); vi.unstubAllGlobals() }
  })

  it('一个文件夹 = 一个角色包，优先用 full_body 当展示图', async () => {
    const result = await importPackFiles([
      makeFile(
        'characters/baobao/manifest.json',
        manifest({ id: 'baobao', name: '冯宝宝', series: '一人之下', tags: ['本地'] }),
        'application/json'
      ),
      makeFile('characters/baobao/preview.png', 'p'),
      makeFile('characters/baobao/full_body.png', 'f'),
      makeFile('characters/baobao/happy.png', 'h'),
    ])

    expect(result.ok).toBe(true)
    const packs = await listPacks()
    expect(packs).toHaveLength(1)
    expect(packs[0].id).toBe('pack-baobao')
    expect(packs[0].manifest.name).toBe('冯宝宝')
    expect(packs[0].displayKind).toBe('full_body')
    expect(packs[0].states.happy).toBeTruthy()
  })

  it('只有 preview.png 也能导入（安全回退）', async () => {
    const result = await importPackFiles([
      makeFile('characters/only/manifest.json', manifest({ name: '只有预览' }), 'application/json'),
      makeFile('characters/only/preview.png', 'p'),
    ])
    expect(result.ok).toBe(true)
    const packs = await listPacks()
    expect(packs[0].displayKind).toBe('preview')
    expect(packs[0].states.idle).toBeUndefined()
  })

  it('没有 manifest.json 的文件夹会被跳过并给出原因', async () => {
    const result = await importPackFiles([makeFile('characters/nope/full_body.png', 'f')])
    expect(result.ok).toBe(false)
    expect(result.skipped.some((s) => s.includes('manifest.json'))).toBe(true)
    expect(await listPacks()).toHaveLength(0)
  })

  it('manifest 解析失败时不会崩溃', async () => {
    const result = await importPackFiles([
      makeFile('characters/broken/manifest.json', '{ not json', 'application/json'),
      makeFile('characters/broken/preview.png', 'p'),
    ])
    expect(result.ok).toBe(false)
    expect(result.skipped.some((s) => s.includes('解析失败'))).toBe(true)
  })

  it('不认识的图片名会被当作兜底展示图', async () => {
    const result = await importPackFiles([
      makeFile('characters/weird/manifest.json', manifest({ name: '怪名字' }), 'application/json'),
      makeFile('characters/weird/随便起的名字.png', 'x'),
    ])
    expect(result.ok).toBe(true)
    const packs = await listPacks()
    expect(packs[0].display).toBeTruthy()
  })

  it('id 会被规范成 pack-小写连字符', async () => {
    await importPackFiles([
      makeFile('characters/Feng_BaoBao/manifest.json', manifest({ name: '测试' }), 'application/json'),
      makeFile('characters/Feng_BaoBao/preview.png', 'p'),
    ])
    const packs = await listPacks()
    expect(packs[0].id).toBe('pack-feng-baobao')
  })

  it('一次导入多个文件夹会得到多个角色包', async () => {
    const result = await importPackFiles([
      makeFile('characters/a/manifest.json', manifest({ name: 'A' }), 'application/json'),
      makeFile('characters/a/preview.png', 'a'),
      makeFile('characters/b/manifest.json', manifest({ name: 'B' }), 'application/json'),
      makeFile('characters/b/portrait.png', 'b'),
    ])
    expect(result.imported).toHaveLength(2)
    expect(await listPacks()).toHaveLength(2)
  })

  it('空选择不会抛错', async () => {
    const result = await importPackFiles([])
    expect(result.ok).toBe(false)
    expect(result.error).toBeTruthy()
  })
})
