# SPEC: 习惯分钟滚轮连续输入

## 日期
2026-07-04

## 版本历史
- v1: 布局稳定性修复（固定操作区、移除快捷按钮、滚轮步进1）
- v2: 滚轮连续输入流畅性修复（draft/persist分离、debounce保存、竞态保护）

## 当前问题（已复现并修复）

### 问题 1：滚轮无法累积值（根因）
`createWheelHandler` 每次滚轮事件从 TanStack Query 缓存读取 `currentValue`，但 debounce 导致 `saveValue`（含 `invalidateLogs`）在 600ms 后才触发。快速滚动期间 query 缓存从不更新，每次滚轮读取相同的值，永远只能 +1。
- 例：从 0 连续滚 20 次 → 每次都读 0、+1 → 最终只保存了 1，不是 20

### 问题 2：每次滚轮触发状态更新
之前 `setSaveStates('saving')` 在每次 `debouncedSave` 调用时立即执行，导致每 80ms 一次 React 重渲染

### 问题 3：无竞态保护
保存中的旧响应可能覆盖用户的新输入

## 修复方案

### 1. Draft/Persist 分离
- `draftValuesRef` (useRef): 本地草稿值，wheel/click 即时更新，独立于 query 缓存
- `draftVersion` (useState): 计数器触发重渲染
- 显示值 = draft ?? persisted
- 保存成功后：若 savedValue === currentDraft，清除 draft

### 2. 稳定 wheel handler
- `createWheelHandler` 仅依赖 `today`（一天不变）
- 通过 `getLogForHabitRef` 访问最新 log 数据
- 通过 `draftValuesRef` 读/写草稿值
- 避免 listener 反复重建导致事件丢失

### 3. 600ms debounce 保存
- wheel、+/- 按钮、直接输入均使用 600ms debounce
- 停止操作 600ms 后才触发唯一一次保存
- 期间只更新本地 draft，不触发任何 invalidate

### 4. saveVersion 竞态保护
- 每次 debouncedSave 递增 saveVersion
- 定时器回调检查 version 是否匹配，不匹配则跳过
- clearDraftIfMatch 只清除匹配值，不误清更新 draft

### 5. 保存失败保护
- 失败不回滚 draft，UI 继续显示用户最新输入
- 点击失败状态可重试（retrySave 使用最新 draft）

### 6. +/- 按钮 debounce
- 与滚轮相同的 draft accumulation + debounce 策略
- 连续点击不每次立即保存

## 验收标准
- [x] 滚轮连续调整流畅，不卡顿
- [x] 滚轮每次调整 1 分钟
- [x] 连续滚 20 次，最终值 +20（不是 +1）
- [x] 停止滚动 600ms 后自动保存最终值
- [x] 保存次数远少于滚动次数（1-2 次）
- [x] 保存中继续滚动不被旧响应覆盖
- [x] 保存失败保留 draft，可重试
- [x] +/- 连续点击不卡顿
- [x] 直接输入仍可用
- [x] 保存状态不挤压布局
- [x] 手机端正常
- [x] 深色模式正常
- [x] eslint 0e, tsc 0e, vitest 全通过, build 通过
