// ============================================================
// 留白 Minimal · 原创场景美术
// ------------------------------------------------------------
// 黑白摄影的取景方式：只用灰阶，靠明度分层，不描边、不加装饰。
// 三张画面都把主体压在下半幅，上半幅留出大片空气给应用内容。
//
// 渐变 id 统一用 mn- 前缀；这里不使用彩色，也不使用模糊滤镜，
// 柔和感全部来自灰阶渐变本身，保证山脊与楼群的边缘干净。
// ============================================================

import type { SceneArt } from './types'

export const MINIMAL_SCENES: Record<string, SceneArt> = {
  // ----------------------------------------------------------
  // 黑白山脊（浅调）
  // 三层山脊，明度从 #e4e4e4 压到 #adadad，峰谷位置彼此错开。
  // 层间薄雾拉开距离，底部雾带把山谷化进留白。
  // ----------------------------------------------------------
  'minimal-ridge': ({ className }) => (
    <svg
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="mn-ridge-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fdfdfd" />
          <stop offset="0.62" stopColor="#f7f7f7" />
          <stop offset="1" stopColor="#efefef" />
        </linearGradient>
        <linearGradient id="mn-ridge-haze" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.5" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="mn-ridge-fog" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="0.55" stopColor="#ffffff" stopOpacity="0.86" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="1" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="1440" height="900" fill="url(#mn-ridge-sky)" />

      {/* 远山：最浅的一层 */}
      <path
        fill="#e4e4e4"
        d="M -20 500 L 90 460 L 170 470 L 280 356 L 340 390 L 410 350 L 490 430 L 560 400 L 640 456 L 740 330 L 810 380 L 880 344 L 960 420 L 1040 392 L 1120 448 L 1200 410 L 1290 448 L 1370 372 L 1440 420 L 1460 410 L 1460 720 L -20 720 Z"
      />

      {/* 层间薄雾：让远山的下半段退到空气里 */}
      <rect x="0" y="330" width="1440" height="230" fill="url(#mn-ridge-haze)" />

      {/* 中山：峰位右移，和远山错开 */}
      <path
        fill="#cccccc"
        d="M -20 620 L 70 600 L 160 610 L 260 520 L 330 556 L 410 536 L 490 592 L 580 566 L 670 604 L 760 498 L 830 540 L 910 520 L 990 584 L 1080 548 L 1170 596 L 1260 570 L 1350 606 L 1440 586 L 1460 592 L 1460 820 L -20 820 Z"
      />

      {/* 近山：最深的一层，边界必须干净 */}
      <path
        fill="#adadad"
        d="M -20 740 L 80 720 L 180 732 L 290 632 L 370 672 L 450 648 L 540 700 L 630 672 L 720 712 L 810 616 L 890 660 L 980 630 L 1070 690 L 1160 654 L 1250 700 L 1340 668 L 1430 704 L 1460 696 L 1460 900 L -20 900 Z"
      />

      {/* 谷雾：把近山的下半段化进留白 */}
      <rect x="0" y="700" width="1440" height="200" fill="url(#mn-ridge-fog)" />
    </svg>
  ),

  // ----------------------------------------------------------
  // 雾湖（浅调）
  // 一条地平线、一片低透明度的对岸山影、一片几乎空白的湖面。
  // 全画面只有一条水平反光带，没有别的装饰。
  // ----------------------------------------------------------
  'minimal-lake': ({ className }) => (
    <svg
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="mn-lake-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fefefe" />
          <stop offset="0.7" stopColor="#f9f9f9" />
          <stop offset="1" stopColor="#f6f6f6" />
        </linearGradient>
        <linearGradient id="mn-lake-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#eaeaea" />
          <stop offset="0.12" stopColor="#f4f4f4" />
          <stop offset="0.5" stopColor="#fafafa" />
          <stop offset="1" stopColor="#fdfdfd" />
        </linearGradient>
        <linearGradient id="mn-lake-shore" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8f8f8f" stopOpacity="0.3" />
          <stop offset="0.55" stopColor="#8f8f8f" stopOpacity="0.16" />
          <stop offset="1" stopColor="#8f8f8f" stopOpacity="0.03" />
        </linearGradient>
        <radialGradient id="mn-lake-shine" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.45" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect x="0" y="0" width="1440" height="490" fill="url(#mn-lake-sky)" />

      {/* 对岸山影：低透明度，山脚用渐变溶进水面 */}
      <path
        fill="url(#mn-lake-shore)"
        d="M -20 490 L -20 440 L 50 428 L 110 380 L 170 410 L 240 330 L 300 372 L 370 350 L 440 402 L 510 372 L 580 414 L 650 360 L 720 396 L 790 344 L 860 390 L 930 370 L 1000 418 L 1080 386 L 1150 350 L 1220 388 L 1290 366 L 1360 404 L 1430 380 L 1460 388 L 1460 490 Z"
      />

      {/* 湖面：只比天空深一点点 */}
      <rect x="0" y="490" width="1440" height="410" fill="url(#mn-lake-water)" />

      {/* 唯一的一条水平反光带：柔边椭圆，避免变成一条硬线 */}
      <ellipse cx="720" cy="512" rx="660" ry="24" fill="url(#mn-lake-shine)" />
    </svg>
  ),

  // ----------------------------------------------------------
  // 城市天际线（浅调）
  // 楼群只占下方三分之一：远层 21 栋、近层 16 栋，窗格极少。
  // 上方是干净的晨雾渐变，远层被雾压淡，近层保持锐利。
  // ----------------------------------------------------------
  'minimal-skyline': ({ className }) => (
    <svg
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="mn-skyline-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.55" stopColor="#f7f7f7" />
          <stop offset="1" stopColor="#efefef" />
        </linearGradient>
        <linearGradient id="mn-skyline-fog" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="0.45" stopColor="#ffffff" stopOpacity="0.62" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="1440" height="900" fill="url(#mn-skyline-sky)" />

      {/* 远层楼群：浅灰，密度高，个别塔楼从近层的缝里探出来 */}
      <g fill="#d4d4d4">
        <path d="M 0 900 L 0 680 L 58 680 L 58 900 Z" />
        <path d="M 70 900 L 70 648 L 128 648 L 128 900 Z" />
        <path d="M 140 900 L 140 690 L 206 690 L 206 900 Z" />
        <path d="M 220 900 L 220 622 L 272 622 L 272 900 Z" />
        <path d="M 286 900 L 286 672 L 344 672 L 344 900 Z" />
        <path d="M 358 900 L 358 636 L 414 636 L 414 900 Z" />
        <path d="M 428 900 L 428 684 L 486 684 L 486 900 Z" />
        <path d="M 500 900 L 500 656 L 552 656 L 552 900 Z" />
        <path d="M 566 900 L 566 692 L 620 692 L 620 900 Z" />
        <path d="M 634 900 L 634 640 L 690 640 L 690 900 Z" />
        <path d="M 704 900 L 704 676 L 756 676 L 756 900 Z" />
        <path d="M 770 900 L 770 650 L 826 650 L 826 900 Z" />
        <path d="M 840 900 L 840 694 L 894 694 L 894 900 Z" />
        <path d="M 908 900 L 908 628 L 962 628 L 962 900 Z" />
        <path d="M 976 900 L 976 668 L 1034 668 L 1034 900 Z" />
        <path d="M 1048 900 L 1048 646 L 1104 646 L 1104 900 Z" />
        <path d="M 1118 900 L 1118 682 L 1172 682 L 1172 900 Z" />
        <path d="M 1186 900 L 1186 654 L 1240 654 L 1240 900 Z" />
        <path d="M 1254 900 L 1254 694 L 1306 694 L 1306 900 Z" />
        <path d="M 1320 900 L 1320 642 L 1370 642 L 1370 900 Z" />
        <path d="M 1384 900 L 1384 674 L 1440 674 L 1440 900 Z" />
      </g>

      {/* 晨雾：横在远层楼脚，近层画在雾之上 */}
      <rect x="0" y="530" width="1440" height="250" fill="url(#mn-skyline-fog)" />

      {/* 近层楼群：深灰，轮廓压住底边；两栋带退台 */}
      <g fill="#8d8d8d">
        <path d="M 20 900 L 20 660 L 96 660 L 96 900 Z" />
        <path d="M 110 900 L 110 616 L 214 616 L 214 900 Z" />
        <path d="M 228 900 L 228 672 L 300 672 L 300 900 Z" />
        <path d="M 316 900 L 316 640 L 326 640 L 326 600 L 390 600 L 390 640 L 400 640 L 400 900 Z" />
        <path d="M 414 900 L 414 646 L 470 646 L 470 900 Z" />
        <path d="M 486 900 L 486 664 L 566 664 L 566 900 Z" />
        <path d="M 584 900 L 584 628 L 640 628 L 640 900 Z" />
        <path d="M 700 900 L 700 684 L 790 684 L 790 900 Z" />
        <path d="M 806 900 L 806 650 L 878 650 L 878 900 Z" />
        <path d="M 894 900 L 894 660 L 906 660 L 906 620 L 950 620 L 950 660 L 962 660 L 962 900 Z" />
        <path d="M 978 900 L 978 670 L 1046 670 L 1046 900 Z" />
        <path d="M 1062 900 L 1062 634 L 1140 634 L 1140 900 Z" />
        <path d="M 1156 900 L 1156 682 L 1224 682 L 1224 900 Z" />
        <path d="M 1240 900 L 1240 656 L 1310 656 L 1310 900 Z" />
        <path d="M 1326 900 L 1326 612 L 1400 612 L 1400 900 Z" />
        <path d="M 1414 900 L 1414 660 L 1440 660 L 1440 900 Z" />
      </g>

      {/* 少量亮着的窗格：只落在四栋高楼上 */}
      <g fill="#f4f4f4" opacity="0.55">
        <rect x="340" y="628" width="9" height="13" />
        <rect x="368" y="628" width="9" height="13" />
        <rect x="340" y="668" width="9" height="13" />
        <rect x="368" y="668" width="9" height="13" />

        <rect x="918" y="646" width="9" height="13" />
        <rect x="936" y="646" width="9" height="13" />
        <rect x="918" y="684" width="9" height="13" />
        <rect x="936" y="684" width="9" height="13" />

        <rect x="1346" y="640" width="9" height="13" />
        <rect x="1378" y="640" width="9" height="13" />

        <rect x="1260" y="684" width="9" height="13" />
        <rect x="1288" y="684" width="9" height="13" />
      </g>
    </svg>
  ),
}
