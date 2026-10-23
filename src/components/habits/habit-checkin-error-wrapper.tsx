'use client'

import { Component, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * Fine-grained error boundary for HabitCheckin.
 * Catches rendering errors so the habits page shell stays intact.
 */
export class HabitCheckinErrorWrapper extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[HabitCheckin] Render error:', error)
    console.error('[HabitCheckin] Component stack:', info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="surface space-y-3 border-destructive/30 p-6 text-center">
          <AlertTriangle className="mx-auto h-7 w-7 text-destructive/60" />
          <div>
            <p className="text-body font-medium text-destructive">习惯组件渲染失败</p>
            <p className="mx-auto mt-1 max-w-md break-all text-micro text-muted-foreground">
              {this.state.error.message.slice(0, 200)}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => this.setState({ error: null })}
          >
            重试
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
