import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { __testing } from '@/lib/atmosphere/bundled-packs'

const { stateKindOf } = __testing
const ROOT = path.resolve(process.cwd(), 'public/characters')

interface BundledManifest {
  name?: string
  redistribution_allowed?: boolean
  dialogue?: Record<string, string[]>
  preferred_accent?: string
}

interface BundledIndex {
  packs: {
    id: string
    version: string
    manifest: BundledManifest
    display: string
    states?: Record<string, string>
  }[]
}

describe('内置素材包索引', () => {
  const indexPath = path.join(ROOT, 'index.json')

  it('index.json 存在且可解析', () => {
    expect(fs.existsSync(indexPath)).toBe(true)
    const index = JSON.parse(fs.readFileSync(indexPath, 'utf8')) as BundledIndex
    expect(Array.isArray(index.packs)).toBe(true)
  })

  it('每个内置包都明确允许再分发', () => {
    const index = JSON.parse(fs.readFileSync(indexPath, 'utf8')) as BundledIndex
    for (const pack of index.packs) {
      expect(pack.manifest.redistribution_allowed, `${pack.id} 缺少 redistribution_allowed`).toBe(true)
    }
  })

  it('展示图与状态图文件真实存在', () => {
    const index = JSON.parse(fs.readFileSync(indexPath, 'utf8')) as BundledIndex
    for (const pack of index.packs) {
      const dir = path.join(ROOT, pack.id)
      expect(fs.existsSync(path.join(dir, pack.display)), `${pack.id}/${pack.display} 不存在`).toBe(true)
      for (const file of Object.values(pack.states ?? {})) {
        expect(fs.existsSync(path.join(dir, file)), `${pack.id}/${file} 不存在`).toBe(true)
      }
    }
  })

  it('每个包都有名字与展示图，索引里不出现目录里没有的包', () => {
    const index = JSON.parse(fs.readFileSync(indexPath, 'utf8')) as BundledIndex
    const dirs = fs
      .readdirSync(ROOT, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort()
    expect(index.packs.map((p) => p.id).sort()).toEqual(dirs)
    for (const pack of index.packs) {
      expect(pack.manifest.name).toBeTruthy()
      expect(pack.display).toMatch(/\.(png|webp|jpg|jpeg|gif|avif)$/i)
    }
  })
})

describe('内置包展示图类型判定', () => {
  it('按文件名判定展示图类型', () => {
    expect(stateKindOf('half_body.webp')).toBe('half_body')
    expect(stateKindOf('full_body.png')).toBe('full_body')
    expect(stateKindOf('portrait.jpg')).toBe('portrait')
    expect(stateKindOf('随便起的名.webp')).toBe('preview')
  })
})
