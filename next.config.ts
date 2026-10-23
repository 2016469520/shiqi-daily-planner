import type { NextConfig } from "next";

/**
 * BUILD_STATIC=1 时输出可离线运行的静态站点（out/），用于打包桌面端与安卓端。
 * 静态导出不支持 headers()，因此只在非静态构建时注入安全响应头。
 */
const isStaticExport = process.env.BUILD_STATIC === "1";

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
];

const nextConfig: NextConfig = {
  ...(isStaticExport
    ? {
        output: "export" as const,
        // 静态托管没有图片优化服务
        images: { unoptimized: true },
        // 生成 /calendar/index.html，便于 WebView 与应用内协议按路径取文件
        trailingSlash: true,
      }
    : {
        async headers() {
          return [
            {
              source: "/(.*)",
              headers: securityHeaders,
            },
            {
              source: "/sw.js",
              headers: [
                ...securityHeaders,
                {
                  key: "Service-Worker-Allowed",
                  value: "/",
                },
              ],
            },
          ];
        },
      }),
};

export default nextConfig;
