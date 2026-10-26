'use client'
import { useSyncExternalStore } from 'react'
const KEY = 'shiqi:pet-preferences:v1'
const EVENT = 'shiqi:pet-preferences-changed'
export interface PetPreferences { size: number; motion: boolean }
const DEFAULT = JSON.stringify({ size: 220, motion: true })
function snapshot() { try { return localStorage.getItem(KEY) || DEFAULT } catch { return DEFAULT } }
function subscribe(callback: () => void) {
  window.addEventListener('storage', callback)
  window.addEventListener(EVENT, callback)
  return () => { window.removeEventListener('storage', callback); window.removeEventListener(EVENT, callback) }
}
export function parsePetPreferences(raw: string): PetPreferences {
  try {
    const value = JSON.parse(raw)
    return { size: Number.isFinite(value?.size) ? Math.max(140, Math.min(240, value.size)) : 220, motion: value?.motion !== false }
  } catch { return { size: 220, motion: true } }
}
export function usePetPreferences() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => DEFAULT)
  const preferences = parsePetPreferences(raw)
  const update = (patch: Partial<PetPreferences>) => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ ...parsePetPreferences(snapshot()), ...patch }))
      window.dispatchEvent(new Event(EVENT))
    } catch { /* Storage may be unavailable in a restricted browser. */ }
  }
  return { preferences, update }
}
