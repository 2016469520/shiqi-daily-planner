// ============================================================
// Sort order utilities — fractional indexing for drag-and-drop
// ============================================================

/**
 * Calculate a new order_index for inserting an item between two others.
 * Uses fractional indexing to avoid rebalancing all items on every move.
 *
 * @param before - order_index of the item before the insertion point (null if inserting at start)
 * @param after - order_index of the item after the insertion point (null if inserting at end)
 * @returns a new order_index
 */
export function getInsertOrder(
  before: number | null,
  after: number | null
): number {
  if (before === null && after === null) {
    return 0
  }

  if (before === null) {
    // Insert at beginning
    return (after as number) - 1000
  }

  if (after === null) {
    // Insert at end
    return (before as number) + 1000
  }

  // Insert between two items — use midpoint
  return (before + after) / 2
}

/**
 * Calculate new order indices for a list after a move operation.
 *
 * Given the current sorted items and the index where an item was moved from
 * and the index where it was moved to, returns a map of item IDs to new order indices.
 *
 * This handles the case where we want to keep existing order values for
 * items that haven't moved, and only recalculate the moved item.
 */
export function calculateReorderAfterMove(
  items: { id: string; order_index: number }[],
  fromIndex: number,
  toIndex: number
): { id: string; order_index: number }[] {
  if (fromIndex === toIndex || items.length === 0) return []

  const moved = items[fromIndex]
  const remaining = items.filter((_, i) => i !== fromIndex)

  // Determine insertion neighbors
  let targetIndex = toIndex
  if (fromIndex < toIndex) {
    // When moving down, the target index shifts because we removed the item
    targetIndex = toIndex - 1
    if (targetIndex < 0) targetIndex = 0
  }

  const before = targetIndex > 0 ? remaining[targetIndex - 1] : null
  const after = targetIndex < remaining.length ? remaining[targetIndex] : null

  const newOrder = getInsertOrder(
    before?.order_index ?? null,
    after?.order_index ?? null
  )

  return [{ id: moved.id, order_index: newOrder }]
}

/**
 * Check if order indices need rebalancing (when values get too close).
 * When the gap between adjacent items is less than EPSILON, rebalance.
 */
const EPSILON = 0.001

export function needsRebalance(items: { order_index: number }[]): boolean {
  const sorted = [...items].sort((a, b) => a.order_index - b.order_index)
  for (let i = 1; i < sorted.length; i++) {
    if (Math.abs(sorted[i].order_index - sorted[i - 1].order_index) < EPSILON) {
      return true
    }
  }
  return false
}

/**
 * Rebalance all order indices with even spacing.
 * Returns a map of new indices (assuming items are sorted by current order).
 */
export function rebalanceOrderIndices(
  items: { id: string; order_index: number }[]
): { id: string; order_index: number }[] {
  const sorted = [...items].sort((a, b) => a.order_index - b.order_index)
  const spacing = 1000
  return sorted.map((item, index) => ({
    id: item.id,
    order_index: index * spacing,
  }))
}
