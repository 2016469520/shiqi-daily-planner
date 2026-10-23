// ============================================================
// Repository interfaces — data access abstraction layer
// Allows swapping between Supabase and IndexedDB implementations
// ============================================================

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

// ---------- Task Repository ----------

export interface ITaskRepository {
  getByDateRange(userId: string, range: DateRange): Promise<Task[]>
  getByDate(userId: string, date: string): Promise<Task[]>
  getById(userId: string, id: string): Promise<Task | null>
  create(userId: string, data: Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Task>
  update(userId: string, id: string, data: Partial<Task>): Promise<Task>
  softDelete(userId: string, id: string): Promise<void>
  restore(userId: string, id: string): Promise<void>
  permanentlyDelete(userId: string, id: string): Promise<void>
  reorder(userId: string, updates: { id: string; order_index: number }[]): Promise<void>
  moveTask(
    userId: string,
    id: string,
    target: { task_date?: string; period?: string; order_index?: number }
  ): Promise<Task>
  search(userId: string, query: string): Promise<Task[]>
  filter(userId: string, options: TaskFilterOptions): Promise<Task[]>
}

export interface TaskFilterOptions {
  search?: string
  tagIds?: string[]
  status?: string[]
  priority?: string[]
  dateFrom?: string
  dateTo?: string
  includeUndated?: boolean
  /** 仅返回没有日期的任务（收集箱） */
  undatedOnly?: boolean
  overdue?: boolean
  hasRecurrence?: boolean
  maxResults?: number
}

// ---------- Task Subitem Repository ----------

export interface ITaskSubitemRepository {
  getByTaskId(userId: string, taskId: string): Promise<TaskSubitem[]>
  create(userId: string, data: Omit<TaskSubitem, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<TaskSubitem>
  update(userId: string, id: string, data: Partial<TaskSubitem>): Promise<TaskSubitem>
  delete(userId: string, id: string): Promise<void>
  toggleComplete(userId: string, id: string): Promise<TaskSubitem>
}

// ---------- Tag Repository ----------

export interface ITagRepository {
  getAll(userId: string): Promise<Tag[]>
  getById(userId: string, id: string): Promise<Tag | null>
  create(userId: string, data: Omit<Tag, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Tag>
  update(userId: string, id: string, data: Partial<Tag>): Promise<Tag>
  delete(userId: string, id: string, migrateToTagId?: string): Promise<void>
  reorder(userId: string, ids: string[]): Promise<void>
}

// ---------- Habit Repository ----------

export interface IHabitRepository {
  getAll(userId: string, includeArchived?: boolean): Promise<Habit[]>
  getById(userId: string, id: string): Promise<Habit | null>
  create(userId: string, data: Omit<Habit, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Habit>
  update(userId: string, id: string, data: Partial<Habit>): Promise<Habit>
  archive(userId: string, id: string): Promise<void>
  unarchive(userId: string, id: string): Promise<void>
}

// ---------- Habit Log Repository ----------

export interface IHabitLogRepository {
  getByDate(userId: string, date: string): Promise<HabitLog[]>
  getByDateRange(userId: string, range: DateRange): Promise<HabitLog[]>
  getByHabit(userId: string, habitId: string, limit?: number): Promise<HabitLog[]>
  create(userId: string, data: Omit<HabitLog, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<HabitLog>
  update(userId: string, id: string, data: Partial<HabitLog>): Promise<HabitLog>
  delete(userId: string, id: string): Promise<void>
}

// ---------- Daily Review Repository ----------

export interface IDailyReviewRepository {
  getByDate(userId: string, date: string): Promise<DailyReview | null>
  getByDateRange(userId: string, range: DateRange): Promise<DailyReview[]>
  upsert(userId: string, data: Omit<DailyReview, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<DailyReview>
  delete(userId: string, date: string): Promise<void>
}

// ---------- Task Template Repository ----------

export interface ITaskTemplateRepository {
  getAll(userId: string): Promise<TaskTemplate[]>
  create(userId: string, data: Omit<TaskTemplate, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<TaskTemplate>
  delete(userId: string, id: string): Promise<void>
}

// ---------- User Repository ----------

export interface IUserRepository {
  getProfile(userId: string): Promise<UserProfile | null>
  upsertProfile(userId: string, data: Partial<UserProfile>): Promise<UserProfile>
  getPreferences(userId: string): Promise<UserPreferences | null>
  upsertPreferences(userId: string, data: Partial<UserPreferences>): Promise<UserPreferences>
}

// ---------- Recurrence Exception Repository ----------

export interface IRecurrenceExceptionRepository {
  getByTask(userId: string, taskId: string): Promise<RecurrenceException[]>
  create(userId: string, data: Omit<RecurrenceException, 'id' | 'user_id' | 'created_at'>): Promise<RecurrenceException>
  delete(userId: string, id: string): Promise<void>
}

// ---------- Countdown Repository ----------

export interface ICountdownRepository {
  list(userId: string, includeArchived?: boolean): Promise<Countdown[]>
  getById(userId: string, id: string): Promise<Countdown | null>
  create(userId: string, data: Omit<Countdown, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'days_remaining' | 'display_text'>): Promise<Countdown>
  update(userId: string, id: string, data: Partial<Countdown>): Promise<Countdown>
  archive(userId: string, id: string): Promise<void>
  unarchive(userId: string, id: string): Promise<void>
  delete(userId: string, id: string): Promise<void>
  reorder(userId: string, ids: string[]): Promise<void>
  getUpcoming(userId: string, limit?: number): Promise<Countdown[]>
  getPinned(userId: string): Promise<Countdown[]>
}

// ---------- Focus Session Repository ----------

export interface IFocusSessionRepository {
  getActive(userId: string): Promise<FocusSession | null>
  getById(userId: string, id: string): Promise<FocusSession | null>
  create(userId: string, data: Omit<FocusSession, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<FocusSession>
  update(userId: string, id: string, data: Partial<FocusSession>): Promise<FocusSession>
  delete(userId: string, id: string): Promise<void>
  getByDateRange(userId: string, range: DateRange): Promise<FocusSession[]>
  getByTask(userId: string, taskId: string): Promise<FocusSession[]>
  getStats(userId: string, range: DateRange): Promise<{ total_seconds: number; total_sessions: number; completed_sessions: number }>
}

// ---------- Combined Repository Factory ----------

export interface RepositoryFactory {
  tasks: ITaskRepository
  taskSubitems: ITaskSubitemRepository
  tags: ITagRepository
  habits: IHabitRepository
  habitLogs: IHabitLogRepository
  dailyReviews: IDailyReviewRepository
  taskTemplates: ITaskTemplateRepository
  users: IUserRepository
  recurrenceExceptions: IRecurrenceExceptionRepository
  countdowns: ICountdownRepository
  focusSessions: IFocusSessionRepository
}
