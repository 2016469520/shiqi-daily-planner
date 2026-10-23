# 冯宝宝素材包 · 来源与权利说明

**这不是官方素材。**

- 角色「冯宝宝」出自《一人之下》，著作权归原作者 **米二** 及权利方所有
- 本目录里的图片是根据公开图像二次处理的同人向裁切图（去背景、去字幕），不是官方立绘，也没有得到官方授权
- 许可范围：**个人、非商业**用途（自用桌宠/看板娘）
- 本仓库的代码许可以根目录 `LICENSE` 为准；**本目录的图片不适用该许可**

## 如果权利方要求下架

删除整个 `public/characters/feng_baobao/` 目录，然后：

```bash
node scripts/verify-bundled-packs.mjs
npm run build:static
```

重新构建后，新安装包里就不会再有这些图片。

## 文件说明

| 文件 | 用途 |
|---|---|
| `half_body.webp` | 待机态（默认展示图） |
| `happy.png` / `thinking.webp` / `working.webp` / `error.png` / `sleepy.png` | 其余五种状态 |
| `preview.webp` | 列表缩略图 |
| `expressions/expr1-9.webp` | 9 张原始表情，运行时未使用，供替换/二次加工 |
| `poses/*.webp` | 13 张动作参考，运行时未使用 |

运行时语言（台词）在 `manifest.json` 的 `dialogue` 字段，与图片分离。
