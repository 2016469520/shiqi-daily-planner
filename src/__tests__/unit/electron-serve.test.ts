import { afterAll, beforeAll, describe, it, expect } from 'vitest'
import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'

type ServeModule = {
  mimeFor: (file: string) => string
  resolveAsset: (distDir: string, pathname: string) => string | null
}

// Electron 主进程用的是 CommonJS，这里按模块路径直接加载做纯函数测试
const serve = (await import('../../../electron/serve.cjs')) as unknown as ServeModule

// A fresh checkout must test the resolver without requiring a prior build.
const DIST = fs.mkdtempSync(path.join(os.tmpdir(), 'timegrid-serve-test-'))
beforeAll(() => {
  for (const file of ['index.html', 'calendar/index.html', 'settings/index.html', 'calendar/__next.calendar/__PAGE__.txt']) {
    const dest = path.join(DIST, file)
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    fs.writeFileSync(dest, 'fixture')
  }
})
afterAll(() => {
  if (path.dirname(DIST) !== path.resolve(os.tmpdir()) || !path.basename(DIST).startsWith('timegrid-serve-test-')) throw Error('Unexpected fixture directory')
  fs.rmSync(DIST, { recursive: true })
})

describe('Electron app:// 静态资源解析', () => {
  it('根路径解析到 index.html', () => {
    const file = serve.resolveAsset(DIST, '/')
    expect(file?.endsWith('index.html')).toBe(true)
  })

  it('目录式路由解析到 index.html（trailingSlash 产物）', () => {
    const file = serve.resolveAsset(DIST, '/calendar/')
    expect(file?.endsWith(path.join('calendar', 'index.html'))).toBe(true)
  })

  it('省略结尾斜杠也能解析', () => {
    const file = serve.resolveAsset(DIST, '/settings')
    expect(file?.endsWith(path.join('settings', 'index.html'))).toBe(true)
  })

  it('拒绝目录穿越', () => {
    expect(serve.resolveAsset(DIST, '/../../Windows/win.ini')).toBeNull()
    expect(serve.resolveAsset(DIST, '/..%2f..%2fpackage.json')).toBeNull()
  })

  it('把 RSC 预取路径折叠成实际文件（__next.x.__PAGE__.txt）', () => {
    const file = serve.resolveAsset(DIST, '/calendar/__next.calendar.__PAGE__.txt')
    expect(file?.endsWith(path.join('__next.calendar', '__PAGE__.txt'))).toBe(true)
  })

  it('不存在的路径返回 null', () => {
    expect(serve.resolveAsset(DIST, '/definitely-not-here')).toBeNull()
  })

  it('按扩展名给出 MIME', () => {
    expect(serve.mimeFor('/a/b/index.html')).toContain('text/html')
    expect(serve.mimeFor('/a/b/app.js')).toContain('javascript')
    expect(serve.mimeFor('/a/b/style.css')).toContain('text/css')
    expect(serve.mimeFor('/a/b/icon.svg')).toBe('image/svg+xml')
    expect(serve.mimeFor('/a/b/unknown.bin')).toBe('application/octet-stream')
  })
})
