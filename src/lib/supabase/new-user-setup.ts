// ============================================================
// New user setup — runs after signup to create profile,
// preferences, and default tags. This is the application-level
// fallback for the database trigger (handle_new_user).
// ============================================================

import { createClient } from '@/lib/supabase/client'

const DEFAULT_TAGS = [
  { name: '学习', color: '#3b82f6', icon: 'BookOpen' },
  { name: '科研', color: '#8b5cf6', icon: 'FlaskConical' },
  { name: '工作', color: '#f59e0b', icon: 'Briefcase' },
  { name: '运动', color: '#10b981', icon: 'Dumbbell' },
  { name: '生活', color: '#ec4899', icon: 'Heart' },
  { name: '休息', color: '#6b7280', icon: 'Moon' },
  { name: '社交', color: '#06b6d4', icon: 'Users' },
  { name: '其他', color: '#94a3b8', icon: 'Ellipsis' },
]

/**
 * Set up a new user's profile, preferences, and default tags.
 * Uses upsert so it's safe to call multiple times (e.g., if the
 * database trigger partially ran or if signin detects missing data).
 *
 * Returns { success: true } if setup completed, or { success: false, error }
 * if something failed. Never throws — errors are caught and returned.
 */
export async function setupNewUser(userId: string, email: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  try {
    // 1. Upsert profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        display_name: email.split('@')[0] ?? 'User',
        timezone: 'Asia/Shanghai',
        updated_at: new Date().toISOString(),
      })

    if (profileError) {
      console.error('[new-user-setup] Failed to create profile:', profileError)
      return { success: false, error: `Profile creation failed: ${profileError.message}` }
    }

    // 2. Upsert preferences
    const { error: prefsError } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        theme: 'system',
        accent_color: '#3b82f6',
        default_calendar_view: 'month',
        week_starts_on: 0,
        timezone: 'Asia/Shanghai',
        notification_enabled: true,
        compact_mode: false,
        updated_at: new Date().toISOString(),
      })

    if (prefsError) {
      console.error('[new-user-setup] Failed to create preferences:', prefsError)
      // Non-fatal — profile exists, user can still use the app
    }

    // 3. Create default tags (only if they don't already exist)
    const { data: existingTags } = await supabase
      .from('tags')
      .select('id')
      .eq('user_id', userId)

    if (!existingTags || existingTags.length === 0) {
      const tagsToInsert = DEFAULT_TAGS.map((tag, i) => ({
        user_id: userId,
        name: tag.name,
        color: tag.color,
        icon: tag.icon,
        is_default: true,
        is_visible: true,
        sort_order: i,
      }))

      const { error: tagsError } = await supabase
        .from('tags')
        .insert(tagsToInsert)

      if (tagsError) {
        console.error('[new-user-setup] Failed to create default tags:', tagsError)
        // Non-fatal — user can create tags manually
      }
    }

    return { success: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[new-user-setup] Unexpected error:', msg)
    return { success: false, error: msg }
  }
}
