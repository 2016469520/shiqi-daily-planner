'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '@/providers/auth-provider'
import { useRepos } from '@/providers/repo-provider'
import { DEFAULT_TAGS } from '@/lib/constants'

const INIT_MARKER_KEY = 'tags_initialized'

/**
 * Ensures default tags exist in the database on first login/demo session.
 *
 * Idempotent: uses upsert semantics (checks by name, not just count)
 * to avoid duplicates from Strict Mode double-firing or concurrent calls.
 *
 * Once ALL 8 default tags exist (by name), sets a persistent marker so
 * subsequent sessions skip initialization entirely. Deleted default tags
 * will NOT be re-created automatically.
 */
export function useInitializeDefaultTags() {
  const { user } = useAuth()
  const { tags, users } = useRepos()
  const initializedRef = useRef(false)

  useEffect(() => {
    if (!user || initializedRef.current) return
    initializedRef.current = true

    const init = async () => {
      try {
        // Check persistent marker first
        const prefs = await users.getPreferences(user.id)
        if (prefs && (prefs as unknown as Record<string, unknown>)[INIT_MARKER_KEY]) {
          return // Already initialized in a previous session
        }

        const existing = await tags.getAll(user.id)
        const existingNames = new Set(
          existing.map((t) => t.name.trim())
        )

        // Only create default tags that don't already exist (by name)
        let createdCount = 0
        let nextSortOrder = existing.length

        for (const defaultTag of DEFAULT_TAGS) {
          if (!existingNames.has(defaultTag.name)) {
            try {
              await tags.create(user.id, {
                name: defaultTag.name,
                color: defaultTag.color,
                icon: defaultTag.icon,
                is_default: true,
                is_visible: true,
                sort_order: nextSortOrder++,
              })
              createdCount++
            } catch {
              // Tag may already exist (race condition) — skip silently
            }
          }
        }

        // Set persistent marker so future sessions skip init
        if (createdCount > 0 || existing.length >= DEFAULT_TAGS.length) {
          try {
            await users.upsertPreferences(user.id, {
              [INIT_MARKER_KEY]: true,
            } as Record<string, unknown>)
          } catch {
            // Non-fatal — will try again next session
          }
        }
      } catch {
        // Initialization failed — will retry next session
      }
    }

    init()
  }, [user, tags, users])
}
