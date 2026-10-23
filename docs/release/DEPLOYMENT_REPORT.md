# DEPLOYMENT_REPORT.md — 部署报告

## 部署信息

| 项目 | 详情 |
|------|------|
| 日期 | 2026-07-04 |
| Git 分支 | main |
| 仓库 | https://github.com/2016469520/plan-calendar |
| 生产 URL | https://my-plan-calendar.vercel.app |

## 质量闸门

| 检查项 | 结果 |
|--------|------|
| ESLint | 0 errors, 93 warnings |
| TypeScript | 0 errors |
| Vitest | 224 passed |
| Playwright E2E | 24 passed |
| Production build | 通过 (14 routes) |
| npm audit | 2 moderate (Next.js 内置依赖，不可升级) |

## 代码变更

### 修复
- measurement_type CHECK 约束 (migration 009)
- React Compiler ref-during-render 错误
- Demo 模式 session 持久化 (localStorage)
- E2E 测试重写
- 未使用 import 清理

### 新增
- CI workflow (.github/workflows/ci.yml)
- Migration 009 (measurement_type)
- Review 文档 (5 个)
- Demo session localStorage 持久化

## Supabase Migration 状态

| Migration | 状态 |
|-----------|------|
| 001_initial_schema.sql | 已应用 (生产) |
| 002_rls_policies.sql | 已应用 (生产) |
| 003_fix_handle_new_user.sql | 已应用 (生产) |
| 004_tag_deduplication.sql | 已应用 (生产) |
| 005_countdowns.sql | 已应用 (生产) |
| 006_focus_sessions.sql | 已应用 (生产) |
| 007_difficulty_due_at.sql | ⚠️ 待应用 |
| 008_focus_timer_mode.sql | ⚠️ 待应用 |
| 009_measurement_type_add_minutes_hours.sql | ⚠️ 待应用 |

> 迁移 007-009 需在 Supabase SQL Editor 中手动执行。

## 环境变量

- NEXT_PUBLIC_SUPABASE_URL: 已配置
- NEXT_PUBLIC_SUPABASE_ANON_KEY: 已配置
- SUPABASE_SERVICE_ROLE_KEY: 未在客户端使用

## 线上冒烟测试

⏳ 待执行 — 需 Vercel 部署完成后进行

## 发布结论

⏳ 等待 Vercel 部署和线上验证
