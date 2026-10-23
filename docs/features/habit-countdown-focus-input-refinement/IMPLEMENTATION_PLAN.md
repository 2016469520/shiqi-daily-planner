# IMPLEMENTATION PLAN — 习惯/倒数日/快速新增/专注交互改进

## Phase 0: 接管和复现
- 读取项目关键文件
- 运行基线检查（lint, tsc, vitest, build）
- 启动 dev server 实际复现问题
- 创建 harness 文档
- 更新 PROJECT_STATUS.md

## Phase 1: 习惯打卡交互修复
### 修改文件
- `src/types/index.ts` — MeasurementType 扩展为 'boolean' | 'count' | 'duration' | 'minutes' | 'hours' | 'numeric'（或保持向后兼容）
- `src/components/habits/habit-checkin.tsx` — 按类型不同 UI
- `src/components/habits/home-habits-summary.tsx` — 首页不同类型不同控件
- `src/app/habits/page.tsx` — 创建习惯时正确设置计量方式
- `src/lib/display-labels.ts` — 添加 MEASUREMENT_TYPE_LABELS

### 数据层
- IHabitLogRepository 已有 update/delete，无需修改接口
- habit_logs 表字段足够，无需新 migration

### 风险
- MeasurementType 类型扩展可能影响现有数据
- 向后兼容：旧 'duration' 类型映射为 minutes UI

## Phase 2: 倒数日首页编辑
### 修改文件
- `src/components/countdowns/home-countdowns.tsx` — 添加编辑按钮和编辑表单
### 数据层
- ICountdownRepository 已有 update/archive/unarchive，无需修改

## Phase 3: 快速新增日期选择器
### 修改文件
- `src/components/schedule/quick-add-task.tsx` — 日期选择改为日历组件
### 方案
- 保留"今天""明天"快捷项
- 添加 Popover + Calendar 或原生 date input 选择任意日期

## Phase 4: 快速新增 placeholder 策略
### 修改文件
- `src/components/schedule/quick-add-task.tsx` — period/difficulty 初始空值
### 风险
- 保存 fallback 逻辑需正确处理空值

## Phase 5: 专注时长交互增强
### 修改文件
- `src/components/focus/focus-timer.tsx` — 添加滚轮、滑块、输入验证

## Phase 6: 专注正计时
### 修改文件
- `src/types/index.ts` — FocusSession 添加 timer_mode
- `src/hooks/use-focus.ts` — 支持正计时状态机
- `src/components/focus/focus-timer.tsx` — 模式切换 UI
- `supabase/migrations/008_focus_stopwatch.sql` — 新 migration
- `src/lib/repositories/interfaces.ts` — 可能无需修改
- IndexedDB 实现 — 支持新字段
- Supabase 实现 — 支持新字段

### 数据层
- 新增 migration 008：focus_sessions 表添加 timer_mode 字段
- 默认值 'countdown'
- 更新 IndexedDB schema

## Phase 7: 回归、文档、发布
- 全量测试
- Build
- 文档更新
- Git commit & push
