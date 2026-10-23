import { describe, it, expect } from 'vitest'
import {
  MEASUREMENT_TYPE_LABELS,
  getMeasurementTypeLabel,
  getPeriodLabel,
  getDifficultyLabel,
} from '@/lib/display-labels'

// ---- Measurement type labels ----

describe('Measurement type labels', () => {
  it('should return Chinese label for boolean', () => {
    expect(getMeasurementTypeLabel('boolean')).toBe('完成/未完成')
  })

  it('should return Chinese label for count', () => {
    expect(getMeasurementTypeLabel('count')).toBe('次数')
  })

  it('should return Chinese label for minutes', () => {
    expect(getMeasurementTypeLabel('minutes')).toBe('分钟')
  })

  it('should return Chinese label for hours', () => {
    expect(getMeasurementTypeLabel('hours')).toBe('小时')
  })

  it('should return Chinese label for duration (legacy)', () => {
    expect(getMeasurementTypeLabel('duration')).toBe('分钟')
  })

  it('should return Chinese label for numeric', () => {
    expect(getMeasurementTypeLabel('numeric')).toBe('自定义数值')
  })

  it('should return unknown type as-is', () => {
    expect(getMeasurementTypeLabel('unknown')).toBe('unknown')
  })
})

// ---- Period labels ----

describe('Period labels', () => {
  it('should return 上午 for morning', () => {
    expect(getPeriodLabel('morning')).toBe('上午')
  })

  it('should return 下午 for afternoon', () => {
    expect(getPeriodLabel('afternoon')).toBe('下午')
  })

  it('should return 晚上 for evening', () => {
    expect(getPeriodLabel('evening')).toBe('晚上')
  })

  it('should return period as-is for unknown value', () => {
    expect(getPeriodLabel('unknown')).toBe('unknown')
  })

  it('should return empty string as-is', () => {
    expect(getPeriodLabel('')).toBe('')
  })
})

// ---- Difficulty labels ----

describe('Difficulty labels', () => {
  it('should return 简单 for easy', () => {
    expect(getDifficultyLabel('easy')).toBe('简单')
  })

  it('should return 一般 for medium', () => {
    expect(getDifficultyLabel('medium')).toBe('一般')
  })

  it('should return 困难 for hard', () => {
    expect(getDifficultyLabel('hard')).toBe('困难')
  })

  it('should return 极难 for very_hard', () => {
    expect(getDifficultyLabel('very_hard')).toBe('极难')
  })

  it('should return difficulty as-is for unknown value', () => {
    expect(getDifficultyLabel('unknown')).toBe('unknown')
  })
})

// ---- Measurement type label completeness ----

describe('MEASUREMENT_TYPE_LABELS completeness', () => {
  it('should have all required types', () => {
    const keys = Object.keys(MEASUREMENT_TYPE_LABELS)
    expect(keys).toContain('boolean')
    expect(keys).toContain('count')
    expect(keys).toContain('duration')
    expect(keys).toContain('minutes')
    expect(keys).toContain('hours')
    expect(keys).toContain('numeric')
  })

  it('should have no duplicate labels among minutes/duration', () => {
    // duration and minutes both map to 分钟 — this is intentional for backward compat
    expect(MEASUREMENT_TYPE_LABELS['duration']).toBe(MEASUREMENT_TYPE_LABELS['minutes'])
  })

  it('should have distinct labels for distinct types', () => {
    const uniqueLabels = new Set(Object.values(MEASUREMENT_TYPE_LABELS))
    // boolean, count, duration/minutes (shared), hours, numeric → 5 unique labels
    expect(uniqueLabels.size).toBe(5)
  })
})
