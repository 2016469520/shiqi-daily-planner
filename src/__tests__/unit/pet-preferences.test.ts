import { describe, expect, it } from 'vitest'
import { parsePetPreferences } from '@/lib/pet/preferences'
describe('saved desktop pet preferences', () => {
  it('recovers from corrupt or empty data', () => {
    for (const raw of ['broken', 'null', '{}', '{"size":"large"}']) {
      expect(parsePetPreferences(raw)).toEqual({ size: 220, motion: true })
    }
  })
  it('keeps artwork within its window and preserves disabled motion', () => {
    expect(parsePetPreferences('{"size":999,"motion":false}')).toEqual({ size: 240, motion: false })
    expect(parsePetPreferences('{"size":-10}').size).toBe(140)
  })
})
