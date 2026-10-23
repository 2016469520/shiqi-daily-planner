#!/usr/bin/env node
// ============================================================
// 校验并生成内置素材包索引
//
// 用法：node scripts/verify-bundled-packs.mjs [--check]
//
// 扫描 public/characters/<包名>/：
// - 必须有 manifest.json，且 "redistribution_allowed": true
// - 必须有展示图（full_body / half_body / portrait / preview 任一）
// - 生成 public/characters/index.json 供运行时读取
//
// --check：只校验不写文件（CI / 提交前用）。发现不合规的包会以非 0 退出，
// 避免把不可再分发的素材带进公开仓库。
// ============================================================

import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(process.cwd(), 'public/characters')
const INDEX_FILE = path.join(ROOT, 'index.json')
const IMAGE_EXT = new Set(['.png', '.webp', '.jpg', '.jpeg', '.gif', '.avif'])
const DISPLAY_ORDER = ['full_body', 'half_body', 'portrait', 'preview']
const STATE_KEYS = ['idle', 'happy', 'thinking', 'working', 'error', 'sleepy']
const checkOnly = process.argv.includes('--check')

function fail(message) {
  console.error(`✖ ${message}`)
  process.exitCode = 1
}

function readManifest(dir) {
  const file = path.join(dir, 'manifest.json')
  if (!fs.existsSync(file)) return null
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch (error) {
    fail(`${path.basename(dir)}/manifest.json 解析失败：${error.message}`)
    return null
  }
}

function listImages(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true })
  const images = new Map()
  for (const entry of files) {
    if (!entry.isFile()) continue
    const ext = path.extname(entry.name).toLowerCase()
    if (!IMAGE_EXT.has(ext)) continue
    images.set(path.basename(entry.name, ext).toLowerCase(), entry.name)
  }
  return images
}

if (!fs.existsSync(ROOT)) {
  console.log('public/characters 不存在，跳过（没有内置素材包）')
  process.exit(0)
}

const packs = []
const dirs = fs
  .readdirSync(ROOT, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort()

for (const name of dirs) {
  const dir = path.join(ROOT, name)
  const manifest = readManifest(dir)
  if (!manifest) {
    fail(`${name}/ 缺少 manifest.json`)
    continue
  }
  if (manifest.redistribution_allowed !== true) {
    fail(`${name}/manifest.json 没有 "redistribution_allowed": true —— 不允许随仓库分发，请删除该目录或补授权`)
    continue
  }

  const images = listImages(dir)
  if (images.size === 0) {
    fail(`${name}/ 没有任何图片`)
    continue
  }

  const displayKey = DISPLAY_ORDER.find((k) => images.has(k))
  const display = displayKey ? images.get(displayKey) : [...images.values()][0]
  if (!displayKey) {
    console.warn(`⚠ ${name}/ 没有 full_body/half_body/portrait/preview，退回 ${display}`)
  }

  const states = {}
  for (const key of STATE_KEYS) {
    if (images.has(key)) states[key] = images.get(key)
  }

  packs.push({
    id: name,
    version: String(manifest.version ?? manifest.schema_version ?? '1'),
    manifest: {
      id: name,
      name: manifest.name ?? name,
      series: manifest.series,
      tags: manifest.tags,
      preferred_theme: manifest.preferred_theme,
      preferred_accent: manifest.preferred_accent,
      preferred_background: manifest.preferred_background,
      description: manifest.description,
      dialogue: manifest.dialogue,
      redistribution_allowed: true,
    },
    display,
    states,
  })
  const stateCount = Object.keys(states).length
  console.log(`✓ ${name}：展示图 ${display}，状态图 ${stateCount} 个`)
}

const index = { generatedAt: new Date().toISOString(), packs }

if (checkOnly) {
  const current = fs.existsSync(INDEX_FILE) ? fs.readFileSync(INDEX_FILE, 'utf8') : ''
  const next = `${JSON.stringify(index, null, 2)}\n`
  if (current !== next) {
    fail('index.json 与当前目录不一致，请运行 node scripts/verify-bundled-packs.mjs 更新')
  } else {
    console.log(`✓ index.json 已是最新（${packs.length} 个包）`)
  }
} else {
  fs.writeFileSync(INDEX_FILE, `${JSON.stringify(index, null, 2)}\n`, 'utf8')
  console.log(`✓ 写入 public/characters/index.json（${packs.length} 个包）`)
}

if (process.exitCode) {
  console.error('\n有不合规的包，见上面的 ✖。这些包不能随公开仓库分发。')
}
