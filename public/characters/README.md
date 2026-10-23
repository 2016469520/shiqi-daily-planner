# characters/ — 随包分发的角色素材

这个目录里的每个子文件夹都会被打包进安装包，**新用户第一次打开就能在角色库里看到**。

## 加一个内置角色包

1. 建目录 `public/characters/<包名>/`
2. 放入 `manifest.json`（`name` 必填，并且必须写 `"redistribution_allowed": true`）
3. 放入图片：`half_body.webp`（或 `full_body` / `portrait` / `preview`）+ 需要的状态图
   `happy / thinking / working / error / sleepy / idle`（png / webp / jpg）
4. 运行 `node scripts/verify-bundled-packs.mjs` 生成 `index.json`
5. `npm run build:static` 后重新打包

## 硬性要求

- `manifest.json` 必须写 `"redistribution_allowed": true`，否则生成脚本会报错并拒绝加入索引
- 只有**你自己拥有版权、或明确允许再分发**的素材才能放这里
- 第三方作品的角色图（官方立绘、截图、转载插画）**不能**放进来，即使只是同人二创
- 用户自己的素材不要放这里：放到 `%APPDATA%\my-plan-calendar\characters\`，本机生效

## 校验

```bash
node scripts/verify-bundled-packs.mjs --check   # 只检查，不改文件
node scripts/verify-bundled-packs.mjs           # 检查并更新 index.json
```
