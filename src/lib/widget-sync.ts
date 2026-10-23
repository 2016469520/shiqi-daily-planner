/**
 * 主窗口与浮窗之间的数据变更广播。
 *
 * 两个窗口共享同一个 IndexedDB 来源，但各自持有 React Query 缓存，
 * 所以写入方广播、读取方失效缓存即可保持一致。
 */

export const DATA_CHANNEL = 'timegrid:data'

export type DataChangeScope = 'tasks' | 'habits' | 'reviews' | 'focus' | 'all'

interface DataChangeMessage {
  type: 'data-changed'
  scope: DataChangeScope
}

function createChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return null
  try {
    return new BroadcastChannel(DATA_CHANNEL)
  } catch {
    return null
  }
}

/** 通知其它窗口：某类数据变了 */
export function notifyDataChanged(scope: DataChangeScope = 'all'): void {
  const channel = createChannel()
  if (!channel) return
  const message: DataChangeMessage = { type: 'data-changed', scope }
  channel.postMessage(message)
  channel.close()
}

/** 订阅其它窗口的数据变更，返回取消订阅函数 */
export function subscribeDataChanged(handler: (scope: DataChangeScope) => void): () => void {
  const channel = createChannel()
  if (!channel) return () => {}

  channel.onmessage = (event: MessageEvent<DataChangeMessage>) => {
    const data = event.data
    if (data && data.type === 'data-changed') handler(data.scope)
  }

  return () => channel.close()
}
