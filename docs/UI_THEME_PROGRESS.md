# UI 主题系统 · 进度与恢复

> 更新时间：2026-10-22 00:40（北京时间）
> 分支：`feat/theme-system`（未推送远程）

## 当前阶段

Phase 1–10 全部完成。六套主题、主题管理、高级个性化、全局适配、截图验收均已落地并实测通过。
详细验收结论见 docs/UI_THEME_TEST_REPORT.md。

## 已完成

### 架构（Phase 3）
| 文件 | 作用 |
|---|---|
| `src/lib/theme/types.ts` | 主题/个性化/预设的类型契约 |
| `src/lib/theme/themes.ts` | 六套主题元数据（名称、描述、预览色、默认参数）、字体与动效选项、`getTheme` 安全回退 |
| `src/lib/theme/apply.ts` | 个性化 → CSS 变量映射（强调色对比度、圆角阶梯、字体栈、倍率、动效时长），并负责清理旧覆盖 |
| `src/lib/theme/storage.ts` | localStorage 读写、逐项校验、导入导出、版本号 |
| `src/lib/theme/store.ts` | `useSyncExternalStore` 外部 store，避免 effect 内 setState 与水合不一致 |
| `src/lib/theme/prepaint.ts` | 首帧前脚本：在 React 挂载前写好 `data-theme` / `.dark` / 缩放 / 强调色，杜绝主题闪烁 |
| `src/providers/appearance-provider.tsx` | 唯一真源：主题、明暗、个性化、预设、导入导出 |
| `src/providers/theme-provider.tsx` | 兼容外壳，内部改为 `AppearanceProvider` |

### 样式层
| 文件 | 内容 |
|---|---|
| `src/styles/themes.css` | 共享层：类型阶梯倍率、标题族变量、卡片/输入/导航变量、动效强度、装饰底纹、预览卡样式 |
| `src/styles/theme-fluent.css` | Theme 03 云母（Windows 11） |
| `src/styles/theme-minimal.css` | Theme 04 留白（Apple / Linear） |
| `src/styles/theme-pixel.css` | Theme 05 像素机（8-bit） |
| `src/styles/theme-bento.css` | Theme 06 暗格（Dark Bento） |
| `src/styles/theme-anime.css` | Theme 01 樱色（日系二次元） |
| `src/styles/theme-cyber.css` | Theme 02 霓虹终端（HUD 科幻） |

### 设置界面（Phase 5 / 6）
| 文件 | 内容 |
|---|---|
| `src/components/settings/appearance-panel.tsx` | 主题网格、明暗、强调色（预设+自定义取色）、四类圆角滑杆、缩放、字体与字号、动画强度、预设管理、恢复默认、导入导出 |
| `src/components/settings/theme-card.tsx` | 真实变量渲染的迷你预览卡（非截图） |
| `src/app/settings/page.tsx` | 分区更名为「外观与个性化」，接入面板，移除 next-themes |

### 其他改动
- `src/app/layout.tsx`：引入 `themes.css` + 首帧前脚本
- `src/components/ui/sonner.tsx`：改从外观 Provider 取明暗

## 未完成（非阻断，已记录在测试报告）

无阻断项。以下为已知限制：

1. Electron 真机窗口与 Android 安装包内的主题渲染需在本机确认（本环境无法开 GUI）
2. 
ext-themes 依赖已无代码引用，可后续从 package.json 移除
3. 像素主题的胶囊归一化只作用于 .surface 内，属有意取舍
## 恢复指令

```powershell
cd D:\DeepSeek\工作区\plan-calender
git status --short
git log --oneline -5
npx tsc --noEmit
npx eslint
npx vitest run --reporter=dot
ls src\styles\theme-*.css
```

若主题 CSS 缺失导致构建失败：确认 `src/styles/themes.css` 里的 `@import` 与 `src/styles/theme-*.css` 一一对应。
若设置页报 `useAppearance 必须在 AppearanceProvider 内使用`：确认 `app-providers.tsx` 仍包着 `ThemeProvider`。

## 验收矩阵

| 项 | 状态 |
|---|---|
| Anime 主题 | ✅ 实测 |
| Cyberpunk 主题 | ✅ 实测 |
| Fluent 主题 | ✅ 实测 |
| Minimal 主题 | ✅ 实测 |
| Retro Pixel 主题 | ✅ 实测 |
| Dark Bento 主题 | ✅ 实测 |
| 预览卡 | ✅ 实测（真实变量渲染） |
| 一键切换 | ✅ 实测（点击即切换） |
| 全局应用 | ✅ 6 主题 × 6 页面扫查 |
| 保存 / 启动恢复 | ✅ 刷新后主题/圆角/强调色保持 |
| 非法主题回退 | ✅ 写入坏 id 后回到 fluent |
| 强调色 / 圆角 / 缩放 / 字体 / 动效 | ✅ 全部实测 |
| 用户预设 | ✅ 保存→刷新→应用→删除 |
| 恢复默认 | ✅ 当前主题 / 全部两档 |
| 导入导出 | ✅ 单测覆盖往返与非法输入 |
| 原有功能回归 | ✅ 292 单测 + 34 e2e |
| 主题差异度 | ✅ 主色 6 种 / 结构签名 6 种 / 截图哈希 10/10 |

完整证据见 docs/UI_THEME_TEST_REPORT.md。