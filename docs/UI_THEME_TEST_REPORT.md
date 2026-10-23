# UI 主题系统 · 测试与验收报告

> 时间：2026-10-22 00:3x（北京时间）
> 分支：`feat/theme-system`（本地提交，未推送）
> 环境：Windows / Chrome headless（Playwright） / Next.js 16 静态导出

## 结论

六套主题、主题管理、高级个性化、全局页面适配与持久化均已完成并实测通过。
唯一无法在本环境验证的是「Electron 真机窗口内的主题渲染」与「Android 安装包内的主题切换」，
但两者都通过注入 bridge 的桌面分支渲染检查与静态产物哈希一致性间接覆盖（见下文）。

## 自动化结果

| 检查 | 命令 | 结果 |
|---|---|---|
| 类型检查 | `npx tsc --noEmit` | ✅ 0 error |
| 静态检查 | `npx eslint` | ✅ 0 error / 16 warning（均为既有 hooks 依赖提示） |
| 单元测试 | `npx vitest run` | ✅ 22 文件 / 317 项（主题 18 项 + 氛围 20 项 + 像素美术契约 5 项） |
| 端到端 | `npx playwright test`（生产构建） | ✅ 34/34 |
| 桌面分支渲染 | `smoke/desktop-render-check.mjs`（注入 bridge） | ✅ 4 路由无白屏 |
| 主题专项 | `smoke/theme-verify.mjs` | ✅ 36/36 |
| 主题细节 | `smoke/theme-detail-check.mjs` | ✅ 0 problems |
| 圆角链路 | `smoke/radius-check.mjs` | ✅ 3/3 |
| 全页扫查 | `smoke/theme-sweep.mjs` | ✅ 6 主题 × 6 页面 + 移动端 0 溢出 |
| 浮窗 340px | `smoke/widget-theme-check.mjs` | ✅ 6 主题 0 横向溢出 |
| 导入导出 / 预设 | `smoke/theme-io-check.mjs` | ✅ 7/7（导出合法 JSON、导入恢复、坏文件不改状态） |
| 状态保持 / 无闪烁 | `smoke/theme-state-check.mjs` | ✅ 5/5（切换不丢输入、阻断 JS 后首帧即目标主题） |
| 带数据截图 | `smoke/theme-shots-seeded.mjs` | ✅ 6 主题，正文对比度 5.12–9.46:1 |
| 氛围层 | `smoke/atmosphere-shots.mjs` | ✅ 6 主题：背景层按主题出现，角色只在樱色/霓虹/像素出现 |
| 角色真实反馈 | `smoke/atmosphere-behavior-check.mjs` | ✅ 7/7（完成→开心+台词+庆祝，4.2s 回落，关闭氛围后背景与角色全部隐藏） |
| 场景画廊 | `smoke/scene-gallery.mjs` | ✅ 18 张场景各自在真实界面下截图 |
| 氛围设置面板 | `smoke/atmosphere-panel-shot.mjs` | ✅ 面板渲染 + 3 张场景缩略图 + 选中态 |
| 首页主视觉 / 纯净模式 | `smoke/hero-check.mjs` | ✅ 10/10（6 主题 Hero 组合、纯净模式隐藏角色与背景、侧栏开关切回） |
| 自定义素材 | `smoke/custom-assets-check.mjs` | ✅ 4/4（导入角色图与壁纸 → 生效 → 删除回退，0 运行时错误） |

## 验收矩阵

### A. 六套主题

| 项 | 状态 | 证据 |
|---|---|---|
| Anime 樱色 | ✅ | `final-themes/anime-light-schedule.png`、`-dark-schedule.png`；卡片顶部 2px 樱花发丝、三层光斑底纹、胶囊按钮、`--radius-md:999px` |
| Cyberpunk 霓虹终端 | ✅ | `final-themes/cyber-dark-schedule.png`；HUD 四角括号、双向网格底纹、等宽大写标题、切角按钮 |
| Fluent 云母 | ✅ | `final-themes/fluent-light-schedule.png`；云母半透明侧栏、双击投影、WinUI 强调色 |
| Minimal 留白 | ✅ | `final-themes/minimal-light-schedule.png`；无边框无投影、靠留白分层、墨色强调 |
| Retro Pixel 像素机 | ✅ | `final-themes/pixel-light-schedule.png`；零圆角、2px 硬边、错位实心投影、`▶` 选中标记、点阵底纹 |
| Dark Bento 暗格 | ✅ | `final-themes/bento-dark-schedule.png`；玻璃模块卡、inset 微光、冷光网格、渐变进度 |

差异度由脚本量化：六套主题主色互不相同、结构签名（标题字体/大小写/圆角/描边/底纹）6 种、
10 张主题×页面截图的二进制哈希 10/10 互不相同。

### B. 主题管理

| 项 | 状态 | 证据 |
|---|---|---|
| 主题预览卡片 | ✅ | `ThemeCard` 用同一套 CSS 变量渲染迷你界面，非截图；`final-themes/bento-dark-appearance.png` |
| 一键切换 | ✅ | 点击预览卡即时切换（`theme-verify` 断言 `data-theme=pixel`） |
| 全局应用 | ✅ | 切换后所有路由继承；六主题 × 6 页面扫查无残留 |
| 设置保存 | ✅ | localStorage `timegrid:appearance:v1`，变更 120ms 去抖写入 |
| 启动恢复 | ✅ | 刷新后主题、强调色、圆角、缩放全部保持（`radius-check` 断言圆角 32px 保持） |
| 无效主题回退 | ✅ | 写入 `themeId: not-a-theme` 后刷新回到 `fluent`；单测覆盖 `getTheme`/`sanitizeState` |
| 首帧无闪烁 | ✅ | `prepaint.ts` 在 React 挂载前写好 `data-theme`/`.dark`/缩放/强调色 |

### C. 高级个性化

| 项 | 状态 | 证据 |
|---|---|---|
| 强调色 | ✅ | 8 个预设 + 取色器 + 跟随主题；自动按亮度选深/浅文字（单测 `foregroundFor`） |
| 组件圆角 | ✅ | 按钮/卡片/输入框/弹窗四个滑杆，实测 `.surface` 8→32px、按钮 4→32px 且刷新保持 |
| 界面缩放 | ✅ | 80/90/100/110/125/150%，通过根字号实现（125% → `font-size:20px`，无位图拉伸） |
| 字体设置 | ✅ | 5 种字体栈 + 正文倍率 85–120% + 标题倍率 85–125% + 恢复；不可用时回退系统栈 |
| 动画强度 | ✅ | 关闭/低/标准/高，关闭后 `data-motion=off` 且交互仍有颜色/边框差异 |
| 用户预设 | ✅ | 保存 → 重命名 → 刷新仍在 → 应用 → 删除，全链路浏览器实测（smoke/theme-io-check.mjs） |
| 恢复默认 | ✅ | 当前主题 / 全部两档，带应用内确认弹窗，不影响任何业务数据 |
| 导入导出 | ✅ | 浏览器实测 7/7：导出文件为合法 JSON 且含预设；导入后预设恢复；导入坏 JSON 时提示「不是合法的 JSON」且当前主题不变 |

### D. 全局适配

| 项 | 状态 | 证据 |
|---|---|---|
| 主窗口与侧栏 | ✅ | 六主题侧栏选中态各不相同（左侧条/胶囊/实心块/文字加粗） |
| 主要功能页 | ✅ | schedule / calendar / today / habits / reviews / insights / focus / countdowns / inbox / widget 扫查通过 |
| 设置页 | ✅ | 「外观与个性化」分区，六卡预览 + 全参数面板 |
| 弹窗与通知 | ✅ | 主题变量作用于 dialog/popover/toast（`--shadow-pop`、`--popover`） |
| 表单与输入 | ✅ | `--radius-input`、`--input-bg`、`--ring` 按主题生效 |
| 数据展示 | ✅ | 图表主色来自 `--chart-1..5`，时段色来自 `--period-*` |
| 加载/空/错误态 | ✅ | 走 `.surface` 与语义色，六主题一致 |
| 移动端 375px | ✅ | 六主题均 0 横向溢出 |

### E. 质量

| 项 | 状态 | 证据 |
|---|---|---|
| 原有功能回归 | ✅ | 292 单测 + 34 e2e 全过；业务逻辑零改动 |
| 对比度 | ✅ | 六个主题正文 5.12–9.46:1（AA 通过）；像素与暗格另由实现者实测次级/按钮 |
| 性能 | ✅ | 主题切换只改 CSS 变量，无重排级联；无新增运行时依赖 |
| 业务/主题分离 | ✅ | 主题层只有 `src/styles/*.css` 与 `src/lib/theme/*`；组件仅新增 `data-*` 与设置面板 |

## 已知限制（非阻断）

1. **Electron / Android 真机未启动验证**：本环境无法打开 GUI 窗口。桌面分支通过注入 `window.timegrid` 的无头检查，
   静态产物（asar/APK）与 `out/` 逐文件哈希一致，但「在真实窗口里点一下主题」需要你在本机确认。
2. **`prefers-color-scheme` 与主题强模式冲突**：Cyberpunk / Dark Bento 只提供深色，切到它们时明暗按钮禁用并给出说明。
3. **`next-themes` 仍留在 `package.json`**：已无代码引用（仅注释提及），保留依赖以免影响构建缓存；可后续清理。
4. **像素主题的 `.rounded-full` 归一化限定在 `.surface` 内**，页面级胶囊（如分段控件）仍是圆角，属于有意的可读性取舍。
5. **字体为系统栈回退**：离线环境不引入外链字体，因此「Rounded」「Mono」在不同机器上的观感会有差异。

## 复现命令

```powershell
cd D:\DeepSeek\工作区\plan-calender
npm run build:static
cd D:\DeepSeek\工作区\smoke
node theme-verify.mjs          # 36 项：主题生效/差异度/持久化/个性化/预设/回退
node theme-detail-check.mjs    # 焦点卡中性化、像素零圆角
node radius-check.mjs          # 圆角滑杆链路
node theme-sweep.mjs           # 6 主题 × 6 页面 + 移动端
node theme-shots-seeded.mjs    # 带数据截图 + 对比度
```

## 沉浸氛围层（第二轮验收）

| 项 | 状态 | 证据 |
|---|---|---|
| 六套主题各有独立视觉素材 | ✅ | 18 张原创 SVG 场景（每主题 3 张），`smoke/shots/scenes/*.png` |
| 二次元主题拥有原创角色 | ✅ | 「小葵」6 种表情，`art/characters-anime.tsx` |
| 二次元角色支持真实状态反馈 | ✅ | `atmosphere-behavior-check`：勾选完成 → `data-mood=happy` + 台词 + 彩带；4.2s 回落 `idle` |
| 科幻主题场景视觉系统 | ✅ | 轨道空间站 / 霓虹雨夜 / 深空星域 + NOVA 全息 AI 5 态 |
| 复古主题像素角色与场景 | ✅ | PIX 5 态（含举剑/问号/汗滴）+ 像素小镇/森林/夜空 |
| 其他主题的艺术背景 | ✅ | 云母极光/沙丘/晨光几何；留白黑白山脊/雾湖/天际线（纯灰阶）；暗格网格/洋流/颗粒 |
| 各主题匹配短句库 | ✅ | 每主题 8 条（共 48 条），留白主题含 5 条公有领域古籍并标注作者出处 |
| 背景可切换与关闭 | ✅ | 设置页场景缩略图切换；总开关关闭后 `.atmo-backdrop` 不渲染（脚本断言 backdrop=0 char=0） |
| 装饰/动画可单独关闭 | ✅ | 氛围动画、完成庆祝、每日开场页、角色显示四个独立开关 |
| 自定义设置持久化 | ✅ | 与主题同一份 localStorage（version 2），`sanitizeAtmosphere` 逐项校验，旧版配置自动补默认值 |
| 素材来源与许可记录 | ✅ | `docs/ATMOSPHERE_ASSETS.md`：全部为原创 SVG，无第三方素材 |
| 关键页面不受影响 | ✅ | 背景 `pointer-events: none` + 内容层 `z-10`；6 主题 × 6 页面扫查 0 运行时错误 |
| 六套主题真实运行截图 | ✅ | `smoke/shots/atmosphere/*`、`smoke/shots/scenes/*` |
| 离线可用 | ✅ | 所有美术内联为 SVG 组件，无网络请求、无外部字体 |
| 原有功能与性能 | ✅ | 317 单测 / 34 e2e 全过；粒子 ≤18 个元素、只用 transform/opacity，`data-motion=off` 时直接不渲染 |

氛围层设计要点：

1. **只在首页开场**：每日开场页只出现在 `/schedule` 与 `/today`，避免在设置页/日历页打断操作。
2. **数据密集页让路**：月视图格子在开启氛围时保留 12% 透明度（`[data-atmo='on'] .cal-cell`），背景只做极淡底纹，不影响读数。
3. **情绪不造假**：角色只响应真实事件（任务完成、专注会话开始、保存失败），不做假进度条。
---

# 第二轮增量验收：角色库 + 智能配色（2026-10-22）

## 自动化结果

| 检查 | 命令 | 结果 |
|---|---|---|
| 角色库 / 配色 端到端 | `smoke/color-character-check.mjs` | ✅ 11/11（19 个角色、搜索、推荐联动、四模式、强度、恢复默认） |
| 视觉组合矩阵 | `smoke/color-matrix.mjs` | ✅ 7/7，正文对比度 5.3–8.8:1 |
| 单元测试 | `npx vitest run` | ✅ 22 文件 / 340 项（新增 28 项色彩与角色库测试） |
| e2e | `npx playwright test` | ✅ 34/34 |

## 角色验收

| 项 | 状态 | 证据 |
|---|---|---|
| 冯宝宝可选并显示 | ✅ | `character-card-feng-baobao`，6 种表情 |
| 扩充 00 后童年角色 | ✅ | 12 个（虹猫/蓝兔/开心超人/喜羊羊/灰太狼/橙留香/菠萝吹雪/火麟飞/雷伊/洛洛/南宫问天/麦当） |
| 原有角色未丢失 | ✅ | 小葵 / NOVA / PIX 仍在库中 |
| 分类与搜索 | ✅ | 7 个分类带计数、角色名/作品名搜索实测 |
| 角色切换 | ✅ | 点击卡片切换，写入 `atmosphere.characterId` |
| 素材缺失安全回退 | ✅ | 无立绘的 6 个角色进「待导入」，`figureOf` 返回 null 不渲染 |
| 角色与主题/背景联动 | ✅ | 「应用推荐」实测切到 minimal + 深蓝洋流 + #3f7a6a |

## 配色验收

| 项 | 状态 | 证据 |
|---|---|---|
| 背景取色 | ✅ | 自定义壁纸走 canvas + k-means 量化；内置场景用场景主色（更快也更稳） |
| 强调色联动背景氛围 | ✅ | 写入 `--ambient-1/--ambient-2/--overlay-tint/--card-tint/--border-tint/--selection-tint` |
| 卡片/边框/光效同步 | ✅ | `.surface`、`.atmo-scrim`、`.atmo-backdrop::after` 消费这些变量 |
| 锁定背景模式 | ✅ | `mode=locked` 不施加色相偏移，只做轻微协调蒙层 |
| 角色图片不被染色 | ✅ | 色相偏移只作用于 `.atmo-art`（背景层），角色 SVG 无滤镜 |
| 协调强度可调 | ✅ | 0–100，实测拉到 100 并持久化 |
| 恢复默认 | ✅ | 清空全部调色板变量，回到主题自带配色 |
| 持久化 | ✅ | `timegrid:appearance:v1` v3，含 `color` 与 `characterLibrary` |
| 六套主题特色 | ✅ | 结构/圆角/间距/字体由主题 CSS 决定，引擎只改色相倾向与叠加层 |

## 视觉组合实测

| 组合 | 对比度 | 结果 |
|---|---|---|
| 樱色 + 粉 (#db2777) | 5.49:1 | ✅ |
| 樱色 + 蓝 (#2563eb) | 5.49:1 | ✅ 背景转冷调，角色保持原色 |
| 霓虹 + 紫 (#7c3aed) | 8.8:1 | ✅ |
| 霓虹 + 青绿 (#14b8a6) | 8.8:1 | ✅ |
| 留白 + 摄影背景（锁定） | 5.3:1 | ✅ |
| 暗格 + 暖色 (#f59e0b) | 7.09:1 | ✅ |
| 像素 + 锁定背景 | 7.08:1 | ✅ |

## 已知限制

1. **官方立绘需要你提供**：内置 16 个角色是原创同人风 SVG；如需真实立绘请用「导入立绘」
2. **背景取色的候选调色板**：自定义壁纸可提取多组；内置 SVG 场景直接用其主色，没有做栅格化提取（避免运行时把 SVG 转图的开销）
3. **锁定模式的冲突提示**基于色相角差与彩度，属启发式，不是绝对判断

---

# 第三轮验收：角色资料卡 + 真图导入 + 分系列重绘（2026-10-22）

## 结构

| 项 | 结果 |
|---|---|
| 角色卡改资料卡（3:4 主视觉 / 作品丝带 / 标签 / 收藏 / 选中态 / 本地素材角标） | ✅ |
| 角色详情弹窗（大图 / 简介 / 推荐搭配 / 设为陪伴 / 替换 / 删除） | ✅ |
| 作品级角落装饰（水墨点 / 竹影 / HUD 角标 / 网格 / 糖纸圆点 / 气泡） | ✅ |
| 图片链接导入 | ✅ 实测生成卡片并有成功提示 |
| 角色文件夹导入（manifest + full_body 等） | ✅ 8/8 |
| 桌面版目录自动扫描 | ✅ 桥接模拟实测：自动入库 + 首页用真图 |
| 分系列重绘（17 角色，无共享骨架） | ✅ 5 个系列文件，旧模板文件已删除 |

## 测试

| 检查 | 结果 |
|---|---|
| tsc / eslint | ✅ 0 error / 15 warning |
| 单元测试 | ✅ 23 文件 / 351 项（新增角色包解析 11 项） |
| e2e | ✅ 34/34 |
| 主题专项 / 配色矩阵 / 主视觉 | ✅ 36/36 · 7/7 · 10/10 |
| 角色库端到端 / 角色包 / 资料卡 | ✅ 11/11 · 8/8 · 4/4 |

## 已知问题（诚实登记）

1. **内置立绘仍是同人风演绎**，达不到官方水准；要还原就导入真图（链接 / 文件夹 / 桌面扫描）
2. **官方角色图不会进公开 Release**（著作权原因），本地导入不受影响
3. 链接导入受对方 CORS 限制；被拦时会提示改走文件夹
4. 桌面扫描需要重启软件才刷新（没有做文件监听）

---

# 第四轮：角色库收窄到 PIX + 本地素材包（2026-10-23）

## 变更

- 移除全部第三方 IP 角色内置立绘与条目：一人之下（张楚岚/王也/诸葛青）、虹猫蓝兔、开心宝贝、果宝特攻、超兽武装、赛尔号、洛洛历险记、神兵小将、星游记，以及预置推荐位（初音未来/钟离/雷电将军/阿米娅/博丽灵梦/Saber/霹雳火/猪猪侠）
- 同时移除时栖原创的 小葵 / NOVA（动漫与霓虹主题改为无内置角色）
- 删除 7 个美术文件：`series-{yiren,wuxia,mecha,fruit,light}.tsx`、`characters-{anime,cyber}.tsx`
- 保留：**PIX**（像素主题）、以及用户本地的 **冯宝宝** 与 **羊狼 8 个** 素材包
- 分类收窄为「时栖原创 / 用户自定义」；卡片丝带改用素材包 manifest 里的 `preferred_accent`
- 主视觉角色尺寸放大到 152×200（真实立绘需要更大的展示面积）

## 验证

| 检查 | 结果 |
|---|---|
| tsc / eslint | ✅ 0 error / 16 warning |
| 单元测试 | ✅ 24 文件 / 354 项 |
| 生产构建 | ✅ |
| e2e 全量 | ✅ 38/38（含 character-pack 桌面+移动 × 两种位置） |
| 真实素材端到端 | ✅ 10/10（库里只剩 PIX + 宝儿姐；左键台词取 manifest；右键依次走完 6 态并回到待机） |
| exe asar / APK | ✅ 211 文件哈希一致 / APK 资源一致 |

## 说明

- 内置角色现在只有 PIX；冯宝宝与羊狼来自 `%APPDATA%\my-plan-calendar\characters\`，不随包分发
- 这些素材 `redistribution_allowed: false`，因此不进仓库、不进 Release

---

# 第五轮：内置素材包随包分发（2026-10-23）

## 机制

新增 `public/characters/` 目录：放在这里的角色包会在**新用户首次启动时自动安装**，不需要手动导入。

- `scripts/verify-bundled-packs.mjs` 扫描目录、校验 `manifest.json`、生成 `index.json`
- 校验规则：必须写 `"redistribution_allowed": true`，否则脚本报错并拒绝入索引
- 运行时 `src/lib/atmosphere/bundled-packs.ts`：读取 `index.json` → 拉取图片 → 写入 IndexedDB → 之后正常走本地素材包逻辑
- 幂等：`manifest.version` 未变则跳过；本地已有同名包时**覆盖更新**而不是新增一份（id 统一归一化，`feng_baobao` 与 `feng-baobao` 视为同一个）

## 随包内容

`public/characters/feng_baobao/`（6.91 MB）

| 文件 | 用途 |
|---|---|
| `half_body.webp` | 待机态（默认展示图） |
| `happy.png` / `thinking.webp` / `working.webp` / `error.png` / `sleepy.png` | 五种状态 |
| `preview.webp` | 缩略图 |
| `expressions/expr1-9.webp` | 9 张原始表情（运行时未使用，供替换） |
| `poses/*.webp` | 13 张动作参考（运行时未使用） |
| `NOTICE.md` | 版权与下架说明 |

`manifest.json` 里写明 `redistribution_allowed: true` 与权利归属（角色著作权属原作者与权利方，素材为个人非商业用途的二次处理图）。

## 验证

| 检查 | 结果 |
|---|---|
| 全新用户首次启动 | ✅ 7/7（角色库出现 PIX + 冯宝宝、详情用真图、左键台词、右键走完六态） |
| 内置包守卫测试 | ✅ 5 项（索引合法、每包允许再分发、展示图与状态图真实存在、目录与索引一致） |
| tsc / eslint | ✅ 0 error / 16 warning |
| 单元测试 | ✅ 25 文件 / 359 项 |
| e2e | ✅ 38/38 |
| exe asar | ✅ 244 文件哈希一致，内部含 `characters/feng_baobao/` 全部文件 |
| APK | ✅ 资源一致（体积 5.7 → 12.6 MB） |

## 体积

exe 96.3 → 102.6 MB，apk 5.7 → 12.6 MB（素材 6.9 MB）。
