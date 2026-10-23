# 时栖 · UI 设计系统（v2，多主题版）

> **v2 变化**：v1 的 Bento Timeline 成为六套主题之一（云母为默认推荐），全部视觉由主题层驱动。
> 所有数值都在 `src/app/globals.css`（基础令牌）与 `src/styles/*.css`（主题层）中实现为变量或工具类。
> **改页面时只能引用令牌/工具类，不要新增硬编码颜色、圆角或阴影**——否则该处不会跟随主题切换。

## 0. 主题系统速查

| 层 | 位置 | 负责 |
|---|---|---|
| 基础令牌 | `src/app/globals.css` | 语义色、类型阶梯、时段色、默认圆角/阴影/动效 |
| 主题层 | `src/styles/themes.css` | 共享契约：类型倍率、标题变量、卡片/输入/导航变量、动效等级、装饰底纹、预览卡 |
| 单主题 | `src/styles/theme-<id>.css` | 该主题的调色板（浅/深）+ 结构签名规则 |
| 元数据 | `src/lib/theme/themes.ts` | 名称、描述、预览色、默认个性化、字体与动效选项 |
| 运行时 | `src/lib/theme/{apply,storage,store}.ts` | 个性化→CSS 变量、校验持久化、外部 store |
| 组件 | `src/providers/appearance-provider.tsx` | `useAppearance()`：主题、明暗、个性化、预设、导入导出 |

六套主题：`fluent` 云母（默认）/ `anime` 樱色 / `cyber` 霓虹终端 / `minimal` 留白 / `pixel` 像素机 / `bento` 暗格。
`cyber` 与 `bento` 只提供深色，切换时明暗按钮会禁用并给出说明。

**新增第七套主题**：在 `types.ts` 加 id → 加 `src/styles/theme-<id>.css`（照抄任一份的变量清单）→
在 `themes.ts` 加元数据 → 在 `themes.css` 加 `@import`。业务页面无需改动。

### 主题可用的结构变量（新增主题时必须写全）

```
--heading-font / --heading-weight / --heading-tracking / --heading-transform
--card-border-w / --card-border-color / --card-shadow / --card-inset-opacity / --card-bg-image
--radius / --radius-sm..4xl / --radius-input
--nav-active-bg / --nav-active-color
--deco-image / --deco-size / --deco-opacity
--input-bg / --focus-ring-w
--motion-fast / --motion-base / --motion-slow / --ease-standard
```

### 个性化覆盖（内联变量，优先级高于主题 CSS）

| 项 | 写入的变量 | 范围 |
|---|---|---|
| 强调色 | `--primary` `--primary-foreground` `--ring` `--sidebar-primary` `--chart-1` | hex；前景按亮度自动取深/浅 |
| 圆角 | `--radius-sm..4xl` `--radius-input` | 0–32px，四档独立 |
| 缩放 | `<html>` 的 `font-size` | 80–150%，靠根字号而非位图拉伸 |
| 字体 | `--font-sans` `--font-heading` | 5 种系统栈 |
| 字号 | `--type-scale`（正文）/ `--title-scale`（标题） | 0.85–1.2 / 0.85–1.25 |
| 动效 | `--motion-fast/base/slow` + `data-motion` | 关闭/低/标准/高 |

### 写页面时的三条硬规则

1. **不要写死颜色/圆角/阴影**：用 `bg-card`、`border-border`、`rounded-md`、`shadow-[var(--shadow-card)]` 等令牌。
2. **圆角只用 `rounded-*` 工具类**：`themes.css` 已把工具类重映射到 `--radius-*`，写 `rounded-[12px]` 会脱离个性化。
3. **装饰元素必须有意义**：主题专属装饰（HUD 角标、樱花发丝、像素光标）由主题层负责，页面不要自带渐变边框。

## 1. 风格定位

**Bento Timeline**：模块化卡片布局 + 时间色（上午/下午/晚上）+ 克制的排版。
吸收 Quiet Paper 的留白与字号纪律；霓虹/发光只在暗色模式的专注区以极低强度出现。
禁止：大面积渐变、玻璃拟态、彩色描边堆叠、一屏多种圆角。

## 2. 色彩

### 语义层（优先使用）
| 令牌 | 用途 | 类名 |
|---|---|---|
| `--background` | 页面底色 | `bg-background` |
| `--surface` / `--card` | 卡片、面板 | `bg-card` / `bg-surface` |
| `--surface-2` | 次级分区、行内底色 | `bg-surface-2` |
| `--border` / `--border-strong` | 分隔线 / hover 强化 | `border-border`、`border-border-strong` |
| `--foreground` / `--muted-foreground` | 正文 / 辅助 | `text-foreground` / `text-muted-foreground` |
| `--primary` | 唯一强调色（靛紫） | `bg-primary` / `text-primary` |
| `--destructive` / `--success` / `--warning` / `--info` | 状态 | `text-destructive` 等 |

### 时段色（本产品专属，务必用于时段分组/标签/时间轴）
| 时段 | 变量 | 类名 |
|---|---|---|
| 上午 | `--period-morning`（琥珀） | `p-morning` |
| 下午 | `--period-afternoon`（青） | `p-afternoon` |
| 晚上 | `--period-evening`（靛） | `p-evening` |

配合工具类使用（已内置浅/深色适配）：
- `period-dot`：小圆点
- `period-chip`：时段胶囊（背景 14% + 文字 72% 混色 + 30% 描边）
- `period-bar`：横向渐变条（用于时段标题下划线/进度）
- `period-rail`：左侧 2px 竖线（用于列表分组的"时间轴"感）
- `acg-pill`：选中态胶囊（主色 12% 底）

**用法示例**
```tsx
<span className="p-morning period-chip">上午</span>
<span className="p-afternoon period-dot h-2 w-2 rounded-full" />
<div className="p-evening period-rail pl-3">…</div>
```

### 用色纪律
- 时段色只用于：时段标签、圆点、左侧竖线、进度条、柱状图。**不用于大面积背景填充。**
- 一屏内强调色（primary）出现不超过 3 处。
- 状态色只表达状态，不用于装饰。

## 3. 排版

六档，只用这六档：

| 类 | 尺寸/行高 | 用途 |
|---|---|---|
| `text-display` | 28/32，字重 650 | 页面主标题（每页最多 1 个） |
| `text-title` | 20/28，600 | 卡片/区块大标题 |
| `text-section` | 15/22，600 | 分区标题、列表组标题 |
| `text-body` | 14/22 | 正文、行标题 |
| `text-caption` | 12/18 | 辅助信息、时间、标签 |
| `text-micro` | 11/16 | 角标、单位、极次要信息 |

- 数字一律加 `tabular-nums`。
- 中文标题不加 `letter-spacing`（已内置 -0.015em 的紧凑处理）。
- 正文不再用 `text-xs`/`text-sm` 混搭，改用上述语义类（或与之等价的 12/14px）。

## 4. 间距与圆角

**间距走 4pt 网格**：4 / 8 / 12 / 16 / 24 / 32。常用组合：
- 卡片内边距：`p-4`（16）
- 卡片之间：`gap-3`（12）或 `space-y-3`
- 页面外边距：`px-4 py-4`（桌面 `sm:px-6`）
- 分区之间：`space-y-6`（24）

**圆角四档，禁止其他值**：
| 值 | 用途 | 类 |
|---|---|---|
| 6px | 小控件（chip、小型按钮） | `rounded-sm` |
| 8px | 输入框、按钮、行 | `rounded-md` |
| 12px | 卡片 | `rounded-lg` |
| 16px | 浮层、对话框、浮窗 | `rounded-xl` |
| 999 | 胶囊 | `rounded-full` |

## 5. 层级与阴影

- **卡片默认**：`border border-border` + `shadow-[var(--shadow-card)]`，**不要**再用多色描边或发光。
- **hover**：`border-border-strong` + `shadow-[var(--shadow-float)]`，位移不超过 1px。
- **浮层**（Dialog/Drawer/Dropdown/Toast）：`shadow-[var(--shadow-pop)]`。
- 工具类：`.surface`（卡片基准）、`.surface-2`、`.surface-interactive`（hover 动效）、`.elevated`。

## 6. 组件用法

| 组件 | 规范 |
|---|---|
| Button | `default`（primary 实底）/`outline`（描边）/`ghost`（无底）/`destructive`；高度 24/28/32/36；图标按钮必须 `aria-label` |
| Input / Select 触发器 | 高 32，`rounded-md`，focus 时 `ring-2 ring-ring/35` |
| Card | `CardHeader`(标题 + 描述) / `CardContent`；标题用 `text-section`，描述用 `text-caption text-muted-foreground` |
| Badge / Chip | `rounded-full`，`text-micro`/`text-caption`；时段用 `period-chip` |
| Tabs / Segmented | 选中项：`acg-pill` 或 primary 实底；未选中：`text-muted-foreground` |
| Dialog / Drawer | `rounded-xl`，标题 `text-section`，底部按钮右对齐、间距 8 |
| EmptyState | 图标（`text-muted-foreground/60`，24~28px）+ `text-body` 主文案 + `text-caption` 副文案，垂直居中，间距 8 |
| Skeleton | `rounded-md`，`bg-muted/80` |
| Toast | 保持 sonner 默认，勿自定义颜色 |

## 7. 动效

| 令牌 | 时长 | 用途 |
|---|---|---|
| `--motion-fast` | 140ms | 颜色/边框/hover |
| `--motion-base` | 200ms | 展开、切换 |
| `--motion-slow` | 280ms | 页面级淡入 |

- 统一缓动 `--ease-standard`（cubic-bezier(.2,.8,.2,1)）。
- 工具类：`.ui-transition`、`.animate-fade-up`、`.animate-soft-pulse`、`.animate-float`。
- 必须尊重 `prefers-reduced-motion`（已在 globals.css 全局处理）。
- 列表项进入延迟不超过 40ms/项，最多 8 项。

## 8. 可达性与响应式

- 对比度 ≥ 4.5:1（辅助文字也不低于 4.5:1，必要时改用 `text-foreground/70`）。
- 点击区 ≥ 32×32（浮窗内 ≥ 28×28）。
- 键盘可达：所有交互元素有 `:focus-visible`（全局已定义）。
- 断点：375 / 768 / 1024 / 1440 必须无横向滚动；浮窗以 340px 为基准设计。
- 长文本：`truncate` 必须配 `title`；不截断关键信息。

## 9. 改造禁令

- **不要**改 `src/components/ui/**`（已统一，改会波及全部页面）。
- **不要**改 `src/app/globals.css`（令牌在此收敛）。
- **不要**改任何 hook、provider、repository、query key、props 签名、业务分支。
- **只允许**改：`className`、包裹容器结构、纯展示型子组件拆分、文案（不改语义）。
- 每改完一个页面：`npx tsc --noEmit` + `npx eslint <改动的文件>` 必须通过。
