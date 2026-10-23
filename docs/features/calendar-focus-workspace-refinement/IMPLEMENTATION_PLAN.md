# IMPLEMENTATION_PLAN — 日历、专注、设置工作区优化

## Phase 1: 日历高密度布局
- **文件**: `src/components/calendar/week-view.tsx`, `month-view.tsx`
- **变更**: 限制每格显示3条，添加"还有N项"，小屏横向滚动，统一行高
- **新增**: `src/components/calendar/task-list-sheet.tsx`
- **风险**: 拖拽回归
- **测试**: 高密度任务不重叠、对齐

## Phase 2: 日历任务详情
- **文件**: `src/components/calendar/week-view.tsx`, `month-view.tsx`, `day-view.tsx`
- **变更**: 添加 onClick → open detail panel（复用 TaskDetailPanel）
- **风险**: 完成按钮/拖拽与点击冲突
- **测试**: 点击打开详情、完成不误开、拖拽不误开

## Phase 3: 全局中文化
- **文件**: `src/lib/constants.ts`（新增 DISPLAY_LABELS）
- **变更**: 统一显示映射，修复 quick-add, calendar, focus, settings
- **风险**: 遗漏某些位置
- **测试**: 遍历关键页面验证无英文

## Phase 4: 难度与自动紧迫度
- **文件**: types, migration, repos, forms, cards, filters
- **变更**: 新增 difficulty + due_at，auto-calculate urgency
- **新增**: `supabase/migrations/007_difficulty_due_at.sql`
- **风险**: 旧 priority 数据兼容
- **回滚**: 旧 priority 保留，可回退

## Phase 5: 修复专注功能
- **文件**: `src/hooks/use-focus.ts`, repos, Supabase/IndexedDB focus repos
- **变更**: 修复错误，完善状态机，刷新恢复
- **测试**: start/pause/resume/complete/cancel/refresh

## Phase 6: 专注一级入口与主页区域
- **文件**: nav-data, app-shell, schedule page
- **新增**: `src/app/focus/page.tsx`
- **变更**: 导航添加专注，主页面大型专注区
- **测试**: 导航可见、页面可访问

## Phase 7: 个性化统计
- **文件**: `src/lib/utils/focus-stats.ts`, `src/lib/utils/habit-stats.ts`
- **变更**: 纯函数统计，主页面摘要，统计页详情
- **测试**: 统计数据正确

## Phase 8: 恢复每日总结
- **文件**: nav-data.tsx, app-shell.tsx
- **变更**: 导航添加"每日总结"，路由到今日评价
- **新增**: `src/app/reviews/today/page.tsx`

## Phase 9: 设置页重构
- **文件**: `src/app/settings/page.tsx`
- **变更**: max-w-5xl, 二级导航, 响应式两列网格, 中文值

## Phase 10: 回归、文档、发布
- 全量测试、视觉截图、文档更新、commit、push、Vercel验证
