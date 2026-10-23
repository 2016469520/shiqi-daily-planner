# SECURITY_REVIEW.md — 安全审查

## 审查日期: 2026-07-04

## RLS (Row Level Security)

| 表 | RLS 启用 | SELECT | INSERT | UPDATE | DELETE |
|----|---------|--------|--------|--------|--------|
| profiles | ✅ | ✅ | ✅ | ✅ | — |
| tags | ✅ | ✅ | ✅ | ✅ | ✅ |
| tasks | ✅ | ✅ | ✅ | ✅ | ✅ |
| task_subitems | ✅ | ✅ | ✅ | ✅ | ✅ |
| recurrence_exceptions | ✅ | ✅ | ✅ | — | ✅ |
| habits | ✅ | ✅ | ✅ | ✅ | ✅ |
| habit_logs | ✅ | ✅ | ✅ | ✅ | ✅ |
| daily_reviews | ✅ | ✅ | ✅ | ✅ | — |
| task_templates | ✅ | ✅ | ✅ | ✅ | ✅ |
| user_preferences | ✅ | ✅ | ✅ | ✅ | — |
| countdowns | ✅ | ✅ | ✅ | ✅ | ✅ |
| focus_sessions | ✅ | ✅ | ✅ | ✅ | ✅ |

**结论**: 所有用户数据表均启用 RLS，策略使用 `auth.uid() = user_id` 进行隔离。✅

## 认证

- Supabase Auth 用于云端模式
- 演示模式使用 localStorage 持久化虚拟用户
- 登出时清理 demo session
- `handle_new_user` 触发器已移除 (migration 003)，应用层处理新用户设置

## 环境变量

- `.env.local` 已在 `.gitignore` 中
- `.env.example` 仅含占位符，无真实值
- Git 历史检查：未发现密钥泄露
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` 作为公开客户端密钥正常使用
- `SUPABASE_SERVICE_ROLE_KEY` 仅在 `.env.example` 中作为文档提及

## 客户端安全

- 客户端仅使用 `anon_key`，无 Service Role Key
- `createClient()` 使用 `@supabase/ssr` 的 `createBrowserClient`
- RLS 是真实安全边界，不依赖客户端过滤

## 导入文件验证

- Zod schema 用于表单验证
- 导入导出模块需检查 JSON 结构验证

## XSS

- React 默认转义防止 XSS
- 用户输入通过 React Hook Form + Zod 验证
- 无 `dangerouslySetInnerHTML` 使用 (需确认)

## Service Worker

- 不缓存 Supabase API 请求 (`.supabase.co` 域名跳过)
- 仅缓存静态资源 (JS/CSS/images)
- 导航请求使用 network-first 策略

## 用户数据隔离

- 所有 Repository 方法接受 `userId` 参数
- IndexedDB 按 `user_id` 索引
- 演示模式登出清理 localStorage demo user

## 已知风险

1. **npm audit**: postcss <8.5.10 中度漏洞 (Next.js 内置依赖，无法独立升级)
2. **演示模式**: 用户数据存储在 IndexedDB，清除浏览器数据会丢失 (已文档化)
3. **无 CSP headers**: 未配置 Content Security Policy
