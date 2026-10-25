// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'

const source = fs.readFileSync(path.resolve('electron/main.cjs'), 'utf8')
const start = source.indexOf('function ensureWidgetVisible()')
const end = source.indexOf('function toggleWidgetVisible()', start)

describe('Electron startup and widget restoration', () => {
  it('parses the complete main process before any window can start', () => {
    expect(() => new vm.Script(source, { filename: 'main.cjs' })).not.toThrow()
  })

  function run(visible: boolean, docked: string | null, absent = false) {
    const widget = { visible, docked, pinned: true }
    const win = {
      isDestroyed: () => false, isVisible: () => visible,
      getBounds: () => ({ x: 0, y: 0, width: 340, height: 460 }),
      isAlwaysOnTop: () => true, isMinimized: () => false,
      showInactive: vi.fn(),
    }
    const context = {
      widgetWindow: absent ? null : win,
      createWidgetWindow: vi.fn(() => win), loadState: () => ({ widget }),
      saveState: vi.fn(), app: { emit: vi.fn() },
      undockWidget: vi.fn(), isPositionVisible: () => true,
    }
    vm.runInNewContext(source.slice(start, end) + '\nensureWidgetVisible()', context)
    return { ...context, win }
  }

  it('keeps an already visible docked tab collapsed', () => {
    const result = run(true, 'right')
    expect(result.undockWidget).not.toHaveBeenCalled()
    expect(result.createWidgetWindow).not.toHaveBeenCalled()
    expect(result.win.showInactive).not.toHaveBeenCalled()
  })
  it('expands and reuses a hidden docked window', () => {
    const result = run(false, 'right')
    expect(result.undockWidget).toHaveBeenCalledOnce()
    expect(result.createWidgetWindow).not.toHaveBeenCalled()
    expect(result.win.showInactive).toHaveBeenCalledOnce()
  })
  it('shows an existing normal window without creating a duplicate', () => {
    const result = run(false, null)
    expect(result.createWidgetWindow).not.toHaveBeenCalled()
    expect(result.win.showInactive).toHaveBeenCalledOnce()
  })
  it('creates a widget when none exists', () => {
    expect(run(false, null, true).createWidgetWindow).toHaveBeenCalledOnce()
  })
})
