// ============================================================
// IndexedDB setup for local demo mode
// ============================================================

import { openDB, type IDBPDatabase } from 'idb'
import { DB_NAME, DB_VERSION } from '@/lib/constants'

let dbPromise: Promise<IDBPDatabase> | null = null

/**
 * Get or create the IndexedDB database.
 * v1: Initial schema with all 10 stores.
 * v2: Schema unchanged; version bump signals tag-dedup readiness.
 * v3: Added countdowns and focus_sessions stores.
 */
export function getDB(): Promise<IDBPDatabase> {
  if (dbPromise) return dbPromise

  dbPromise = openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        createV1Schema(db)
      }
      // v2: no schema changes
      if (oldVersion < 3) {
        createV3Schema(db)
      }
    },
  })

  return dbPromise
}

function createV1Schema(db: IDBPDatabase) {
  // Tasks store
  if (!db.objectStoreNames.contains('tasks')) {
    const tasksStore = db.createObjectStore('tasks', { keyPath: 'id' })
    tasksStore.createIndex('user_id', 'user_id')
    tasksStore.createIndex('task_date', 'task_date')
    tasksStore.createIndex('user_date', ['user_id', 'task_date'])
    tasksStore.createIndex('user_status', ['user_id', 'status'])
  }

  // Task subitems store
  if (!db.objectStoreNames.contains('task_subitems')) {
    const subStore = db.createObjectStore('task_subitems', { keyPath: 'id' })
    subStore.createIndex('task_id', 'task_id')
    subStore.createIndex('user_id', 'user_id')
  }

  // Tags store
  if (!db.objectStoreNames.contains('tags')) {
    const tagsStore = db.createObjectStore('tags', { keyPath: 'id' })
    tagsStore.createIndex('user_id', 'user_id')
  }

  // Habits store
  if (!db.objectStoreNames.contains('habits')) {
    const habitsStore = db.createObjectStore('habits', { keyPath: 'id' })
    habitsStore.createIndex('user_id', 'user_id')
  }

  // Habit logs store
  if (!db.objectStoreNames.contains('habit_logs')) {
    const logsStore = db.createObjectStore('habit_logs', { keyPath: 'id' })
    logsStore.createIndex('user_id', 'user_id')
    logsStore.createIndex('log_date', 'log_date')
    logsStore.createIndex('habit_id', 'habit_id')
    logsStore.createIndex('user_habit_date', ['user_id', 'habit_id', 'log_date'])
  }

  // Daily reviews store
  if (!db.objectStoreNames.contains('daily_reviews')) {
    const reviewsStore = db.createObjectStore('daily_reviews', { keyPath: 'id' })
    reviewsStore.createIndex('user_id', 'user_id')
    reviewsStore.createIndex('review_date', 'review_date')
    reviewsStore.createIndex('user_date', ['user_id', 'review_date'])
  }

  // Task templates store
  if (!db.objectStoreNames.contains('task_templates')) {
    const templatesStore = db.createObjectStore('task_templates', { keyPath: 'id' })
    templatesStore.createIndex('user_id', 'user_id')
  }

  // User preferences store
  if (!db.objectStoreNames.contains('user_preferences')) {
    db.createObjectStore('user_preferences', { keyPath: 'user_id' })
  }

  // User profiles store
  if (!db.objectStoreNames.contains('profiles')) {
    db.createObjectStore('profiles', { keyPath: 'id' })
  }

  // Recurrence exceptions store
  if (!db.objectStoreNames.contains('recurrence_exceptions')) {
    const excStore = db.createObjectStore('recurrence_exceptions', { keyPath: 'id' })
    excStore.createIndex('task_id', 'task_id')
    excStore.createIndex('user_id', 'user_id')
  }
}

function createV3Schema(db: IDBPDatabase) {
  // Countdowns store
  if (!db.objectStoreNames.contains('countdowns')) {
    const cdStore = db.createObjectStore('countdowns', { keyPath: 'id' })
    cdStore.createIndex('user_id', 'user_id')
    cdStore.createIndex('user_date', ['user_id', 'target_date'])
  }

  // Focus sessions store
  if (!db.objectStoreNames.contains('focus_sessions')) {
    const fsStore = db.createObjectStore('focus_sessions', { keyPath: 'id' })
    fsStore.createIndex('user_id', 'user_id')
    fsStore.createIndex('user_status', ['user_id', 'status'])
    fsStore.createIndex('task_id', 'task_id')
  }
}

export async function closeDB(): Promise<void> {
  if (dbPromise) {
    const db = await dbPromise
    db.close()
    dbPromise = null
  }
}
