// 生成 README 用界面截图。
// 前置：npm run build:static（out/ 已生成）
// 流程：起本地静态服务 → 本地演示模式登录 → 导入演示备份 → 逐页截图到 docs/screenshots/
// 用法：node scripts/take-screenshots.mjs

import { chromium } from '@playwright/test'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outDir = path.join(root, 'out')
const shotDir = path.join(root, 'docs', 'screenshots')
const backupPath = path.join(root, 'scripts', '.demo-backup.json')
const PORT = 4173
const BASE = `http://127.0.0.1:${PORT}`

// ---------- 静态服务器 ----------

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.woff2': 'font/woff2',
}

function mapUrl(urlPath) {
  const p = decodeURIComponent(urlPath.split('?')[0])
  if (p === '/') return path.join(outDir, 'index.html')
  const f = path.join(outDir, p)
  if (fs.existsSync(f) && fs.statSync(f).isFile()) return f
  if (fs.existsSync(`${f}.html`)) return `${f}.html`
  const idx = path.join(f, 'index.html')
  if (fs.existsSync(idx)) return idx
  return null
}

const server = http.createServer((req, res) => {
  const file = mapUrl(req.url)
  if (!file) {
    res.statusCode = 404
    res.end('not found')
    return
  }
  res.setHeader('Content-Type', MIME[path.extname(file)] ?? 'application/octet-stream')
  fs.createReadStream(file).pipe(res)
})

// ---------- 演示数据（备份格式，恢复时 id/时间戳会被剥掉重建） ----------

const day = (offset) => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${dd}`
}
const iso = (offset, h, min = 0) =>
  `${day(offset)}T${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}:00`

function buildDemoBackup() {
  const tags = [
    { id: 'g1', name: '工作', color: '#3b82f6', is_default: true, is_visible: true, sort_order: 0 },
    { id: 'g2', name: '学习', color: '#8b5cf6', is_default: false, is_visible: true, sort_order: 1 },
    { id: 'g3', name: '健康', color: '#10b981', is_default: false, is_visible: true, sort_order: 2 },
    { id: 'g4', name: '生活', color: '#f59e0b', is_default: false, is_visible: true, sort_order: 3 },
  ]

  // id / user_id / 时间戳由仓库层在恢复时重新生成，这里只写业务字段
  let order = 0
  const T = (o) => ({ id: `t${++order}`, order_index: order, ...o })

  const tasks = [
    // 今天：上午/下午/晚上三段，状态丰富
    T({ title: '晨跑 30 分钟', task_date: day(0), period: 'morning', start_time: '06:40', end_time: '07:10', tag_id: 'g3', priority: 'normal', status: 'done', completed_at: iso(0, 7, 15), estimated_minutes: 30 }),
    T({ title: '背 50 个日语单词', task_date: day(0), period: 'morning', start_time: '07:30', tag_id: 'g2', priority: 'normal', status: 'done', completed_at: iso(0, 8, 5), estimated_minutes: 30 }),
    T({ title: '写周报初稿', task_date: day(0), period: 'morning', start_time: '09:00', end_time: '10:30', tag_id: 'g1', priority: 'high', difficulty: 'medium', status: 'in_progress', estimated_minutes: 90 }),
    T({ title: '回复合作方邮件', task_date: day(0), period: 'morning', start_time: '11:00', tag_id: 'g1', priority: 'normal', status: 'todo', estimated_minutes: 20 }),
    T({ title: '团队周会', task_date: day(0), period: 'afternoon', start_time: '14:00', end_time: '15:00', tag_id: 'g1', priority: 'normal', status: 'todo' }),
    T({ title: '修复「日历拖拽错位」问题', task_date: day(0), period: 'afternoon', start_time: '15:30', tag_id: 'g1', priority: 'high', difficulty: 'hard', status: 'todo', estimated_minutes: 60 }),
    T({ title: '取快递 + 采购下周食材', task_date: day(0), period: 'afternoon', start_time: '17:30', tag_id: 'g4', priority: 'low', status: 'todo' }),
    T({ title: '读《卡片笔记写作法》30 页', task_date: day(0), period: 'evening', start_time: '20:00', tag_id: 'g2', priority: 'normal', status: 'todo', estimated_minutes: 40 }),
    T({ title: '每日复盘 15 分钟', task_date: day(0), period: 'evening', start_time: '22:00', tag_id: 'g2', priority: 'normal', status: 'todo', estimated_minutes: 15, recurrence_rule: { frequency: 'daily', interval: 1 } }),
    T({ title: '睡前拉伸 10 分钟', task_date: day(0), period: 'evening', start_time: '22:30', tag_id: 'g3', priority: 'low', status: 'todo' }),
    // 昨天及更早：喂饱统计图表
    T({ title: '整理产品需求池', task_date: day(-1), period: 'morning', tag_id: 'g1', priority: 'normal', status: 'done', completed_at: iso(-1, 11) }),
    T({ title: '和设计师对齐视觉稿', task_date: day(-1), period: 'afternoon', start_time: '16:00', tag_id: 'g1', priority: 'normal', status: 'done', completed_at: iso(-1, 17) }),
    T({ title: '夜跑 5 公里', task_date: day(-1), period: 'evening', tag_id: 'g3', priority: 'normal', status: 'done', completed_at: iso(-1, 21) }),
    T({ title: '看一集纪录片', task_date: day(-1), period: 'evening', tag_id: 'g4', priority: 'low', status: 'cancelled' }),
    T({ title: '算法题 3 道', task_date: day(-2), period: 'morning', tag_id: 'g2', priority: 'normal', status: 'done', completed_at: iso(-2, 10) }),
    T({ title: '修数据导入的边界情况', task_date: day(-2), period: 'afternoon', tag_id: 'g1', priority: 'high', status: 'done', completed_at: iso(-2, 16) }),
    T({ title: '预约牙医（洗牙）', task_date: day(-2), period: 'afternoon', tag_id: 'g4', priority: 'normal', status: 'todo' }),
    T({ title: '读完《纳瓦尔宝典》第 4 章', task_date: day(-3), period: 'evening', tag_id: 'g2', priority: 'normal', status: 'done', completed_at: iso(-3, 22) }),
    T({ title: '健身房：上肢日', task_date: day(-3), period: 'evening', tag_id: 'g3', priority: 'normal', status: 'done', completed_at: iso(-3, 20) }),
    T({ title: '给妈妈打电话', task_date: day(-4), period: 'evening', tag_id: 'g4', priority: 'normal', status: 'done', completed_at: iso(-4, 20) }),
    T({ title: '季度 OKR 复盘', task_date: day(-4), period: 'morning', tag_id: 'g1', priority: 'high', status: 'done', completed_at: iso(-4, 11) }),
    T({ title: '整理收藏夹', task_date: day(-5), period: 'evening', tag_id: 'g4', priority: 'low', status: 'done', completed_at: iso(-5, 21) }),
    T({ title: '晨读英语 20 分钟', task_date: day(-5), period: 'morning', tag_id: 'g2', priority: 'normal', status: 'done', completed_at: iso(-5, 8) }),
    T({ title: '月度账单核对', task_date: day(-6), period: 'afternoon', tag_id: 'g4', priority: 'normal', status: 'done', completed_at: iso(-6, 15) }),
    T({ title: '游泳 45 分钟', task_date: day(-6), period: 'evening', tag_id: 'g3', priority: 'normal', status: 'done', completed_at: iso(-6, 20) }),
    // 未来
    T({ title: '和朋友打羽毛球', task_date: day(1), period: 'afternoon', start_time: '15:00', tag_id: 'g4', priority: 'normal', status: 'todo' }),
    T({ title: '复盘本月计划', task_date: day(1), period: 'evening', start_time: '21:00', tag_id: 'g1', priority: 'normal', status: 'todo' }),
    T({ title: '年度体检（空腹）', task_date: day(2), period: 'morning', start_time: '08:00', tag_id: 'g3', priority: 'high', status: 'todo' }),
  ]

  const H = (o) => ({ schedule_rule: { frequency: 'daily', interval: 1 }, start_date: day(-30), ...o })
  const habits = [
    H({ id: 'h1', name: '喝水 8 杯', measurement_type: 'count', target_value: 8, unit: '杯', color: '#38bdf8' }),
    H({ id: 'h2', name: '阅读 30 分钟', measurement_type: 'minutes', target_value: 30, unit: '分钟', color: '#a78bfa' }),
    H({ id: 'h3', name: '运动', measurement_type: 'boolean', target_value: 1, color: '#34d399' }),
    H({ id: 'h4', name: '背单词', measurement_type: 'count', target_value: 50, unit: '个', color: '#fbbf24' }),
  ]

  const habit_logs = []
  const L = (habitId, offset, value, done) =>
    habit_logs.push({ habit_id: habitId, log_date: day(offset), value, is_completed: done })
  // 今天：进行到一半的真实感
  L('h1', 0, 5, false)
  L('h2', 0, 20, false)
  L('h3', 0, 1, true)
  L('h4', 0, 50, true)
  // 过去 10 天：有断有续
  for (let i = 1; i <= 10; i++) {
    L('h1', -i, 8, true)
    if (i !== 4) L('h2', -i, 30, true)
    if (i % 2 === 0) L('h3', -i, 1, true)
    if (i <= 6) L('h4', -i, 50, true)
  }

  const reviews = []
  const R = (offset, score, completion, mood, energy, achievement, summary, tomorrow) =>
    reviews.push({ review_date: day(offset), score, subjective_completion: completion, mood, energy, achievement, summary, tomorrow_focus: tomorrow })
  R(-1, 8, 80, 4, 4, '修完了两个遗留 bug，还跑了 5 公里', '节奏不错，下午有一段低效刷手机', '把周报写完')
  R(-2, 7, 75, 4, 3, '数据导入的边界情况清零', '午饭后犯困，效率一般', '专注时段提前到上午')
  R(-3, 9, 90, 5, 4, '读完一章书 + 健身房打卡', '状态很好，继续保持', '早起 20 分钟')
  R(-4, 6, 60, 3, 3, '季度 OKR 复盘完成', '晚上刷视频有点久', '睡前手机放客厅')
  R(-5, 8, 85, 4, 4, '晨读坚持住了', '全天基本按计划走', '下午集中处理杂事')
  R(-6, 7, 70, 3, 3, '账单核对完，超支项找到原因', '晚上有点累', '早点睡')

  const countdowns = [
    { id: 'c1', title: '元旦', target_date: '2027-01-01', color: '#ef4444', category: '节日', is_yearly: false, show_on_home: true, is_pinned: true, sort_order: 0 },
    { id: 'c2', title: '生日', target_date: day(26), color: '#ec4899', category: '纪念日', is_yearly: true, show_on_home: true, is_pinned: true, sort_order: 1 },
    { id: 'c3', title: '项目 v1.0 上线', target_date: '2026-12-01', color: '#3b82f6', category: '工作', is_yearly: false, show_on_home: true, is_pinned: false, sort_order: 2 },
  ]

  const focus_sessions = []
  const F = (offset, h, minutes, title, taskId) =>
    focus_sessions.push({ task_id: taskId, title, mode: 'focus', timer_mode: 'countdown', planned_minutes: minutes, actual_seconds: minutes * 60, started_at: iso(offset, h), completed_at: iso(offset, h, minutes % 60), status: 'completed', pause_count: 0 })
  F(0, 9, 25, '写周报初稿', 't3')
  F(-1, 10, 25, '整理产品需求池')
  F(-1, 15, 45, '和设计师对齐视觉稿')
  F(-2, 15, 25, '修数据导入的边界情况')
  F(-2, 20, 25, '晚间阅读')
  F(-3, 19, 25, '阅读时间')

  return {
    format: 'shiqi-backup',
    version: 1,
    exported_at: new Date().toISOString(),
    app: '时栖',
    data: {
      tasks,
      tags,
      habits,
      habit_logs,
      reviews,
      countdowns,
      templates: [],
      focus_sessions,
      preferences: null,
    },
  }
}

// ---------- 截图流程 ----------

async function settle(page, ms = 1800) {
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.waitForTimeout(ms)
}

async function main() {
  if (!fs.existsSync(outDir)) {
    throw new Error('out/ 不存在，请先运行 npm run build:static')
  }
  fs.mkdirSync(shotDir, { recursive: true })
  fs.writeFileSync(backupPath, JSON.stringify(buildDemoBackup(), null, 2))

  await new Promise((r) => server.listen(PORT, '127.0.0.1', r))
  console.log(`serving ${outDir} at ${BASE}`)

  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    locale: 'zh-CN',
  })
  const page = await context.newPage()

  // 压掉每天首次打开的开场页
  await page.addInitScript(() => {
    const d = new Date()
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    window.localStorage.setItem('timegrid:atmosphere:welcomed', key)
  })

  // 本地打包版（NEXT_PUBLIC_LOCAL_ONLY=1）自动以本机身份进入，没有登录页
  await page.goto(`${BASE}/schedule`)
  await page.getByTestId('quick-add-title').waitFor({ timeout: 20000 })
  console.log('entered local mode')

  // 导入演示数据（设置 → 数据 → 从备份恢复）
  await page.goto(`${BASE}/settings`)
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: '数据', exact: true }).click()
  await page.getByTestId('backup-import').waitFor({ timeout: 10000 })
  const chooserP = page.waitForEvent('filechooser')
  await page.getByTestId('backup-import').click()
  const chooser = await chooserP
  await chooser.setFiles(backupPath)
  await page.getByTestId('backup-restore-confirm').click({ timeout: 10000 })
  await page.waitForTimeout(2500)
  await page.reload()
  await settle(page, 1200)
  console.log('demo data imported')

  const shot = (name) => page.screenshot({ path: path.join(shotDir, `${name}.png`) })

  // 1. 日程主页（默认云母 Fluent 主题）——加高视口，把三个时段分组拍全
  await page.setViewportSize({ width: 1440, height: 1080 })
  await page.goto(`${BASE}/schedule`)
  await settle(page)
  await shot('schedule-light')
  console.log('✓ schedule-light')

  // 2. 今日视图（日视图 + 评价表单 + 习惯打卡）
  await page.goto(`${BASE}/today`)
  await settle(page)
  await shot('today-view')
  console.log('✓ today-view')
  await page.setViewportSize({ width: 1440, height: 900 })

  // 2. 日历月视图
  await page.goto(`${BASE}/calendar`)
  await settle(page)
  await shot('calendar-month')
  console.log('✓ calendar-month')

  // 3. 专注（番茄钟）——试着开一个 25 分钟
  await page.goto(`${BASE}/focus`)
  await settle(page, 1200)
  const startBtn = page.getByRole('button', { name: /开始|启动/ }).first()
  if (await startBtn.isVisible().catch(() => false)) {
    await startBtn.click().catch(() => {})
    await page.waitForTimeout(1500)
  }
  await shot('focus-timer')
  console.log('✓ focus-timer')

  // 4. 习惯打卡
  await page.goto(`${BASE}/habits`)
  await settle(page)
  await shot('habits')
  console.log('✓ habits')

  // 5. 统计
  await page.goto(`${BASE}/insights`)
  await settle(page)
  await shot('insights')
  console.log('✓ insights')

  // 6. 复盘记录
  await page.goto(`${BASE}/reviews`)
  await settle(page)
  await shot('reviews')
  console.log('✓ reviews')

  // 7. 设置 · 外观与个性化（滚动到主题卡片）
  await page.goto(`${BASE}/settings`)
  await settle(page, 1200)
  await page.getByText('外观与个性化').first().scrollIntoViewIfNeeded().catch(() => {})
  await page.waitForTimeout(800)
  await shot('settings-appearance')
  console.log('✓ settings-appearance')

  // 8. 樱色主题 + 随包分发的看板娘「冯宝宝」（切主题后重进日程页）
  await page.evaluate(() => {
    window.localStorage.setItem('timegrid:appearance:v1', JSON.stringify({
      version: 1,
      themeId: 'anime',
      atmosphere: { characterId: 'pack-feng-baobao' },
    }))
  })
  await page.goto(`${BASE}/schedule`)
  await settle(page, 2200)
  await shot('theme-anime')
  console.log('✓ theme-anime')

  // 9. 手机版（同一 context 改视口，数据共享）
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${BASE}/schedule`)
  await settle(page, 1500)
  await shot('mobile-schedule')
  console.log('✓ mobile-schedule')
  await page.setViewportSize({ width: 1440, height: 900 })

  // 10. 桌面浮窗（widget 独立页面，用小视口模拟浮窗）
  await page.evaluate(() => {
    window.localStorage.setItem('timegrid:appearance:v1', JSON.stringify({ version: 1, themeId: 'fluent' }))
  })
  await page.setViewportSize({ width: 420, height: 720 })
  await page.goto(`${BASE}/widget`)
  await settle(page, 1500)
  await shot('widget')
  console.log('✓ widget')

  await browser.close()
  server.close()
  fs.rmSync(backupPath, { force: true })
  console.log(`done. screenshots in ${shotDir}`)
}

main().catch((err) => {
  console.error(err)
  server.close()
  process.exit(1)
})
