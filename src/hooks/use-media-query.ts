'use client'

import { useSyncExternalStore } from 'react'

function subscribeToMediaQuery(query: string, callback: () => void) {
  const mq = window.matchMedia(query)
  mq.addEventListener('change', callback)
  return () => mq.removeEventListener('change', callback)
}

function getSnapshot(query: string) {
  return window.matchMedia(query).matches
}

function getServerSnapshot() {
  return false
}

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (callback) => subscribeToMediaQuery(query, callback),
    () => getSnapshot(query),
    getServerSnapshot
  )
}
