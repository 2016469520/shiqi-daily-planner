// ============================================================
// 云母 Fluent · 原创场景美术
// ------------------------------------------------------------
// 三张画面共用 1440×900 画布，按 cover 方式铺满整页。
// 构图都遵循"上轻下重、中心留白"：主体压在下三分之一，
// 上部只留一条光带或一片干净的空气，应用内容压在中间也不会打架。
//
// 渐变 / 滤镜 id 统一用 fl- 前缀，避免与其他主题文件冲突。
// 纯 SVG 原语，无外部资源、无状态、无随机数。
// ============================================================

import type { SceneArt } from './types'

export const FLUENT_SCENES: Record<string, SceneArt> = {
  // ----------------------------------------------------------
  // 极光山峦（中调）
  // 深蓝夜空 → 两道青绿到紫的极光 → 四层由浅到深的雪线山脊。
  // 唯一的模糊只作用在极光带上，山脊边缘保持锐利。
  // ----------------------------------------------------------
  'fluent-aurora': ({ className }) => (
    <svg
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="fl-aurora-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#122c44" />
          <stop offset="0.34" stopColor="#1d4764" />
          <stop offset="0.68" stopColor="#4d7d99" />
          <stop offset="1" stopColor="#a3c8dc" />
        </linearGradient>
        <linearGradient id="fl-aurora-band" x1="0" y1="0" x2="1" y2="0.08">
          <stop offset="0" stopColor="#5eead4" stopOpacity="0" />
          <stop offset="0.16" stopColor="#5eead4" stopOpacity="0.55" />
          <stop offset="0.44" stopColor="#6ee7b7" stopOpacity="0.6" />
          <stop offset="0.7" stopColor="#a5b4fc" stopOpacity="0.5" />
          <stop offset="0.88" stopColor="#c4b5fd" stopOpacity="0.34" />
          <stop offset="1" stopColor="#c4b5fd" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="fl-aurora-mist" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d9eef9" stopOpacity="0" />
          <stop offset="0.62" stopColor="#d9eef9" stopOpacity="0.38" />
          <stop offset="1" stopColor="#d9eef9" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="fl-aurora-ridge-mid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6b93ad" />
          <stop offset="1" stopColor="#4a7089" />
        </linearGradient>
        <linearGradient id="fl-aurora-ridge-near" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#365d78" />
          <stop offset="1" stopColor="#264862" />
        </linearGradient>
        <linearGradient id="fl-aurora-ridge-front" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1a3a51" />
          <stop offset="1" stopColor="#0e2537" />
        </linearGradient>
        <filter id="fl-aurora-soft" x="-10%" y="-70%" width="120%" height="240%">
          <feGaussianBlur stdDeviation="16" />
        </filter>
        <clipPath id="fl-aurora-far-clip">
          <path d="M -20 560 L 100 470 L 160 496 L 250 402 L 310 444 L 380 414 L 430 470 L 520 430 L 590 486 L 690 356 L 760 420 L 830 390 L 900 452 L 980 410 L 1060 466 L 1150 428 L 1240 460 L 1320 372 L 1390 430 L 1460 412 L 1460 720 L -20 720 Z" />
        </clipPath>
      </defs>

      {/* 夜空：顶部深蓝，接近地平线时转成雾蓝 */}
      <rect x="0" y="0" width="1440" height="720" fill="url(#fl-aurora-sky)" />

      {/* 星：只留几颗，亮度低于极光 */}
      <g fill="#eaf6ff">
        <circle cx="140" cy="96" r="1.5" opacity="0.7" />
        <circle cx="268" cy="168" r="1.1" opacity="0.45" />
        <circle cx="452" cy="84" r="1.6" opacity="0.65" />
        <circle cx="620" cy="140" r="1.2" opacity="0.4" />
        <circle cx="822" cy="102" r="1.5" opacity="0.7" />
        <circle cx="1010" cy="196" r="1.1" opacity="0.42" />
        <circle cx="1196" cy="88" r="1.7" opacity="0.6" />
        <circle cx="1340" cy="150" r="1.2" opacity="0.5" />
      </g>

      {/* 极光：两条宽光带，模糊只作用在这块带状区域 */}
      <g filter="url(#fl-aurora-soft)">
        <path
          fill="url(#fl-aurora-band)"
          opacity="0.72"
          d="M -60 262 C 160 168 340 296 560 226 C 760 162 900 256 1080 202 C 1220 160 1340 218 1500 180 L 1500 258 C 1340 296 1220 238 1080 280 C 900 334 760 240 560 304 C 340 374 160 242 -60 336 Z"
        />
        <path
          fill="url(#fl-aurora-band)"
          opacity="0.46"
          d="M -60 152 C 180 84 360 178 560 118 C 720 70 840 154 1000 118 C 1140 86 1260 144 1420 112 L 1420 154 C 1260 186 1140 128 1000 160 C 840 196 720 112 560 160 C 360 220 180 128 -60 198 Z"
        />
      </g>

      {/* 第一层山脊：最浅，山顶压着雪线 */}
      <path
        fill="#8fb3c8"
        d="M -20 560 L 100 470 L 160 496 L 250 402 L 310 444 L 380 414 L 430 470 L 520 430 L 590 486 L 690 356 L 760 420 L 830 390 L 900 452 L 980 410 L 1060 466 L 1150 428 L 1240 460 L 1320 372 L 1390 430 L 1460 412 L 1460 720 L -20 720 Z"
      />
      <g clipPath="url(#fl-aurora-far-clip)">
        <path
          fill="#f7fdff"
          opacity="0.9"
          d="M -20 300 L 1460 300 L 1460 466 C 1370 492 1270 452 1170 480 C 1060 510 980 458 880 486 C 780 514 710 456 610 486 C 510 516 430 462 330 492 C 230 522 110 470 -20 486 Z"
        />
      </g>

      {/* 谷雾：把第一层与第二层分开，制造空气感 */}
      <rect x="0" y="560" width="1440" height="230" fill="url(#fl-aurora-mist)" />

      {/* 第二层山脊 */}
      <path
        fill="url(#fl-aurora-ridge-mid)"
        d="M -20 660 L 120 610 L 260 556 L 360 596 L 500 548 L 620 600 L 760 566 L 900 612 L 1040 552 L 1160 600 L 1300 574 L 1460 616 L 1460 880 L -20 880 Z"
      />

      {/* 第三层山脊 */}
      <path
        fill="url(#fl-aurora-ridge-near)"
        d="M -20 780 L 150 716 L 300 670 L 440 724 L 600 690 L 760 742 L 920 700 L 1080 750 L 1240 706 L 1380 744 L 1460 726 L 1460 900 L -20 900 Z"
      />

      {/* 第四层山脊：画面最重的墨蓝，压住底边 */}
      <path
        fill="url(#fl-aurora-ridge-front)"
        d="M -20 848 C 120 826 240 834 380 818 C 520 802 640 826 780 830 C 920 834 1060 816 1200 822 C 1320 828 1400 838 1460 834 L 1460 900 L -20 900 Z"
      />
    </svg>
  ),

  // ----------------------------------------------------------
  // 柔光沙丘（浅调）
  // 上半幅是干净的天空与右侧低太阳，下半幅三条沙丘曲线。
  // 一道斜光带从右上方切下来；沙纹只落在近处沙丘的受光面上。
  // ----------------------------------------------------------
  'fluent-dunes': ({ className }) => (
    <svg
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="fl-dunes-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fdf8ee" />
          <stop offset="0.58" stopColor="#fbf0dd" />
          <stop offset="1" stopColor="#f8e7ca" />
        </linearGradient>
        <radialGradient id="fl-dunes-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fffdf7" stopOpacity="0.9" />
          <stop offset="0.45" stopColor="#fff4de" stopOpacity="0.5" />
          <stop offset="1" stopColor="#fff4de" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="fl-dunes-sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fffefb" />
          <stop offset="0.55" stopColor="#fff9ea" stopOpacity="0.95" />
          <stop offset="1" stopColor="#fff6e2" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="fl-dunes-beam" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fffdf6" stopOpacity="0" />
          <stop offset="0.42" stopColor="#fffdf6" stopOpacity="0.5" />
          <stop offset="0.58" stopColor="#fffdf6" stopOpacity="0.5" />
          <stop offset="1" stopColor="#fffdf6" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="fl-dunes-far" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f8e8d1" />
          <stop offset="1" stopColor="#eed3b0" />
        </linearGradient>
        <linearGradient id="fl-dunes-mid" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f0d6b1" />
          <stop offset="1" stopColor="#dfb988" />
        </linearGradient>
        <linearGradient id="fl-dunes-near" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e8c99a" />
          <stop offset="1" stopColor="#cfa066" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="1440" height="700" fill="url(#fl-dunes-sky)" />

      {/* 右侧低太阳：一个大光晕 + 一个软边日轮 */}
      <circle cx="1170" cy="150" r="340" fill="url(#fl-dunes-glow)" />
      <circle cx="1170" cy="150" r="84" fill="url(#fl-dunes-sun)" />

      {/* 三条沙丘：暖米 → 浅金，明度层层向前递进，底边互相叠住 */}
      <path
        fill="url(#fl-dunes-far)"
        d="M -30 500 C 120 470 280 486 440 476 C 600 466 720 440 880 452 C 1010 462 1120 486 1240 478 C 1330 472 1420 458 1470 464 L 1470 660 L -30 660 Z"
      />

      <path
        fill="url(#fl-dunes-mid)"
        d="M -30 636 C 120 592 280 566 440 584 C 600 602 720 646 880 632 C 1020 620 1130 578 1270 590 C 1360 598 1430 610 1470 604 L 1470 800 L -30 800 Z"
      />

      <path
        fill="url(#fl-dunes-near)"
        d="M -30 792 C 130 720 300 686 470 708 C 650 732 780 786 950 760 C 1110 736 1270 696 1470 724 L 1470 900 L -30 900 Z"
      />

      {/* 沙纹：极淡，只画在近处沙丘的受光面 */}
      <g fill="none" stroke="#fffaf0" strokeWidth="2" opacity="0.18">
        <path d="M 180 792 C 340 764 500 772 660 758" />
        <path d="M 520 842 C 680 814 840 822 1000 802" />
        <path d="M 900 874 C 1040 850 1180 856 1320 834" />
      </g>

      {/* 斜射光带：长条沿光线方向旋转，横向用渐变淡出，没有硬边 */}
      <rect
        x="-140"
        y="-700"
        width="280"
        height="1400"
        fill="url(#fl-dunes-beam)"
        opacity="0.55"
        transform="translate(1000 380) rotate(42)"
      />
    </svg>
  ),

  // ----------------------------------------------------------
  // 晨光几何（浅调）
  // 抽象海报：左上四分之一圆、右侧两块大圆角面板、一道斜光带。
  // 形状都推到边缘，中间留白给应用内容。
  // ----------------------------------------------------------
  'fluent-morning': ({ className }) => (
    <svg
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="fl-morning-base" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.52" stopColor="#f2f8ff" />
          <stop offset="1" stopColor="#e0ecfb" />
        </linearGradient>
        <radialGradient id="fl-morning-halo" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="0.5" stopColor="#eef6ff" stopOpacity="0.5" />
          <stop offset="1" stopColor="#dbeafe" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="fl-morning-orb" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d3e5fa" />
          <stop offset="1" stopColor="#b3cfee" />
        </linearGradient>
        <linearGradient id="fl-morning-panel" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d3e5fa" />
          <stop offset="1" stopColor="#b6d2f0" />
        </linearGradient>
        <linearGradient id="fl-morning-panel-inner" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.68" />
          <stop offset="1" stopColor="#e9f3fe" stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id="fl-morning-slab" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#dfecfc" />
          <stop offset="1" stopColor="#c3daf5" />
        </linearGradient>
        <linearGradient id="fl-morning-shaft" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="0.3" stopColor="#ffffff" stopOpacity="0.42" />
          <stop offset="0.66" stopColor="#ffffff" stopOpacity="0.52" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="1440" height="900" fill="url(#fl-morning-base)" />

      {/* 右上柔光斑 */}
      <circle cx="1150" cy="120" r="420" fill="url(#fl-morning-halo)" />

      {/* 左上的大圆：只露出一个角，读作构图而不是月亮 */}
      <circle cx="60" cy="30" r="340" fill="url(#fl-morning-orb)" />

      {/* 右侧两块大圆角面板，旋转出一点海报的斜势 */}
      <rect
        x="1040"
        y="260"
        width="520"
        height="760"
        rx="120"
        fill="url(#fl-morning-panel)"
        transform="rotate(-10 1280 640)"
      />
      <rect
        x="1150"
        y="450"
        width="330"
        height="380"
        rx="82"
        fill="url(#fl-morning-panel-inner)"
        transform="rotate(-10 1315 640)"
      />

      {/* 左下的大圆角板：把画面重量拉回左侧，中心保持空 */}
      <rect
        x="-150"
        y="680"
        width="520"
        height="380"
        rx="110"
        fill="url(#fl-morning-slab)"
        transform="rotate(5 -150 870)"
      />

      {/* 斜向光带：穿过中心但只有白色半透明，不挡内容 */}
      <path
        fill="url(#fl-morning-shaft)"
        opacity="0.9"
        d="M 250 900 L 500 900 L 1240 0 L 990 0 Z"
      />
    </svg>
  ),
}
