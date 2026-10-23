# 时栖 · UI/UX 重设计计划

> 状态：**阶段 A 完成（2026-10-21 17:2x）**，阶段 B（实质改造）安排在北京时间 18:00 之后。
> 恢复入口见文末「阶段 B 恢复指令」。

---

## 1. 目标与边界

**目标**：在不改业务逻辑、不动数据层的前提下，把界面从"功能齐全但偏工具感"提升为「统一、克制、有辨识度」的个人计划工具。

**硬约束**
- 保留全部现有功能与数据流（Repository 层、React Query key、IndexedDB/Supabase 双实现不触碰）。
- 不引入新的 UI 框架（继续用 Tailwind v4 + `@base-ui/react` + `lucide-react`），不装 shadcn CLI 重刷组件。
- 桌面(exe)、安卓(apk)、网页三端共用同一套静态产物 → 所有改动必须在 375 / 768 / 1024 / 1440 与浮窗 280~640px 宽度下成立。
- 深色模式必须同步维护；对比度 ≥ 4.5:1。
- 每批改动后必须能通过 `npm run check` 与「注入桌面 bridge」的无头渲染检查（0.3.1 白屏事故的防线）。

---

## 2. 现状盘点

**技术栈**：Next.js 16.2.9（App Router，全静态导出）、React 19.2.4、Tailwind CSS v4（`@tailwindcss/postcss`）、`@base-ui/react` ^1.6、`lucide-react`、`next-themes`（浅色/深色/跟随系统）。

**样式入口**：仅 `src/app/globals.css`（约 200 行）。已定义 oklch 语义变量（`--background` / `--foreground` / `--primary` / `--muted` / `--border` 等）+ `@theme` 映射 + 少量 `acg-*` 装饰类（紫青柔光、渐变描边、呼吸动画）。

**页面（12）**：`schedule`（首页，今日清单）、`calendar`（月/周/日/分类）、`today`、`habits`、`insights`、`reviews`、`reviews/today`、`countdowns`、`focus`、`inbox`、`settings`、`login`、`widget`（桌面浮窗）。

**组件（15 组，约 80 个文件）**：`ui/`(31 基础件) `layout/`(5) `schedule/`(10) `calendar/`(9) `plans/`(8) `reviews/`(5) `habits/`(3) `focus/`(2) `common/` `countdowns/` `reminders/` `search/` `pwa/` `widget/`。

**观察到的设计问题（初判，阶段 B 需逐页确认）**
1. **层级靠边框堆叠**：卡片、列表项、分区几乎都用 `border` 区分，缺少"底色分层 + 留白"的层级手段，信息密度高时显得碎。
2. **语义色缺位**：时段（上午/下午/晚上）只有文字标签，没有色彩语义；优先级/状态色散落在各组件内联类里。
3. **圆角与间距不统一**：`rounded-lg/md/xl/2xl` 混用；间距多为一处一改的 `p-3/p-4`，缺 4pt 网格约束。
4. **装饰性渐变正在扩散**：`acg-*` 目前用于专注与浮窗，若继续外扩会变成"AI 生成感"；应把渐变收敛为**时段语义色**，而不是装饰。
5. **动效缺规范**：仅个别组件有 `transition-colors`，没有统一的时长/缓动，也没有 `prefers-reduced-motion` 处理。
6. **空状态/加载态风格不一**：有的用图标+两行文案，有的只有一句 `text-muted-foreground`。
7. **导航以文字列表为主**：侧边栏与底部导航缺少"当前页"的强指示与分组语义（主流程 / 记录 / 设置）。
8. **浮窗与主界面视觉同源但不完全同语言**：浮窗已有渐变描边与呼吸点，主界面没有，切换时有割裂感。

---

## 3. 三种设计方向对比

### 方向 A：Quiet Paper（纸感极简，参照 Things 3 / Bear）
- 手法：纸白底 + 墨色文字、单一强调色、极细分隔线、几乎不用阴影、大留白、严格字号阶梯。
- 优点：扫视效率最高、久看不累、实现成本低、与"每天多次打开"的工具属性最契合。
- 缺点：个性偏弱；对"创意/美感提升"的诉求回应不足；纯文字层级容易显得寡淡。

### 方向 B：Bento Timeline（模块 + 时间色，参照 Apple Bento / Linear / Arc）
- 手法：核心页做成模块化卡片网格（今日进度 / 待办 / 专注 / 倒数日），**用色相表达时段**（晨光琥珀 → 正午青 → 暮色靛紫），统一 8/12/16 圆角层级与 1px 描边，阴影只留给浮层与拖拽中元素。
- 优点：把"一天切成格子"的产品心智直接可视化；模块化天然适配响应式与浮窗；在克制与创意之间平衡；可增量落地（现有卡片组件已具备基础）。
- 缺点：需要重排 `schedule` 与 `insights` 的容器结构；时段色需要严格限定饱和度，否则易花。

### 方向 C：Neon Grid（未来科技暗色）
- 手法：深色为主、霓虹青紫、网格纹理、发光描边、扫描线动效。
- 优点：第一眼冲击强，演示效果好。
- 缺点：白天/强光环境可读性差；与"复盘、习惯养成"这类需要安静氛围的场景冲突；极易落入"过度渐变 + 发光边框"的 AI 味俗套。

### 选择：**以 B 为主，吸收 A 的排版克制，C 只在暗色模式少量吸收**

理由：
1. **产品定位优先**：这是高频效率工具，可读性 > 视觉冲击（A 的核心优势必须保留）。
2. **B 的"时间色"是本产品独有的视觉资产**：别家日历没有"上午/下午/晚上"三时段心智，把它做成色彩语言能形成辨识度，比抽象装饰更有意义。
3. **C 的风险不可控**：任务明确要求"避免过度渐变、无意义玻璃效果、过多发光边框"，C 的主手法正好是这些；仅保留"暗色模式下低强度发光"作为点缀。
4. **工程可行性**：B 可以在现有 tokens 与组件上加盖，不需要推翻架构，符合"不影响稳定性"的前提。

---

## 4. 设计系统要点（阶段 B 产出 `docs/UI_DESIGN_SYSTEM.md`）

- **色彩**：`background / surface / surface-2 / border / border-strong / text / text-muted / accent` 语义层；时段色 `--period-morning(琥珀) / --period-afternoon(青) / --period-evening(靛紫)`；状态色 `success / warn / danger / info`。全部写成 oklch 变量，浅深两套。
- **字体层级**：`display 28/32`、`title 20/28`、`section 15/22`、`body 14/22`、`caption 12/18`、`micro 11/16`；数字统一 `tabular-nums`；中文回退链保持系统字体。
- **间距/圆角**：4pt 网格（4/8/12/16/24/32）；圆角 6（小控件）/10（卡片）/14（浮层）/999（胶囊）四档，禁止再用其他值。
- **层级**：默认无阴影；卡片仅 1px 描边 + 底色差；浮层/拖拽元素才用 shadow。
- **组件规范**：Button（primary/secondary/ghost/danger × sm/md/lg，含 focus-visible ring）、Input/Select（统一高度 32/36、错误态红边 + 文案）、Card（标题/描述/内容三段式）、Segmented/Tabs、Badge/Chip（时段色语义）、EmptyState（图标+主文案+副文案+可选操作）、Skeleton（骨架屏统一圆角与节奏）。
- **动效**：交互反馈 120ms、展开/收起 180ms、页面级淡入 240ms，`ease-out`；全局尊重 `prefers-reduced-motion`。
- **可达性**：focus-visible 全覆盖、点击区 ≥ 32px（浮窗 ≥ 28px）、对比度 ≥ 4.5:1、图标按钮必有 `aria-label`。

---

## 5. 分批实施清单（阶段 B）

**批次 1 · 地基**（必须先做，后续全部依赖）
- `globals.css`：重写 tokens（含时段色）、字号/圆角/阴影工具类、动效变量、reduced-motion 支持。
- `ui/` 基础件：`button` `input` `card` `badge` `tabs` `select` `dialog` `skeleton` 统一到新规范（保持 props 兼容，不改调用方签名）。

**批次 2 · 导航骨架**
- `layout/desktop-sidebar`（分组 + 当前项强指示）、`layout/mobile-nav`、`schedule/schedule-header`、`app-shell`。

**批次 3 · 核心页**
- `schedule`（今日视图：模块化容器 + 时段色分组）、`calendar`（月/周/日视图头部与格子）、`today`。

**批次 4 · 记录类页**
- `habits`（打卡卡片）、`reviews`（月历/时间线）、`insights`（图表统一）、`focus`（专注卡片与统计）。

**批次 5 · 辅助页**
- `countdowns`、`inbox`、`settings`、`login`、`widget`（浮窗与主界面统一语言）。

**批次 6 · 打磨**
- 空状态/加载/错误一致化；375/768/1024/1440 断点与 125%/150% 缩放检查；暗色对比度逐页核对；`prefers-reduced-motion` 验证。

---

## 6. 验证方案（每批必跑）

1. `npx tsc --noEmit` + `npx eslint`（0 error）
2. `npx vitest run`（现有 261 项必须全绿）
3. `npm run build:static`
4. 无头浏览器截图矩阵：`/schedule` `/calendar` `/today` `/habits` `/insights` `/reviews` `/focus` `/countdowns` `/inbox` `/settings` `/widget` ×（浅色/深色）×（1440/1024/768/375）
5. `node ../smoke/desktop-render-check.mjs`（注入桌面 bridge，防 React #185 白屏回归）
6. 全部通过后 `npm run dist:win` + `cap sync android` + `gradlew assembleDebug`，校验 asar/APK 与 `out/` 逐文件哈希一致，升版本号、推送、发 Release。

---

## 7. 风险与应对

| 风险 | 应对 |
|---|---|
| 大面积改样式导致功能回归 | 只改 className 与容器结构，不动 props/hook/query；每批跑测试 |
| 时段色过饱和导致花 | 限定时段色仅用于 8% 底 + 100% 描边/文字，禁止大面积填充 |
| 浮窗窄宽度下溢出 | 浮窗单列布局，断点以 340px 为基准设计，先写浮窗再写主界面 |
| 暗色模式对比度不足 | 每个 token 在暗色下单独取值，截图核对，不用 `opacity` 凑 |
| 再次出现桌面专属白屏 | 每批跑 `desktop-render-check.mjs`（注入假 bridge） |

---

## 8. 阶段 B 恢复指令

> 18:00 后的第一次模型调用应当先读这三份文件，再动手：
> `docs/UI_REDESIGN_PLAN.md`、`docs/UI_REDESIGN_PROGRESS.md`、`git status`

```powershell
cd D:\DeepSeek\工作区\plan-calender
git status --short
# 若无未提交改动，直接开始批次 1；若有，先确认是否属于阶段 A/B 的中间态
npx tsc --noEmit ; npx vitest run --reporter=dot
```
