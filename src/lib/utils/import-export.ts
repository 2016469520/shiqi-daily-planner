// ============================================================
// JSON / CSV import-export utilities for tasks
// ============================================================

import type { Task, Period, Priority, TaskStatus } from '@/types'

// ---------- Types ----------

export interface ExportOptions {
  includeCompleted?: boolean
  includeCancelled?: boolean
  fields?: string[]
}

export interface ImportResult {
  success: boolean
  imported: number
  skipped: number
  errors: string[]
}

// ---------- JSON Export ----------

export function exportTasksToJson(
  tasks: Task[],
  options: ExportOptions = {}
): string {
  const filtered = tasks.filter((t) => {
    if (!options.includeCompleted && t.status === 'done') return false
    if (!options.includeCancelled && t.status === 'cancelled') return false
    return true
  })

  const data = filtered.map((task) => ({
    title: task.title,
    description: task.description,
    task_date: task.task_date,
    period: task.period,
    start_time: task.start_time,
    end_time: task.end_time,
    priority: task.priority,
    status: task.status,
    tag_id: task.tag_id,
    estimated_minutes: task.estimated_minutes,
    recurrence_rule: task.recurrence_rule,
    subitems: task.subitems?.map((s) => ({
      title: s.title,
      is_completed: s.is_completed,
    })),
  }))

  return JSON.stringify(data, null, 2)
}

// ---------- JSON Import ----------

export interface ImportableTask {
  title: string
  description?: string
  task_date?: string
  period?: string
  start_time?: string
  end_time?: string
  priority?: string
  status?: string
  tag_id?: string
  estimated_minutes?: number
  recurrence_rule?: Task['recurrence_rule']
  subitems?: { title: string; is_completed?: boolean }[]
}

export function parseImportJson(
  json: string
): { tasks: ImportableTask[]; errors: string[] } {
  const errors: string[] = []
  let parsed: unknown

  try {
    parsed = JSON.parse(json)
  } catch {
    errors.push('JSON 格式无效')
    return { tasks: [], errors }
  }

  if (!Array.isArray(parsed)) {
    errors.push('JSON 应该是一个数组')
    return { tasks: [], errors }
  }

  const tasks: ImportableTask[] = []

  for (let i = 0; i < parsed.length; i++) {
    const item = parsed[i]
    const itemErrors: string[] = []

    if (!item || typeof item !== 'object') {
      itemErrors.push(`第 ${i + 1} 项不是有效对象`)
      errors.push(...itemErrors)
      continue
    }

    const obj = item as Record<string, unknown>

    if (!obj.title || typeof obj.title !== 'string' || obj.title.trim() === '') {
      itemErrors.push(`第 ${i + 1} 项缺少 title 字段`)
    }

    // Validate period
    const validPeriods: Period[] = ['morning', 'afternoon', 'evening']
    if (obj.period && !validPeriods.includes(obj.period as Period)) {
      itemErrors.push(`第 ${i + 1} 项的 period 无效 (${obj.period})`)
    }

    // Validate priority
    const validPriorities: Priority[] = ['low', 'normal', 'high', 'urgent']
    if (obj.priority && !validPriorities.includes(obj.priority as Priority)) {
      itemErrors.push(`第 ${i + 1} 项的 priority 无效 (${obj.priority})`)
    }

    // Validate status
    const validStatuses: TaskStatus[] = ['todo', 'in_progress', 'done', 'cancelled']
    if (obj.status && !validStatuses.includes(obj.status as TaskStatus)) {
      itemErrors.push(`第 ${i + 1} 项的 status 无效 (${obj.status})`)
    }

    if (itemErrors.length > 0) {
      errors.push(...itemErrors)
      continue
    }

    tasks.push({
      title: (obj.title as string).trim(),
      description: obj.description as string | undefined,
      task_date: obj.task_date as string | undefined,
      period: obj.period as Period | undefined,
      start_time: obj.start_time as string | undefined,
      end_time: obj.end_time as string | undefined,
      priority: obj.priority as Priority | undefined,
      status: obj.status as TaskStatus | undefined,
      tag_id: obj.tag_id as string | undefined,
      estimated_minutes: obj.estimated_minutes as number | undefined,
      recurrence_rule: obj.recurrence_rule as Task['recurrence_rule'] | undefined,
      subitems: obj.subitems as ImportableTask['subitems'],
    })
  }

  return { tasks, errors }
}

// ---------- CSV Export ----------

export function exportTasksToCsv(
  tasks: Task[],
  options: ExportOptions = {}
): string {
  const filtered = tasks.filter((t) => {
    if (!options.includeCompleted && t.status === 'done') return false
    if (!options.includeCancelled && t.status === 'cancelled') return false
    return true
  })

  const headers = [
    '标题',
    '描述',
    '日期',
    '时段',
    '开始时间',
    '结束时间',
    '优先级',
    '状态',
    '标签',
    '预计用时(分钟)',
    '子任务',
  ]

  const periodLabels: Record<string, string> = {
    morning: '上午',
    afternoon: '下午',
    evening: '晚上',
  }
  const priorityLabels: Record<string, string> = {
    low: '低',
    normal: '普通',
    high: '高',
    urgent: '紧急',
  }
  const statusLabels: Record<string, string> = {
    todo: '未开始',
    in_progress: '进行中',
    done: '已完成',
    cancelled: '已取消',
  }

  const rows = filtered.map((task) => [
    escapeCsvField(task.title),
    escapeCsvField(task.description || ''),
    task.task_date || '',
    periodLabels[task.period] || task.period,
    task.start_time || '',
    task.end_time || '',
    priorityLabels[task.priority] || task.priority,
    statusLabels[task.status] || task.status,
    task.tag?.name || '',
    task.estimated_minutes?.toString() || '',
    escapeCsvField(
      (task.subitems || [])
        .map((s) => `${s.is_completed ? '✓' : '○'} ${s.title}`)
        .join('; ')
    ),
  ])

  const bom = '﻿' // BOM for Excel Chinese support
  return bom + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
}

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

// ---------- Blob / Download helpers ----------

export function downloadJson(tasks: Task[], filename?: string): void {
  const json = exportTasksToJson(tasks)
  downloadBlob(json, filename || 'tasks-export.json', 'application/json')
}

export function downloadCsv(tasks: Task[], filename?: string): void {
  const csv = exportTasksToCsv(tasks)
  downloadBlob(csv, filename || 'tasks-export.csv', 'text/csv;charset=utf-8')
}

function downloadBlob(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('读取文件失败'))
    reader.readAsText(file)
  })
}
