// ============================================================
// 自定义素材（角色图片 / 背景图片）
//
// 存储策略：
// - 二进制放独立的 IndexedDB（timegrid-atmosphere），避免和业务库共用 schema
// - 元数据在内存里缓存并广播，UI 通过 useSyncExternalStore 订阅
// - 通过 object URL 复用已解码的图片，避免重复读取与解码
//
// 素材包约定见 docs/ATMOSPHERE_PACKS.md：把图片替换成自己的文件即可，
// 不需要改业务代码。
// ============================================================

'use client'

import { useSyncExternalStore } from 'react'
import type { CharacterExpression } from '@/lib/theme/atmosphere'

const DB_NAME = 'timegrid-atmosphere'
const STORE = 'assets'
const DB_VERSION = 1

export type AssetKind = 'character' | 'background'

export interface CustomAssetMeta {
  id: string
  kind: AssetKind
  /** 展示名 */
  name: string
  /** 角色素材可绑定到某个表情；不填表示通用 */
  state?: CharacterExpression
  /** 同一次导入的多张表情共享一个组，切换状态时在组内找对应图 */
  groupId: string
  mime: string
  size: number
  createdAt: string
}

const EMPTY: CustomAssetMeta[] = []

let metas: CustomAssetMeta[] = EMPTY
let loaded = false
const listeners = new Set<() => void>()
const urlCache = new Map<string, string>()

function emit() {
  for (const listener of listeners) listener()
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

interface StoredAsset extends CustomAssetMeta {
  blob: Blob
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await openDb()
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode)
    const request = run(tx.objectStore(STORE))
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    tx.oncomplete = () => db.close()
  })
}

export function subscribeAssets(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getAssets(): CustomAssetMeta[] {
  return metas
}

export async function refreshAssets(): Promise<void> {
  try {
    const all = await withStore<StoredAsset[]>('readonly', (store) => store.getAll())
    metas = all
      .map((item) => ({
        id: item.id,
        kind: item.kind,
        name: item.name,
        state: item.state,
        groupId: item.groupId,
        mime: item.mime,
        size: item.size,
        createdAt: item.createdAt,
      }))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  } catch {
    metas = EMPTY
  }
  loaded = true
  emit()
}

export function isAssetsLoaded(): boolean {
  return loaded
}

/** 保存一张自定义素材；超过 8MB 直接拒绝，避免撑爆配额 */
export async function addAsset(
  file: File,
  meta: { kind: AssetKind; name: string; state?: CharacterExpression; groupId?: string }
): Promise<{ ok: true; asset: CustomAssetMeta } | { ok: false; error: string }> {
  if (!file.type.startsWith('image/')) return { ok: false, error: '只支持图片文件' }
  if (file.size > 8 * 1024 * 1024) return { ok: false, error: '图片不能超过 8MB' }

  const record: StoredAsset = {
    id: `asset-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    kind: meta.kind,
    name: meta.name.trim().slice(0, 40) || (meta.kind === 'character' ? '自定义角色' : '自定义背景'),
    state: meta.state,
    groupId: meta.groupId ?? `group-${Date.now().toString(36)}`,
    mime: file.type,
    size: file.size,
    createdAt: new Date().toISOString(),
    blob: file,
  }
  try {
    await withStore('readwrite', (store) => store.put(record))
    await refreshAssets()
    return {
      ok: true,
      asset: {
        id: record.id,
        kind: record.kind,
        name: record.name,
        state: record.state,
        groupId: record.groupId,
        mime: record.mime,
        size: record.size,
        createdAt: record.createdAt,
      },
    }
  } catch {
    return { ok: false, error: '保存失败，可能是存储空间不足' }
  }
}

export async function deleteAsset(id: string): Promise<void> {
  const cached = urlCache.get(id)
  if (cached) {
    URL.revokeObjectURL(cached)
    urlCache.delete(id)
  }
  try {
    await withStore('readwrite', (store) => store.delete(id))
  } catch {
    /* 删不掉就当没删，下次刷新会重新同步 */
  }
  await refreshAssets()
}

/** 取素材的 object URL（带缓存）；找不到返回 null */
export async function getAssetUrl(id: string | null | undefined): Promise<string | null> {
  if (!id) return null
  const cached = urlCache.get(id)
  if (cached) return cached
  try {
    const record = await withStore<StoredAsset | undefined>('readonly', (store) => store.get(id))
    if (!record?.blob) return null
    const url = URL.createObjectURL(record.blob)
    urlCache.set(id, url)
    return url
  } catch {
    return null
  }
}

/** 组件订阅：素材列表 */
export function useCustomAssets(): CustomAssetMeta[] {
  return useSyncExternalStore(subscribeAssets, getAssets, () => EMPTY)
}

export function useAssetsLoaded(): boolean {
  return useSyncExternalStore(subscribeAssets, isAssetsLoaded, () => false)
}
