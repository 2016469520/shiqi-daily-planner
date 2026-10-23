# FUTURE_ROADMAP.md — 未来路线图

## 短期 (v1.1 - v1.3)

### 原生 App 封装
- **Capacitor 封装**: 将 PWA 封装为 iOS/Android App
  - 使用 Capacitor 访问原生 API (通知、日历同步、桌面小组件)
  - 保持统一代码库

### 桌面应用
- **Tauri 封装**: 轻量级桌面应用
  - 使用 Rust 后端，体积小，性能好
  - Windows / macOS / Linux 三平台

### 系统日历同步
- 与 Google Calendar / Apple Calendar / Outlook 双向同步
- ICS 导入/导出增强

## 中期 (v1.4 - v2.0)

### AI 功能
- **AI 自动拆解计划**: 输入一个目标，AI 自动拆解为可执行的每日计划
- **AI 周报与月报**: 基于实际完成情况，自动生成复盘报告
- **语音快速添加**: 语音输入事项，AI 解析日期、时段、标签

### 小组件
- iOS 桌面小组件 (今日计划、习惯打卡)
- Android 桌面小组件
- macOS 菜单栏小组件
- Windows 任务栏托盘

### 协作功能 (如果未来需要)
- 共享日历
- 任务委派
- 团队统计

## 长期 (v2.1+)

### 数据分析
- 更丰富的趋势分析
- 个人效率报告
- 时间追踪和番茄钟集成

### 集成
- Notion 双向同步
- GitHub Issues 集成
- 日历订阅

### 国际化
- 多语言支持 (英文、日文、韩文等)

---

## 架构设计原则

当前架构已为上述扩展做好准备：

1. **Repository 模式**: 数据访问层抽象，前端不直接依赖 Supabase
2. **UI/业务逻辑分离**: 核心日期、重复规则、统计逻辑独立于 React 组件
3. **PWA 优先**: Service Worker + Manifest，为 Capacitor/React Native 封装做准备
4. **API 兼容**: Supabase REST API 可直接被原生 App 调用
