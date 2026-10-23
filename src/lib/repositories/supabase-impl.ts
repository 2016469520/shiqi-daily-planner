// ============================================================
// Supabase Repository Implementation
// Used when NEXT_PUBLIC_SUPABASE_URL and ANON_KEY are configured
// ============================================================

import { createClient } from '@/lib/supabase/client'
import { todayStr } from '@/lib/utils/date'
import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  ITaskRepository,
  ITagRepository,
  IHabitRepository,
  IHabitLogRepository,
  IDailyReviewRepository,
  ITaskTemplateRepository,
  IUserRepository,
  ITaskSubitemRepository,
  IRecurrenceExceptionRepository,
  ICountdownRepository,
  IFocusSessionRepository,
  RepositoryFactory,
} from '@/lib/repositories/interfaces'
import type {
  Task,
  TaskSubitem,
  Tag,
  Habit,
  HabitLog,
  DailyReview,
  TaskTemplate,
  UserProfile,
  UserPreferences,
  RecurrenceException,
  Countdown,
  FocusSession,
  DateRange,
} from '@/types'

// ---------- Error types ----------

export class SupabaseRepositoryError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly originalError?: unknown
  ) {
    super(message)
    this.name = 'SupabaseRepositoryError'
  }
}

// ---------- Helpers ----------

function handleError(operation: string, error: unknown): never {
  const msg = error instanceof Error ? error.message : String(error)
  console.error(`[SupabaseRepo] ${operation} failed:`, msg)
  throw new SupabaseRepositoryError(
    `${operation} failed: ${msg}`,
    undefined,
    error
  )
}

function getSupabase(): SupabaseClient {
  return createClient()
}

// Helper to strip nulls from query results (Supabase returns null for missing relations)
function cleanTask(task: Record<string, unknown>): Task {
  return {
    ...task,
    tag: task.tag || undefined,
    subitems: task.subitems || undefined,
  } as Task
}

// ---------- Task Repository ----------

class SupabaseTaskRepository implements ITaskRepository {
  async getByDateRange(userId: string, range: DateRange): Promise<Task[]> {
    try {
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from('tasks')
        .select('*, tag:tags(*)')
        .eq('user_id', userId)
        .gte('task_date', range.start)
        .lte('task_date', range.end)
        .is('deleted_at', null)
        .order('order_index', { ascending: true })

      if (error) throw error
      return (data || []).map((t) => cleanTask(t))
    } catch (e) {
      handleError('getByDateRange', e)
    }
  }

  async getByDate(userId: string, date: string): Promise<Task[]> {
    try {
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from('tasks')
        .select('*, tag:tags(*)')
        .eq('user_id', userId)
        .eq('task_date', date)
        .is('deleted_at', null)
        .order('order_index', { ascending: true })

      if (error) throw error
      return (data || []).map((t) => cleanTask(t))
    } catch (e) {
      handleError('getByDate', e)
    }
  }

  async getById(userId: string, id: string): Promise<Task | null> {
    try {
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from('tasks')
        .select('*, tag:tags(*), subitems:task_subitems(*)')
        .eq('id', id)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        throw error
      }
      return data ? cleanTask(data) : null
    } catch (e) {
      handleError('getById', e)
    }
  }

  async create(
    userId: string,
    data: Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ): Promise<Task> {
    try {
      const supabase = getSupabase()
      const { data: created, error } = await supabase
        .from('tasks')
        .insert({
          user_id: userId,
          title: data.title,
          description: data.description,
          task_date: data.task_date,
          period: data.period,
          start_time: data.start_time,
          end_time: data.end_time,
          tag_id: data.tag_id,
          priority: data.priority,
          status: data.status,
          estimated_minutes: data.estimated_minutes,
          actual_minutes: data.actual_minutes,
          reminder_at: data.reminder_at,
          recurrence_rule: data.recurrence_rule as unknown as Record<string, unknown> | null,
          recurrence_parent_id: data.recurrence_parent_id,
          order_index: data.order_index,
          completed_at: data.completed_at,
        })
        .select()
        .single()

      if (error) throw error
      return created as Task
    } catch (e) {
      handleError('create task', e)
    }
  }

  async update(userId: string, id: string, data: Partial<Task>): Promise<Task> {
    try {
      const supabase = getSupabase()
      const updateData: Record<string, unknown> = {}
      const mappable: Record<string, string> = {
        title: 'title',
        description: 'description',
        task_date: 'task_date',
        period: 'period',
        start_time: 'start_time',
        end_time: 'end_time',
        tag_id: 'tag_id',
        priority: 'priority',
        status: 'status',
        estimated_minutes: 'estimated_minutes',
        actual_minutes: 'actual_minutes',
        reminder_at: 'reminder_at',
        recurrence_parent_id: 'recurrence_parent_id',
        order_index: 'order_index',
        completed_at: 'completed_at',
        deleted_at: 'deleted_at',
      }

      for (const [key, col] of Object.entries(mappable)) {
        if (key in data) {
          updateData[col] = (data as Record<string, unknown>)[key]
        }
      }

      if ('recurrence_rule' in data) {
        updateData.recurrence_rule = data.recurrence_rule
          ? (data.recurrence_rule as unknown as Record<string, unknown>)
          : null
      }

      updateData.updated_at = new Date().toISOString()

      const { data: updated, error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error
      return updated as Task
    } catch (e) {
      handleError('update task', e)
    }
  }

  async softDelete(userId: string, id: string): Promise<void> {
    try {
      const supabase = getSupabase()
      const { error } = await supabase
        .from('tasks')
        .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', userId)

      if (error) throw error
    } catch (e) {
      handleError('softDelete', e)
    }
  }

  async restore(userId: string, id: string): Promise<void> {
    try {
      const supabase = getSupabase()
      const { error } = await supabase
        .from('tasks')
        .update({ deleted_at: null, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', userId)

      if (error) throw error
    } catch (e) {
      handleError('restore', e)
    }
  }

  async permanentlyDelete(userId: string, id: string): Promise<void> {
    try {
      const supabase = getSupabase()
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)

      if (error) throw error
    } catch (e) {
      handleError('permanentlyDelete', e)
    }
  }

  async reorder(userId: string, updates: { id: string; order_index: number }[]): Promise<void> {
    try {
      const supabase = getSupabase()
      const now = new Date().toISOString()
      // Use upsert-like approach: update each task individually
      for (const { id, order_index } of updates) {
        const { error } = await supabase
          .from('tasks')
          .update({ order_index, updated_at: now })
          .eq('id', id)
          .eq('user_id', userId)

        if (error) throw error
      }
    } catch (e) {
      handleError('reorder', e)
    }
  }

  async moveTask(
    userId: string,
    id: string,
    target: { task_date?: string; period?: string; order_index?: number }
  ): Promise<Task> {
    try {
      const supabase = getSupabase()
      const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
      if (target.task_date !== undefined) updateData.task_date = target.task_date
      if (target.period !== undefined) updateData.period = target.period
      if (target.order_index !== undefined) updateData.order_index = target.order_index

      const { data: updated, error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error
      return updated as Task
    } catch (e) {
      handleError('moveTask', e)
    }
  }

  async search(userId: string, query: string): Promise<Task[]> {
    try {
      const supabase = getSupabase()
      const q = `%${query}%`
      const { data, error } = await supabase
        .from('tasks')
        .select('*, tag:tags(*)')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .or(`title.ilike.${q},description.ilike.${q}`)
        .order('task_date', { ascending: false })
        .limit(50)

      if (error) throw error
      return (data || []).map((t) => cleanTask(t))
    } catch (e) {
      handleError('search', e)
    }
  }

  async filter(
    userId: string,
    options: import('@/lib/repositories/interfaces').TaskFilterOptions
  ): Promise<Task[]> {
    try {
      const supabase = getSupabase()
      let query = supabase
        .from('tasks')
        .select('*, tag:tags(*)')
        .eq('user_id', userId)
        .is('deleted_at', null)

      if (options.search) {
        const q = `%${options.search}%`
        query = query.or(`title.ilike.${q},description.ilike.${q}`)
      }

      if (options.tagIds && options.tagIds.length > 0) {
        query = query.in('tag_id', options.tagIds)
      }

      if (options.status && options.status.length > 0) {
        query = query.in('status', options.status)
      }

      if (options.priority && options.priority.length > 0) {
        query = query.in('priority', options.priority)
      }

      if (options.undatedOnly) {
        query = query.is('task_date', null)
      }

      if (options.includeUndated && (options.dateFrom || options.dateTo)) {
        const conditions: string[] = ['task_date.is.null']
        if (options.dateFrom) conditions.push(`task_date.gte.${options.dateFrom}`)
        if (options.dateTo) conditions.push(`task_date.lte.${options.dateTo}`)
        query = query.or(conditions.join(','))
      } else {
        if (options.dateFrom) {
          query = query.gte('task_date', options.dateFrom)
        }
        if (options.dateTo) {
          query = query.lte('task_date', options.dateTo)
        }
      }

      if (options.overdue) {
        const today = todayStr()
        query = query.lt('task_date', today)
          .not('status', 'in', '("done","cancelled")')
      }

      if (options.hasRecurrence) {
        query = query.not('recurrence_rule', 'is', null)
      }

      query = query.order('task_date', { ascending: false })

      if (options.maxResults) {
        query = query.limit(options.maxResults)
      } else {
        query = query.limit(100)
      }

      const { data, error } = await query
      if (error) throw error
      return (data || []).map((t) => cleanTask(t))
    } catch (e) {
      handleError('filter', e)
    }
  }
}

// ---------- Task Subitem Repository ----------

class SupabaseTaskSubitemRepository implements ITaskSubitemRepository {
  async getByTaskId(userId: string, taskId: string): Promise<TaskSubitem[]> {
    try {
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from('task_subitems')
        .select('*')
        .eq('task_id', taskId)
        .eq('user_id', userId)
        .order('sort_order', { ascending: true })

      if (error) throw error
      return data || []
    } catch (e) {
      handleError('getByTaskId', e)
    }
  }

  async create(
    userId: string,
    data: Omit<TaskSubitem, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ): Promise<TaskSubitem> {
    try {
      const supabase = getSupabase()
      const { data: created, error } = await supabase
        .from('task_subitems')
        .insert({
          user_id: userId,
          task_id: data.task_id,
          title: data.title,
          is_completed: data.is_completed,
          sort_order: data.sort_order,
        })
        .select()
        .single()

      if (error) throw error
      return created
    } catch (e) {
      handleError('create subitem', e)
    }
  }

  async update(userId: string, id: string, data: Partial<TaskSubitem>): Promise<TaskSubitem> {
    try {
      const supabase = getSupabase()
      const updateData: Record<string, unknown> = {}
      if (data.title !== undefined) updateData.title = data.title
      if (data.is_completed !== undefined) updateData.is_completed = data.is_completed
      if (data.sort_order !== undefined) updateData.sort_order = data.sort_order
      updateData.updated_at = new Date().toISOString()

      const { data: updated, error } = await supabase
        .from('task_subitems')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error
      return updated
    } catch (e) {
      handleError('update subitem', e)
    }
  }

  async delete(userId: string, id: string): Promise<void> {
    try {
      const supabase = getSupabase()
      const { error } = await supabase
        .from('task_subitems')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)

      if (error) throw error
    } catch (e) {
      handleError('delete subitem', e)
    }
  }

  async toggleComplete(userId: string, id: string): Promise<TaskSubitem> {
    try {
      const supabase = getSupabase()
      // Get current state
      const { data: existing } = await supabase
        .from('task_subitems')
        .select('is_completed')
        .eq('id', id)
        .eq('user_id', userId)
        .single()

      if (!existing) throw new Error('Subitem not found')

      const { data: updated, error } = await supabase
        .from('task_subitems')
        .update({
          is_completed: !existing.is_completed,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error
      return updated
    } catch (e) {
      handleError('toggleComplete subitem', e)
    }
  }
}

// ---------- Tag Repository ----------

class SupabaseTagRepository implements ITagRepository {
  async getAll(userId: string): Promise<Tag[]> {
    try {
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('user_id', userId)
        .order('sort_order', { ascending: true })

      if (error) throw error
      return data || []
    } catch (e) {
      handleError('getAll tags', e)
    }
  }

  async getById(userId: string, id: string): Promise<Tag | null> {
    try {
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        throw error
      }
      return data
    } catch (e) {
      handleError('getById tag', e)
    }
  }

  async create(
    userId: string,
    data: Omit<Tag, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ): Promise<Tag> {
    try {
      const supabase = getSupabase()
      const { data: created, error } = await supabase
        .from('tags')
        .insert({
          user_id: userId,
          name: data.name,
          color: data.color,
          icon: data.icon,
          is_default: data.is_default,
          is_visible: data.is_visible,
          sort_order: data.sort_order,
        })
        .select()
        .single()

      if (error) throw error
      return created
    } catch (e) {
      handleError('create tag', e)
    }
  }

  async update(userId: string, id: string, data: Partial<Tag>): Promise<Tag> {
    try {
      const supabase = getSupabase()
      const updateData: Record<string, unknown> = {}
      if (data.name !== undefined) updateData.name = data.name
      if (data.color !== undefined) updateData.color = data.color
      if (data.icon !== undefined) updateData.icon = data.icon
      if (data.is_visible !== undefined) updateData.is_visible = data.is_visible
      if (data.sort_order !== undefined) updateData.sort_order = data.sort_order
      updateData.updated_at = new Date().toISOString()

      const { data: updated, error } = await supabase
        .from('tags')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error
      return updated
    } catch (e) {
      handleError('update tag', e)
    }
  }

  async delete(userId: string, id: string, migrateToTagId?: string): Promise<void> {
    try {
      const supabase = getSupabase()

      // Migrate tasks if needed
      if (migrateToTagId) {
        const { error: migrateError } = await supabase
          .from('tasks')
          .update({ tag_id: migrateToTagId, updated_at: new Date().toISOString() })
          .eq('tag_id', id)
          .eq('user_id', userId)

        if (migrateError) throw migrateError
      }

      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)

      if (error) throw error
    } catch (e) {
      handleError('delete tag', e)
    }
  }

  async reorder(userId: string, ids: string[]): Promise<void> {
    try {
      const supabase = getSupabase()
      const now = new Date().toISOString()
      for (let i = 0; i < ids.length; i++) {
        const { error } = await supabase
          .from('tags')
          .update({ sort_order: i, updated_at: now })
          .eq('id', ids[i])
          .eq('user_id', userId)

        if (error) throw error
      }
    } catch (e) {
      handleError('reorder tags', e)
    }
  }
}

// ---------- Habit Repository ----------

class SupabaseHabitRepository implements IHabitRepository {
  async getAll(userId: string, includeArchived = false): Promise<Habit[]> {
    try {
      const supabase = getSupabase()
      let query = supabase
        .from('habits')
        .select('*')
        .eq('user_id', userId)

      if (!includeArchived) {
        query = query.is('archived_at', null)
      }

      const { data, error } = await query.order('created_at', { ascending: true })

      if (error) throw error
      return data || []
    } catch (e) {
      handleError('getAll habits', e)
    }
  }

  async getById(userId: string, id: string): Promise<Habit | null> {
    try {
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        throw error
      }
      return data
    } catch (e) {
      handleError('getById habit', e)
    }
  }

  async create(
    userId: string,
    data: Omit<Habit, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ): Promise<Habit> {
    try {
      const supabase = getSupabase()
      const { data: created, error } = await supabase
        .from('habits')
        .insert({
          user_id: userId,
          name: data.name,
          description: data.description,
          icon: data.icon,
          color: data.color,
          measurement_type: data.measurement_type,
          target_value: data.target_value,
          unit: data.unit,
          schedule_rule: data.schedule_rule as unknown as Record<string, unknown>,
          reminder_time: data.reminder_time,
          start_date: data.start_date,
        })
        .select()
        .single()

      if (error) throw error
      return created
    } catch (e) {
      handleError('create habit', e)
    }
  }

  async update(userId: string, id: string, data: Partial<Habit>): Promise<Habit> {
    try {
      const supabase = getSupabase()
      const updateData: Record<string, unknown> = {}
      if (data.name !== undefined) updateData.name = data.name
      if (data.description !== undefined) updateData.description = data.description
      if (data.icon !== undefined) updateData.icon = data.icon
      if (data.color !== undefined) updateData.color = data.color
      if (data.measurement_type !== undefined) updateData.measurement_type = data.measurement_type
      if (data.target_value !== undefined) updateData.target_value = data.target_value
      if (data.unit !== undefined) updateData.unit = data.unit
      if (data.schedule_rule !== undefined) updateData.schedule_rule = data.schedule_rule as unknown as Record<string, unknown>
      if (data.reminder_time !== undefined) updateData.reminder_time = data.reminder_time
      if (data.archived_at !== undefined) updateData.archived_at = data.archived_at
      updateData.updated_at = new Date().toISOString()

      const { data: updated, error } = await supabase
        .from('habits')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error
      return updated
    } catch (e) {
      handleError('update habit', e)
    }
  }

  async archive(userId: string, id: string): Promise<void> {
    await this.update(userId, id, { archived_at: new Date().toISOString() })
  }

  async unarchive(userId: string, id: string): Promise<void> {
    try {
      const supabase = getSupabase()
      const { error } = await supabase
        .from('habits')
        .update({ archived_at: null, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', userId)

      if (error) throw error
    } catch (e) {
      handleError('unarchive habit', e)
    }
  }
}

// ---------- Habit Log Repository ----------

class SupabaseHabitLogRepository implements IHabitLogRepository {
  async getByDate(userId: string, date: string): Promise<HabitLog[]> {
    try {
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from('habit_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('log_date', date)

      if (error) throw error
      return data || []
    } catch (e) {
      handleError('getByDate habit logs', e)
    }
  }

  async getByDateRange(userId: string, range: DateRange): Promise<HabitLog[]> {
    try {
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from('habit_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('log_date', range.start)
        .lte('log_date', range.end)

      if (error) throw error
      return data || []
    } catch (e) {
      handleError('getByDateRange habit logs', e)
    }
  }

  async getByHabit(userId: string, habitId: string, limit = 100): Promise<HabitLog[]> {
    try {
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from('habit_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('habit_id', habitId)
        .order('log_date', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (e) {
      handleError('getByHabit', e)
    }
  }

  async create(
    userId: string,
    data: Omit<HabitLog, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ): Promise<HabitLog> {
    try {
      const supabase = getSupabase()
      // Use upsert to handle unique constraint (user_id, habit_id, log_date)
      const { data: created, error } = await supabase
        .from('habit_logs')
        .upsert(
          {
            user_id: userId,
            habit_id: data.habit_id,
            log_date: data.log_date,
            value: data.value,
            is_completed: data.is_completed,
            note: data.note,
          },
          {
            onConflict: 'user_id,habit_id,log_date',
            ignoreDuplicates: false,
          }
        )
        .select()
        .single()

      if (error) throw error
      return created
    } catch (e) {
      handleError('create habit log', e)
    }
  }

  async update(userId: string, id: string, data: Partial<HabitLog>): Promise<HabitLog> {
    try {
      const supabase = getSupabase()
      const updateData: Record<string, unknown> = {}
      if (data.value !== undefined) updateData.value = data.value
      if (data.is_completed !== undefined) updateData.is_completed = data.is_completed
      if (data.note !== undefined) updateData.note = data.note
      updateData.updated_at = new Date().toISOString()

      const { data: updated, error } = await supabase
        .from('habit_logs')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error
      return updated
    } catch (e) {
      handleError('update habit log', e)
    }
  }

  async delete(userId: string, id: string): Promise<void> {
    try {
      const supabase = getSupabase()
      const { error } = await supabase
        .from('habit_logs')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)

      if (error) throw error
    } catch (e) {
      handleError('delete habit log', e)
    }
  }
}

// ---------- Daily Review Repository ----------

class SupabaseDailyReviewRepository implements IDailyReviewRepository {
  async getByDate(userId: string, date: string): Promise<DailyReview | null> {
    try {
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from('daily_reviews')
        .select('*')
        .eq('user_id', userId)
        .eq('review_date', date)
        .maybeSingle()

      if (error) throw error
      return data
    } catch (e) {
      handleError('getByDate daily review', e)
    }
  }

  async getByDateRange(userId: string, range: DateRange): Promise<DailyReview[]> {
    try {
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from('daily_reviews')
        .select('*')
        .eq('user_id', userId)
        .gte('review_date', range.start)
        .lte('review_date', range.end)
        .order('review_date', { ascending: true })

      if (error) throw error
      return data || []
    } catch (e) {
      handleError('getByDateRange daily reviews', e)
    }
  }

  async upsert(
    userId: string,
    data: Omit<DailyReview, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ): Promise<DailyReview> {
    try {
      const supabase = getSupabase()
      const { data: result, error } = await supabase
        .from('daily_reviews')
        .upsert(
          {
            user_id: userId,
            review_date: data.review_date,
            score: data.score,
            subjective_completion: data.subjective_completion,
            mood: data.mood,
            energy: data.energy,
            achievement: data.achievement,
            unfinished: data.unfinished,
            problems: data.problems,
            lessons: data.lessons,
            tomorrow_focus: data.tomorrow_focus,
            summary: data.summary,
          },
          {
            onConflict: 'user_id,review_date',
            ignoreDuplicates: false,
          }
        )
        .select()
        .single()

      if (error) throw error
      return result
    } catch (e) {
      handleError('upsert daily review', e)
    }
  }

  async delete(userId: string, date: string): Promise<void> {
    try {
      const supabase = getSupabase()
      const { error } = await supabase
        .from('daily_reviews')
        .delete()
        .eq('user_id', userId)
        .eq('review_date', date)

      if (error) throw error
    } catch (e) {
      handleError('delete daily review', e)
    }
  }
}

// ---------- Task Template Repository ----------

class SupabaseTaskTemplateRepository implements ITaskTemplateRepository {
  async getAll(userId: string): Promise<TaskTemplate[]> {
    try {
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from('task_templates')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (e) {
      handleError('getAll templates', e)
    }
  }

  async create(
    userId: string,
    data: Omit<TaskTemplate, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ): Promise<TaskTemplate> {
    try {
      const supabase = getSupabase()
      const { data: created, error } = await supabase
        .from('task_templates')
        .insert({
          user_id: userId,
          name: data.name,
          description: data.description,
          template_data: data.template_data as unknown as Record<string, unknown>,
        })
        .select()
        .single()

      if (error) throw error
      return created
    } catch (e) {
      handleError('create template', e)
    }
  }

  async delete(userId: string, id: string): Promise<void> {
    try {
      const supabase = getSupabase()
      const { error } = await supabase
        .from('task_templates')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)

      if (error) throw error
    } catch (e) {
      handleError('delete template', e)
    }
  }
}

// ---------- User Repository ----------

class SupabaseUserRepository implements IUserRepository {
  async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) throw error
      return data
    } catch (e) {
      handleError('getProfile', e)
    }
  }

  async upsertProfile(userId: string, data: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const supabase = getSupabase()
      const { data: result, error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          ...data,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error
      return result
    } catch (e) {
      handleError('upsertProfile', e)
    }
  }

  async getPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) throw error
      return data
    } catch (e) {
      handleError('getPreferences', e)
    }
  }

  async upsertPreferences(
    userId: string,
    data: Partial<UserPreferences>
  ): Promise<UserPreferences> {
    try {
      const supabase = getSupabase()
      const defaults = {
        user_id: userId,
        theme: 'system',
        accent_color: '#3b82f6',
        default_calendar_view: 'month',
        week_starts_on: 0,
        timezone: 'Asia/Shanghai',
        notification_enabled: true,
        compact_mode: false,
      }
      const { data: result, error } = await supabase
        .from('user_preferences')
        .upsert({
          ...defaults,
          ...data,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error
      return result
    } catch (e) {
      handleError('upsertPreferences', e)
    }
  }
}

// ---------- Recurrence Exception Repository ----------

class SupabaseRecurrenceExceptionRepository implements IRecurrenceExceptionRepository {
  async getByTask(userId: string, taskId: string): Promise<RecurrenceException[]> {
    try {
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from('recurrence_exceptions')
        .select('*')
        .eq('task_id', taskId)
        .eq('user_id', userId)

      if (error) throw error
      return data || []
    } catch (e) {
      handleError('getByTask exceptions', e)
    }
  }

  async create(
    userId: string,
    data: Omit<RecurrenceException, 'id' | 'user_id' | 'created_at'>
  ): Promise<RecurrenceException> {
    try {
      const supabase = getSupabase()
      const { data: created, error } = await supabase
        .from('recurrence_exceptions')
        .insert({
          user_id: userId,
          task_id: data.task_id,
          exception_date: data.exception_date,
          action: data.action,
          modified_data: data.modified_data as Record<string, unknown> | null,
        })
        .select()
        .single()

      if (error) throw error
      return created
    } catch (e) {
      handleError('create exception', e)
    }
  }

  async delete(userId: string, id: string): Promise<void> {
    try {
      const supabase = getSupabase()
      const { error } = await supabase
        .from('recurrence_exceptions')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)

      if (error) throw error
    } catch (e) {
      handleError('delete exception', e)
    }
  }
}

// ---------- Countdown Repository ----------

class SupabaseCountdownRepository implements ICountdownRepository {
  async list(userId: string, includeArchived = false): Promise<Countdown[]> {
    const supabase = getSupabase()
    let query = supabase.from('countdowns').select('*').eq('user_id', userId)
    if (!includeArchived) query = query.is('archived_at', null)
    const { data, error } = await query.order('sort_order', { ascending: true })
    if (error) handleError('list countdowns', error)
    return (data || []) as Countdown[]
  }

  async getById(userId: string, id: string): Promise<Countdown | null> {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('countdowns')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()
    if (error) return null
    return data as Countdown
  }

  async create(
    userId: string,
    data: Omit<Countdown, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'days_remaining' | 'display_text'>
  ): Promise<Countdown> {
    const supabase = getSupabase()
    const { data: record, error } = await supabase
      .from('countdowns')
      .insert({ ...data, user_id: userId })
      .select()
      .single()
    if (error) handleError('create countdown', error)
    return record as Countdown
  }

  async update(userId: string, id: string, data: Partial<Countdown>): Promise<Countdown> {
    const supabase = getSupabase()
    const { data: record, error } = await supabase
      .from('countdowns')
      .update(data)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()
    if (error) handleError('update countdown', error)
    return record as Countdown
  }

  async archive(userId: string, id: string): Promise<void> {
    await this.update(userId, id, { archived_at: new Date().toISOString() })
  }

  async unarchive(userId: string, id: string): Promise<void> {
    const { data: record } = await getSupabase()
      .from('countdowns')
      .update({ archived_at: null })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()
    // Silently handle - unarchive is not critical
    void record
  }

  async delete(userId: string, id: string): Promise<void> {
    const supabase = getSupabase()
    const { error } = await supabase
      .from('countdowns')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    if (error) handleError('delete countdown', error)
  }

  async reorder(userId: string, ids: string[]): Promise<void> {
    const supabase = getSupabase()
    for (let i = 0; i < ids.length; i++) {
      await supabase.from('countdowns').update({ sort_order: i }).eq('id', ids[i]).eq('user_id', userId)
    }
  }

  async getUpcoming(userId: string, limit = 4): Promise<Countdown[]> {
    const all = await this.list(userId)
    return all
      .sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1
        if (!a.is_pinned && b.is_pinned) return 1
        return a.sort_order - b.sort_order
      })
      .slice(0, limit)
  }

  async getPinned(userId: string): Promise<Countdown[]> {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('countdowns')
      .select('*')
      .eq('user_id', userId)
      .eq('is_pinned', true)
      .is('archived_at', null)
      .order('sort_order')
    if (error) handleError('getPinned countdowns', error)
    return (data || []) as Countdown[]
  }
}

// ---------- Focus Session Repository ----------

class SupabaseFocusSessionRepository implements IFocusSessionRepository {
  async getActive(userId: string): Promise<FocusSession | null> {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('focus_sessions')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['running', 'paused'])
      .order('started_at', { ascending: false })
      .limit(1)
    if (error) handleError('getActive focus', error)
    return (data?.[0] as FocusSession) || null
  }

  async getById(userId: string, id: string): Promise<FocusSession | null> {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('focus_sessions')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()
    if (error) return null
    return data as FocusSession
  }

  async create(
    userId: string,
    data: Omit<FocusSession, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ): Promise<FocusSession> {
    const supabase = getSupabase()
    const { data: record, error } = await supabase
      .from('focus_sessions')
      .insert({ ...data, user_id: userId })
      .select()
      .single()
    if (error) handleError('create focus session', error)
    return record as FocusSession
  }

  async update(userId: string, id: string, data: Partial<FocusSession>): Promise<FocusSession> {
    const supabase = getSupabase()
    const { data: record, error } = await supabase
      .from('focus_sessions')
      .update(data)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()
    if (error) handleError('update focus session', error)
    return record as FocusSession
  }

  async delete(userId: string, id: string): Promise<void> {
    const supabase = getSupabase()
    const { error } = await supabase
      .from('focus_sessions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    if (error) handleError('delete focus session', error)
  }

  async getByDateRange(userId: string, range: DateRange): Promise<FocusSession[]> {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('focus_sessions')
      .select('*')
      .eq('user_id', userId)
      .gte('started_at', range.start)
      .lte('started_at', range.end + 'T23:59:59')
      .order('started_at', { ascending: false })
    if (error) handleError('getByDateRange focus', error)
    return (data || []) as FocusSession[]
  }

  async getByTask(userId: string, taskId: string): Promise<FocusSession[]> {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('focus_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('task_id', taskId)
      .order('started_at', { ascending: false })
    if (error) handleError('getByTask focus', error)
    return (data || []) as FocusSession[]
  }

  async getStats(
    userId: string,
    range: DateRange
  ): Promise<{ total_seconds: number; total_sessions: number; completed_sessions: number }> {
    const sessions = await this.getByDateRange(userId, range)
    const completed = sessions.filter((s) => s.status === 'completed')
    return {
      total_seconds: completed.reduce((sum, s) => sum + s.actual_seconds, 0),
      total_sessions: sessions.length,
      completed_sessions: completed.length,
    }
  }
}

// ---------- Factory ----------

export function createSupabaseRepositoryFactory(): RepositoryFactory {
  return {
    tasks: new SupabaseTaskRepository(),
    taskSubitems: new SupabaseTaskSubitemRepository(),
    tags: new SupabaseTagRepository(),
    habits: new SupabaseHabitRepository(),
    habitLogs: new SupabaseHabitLogRepository(),
    dailyReviews: new SupabaseDailyReviewRepository(),
    taskTemplates: new SupabaseTaskTemplateRepository(),
    users: new SupabaseUserRepository(),
    recurrenceExceptions: new SupabaseRecurrenceExceptionRepository(),
    countdowns: new SupabaseCountdownRepository(),
    focusSessions: new SupabaseFocusSessionRepository(),
  }
}
