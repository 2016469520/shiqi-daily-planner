// ============================================================
// Offline mutation queue
// Queues data mutations when offline, replays when online.
// Uses IndexedDB via the existing idb-based schema.
// ============================================================

import { openDB, type IDBPDatabase } from 'idb'
import { DB_NAME, DB_VERSION } from '@/lib/constants'

// ---------- Types ----------

export type MutationType = 'create' | 'update' | 'delete'

export interface QueuedMutation {
  id: string
  store: string // e.g., 'tasks', 'habits', 'habit_logs'
  type: MutationType
  entityId: string
  data?: Record<string, unknown>
  timestamp: number
  retryCount: number
}

// ---------- Queue store setup ----------

const QUEUE_STORE = 'offline_mutations'

// Extend the existing IndexedDB schema: the offline_mutations store
// is added to the existing DB via a one-time upgrade check.

let dbPromise: Promise<IDBPDatabase> | null = null

function getDb(): Promise<IDBPDatabase> {
  if (dbPromise) return dbPromise

  dbPromise = openDB(DB_NAME, DB_VERSION + 1, {
    upgrade(db) {
      // Add offline_mutations store if it doesn't exist
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        const store = db.createObjectStore(QUEUE_STORE, { keyPath: 'id' })
        store.createIndex('by-store', 'store')
        store.createIndex('by-timestamp', 'timestamp')
      }
    },
  })

  return dbPromise
}

// ---------- Public API ----------

/**
 * Add a mutation to the offline queue.
 */
export async function enqueueMutation(mutation: Omit<QueuedMutation, 'timestamp' | 'retryCount'>): Promise<void> {
  try {
    const db = await getDb()
    await db.add(QUEUE_STORE, {
      ...mutation,
      timestamp: Date.now(),
      retryCount: 0,
    })
  } catch {
    // Silently fail if queue is unavailable
  }
}

/**
 * Get all pending mutations, optionally filtered by store.
 */
export async function getPendingMutations(store?: string): Promise<QueuedMutation[]> {
  try {
    const db = await getDb()
    const all = await db.getAll(QUEUE_STORE)
    const filtered = store ? all.filter((m) => m.store === store) : all
    return filtered.sort((a, b) => a.timestamp - b.timestamp)
  } catch {
    return []
  }
}

/**
 * Get the count of pending mutations.
 */
export async function getPendingCount(): Promise<number> {
  try {
    const db = await getDb()
    return await db.count(QUEUE_STORE)
  } catch {
    return 0
  }
}

/**
 * Remove a mutation from the queue (after successful replay).
 */
export async function dequeueMutation(id: string): Promise<void> {
  try {
    const db = await getDb()
    await db.delete(QUEUE_STORE, id)
  } catch {
    // Silently fail
  }
}

/**
 * Increment retry count for a failed mutation.
 */
export async function incrementRetry(id: string): Promise<void> {
  try {
    const db = await getDb()
    const tx = db.transaction(QUEUE_STORE, 'readwrite')
    const store = tx.objectStore(QUEUE_STORE)
    const mutation = await store.get(id)
    if (mutation) {
      mutation.retryCount++
      await store.put(mutation)
    }
    await tx.done
  } catch {
    // Silently fail
  }
}

/**
 * Clean up mutations that have exceeded max retries (e.g., 5).
 */
export async function cleanupDeadMutations(maxRetries = 5): Promise<number> {
  try {
    const db = await getDb()
    const all = await db.getAll(QUEUE_STORE)
    const dead = all.filter((m) => m.retryCount >= maxRetries)
    const tx = db.transaction(QUEUE_STORE, 'readwrite')
    for (const m of dead) {
      await tx.store.delete(m.id)
    }
    await tx.done
    return dead.length
  } catch {
    return 0
  }
}

/**
 * Clear all queued mutations.
 */
export async function clearAllMutations(): Promise<void> {
  try {
    const db = await getDb()
    await db.clear(QUEUE_STORE)
  } catch {
    // Silently fail
  }
}

// ---------- Online status ----------

/**
 * Check if the browser is currently online.
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true
}
