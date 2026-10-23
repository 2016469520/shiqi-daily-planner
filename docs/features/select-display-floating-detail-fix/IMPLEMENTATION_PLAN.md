# IMPLEMENTATION_PLAN

## Phase 1: 统一显示映射
- 文件: `src/lib/display-labels.ts`
- 所有枚举到中文的映射

## Phase 2: 标签选择器修复
- 文件: TaskDetailPanel, QuickAddTask, FocusTimer, 所有含 tag_id 的 Select
- SelectValue render prop 显示标签名

## Phase 3: 快速新增中文
- 文件: QuickAddTask
- 4 个控件全部中文化

## Phase 4: 专注选择器重构
- 文件: FocusTimer, useFocus, types
- 分离专注分类和关联日程

## Phase 5: 详情悬窗
- 文件: TaskDetailPanel → TaskFloatingDetail
- 居中 Dialog 替代右侧面板

## Phase 6-7: 审计、文档、发布
