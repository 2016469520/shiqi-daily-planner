'use client'

// ============================================================
// 每日一句
//
// 纯本地：短句库在 atmosphere.ts 里，按日期取一条（同一天稳定）。
// 支持"下一句"与自定义短句，全部无需联网。
// ============================================================

import { useCallback, useMemo, useState } from 'react'
import { Quote, RefreshCw } from 'lucide-react'
import { useAppearance } from '@/providers/appearance-provider'
import { quotesForTheme, type Quote as QuoteItem } from '@/lib/theme/atmosphere'
import { cn } from '@/lib/utils'
import { resolveDailyQuoteIndex } from '@/lib/theme/scene-resolve'

interface QuoteStripProps {
  className?: string
  /** 紧凑模式用于侧栏等窄空间 */
  compact?: boolean
}

function pickDaily(list: QuoteItem[], offset: number): QuoteItem | null {
  if (list.length === 0) return null
  return list[resolveDailyQuoteIndex(list.length, offset)]
}

export function QuoteStrip({ className, compact = false }: QuoteStripProps) {
  const { state, theme } = useAppearance()
  const [offset, setOffset] = useState(0)

  const list = useMemo(() => {
    const custom = state.atmosphere.customQuotes[state.themeId] ?? []
    return [...quotesForTheme(state.themeId), ...custom.map((text) => ({ text }))]
  }, [state.themeId, state.atmosphere.customQuotes])

  const quote = useMemo(() => pickDaily(list, offset), [list, offset])

  const next = useCallback(() => setOffset((o) => o + 1), [])

  if (!state.atmosphere.enabled || !state.atmosphere.quoteEnabled || !quote) return null

  return (
    <div className={cn('atmo-quote', compact ? 'items-center gap-2 px-2.5 py-2' : '', className)}>
      <Quote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/70" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className={cn('text-foreground', compact ? 'text-caption' : 'text-body')}>
          {quote.text}
        </p>
        {quote.author || quote.source ? (
          <p className="mt-1 text-micro text-muted-foreground">
            {quote.author ? `${quote.author} · ` : ''}
            {quote.source ?? ''}
          </p>
        ) : (
          <p className="mt-1 text-micro text-muted-foreground">{theme.name} · 每日一句</p>
        )}
      </div>
      {!compact && (
        <button
          type="button"
          onClick={next}
          className="shrink-0 rounded-md p-1 text-muted-foreground ui-transition hover:bg-accent hover:text-foreground"
          aria-label="换一句"
          title="换一句"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
