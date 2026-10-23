import type { CharacterExpression } from '@/lib/theme/atmosphere'

export type PackDialogue = Partial<Record<CharacterExpression, string[]>>

/** Local manifests are untrusted input. Only render bounded plain-text lines. */
export function packLinesFor(dialogue: unknown, state: CharacterExpression): string[] {
  if (!dialogue || typeof dialogue !== 'object' || Array.isArray(dialogue)) return []
  const source = dialogue as Record<string, unknown>
  const read = (key: string) => {
    if (!Object.hasOwn(source, key) || !Array.isArray(source[key])) return []
    return source[key]
      .filter((line): line is string => typeof line === 'string')
      .map((line) => line.trim().slice(0, 160))
      .filter(Boolean)
      .slice(0, 12)
  }
  const lines = read(state)
  return lines.length ? lines : read('idle')
}
