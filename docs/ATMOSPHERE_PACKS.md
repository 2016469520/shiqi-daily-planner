# 氛围素材包约定（角色 / 背景 / 短句）

> 目标：换素材不动代码。内置素材是原创 SVG（见 `docs/ATMOSPHERE_ASSETS.md`），
> 你自己的图片通过设置页导入即可，本机保存、不上传。

## 一、内置素材（随包）

| 类型 | 位置 | 说明 |
|---|---|---|
| 场景 | `src/components/atmosphere/art/scenes-*.tsx` | 18 张原创 SVG（每主题 3 张） |
| 角色 | `src/components/atmosphere/art/characters-*.tsx` | 小葵 6 态 / NOVA 5 态 / PIX 5 态 |
| 短句 | `src/lib/theme/atmosphere.ts` | 每主题 8 条（含公有领域古籍 5 条） |

改内置素材 = 改对应组件或数组，主题设置页会自动列出新增项。

## 二、本地角色包（模式 A，首选）

这是**首选**方式：把你收藏的高清立绘放进一个文件夹，软件直接用你的图，不再画。

```
characters/
  feng_baobao/
    manifest.json
    full_body.png      ← 优先显示（半身 / 立绘）
    half_body.png
    portrait.png
    preview.png
    happy.png  thinking.png  working.png  success.png  error.png
```

`manifest.json`（除 `name` 外都可省略）：

```json
{
  "id": "baobao",
  "name": "冯宝宝",
  "series": "一人之下",
  "tags": ["国漫", "本地素材"],
  "preferred_theme": "minimal",
  "preferred_accent": "#3f7a6a",
  "preferred_background": "minimal-lake",
  "description": "一句话简介"
}
```

规则：

1. 一个子文件夹 = 一个角色包，**必须**有 `manifest.json`
2. 展示图优先级：`full_body` > `half_body` > `portrait` > `preview`；都没有就取包里最大的一张图
3. 文件名命中 `normal/happy/thinking/working/success/error/sleepy` 的图作为对应情绪的表情
4. 缺少某个表情时回退到 `idle` 图，再回退到展示图
5. 导入：设置 → 外观与个性化 → 角色库 → 「导入角色包」，选中整个 `characters` 文件夹
6. 图片存本机 IndexedDB（`timegrid-character-packs`），不上传；可在详情页删除
7. 素材包角色与内置角色一样参与「设为陪伴角色」「收藏」「最近使用」「推荐搭配」

## 二之二、单张立绘（快捷方式）

设置 → 外观与个性化 → 沉浸氛围 → 角色伙伴 → **导入角色图**，可**多选**。

文件名决定状态绑定（不含扩展名、忽略大小写）：

| 文件名 | 绑定的状态 |
|---|---|
| `normal.png` / `idle.png` / `default.png` | 待机 |
| `happy.png` / `smile.png` / `success.png` / `done.png` | 开心 |
| `thinking.png` / `think.png` | 思考 |
| `working.png` / `work.png` | 工作中 |
| `error.png` / `fail.png` | 出错 |
| `sleepy.png` / `sleep.png` | 困了 |

规则：

1. 一次多选的所有图片被视为**同一个角色包**（共享 `groupId`），最多 8 张、每张 ≤ 8MB
2. 运行时会按当前情绪在包内找对应图；找不到就退回没有状态词的那张（通用立绘）
3. 图片以 Blob 存进独立的 IndexedDB（`timegrid-atmosphere`），**只在本机**，不会上传
4. 支持 PNG / WebP / JPG / GIF（GIF 会动，但不受"表情动画"开关控制）

可直接使用这样的文件夹结构，把里面的图片一次性选中导入：

```
my-character/
  normal.png
  happy.png
  thinking.png
  working.png
  success.png
  error.png
```

## 三、自定义背景

同一面板里的 **导入壁纸**，支持 PNG / WebP / JPG。

- 导入后自动切换为「自定义背景」，可与其他主题共用
- 背景参数：可见度、模糊、压暗、遮罩强度、色相、亮度
- 删除壁纸会同时把背景切回内置场景

## 四、自定义短句

同一面板 → 每日一句 → 输入后「添加」，每套主题最多 20 条，与内置 8 条一起参与每日轮换。

## 五、数据与清理

| 数据 | 位置 | 清理方式 |
|---|---|---|
| 外观/氛围设置 | `localStorage['timegrid:appearance:v1']` | 设置页「恢复全部默认」 |
| 自定义图片 | IndexedDB `timegrid-atmosphere` | 设置页逐张删除 |
| 开场页标记 | `localStorage['timegrid:atmosphere:welcomed']` | 删掉即会再次出现 |

## 六、后续可扩展点（未实现）

- **桌面端自动扫描素材目录**：Electron 可以在 `%APPDATA%\my-plan-calendar\characters\<包名>\` 下读取
  `config.json` + 同结构图片，实现"复制文件夹即加载"。当前版本通过设置页导入，接口
  （`addAsset` / `getAssetUrl` / `groupId` + `state`）已经就绪，接一个 IPC 扫描即可复用全部渲染逻辑。
- **角色包 config.json**：可携带位置/尺寸/默认状态等偏好，目前这些在设置页里调。
- **主题包**：`src/styles/theme-*.css` + `themes.ts` 一条元数据即可新增第七套主题。

## 七、性能与降级

| 场景 | 行为 |
|---|---|
| 图片解码 | 用 object URL 缓存，同一素材只解码一次；切换素材不会重复读取 |
| 低性能设备 / 掉帧 | `data-perf="low"`：停粒子、去模糊、停角色待机动画（功能不受影响） |
| 减少动态效果 | 系统 `prefers-reduced-motion` 时同样降级 |
| 素材缺失 | 取不到图时整层不渲染，界面照常可用 |
| 8MB 上限 | 超过直接拒绝并提示，避免撑爆存储配额 |

---

# 第三轮：用你自己的图（三条路径，2026-10-22 下午）

内置立绘是项目自己画的原创同人风演绎，**不是官方素材**，也不可能是官方水准。
想要"一眼就是原作"的效果，直接把真图喂给软件即可 —— 现在有三条路：

## 路径 1：粘贴图片链接（最快）

设置 → 外观与个性化 → 角色库 → **从链接添加** → 粘贴图片直链 → 添加。

- 会先尝试 `fetch`，跨域被拦时退回 `img + canvas`；两者都不行会明确告诉你"请存到本地"
- 单张 ≤ 8MB，支持 PNG / WebP / JPG / GIF
- 图片只存在本机 IndexedDB，不上传

## 路径 2：导入角色文件夹（多表情）

```
characters/
  feng_baobao/
    manifest.json
    full_body.png
    happy.png
    thinking.png
```

设置 → 角色库 → **导入角色包** → 选中整个 `characters` 文件夹。
展示图优先级 `full_body > half_body > portrait > preview`，表情图按文件名绑定状态。

## 路径 3：桌面版自动扫描（拷进去就有）

打包版会自动扫描：

```
%APPDATA%\my-plan-calendar\characters\<包名>\manifest.json + 图片
```

把下载好的角色文件夹拷进这个目录，重启软件就出现在角色库里，不用再点导入。
（实现：主进程 `packs:scan` 读取目录 → 渲染进程写入 IndexedDB；单张上限 6MB）

## 关于内置立绘

- 现在的内置立绘按**作品分系列**：一人之下=国漫水墨、虹猫蓝兔=武侠、机甲系=硬边几何、果宝=高饱和赛璐璐、童年系=明亮卡通
- 每个角色独立构图（不再共用头身模板），但**仍然是同人风演绎，不是官方画**
- 如果你用上面任一方式导入了真图，角色卡、详情页、首页陪伴位都会优先用你的图
- 官方角色图的著作权属于原作品方，因此不会被打进公开仓库的 Release；本地导入不受影响
