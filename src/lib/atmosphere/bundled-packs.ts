'use client'

// ============================================================
// 内置素材包：随软件分发的角色包（public/characters/）
//
// 新用户第一次打开时，自动把仓库里自带的角色包装进本地 IndexedDB，
// 不需要手动导入。
//
// 约定：
//   public/characters/index.json   ← 由 scripts/verify-bundled-packs.mjs 生成
//   public/characters/<包名>/manifest.json + 图片
//
// 只接受 manifest 里明确写了 "redistribution_allowed": true 的包；
// 生成脚本会拦下没写这个标记的包，避免把不可再分发的素材打包进公开仓库。
//
// 升级策略：manifest.version 变化时才重新写入，避免每次启动都覆盖
// 用户自己调过的包，也避免无谓地重写几 MB 图片。
// ============================================================

import { useCallback, useEffect } from 'react'
import type { CharacterExpression } from '@/lib/theme/atmosphere'
import { savePack, refreshPacks, type PackManifest } from './character-packs'

const INDEX_URL = '/characters/index.json'
const SEED_KEY = 'timegrid:bundled-packs:v1'

export interface BundledPackEntry {
  /** 包 id（不带 pack- 前缀） */
  id: string
  version: string
  manifest: PackManifest
  /** 展示图相对路径（相对该包目录） */
  display: string
  /** 状态图：状态 → 相对路径 */
  states?: Partial<Record<CharacterExpression, string>>
}

interface BundledIndex {
  packs: BundledPackEntry[]
}

const STATE_KEYS: CharacterExpression[] = ['idle', 'happy', 'thinking', 'working', 'error', 'sleepy']

async function fetchBlob(url: string): Promise<Blob | null> {
  try {
    const res = await fetch(url, { cache: 'force-cache' })
    if (!res.ok) return null
    const blob = await res.blob()
    return blob.type.startsWith('image/') ? blob : null
  } catch {
    return null
  }
}

function readSeeded(): Record<string, string> {
  try {
    const raw = localStorage.getItem(SEED_KEY)
    return raw ? (JSON.parse(raw) as Record<string, string>) : {}
  } catch {
    return {}
  }
}

function writeSeeded(value: Record<string, string>): void {
  try {
    localStorage.setItem(SEED_KEY, JSON.stringify(value))
  } catch {
    // 存储被禁用时忽略：下次启动会重试
  }
}

export interface SeedResult {
  installed: string[]
  skipped: string[]
}

/**
 * 把 public/characters/index.json 里列出的包安装到本地。
 * 已经装过同版本的会跳过。失败不影响应用启动。
 */
export async function seedBundledPacks(): Promise<SeedResult> {
  if (typeof window === 'undefined') return { installed: [], skipped: [] }

  let index: BundledIndex | null = null
  try {
    const res = await fetch(INDEX_URL, { cache: 'no-cache' })
    if (!res.ok) return { installed: [], skipped: [] }
    index = (await res.json()) as BundledIndex
  } catch {
    return { installed: [], skipped: [] }
  }
  if (!index?.packs?.length) return { installed: [], skipped: [] }

  const seeded = readSeeded()
  const installed: string[] = []
  const skipped: string[] = []

  for (const entry of index.packs) {
    if (!entry?.id || !entry.manifest) continue
    if (seeded[entry.id] === entry.version) {
      skipped.push(entry.id)
      continue
    }
    // 版权闸门：只有明确允许再分发的包才会被内置分发
    if (entry.manifest.redistribution_allowed !== true) {
      skipped.push(entry.id)
      continue
    }

    const base = `/characters/${entry.id}`
    const display = await fetchBlob(`${base}/${entry.display}`)
    if (!display) {
      skipped.push(entry.id)
      continue
    }

    const states: Partial<Record<CharacterExpression, Blob>> = {}
    for (const key of STATE_KEYS) {
      const rel = entry.states?.[key]
      if (!rel) continue
      const blob = await fetchBlob(`${base}/${rel}`)
      if (blob) states[key] = blob
    }

    // 与本地导入共用同一套 id 归一化：feng_baobao 与 feng-baobao 视为同一个角色，
    // 否则用户升级后会在库里看到两份冯宝宝
    const slug = entry.id
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    await savePack({
      id: `pack-${slug}`,
      manifest: entry.manifest,
      display,
      displayKind: stateKindOf(entry.display),
      states,
      createdAt: new Date().toISOString(),
    })
    seeded[entry.id] = entry.version
    installed.push(entry.manifest.name ?? entry.id)
  }

  if (installed.length > 0) {
    writeSeeded(seeded)
    await refreshPacks()
  }
  return { installed, skipped }
}

function stateKindOf(file: string): 'full_body' | 'half_body' | 'portrait' | 'preview' {
  const base = file.replace(/\.[^.]+$/, '').toLowerCase()
  if (base === 'full_body' || base === 'half_body' || base === 'portrait') return base
  return 'preview'
}

// ------------------------------------------------------------
// 只跑一次的小 hook
// ------------------------------------------------------------

let started = false

export function useSeedBundledPacks(onDone?: (result: SeedResult) => void): void {
  const run = useCallback(async () => {
    if (started) return
    started = true
    const result = await seedBundledPacks()
    onDone?.(result)
  }, [onDone])

  useEffect(() => {
    void run()
  }, [run])
}

export const __testing = { STATE_KEYS, stateKindOf }
