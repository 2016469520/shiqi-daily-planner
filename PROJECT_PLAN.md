# PROJECT_PLAN.md — 我的计划日历

## 项目概述

一个个人计划管理系统，支持月/周/日三视图，上午/下午/晚上三时段，具备完整的事项管理、习惯打卡、每日评价和统计分析功能。

## 技术栈

- **前端框架**: Next.js 14+ (App Router)
- **语言**: TypeScript (strict)
- **样式**: Tailwind CSS
- **组件库**: shadcn/ui
- **日历**: FullCalendar React + 自定义周/日视图
- **后端**: Supabase (Auth, PostgreSQL, Realtime, RLS)
- **表单**: React Hook Form + Zod
- **数据请求**: TanStack Query (React Query v5)
- **日期**: date-fns
- **重复规则**: rrule
- **测试**: Vitest + React Testing Library + Playwright
- **PWA**: next-pwa (Serwist)
- **图标**: Lucide React

## 实施阶段

### 阶段 0：项目检查与规划 ✅
- [x] 检查目录结构
- [x] 确认包管理器 (npm)
- [x] 创建规划文件

### 阶段 1：基础工程
- [ ] 初始化 Next.js + TypeScript
- [ ] 配置 Tailwind CSS
- [ ] 配置 shadcn/ui
- [ ] 配置 ESLint
- [ ] 建立页面布局 (手机端 + 桌面端)
- [ ] 实现响应式导航
- [ ] 实现浅色/深色主题切换

### 阶段 2：数据库与认证
- [ ] 创建 Supabase 客户端
- [ ] 创建数据库 migrations
- [ ] 配置 RLS 策略
- [ ] 实现登录/注册页面
- [ ] 实现受保护路由
- [ ] 初始化默认标签

### 阶段 3：日历核心
- [ ] 月视图
- [ ] 周视图
- [ ] 日视图
- [ ] 日期导航
- [ ] 今日按钮
- [ ] 视图切换 (月/周/日)

### 阶段 4：计划事项
- [ ] 新增事项
- [ ] 编辑事项
- [ ] 删除/软删除/撤销
- [ ] 完成/取消完成
- [ ] 拖拽排序
- [ ] 跨时段/跨日期移动
- [ ] 标签系统
- [ ] 优先级
- [ ] 子任务
- [ ] 搜索和筛选

### 阶段 5：重复事项与提醒
- [ ] 重复规则 (daily/weekly/monthly/custom)
- [ ] 单次例外处理
- [ ] 提醒字段和通知

### 阶段 6：每日评价
- [ ] 评价表单
- [ ] 自动保存
- [ ] 历史查看

### 阶段 7：习惯打卡
- [ ] 习惯管理 CRUD
- [ ] 每日打卡
- [ ] 连续天数统计
- [ ] 热力图

### 阶段 8：统计与复盘
- [ ] 今日/周/月统计
- [ ] 标签统计
- [ ] 时段统计
- [ ] 习惯统计
- [ ] 评分趋势

### 阶段 9：PWA 与离线
- [ ] Web App Manifest
- [ ] Service Worker
- [ ] 离线提示
- [ ] 缓存策略

### 阶段 10：测试与优化
- [ ] 单元测试
- [ ] 组件测试
- [ ] E2E 测试
- [ ] 手机适配
- [ ] 可访问性
- [ ] 性能优化

### 阶段 11：部署文档
- [ ] .env.example
- [ ] Supabase 配置指南
- [ ] 部署指南
