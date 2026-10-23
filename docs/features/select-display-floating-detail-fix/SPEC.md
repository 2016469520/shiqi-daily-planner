# SPEC — 选择器显示、专注语义、详情悬窗修复

## 当前错误

1. 任务详情标签字段显示 UUID 而非标签名称
2. 专注组件显示 "none" 而非正确中文
3. 快速新增底部四个控件显示 morning、none、medium
4. 任务详情固定贴右侧，用户希望悬窗效果
5. 所有 SelectValue 在 @base-ui/react 中不自动渲染选中项文本

## 根因

@base-ui/react 的 `SelectValue` 不同于 Radix 版本：
- `placeholder` 仅在 value 为空时显示
- 选中值后需通过 `SelectValue` children 或 `render` prop 显示
- 当前代码未提供选中状态的显示内容，导致显示原始 value（UUID/enum）

## 修复策略

1. 创建统一 `display-labels.ts`
2. 所有 SelectValue 使用 render prop 或 children 显示中文
3. 专注分类与关联日程语义分离
4. 详情组件由侧边栏改为居中 Dialog/Sheet
