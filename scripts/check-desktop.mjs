import { readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const root = fileURLToPath(new URL('../electron/', import.meta.url))
function check(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name)
    if (entry.isDirectory()) check(file)
    else if (/\.(cjs|mjs|js)$/.test(entry.name)) {
      execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' })
      console.log('Syntax OK:', path.relative(root, file))
    }
  }
}
check(root)
