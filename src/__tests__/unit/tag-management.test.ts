import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createIndexedDBRepositoryFactory } from '@/lib/repositories/indexeddb-impl'
import { closeDB } from '@/lib/db/indexeddb'
import { DEFAULT_TAGS } from '@/lib/constants'
import type { RepositoryFactory } from '@/lib/repositories/interfaces'

const TEST_USER = 'test-user-tags-001'
const TEST_USER_2 = 'test-user-tags-002'

describe('Tag Management — Deduplication & Deletion', () => {
  let repos: RepositoryFactory

  beforeAll(() => {
    repos = createIndexedDBRepositoryFactory()
  })

  afterAll(async () => {
    await closeDB()
  })

  describe('Default Tags Initialization', () => {
    it('should create exactly 8 default tags for a new user', async () => {
      // Simulate init — create all default tags
      for (let i = 0; i < DEFAULT_TAGS.length; i++) {
        const dt = DEFAULT_TAGS[i]
        await repos.tags.create(TEST_USER, {
          name: dt.name,
          color: dt.color,
          icon: dt.icon,
          is_default: true,
          is_visible: true,
          sort_order: i,
        })
      }

      const tags = await repos.tags.getAll(TEST_USER)
      expect(tags.length).toBe(8)

      const tagNames = tags.map((t) => t.name)
      for (const dt of DEFAULT_TAGS) {
        expect(tagNames).toContain(dt.name)
      }
    })

    it('should NOT create duplicates when init runs twice (name-based check)', async () => {
      const beforeCount = (await repos.tags.getAll(TEST_USER)).length

      // Simulate second init — should skip existing names
      const existing = await repos.tags.getAll(TEST_USER)
      const existingNames = new Set(existing.map((t) => t.name.trim()))

      for (const dt of DEFAULT_TAGS) {
        if (!existingNames.has(dt.name)) {
          await repos.tags.create(TEST_USER, {
            name: dt.name,
            color: dt.color,
            icon: dt.icon,
            is_default: true,
            is_visible: true,
            sort_order: existing.length,
          })
        }
      }

      const afterCount = (await repos.tags.getAll(TEST_USER)).length
      expect(afterCount).toBe(beforeCount) // No duplicates created
    })

    it('should isolate tags between different users', async () => {
      // Create 3 tags for another user
      for (let i = 0; i < 3; i++) {
        await repos.tags.create(TEST_USER_2, {
          name: `User2 Tag ${i}`,
          color: '#333333',
          is_default: false,
          is_visible: true,
          sort_order: i,
        })
      }

      const user1Tags = await repos.tags.getAll(TEST_USER)
      const user2Tags = await repos.tags.getAll(TEST_USER_2)

      expect(user1Tags.length).toBe(8) // Only the 8 defaults
      expect(user2Tags.length).toBe(3) // Only user2's 3 tags

      // User1 should not see user2's tags
      for (const tag of user2Tags) {
        expect(user1Tags.find((t) => t.id === tag.id)).toBeUndefined()
      }
    })

    it('should handle sequential init attempts gracefully (ref guard pattern)', async () => {
      const testUser = 'test-user-concurrent'
      // Simulate the hook's ref guard: first call runs, second is skipped
      let initialized = false

      const initOnce = async () => {
        if (initialized) return // ref guard
        initialized = true

        const existing = await repos.tags.getAll(testUser)
        const existingNames = new Set(existing.map((t) => t.name.trim()))
        for (const dt of DEFAULT_TAGS) {
          if (!existingNames.has(dt.name)) {
            await repos.tags.create(testUser, {
              name: dt.name,
              color: dt.color,
              icon: dt.icon,
              is_default: true,
              is_visible: true,
              sort_order: existing.length,
            })
          }
        }
      }

      // Simulate React Strict Mode double-fire: both calls run, but ref guard blocks second
      await Promise.all([initOnce(), initOnce()])

      const tags = await repos.tags.getAll(testUser)
      const names = tags.map((t) => t.name)
      const uniqueNames = new Set(names)
      expect(uniqueNames.size).toBe(names.length) // No duplicates
      expect(names.length).toBe(DEFAULT_TAGS.length)
    })

    it('should NOT re-create default tags after user deletes them all', async () => {
      const testUser = 'test-user-no-recreate'
      // First init
      for (let i = 0; i < DEFAULT_TAGS.length; i++) {
        await repos.tags.create(testUser, {
          name: DEFAULT_TAGS[i].name,
          color: DEFAULT_TAGS[i].color,
          is_default: true,
          is_visible: true,
          sort_order: i,
        })
      }

      // User deletes all tags
      const allTags = await repos.tags.getAll(testUser)
      for (const tag of allTags) {
        await repos.tags.delete(testUser, tag.id)
      }
      expect((await repos.tags.getAll(testUser)).length).toBe(0)

      // Simulate a re-init with preferences marker set — should skip
      await repos.users.upsertPreferences(testUser, {
        tags_initialized: true,
      } as unknown as Partial<import('@/types').UserPreferences>)

      // This would be the hook checking the marker
      const prefs = await repos.users.getPreferences(testUser)
      const markerSet = prefs && (prefs as unknown as Record<string, unknown>).tags_initialized
      if (!markerSet) {
        // This path should NOT execute
        const existing = await repos.tags.getAll(testUser)
        if (existing.length === 0) {
          for (const dt of DEFAULT_TAGS) {
            await repos.tags.create(testUser, {
              name: dt.name,
              color: dt.color,
              is_default: true,
              is_visible: true,
              sort_order: 0,
            })
          }
        }
      }

      // Tags should still be empty — marker prevented re-creation
      expect((await repos.tags.getAll(testUser)).length).toBe(0)
    })
  })

  describe('Tag Deletion', () => {
    it('should delete an unused tag successfully', async () => {
      const tag = await repos.tags.create(TEST_USER, {
        name: 'unused-tag',
        color: '#abcdef',
        is_default: false,
        is_visible: true,
        sort_order: 99,
      })

      await repos.tags.delete(TEST_USER, tag.id)
      const fetched = await repos.tags.getById(TEST_USER, tag.id)
      expect(fetched).toBeNull()
    })

    it('should delete a tag and migrate tasks to another tag', async () => {
      // Create source tag and target tag
      const sourceTag = await repos.tags.create(TEST_USER, {
        name: 'source-tag',
        color: '#ff0000',
        is_default: false,
        is_visible: true,
        sort_order: 100,
      })

      const targetTag = await repos.tags.create(TEST_USER, {
        name: 'target-tag',
        color: '#00ff00',
        is_default: false,
        is_visible: true,
        sort_order: 101,
      })

      // Create tasks using source tag
      await repos.tasks.create(TEST_USER, {
        title: 'Task with source tag',
        task_date: '2026-07-01',
        period: 'morning',
        priority: 'normal',
        status: 'todo',
        tag_id: sourceTag.id,
        order_index: 0,
      })

      // Delete source tag, migrating to target
      await repos.tags.delete(TEST_USER, sourceTag.id, targetTag.id)

      // Source tag should be gone
      const fetchedSource = await repos.tags.getById(TEST_USER, sourceTag.id)
      expect(fetchedSource).toBeNull()

      // Target tag should still exist
      const fetchedTarget = await repos.tags.getById(TEST_USER, targetTag.id)
      expect(fetchedTarget).toBeDefined()

      // Tasks should now reference target tag
      const tasks = await repos.tasks.getByDate(TEST_USER, '2026-07-01')
      const migratedTask = tasks.find((t) => t.title === 'Task with source tag')
      expect(migratedTask).toBeDefined()
      expect(migratedTask!.tag_id).toBe(targetTag.id)
    })

    it('should delete a tag and clear tag reference from tasks', async () => {
      // Create tag
      const tagToClear = await repos.tags.create(TEST_USER, {
        name: 'clear-tag',
        color: '#0000ff',
        is_default: false,
        is_visible: true,
        sort_order: 102,
      })

      // Create tasks using this tag
      await repos.tasks.create(TEST_USER, {
        title: 'Task to clear',
        task_date: '2026-07-02',
        period: 'afternoon',
        priority: 'normal',
        status: 'todo',
        tag_id: tagToClear.id,
        order_index: 0,
      })

      // Clear tag from tasks first, then delete tag
      const userTasks = await repos.tasks.filter(TEST_USER, { tagIds: [tagToClear.id] })
      for (const task of userTasks) {
        await repos.tasks.update(TEST_USER, task.id, { tag_id: undefined } as Partial<import('@/types').Task>)
      }
      await repos.tags.delete(TEST_USER, tagToClear.id)

      // Tag should be gone
      expect(await repos.tags.getById(TEST_USER, tagToClear.id)).toBeNull()

      // Tasks should have no tag
      const tasks = await repos.tasks.getByDate(TEST_USER, '2026-07-02')
      const clearedTask = tasks.find((t) => t.title === 'Task to clear')
      expect(clearedTask).toBeDefined()
      expect(clearedTask!.tag_id).toBeUndefined()
    })
  })

  describe('Default Tag Deletion', () => {
    it('should allow deleting a default tag', async () => {
      const tags = await repos.tags.getAll(TEST_USER)
      const defaultTag = tags.find((t) => t.is_default)
      expect(defaultTag).toBeDefined()

      if (defaultTag) {
        await repos.tags.delete(TEST_USER, defaultTag.id)
        const fetched = await repos.tags.getById(TEST_USER, defaultTag.id)
        expect(fetched).toBeNull()

        // Tag count should decrease
        const afterTags = await repos.tags.getAll(TEST_USER)
        expect(afterTags.length).toBe(tags.length - 1)
      }
    })
  })
})
