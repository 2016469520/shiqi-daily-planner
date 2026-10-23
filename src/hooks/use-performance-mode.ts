'use client'

// ============================================================
// 低性能模式探测
//
// 不追求精确的 CPU 读数，只用三个便宜的信号：
// 1. 设备并发线程数 / 内存（能拿到就用）
// 2. 连续 45 帧的 rAF 平均耗时（反映真实掉帧）
// 3. 页面隐藏时暂停动画（浏览器已自动降频，这里只是标记）
//
// 触发后给 <html> 加 data-perf="low"，CSS 会停掉粒子与模糊类重效果。
// 注意：不会降级业务功能，只降装饰。
// ============================================================

import { useEffect } from 'react'

const SLOW_FRAME_MS = 26 // 约 38fps 以下
const SAMPLE_FRAMES = 45

function deviceLooksWeak(): boolean {
  if (typeof navigator === 'undefined') return false
  const cores = navigator.hardwareConcurrency ?? 8
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8
  return cores <= 4 || memory <= 4
}

export function usePerformanceMode(): void {
  useEffect(() => {
    if (typeof window === 'undefined') return
    const root = document.documentElement

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || deviceLooksWeak()) {
      root.dataset.perf = 'low'
    }

    let frames = 0
    let total = 0
    let last = performance.now()
    let raf = 0
    let stopped = false

    const step = (now: number) => {
      const delta = now - last
      last = now
      // 页面切走再回来会有一个巨大的 delta，丢掉不算
      if (delta > 0 && delta < 200) {
        total += delta
        frames += 1
      }
      if (frames >= SAMPLE_FRAMES) {
        const avg = total / frames
        if (avg > SLOW_FRAME_MS) root.dataset.perf = 'low'
        stopped = true
        return
      }
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)

    return () => {
      if (!stopped) cancelAnimationFrame(raf)
    }
  }, [])
}
