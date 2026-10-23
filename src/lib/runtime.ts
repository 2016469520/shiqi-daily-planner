/**
 * 运行环境判定。
 *
 * 打包成桌面/安卓本地应用时，构建命令会注入 NEXT_PUBLIC_LOCAL_ONLY=1：
 * - 应用启动即进入本地模式（无需登录、不连任何服务器）
 * - 隐藏云端/账号相关入口
 * - 数据保存在本机 IndexedDB
 *
 * 网页版不注入该变量，仍保留 Supabase 云端模式（配置了环境变量时）。
 */
export const IS_LOCAL_ONLY = process.env.NEXT_PUBLIC_LOCAL_ONLY === '1'

/** 当前构建是否真的具备云端能力 */
export const HAS_CLOUD =
  !IS_LOCAL_ONLY &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/** 本地模式下的数据载体描述，用于设置页文案 */
export const LOCAL_STORAGE_LABEL = '本机数据库（IndexedDB）'
