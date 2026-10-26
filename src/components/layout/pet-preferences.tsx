'use client'
import { useId } from 'react'
import { usePetPreferences } from '@/lib/pet/preferences'
export function PetPreferencesControl() {
  const { preferences, update } = usePetPreferences()
  const id = useId()
  return <div className="space-y-3 p-3 text-caption" data-pet-control>
    <label htmlFor={id} className="flex items-center justify-between">人物大小<span>{preferences.size}px</span></label>
    <input id={id} aria-label="人物大小" type="range" min="140" max="240" step="10" value={preferences.size}
      onChange={e => update({ size: Number(e.target.value) })} className="w-full accent-current" />
    <label className="flex items-center gap-2"><input type="checkbox" checked={preferences.motion}
      onChange={e => update({ motion: e.target.checked })} />轻微动作反馈</label>
    <p className="text-muted-foreground">左键说话 · 按住拖动 · 右键换形态</p>
  </div>
}
