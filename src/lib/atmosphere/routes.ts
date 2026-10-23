// ============================================================
// 首页判定
//
// 站点开启了 trailingSlash，usePathname() 返回的是 "/schedule/" 而不是
// "/schedule"，所以这里必须用前缀匹配，否则"只在首页出现"的判断永远不成立。
// ============================================================

export function isHomePath(pathname: string | null | undefined): boolean {
  if (!pathname) return false
  const normalized = pathname.replace(/\/+$/, '') || '/'
  return normalized === '/schedule' || normalized === '/today'
}
