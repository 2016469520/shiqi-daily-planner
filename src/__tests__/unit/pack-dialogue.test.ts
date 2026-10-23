import { describe, expect, it } from 'vitest'
import { packLinesFor } from '@/lib/atmosphere/pack-dialogue'

describe('local pack dialogue', () => {
  it('uses state lines, then idle, without exposing non-text manifest values', () => {
    const dialogue = { idle: [' 看啥看？ '], thinking: ['认真思考中', null, {}, ' '], happy: [] }
    expect(packLinesFor(dialogue, 'thinking')).toEqual(['认真思考中'])
    expect(packLinesFor(dialogue, 'happy')).toEqual(['看啥看？'])
    expect(packLinesFor(dialogue, 'sleepy')).toEqual(['看啥看？'])
  })
  it('ignores malformed and inherited payloads and bounds oversized input', () => {
    for (const value of [null, [], 42, 'text', { idle: {} }, Object.create({ idle: ['hidden'] })]) {
      expect(packLinesFor(value, 'idle')).toEqual([])
    }
    const lines = packLinesFor({ idle: Array(50).fill('a'.repeat(1000)) }, 'idle')
    expect(lines).toHaveLength(12)
    expect(lines.every((line) => line.length === 160)).toBe(true)
  })
})
