# 时栖 · UI/UX 重设计进度

> 用于中断恢复：只记录"已完成 / 进行中 / 待办 / 验证结果"，不重复记录计划本身（计划见 `UI_REDESIGN_PLAN.md`）。

## 时间安排

| 阶段 | 时间（Asia/Shanghai） | 状态 |
|---|---|---|
| A · 轻量准备 | 2026-10-21 17:23 | ✅ 完成 |
| B · 全面执行 | 2026-10-21 18:00 起 | ⏳ 待执行（已登记定时触发） |

## 阶段 A 产出（2026-10-21）

- [x] 确认技术栈与样式入口：Next 16.2.9 / React 19.2.4 / Tailwind v4 / `@base-ui/react`；唯一全局样式 `src/app/globals.css`
- [x] 盘点页面（12 个路由）与组件（15 组 ≈ 80 文件，`ui/` 31 个基础件）
- [x] 初判 8 项设计问题（层级靠边框、时段无语义色、圆角间距不统一、装饰渐变扩散、动效无规范、空/加载态不一、导航弱指示、浮窗与主界面语言割裂）
- [x] 三方向对比（Quiet Paper / Bento Timeline / Neon Grid），定为 **Bento Timeline 为主 + Quiet Paper 排版克制 + Neon 仅暗色点缀**
- [x] 设计系统要点草案（色彩/字号/间距/圆角/层级/组件/动效/可达性）
- [x] 6 个实施批次 + 验证方案 + 风险应对
- [x] 参考资源可达性确认：[UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) 可用（`npx ui-ux-pro-max-cli init`，需 Python 3，本项目已有内置 Python）；其 `search.py --design-system` 可在阶段 B 用于生成 habit tracker / planner 类目的配色与字体建议

## 阶段 B 待办（按批次）

- [x] 批次 1 · 地基：`globals.css` tokens 重写 + `ui/` 基础件统一（Button/Card/Input/Badge/Skeleton + tailwind-merge 字号组扩展）
- [x] 批次 2 · 导航骨架：sidebar（三组分组 + 3px 指示条）/ mobile-nav / schedule-header（今日概览卡）/ app-shell
- [x] 批次 3 · 核心页：schedule / calendar（月·周·日·分类）/ today
- [x] 批次 4 · 记录类：habits / reviews（月历·时间线·详情·表单）/ insights / focus
- [x] 批次 5 · 辅助页：countdowns / inbox / settings / login / widget + plans 弹窗族 + tag-manager + search + reminders
- [x] 批次 6 · 打磨：统一空状态/加载态、修「卡中卡」、月视图对比度、今日页空白带、设置页内容错位、insights 趋势图轨道
- [x] 产出 `docs/UI_DESIGN_SYSTEM.md`（token 表 + 组件用法 + 禁令）
- [ ] 重新打包 exe / apk，校验哈希，升版本、推送、发 Release

## 批次执行摘要（5 个并行子任务 + 主控整合）

| 批次 | 文件数 | 关键决策 |
|---|---|---|
| A 导航+日程 | 16（含新增 `schedule-empty-state.tsx`） | 侧栏三组分组；当前项 3px 主色条；概览卡带进度环；时段用 `period-rail` + `period-chip`；行去掉可见边框，hover 才出现层级 |
| B 日历+今日 | 11 | 月视图改 `gap-px + bg-border` 细线；今天用主色圆点 + ring；周/日时段用 8% 时段底（后收敛为纯 rail）；分类视图改 surface 卡 |
| C 记录类 | 14 | 习惯打卡合并为单 surface 容器 + 分隔行；保存状态改文字而非只靠 toast；复盘统计用分段条/小方块；统计图改低饱和主色 |
| D 弹窗族+倒数日 | 13 | 弹窗统一 `shadow-pop` + `text-section` 标题；表单字段分组；倒数日按剩余天数映射状态色；搜索筛选胶囊化 |
| E 浮窗+设置+登录 | 6 | 浮窗去掉紫青渐变外框与饱和描边，改 `bg-card + ring-border`；Tab 改主色实底；设置页分区导航加指示条；登录页去重渐变 |

## 主控整合修复（子任务之外）

1. **`tailwind-merge` 字号丢失**：自定义 `text-body/caption/micro` 被当作颜色类，与 `text-muted-foreground` 同处 `cn()` 时被删除。已在 `src/lib/utils.ts` 用 `extendTailwindMerge` 注册 font-size 组，实测共存与覆盖都正确。
2. **今日页空白带**：`DayView` 根节点 `h-full overflow-auto` 嵌入今日页后把后续内容顶出视口。新增可选 prop `embedded`（不自带滚动容器与日期头），今日页启用。
3. **卡中卡**：日视图分区已是卡片，任务行再套边框造成双层。任务行改无边框 + `hover:bg-surface-2`。
4. **时段底色过重**：周/日视图原本整块 8% 时段底 + 白卡产生"色块套白卡"，改为纯 `period-rail` 竖线 + 时段 chip。
5. **月视图对比度**：任务芯片 11px → 12px、`bg-muted/60` → `bg-surface-2`、完成态 `/60` → `/80`，格底改 `bg-card` 让网格线可见，今天 ring 提到 `/40`。
6. **设置页内容错位**：内容区 `mx-auto max-w-3xl` 在宽屏下被居中到远离分区导航，改为左对齐。
7. **统计页趋势图**：原本只有极淡的 `bg-muted` 柱，空数据日几乎不可见；改为整列轨道 + 主色实心/浅色分层，今天日期高亮。
8. **复盘连续天数行对比度**：`text-muted-foreground` → `text-foreground/70` + 主色图标。

## 验证记录

| 时间 | 项 | 结果 |
|---|---|---|
| 2026-10-21 17:25 | 阶段 A 范围自查（未修改任何 UI 代码） | ✅ 仅新增 docs |
| 2026-10-21 18:2x | `tsc --noEmit` | ✅ 0 error |
| 2026-10-21 18:2x | `eslint` | ✅ 0 error / 14 warning（均为既有 hook 依赖与编译器提示） |
| 2026-10-21 18:2x | `vitest run` | ✅ 18 文件 / 261 项全过 |
| 2026-10-21 18:2x | `build:static` + 全量截图（浅/深 × 10 路由 + 浮窗 + 375 移动端） | ✅ 无 console error，移动端 0 横向溢出 |
| 2026-10-21 23:2x | `playwright test`（生产构建） | ✅ 34/34 |
| 2026-10-21 23:2x | `desktop-render-check`（注入 bridge） | ✅ 4 路由全过 |
| 2026-10-21 23:2x | exe asar / APK 与 `out/` 哈希比对 | ✅ 逐文件一致 |

## 收尾轮（2026-10-21 23:xx）：把三条技术债清掉

1. **搜索筛选接入主流程**
   - 新增 `src/components/search/search-sheet.tsx`：桌面 Dialog / 手机 Drawer 包住已有的 `SearchFilter`
   - 日程页控制行加「搜索」按钮 + `Ctrl/Cmd+K` 快捷键；选中结果后关闭面板并打开事项详情
   - 这样 README 里写的"按关键词/标签/状态/优先级/日期范围搜索"才真正有入口（此前该组件零引用）
   - 实测 7/7：入口可见、面板打开、关键词命中、点结果进详情、快捷键、弹窗可关闭
2. **清掉最后两个原生弹窗**
   - `template-manager` 删除模板：`window.confirm` → 应用内 Dialog（含影响说明与 destructive 按钮）
   - `subtask-manager` 双击改名：`window.prompt` → 应用内 Dialog（回车保存、空标题不提交）
3. **时段样式收敛为唯一来源**
   - 新增 `src/lib/period-style.ts`（`PERIOD_ORDER` / `PERIOD_CLASS` / `PERIOD_CHIP_CLASS` / `PERIOD_DOT_CLASS` / `PERIOD_RAIL_CLASS`）
   - 替换 10 处各自维护的常量：`day-view` / `week-view` / `category-task-card` / `task-list-item` / `widget-task-form` / `template-manager` / `import-export-dialog` / `search-filter` / 日程页 / 统计页 / 浮窗页
   - 全仓已无 `const PERIODS` / `PERIOD_CLASS` / `PERIOD_TONES` 局部定义

## 遗留与后续方向

- 浮窗内「专注」页沿用品牌渐变环（`focus-ring.tsx` 未改），与外壳的克制风格是有意的对比；若要完全统一可去掉渐变。
- 非本月日期用 `text-muted-foreground/60`，对比度低于 4.5:1，属有意降饱和（可访问性权衡）。
- `recurrence-editor` 目前仍无页面引用（重复日程编辑器未接到编辑弹窗里）。
- 搜索面板的「清除全部」按钮在只有关键词时也出现，位置可再优化。



## 备注

- 阶段 A 严格未触碰 `src/**`、`electron/**` 与任何样式文件，避免高峰时段的大改动。
- 浮窗（`/widget`）宽度以 340px 为设计基准，阶段 B 先改浮窗再改主界面，防止窄宽溢出反复返工。
