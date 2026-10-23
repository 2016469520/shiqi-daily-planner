# TEST_PLAN: 习惯分钟滚轮连续输入

## 单元测试 (Vitest)

### draft 累积
- [x] wheel up +1
- [x] wheel down -1
- [x] wheel at 0 does not go negative
- [x] 连续 wheel 10 次，draft = persisted + 10
- [x] 连续 wheel 20 次从非零基值
- [x] 连续 wheel down 正确递减
- [x] 优先从 draft 累积（非 persisted）
- [x] deltaY=0 不变

### +/- 累积
- [x] +1 按钮调整
- [x] -1 按钮调整
- [x] 连续点击 10 次 +1
- [x] -1 at 0 保持 0

### 显示值解析
- [x] 有 draft 时显示 draft
- [x] 无 draft 时显示 persisted
- [x] 无 draft 且 persisted=0 时显示 0

### Debounce
- [x] 10 次事件只触发 1 次最终保存
- [x] debounce 时间内不保存
- [x] 每次新事件重置计时器
- [x] 最终保存值为最新值

### 竞态保护
- [x] 旧保存响应不清除更新的 draft
- [x] 匹配的保存清除 draft
- [x] saveVersion 阻止旧回调执行
- [x] 连续滚动期间保持 draft 值

### 保存失败
- [x] 失败后保留 draft
- [x] 重试使用最新 draft

### 验证 & 状态
- [x] 输入验证
- [x] 保存状态指示器不位移

## Playwright E2E (待执行)

### 场景一：连续滚轮不卡顿
1. 打开习惯页
2. 找到分钟型习惯
3. 记录初始值
4. 连续触发 20 次 wheel up
5. 验证 UI 最终值增加 20（不是 1）
6. 验证过程中页面无明显跳动

### 场景二：只保存最终值
1. 连续 wheel 调整 20 次
2. 等待 debounce
3. 验证最终保存值是初始值 +20
4. 验证保存次数为 1-2 次（非 20 次）

### 场景三：保存中继续滚动
1. 模拟保存延迟
2. 滚到 10，保存开始
3. 保存未完成时继续滚到 25
4. 验证 UI 不回到 10
5. 最终保存 25

### 场景四：加减按钮连续点击
1. 连续点击 + 10 次
2. 验证 UI +10
3. 等待 debounce
4. 验证最终保存 +10

### 场景五：手机端 (390×844)
1. 连续点击 +
2. 直接输入
3. 保存状态不阻塞
4. 无横向溢出
