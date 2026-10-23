# IMPLEMENTATION_PLAN: 习惯分钟滚轮连续输入

## 架构

```
用户操作 (wheel/click/input)
    │
    ▼
draftValuesRef.current[key] = newValue  ← 即时更新本地草稿
setDraftVersion(v => v + 1)             ← 触发 React 重渲染
    │
    ▼
debouncedSave(habitId, value, target)   ← 重置 600ms 定时器
    │
    ▼ (600ms 后)
setSaveStates('saving')
saveValue(habitId, value, target)
    │
    ▼ (成功)
clearDraftIfMatch(habitId, value)       ← 仅当 draft === savedValue
setSaveStates('saved')
invalidateLogs()                        ← 刷新 query 缓存
```

## 关键组件

### HabitCheckin (habit-checkin.tsx)
- `draftValuesRef`: `useRef<Record<string, number>>({})` — 本地草稿
- `draftVersion`: `useState(0)` — 触发重渲染
- `saveVersionRef`: `useRef<Record<string, number>>({})` — 竞态保护
- `debounceTimers`: `useRef` — debounce 定时器
- `wheelThrottle`: `useRef` — 80ms 节流

### HomeHabitsSummary (home-habits-summary.tsx)
- 相同的 draft/persist 分离架构

### 稳定回调策略
- `getLogForHabitRef` / `getLogRef`: 存储最新 `getLogForHabit` 函数引用
- `createWheelHandler` 仅依赖 `today`（一天不变）
- 回调内部通过 ref 读取最新值

## 数据流

### Wheel 事件
1. 80ms throttle 检查
2. 读取 baseValue = draftValuesRef[key] ?? persistedValue
3. newValue = max(0, baseValue + delta)
4. draftValuesRef[key] = newValue
5. setDraftVersion(v => v + 1)
6. debouncedSave(habitId, newValue, target)

### Display 解析
```ts
displayValue = draftValuesRef[key] ?? persistedValue
```

### Save 完成
```ts
if (draftValuesRef[key] === savedValue) {
  delete draftValuesRef[key]
}
// query 刷新后 persistedValue 更新，display 自动回退到 persistedValue
```

## 竞态保护

```ts
const version = ++saveVersionRef.current[habitId]
setTimeout(() => {
  if (saveVersionRef.current[habitId] !== version) return // 旧版本跳过
  // 执行保存...
}, 600)
```
