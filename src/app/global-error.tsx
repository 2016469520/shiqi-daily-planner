'use client'

import { useEffect } from 'react'

/**
 * 根级兜底：布局或全局 Provider 渲染出错时，至少给出可操作的界面，
 * 而不是一个白窗口（0.3.1 的无限重渲染就是白屏）。
 *
 * 这里不能用 globals.css 的令牌：根布局已经崩了，样式表可能没加载。
 * 因此用内联样式 + 系统字体，并对 prefers-color-scheme 做适配。
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // 方便用户反馈时截图/复制
    console.error('[时格] 渲染出错：', error)
  }, [error])

  return (
    <html lang="zh-CN">
      <head>
        <style>{`
          :root {
            --bg: #f7f6fb;
            --card: #ffffff;
            --fg: #23222b;
            --muted: #6b6a76;
            --border: #e4e2ec;
            --primary: #6b4fd8;
            --primary-fg: #ffffff;
            --pre-bg: #f6f5fa;
          }
          @media (prefers-color-scheme: dark) {
            :root {
              --bg: #17161d;
              --card: #201f28;
              --fg: #efedf5;
              --muted: #a3a1ae;
              --border: #322f3d;
              --primary: #a48bff;
              --primary-fg: #1b1726;
              --pre-bg: #26242f;
            }
          }
          html, body { margin: 0; min-height: 100%; }
          body {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            background: var(--bg);
            color: var(--fg);
            font-family: system-ui, -apple-system, "Segoe UI", "Microsoft YaHei", Roboto, sans-serif;
          }
          .card {
            width: 100%;
            max-width: 460px;
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 18px 40px -24px rgba(35, 30, 60, 0.35);
          }
          h1 { margin: 0 0 8px; font-size: 18px; letter-spacing: -0.01em; }
          p { margin: 0 0 16px; font-size: 13px; line-height: 1.7; color: var(--muted); }
          pre {
            margin: 0 0 16px;
            padding: 12px;
            max-height: 140px;
            overflow: auto;
            background: var(--pre-bg);
            border: 1px solid var(--border);
            border-radius: 8px;
            font-size: 11px;
            line-height: 1.6;
            white-space: pre-wrap;
            word-break: break-word;
            font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          }
          .actions { display: flex; gap: 8px; }
          button {
            flex: 1;
            height: 34px;
            font-size: 13px;
            border-radius: 8px;
            cursor: pointer;
            border: 1px solid var(--border);
            background: transparent;
            color: var(--fg);
            transition: opacity 140ms ease, background-color 140ms ease;
          }
          button:hover { opacity: 0.86; }
          button.primary {
            border-color: transparent;
            background: var(--primary);
            color: var(--primary-fg);
            font-weight: 500;
          }
          button:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
        `}</style>
      </head>
      <body>
        <div className="card">
          <h1>界面出了点问题</h1>
          <p>
            数据都还在本机，没有丢失。可以先点「重新加载」；如果反复出现，把下面的错误信息发给我。
          </p>

          <pre>
            {String(error?.message || error)}
            {error?.digest ? `\n\ndigest: ${error.digest}` : ''}
          </pre>

          <div className="actions">
            <button type="button" className="primary" onClick={() => reset()}>
              重新加载
            </button>
            <button type="button" onClick={() => window.location.reload()}>
              刷新页面
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
