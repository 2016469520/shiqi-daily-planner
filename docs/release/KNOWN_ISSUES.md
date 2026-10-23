# KNOWN_ISSUES.md — 已知问题

> 本次发布前确认的已知限制，不影响核心功能使用。

## 功能限制

### 收集箱查询逻辑
- **影响**: 收集箱页面查询 `getByDate('inbox')` — IndexedDB 中 'inbox' 不是有效日期
- **状态**: 未修复，收集箱功能可用但查询路径需重构
- **计划**: v1.2 重构

### 周视图任务芯片交互
- **影响**: 周视图中任务芯片不响应点击（无编辑/完成交互）
- **状态**: 未修复，用户需切换到日视图或日程页操作
- **计划**: v1.2 添加

### 统计页面图表
- **影响**: 统计页面仅展示基础数字，缺少图表组件
- **状态**: 未修复
- **计划**: v1.3 添加图表

## 技术债务

### React Compiler 警告
- **影响**: RHF `watch()` 在 ScoreSelect 组件中触发 react-hooks/incompatible-library 警告
- **状态**: 已知，不影响功能
- **计划**: 等待 RHF 或 React Compiler 更新

### npm audit 警告
- **影响**: postcss <8.5.10 在 Next.js 内置依赖中存在 XSS 风险（仅影响 CSS 构建输出）
- **状态**: 无法安全升级（锁定在 Next.js 依赖）
- **计划**: 等待 Next.js 更新 postcss 依赖

## 数据库迁移

以下 migration 尚未应用到生产 Supabase：
- `007_difficulty_due_at.sql` — difficulty + due_at 字段
- `008_focus_timer_mode.sql` — timer_mode 字段
- `009_measurement_type_add_minutes_hours.sql` — measurement_type CHECK 约束修复

> 代码已就绪，迁移需在生产数据库手动执行。
