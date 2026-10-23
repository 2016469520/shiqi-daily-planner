# TEST_PLAN — 日历、专注、设置工作区优化

## 单元测试
- 紧迫度计算函数
- 专注状态机
- 统计纯函数
- 中文化映射

## Repository 测试
- difficulty + due_at CRUD
- focus session CRUD + active constraint
- 离线队列兼容新字段

## 组件测试
- 日历高密度渲染
- "还有N项"数量正确
- 任务详情面板编辑
- 专注计时器状态切换

## Playwright E2E
1. 大量日程不重叠
2. 点击任务打开详情
3. 中文界面遍历
4. 专注完整流程
5. 专注一级入口
6. 每日总结入口
7. 设置页布局
8. 手机端适配

## 视觉截图
- calendar-dense-week-desktop.png
- calendar-task-detail.png
- schedule-focus-workspace.png
- focus-page-running.png
- daily-review-entry.png
- settings-desktop-wide.png
- settings-mobile.png
- dark-mode-calendar-focus.png

## 检查项
- 浅色/深色模式
- 桌面/手机
- 控制台无新增错误
- Supabase + IndexedDB 双路径
