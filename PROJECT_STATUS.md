# PROJECT_STATUS.md — 项目状态

## 当前阶段：角色资料卡 + 本地素材优先（2026-10-22 下午）

本轮做的事（针对"角色像模板头像"的返工）：
1. 新增**本地角色包**（模式 A）：characters/角色名/manifest.json + ull_body/half_body/portrait/preview + 状态图；
   设置页「导入角色包」选文件夹即导入，独立 IndexedDB 	imegrid-character-packs，
   展示图回退链 full_body > half_body > portrait > preview > 包里最大图
2. 角色卡从"头像 + 名字"改为**资料卡**：主视觉占 3/4、作品丝带、标签、收藏、选中态、本地素材角标
3. 新增**角色详情弹窗**：大图、简介、推荐主题/场景/配色、设为陪伴、替换图片、删除素材包
4. 内置立绘按**作品分系列重绘**（一人之下=国漫水墨、虹猫蓝兔=武侠、机甲系=硬边几何、果宝=高饱和），
   每个角色独立构图，不再共用头身模板
5. 补齐 霹雳火 / 猪猪侠 的推荐位（待导入，不虚报已安装）

## 当前阶段：沉浸/纯净模式 + 自定义素材（2026-10-22 凌晨）

## 验证状态：2026-10-22 02:1x

| 检查项 | 结果 |
|--------|------|
| tsc / eslint | ✅ 0 error / 15 warning |
| vitest | ✅ 21 文件 / 312 项 |
| 主题专项 / 氛围专项 | ✅ 36/36 / 角色反馈 7/7 |
| 首页主视觉 + 纯净模式 | ✅ 10/10 |
| 自定义素材导入 | ✅ 4/4（0 运行时错误） |

本轮交付：
1. 沉浸 / 纯净双模式，侧栏一键切换（纯模式隐藏角色、压暗背景、停动画，保留配色）
2. 角色系统：内置 3 角色 + 自定义多表情包（文件名绑定状态、groupId 分组）、尺寸/位置/不透明度/自动状态/表情动画/欢迎语
3. 背景系统：内置 18 场景 + 自定义壁纸、可见度/模糊/压暗/遮罩/色相/亮度
4. 首页主视觉 Hero：场景 + 角色 + 问候 + 每日一句组成一张卡（纯净模式自动隐藏）
5. 素材接口与约定文档 docs/ATMOSPHERE_PACKS.md（导入、命名、存储、降级）
6. 低性能自动降级（掉帧/弱设备 → data-perf=low，停粒子与模糊）
7. 彩蛋：点角色随机换表情与台词、1.5s 连点三次撒彩带、暗格按时间段换场景

## 当前阶段：六套主题 + 沉浸氛围（2026-10-22 凌晨）
## 验证状态：2026-10-22 01:3x

| 检查项 | 结果 |
|--------|------|
| tsc / eslint | ✅ 0 error / 16 warning |
| vitest | ✅ 22 文件 / 317 项（主题 18 + 氛围 20 + 像素美术契约 5） |
| playwright e2e（生产构建） | ✅ 34/34 |
| 主题专项 | ✅ 36/36，圆角链路 3/3，细节 0 problems |
| 氛围专项 | ✅ 6 主题背景/角色 + 角色真实反馈 7/7 + 18 张场景画廊 |
| 全页扫查 | ✅ 6 主题 × 6 页面，移动端 0 溢出 |

本轮交付（沉浸氛围）：
1. 18 张原创 SVG 场景（六套主题各 3 张）+ 3 个原创角色（小葵 6 态 / NOVA 5 态 / PIX 5 态）
2. 每日开场页（仅首页、每天一次）、角色陪伴 dock（真实事件驱动表情与台词）、完成任务轻量庆祝
3. 每日一句（48 条，含 5 条公有领域古籍）+ 自定义短句 + 换一句
4. 设置页「沉浸氛围」面板：场景切换/随机轮换/角色开关/短句开关/背景可见度与模糊/三个效果开关/恢复默认
5. 素材清单与许可记录：docs/ATMOSPHERE_ASSETS.md（全部原创，无第三方素材）

## 当前阶段：六套主题 + 高级个性化（2026-10-22 凌晨）
## 验证状态：2026-10-22 00:4x

| 检查项 | 结果 |
|--------|------|
| tsc / eslint | ✅ 0 error / 14 warning |
| vitest | ✅ 20 文件 / 292 项（含 18 项主题系统测试） |
| playwright e2e（生产构建） | ✅ 34/34 |
| 主题专项（smoke/theme-verify.mjs） | ✅ 36/36 |
| 主题细节 + 圆角链路 | ✅ 0 problems / 3 项通过 |
| 全页扫查（6 主题 × 6 页面 + 移动端） | ✅ 0 运行时错误、0 横向溢出 |
| 带数据截图对比度 | ✅ 6 主题 5.12–9.46:1 |

本阶段交付：
1. 六套独立主题（云母/樱色/霓虹终端/留白/像素机/暗格），差异覆盖配色、标题字形、圆角、边框、阴影、底纹、导航选中态与动效节奏
2. 设置 →「外观与个性化」：真实变量渲染的预览卡、一键切换、明暗、强调色、四类圆角、界面缩放、字体、字号、动画强度、预设、恢复、导入导出
3. 每套主题独立保存个性化参数；坏配置回退默认；首帧前脚本消除主题闪烁
4. 修复两处架构性问题：@theme inline 导致圆角工具类无法运行时覆盖；Button 的 min(var(--radius-md),12px) 截断（同时让樱色胶囊失效）

详细验收见 docs/UI_THEME_TEST_REPORT.md。

## 当前阶段：重复日程功能补全（2026-10-21 深夜）
## 验证状态：2026-10-21 23:5x

| 检查项 | 结果 |
|--------|------|
| tsc / eslint | ✅ 0 error / 14 warning（回到改动前水位） |
| vitest | ✅ 19 文件 / 274 项（新增 13 项重复规则测试） |
| 重复功能浏览器回归 | ✅ 7/7（设规则 → 落库 → 完成 → 生成下周三实例） |
| 生产构建 + e2e | 见下方最终记录 |

本阶段做的事：
1. 发现重复功能整条链路未实现（规则只存不用），先补行为：新增 src/lib/tasks/task-completion.ts，完成时按规则生成下一次实例，实例用 ecurrence_parent_id 指回系列根
2. 把重复规则编辑器接进事项编辑弹窗（zod schema + 表单字段 + 落库）
3. 5 处"标记完成"统一走 setTaskCompletion（日程行、日视图、月历清单、事项详情、桌面浮窗）
4. 修 UX：选「每周」默认落在任务当天的星期几，而不是写死周一

## 当前阶段：重设计收尾（搜索入口 / 原生弹窗 / 时段样式收敛）(2026-10-21)
## 验证状态：2026-10-21 23:xx

| 检查项 | 结果 |
|--------|------|
| tsc / eslint / vitest | ✅ 0 error / 0 error / 261 项 |
| Playwright e2e（生产构建） | ✅ 34/34 |
| 搜索入口专项回归 | ✅ 7/7（入口、面板、关键词命中、点结果进详情、Ctrl+K、删除确认弹窗、取消关闭） |
| desktop-render-check | ✅ 4 路由无白屏 |
| exe asar / APK 哈希 | ✅ 与 out/ 逐文件一致 |

本阶段改动：
1. 搜索筛选接入主流程（search-sheet.tsx + 日程页「搜索」按钮 + Ctrl+K），此前该组件零引用
2. 	emplate-manager 删除模板、subtask-manager 双击改名改用应用内 Dialog，仓库内已无 window.confirm/prompt
3. 新增 src/lib/period-style.ts，把 10 处重复的时段常量收敛为唯一来源

## 当前阶段：UI/UX 全面重设计（Bento Timeline）(2026-10-21)
## 验证状态：2026-10-21（最新）

| 检查项 | 结果 |
|--------|------|
| TypeScript (tsc --noEmit) | ✅ 0 error |
| ESLint | ✅ 0 error / 14 warning（均为既有 hook 依赖与编译器提示） |
| Vitest | ✅ 18 文件 / 261 项全过 |
| Playwright e2e | ✅ 34/34（生产构建下 11.5s，无 flake） |
| 静态导出 | ✅ 通过 |
| 桌面分支防白屏检查 | ✅ 注入 bridge 后 /schedule /settings /widget /focus 均正常 |
| 截图矩阵 | ✅ 10 路由 × 浅/深 + 浮窗 × 浅/深 + 375 移动端，无 console error、0 横向溢出 |
| data-testid | ✅ 基线 25 个全部保留（新增 1 个 habit-checkin-toggle） |

## 🎨 本次变更 (2026-10-21)

### 设计语言：Bento Timeline（模块化 + 时间色）
- 三方向对比后选定：Quiet Paper（扫视效率）/ **Bento Timeline（模块 + 时段色）** / Neon Grid（未来科技）。
  选 B 的理由：把"一天切成上午/下午/晚上三个格子"这一产品心智直接色彩化，是别家日历没有的视觉资产；
  吸收 Quiet Paper 的字号与留白纪律；霓虹只保留在暗色专注区。
- 文档：`docs/UI_REDESIGN_PLAN.md`（方案与批次）、`docs/UI_DESIGN_SYSTEM.md`（token 与组件契约）、`docs/UI_REDESIGN_PROGRESS.md`（进度与验证）

### 设计系统（`globals.css` + `lib/utils.ts`）
- 色彩：靛紫主色 + 语义表面层（`surface / surface-2 / border / border-strong`）+ 状态色（success/warning/info/destructive），浅深两套 oklch
- **时段语义色**：`--period-morning/afternoon/evening` + `p-*` / `period-chip` / `period-dot` / `period-bar` / `period-rail`
- 排版六档 `text-display/title/section/body/caption/micro`；圆角四档（6/8/12/16/999）；阴影三档（card/float/pop）
- 动效 140/200/280ms + 统一缓动；全局尊重 `prefers-reduced-motion`
- 基础件统一：Button / Card / Input / Badge / Skeleton

### 页面改造（5 个并行批次，共 60 个文件）
- 导航：侧栏按「主流程 / 记录 / 系统」分组 + 3px 主色指示条；移动端底部导航加顶部指示
- 日程：今日概览卡（进度环 + 进度条 + 延期 + 专注 + 最近一项）；时段分组用 `period-rail` + `period-chip`
- 日历：月视图细网格 + 今天圆点/描边；周视图三时段行；日视图分区；分类视图 surface 卡
- 今日：问候 + 完成度主卡 + 三段清单（复用 DayView 的 embedded 模式）
- 记录类：习惯打卡合并单卡 + 保存状态文字化；复盘统计分段条；统计图重做轨道与主色分层
- 辅助：任务弹窗族统一分组与 `shadow-pop`；倒数日状态色；搜索筛选胶囊化；浮窗去掉渐变外框改克制描边

### 主控整合修复
1. `tailwind-merge` 把自定义字号当颜色类 → 注册 font-size 组，修复全局字号被吞
2. 今日页 `DayView` `h-full` 导致的空白带 → 新增 `embedded` 可选 prop
3. 「卡中卡」双层边框 → 任务行改无边框 + hover 层级
4. 时段底色过重 → 只保留 rail 竖线
5. 月视图芯片对比度与网格可见性
6. 设置页内容区居中错位 → 左对齐
7. 统计页趋势图空数据不可见 → 整列轨道
8. 复盘连续天数行对比度

## 当前阶段：紧急修复 0.3.1 白屏（React #185）(2026-10-21)

## 验证状态：2026-10-21（最新）

| 检查项 | 结果 |
|--------|------|
| TypeScript (tsc --noEmit) | ✅ 通过 |
| ESLint | ✅ 0 error / 15 warning |
| Vitest (261 tests) | ✅ 全部通过（新增桌面桥快照稳定性 3 项） |
| 注入桌面 bridge 的全路由渲染 | ✅ /schedule /settings /widget /focus 均正常，无 #185 |
| 便携 exe | ✅ 96.3MB，asar 与 out/ 逐文件哈希一致 |
| 安卓 apk | ✅ 5.7MB，assets 与 out/ 逐文件哈希一致 |

## 🔥 事故记录：0.3.1 打开就白屏

- **现象**：双击 exe 后窗口打开但什么都没有（用户描述"软件崩了，打不开"）
- **根因**：`DesktopWidgetControl` 用 `useSyncExternalStore` 读取桌面 bridge，而 `getDesktopBridge()` 每次调用都返回**新对象**。
  React 用 `Object.is` 比较快照，判定"一直在变"，触发无限重渲染 → `Minified React error #185`（Maximum update depth exceeded）→ 整棵树卸载 → 白屏
- **为什么测试没抓到**：浏览器里没有 `window.timegrid`，快照恒为 `null`，`Object.is(null, null)` 成立，所以网页版和之前所有浏览器回归都正常。这是"只在打包装里才出现"的分支
- **修复**：
  1. `getDesktopBridge()` 缓存包装对象，保证引用稳定
  2. 新增回归测试 `desktop-bridge-stability.test.ts`（重复调用必须返回同一引用）
  3. 新增 `smoke/desktop-render-check.mjs`：**注入假 bridge**，让桌面分支在无头浏览器里真正跑起来，逐路由检查是否白屏或出现 #185
  4. 新增 `src/app/global-error.tsx`：渲染出错时显示可操作的错误页（含"重新加载"），而不是白窗口
  5. Electron 主进程加 `crash.log`（`uncaughtException` / `unhandledRejection` / `render-process-gone`），浮窗与托盘的创建包在 try/catch 里，失败也不影响主窗口

## 当前阶段：浮窗可找回 + 浮窗内新建/编辑 (2026-10-21)

## 验证状态：2026-10-21（最新）

| 检查项 | 结果 |
|--------|------|
| TypeScript (tsc --noEmit) | ✅ 通过 |
| ESLint | ✅ 0 error / 15 warning |
| Vitest (258 tests) | ✅ 全部通过 |
| 静态导出 | ✅ 通过 |
| 浮窗新建/编辑回归 | ✅ 12/12（加号提交、详细表单、编辑、完成、删除、主窗口同步） |
| 专注/浮窗回归 | ✅ 13/13 + 8/8 |
| 便携 exe | ✅ 96.3MB，asar 与 out/ 逐文件哈希一致，含新 preload |
| 安卓 apk | ✅ 5.7MB，assets 与 out/ 逐文件哈希一致 |

## 🔧 本次变更 (2026-10-21)

### 现场排查（依据用户机器上的 window-state.json）
`{"widget":{"visible":true,"pinned":false,"x":1707,"y":32,"width":351,"height":339}}`
→ 浮窗确实创建过、也被缩放过，但**顶针被关掉后落到了其它窗口后面**，而主界面没有任何入口可以重新唤出它。

### 修复
1. **主界面加「桌面浮窗」开关**：侧边栏底部（显示中 / 已隐藏 状态标签）+ 设置 → 外观 卡片；只在 Electron 里出现（用 `useSyncExternalStore` 读取 bridge，避免水合不一致）
2. **浮窗永不"消失"**：`ensureWidgetVisible()` 会校验坐标是否还在某个显示器内，跑出屏幕就拉回默认位置；重新显示时恢复置顶
3. **首次显示更可靠**：无边框窗口在部分显卡上 `ready-to-show` 不触发，改为 `did-finish-load` + 2.5s 兜底定时器 + `showInactive()`
4. **去掉 `transparent: true`**：透明无边框窗口在 Windows 上偶发不可见/黑块，改为不透明窗口并让页面铺满，圆角交给 Win11
5. **浮窗加号可提交**：`+` 从装饰图标改成真正的提交按钮（`type="submit"`）
6. **浮窗支持完整新建**：右侧「新建」打开表单面板，可选时段 / 标签 / 起止时间
7. **浮窗支持编辑**：点击任意事项打开同一套表单，可改标题/时段/标签/时间，并新增「标记完成」「删除」
8. **浮窗铺满窗口**：去掉 6px 内边距与渐变外框，避免无边框窗口四角露出背景色

### 新增 IPC
`widget:show`（无条件唤起）、`widget:is-visible`（查询可见性），preload 增加 `showWidget` / `isWidgetVisible`

### 修改文件（本次会话）
- 新增：`src/components/widget/widget-task-form.tsx`、`src/components/layout/desktop-widget-control.tsx`
- 调整：`src/app/widget/page.tsx`（重建/编辑面板）、`src/components/layout/desktop-sidebar.tsx`、`src/app/settings/page.tsx`、`src/lib/desktop-bridge.ts`、`electron/main.cjs`、`electron/preload.cjs`、`package.json`（0.3.1）、README

## 当前阶段：专注重做 + 浮窗改版 + 二次元视觉 (2026-10-21)

## 验证状态：2026-10-21（最新）

| 检查项 | 结果 |
|--------|------|
| TypeScript (tsc --noEmit) | ✅ 通过 |
| ESLint | ✅ 0 error / 15 warning |
| Vitest (258 tests) | ✅ 全部通过（新增专注核心 11 项） |
| 静态导出 | ✅ 通过 |
| 专注/浮窗浏览器回归 | ✅ 13/13 |
| 便携 exe | ✅ 96.3MB，asar 与 out/ 逐文件哈希一致 |
| 安卓 apk | ✅ 5.7MB，assets 与 out/ 逐文件哈希一致 |

## 🔧 本次变更 (2026-10-21)

### 专注功能重做
1. **时长改成 1 分钟粒度**：`− / +` 单次 ±1，按住自动加速（间隔从 380ms 递减到 55ms），Shift 点击一次 ±5；滚轮 ±1；滑块 `step=1`
2. **预设值**：5 / 15 / 25 / 45 / 60 / 90，点一下即选中
3. **倒计时运行中可加时**：`+1` 分钟按钮，`useFocus.extend()` 只改 `planned_minutes`，剩余时间按已流逝时间重算，刷新后依然一致
4. **正计时可设目标**：15 / 25 / 45 / 60 分钟；目标存在 `planned_minutes` 里，跨窗口/刷新不丢；进度环随专注填充，超出目标切换桃红配色并显示 `+MM:SS`
5. **逻辑抽成纯函数**（`src/lib/focus/focus-core.ts`）：`formatClock`、`clampMinutes`、`adjustMinutes`、`countdownProgress`、`stopwatchProgress`、`overtimeLabel`，共 11 个单元测试
6. **环形进度组件** `FocusRing`：紫→青渐变描边 + 外发光，未知进度时呼吸态

### 浮窗改版
7. **两个标签页**：清单 / 专注；专注页直接复用 `HomeFocusTimer variant="widget"`，浮窗里就能开番茄钟
8. **视觉重做**：渐变描边容器、紫青柔光底、迷你完成度圆环、渐变勾选按钮、按时段分组的深链接行、空状态插画式图标
9. **专注跨窗口同步**：`useFocus` 在开始/暂停/继续/结束/完成时广播 `focus` 事件，另一窗口只失效 `focus/active` 与 `focus/stats`

### 视觉风格
10. `globals.css` 新增一组克制的二次元装饰类：`.acg-surface`（紫青柔光，深浅色分别调强度）、`.acg-frame`（1px 渐变描边）、`.acg-shadow`、`.acg-pill`、`.acg-breathe`、`.acg-ring-glow`
11. 应用范围刻意收敛：专注卡片、浮窗、专注页统计卡片与趋势柱状图；日程/日历等主界面保持原样，避免影响可读性
12. `ui/slider.tsx` 支持传入 `trackClassName / indicatorClassName / thumbClassName`，专注区滑块改用渐变配色

### 修改文件（本次会话）
- 新增：`src/lib/focus/focus-core.ts`、`src/components/focus/focus-ring.tsx`、`src/__tests__/unit/focus-core.test.ts`
- 重写：`src/components/focus/focus-timer.tsx`、`src/app/widget/page.tsx`
- 调整：`src/hooks/use-focus.ts`（extend + 广播）、`src/hooks/use-cross-window-sync.ts`、`src/lib/widget-sync.ts`、`src/components/ui/slider.tsx`、`src/app/globals.css`、`src/app/focus/page.tsx`、`package.json`（0.3.0）、README

## 当前阶段：更名「时格」+ 桌面常驻浮窗 (2026-10-21)

## 验证状态：2026-10-21（最新）

| 检查项 | 结果 |
|--------|------|
| TypeScript (tsc --noEmit) | ✅ 通过 |
| ESLint | ✅ 0 error / 15 warning |
| Vitest (247 tests) | ✅ 全部通过（新增桌面桥 3 项） |
| 静态导出 | ✅ 通过，新增 `/widget` 路由，out/ 210 个文件 |
| 浮窗浏览器回归 | ✅ 8/8（渲染、无侧边栏、新增、勾选、双向跨窗口同步） |
| 便携 exe | ✅ 96.3MB，asar 与 out/ 逐文件哈希一致，含 preload 与浮窗页面 |
| 安卓 apk | ✅ 5.7MB，assets 与 out/ 逐文件哈希一致 |

## 🔧 本次变更 (2026-10-21)

### 更名
- 产品名由「我的计划日历」改为 **「时格」**（TimeGrid）：把一天切成上午/下午/晚上三个格子来安排
- 同步更新：`APP_NAME`/`APP_DESCRIPTION`、PWA manifest、Electron 窗口标题与托盘提示、`productName` 与产物名（`TimeGrid-*`）、Capacitor appName、安卓 `strings.xml` 应用名、README
- **`appId` / `applicationId` 保持不变**（`app.local.plancalendar`）：改了会被安卓当成新应用，旧数据无法升级
- IndexedDB 数据库名未变，已装旧版的数据仍在

### 桌面浮窗（Electron）
1. `src/app/widget/page.tsx`：340×460 的今日清单，含进度条、快速添加、按时段分组、勾选完成、置顶/打开主窗口/关闭按钮
2. `electron/main.cjs`：
   - 第二个无边框窗口（`frame: false` + `transparent`）加载 `/widget/`，`alwaysOnTop` 默认开启，`skipTaskbar` 不占任务栏
   - 浮窗与主窗口的位置、尺寸、可见性、置顶状态分别持久化到 `window-state.json`
   - **关系变成托盘常驻**：关闭主窗口 = 收起，关闭浮窗 = 隐藏，应用仍在托盘；退出走托盘菜单或主菜单「文件 → 退出」
   - 托盘图标（`electron/assets/app.ico`）菜单：打开时格 / 显示或隐藏浮窗 / 浮窗置顶 / 退出
3. `electron/preload.cjs`：`contextBridge` 只暴露 6 个方法（隐藏浮窗、切换浮窗、开主窗口、切置顶、查置顶、退出），渲染进程无 Node 权限
4. 跨窗口同步：`src/lib/widget-sync.ts` 用 BroadcastChannel 广播；IndexedDB 仓储层在任务写入后发通知，`useCrossWindowSync` 收到后只失效相关查询
5. `AppShell` 对 `/widget` 路径跳过侧边栏、底部导航与登录跳转；`globals.css` 增加拖拽区（`-webkit-app-region`）与浮窗透明背景规则

### 修改文件（本次会话）
- 新增：`src/app/widget/page.tsx`、`src/lib/desktop-bridge.ts`、`src/lib/widget-sync.ts`、`src/hooks/use-cross-window-sync.ts`、`electron/preload.cjs`、`electron/assets/app.ico`、`src/__tests__/unit/desktop-bridge.test.ts`
- 调整：`electron/main.cjs`（浮窗 + 托盘）、`src/components/layout/app-shell.tsx`、`src/lib/repositories/indexeddb-impl.ts`、`src/lib/constants.ts`、`src/app/globals.css`、`public/manifest.json`、`electron-builder.yml`、`capacitor.config.ts`、`android/app/src/main/res/values/strings.xml`、`package.json`（0.2.0）、README

## 当前阶段：本地优先打包（Windows exe + Android apk）(2026-10-21)

## 验证状态：2026-10-21（最新）

| 检查项 | 结果 |
|--------|------|
| TypeScript (tsc --noEmit) | ✅ 通过 |
| ESLint | ✅ 0 error / 15 warning（hook 依赖与编译器提示） |
| Vitest (244 tests) | ✅ 全部通过（新增备份 5 项、Electron 静态解析 7 项） |
| next build（网页版） | ✅ 通过 |
| next build（静态导出） | ✅ 通过，out/ 199 个文件 4MB |
| 静态产物浏览器回归 | ✅ 15/15（无登录页、全路由、刷新持久化、客户端跳转、0 HTTP 错误） |
| 备份/恢复浏览器回归 | ✅ 9/9（导出 → 恢复 → 补写 → 拒绝无效文件） |
| 便携 exe 产物 | ✅ 96MB，asar 4.07MB 与 out/ 逐文件哈希一致 |
| 安卓 apk 产物 | ✅ 5.3MB，assets 与 out/ 逐文件哈希一致，含自定义图标 |

> 说明：本机环境无法常驻 GUI 窗口（Electron 与记事本同样无法驻留），
> 因此 exe/apk 的「双击运行」需在真实桌面/手机上验证；
> 其内部前端资源、`app://` 解析逻辑、图标、配置均已通过哈希比对与单元测试校验。

## 🔧 本次变更 (2026-10-21)

### 定位：从「云端优先」转为「本地优先」
1. **新增 `src/lib/runtime.ts`**：`IS_LOCAL_ONLY` 构建开关。打包版注入 `NEXT_PUBLIC_LOCAL_ONLY=1` 后：
   - 启动即以本机身份进入应用，不出现登录页，不连接任何服务器
   - 隐藏退出登录、云端账户等入口；设置页显示数据保存在本机并引导备份
   - 不注册 Service Worker、不显示「离线模式」横幅（本地版本来就不依赖网络）
2. **静态导出**：`next.config.ts` 在 `BUILD_STATIC=1` 时输出 `output: 'export'` + `trailingSlash`，并跳过 `headers()`（静态托管不支持）

### 桌面端（Electron）
3. `electron/main.cjs`：`app://local` 自定义协议（standard + secure，保证 IndexedDB 持久化）、窗口尺寸记忆、单实例、外部链接走系统浏览器、中文菜单
4. `electron/serve.cjs`：纯函数静态解析（含目录穿越防护、`__next.x.__PAGE__.txt` 预取折叠），有单元测试
5. `electron-builder.yml`：Windows 便携版，排除 `node_modules`（前端已静态化，asar 从 166MB 降到 4MB）

### 安卓端（Capacitor）
6. `capacitor.config.ts` + `android/` 原生工程；WebView 来源 `https://localhost`，IndexedDB 稳定持久化
7. 自定义启动图标（各密度 `ic_launcher` / 圆角 / 自适应前景）
8. `android/gradle.properties` 增加 `android.overridePathCheck=true`（项目路径含中文时 AGP 默认拒绝构建）

### 数据可迁移性（本地优先的关键）
9. 新增 `src/lib/sync/backup.ts`：全量导出/恢复（事项、标签、习惯、打卡、评价、倒数日、模板、专注、偏好），恢复时重建 `tag_id`→新标签、`habit_id`→新习惯的引用，评价按日期 upsert 幂等
10. 设置 → 数据 → 「完整备份」面板：导出 JSON、选择文件恢复、恢复前预览条数

### 工程卫生
11. `.gitignore` 覆盖 `dist/`、`android/` 构建产物、`local.properties`
12. `eslint.config.mjs` 忽略 `dist/`、`android/`、`resources/`、`electron/`，避免把打包产物当源码检查

### 修改文件（本次会话）
- 新增：`src/lib/runtime.ts`、`src/lib/sync/backup.ts`、`src/components/plans/backup-panel.tsx`、`electron/main.cjs`、`electron/serve.cjs`、`electron-builder.yml`、`capacitor.config.ts`、`android/`、`resources/icon.ico`
- 新增测试：`src/__tests__/unit/backup.test.ts`、`src/__tests__/unit/electron-serve.test.ts`
- 调整：`next.config.ts`、`package.json`（脚本/main 字段）、`src/providers/auth-provider.tsx`、`src/app/login/page.tsx`、`src/app/settings/page.tsx`、`src/components/pwa/pwa-provider.tsx`、`src/app/insights/page.tsx`、`.gitignore`、`eslint.config.mjs`

## 当前阶段：可用性复查 + 时区缺陷修复 (2026-10-20)

## 验证状态：2026-10-20（最新）

| 检查项 | 结果 |
|--------|------|
| TypeScript (tsc --noEmit) | ✅ 通过 |
| ESLint | ✅ 0 error / 15 warning（均为 hook 依赖与编译器提示） |
| Vitest (232 tests) | ✅ 全部通过 |
| next build | ✅ 通过（14 条路由全部静态预渲染） |
| 浏览器回归（Chrome + Playwright） | ✅ 全路由无 console/page error，桌面与移动端均正常 |

## 🔧 本次变更 (2026-10-20)

### 新发现并修复的缺陷
1. **本地日期时区偏移（严重）**：全站用 `new Date().toISOString().slice(0, 10)` 取"今天"，在 UTC+8 的 00:00–08:00 会得到前一天
   - 影响：快速添加「明天」落到今天、编辑弹窗默认日期落到昨天并被判为延期、「移至明天」不生效、专注与统计按天归组错位、月度统计把相邻月份算进来
   - 修复：`date.ts` 新增 `toDateStr()` / `tomorrowStr()` / `thisWeekendStr()` / `nextWeekStr()` / `getCalendarMonthRange()`，并替换 schedule、focus、insights、任务编辑、模板、延期处理、两个 Repository 实现等 14 处调用
2. **收集箱页面永久为空**：页面调用 `getByDate(userId, 'inbox')`，实际查询 `task_date === 'inbox'`，永不命中
   - 修复：`TaskFilterOptions` 增加 `undatedOnly`（IndexedDB + Supabase 双实现），收集箱改为查询无日期事项，并补齐"快速记录"和"安排到今天/明天"
3. **Slider 范围失效**：`ui/slider.tsx` 解构了 `min/max/step` 但没有传给 `SliderPrimitive.Root`，专注时长滑块实际是 0–100 步长 1
   - 修复：透传三个属性；专注页滑块恢复 1–240、步长 5（浏览器实测 input `min=1 max=240 step=5`）

### 体验改进
4. **统计页从占位改为真实图表**：新增最近 7 天完成趋势、时段分布、标签分布、评价评分趋势（复用已有 `calculateTaskStats` / `calculateTagStats` / `calculateReviewStats`）
5. **跨天自动刷新**：新增 `useToday()` 钩子，替换日程/今日/统计/专注/习惯/每日总结中的 `todayStr()`，页面常驻整夜后次日自动切到新的一天
6. **无日期事项不再显示时段徽标**（收集箱里"晚上"标签会让人误以为已排期）
7. **清理未使用导入与死代码**：ESLint warning 从 91 降到 15，删除未被调用的 `setDraftValue`、`handleSaveAsTemplate`、分类视图的 4 个死 props 等

### 修改文件（本次会话）
- `src/lib/utils/date.ts` — 新增本地日期辅助函数
- `src/app/schedule/page.tsx`、`src/app/focus/page.tsx`、`src/app/insights/page.tsx`、`src/app/today/page.tsx`、`src/app/reviews/today/page.tsx`、`src/app/inbox/page.tsx` — 时区修复 / 钩子 / 收集箱重写 / 统计图表
- `src/lib/repositories/{interfaces,indexeddb-impl,supabase-impl}.ts` — `undatedOnly` 过滤 + 本地 today
- `src/components/schedule/{quick-add-task,overdue-section,upcoming-tasks,task-list-item,task-detail-panel}.tsx`
- `src/components/plans/{task-edit-dialog,template-manager,overdue-processor,import-export-dialog,recurrence-actions,recurrence-editor,subtask-manager}.tsx`
- `src/components/habits/{habit-checkin,home-habits-summary}.tsx`
- `src/components/ui/slider.tsx` — min/max/step 透传
- `src/hooks/use-today.ts`、`src/lib/utils/period.ts` — 新增
- `src/__tests__/unit/date-tz.test.ts` — 新增时区回归测试（7 组场景）
- `src/components/calendar/*`、`src/components/reviews/*`、`src/lib/constants.ts`、`src/lib/utils/{stats,countdown,offline-queue}.ts` — 时区修复与清理

## 当前阶段：代码审查修复 & 专注功能简化 (2026-07-10)

## 验证状态：2026-07-10（最新）

| 检查项 | 结果 |
|--------|------|
| TypeScript (tsc --noEmit) | ✅ 通过 |
| Vitest (225 tests) | ✅ 全部通过 |

## 🔧 本次变更 (2026-07-10)

### 代码审查修复（10 项发现全部修复）
1. **React Query 缓存作用域**：7 个组件的 queryKey 添加 `user?.id` 前缀，防止多用户缓存泄漏
2. **Supabase includeUndated 查询修复**：用 SQL `.or()` 替代 JS 后过滤，避免 LIMIT 截断导致数据丢失
3. **CSV 导出 null 修复**：`task.task_date \|\| ''` 防止导出 "null" 字符串
4. **导入 null 覆盖修复**：`task_date: item.task_date \|\| today` → `?? undefined`，保留 null 语义
5. **schedule 页 default 分支**：switch 添加 default case
6. **schedule 页 reset 修复**：切换 all 视图时 `setGroupBy('none')`
7. **Service Worker 缓存**：cache-control 正则添加 `no-cache`
8. **DEMO_USER_ID 导出**：auth-provider 导出常量，消除硬编码

### 专注功能简化 — 移除「不关联日程」
- **移除关联日程 Select**：专注计时器不再支持绑定具体任务
- **保留专注分类**：基于标签的分类选择仍然可用
- **移除文件**：`focus-timer.tsx` 删除 linkedTaskId state、todayTasks 查询、关联日程下拉
- **清理常量**：`display-labels.ts` 和 `constants.ts` 移除 `linkedTask`/`focusNone` 占位文本

### 修改文件（本次会话）
- `src/components/focus/focus-timer.tsx` — 移除关联日程功能
- `src/lib/display-labels.ts` — 移除 linkedTask 占位文本
- `src/lib/constants.ts` — 移除 focusNone 标签
- `src/components/calendar/day-view.tsx` — queryKey 作用域
- `src/components/calendar/category-view.tsx` — queryKey 作用域
- `src/app/today/page.tsx` — queryKey 作用域
- `src/app/insights/page.tsx` — queryKey 作用域
- `src/app/inbox/page.tsx` — queryKey 作用域
- `src/hooks/use-notifications.ts` — queryKey 作用域
- `src/components/focus/focus-timer.tsx` — queryKey 作用域（旧变更）
- `src/components/plans/import-export-dialog.tsx` — null 覆盖修复
- `src/lib/utils/import-export.ts` — CSV null 修复
- `src/lib/repositories/supabase-impl.ts` — includeUndated SQL 修复
- `src/app/schedule/page.tsx` — switch default + reset 修复
- `public/sw.js` — cache-control 正则修复
- `src/providers/auth-provider.tsx` — DEMO_USER_ID 导出 + 去重
- `src/providers/repo-provider.tsx` — 使用导出常量

### 真实问题根因
1. **draft 与 persisted 未分离**：`createWheelHandler` 每次滚轮事件都从 TanStack Query 缓存读取 `currentValue`（`getLogForHabit(habit.id)`），但 debounce 机制导致 `saveValue`（含 `invalidateLogs`）只在 400ms 后触发。快速滚动期间 query 缓存从不更新，每次滚轮读取相同的 `currentValue`，永远只能 +1
   - 例：从 0 连续滚 20 次 → 每次都读 0、+1、调用 `debouncedSave(1)` → 最终只保存了 1，不是 20
2. **每次滚轮触发状态更新**：之前 `setSaveStates('saving')` 在每次 `debouncedSave` 调用时立即执行，导致每 80ms 一次 React 重渲染
3. **无竞态保护**：保存响应可能覆盖更新的输入值

### 修复方案
1. **Draft/Persist 分离**：`draftValuesRef` (useRef) 存储本地草稿，wheel/click 即时更新；显示值 = draft ?? persisted
2. **稳定的 wheel handler**：`createWheelHandler` 仅依赖 `today`（一天不变），通过 ref 访问最新值，避免 listener 反复重建
3. **600ms debounce 保存**：停止操作 600ms 后才触发唯一一次保存
4. **saveVersion 竞态保护**：旧保存回调检测 version 不匹配自动跳过
5. **保存失败保护**：失败不回滚 draft，点击失败状态可重试
6. **+/- 按钮 debounce**：连续点击不每次立即保存

### 修改文件
- `src/components/habits/habit-checkin.tsx` — draft/persist 分离、竞态保护、稳定回调
- `src/components/habits/home-habits-summary.tsx` — 同上
- `src/__tests__/unit/habit-minute-stability.test.ts` — 新增 14 个测试（共 37 个）
- `DECISIONS.md` — 新增决策 63-69
- `docs/features/habit-number-wheel-input/SPEC.md` — 更新
- `docs/features/habit-number-wheel-input/IMPLEMENTATION_PLAN.md` — 新增
- `docs/features/habit-number-wheel-input/TEST_PLAN.md` — 新增
- `docs/features/habit-number-wheel-input/UI_ACCEPTANCE.md` — 新增
- `README.md` — 更新习惯输入说明

### 测试结果
- Vitest: 224 个测试全部通过（+14 新增 draft/persist/race condition 测试）

## 历史更新

### 🔧 习惯打卡交互修复 (2026-07-04 第三版)

### 习惯打卡交互修复
1. **按计量方式拆分 UI**：
   - `boolean`：完成/未完成勾选切换
   - `count`：+/- 1 按钮 + 直接输入次数
   - `minutes`/`duration`：快捷按钮（+5/+10/+15/+30）+ 直接输入分钟
   - `hours`：快捷按钮（+0.5/+1/+2）+ 直接输入小时
   - `numeric`：+/- 步进 + 直接输入数值 + 单位显示
2. **MeasurementType 扩展**：新增 `minutes` 和 `hours`，`duration` 保持为 `minutes` 的别名向后兼容
3. **首页习惯摘要**：根据计量方式显示不同控件，分钟型可快捷输入
4. **习惯记录编辑**：点击编辑按钮弹出 Dialog 修改值
5. **习惯记录删除**：点击删除按钮弹出确认 Dialog
6. **修改/删除后**：所有视图（首页、习惯页、统计）立即更新

### 倒数日编辑增强
- **首页倒数日卡片增加编辑按钮**：编辑标题、日期、颜色、每年重复、显示在首页等
- **首页增加归档按钮**：可快速归档/取消归档
- 编辑使用 Dialog 展示编辑表单
- 原有删除和置顶功能保留

### 快速新增日期选择器
- **增加日历 Popover**：点击日期按钮弹出日期选择器
- **快捷选项**：今天、明天、本周末、下周
- **日历输入**：支持原生 date input 选择任意日期
- **跨月跨年**：支持选择任意日期
- **中文日期显示**：选择后显示「2026年7月4日 周六」格式

### 快速新增 placeholder 策略
- **时段初始显示"选择时段"**：不再默认显示"上午"
- **难度初始显示"选择难度"**：不再默认显示"一般"
- **保存 fallback**：未选时段根据当前时间推断（6-12→上午, 12-18→下午, 18-6→晚上），未选难度默认 medium
- **向后兼容**：旧代码中的默认值逻辑不变，仅 UI 层面初始化改为空

### 专注时长交互增强
- **鼠标滚轮**：在时长区域 hover 时滚轮 ±5 分钟，范围 1-240
- **滑块**：@base-ui/react Slider，范围 1-240，步进 5，拖动实时更新
- **直接输入**：数字输入框，非法值（<1 或 >240）显示错误并在失焦时规范化
- **保留 +/- 5 按钮**：原有步进按钮保持

### 专注正计时（Stopwatch）
- **模式切换**：倒计时 | 正计时 切换按钮
- **倒计时**：设定目标时长（25/5/15/45 分钟预设 + 自定义），倒计时到 0 完成
- **正计时**：从 00:00 开始累计，手动完成，保存实际时长
- **状态机**：两种模式都支持 开始→暂停→继续→完成/放弃
- **刷新恢复**：基于时间戳（started_at, paused_at），刷新后正确恢复
- **统计**：completed 计入统计，cancelled 不计入
- **数据迁移**：008_focus_timer_mode.sql 添加 timer_mode 字段，默认 'countdown'

### 修改文件
- `src/types/index.ts` — MeasurementType 扩展，FocusSession 添加 timer_mode
- `src/lib/display-labels.ts` — MEASUREMENT_TYPE_LABELS 映射
- `src/components/habits/habit-checkin.tsx` — 按计量方式拆分打卡 UI + 编辑/删除
- `src/components/habits/home-habits-summary.tsx` — 首页不同类型不同控件 + 编辑/删除
- `src/app/habits/page.tsx` — 新建习惯增加 minutes/hours 选项
- `src/components/countdowns/home-countdowns.tsx` — 增加编辑/归档按钮和编辑 Dialog
- `src/components/schedule/quick-add-task.tsx` — 日历日期选择器 + placeholder 策略
- `src/components/ui/slider.tsx` — 新增 Slider 组件
- `src/components/focus/focus-timer.tsx` — 滚轮/滑块/输入 + 正计时模式
- `src/hooks/use-focus.ts` — 支持 stopwatch 状态机
- `supabase/migrations/008_focus_timer_mode.sql` — 新增 migration

### 新增测试
- `src/__tests__/unit/measurement-labels.test.ts` — 6 个测试（计量方式 + 时段 + 难度）
- `src/__tests__/unit/focus-timer-mode.test.ts` — 12 个测试（timer_mode + 统计 + 时间计算）

### 新增 Migration
- `008_focus_timer_mode.sql`：focus_sessions 表添加 timer_mode 字段
- **尚未应用到生产 Supabase**

## 历史更新

### 选择器显示修复
1. **标签 UUID → 标签名称**：所有 Select 的 SelectValue 现在通过 children/render 显示中文标签名，不再显示原始 value（UUID/enum）
2. **统一显示映射**：创建 `src/lib/display-labels.ts` 作为单一真相来源，constants.ts 重新导出
3. **SelectValue 根因**：@base-ui/react 的 SelectValue 不同于 Radix——placeholder 仅在空值时显示，选中后需显式提供 children 才能显示文本
4. **快速新增中文化**：四个控件依次显示：日期、时段（上午/下午/晚上）、标签（未分类/标签名）、难度（简单/一般/困难/极难）
5. **任务详情中文化**：状态（待办/进行中/已完成/已取消）、时段、难度、标签全部显示中文
6. **状态文案调整**：`todo` 从「未开始」改为「待办」
7. **task-edit-dialog**：优先级→难度、标签显示中文、状态显示中文
8. **习惯页**：计量方式选择器显示中文
9. **重复规则**：频率选择器显示中文

### 专注选择器重构
- **分离专注分类与关联日程**：两个独立 Select 控件
  - 专注分类：基于标签选择（学习/科研/工作等），用于专注统计归类
  - 关联日程：可选绑定具体任务
- 不再显示 `none`，改为「选择专注分类」和「不关联日程」
- 专注统计支持按标签分类

### 任务详情悬窗
- **TaskDetailPanel 重构**：从固定右侧面板改为居中浮层
  - 桌面端：Dialog（sm:max-w-lg, max-h-[88vh]）
  - 手机端：Drawer（max-h-[92vh]）
- 背景遮罩，点击遮罩/ESC 关闭
- 日历和日程页同时受益
- 不再贴屏幕右侧

### 修改文件
- `src/lib/display-labels.ts` — 新增统一显示映射
- `src/lib/constants.ts` — 重新导出，消除重复
- `src/components/schedule/task-detail-panel.tsx` — 重构为浮层
- `src/components/schedule/quick-add-task.tsx` — 中文化
- `src/components/focus/focus-timer.tsx` — 分离分类/任务
- `src/components/plans/task-edit-dialog.tsx` — 中文化
- `src/components/plans/recurrence-editor.tsx` — 中文化
- `src/components/calendar/day-view.tsx` — 中文化
- `src/app/calendar/page.tsx` — 浮层适配
- `src/app/schedule/page.tsx` — 浮层适配
- `src/app/habits/page.tsx` — 中文化

## 🆕 历史更新 (2026-07-04 第一版)

### 日历高密度布局优化
- 周视图每单元格限制显示 3 条任务，超出显示"还有 N 项"
- 添加 TaskListSheet 组件用于查看溢出任务
- 统一上午/下午/晚上行高，严格对齐 7 个日期列
- 小屏横向滚动，最小列宽 80px
- 时段标签 sticky 定位

### 日历任务详情交互
- 周视图/月视图点击任务卡片打开 TaskDetailPanel
- 完成按钮、拖拽手柄与详情打开正确分离
- 桌面端右侧面板，手机端全屏详情

### 全局中文化
- 统一显示映射：CALENDAR_VIEW_LABELS, WEEK_START_LABELS, DIFFICULTY_LABELS, URGENCY_LABELS, WEEKDAY_NAMES, FOCUS_MODE_LABELS
- 修复设置页、快速新增、专注计时器的中文显示
- 周视图日期头使用中文（周日-周六）

### 难度与自动紧迫度
- 新增 difficulty 字段（easy/medium/hard/very_hard），替换 priority 用户选择
- 新增 due_at 字段用于截止时间
- 紧迫度基于 due_at 自动计算：已逾期/紧急/较紧急/近期/时间充足
- Supabase migration 007：添加 difficulty + due_at 列及索引
- 旧 priority 字段保留为 legacy 兼容

### 专注升级为一级功能
- 左侧导航新增"专注"入口
- 新建 /focus 页面：计时器 + 今日/本周/月度统计 + 7天趋势图 + 历史记录
- 手机端导航新增专注入口

### 每日总结入口恢复
- 左侧导航新增"每日总结"
- /reviews/today 直接打开今日评价表单
- 页面提供"查看历史记录"入口

### 设置页重构
- 桌面端：二级导航侧栏 + 内容区布局，max-w-4xl
- 分区管理：外观、日历、专注、提醒、标签、数据、账户
- 宽屏卡片使用两列网格
- 手机端：横向滚动分区 tabs

### 新增文件
- src/app/focus/page.tsx — 专注完整页面
- src/app/reviews/today/page.tsx — 每日总结直达页
- src/components/calendar/task-list-sheet.tsx — 溢出任务列表
- src/lib/utils/urgency.ts — 紧迫度计算纯函数
- supabase/migrations/007_difficulty_due_at.sql

### 新增 Migration
- `007_difficulty_due_at.sql`：tasks 表添加 difficulty、due_at 字段
- **尚未应用到生产 Supabase**

## 历史更新 (2026-07-03)

### Bug 修复

1. **完成度可设为 0**：`ScoreSelect` 组件添加 `includeZero` 属性，完成度下拉包含 0%。修复了 `value?.toString() ?? ''` 改为 `value != null ? value.toString() : ''` 使 0 不在渲染时被当作空值。
2. **标签选择器显示修复**：全部 SelectItem 的 children 正确渲染为标签名称 + 色点，不显示源码或对象。
3. **Falsy-value 审计**：修复 `value.count || ''` 改为 `value.count != null ? value.count : ''`。

### 新功能：倒数日

- **数据表**：`countdowns`（migration 005）
- **Repository**：ICountdownRepository（Supabase + IndexedDB）
- **首页组件**：`HomeCountdowns` — 紧凑卡片展示，支持行内创建、置顶、归档
- **完整页面**：`/countdowns` — 列表/过滤/搜索/编辑/归档
- **日期计算**：支持每年重复、过期天数、今天特殊显示

### 新功能：专注

- **数据表**：`focus_sessions`（migration 006）
- **Repository**：IFocusSessionRepository（Supabase + IndexedDB）
- **状态机 Hook**：`useFocus` — 基于时间戳计时，支持刷新恢复
- **首页组件**：`HomeFocusTimer` — 预设时长、自定义时长、关联日程
- **日程联动**：专注完成后累计到任务 `actual_minutes`

### 习惯增强

- **推荐习惯**：运动、喝水、睡眠、阅读、早起（含模板 ID 幂等创建）
- **首页摘要**：`HomeHabitsSummary` — 布尔勾选 + 数值加减
- **统计准备**：首页显示今日完成率、每个习惯进度

### 首页整合

- **桌面端**：左侧日程主体 + 右侧辅助栏（专注/倒数日/习惯）
- **手机端**：日程下方嵌入三个组件
- **保持日程为主**：辅助区域可折叠，不抢占主体

## 🆕 任务中心改造 (2026-07-03)

### 核心变更

- **新默认首页** `/schedule` — 日程主页（原首页 `/` 从 `/calendar` 改为 `/schedule`）
- **导航重构**：日程 → 日历 → 习惯 → 复盘 → 统计 → 设置（桌面）/ 日程 → 日历 → 习惯 → 复盘 → 设置（手机 5 项）
- **日历降为辅助视图**：日历保留所有功能，但不再是登录后默认页面

### 日程主页

- **顶部概览**：时段问候、日期、已完成/总数、迷你进度环、延期提醒、最近事项
- **今日焦点**：自动突出紧急和高优先级事项（最多 3 项）
- **时段分区**：上午/下午/晚上三个区域，各有轻微氛围差异
- **延期处理**：独立区域，支持移到今天/明天
- **接下来**：明天、未来 7 天、更晚的分组预览
- **收集箱**：日程页面内嵌收集箱预览

### 快速新增（无弹窗）

- 页面顶部常驻行内输入：`+ 添加一项计划……`
- 点击/聚焦后在原位置展开可选字段（日期、时段、标签、优先级）
- Enter 保存、Esc 取消
- 不再使用大型 Dialog 创建任务

### 任务详情（减少弹窗）

- **桌面端**：点击任务在右侧打开固定详情面板，左侧列表保持可见
- **手机端**：全屏详情视图，左上角有关闭按钮
- 字段直接在面板中编辑：标题、状态、优先级、日期、时段、标签、预计用时、说明
- 自动保存（debounce 600ms），显示保存状态
- 删除保留确认按钮

### 视图切换

日程页面支持四种视图：**今天 | 近期 | 全部 | 按分类**

### 日历集成

- `/calendar` 页面桌面端使用相同的 TaskDetailPanel 侧边栏
- 手机端保留 TaskEditDialog 向后兼容

## 历史更新 (2026-07-03)

### 功能一：每日评价历史记录

- **新路由** `/reviews` — 复盘记录页面
- **月历模式**：按整月展示评价状态，点击日期查看/补写评价
- **时间线模式**：按日期倒序浏览历史评价，支持筛选（月份、评分、心情、仅有总结）
- **评价详情**：侧边抽屉展示完整评价，支持编辑、删除（需确认）、前后导航
- **本月摘要**：已评价天数、平均评分/完成度/心情、连续评价天数
- **导航入口**：桌面侧边栏"复盘记录"、今日页面"查看历史评价"、统计页面"查看全部评价"
- **复用 DailyReviewForm**：编辑历史评价不复制表单逻辑
- **空状态**：无评价时显示引导

### 功能二：按分类呈现日程

- **模式切换** "按时间 | 按分类"：在日历页面顶部切换
- **分类视图**：按标签分组，包含"未分类"区域
- **时间分桶**：每个分类内按 已延期/今天/未来7天/更晚/未安排/已完成 分组
- **分类头部**：标签名、颜色点、事项数量、完成率进度条、新建按钮、折叠
- **控制选项**：隐藏空分类、隐藏已完成事项
- **事项卡片**：标签色条、优先级图标+文字、状态标记、日期/时段、子任务进度
- **复用 TaskEditDialog**：编辑不创建第二套组件
- **新建预选标签**：在分类中点击新建自动预选该标签
- **跨分类移动**：每个事项卡片提供"移动到"菜单，支持选择目标分类或未分类

### 功能三：视觉与交互优化

- **今日欢迎区域**：根据时段显示问候语、日期、事项统计、最重要事项提示
- **今日进度条**：迷你完成率进度条
- **分类完成率进度条**：每个分类头部
- **事项卡片改进**：标签色条、层级优化、状态徽章
- **统一交互**：移动菜单、加载/空/错误状态、减少动态效果支持

## 历史验证状态：2026-07-02

| 检查项 | 结果 |
|--------|------|
| npm install | ✅ 通过 |
| ESLint | ✅ 0 errors, 34 warnings |
| TypeScript (tsc --noEmit) | ✅ 通过 |
| Vitest (118 tests) | ✅ 全部通过 |
| Next.js build | ✅ 通过 (8 routes) |

## 🔧 本次修复 (2026-07-02)

### 修复 1：新建日程按钮无响应

**根因**：`calendar-header.tsx` 中的「新建」按钮缺少 `onClick` 处理函数，且日历页面未集成 `TaskEditDialog` 组件。

**修复**：
- 为 `CalendarHeader` 添加 `onNewTask` prop
- 在日历页面添加 `TaskEditDialog` 状态管理和渲染
- 连接「新建」按钮的 `onClick` 到对话框打开
- 连接键盘快捷键 `N` 到对话框打开
- `TaskEditDialog` 默认日期使用当前日历选中日期

### 修复 2：标签删除功能完善

**修改文件**：`src/components/common/tag-manager.tsx`

**变更**：
- 移除 `is_default` 对删除按钮的限制，所有标签均可删除
- 删除前检查标签使用情况（统计关联事项数量）
- 未使用标签：显示简单确认对话框
- 已使用标签：提供三选一处理方案：
  1. **迁移**：将关联事项移到另一个标签，然后删除
  2. **清除关联**：保留事项但清除其标签引用，然后删除
  3. **取消**：放弃删除
- IndexedDB 和 Supabase 两种模式均保证操作一致性
- 清除关联模式先更新所有引用任务再删除标签

### 修复 3：默认标签重复问题

**根因分析**（多重原因）：

1. **Supabase 触发器**（`handle_new_user`）在注册时创建默认标签
2. **应用层** `setupNewUser()` 再次创建默认标签（虽有检查但非幂等）
3. **前端 Hook** `useInitializeDefaultTags()` 每次页面加载检查 `existing.length === 0`，React Strict Mode 导致 effect 执行两次
4. `tags` 表缺少 `(user_id, name)` 唯一约束
5. IndexedDB 无「标签已初始化」持久化标记
6. 多个并发请求可能同时通过「标签不存在」检查

**修复方案**：

1. **Supabase 层**（migration 004）：
   - 清理已存在的重复标签（保留最早创建的，迁移关联任务）
   - 规范化标签名称（去除首尾空格）
   - 添加唯一索引 `idx_tags_user_name_unique ON tags(user_id, lower(trim(name)))`
   
2. **前端 Hook** `useInitializeDefaultTags()`：
   - 使用 `useRef` 防止同会话内重复执行
   - 改为按名称检查（而非仅检查数量），使用 upsert 语义
   - 通过 `user_preferences.tags_initialized` 持久化标记，标记 set 后不再自动创建
   - 用户删除所有标签后不会自动恢复
   - 创建失败时静默跳过（不崩溃）

3. **IndexedDB 层**：
   - DB 版本升至 v2
   - 通过 `user_preferences.tags_initialized` 标记防止重复初始化
   - 用户删除标签后刷新不会恢复

### 新增 Migration

`supabase/migrations/004_tag_deduplication.sql`：
- 清理步骤：查找重复标签 → 保留最早 → 迁移关联任务 → 删除重复
- 唯一约束：`CREATE UNIQUE INDEX idx_tags_user_name_unique ON tags(user_id, lower(trim(name)))`
- 验证步骤：确认无重复残留

### 新增测试

- `src/__tests__/unit/tag-management.test.ts`（10 个测试）：
  - 新用户获得 8 个默认标签
  - 初始化执行两次不产生重复
  - 不同用户标签隔离
  - Ref guard 防止并发初始化
  - 删除所有标签后不会自动恢复
  - 删除未使用标签
  - 删除标签并迁移关联事项
  - 删除标签并清除事项关联
  - 允许删除默认标签

- E2E 测试增强（`e2e/tasks.spec.ts`）：
  - 点击「新建」按钮打开对话框
  - 创建事项流程
  - 取消创建
  - 键盘快捷键 N
  - 标签管理页面渲染
  - 创建和删除标签
  - 验证无重复默认标签

### 尚未应用到生产数据库

- Migration `004_tag_deduplication.sql` **尚未在 Supabase 生产项目执行**
- 需要在 Supabase SQL Editor 中手动运行或通过 Supabase CLI 应用
- 执行前建议备份数据

## ✅ 已完成功能（历史记录）

（完整列表见原 PROJECT_STATUS.md，此处不重复）

## 测试状态

| 类型 | 状态 |
|------|------|
| 单元测试 (date) | 6 passed ✅ |
| 单元测试 (recurrence) | 7 passed ✅ |
| Repository 测试 | 35 passed ✅ |
| 排序算法测试 | 16 passed ✅ |
| 统计测试 | 16 passed ✅ |
| 通知测试 | 18 passed ✅ |
| 标签管理测试 | 10 passed ✅ |
| E2E 测试 | 14 scenarios ✅ |

总计：**118 个单元测试全部通过**，**14 个 E2E 场景**

## 已知问题

1. 收集箱页面查询 `getByDate('inbox')` — IndexedDB 中 'inbox' 不是有效日期
2. 周视图中任务芯片不响应点击（无编辑/完成交互）
3. 统计页面缺少图表，仅展示基础数字
4. React Compiler 警告：RHF watch() 在 ScoreSelect 组件中使用
5. **Supabase 生产数据库 migration 004 尚未应用**（标签去重和唯一约束）
6. **Supabase 生产数据库 migration 007 尚未应用**（difficulty + due_at 字段）
7. **Supabase 生产数据库 migration 008 尚未应用**（focus_sessions.timer_mode 字段）
