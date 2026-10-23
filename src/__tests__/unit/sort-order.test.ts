import { describe, it, expect } from 'vitest'
import {
  getInsertOrder,
  calculateReorderAfterMove,
  needsRebalance,
  rebalanceOrderIndices,
} from '@/lib/utils/sort-order'

describe('sort-order utilities', () => {
  describe('getInsertOrder', () => {
    it('returns 0 when both before and after are null', () => {
      expect(getInsertOrder(null, null)).toBe(0)
    })

    it('inserts at beginning (before is null)', () => {
      const result = getInsertOrder(null, 1000)
      expect(result).toBeLessThan(1000)
      expect(result).toBe(0)
    })

    it('inserts at end (after is null)', () => {
      const result = getInsertOrder(1000, null)
      expect(result).toBeGreaterThan(1000)
      expect(result).toBe(2000)
    })

    it('inserts between two items (midpoint)', () => {
      const result = getInsertOrder(1000, 2000)
      expect(result).toBe(1500)
    })

    it('handles fractional indices', () => {
      const result = getInsertOrder(1.5, 2.0)
      expect(result).toBe(1.75)
    })

    it('handles small gaps', () => {
      const result = getInsertOrder(1000, 1000.5)
      expect(result).toBe(1000.25)
    })
  })

  describe('calculateReorderAfterMove', () => {
    const items = [
      { id: 'a', order_index: 0 },
      { id: 'b', order_index: 1000 },
      { id: 'c', order_index: 2000 },
      { id: 'd', order_index: 3000 },
    ]

    it('returns empty array for no-op move', () => {
      const result = calculateReorderAfterMove(items, 1, 1)
      expect(result).toHaveLength(0)
    })

    it('returns empty array for empty list', () => {
      const result = calculateReorderAfterMove([], 0, 0)
      expect(result).toHaveLength(0)
    })

    it('moves item forward (down)', () => {
      // Move 'a' from index 0 to index 2 (between 'b' and 'c')
      const result = calculateReorderAfterMove(items, 0, 2)
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('a')
      // Should be between b(1000) and c(2000)
      expect(result[0].order_index).toBeGreaterThan(1000)
      expect(result[0].order_index).toBeLessThan(2000)
    })

    it('moves item backward (up)', () => {
      // Move 'd' from index 3 to index 0 (before 'a')
      const result = calculateReorderAfterMove(items, 3, 0)
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('d')
      // Should be before a(0)
      expect(result[0].order_index).toBeLessThan(0)
    })

    it('moves item to end', () => {
      // Move 'a' from index 0 to index 4 (end)
      const result = calculateReorderAfterMove(items, 0, 4)
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('a')
      // Should be after d(3000)
      expect(result[0].order_index).toBeGreaterThan(3000)
    })
  })

  describe('needsRebalance', () => {
    it('returns false for well-spaced items', () => {
      const items = [
        { order_index: 0 },
        { order_index: 1000 },
        { order_index: 2000 },
      ]
      expect(needsRebalance(items)).toBe(false)
    })

    it('returns true for items too close together', () => {
      const items = [
        { order_index: 1000 },
        { order_index: 1000.0005 },
        { order_index: 2000 },
      ]
      expect(needsRebalance(items)).toBe(true)
    })

    it('returns false for single item', () => {
      expect(needsRebalance([{ order_index: 100 }])).toBe(false)
    })
  })

  describe('rebalanceOrderIndices', () => {
    it('returns evenly spaced indices', () => {
      const items = [
        { id: 'a', order_index: 0.5 },
        { id: 'b', order_index: 0.75 },
        { id: 'c', order_index: 1000 },
        { id: 'd', order_index: 1000.125 },
      ]

      const result = rebalanceOrderIndices(items)
      expect(result).toHaveLength(4)
      expect(result[0].order_index).toBe(0)
      expect(result[1].order_index).toBe(1000)
      expect(result[2].order_index).toBe(2000)
      expect(result[3].order_index).toBe(3000)
    })

    it('preserves all IDs', () => {
      const items = [
        { id: 'x', order_index: 1 },
        { id: 'y', order_index: 2 },
      ]
      const result = rebalanceOrderIndices(items)
      const ids = result.map((r) => r.id).sort()
      expect(ids).toEqual(['x', 'y'])
    })
  })
})
