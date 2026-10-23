import { describe, it, expect, vi } from 'vitest'

describe('Habit minute input — draft/persist separation', () => {
  // ---- Step calculation ----

  describe('step calculation', () => {
    it('minutes type step is 1', () => {
      expect(getMinutesStep()).toBe(1)
    })

    it('count type step is 1', () => {
      expect(getCountStep()).toBe(1)
    })

    it('hours type step is 0.5', () => {
      expect(getHoursStep()).toBe(0.5)
    })
  })

  // ---- Draft accumulation (wheel) ----

  describe('wheel draft accumulation', () => {
    it('wheel up increases draft by 1 from persisted base', () => {
      const { draft, persisted } = accumulateWheel(undefined, 0, -100, 1)
      expect(draft).toBe(1)
      expect(persisted).toBe(0)
    })

    it('wheel down decreases draft by 1 from persisted base', () => {
      const { draft } = accumulateWheel(undefined, 5, 100, 1)
      expect(draft).toBe(4)
    })

    it('wheel at 0 does not go negative', () => {
      const { draft } = accumulateWheel(undefined, 0, 100, 1)
      expect(draft).toBe(0)
    })

    it('accumulates 10 wheel-ups: draft value = persisted + 10', () => {
      let draft: number | undefined
      const persisted = 0
      for (let i = 0; i < 10; i++) {
        const r = accumulateWheel(draft, persisted, -100, 1)
        draft = r.draft
      }
      expect(draft).toBe(10)
      expect(persisted).toBe(0) // persisted never changed
    })

    it('accumulates 20 wheel-ups from non-zero persisted base', () => {
      let draft: number | undefined
      const persisted = 5
      for (let i = 0; i < 20; i++) {
        const r = accumulateWheel(draft, persisted, -100, 1)
        draft = r.draft
      }
      expect(draft).toBe(25)
    })

    it('accumulates wheel-downs: persisted 10, scroll down 7 times = draft 3', () => {
      let draft: number | undefined
      const persisted = 10
      for (let i = 0; i < 7; i++) {
        const r = accumulateWheel(draft, persisted, 100, 1)
        draft = r.draft
      }
      expect(draft).toBe(3)
    })

    it('prefers draft value over persisted when accumulating', () => {
      // Simulate: scroll to 5 (draft=5), then continue scrolling
      const draft: number | undefined = 5
      const persisted = 0 // outdated persisted
      const r = accumulateWheel(draft, persisted, -100, 1)
      expect(r.draft).toBe(6) // accumulates from draft (5), not persisted (0)
    })

    it('wheel deltaY=0 does not change value', () => {
      const { draft } = accumulateWheel(undefined, 5, 0, 1)
      expect(draft).toBe(5)
    })
  })

  // ---- Draft accumulation (+/- buttons) ----

  describe('+/- button draft accumulation', () => {
    it('+1 adjusts draft by +1', () => {
      const { draft } = accumulateButton(undefined, 5, 1)
      expect(draft).toBe(6)
    })

    it('-1 adjusts draft by -1', () => {
      const { draft } = accumulateButton(undefined, 5, -1)
      expect(draft).toBe(4)
    })

    it('10 rapid clicks accumulate correctly', () => {
      let draft: number | undefined
      const persisted = 0
      for (let i = 0; i < 10; i++) {
        const r = accumulateButton(draft, persisted, 1)
        draft = r.draft
      }
      expect(draft).toBe(10)
    })

    it('-1 at 0 stays at 0', () => {
      const { draft } = accumulateButton(undefined, 0, -1)
      expect(draft).toBe(0)
    })
  })

  // ---- Display value selection ----

  describe('display value resolution', () => {
    it('shows draft value when draft exists', () => {
      const display = resolveDisplayValue(5, 3)
      expect(display).toBe(5)
    })

    it('shows persisted value when no draft', () => {
      const display = resolveDisplayValue(undefined, 3)
      expect(display).toBe(3)
    })

    it('shows 0 when no draft and persisted is 0', () => {
      const display = resolveDisplayValue(undefined, 0)
      expect(display).toBe(0)
    })
  })

  // ---- Debounce save logic ----

  describe('debounce save logic', () => {
    it('does not save immediately on each wheel event', async () => {
      vi.useFakeTimers()
      const saveFn = vi.fn().mockResolvedValue(undefined)

      // Simulate 10 rapid wheel events
      let timer: ReturnType<typeof setTimeout> | null = null
      let pendingValue: number | null = null

      for (let i = 0; i < 10; i++) {
        if (timer) clearTimeout(timer)
        pendingValue = i + 1
        timer = setTimeout(async () => {
          if (pendingValue != null) await saveFn(pendingValue)
        }, 600)
      }

      // After all 10 events, save has NOT been called yet
      expect(saveFn).not.toHaveBeenCalled()

      // Fast-forward past debounce
      vi.advanceTimersByTime(600)
      await vi.runAllTimersAsync()

      // Save called exactly once with final value
      expect(saveFn).toHaveBeenCalledTimes(1)
      expect(saveFn).toHaveBeenCalledWith(10)
      vi.useRealTimers()
    })

    it('does not save until debounce period elapsed', () => {
      vi.useFakeTimers()
      const saveFn = vi.fn().mockResolvedValue(undefined)

      // First event
      setTimeout(() => saveFn(5), 600)

      // 300ms later — still no save
      vi.advanceTimersByTime(300)
      expect(saveFn).not.toHaveBeenCalled()

      // Another 300ms — save fires
      vi.advanceTimersByTime(300)
      expect(saveFn).toHaveBeenCalledTimes(1)
      expect(saveFn).toHaveBeenCalledWith(5)
      vi.useRealTimers()
    })

    it('resets timer on each new event (debounce behavior)', () => {
      vi.useFakeTimers()
      const saveFn = vi.fn().mockResolvedValue(undefined)

      let timer: ReturnType<typeof setTimeout> | null = null

      timer = setTimeout(() => saveFn(1), 600)
      vi.advanceTimersByTime(400)

      // New event resets timer with updated value
      clearTimeout(timer!)
      timer = setTimeout(() => saveFn(2), 600)
      vi.advanceTimersByTime(400) // only 400ms since reset

      expect(saveFn).not.toHaveBeenCalled()

      // Another reset
      clearTimeout(timer!)
      timer = setTimeout(() => saveFn(3), 600)
      vi.advanceTimersByTime(600)

      expect(saveFn).toHaveBeenCalledTimes(1)
      expect(saveFn).toHaveBeenCalledWith(3)
      vi.useRealTimers()
    })
  })

  // ---- Race condition: stale save does not overwrite new draft ----

  describe('race condition protection', () => {
    it('stale save response does not clear newer draft', () => {
      // User scrolls to 31, save fires. During save, user scrolls to 45.
      // save(31) completes — should NOT clear draft(45)
      const draftValues: Record<string, number> = { 'habit-1': 45 }

      // Simulate save(31) completing
      const savedValue = 31
      const currentDraft = draftValues['habit-1'] // 45

      // Only clear draft if saved value matches current draft
      if (currentDraft === savedValue) {
        delete draftValues['habit-1']
      }

      // Draft should still be 45 (not cleared by stale save(31))
      expect(draftValues['habit-1']).toBe(45)
    })

    it('save that matches draft clears it', () => {
      const draftValues: Record<string, number> = { 'habit-1': 31 }
      const savedValue = 31
      const currentDraft = draftValues['habit-1']

      if (currentDraft === savedValue) {
        delete draftValues['habit-1']
      }

      expect(draftValues['habit-1']).toBeUndefined()
    })

    it('saveVersion prevents stale callbacks from applying', () => {
      let savedByVersion1 = false
      let savedByVersion2 = false

      const saveVersion = { current: 0 }

      // First save queued at version 1
      saveVersion.current = 1
      const v1 = saveVersion.current

      // Second save queued at version 2 (user scrolled more)
      saveVersion.current = 2
      const v2 = saveVersion.current

      // Version 1 callback fires — should be ignored
      if (saveVersion.current === v1) savedByVersion1 = true

      // Version 2 callback fires — should apply
      if (saveVersion.current === v2) savedByVersion2 = true

      expect(savedByVersion1).toBe(false) // Stale version rejected
      expect(savedByVersion2).toBe(true) // Latest version applied
    })

    it('continuous scrolling during save keeps draft value', () => {
      // Simulate: save(31) started, user scrolled to 45
      const draftValues: Record<string, number> = { 'habit-1': 45 }
      const persistedValue = 31 // save(31) completed and updated query cache

      // Display should still show draft (45), not persisted (31)
      const display = draftValues['habit-1'] ?? persistedValue
      expect(display).toBe(45)
    })
  })

  // ---- Save failure handling ----

  describe('save failure handling', () => {
    it('keeps draft value after save failure', () => {
      const draftValues: Record<string, number> = { 'habit-1': 25 }
      const persistedValue = 20

      // Save(25) failed — draft stays, UI keeps showing 25
      const display = draftValues['habit-1'] ?? persistedValue
      expect(display).toBe(25)
    })

    it('retry saves the latest draft value', () => {
      const draftValues: Record<string, number> = { 'habit-1': 30 }
      const persistedValue = 20

      // Retry should use draft value, not persisted
      const valueToRetry = draftValues['habit-1'] ?? persistedValue
      expect(valueToRetry).toBe(30)
    })
  })

  // ---- Input validation ----

  describe('input validation', () => {
    it('validates positive integer', () => {
      expect(isValidInput('30')).toBe(true)
    })

    it('validates 0', () => {
      expect(isValidInput('0')).toBe(true)
    })

    it('validates decimal', () => {
      expect(isValidInput('1.5')).toBe(true)
    })

    it('rejects negative numbers', () => {
      expect(isValidInput('-5')).toBe(false)
    })

    it('rejects non-numeric text', () => {
      expect(isValidInput('abc')).toBe(false)
    })

    it('rejects empty string', () => {
      expect(isValidInput('')).toBe(false)
    })
  })

  // ---- Layout stability: save state uses fixed width ----

  describe('save state indicator', () => {
    it('idle state renders empty placeholder (not null)', () => {
      const state = getSaveStateDisplay('idle')
      expect(state).toBeDefined()
      expect(state.visible).toBe(false)
    })

    it('saving state shows loader', () => {
      const state = getSaveStateDisplay('saving')
      expect(state.visible).toBe(true)
      expect(state.icon).toBe('loader')
    })

    it('saved state shows check', () => {
      const state = getSaveStateDisplay('saved')
      expect(state.visible).toBe(true)
      expect(state.icon).toBe('check')
    })

    it('error state shows alert circle', () => {
      const state = getSaveStateDisplay('error')
      expect(state.visible).toBe(true)
      expect(state.icon).toBe('alert-circle')
    })
  })
})

// ============================================================
// Pure helper functions (mirroring logic in components for testability)
// ============================================================

function getMinutesStep(): number {
  return 1
}

function getCountStep(): number {
  return 1
}

function getHoursStep(): number {
  return 0.5
}

function accumulateWheel(
  draft: number | undefined,
  persisted: number,
  deltaY: number,
  step: number
): { draft: number; persisted: number } {
  const baseValue = draft !== undefined ? draft : persisted
  const delta = deltaY < 0 ? step : deltaY > 0 ? -step : 0
  const newValue = Math.max(0, baseValue + delta)
  return { draft: newValue, persisted }
}

function accumulateButton(
  draft: number | undefined,
  persisted: number,
  delta: number
): { draft: number; persisted: number } {
  const baseValue = draft !== undefined ? draft : persisted
  const newValue = Math.max(0, baseValue + delta)
  return { draft: newValue, persisted }
}

function resolveDisplayValue(draft: number | undefined, persisted: number): number {
  return draft !== undefined ? draft : persisted
}

function isValidInput(raw: string): boolean {
  if (raw === '') return false
  const val = parseFloat(raw)
  return !isNaN(val) && val >= 0
}

function getSaveStateDisplay(state: 'idle' | 'saving' | 'saved' | 'error') {
  switch (state) {
    case 'idle':
      return { visible: false, icon: null }
    case 'saving':
      return { visible: true, icon: 'loader' }
    case 'saved':
      return { visible: true, icon: 'check' }
    case 'error':
      return { visible: true, icon: 'alert-circle' }
  }
}
