// ============================================================
// app:// 协议的静态文件解析（纯函数，可单元测试，不依赖 electron）
// ============================================================

const path = require('node:path')
const fs = require('node:fs')

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
}

function mimeFor(file) {
  return MIME_TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream'
}

/**
 * Next.js 静态导出会把 RSC 预取数据写成 `__next.<路由>/__PAGE__.txt`，
 * 但客户端请求的是 `/路由/__next.<路由>.__PAGE__.txt`。
 * 这里把文件名里的点号逐段折叠成目录分隔符，补全这些预取请求。
 */
function dotSplitCandidates(relPath) {
  const dir = path.dirname(relPath)
  const base = path.basename(relPath)
  if (!base.startsWith('__next.') || !base.endsWith('.txt')) return []

  const ext = '.txt'
  const parts = base.slice(0, -ext.length).split('.')
  const results = []
  const separators = parts.length - 1
  // 逐个组合决定每个点号是保留还是变成目录分隔符
  for (let mask = 1; mask < 1 << separators; mask++) {
    let name = parts[0]
    for (let i = 1; i < parts.length; i++) {
      name += mask & (1 << (i - 1)) ? '/' : '.'
      name += parts[i]
    }
    results.push(path.join(dir, name + ext))
  }
  return results
}

/**
 * 把 URL 路径映射到 dist 目录内的真实文件。
 * 支持 `/`、`/calendar/`、`/calendar`、带扩展名的静态资源；越界路径返回 null。
 *
 * @param {string} distDir 静态站点根目录
 * @param {string} pathname URL.pathname
 * @returns {string|null} 绝对文件路径
 */
function resolveAsset(distDir, pathname) {
  const root = path.resolve(distDir)
  let clean
  try {
    clean = decodeURIComponent(pathname.split('?')[0].split('#')[0])
  } catch {
    return null
  }

  const candidates = []
  if (clean === '/' || clean === '') {
    candidates.push('index.html')
  } else {
    const rel = clean.replace(/^\/+/, '')
    candidates.push(rel)
    if (!path.extname(rel)) {
      candidates.push(path.join(rel, 'index.html'))
      candidates.push(`${rel}.html`)
    }
    candidates.push(...dotSplitCandidates(rel))
  }

  for (const candidate of candidates) {
    const full = path.resolve(root, candidate)
    // 目录穿越防护：解析后必须仍在站点根目录内
    if (full !== root && !full.startsWith(root + path.sep)) continue
    try {
      if (fs.statSync(full).isFile()) return full
    } catch {
      /* 不存在，试下一个候选 */
    }
  }
  return null
}

module.exports = { MIME_TYPES, mimeFor, resolveAsset }
