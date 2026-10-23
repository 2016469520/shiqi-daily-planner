'use client'

// ============================================================
// 本地角色素材包（模式 A：用户素材优先）
//
// 目录约定（放在任意位置，导入时选中 characters 文件夹即可）：
//
//   characters/
//     feng_baobao/
//       manifest.json
//       full_body.png     ← 优先显示
//       half_body.png
//       portrait.png
//       preview.png
//       happy.png  thinking.png  working.png  success.png  error.png
//
// 解析规则：
// - 一个子文件夹 = 一个角色包，必须含 manifest.json
// - 图片按"资源类型"归类：full_body > half_body > portrait > preview
// - 文件名命中表情词（normal/happy/thinking/working/success/error/sleepy）
//   就作为该状态的表情图
// - 展示图与表情图分离：卡片用展示图，角色陪伴位按情绪挑表情图
//
// 存储：独立 IndexedDB（timegrid-character-packs），不碰业务库，
// 也不碰已有的自定义素材库（timegrid-atmosphere）。
// ============================================================

import { useEffect, useSyncExternalStore } from 'react'
import { getDesktopBridge } from '@/lib/desktop-bridge'
import type { CharacterExpression } from '@/lib/theme/atmosphere'
import type { PackDialogue } from './pack-dialogue'

const DB_NAME = 'timegrid-character-packs'
const DB_VERSION = 1
const STORE = 'packs'

export type PackImageKind = 'full_body' | 'half_body' | 'portrait' | 'preview'

/** manifest.json 的字段（全部可选，除 name 外都有默认） */
export interface PackManifest {
  id?: string
  name?: string
  series?: string
  tags?: string[]
  preferred_theme?: string
  preferred_accent?: string
  preferred_background?: string
  description?: string
  /** Text lives outside the artwork and appears in the companion bubble. */
  dialogue?: PackDialogue
  /** 是否允许随仓库/安装包再分发；只有 true 的包才会被内置安装 */
  redistribution_allowed?: boolean
  /** 包的版本号，用于判断是否需要重新写入本地 */
  version?: string | number
}

export interface CharacterPack {
  id: string
  manifest: PackManifest
  /** 展示图，按优先级取第一张存在的 */
  display?: Blob
  /** 已识别到的展示图类型 */
  displayKind?: PackImageKind
  /** 状态表情图 */
  states: Partial<Record<CharacterExpression, Blob>>
  createdAt: string
}

const KIND_PRIORITY: PackImageKind[] = ['full_body', 'half_body', 'portrait', 'preview']

const STATE_ALIASES: Record<string, CharacterExpression> = {
  normal: 'idle',
  idle: 'idle',
  default: 'idle',
  happy: 'happy',
  smile: 'happy',
  success: 'happy',
  done: 'happy',
  thinking: 'thinking',
  think: 'thinking',
  working: 'working',
  work: 'working',
  error: 'error',
  fail: 'error',
  sleepy: 'sleepy',
  sleep: 'sleepy',
}

function baseName(path: string): string {
  const file = path.split('/').pop() ?? path
  return file.replace(/\.[^.]+$/, '')
}

function extName(path: string): string {
  const m = /\.([^.]+)$/.exec(path)
  return m ? m[1].toLowerCase() : ''
}

const IMAGE_EXT = ['png', 'webp', 'jpg', 'jpeg', 'gif', 'avif']

/** 从 webkitRelativePath 里取出"包目录名" */
function packDirOf(relativePath: string): string | null {
  const parts = relativePath.split('/').filter(Boolean)
  // 形如 characters/feng_baobao/xxx.png 或 feng_baobao/xxx.png
  if (parts.length < 2) return null
  return parts[parts.length - 2]
}

// ------------------------------------------------------------
// IndexedDB
// ------------------------------------------------------------

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode)
    const req = run(tx.objectStore(STORE))
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function listPacks(): Promise<CharacterPack[]> {
  if (typeof indexedDB === 'undefined') return []
  try {
    const all = await withStore<CharacterPack[]>('readonly', (s) => s.getAll() as IDBRequest<CharacterPack[]>)
    return all.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  } catch {
    return []
  }
}

export async function savePack(pack: CharacterPack): Promise<void> {
  await withStore('readwrite', (s) => s.put(pack) as unknown as IDBRequest<IDBValidKey>)
  // Reimporting a cutout can produce the same byte length as the old image.
  revokePackUrls(pack.id)
  await refreshPacks()
}

export async function deletePack(id: string): Promise<void> {
  await withStore('readwrite', (s) => s.delete(id) as unknown as IDBRequest<undefined>)
  revokePackUrls(id)
  await refreshPacks()
}

// ------------------------------------------------------------
// object URL 缓存（每个包每张图只解码一次）
// ------------------------------------------------------------

const urlCache = new Map<string, string>()

export function packImageUrl(pack: CharacterPack, blob: Blob | undefined, key: string): string | null {
  if (!blob) return null
  const cacheKey = `${pack.id}:${key}:${blob.size}`
  const hit = urlCache.get(cacheKey)
  if (hit) return hit
  const url = URL.createObjectURL(blob)
  urlCache.set(cacheKey, url)
  return url
}

export function displayUrl(pack: CharacterPack): string | null {
  return packImageUrl(pack, pack.display, `display:${pack.displayKind ?? 'x'}`)
}

export function stateUrl(pack: CharacterPack, state: CharacterExpression): string | null {
  const blob = pack.states[state] ?? pack.states.idle ?? pack.display
  if (!blob) return null
  return packImageUrl(pack, blob, pack.states[state] ? `state:${state}` : 'display-fallback')
}

function revokePackUrls(id: string): void {
  for (const [key, url] of urlCache) {
    if (key.startsWith(`${id}:`)) {
      URL.revokeObjectURL(url)
      urlCache.delete(key)
    }
  }
}

// ------------------------------------------------------------
// 从文件夹导入
// ------------------------------------------------------------

export interface ImportResult {
  ok: boolean
  imported: string[]
  skipped: string[]
  error?: string
}

/** 解析一组文件（来自 <input webkitdirectory>），按子目录分组 */
export async function importPackFiles(files: FileList | File[]): Promise<ImportResult> {
  const list = Array.from(files)
  if (list.length === 0) return { ok: false, imported: [], skipped: [], error: '没有选择文件' }

  const groups = new Map<string, File[]>()
  for (const file of list) {
    const rel = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name
    const dir = packDirOf(rel)
    if (!dir) continue
    const arr = groups.get(dir) ?? []
    arr.push(file)
    groups.set(dir, arr)
  }

  if (groups.size === 0) {
    return {
      ok: false,
      imported: [],
      skipped: [],
      error: '没找到角色文件夹。请选择包含「角色名/manifest.json」的 characters 目录',
    }
  }

  const imported: string[] = []
  const skipped: string[] = []

  for (const [dir, group] of groups) {
    const manifestFile = group.find((f) => baseName(f.name).toLowerCase() === 'manifest')
    if (!manifestFile) {
      skipped.push(`${dir}（缺少 manifest.json）`)
      continue
    }
    let manifest: PackManifest = {}
    try {
      manifest = JSON.parse(await manifestFile.text()) as PackManifest
    } catch {
      skipped.push(`${dir}（manifest.json 解析失败）`)
      continue
    }

    const byKind = new Map<PackImageKind, File>()
    const states: Partial<Record<CharacterExpression, Blob>> = {}
    let biggest: File | null = null

    for (const file of group) {
      const ext = extName(file.name)
      if (!IMAGE_EXT.includes(ext)) continue
      const base = baseName(file.name).toLowerCase()

      if ((KIND_PRIORITY as string[]).includes(base)) {
        byKind.set(base as PackImageKind, file)
        continue
      }
      const state = STATE_ALIASES[base]
      if (state) {
        states[state] = file
        continue
      }
      // 名字不认识：留给"最大张"兜底
      if (!biggest || file.size > biggest.size) biggest = file
    }

    const displayKind = KIND_PRIORITY.find((k) => byKind.has(k))
    const displayFile = displayKind ? byKind.get(displayKind) : biggest
    if (!displayFile) {
      skipped.push(`${dir}（没有可用图片）`)
      continue
    }

    // id 里只保留 a-z0-9，用连字符连接：pack-only-preview / pack-baobao-local
    const slug = (manifest.id || dir)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
    const id = `pack-${slug}`
    await savePack({
      id,
      manifest: {
        ...manifest,
        name: manifest.name || dir,
      },
      display: displayFile,
      displayKind: displayKind ?? 'preview',
      states,
      createdAt: new Date().toISOString(),
    })
    imported.push(`${manifest.name || dir}（${displayKind ?? '自动'}）`)
  }

  return {
    ok: imported.length > 0,
    imported,
    skipped,
    error: imported.length === 0 ? '没有导入任何角色包' : undefined,
  }
}

// ------------------------------------------------------------
// 桌面版：扫描 <userData>/characters 下的角色包
// ------------------------------------------------------------

export interface ScannedPack {
  dir: string
  manifest: PackManifest
  /** 文件名（不含扩展名，小写）→ data URL */
  images: Record<string, string>
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, base64] = dataUrl.split(',')
  const mime = /:(.*?);/.exec(meta)?.[1] ?? 'image/png'
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

/** 把扫描结果写进 IndexedDB（同一个包重复扫描会覆盖更新） */
export async function importScannedPacks(list: ScannedPack[]): Promise<ImportResult> {
  const imported: string[] = []
  const skipped: string[] = []

  for (const pack of list) {
    const byKind = new Map<PackImageKind, Blob>()
    const states: Partial<Record<CharacterExpression, Blob>> = {}
    let biggest: Blob | null = null

    for (const [key, dataUrl] of Object.entries(pack.images)) {
      const blob = dataUrlToBlob(dataUrl)
      if (!biggest || blob.size > biggest.size) biggest = blob
      if ((KIND_PRIORITY as string[]).includes(key)) {
        byKind.set(key as PackImageKind, blob)
        continue
      }
      const state = STATE_ALIASES[key]
      if (state) states[state] = blob
    }

    const displayKind = KIND_PRIORITY.find((k) => byKind.has(k))
    const display = displayKind ? byKind.get(displayKind) : biggest
    if (!display) {
      skipped.push(pack.dir)
      continue
    }

    const slug = (pack.manifest.id || pack.dir)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    await savePack({
      id: `pack-${slug}`,
      manifest: { ...pack.manifest, name: pack.manifest.name || pack.dir },
      display,
      displayKind: displayKind ?? 'preview',
      states,
      createdAt: new Date().toISOString(),
    })
    imported.push(pack.manifest.name || pack.dir)
  }

  return { ok: imported.length > 0, imported, skipped }
}

/** 桌面版可用：返回扫描到的角色包（浏览器里返回空） */
export async function scanDesktopPacks(): Promise<ScannedPack[]> {
  const bridge = getDesktopBridge()
  if (!bridge?.scanCharacterPacks) return []
  try {
    const result = await bridge.scanCharacterPacks()
    return (result?.packs ?? []) as ScannedPack[]
  } catch {
    return []
  }
}
// ------------------------------------------------------------
// 从图片链接导入（"我找到一张图，直接用它"）
//
// 先试 fetch；跨域被拦时退回 <img> + canvas，仍然画不出来就明确报错，
// 让用户存到本地再用「导入角色包」。
// ------------------------------------------------------------

const MAX_URL_BYTES = 8 * 1024 * 1024

/** 用 canvas 抓一张跨域图（需要对方允许 CORS，否则会抛错） */
async function blobFromImageElement(url: string): Promise<Blob> {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('图片加载失败'))
    img.src = url
  })
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法读取图片')
  ctx.drawImage(img, 0, 0)
  // 跨域图未授权时会在这里抛 SecurityError
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('无法转换图片')
  return blob
}

export async function importPackFromUrl(
  rawUrl: string,
  displayName?: string
): Promise<ImportResult> {
  const url = rawUrl.trim()
  if (!/^https?:\/\//i.test(url)) {
    return { ok: false, imported: [], skipped: [], error: '请填以 http(s):// 开头的图片链接' }
  }

  let blob: Blob | null = null
  try {
    const res = await fetch(url, { mode: 'cors' })
    if (res.ok) blob = await res.blob()
  } catch {
    blob = null
  }
  if (!blob || !blob.type.startsWith('image/')) {
    try {
      blob = await blobFromImageElement(url)
    } catch {
      return {
        ok: false,
        imported: [],
        skipped: [],
        error: '这个链接不允许跨域读取。请把图片存到本地，再用「导入角色包」',
      }
    }
  }
  if (!blob.type.startsWith('image/')) {
    return { ok: false, imported: [], skipped: [], error: '这个链接不是图片' }
  }
  if (blob.size > MAX_URL_BYTES) {
    return { ok: false, imported: [], skipped: [], error: '图片超过 8MB' }
  }

  const guessed = decodeURIComponent(url.split('/').pop() ?? '')
    .replace(/\.[^.]+$/, '')
    .slice(0, 40)
  const name = (displayName || guessed || '网络图片').slice(0, 40)
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  const id = `pack-url-${slug || Date.now().toString(36)}`

  await savePack({
    id,
    manifest: { name, series: '网络素材', tags: ['网络'] },
    display: blob,
    displayKind: blob.type === 'image/gif' ? 'preview' : 'portrait',
    states: {},
    createdAt: new Date().toISOString(),
  })

  return { ok: true, imported: [name], skipped: [] }
}
// ------------------------------------------------------------
// 外部 store：让 UI 用 useSyncExternalStore 订阅
// ------------------------------------------------------------

let snapshot: CharacterPack[] = []
let loaded = false
const listeners = new Set<() => void>()

function emit() {
  for (const l of listeners) l()
}

export async function refreshPacks(): Promise<void> {
  snapshot = await listPacks()
  loaded = true
  emit()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useCharacterPacks(): CharacterPack[] {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => snapshot
  )
}

export function usePacksLoaded(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => loaded,
    () => false
  )
}

export function useLoadPacks(): void {
  const isLoaded = usePacksLoaded()
  useEffect(() => {
    if (!isLoaded) void refreshPacks()
  }, [isLoaded])
}

/** 供测试/脚本调用：清空全部角色包 */
export async function clearPacks(): Promise<void> {
  const all = await listPacks()
  for (const p of all) await deletePack(p.id)
}

export const __testing = { STATE_ALIASES, KIND_PRIORITY, packDirOf, baseName }
