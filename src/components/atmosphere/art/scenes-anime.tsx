// ============================================================
// 日系二次元场景（原创 SVG，纯静态、无外部资源）
//
// 1. 樱花街道：低机位看上坡小路，两侧房屋与樱花树冠沿透视收窄，
//    近景树冠压暗压实在画面上下两角，远景房屋褪成粉灰，飘落花瓣铺一层粉。
// 2. 日落城市：天台栏杆在前景，中景楼群用两套暖光窗 pattern 点亮，
//    巨大夕阳压在楼群后面，晚霞从橘到粉再到紫分四层渐变。
// 3. 星空：银河用多层低透明椭圆叠出，星点用两套 pattern 铺满天空，
//    山脊、小镇灯火和近景山丘把深蓝压到墨紫，另有三颗流星。
//
// 所有 id 统一使用 an-sak- / an-sun- / an-star- 前缀，避免六套主题同时渲染时冲突。
// ============================================================

import type { SceneArt } from './types'

// ------------------------------------------------------------
// 樱花街道
// ------------------------------------------------------------
const sakuraStreet: SceneArt = ({ className }) => (
  <svg
    viewBox="0 0 1440 900"
    preserveAspectRatio="xMidYMid slice"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="an-sak-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#cbe4fa" />
        <stop offset="42%" stopColor="#e6f0fa" />
        <stop offset="70%" stopColor="#f7eaf1" />
        <stop offset="100%" stopColor="#fdf3f2" />
      </linearGradient>
      <radialGradient id="an-sak-halo">
        <stop offset="0%" stopColor="#fffdf0" stopOpacity="0.9" />
        <stop offset="42%" stopColor="#fff3d8" stopOpacity="0.38" />
        <stop offset="100%" stopColor="#ffeccc" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="an-sak-bokeh">
        <stop offset="0%" stopColor="#fffdf6" stopOpacity="0.75" />
        <stop offset="55%" stopColor="#ffe9dc" stopOpacity="0.25" />
        <stop offset="100%" stopColor="#ffe4d8" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="an-sak-soft">
        <stop offset="0%" stopColor="#fbe2ec" stopOpacity="0.3" />
        <stop offset="55%" stopColor="#f8d2e1" stopOpacity="0.12" />
        <stop offset="100%" stopColor="#f8d2e1" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="an-sak-soft-fore">
        <stop offset="0%" stopColor="#e8a0ba" stopOpacity="0.28" />
        <stop offset="58%" stopColor="#e294b2" stopOpacity="0.1" />
        <stop offset="100%" stopColor="#e294b2" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="an-sak-road" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f9eef2" />
        <stop offset="55%" stopColor="#f4e2ea" />
        <stop offset="100%" stopColor="#eed6e1" />
      </linearGradient>
      <linearGradient id="an-sak-ground" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f6eff5" />
        <stop offset="100%" stopColor="#eee5ef" />
      </linearGradient>

      {/* 房屋：底边中点对齐地面，配合 translate/scale 复用 */}
      <g id="an-sak-house-a">
        <path d="M-100 0 L-100 -176 L100 -176 L100 0 Z" fill="#efe9f3" />
        <path d="M-100 0 L-100 -176 L-42 -176 L-42 0 Z" fill="#e3dbea" />
        <path d="M-118 -174 L0 -258 L118 -174 Z" fill="#d5c9e2" />
        <path d="M-118 -174 L0 -258 L0 -174 Z" fill="#c8bbd7" />
        <rect x="-94" y="-184" width="188" height="10" fill="#c5b7d5" />
        <rect x="-78" y="-152" width="38" height="44" rx="2" fill="#fdf2e2" opacity="0.6" />
        <rect x="-24" y="-152" width="38" height="44" rx="2" fill="#fdf2e2" opacity="0.48" />
        <rect x="30" y="-152" width="38" height="44" rx="2" fill="#fdf2e2" opacity="0.55" />
        <rect x="-78" y="-90" width="38" height="38" rx="2" fill="#f7e9f1" opacity="0.6" />
        <rect x="30" y="-90" width="38" height="38" rx="2" fill="#f7e9f1" opacity="0.6" />
        <rect x="-17" y="-48" width="36" height="48" rx="1" fill="#bda9c8" opacity="0.7" />
        <path d="M-100 -2 L100 -2 L100 6 L-100 6 Z" fill="#e6dbe8" opacity="0.8" />
      </g>
      <g id="an-sak-house-b">
        <path d="M-100 0 L-100 -176 L100 -176 L100 0 Z" fill="#e9edf7" />
        <path d="M-100 0 L-100 -176 L-44 -176 L-44 0 Z" fill="#dde4f2" />
        <path d="M-116 -174 L0 -252 L116 -174 Z" fill="#cfd8ea" />
        <path d="M-116 -174 L0 -252 L0 -174 Z" fill="#c3cde2" />
        <rect x="-78" y="-150" width="34" height="38" rx="2" fill="#fff8e8" opacity="0.6" />
        <rect x="26" y="-150" width="34" height="38" rx="2" fill="#fff8e8" opacity="0.5" />
        <rect x="-78" y="-92" width="34" height="34" rx="2" fill="#f6ebf2" opacity="0.55" />
        <rect x="26" y="-92" width="34" height="34" rx="2" fill="#f6ebf2" opacity="0.55" />
        <rect x="-16" y="-46" width="32" height="46" rx="1" fill="#c8bdd4" opacity="0.55" />
      </g>

      {/* 樱花树：底色暗、主色粉、高光近白，三层圆堆出蓬松树冠 */}
      <g id="an-sak-tree-a">
        <path d="M-9 2 C-7 -70 -8 -132 -5 -196 L5 -196 C8 -132 7 -70 9 2 Z" fill="#b98da1" />
        <path d="M-2 -150 C-26 -184 -50 -196 -74 -206" stroke="#b98da1" strokeWidth="10" strokeLinecap="round" fill="none" />
        <path d="M3 -168 C28 -198 48 -206 70 -214" stroke="#b98da1" strokeWidth="9" strokeLinecap="round" fill="none" />
        <g fill="url(#an-sak-soft)">
          <circle cx="0" cy="-272" r="112" />
          <circle cx="-86" cy="-252" r="82" />
          <circle cx="90" cy="-252" r="80" />
        </g>
        <g fill="#e9a6bf">
          <circle cx="0" cy="-220" r="76" />
          <circle cx="-70" cy="-234" r="58" />
          <circle cx="70" cy="-230" r="60" />
          <circle cx="-28" cy="-266" r="52" />
          <circle cx="34" cy="-264" r="50" />
        </g>
        <g fill="#f4bfd2">
          <circle cx="0" cy="-266" r="78" />
          <circle cx="-62" cy="-278" r="56" />
          <circle cx="64" cy="-274" r="54" />
          <circle cx="-20" cy="-316" r="48" />
          <circle cx="42" cy="-310" r="44" />
          <circle cx="0" cy="-338" r="30" />
          <circle cx="-58" cy="-236" r="30" />
          <circle cx="58" cy="-238" r="32" />
        </g>
        <g fill="#fbd8e4" opacity="0.85">
          <circle cx="-34" cy="-304" r="30" />
          <circle cx="30" cy="-290" r="26" />
          <circle cx="0" cy="-350" r="18" />
          <circle cx="-70" cy="-266" r="17" />
          <circle cx="66" cy="-260" r="16" />
        </g>
        <g fill="#fde9f0" opacity="0.9">
          <circle cx="-14" cy="-328" r="10" />
          <circle cx="52" cy="-298" r="9" />
          <circle cx="-84" cy="-248" r="8" />
        </g>
      </g>
      <g id="an-sak-tree-b">
        <path d="M-7 2 C-6 -60 -6 -120 -4 -170 L4 -170 C6 -120 5 -60 7 2 Z" fill="#c39cae" />
        <g fill="url(#an-sak-soft)">
          <circle cx="0" cy="-232" r="88" />
          <circle cx="-60" cy="-230" r="66" />
          <circle cx="62" cy="-226" r="64" />
        </g>
        <g fill="#f0c0d1">
          <circle cx="0" cy="-206" r="62" />
          <circle cx="-56" cy="-216" r="48" />
          <circle cx="56" cy="-212" r="46" />
          <circle cx="-18" cy="-252" r="42" />
          <circle cx="36" cy="-248" r="38" />
        </g>
        <g fill="#f8d3e0" opacity="0.9">
          <circle cx="-20" cy="-256" r="34" />
          <circle cx="34" cy="-240" r="30" />
          <circle cx="0" cy="-286" r="24" />
          <circle cx="-58" cy="-230" r="20" />
          <circle cx="58" cy="-228" r="18" />
        </g>
        <g fill="#fce8ef" opacity="0.8">
          <circle cx="-12" cy="-292" r="12" />
          <circle cx="46" cy="-260" r="10" />
        </g>
      </g>

      {/* 前景树冠：更暗、更实，压在画面两角 */}
      <g id="an-sak-fore">
        <g fill="url(#an-sak-soft-fore)">
          <circle cx="-40" cy="-20" r="180" />
          <circle cx="132" cy="-30" r="156" />
          <circle cx="26" cy="-132" r="126" />
        </g>
        <g fill="#d98aa9">
          <circle cx="-40" cy="10" r="130" />
          <circle cx="120" cy="-10" r="118" />
          <circle cx="40" cy="-92" r="108" />
        </g>
        <g fill="#e8a0ba">
          <circle cx="-72" cy="-22" r="104" />
          <circle cx="70" cy="-52" r="112" />
          <circle cx="180" cy="18" r="92" />
          <circle cx="-10" cy="-120" r="84" />
        </g>
        <g fill="#f2b9cd" opacity="0.9">
          <circle cx="-30" cy="-72" r="54" />
          <circle cx="100" cy="-92" r="48" />
          <circle cx="-120" cy="-42" r="44" />
        </g>
        <g fill="#f9d3e0" opacity="0.85">
          <circle cx="20" cy="-102" r="22" />
          <circle cx="-90" cy="-82" r="18" />
          <circle cx="150" cy="-42" r="20" />
        </g>
        <g fill="#f6c6d7" opacity="0.9">
          <circle cx="-152" cy="-104" r="34" />
          <circle cx="212" cy="-74" r="30" />
          <circle cx="-46" cy="-166" r="26" />
          <circle cx="120" cy="-152" r="24" />
          <circle cx="70" cy="-6" r="28" />
        </g>
        <path d="M-170 96 C-104 42 -40 12 22 -30" stroke="#9c6f83" strokeWidth="9" fill="none" strokeLinecap="round" />
        <path d="M40 62 C92 22 150 -8 212 -28" stroke="#9c6f83" strokeWidth="7" fill="none" strokeLinecap="round" />
        <g fill="#d98aa9" opacity="0.7">
          <circle cx="-204" cy="58" r="30" />
          <circle cx="244" cy="28" r="26" />
        </g>
      </g>

      <path id="an-sak-petal" d="M0 0 C7 5 10 16 4 23 C-1 28 -8 19 -7 11 C-6 5 -3 1 0 0 Z" />
      <pattern id="an-sak-petal-pattern" width="300" height="260" patternUnits="userSpaceOnUse" patternTransform="rotate(-8)">
        <use href="#an-sak-petal" transform="translate(42 54) rotate(-24) scale(1.15)" fill="#f6c3d5" opacity="0.7" />
        <use href="#an-sak-petal" transform="translate(206 154) rotate(38) scale(0.9)" fill="#f9d3e1" opacity="0.55" />
        <use href="#an-sak-petal" transform="translate(124 226) rotate(8) scale(0.75)" fill="#f6c3d5" opacity="0.6" />
        <use href="#an-sak-petal" transform="translate(268 42) rotate(64) scale(0.6)" fill="#fbdde8" opacity="0.5" />
      </pattern>
      <g id="an-sak-figure">
        <circle cx="0" cy="-64" r="9" fill="#b49cae" />
        <path d="M-11 -54 C-6 -58 6 -58 11 -54 L8 -22 L5 -22 L4 -2 L-1 -2 L-3 -22 L-7 -22 L-9 -2 L-14 -2 L-15 -22 L-9 -22 Z" fill="#b49cae" />
        <path d="M11 -50 L20 -34 L17 -32 L8 -46 Z" fill="#b49cae" />
      </g>
    </defs>

    {/* 天空 / 阳光 / 云 */}
    <rect width="1440" height="900" fill="url(#an-sak-sky)" />
    <circle cx="1108" cy="178" r="288" fill="url(#an-sak-halo)" />
    <circle cx="1108" cy="178" r="46" fill="#fffaf0" opacity="0.92" />
    <g fill="#ffffff">
      <ellipse cx="212" cy="188" rx="152" ry="40" opacity="0.5" />
      <ellipse cx="318" cy="204" rx="108" ry="30" opacity="0.38" />
      <ellipse cx="1238" cy="298" rx="168" ry="38" opacity="0.34" />
      <ellipse cx="986" cy="118" rx="118" ry="28" opacity="0.3" />
    </g>

    {/* 远景：淡蓝屋顶与人影般的远树，压在地平线附近 */}
    <path d="M0 372 L90 348 L180 362 L270 340 L360 360 L450 344 L540 362 L630 346 L720 360 L810 342 L900 360 L990 344 L1080 362 L1170 340 L1260 358 L1350 344 L1440 360 L1440 430 L0 430 Z" fill="#e3eef9" opacity="0.9" />
    <g fill="#d8e7f5">
      <rect x="196" y="336" width="34" height="46" />
      <rect x="236" y="350" width="22" height="32" />
      <rect x="520" y="330" width="28" height="50" />
      <rect x="556" y="344" width="40" height="38" />
      <rect x="880" y="338" width="30" height="44" />
      <rect x="916" y="352" width="24" height="30" />
      <rect x="1180" y="332" width="26" height="48" />
      <rect x="1214" y="348" width="36" height="34" />
    </g>

    {/* 地面与上坡路面 */}
    <path d="M0 430 Q720 378 1440 430 L1440 900 L0 900 Z" fill="url(#an-sak-ground)" />
    <path d="M110 900 L1330 900 L785 380 L655 380 Z" fill="#f7f0f4" />
    <path d="M300 900 L1140 900 L765 380 L675 380 Z" fill="url(#an-sak-road)" />
    <path d="M300 900 L1140 900 L765 380 L675 380 Z" fill="none" stroke="#e8d5e0" strokeWidth="3" opacity="0.8" />
    <path d="M720 384 L720 900" stroke="#e7c7d5" strokeWidth="5" strokeDasharray="24 34" opacity="0.75" />
    <ellipse cx="470" cy="800" rx="180" ry="46" fill="#ffffff" opacity="0.22" />
    <ellipse cx="1010" cy="720" rx="150" ry="36" fill="#ffffff" opacity="0.18" />
    <ellipse cx="780" cy="560" rx="120" ry="22" fill="#ffffff" opacity="0.16" />
    <path d="M300 900 L675 380" stroke="#efe1e8" strokeWidth="4" opacity="0.9" />
    <path d="M1140 900 L765 380" stroke="#efe1e8" strokeWidth="4" opacity="0.9" />

    {/* 电线 */}
    <path d="M1252 392 Q700 452 0 306" stroke="#a49aae" strokeWidth="2.2" fill="none" opacity="0.38" />
    <path d="M1252 428 Q660 492 0 366" stroke="#a49aae" strokeWidth="1.8" fill="none" opacity="0.3" />

    {/* 左侧房屋：由近到远逐渐变小、变淡 */}
    <g>
      <use href="#an-sak-house-a" transform="translate(121 770) scale(1.25)" />
      <use href="#an-sak-house-a" transform="translate(249 670) scale(1.02)" />
      <use href="#an-sak-house-b" transform="translate(349 590) scale(0.86)" opacity="0.96" />
      <use href="#an-sak-house-a" transform="translate(436 520) scale(0.72)" opacity="0.94" />
      <use href="#an-sak-house-b" transform="translate(506 465) scale(0.6)" opacity="0.9" />
      <use href="#an-sak-house-b" transform="translate(558 425) scale(0.5)" opacity="0.84" />
    </g>
    {/* 右侧房屋 */}
    <g>
      <use href="#an-sak-house-a" transform="translate(1319 770) scale(1.25)" />
      <use href="#an-sak-house-b" transform="translate(1191 670) scale(1.02)" />
      <use href="#an-sak-house-a" transform="translate(1091 590) scale(0.86)" opacity="0.96" />
      <use href="#an-sak-house-b" transform="translate(1018 520) scale(0.72)" opacity="0.94" />
      <use href="#an-sak-house-a" transform="translate(934 465) scale(0.6)" opacity="0.9" />
      <use href="#an-sak-house-b" transform="translate(882 425) scale(0.5)" opacity="0.84" />
    </g>

    {/* 中景樱花树：沿人行道排成一条向远处收窄的粉色隧道 */}
    <g>
      <use href="#an-sak-tree-a" transform="translate(351 830) scale(1.3)" />
      <use href="#an-sak-tree-b" transform="translate(437 710) scale(1.06)" opacity="0.94" />
      <use href="#an-sak-tree-a" transform="translate(502 620) scale(0.88)" opacity="0.9" />
      <use href="#an-sak-tree-b" transform="translate(556 545) scale(0.74)" opacity="0.86" />
      <use href="#an-sak-tree-a" transform="translate(599 485) scale(0.62)" opacity="0.8" />
      <use href="#an-sak-tree-b" transform="translate(635 435) scale(0.52)" opacity="0.72" />
      <use href="#an-sak-tree-b" transform="translate(660 400) scale(0.44)" opacity="0.62" />
    </g>
    <g>
      <use href="#an-sak-tree-a" transform="translate(1090 830) scale(1.3)" />
      <use href="#an-sak-tree-b" transform="translate(1003 710) scale(1.06)" opacity="0.94" />
      <use href="#an-sak-tree-a" transform="translate(938 620) scale(0.88)" opacity="0.9" />
      <use href="#an-sak-tree-b" transform="translate(884 545) scale(0.74)" opacity="0.86" />
      <use href="#an-sak-tree-a" transform="translate(841 485) scale(0.62)" opacity="0.8" />
      <use href="#an-sak-tree-b" transform="translate(805 435) scale(0.52)" opacity="0.72" />
      <use href="#an-sak-tree-b" transform="translate(780 400) scale(0.44)" opacity="0.62" />
    </g>

    {/* 远处行人：一点点生活气，不做主角 */}
    <use href="#an-sak-figure" transform="translate(762 612) scale(0.62)" opacity="0.8" />
    <use href="#an-sak-figure" transform="translate(700 560) scale(0.46)" opacity="0.6" />

    {/* 近景电线杆 */}
    <g fill="#b3aabd" opacity="0.92">
      <rect x="1244" y="352" width="13" height="548" rx="3" />
      <rect x="1192" y="382" width="118" height="7" rx="3" />
      <rect x="1206" y="422" width="90" height="6" rx="3" />
      <rect x="1198" y="376" width="7" height="14" />
      <rect x="1297" y="376" width="7" height="14" />
      <rect x="1226" y="416" width="6" height="12" />
      <rect x="1270" y="416" width="6" height="12" />
    </g>

    {/* 前景树冠 */}
    <use href="#an-sak-fore" transform="translate(-16 -6) scale(1.55)" />
    <use href="#an-sak-fore" transform="translate(1448 -2) scale(-1.5 1.5)" />

    {/* 前景飘落花瓣：少量大瓣，拉出景深 */}
    <g>
      <use href="#an-sak-petal" transform="translate(258 764) rotate(18) scale(2.4)" fill="#f7c8da" opacity="0.8" />
      <use href="#an-sak-petal" transform="translate(886 812) rotate(-32) scale(2)" fill="#f9d3e2" opacity="0.7" />
      <use href="#an-sak-petal" transform="translate(498 662) rotate(64) scale(1.7)" fill="#f6c3d5" opacity="0.72" />
      <use href="#an-sak-petal" transform="translate(1122 640) rotate(-8) scale(1.5)" fill="#fadde9" opacity="0.6" />
      <use href="#an-sak-petal" transform="translate(160 520) rotate(40) scale(1.25)" fill="#f8cfdf" opacity="0.55" />
      <use href="#an-sak-petal" transform="translate(1010 452) rotate(-48) scale(1.15)" fill="#f8cfdf" opacity="0.5" />
    </g>

    {/* 飘落花瓣铺满全画面 */}
    <rect width="1440" height="900" fill="url(#an-sak-petal-pattern)" opacity="0.55" />

    {/* 逆光光斑，只落在天空一侧 */}
    <g>
      <circle cx="330" cy="250" r="30" fill="url(#an-sak-bokeh)" opacity="0.4" />
      <circle cx="530" cy="160" r="18" fill="url(#an-sak-bokeh)" opacity="0.36" />
      <circle cx="960" cy="222" r="24" fill="url(#an-sak-bokeh)" opacity="0.3" />
      <circle cx="1170" cy="336" r="16" fill="url(#an-sak-bokeh)" opacity="0.28" />
      <circle cx="756" cy="112" r="13" fill="url(#an-sak-bokeh)" opacity="0.32" />
    </g>
  </svg>
)

// ------------------------------------------------------------
// 日落城市
// ------------------------------------------------------------
const sunsetCity: SceneArt = ({ className }) => (
  <svg
    viewBox="0 0 1440 900"
    preserveAspectRatio="xMidYMid slice"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="an-sun-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#2c2453" />
        <stop offset="26%" stopColor="#583767" />
        <stop offset="46%" stopColor="#94486d" />
        <stop offset="64%" stopColor="#c9605f" />
        <stop offset="78%" stopColor="#ef8f5b" />
        <stop offset="90%" stopColor="#f8bb79" />
        <stop offset="100%" stopColor="#f5a86b" />
      </linearGradient>
      <radialGradient id="an-sun-sun">
        <stop offset="0%" stopColor="#fff5d4" />
        <stop offset="52%" stopColor="#ffd08c" />
        <stop offset="100%" stopColor="#ff9a5e" />
      </radialGradient>
      <radialGradient id="an-sun-glow">
        <stop offset="0%" stopColor="#ffd9a2" stopOpacity="0.7" />
        <stop offset="45%" stopColor="#ff9f68" stopOpacity="0.28" />
        <stop offset="100%" stopColor="#ff8a5c" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="an-sun-haze" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ffc98d" stopOpacity="0.35" />
        <stop offset="100%" stopColor="#ffc98d" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="an-sun-roof" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#39243f" />
        <stop offset="100%" stopColor="#21162b" />
      </linearGradient>

      {/* 暖光窗 pattern：底色与人楼同色，窗格是暖黄小方块 */}
      <pattern id="an-sun-win-a" width="34" height="44" patternUnits="userSpaceOnUse">
        <rect width="34" height="44" fill="#412950" />
        <rect x="7" y="9" width="9" height="13" fill="#ffd193" opacity="0.9" />
      </pattern>
      <pattern id="an-sun-win-b" width="27" height="38" patternUnits="userSpaceOnUse">
        <rect width="27" height="38" fill="#3a2449" />
        <rect x="6" y="8" width="6" height="9" fill="#ffb978" opacity="0.65" />
      </pattern>

      <g id="an-sun-bird">
        <path d="M-18 0 Q-9 -10 0 0 Q9 -10 18 0" stroke="#3a2547" strokeWidth="3.6" strokeLinecap="round" fill="none" />
      </g>
    </defs>

    {/* 天空与夕阳 */}
    <rect width="1440" height="900" fill="url(#an-sun-sky)" />
    <circle cx="744" cy="588" r="330" fill="url(#an-sun-glow)" />
    <circle cx="744" cy="588" r="148" fill="url(#an-sun-sun)" />
    <rect x="0" y="676" width="1440" height="70" fill="url(#an-sun-haze)" />

    {/* 晚霞：高处紫、低处橘粉 */}
    <g opacity="0.55">
      <rect x="70" y="218" width="430" height="24" rx="12" fill="#7b4d7f" />
      <rect x="880" y="176" width="470" height="20" rx="10" fill="#80507f" opacity="0.8" />
      <rect x="180" y="392" width="380" height="30" rx="15" fill="#d5807f" opacity="0.8" />
      <rect x="760" y="340" width="340" height="24" rx="12" fill="#c97578" opacity="0.7" />
    </g>
    <rect x="556" y="556" width="430" height="18" rx="9" fill="#704368" opacity="0.46" />
    <rect x="646" y="612" width="382" height="10" rx="5" fill="#ffe0ae" opacity="0.45" />
    <rect x="300" y="500" width="260" height="12" rx="6" fill="#f4b28d" opacity="0.3" />

    {/* 远景楼群 */}
    <path d="M0 690 L0 622 L84 622 L84 650 L150 650 L150 600 L236 600 L236 664 L330 664 L330 628 L420 628 L420 676 L520 676 L520 638 L604 638 L604 668 L700 668 L700 710 L760 710 L760 690 L880 690 L880 640 L960 640 L960 672 L1060 672 L1060 616 L1140 616 L1140 656 L1240 656 L1240 626 L1330 626 L1330 668 L1440 668 L1440 690 Z" fill="#6b4676" opacity="0.85" />
    <g fill="#ffc68c" opacity="0.45">
      <rect x="104" y="640" width="6" height="8" />
      <rect x="172" y="622" width="6" height="8" />
      <rect x="356" y="648" width="6" height="8" />
      <rect x="544" y="654" width="6" height="8" />
      <rect x="904" y="660" width="6" height="8" />
      <rect x="1086" y="638" width="6" height="8" />
      <rect x="1264" y="646" width="6" height="8" />
      <rect x="1372" y="680" width="6" height="8" />
    </g>

    {/* 中景楼群：部分直接用窗 pattern 填满 */}
    <g>
      <rect x="-20" y="556" width="160" height="300" fill="url(#an-sun-win-b)" opacity="0.95" />
      <rect x="132" y="474" width="120" height="382" fill="#3b2549" />
      <rect x="242" y="602" width="148" height="254" fill="url(#an-sun-win-a)" opacity="0.92" />
      <rect x="382" y="500" width="112" height="356" fill="#372344" />
      <rect x="490" y="580" width="142" height="276" fill="url(#an-sun-win-b)" opacity="0.95" />
      <rect x="642" y="482" width="58" height="374" fill="#33203f" />
      <rect x="786" y="540" width="70" height="316" fill="#33203f" />
      <rect x="858" y="470" width="142" height="386" fill="url(#an-sun-win-a)" opacity="0.9" />
      <rect x="1002" y="558" width="120" height="298" fill="#3a2447" />
      <rect x="1122" y="450" width="158" height="406" fill="url(#an-sun-win-b)" opacity="0.92" />
      <rect x="1282" y="520" width="180" height="336" fill="url(#an-sun-win-a)" opacity="0.88" />
    </g>
    {/* 局部不亮灯的楼层，打散整齐的窗格 */}
    <g fill="#3a2447">
      <rect x="132" y="584" width="120" height="28" opacity="0.85" />
      <rect x="858" y="602" width="142" height="24" opacity="0.8" />
      <rect x="1122" y="566" width="158" height="30" opacity="0.8" />
      <rect x="242" y="700" width="148" height="22" opacity="0.7" />
      <rect x="490" y="722" width="142" height="20" opacity="0.7" />
    </g>
    <g stroke="#33203f" fill="none" strokeLinecap="round">
      <path d="M442 500 L442 450" strokeWidth="4" />
      <path d="M442 464 L464 464" strokeWidth="2.5" />
      <path d="M442 478 L458 478" strokeWidth="2.5" />
      <path d="M952 470 L952 424" strokeWidth="4" />
      <path d="M952 438 L930 438" strokeWidth="2.5" />
      <path d="M952 452 L938 452" strokeWidth="2.5" />
    </g>
    <g fill="#33203f">
      <circle cx="442" cy="450" r="2.6" />
      <circle cx="952" cy="424" r="2.6" />
    </g>
    <g fill="#ffd8a5" opacity="0.7">
      <rect x="158" y="512" width="7" height="11" />
      <rect x="186" y="548" width="7" height="11" />
      <rect x="408" y="536" width="6" height="9" />
      <rect x="436" y="580" width="6" height="9" />
      <rect x="1030" y="592" width="6" height="9" />
      <rect x="1058" y="626" width="6" height="9" />
      <rect x="666" y="520" width="5" height="8" />
      <rect x="806" y="580" width="5" height="8" />
    </g>

    {/* 近景包边的深色楼影，压住左右两侧 */}
    <path d="M0 900 L0 366 L150 366 L150 404 L252 404 L252 900 Z" fill="#2b1c39" />
    <path d="M1440 900 L1440 330 L1300 330 L1300 392 L1218 392 L1218 900 Z" fill="#281a36" />
    <g fill="#35223f">
      <rect x="42" y="332" width="62" height="32" />
      <rect x="170" y="382" width="48" height="22" />
      <rect x="230" y="376" width="20" height="28" />
    </g>
    <g stroke="#2b1c39" fill="none" strokeLinecap="round">
      <path d="M214 404 L214 334" strokeWidth="4" />
      <path d="M214 348 L232 348" strokeWidth="2.5" />
      <path d="M214 362 L226 362" strokeWidth="2.5" />
    </g>

    {/* 飞鸟 */}
    <use href="#an-sun-bird" transform="translate(506 420) scale(0.9)" />
    <use href="#an-sun-bird" transform="translate(560 398) scale(0.72)" />
    <use href="#an-sun-bird" transform="translate(612 438) scale(0.8)" />
    <use href="#an-sun-bird" transform="translate(462 456) scale(0.62)" />
    <use href="#an-sun-bird" transform="translate(654 386) scale(0.55)" />

    {/* 前景天台：栏杆、水箱与天线都是剪影 */}
    <rect x="0" y="820" width="1440" height="80" fill="url(#an-sun-roof)" />
    <rect x="0" y="700" width="1440" height="11" fill="#191022" />
    <rect x="0" y="698" width="1440" height="2" fill="#f7b07a" opacity="0.22" />
    <rect x="0" y="752" width="1440" height="8" fill="#1d1427" />
    <g fill="#1a1123">
      <rect x="44" y="700" width="10" height="122" />
      <rect x="158" y="700" width="10" height="122" />
      <rect x="272" y="700" width="10" height="122" />
      <rect x="386" y="700" width="10" height="122" />
      <rect x="500" y="700" width="10" height="122" />
      <rect x="614" y="700" width="10" height="122" />
      <rect x="728" y="700" width="10" height="122" />
      <rect x="842" y="700" width="10" height="122" />
      <rect x="956" y="700" width="10" height="122" />
      <rect x="1070" y="700" width="10" height="122" />
      <rect x="1184" y="700" width="10" height="122" />
      <rect x="1298" y="700" width="10" height="122" />
      <rect x="1394" y="700" width="10" height="122" />
    </g>
    <g stroke="#1a1123" strokeWidth="7" fill="none">
      <path d="M44 700 L146 818" />
      <path d="M1394 700 L1292 818" />
    </g>
    <g fill="#1c1326">
      <rect x="54" y="632" width="132" height="86" rx="7" />
      <rect x="54" y="626" width="132" height="10" rx="5" />
      <rect x="74" y="718" width="9" height="54" />
      <rect x="158" y="718" width="9" height="54" />
      <rect x="120" y="646" width="46" height="5" rx="2" fill="#2a1e37" />
      <path d="M1328 562 L1330 700" stroke="#1c1326" strokeWidth="6" />
      <path d="M1302 596 L1356 596" stroke="#1c1326" strokeWidth="4" />
      <path d="M1308 630 L1350 630" stroke="#1c1326" strokeWidth="4" />
      <circle cx="1329" cy="560" r="4" />
    </g>
  </svg>
)

// ------------------------------------------------------------
// 星空
// ------------------------------------------------------------
const starNight: SceneArt = ({ className }) => (
  <svg
    viewBox="0 0 1440 900"
    preserveAspectRatio="xMidYMid slice"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="an-star-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#05081b" />
        <stop offset="38%" stopColor="#0b1129" />
        <stop offset="70%" stopColor="#151533" />
        <stop offset="100%" stopColor="#241938" />
      </linearGradient>
      <radialGradient id="an-star-horizon">
        <stop offset="0%" stopColor="#453059" stopOpacity="0.55" />
        <stop offset="100%" stopColor="#3a2a52" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="an-star-core">
        <stop offset="0%" stopColor="#e8e9ff" stopOpacity="0.22" />
        <stop offset="55%" stopColor="#b9c6ff" stopOpacity="0.08" />
        <stop offset="100%" stopColor="#9db2ff" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="an-star-band-soft">
        <stop offset="0%" stopColor="#e6ebff" stopOpacity="0.2" />
        <stop offset="45%" stopColor="#c2cfff" stopOpacity="0.12" />
        <stop offset="78%" stopColor="#a9bbff" stopOpacity="0.04" />
        <stop offset="100%" stopColor="#a9bbff" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="an-star-meteor" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="-130" y2="0">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
        <stop offset="45%" stopColor="#c7d8ff" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#c7d8ff" stopOpacity="0" />
      </linearGradient>

      {/* 星点 pattern：少量定义铺满天空 */}
      <pattern id="an-star-dots" width="200" height="160" patternUnits="userSpaceOnUse">
        <circle cx="22" cy="30" r="1.1" fill="#dfe8ff" opacity="0.7" />
        <circle cx="86" cy="92" r="1.4" fill="#ffffff" opacity="0.85" />
        <circle cx="152" cy="44" r="1" fill="#cfdcff" opacity="0.5" />
        <circle cx="62" cy="140" r="1.6" fill="#eaf0ff" opacity="0.75" />
        <circle cx="182" cy="128" r="1.2" fill="#d5e0ff" opacity="0.6" />
        <circle cx="112" cy="18" r="1" fill="#dfe8ff" opacity="0.45" />
        <circle cx="30" cy="112" r="1.3" fill="#dbe6ff" opacity="0.65" />
        <circle cx="164" cy="86" r="0.9" fill="#c8d6ff" opacity="0.4" />
      </pattern>
      <pattern id="an-star-bright" width="380" height="300" patternUnits="userSpaceOnUse" patternTransform="translate(60 30)">
        <circle cx="44" cy="58" r="2" fill="#f4f7ff" opacity="0.9" />
        <circle cx="240" cy="156" r="1.8" fill="#eaf1ff" opacity="0.85" />
        <circle cx="330" cy="46" r="1.5" fill="#dfe9ff" opacity="0.7" />
        <path d="M150 210 L153 218 L161 221 L153 224 L150 232 L147 224 L139 221 L147 218 Z" fill="#eef4ff" opacity="0.8" />
      </pattern>
      <pattern id="an-star-band-dots" width="90" height="70" patternUnits="userSpaceOnUse">
        <circle cx="12" cy="16" r="1" fill="#ffffff" opacity="0.8" />
        <circle cx="52" cy="34" r="1.4" fill="#eef2ff" opacity="0.9" />
        <circle cx="80" cy="10" r="0.9" fill="#dfe8ff" opacity="0.6" />
        <circle cx="30" cy="56" r="1.2" fill="#ffffff" opacity="0.7" />
        <circle cx="66" cy="62" r="0.8" fill="#d7e2ff" opacity="0.5" />
      </pattern>
      <pattern id="an-star-town" width="20" height="16" patternUnits="userSpaceOnUse">
        <rect width="20" height="16" fill="#0a0f24" />
        <rect x="4" y="5" width="5" height="5" fill="#ffd79a" opacity="0.85" />
      </pattern>

      <clipPath id="an-star-band-clip">
        <ellipse cx="720" cy="380" rx="590" ry="112" transform="rotate(-18 720 380)" />
      </clipPath>
      <g id="an-star-fly">
        <circle r="6" fill="#ffe6a3" opacity="0.14" />
        <circle r="1.6" fill="#fff0c8" opacity="0.9" />
      </g>
    </defs>

    {/* 天空与地平辉光 */}
    <rect width="1440" height="900" fill="url(#an-star-sky)" />
    <ellipse cx="720" cy="742" rx="760" ry="230" fill="url(#an-star-horizon)" />

    {/* 银河：多层低透明椭圆 + 只落在带内的密集星点 */}
    <g transform="rotate(-18 720 380)">
      <ellipse cx="720" cy="380" rx="650" ry="176" fill="url(#an-star-band-soft)" />
      <ellipse cx="700" cy="372" rx="540" ry="120" fill="url(#an-star-band-soft)" opacity="0.9" />
      <ellipse cx="742" cy="392" rx="430" ry="66" fill="url(#an-star-band-soft)" opacity="0.85" />
      <ellipse cx="760" cy="398" rx="270" ry="30" fill="url(#an-star-band-soft)" opacity="0.9" />
      <ellipse cx="720" cy="380" rx="330" ry="74" fill="url(#an-star-core)" />
    </g>
    <g clipPath="url(#an-star-band-clip)">
      <rect x="0" y="0" width="1440" height="900" fill="url(#an-star-band-dots)" opacity="0.9" />
    </g>

    {/* 星野 */}
    <rect width="1440" height="900" fill="url(#an-star-dots)" opacity="0.85" />
    <rect width="1440" height="900" fill="url(#an-star-bright)" opacity="0.8" />

    {/* 流星 */}
    <g transform="translate(322 178) rotate(25)">
      <line x1="-130" y1="0" x2="0" y2="0" stroke="url(#an-star-meteor)" strokeWidth="2.8" strokeLinecap="round" />
      <circle cx="0" cy="0" r="2.8" fill="#ffffff" opacity="0.95" />
    </g>
    <g transform="translate(900 132) rotate(29) scale(0.8)">
      <line x1="-120" y1="0" x2="0" y2="0" stroke="url(#an-star-meteor)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="0" cy="0" r="2.2" fill="#ffffff" opacity="0.85" />
    </g>
    <g transform="translate(540 320) rotate(21) scale(0.55)">
      <line x1="-120" y1="0" x2="0" y2="0" stroke="url(#an-star-meteor)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="0" cy="0" r="2" fill="#ffffff" opacity="0.7" />
    </g>

    {/* 远山与中景山脊 */}
    <path d="M0 682 L118 636 L208 670 L330 598 L428 654 L538 610 L660 668 L780 618 L900 660 L1010 594 L1120 650 L1232 616 L1340 660 L1440 628 L1440 900 L0 900 Z" fill="#0c1230" />
    <path d="M0 762 L148 710 L258 744 L388 690 L520 736 L648 700 L758 746 L878 700 L988 738 L1098 690 L1218 736 L1338 708 L1440 742 L1440 900 L0 900 Z" fill="#080e26" />

    {/* 小镇：屋顶剪影 + 暖色窗 pattern */}
    <g>
      <path d="M372 800 L372 774 L396 760 L420 776 L420 800 Z" fill="url(#an-star-town)" />
      <path d="M432 800 L432 764 L470 764 L470 800 Z" fill="url(#an-star-town)" />
      <path d="M482 800 L482 780 L510 768 L538 782 L538 800 Z" fill="url(#an-star-town)" />
      <rect x="556" y="770" width="42" height="30" fill="url(#an-star-town)" />
      <path d="M612 800 L612 772 L646 758 L680 774 L680 800 Z" fill="url(#an-star-town)" />
      <rect x="700" y="776" width="52" height="24" fill="url(#an-star-town)" />
      <path d="M770 800 L770 766 L800 754 L830 768 L830 800 Z" fill="url(#an-star-town)" />
      <rect x="848" y="774" width="38" height="26" fill="url(#an-star-town)" />
      <path d="M900 800 L900 780 L928 768 L956 782 L956 800 Z" fill="url(#an-star-town)" />
      <rect x="972" y="774" width="46" height="26" fill="url(#an-star-town)" />
    </g>
    <g fill="#ffcf8b" opacity="0.8">
      <circle cx="340" cy="786" r="1.3" />
      <circle cx="360" cy="792" r="1.1" />
      <circle cx="460" cy="790" r="1.2" />
      <circle cx="592" cy="762" r="1" />
      <circle cx="660" cy="788" r="1.2" />
      <circle cx="760" cy="792" r="1" />
      <circle cx="890" cy="782" r="1.1" />
      <circle cx="1038" cy="788" r="1.2" />
      <circle cx="1060" cy="780" r="1" />
      <circle cx="560" cy="750" r="1.1" />
    </g>

    {/* 近景山丘、树与草叶 */}
    <path d="M0 852 Q236 804 476 830 Q716 856 960 820 Q1200 788 1440 832 L1440 900 L0 900 Z" fill="#050a17" />
    <g stroke="#040813" fill="none" strokeLinecap="round">
      <path d="M1298 900 L1298 736" strokeWidth="9" />
      <path d="M1298 812 C1272 780 1244 760 1216 744" strokeWidth="5" />
      <path d="M1298 838 C1326 806 1352 786 1380 772" strokeWidth="4" />
      <path d="M1298 774 C1282 752 1268 736 1252 722" strokeWidth="3" />
    </g>
    <g fill="#040813">
      <ellipse cx="1230" cy="742" rx="46" ry="26" />
      <ellipse cx="1360" cy="764" rx="40" ry="22" />
      <ellipse cx="1296" cy="720" rx="34" ry="20" />
    </g>
    <g stroke="#071021" strokeWidth="2.4" fill="none" strokeLinecap="round">
      <path d="M118 900 C116 872 112 858 104 842" />
      <path d="M136 900 C138 876 144 862 152 848" />
      <path d="M170 900 C170 878 176 864 184 854" />
      <path d="M208 900 C206 880 200 868 192 858" />
      <path d="M244 900 C246 882 252 870 260 860" />
    </g>

    {/* 萤火 */}
    <use href="#an-star-fly" transform="translate(300 792)" />
    <use href="#an-star-fly" transform="translate(420 828) scale(0.8)" />
    <use href="#an-star-fly" transform="translate(560 806) scale(1.1)" />
    <use href="#an-star-fly" transform="translate(690 842) scale(0.7)" />
    <use href="#an-star-fly" transform="translate(1120 812) scale(0.9)" />
    <use href="#an-star-fly" transform="translate(1188 860) scale(0.65)" />
  </svg>
)

export const ANIME_SCENES: Record<string, SceneArt> = {
  'anime-sakura-street': sakuraStreet,
  'anime-sunset-city': sunsetCity,
  'anime-star-night': starNight,
}
