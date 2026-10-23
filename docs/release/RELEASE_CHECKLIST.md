# RELEASE_CHECKLIST.md — 发布检查清单

## 功能

- [x] 登录/注册 (演示模式)
- [x] 日程主页 (schedule) — 快速新增、时段分区
- [x] 日历 (月/周/日视图)
- [x] 习惯打卡 (所有计量方式)
- [x] 专注计时 (倒计时/正计时)
- [x] 倒数日
- [x] 每日总结/复盘
- [x] 设置 (外观/日历/专注/提醒/标签/数据)
- [x] 统计 (基础数字)
- [x] 分类视图
- [x] 搜索筛选
- [x] 导入导出
- [x] PWA (manifest + service worker)

## 数据

- [x] IndexedDB 本地演示模式
- [x] Supabase Repository 接口完整
- [x] 所有表有 RLS 策略
- [x] 标签去重唯一约束
- [x] 演示模式 session 持久化 (localStorage)
- [ ] Migration 007-009 待应用到生产 Supabase

## 测试

- [x] Vitest 单元测试: 224 passed
- [x] Playwright E2E: 40 passed (chromium + mobile-chrome)
- [x] TypeScript: 0 errors
- [x] ESLint: 0 errors
- [x] Production build: 通过 (14 routes)

## UI

- [x] 桌面端布局 (sidebar + main)
- [x] 手机端布局 (bottom nav)
- [x] 深色模式
- [x] 内部值不暴露 (morning/medium/todo/none)
- [x] 响应式无横向溢出

## 安全

- [x] RLS 所有用户表
- [x] 无密钥泄露
- [x] .env.local 已忽略
- [x] Service Worker 不缓存 Supabase API
- [x] 登出清理 demo session

## 文档

- [x] README.md 已更新
- [x] PROJECT_STATUS.md 已更新
- [x] DECISIONS.md 已更新
- [x] FUTURE_ROADMAP.md 已核对
- [x] FINAL_REVIEW.md
- [x] KNOWN_ISSUES.md
- [x] SECURITY_REVIEW.md
- [x] DEPLOYMENT_REPORT.md

## CI/CD

- [x] GitHub Actions CI workflow
- [x] Vercel 自动部署配置

## Git

- [x] 分支: release/final-review
- [x] 合并到 main (ff-only)
- [x] 推送到 origin/main

## Vercel

- [ ] 自动部署触发
- [ ] 生产 URL 可访问
- [ ] 部署 commit 与 origin/main 一致

## Supabase

- [ ] Migration 007 已应用
- [ ] Migration 008 已应用
- [ ] Migration 009 已应用

## 线上验证

- [ ] 首页可打开
- [ ] 演示模式可进入
- [ ] 核心功能可操作
- [ ] 刷新数据保留
- [ ] 无 console error
