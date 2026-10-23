// ============================================================
// 科幻场景（原创 SVG，纯静态、无外部资源）
//
// 1. 轨道空间站：巨大行星弧面压住下半部，大气辉光与环带分前后两层，
//    舷窗框、竖向舱壁与管线构成很暗的前景，只有几颗机库指示灯发微光。
// 2. 霓虹雨夜：两侧高楼剪影夹出一条街，青与品红的招牌是唯一光源，
//    雨丝用两套 1px 竖线 pattern 叠加，地面积水把光拉成竖向倒影并模糊收尾。
// 3. 深空星域：微弱透视网格 + 星座连线 + 远处空间站轮廓，
//    画面中心是一颗冷白色恒星，四道光芒只从星核向外衰减。
//
// 所有 id 统一使用 cy-orb- / cy-rain- / cy-deep- 前缀，避免与其他场景冲突。
// ============================================================

import type { SceneArt } from './types'

// ------------------------------------------------------------
// 轨道空间站
// ------------------------------------------------------------
const orbitStation: SceneArt = ({ className }) => (
  <svg
    viewBox="0 0 1440 900"
    preserveAspectRatio="xMidYMid slice"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="cy-orb-space" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#03060d" />
        <stop offset="55%" stopColor="#061422" />
        <stop offset="100%" stopColor="#04101a" />
      </linearGradient>
      <radialGradient id="cy-orb-planet" cx="0.44" cy="0.08" r="0.92">
        <stop offset="0%" stopColor="#4496a4" />
        <stop offset="12%" stopColor="#276b7a" />
        <stop offset="38%" stopColor="#12404f" />
        <stop offset="72%" stopColor="#092534" />
        <stop offset="100%" stopColor="#04121d" />
      </radialGradient>
      <radialGradient id="cy-orb-shade" cx="0.34" cy="0.1" r="0.92">
        <stop offset="0%" stopColor="#02070d" stopOpacity="0" />
        <stop offset="55%" stopColor="#02070d" stopOpacity="0.1" />
        <stop offset="100%" stopColor="#01040a" stopOpacity="0.68" />
      </radialGradient>
      <radialGradient id="cy-orb-neb">
        <stop offset="0%" stopColor="#147a8f" stopOpacity="0.16" />
        <stop offset="100%" stopColor="#147a8f" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="cy-orb-neb-2">
        <stop offset="0%" stopColor="#3b2d6e" stopOpacity="0.14" />
        <stop offset="100%" stopColor="#3b2d6e" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="cy-orb-light">
        <stop offset="0%" stopColor="#93f2ff" stopOpacity="0.55" />
        <stop offset="100%" stopColor="#5fe6ff" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="cy-orb-ring" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#6fd7e6" stopOpacity="0" />
        <stop offset="18%" stopColor="#6fd7e6" stopOpacity="0.22" />
        <stop offset="52%" stopColor="#8fe6f0" stopOpacity="0.4" />
        <stop offset="84%" stopColor="#6fd7e6" stopOpacity="0.2" />
        <stop offset="100%" stopColor="#6fd7e6" stopOpacity="0" />
      </linearGradient>
      <pattern id="cy-orb-stars" width="240" height="200" patternUnits="userSpaceOnUse">
        <circle cx="26" cy="34" r="1.2" fill="#dceeff" opacity="0.7" />
        <circle cx="94" cy="78" r="1.5" fill="#ffffff" opacity="0.8" />
        <circle cx="176" cy="42" r="1" fill="#cfe6ff" opacity="0.45" />
        <circle cx="58" cy="150" r="1.1" fill="#dceeff" opacity="0.6" />
        <circle cx="206" cy="166" r="1.3" fill="#e8f4ff" opacity="0.55" />
        <circle cx="142" cy="120" r="0.9" fill="#bcd8ee" opacity="0.4" />
      </pattern>
      <clipPath id="cy-orb-planet-clip">
        <circle cx="720" cy="1500" r="900" />
      </clipPath>
    </defs>

    {/* 太空底色、星点与极淡星云 */}
    <rect width="1440" height="900" fill="url(#cy-orb-space)" />
    <rect width="1440" height="900" fill="url(#cy-orb-stars)" opacity="0.8" />
    <circle cx="240" cy="220" r="380" fill="url(#cy-orb-neb)" />
    <circle cx="1240" cy="150" r="320" fill="url(#cy-orb-neb-2)" />

    {/* 环带：贴着行星弧面的后半段，向画面两侧淡出 */}
    <ellipse
      cx="720"
      cy="1228"
      rx="1230"
      ry="650"
      transform="rotate(-12 720 1228)"
      fill="none"
      stroke="url(#cy-orb-ring)"
      strokeWidth="44"
      strokeOpacity="0.62"
    />
    <ellipse
      cx="720"
      cy="1228"
      rx="1230"
      ry="672"
      transform="rotate(-12 720 1228)"
      fill="none"
      stroke="#9fe8f2"
      strokeWidth="2.2"
      strokeOpacity="0.42"
    />
    <ellipse
      cx="720"
      cy="1228"
      rx="1230"
      ry="628"
      transform="rotate(-12 720 1228)"
      fill="none"
      stroke="#c8f4f8"
      strokeWidth="1.8"
      strokeOpacity="0.24"
    />

    {/* 行星本体：弧面 + 大气辉光 */}
    <circle cx="720" cy="1500" r="900" fill="url(#cy-orb-planet)" />
    <g clipPath="url(#cy-orb-planet-clip)" fill="none">
      <path d="M180 716 Q720 648 1260 716" stroke="#9fe8f2" strokeWidth="1.2" opacity="0.08" />
      <path d="M120 796 Q720 738 1320 796" stroke="#9fe8f2" strokeWidth="1.5" opacity="0.06" />
      <path d="M260 656 Q720 610 1180 656" stroke="#c8f4f8" strokeWidth="1" opacity="0.05" />
    </g>
    <circle cx="720" cy="1500" r="900" fill="url(#cy-orb-shade)" />
    <circle cx="720" cy="1500" r="902" fill="none" stroke="#9ff0ff" strokeWidth="3" strokeOpacity="0.42" />
    <circle cx="720" cy="1500" r="914" fill="none" stroke="#59d2ea" strokeWidth="12" strokeOpacity="0.12" />

    {/* 舱内结构：窗框、竖梁、管线全部压成剪影 */}
    <path d="M0 0 H300 L252 900 H0 Z" fill="#03070d" />
    <path d="M1440 0 H1140 L1188 900 H1440 Z" fill="#03070d" />
    <rect x="0" y="0" width="1440" height="84" fill="#03070d" />
    <rect x="0" y="806" width="1440" height="94" fill="#03070d" />
    <path d="M300 0 L252 900" fill="none" stroke="#0e2532" strokeWidth="3" opacity="0.9" />
    <path d="M1140 0 L1188 900" fill="none" stroke="#0e2532" strokeWidth="3" opacity="0.9" />
    <rect x="0" y="84" width="1440" height="3" fill="#123040" opacity="0.7" />
    <rect x="0" y="806" width="1440" height="3" fill="#123040" opacity="0.8" />
    <rect x="424" y="0" width="20" height="806" fill="#04090f" />
    <rect x="1012" y="0" width="26" height="806" fill="#04090f" />
    <rect x="300" y="292" width="840" height="13" fill="#04090f" opacity="0.95" />
    <rect x="424" y="0" width="2" height="806" fill="#102a38" opacity="0.55" />
    <rect x="1036" y="0" width="2" height="806" fill="#102a38" opacity="0.45" />

    {/* 左侧舱壁管线 */}
    <g>
      <rect x="262" y="128" width="9" height="660" rx="4" fill="#08131d" />
      <rect x="232" y="146" width="7" height="620" rx="3" fill="#0a1722" />
      <rect x="256" y="210" width="22" height="8" rx="3" fill="#0b1c28" />
      <rect x="256" y="402" width="22" height="8" rx="3" fill="#0b1c28" />
      <rect x="256" y="602" width="22" height="8" rx="3" fill="#0b1c28" />
      <rect x="226" y="188" width="20" height="7" rx="3" fill="#0a1824" />
      <rect x="226" y="508" width="20" height="7" rx="3" fill="#0a1824" />
    </g>

    {/* 舱内其余面板：都很暗，只留一点结构线 */}
    <path d="M0 900 L0 790 L152 752 L318 786 L356 900 Z" fill="#050a12" />
    <rect x="1156" y="702" width="168" height="106" rx="6" fill="#050a12" />
    <rect x="1156" y="702" width="168" height="3" rx="1.5" fill="#102b3a" opacity="0.7" />
    <rect x="1172" y="726" width="54" height="26" rx="2" fill="#071019" />
    <rect x="1250" y="726" width="54" height="26" rx="2" fill="#071019" />

    {/* 极淡的机库指示灯：只在这里发光 */}
    <g>
      <circle cx="604" cy="42" r="16" fill="url(#cy-orb-light)" opacity="0.7" />
      <circle cx="604" cy="42" r="2.6" fill="#8cf0ff" opacity="0.9" />
      <circle cx="660" cy="42" r="12" fill="url(#cy-orb-light)" opacity="0.55" />
      <circle cx="660" cy="42" r="2.1" fill="#6fe6ff" opacity="0.75" />
      <circle cx="716" cy="42" r="10" fill="url(#cy-orb-light)" opacity="0.45" />
      <circle cx="716" cy="42" r="1.8" fill="#6fe6ff" opacity="0.6" />
      <circle cx="248" cy="836" r="13" fill="url(#cy-orb-light)" opacity="0.5" />
      <circle cx="248" cy="836" r="2.2" fill="#8cf0ff" opacity="0.8" />
      <circle cx="278" cy="836" r="11" fill="url(#cy-orb-light)" opacity="0.38" />
      <circle cx="278" cy="836" r="1.9" fill="#6fe6ff" opacity="0.65" />
    </g>

    {/* 舷窗玻璃上的一层极弱反光 */}
    <path d="M330 84 L392 84 L206 806 L150 806 Z" fill="#a9e9ff" opacity="0.025" />
  </svg>
)

// ------------------------------------------------------------
// 霓虹雨夜
// ------------------------------------------------------------
const neonRain: SceneArt = ({ className }) => (
  <svg
    viewBox="0 0 1440 900"
    preserveAspectRatio="xMidYMid slice"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="cy-rain-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#04050c" />
        <stop offset="42%" stopColor="#070b16" />
        <stop offset="72%" stopColor="#0a1020" />
        <stop offset="100%" stopColor="#0b1322" />
      </linearGradient>
      <linearGradient id="cy-rain-ground" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#0a1424" />
        <stop offset="45%" stopColor="#060c18" />
        <stop offset="100%" stopColor="#03060d" />
      </linearGradient>
      <radialGradient id="cy-rain-haze-mag">
        <stop offset="0%" stopColor="#ff3fbf" stopOpacity="0.16" />
        <stop offset="100%" stopColor="#ff3fbf" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="cy-rain-haze-cyan">
        <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.14" />
        <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="cy-rain-pool-mag">
        <stop offset="0%" stopColor="#ff4fc8" stopOpacity="0.3" />
        <stop offset="55%" stopColor="#ff4fc8" stopOpacity="0.1" />
        <stop offset="100%" stopColor="#ff4fc8" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="cy-rain-pool-cyan">
        <stop offset="0%" stopColor="#5fe9ff" stopOpacity="0.26" />
        <stop offset="55%" stopColor="#5fe9ff" stopOpacity="0.09" />
        <stop offset="100%" stopColor="#5fe9ff" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="cy-rain-sign-mag" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ff5fd0" />
        <stop offset="100%" stopColor="#a3237d" />
      </linearGradient>
      <linearGradient id="cy-rain-sign-cyan" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#26c6dd" />
        <stop offset="100%" stopColor="#0a7f95" />
      </linearGradient>
      <linearGradient id="cy-rain-reflect-mag" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ff4fc8" stopOpacity="0.65" />
        <stop offset="55%" stopColor="#ff4fc8" stopOpacity="0.18" />
        <stop offset="100%" stopColor="#ff4fc8" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="cy-rain-reflect-cyan" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#7df0ff" stopOpacity="0.58" />
        <stop offset="60%" stopColor="#3fd6ec" stopOpacity="0.16" />
        <stop offset="100%" stopColor="#3fd6ec" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="cy-rain-ground-glow" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#2a4c62" stopOpacity="0.14" />
        <stop offset="100%" stopColor="#2a4c62" stopOpacity="0" />
      </linearGradient>

      {/* 发光窗 pattern：只有窗，没有底 */}
      <pattern id="cy-rain-win-cyan" width="38" height="42" patternUnits="userSpaceOnUse">
        <rect x="6" y="8" width="9" height="12" fill="#6fe3f5" opacity="0.82" />
        <rect x="22" y="8" width="7" height="12" fill="#9ff2ff" opacity="0.4" />
        <rect x="6" y="27" width="8" height="9" fill="#52b9cc" opacity="0.5" />
      </pattern>
      <pattern id="cy-rain-win-mag" width="46" height="50" patternUnits="userSpaceOnUse">
        <rect x="8" y="10" width="8" height="11" fill="#ff7ddd" opacity="0.78" />
        <rect x="28" y="10" width="6" height="9" fill="#e15fbc" opacity="0.35" />
        <rect x="26" y="28" width="7" height="10" fill="#ffb0ea" opacity="0.5" />
      </pattern>
      <pattern id="cy-rain-win-dim" width="32" height="38" patternUnits="userSpaceOnUse">
        <rect x="8" y="10" width="6" height="9" fill="#4f97ad" opacity="0.5" />
        <rect x="21" y="25" width="5" height="7" fill="#3b7b8f" opacity="0.35" />
      </pattern>
      {/* 雨丝：两套 1px 竖线，叠加后形成密集雨幕 */}
      <pattern id="cy-rain-drops-a" width="54" height="240" patternUnits="userSpaceOnUse">
        <line x1="18" y1="0" x2="18" y2="68" stroke="#bdf1ff" strokeWidth="1" opacity="0.32" />
        <line x1="42" y1="124" x2="42" y2="192" stroke="#d8f8ff" strokeWidth="1" opacity="0.2" />
      </pattern>
      <pattern id="cy-rain-drops-b" width="28" height="160" patternUnits="userSpaceOnUse">
        <line x1="10" y1="0" x2="10" y2="46" stroke="#e6fbff" strokeWidth="1" opacity="0.16" />
      </pattern>
      <filter id="cy-rain-blur-mag" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="14" />
      </filter>
      <filter id="cy-rain-blur-cyan" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="12" />
      </filter>
      <filter id="cy-rain-blur-pool" x="-25%" y="-60%" width="150%" height="220%">
        <feGaussianBlur stdDeviation="7" />
      </filter>
      <filter id="cy-rain-blur-refl" x="-80%" y="-40%" width="260%" height="180%">
        <feGaussianBlur stdDeviation="2.4" />
      </filter>
      <clipPath id="cy-rain-clip-left">
        <path d="M0 900 L0 170 L148 170 L148 126 L262 126 L262 210 L404 210 L404 900 Z" />
      </clipPath>
      <clipPath id="cy-rain-clip-right">
        <path d="M1440 900 L1440 140 L1262 140 L1262 236 L1136 236 L1136 188 L1024 188 L1024 900 Z" />
      </clipPath>
    </defs>

    {/* 夜空与两处光源的雾 */}
    <rect width="1440" height="900" fill="url(#cy-rain-sky)" />
    <ellipse cx="262" cy="380" rx="420" ry="330" fill="url(#cy-rain-haze-mag)" />
    <ellipse cx="1148" cy="350" rx="420" ry="310" fill="url(#cy-rain-haze-cyan)" />

    {/* 远景楼群 */}
    <path d="M0 744 L0 612 L92 612 L92 654 L168 654 L168 566 L250 566 L250 640 L326 640 L326 590 L420 590 L420 744 Z" fill="#0a0f1c" />
    <path d="M1020 744 L1020 570 L1104 570 L1104 620 L1180 620 L1180 546 L1268 546 L1268 612 L1340 612 L1340 574 L1440 574 L1440 744 Z" fill="#090e1a" />
    <path d="M470 744 L470 486 L536 486 L536 540 L604 540 L604 470 L666 470 L666 744 Z" fill="#0a1120" />
    <path d="M742 744 L742 512 L804 512 L804 558 L870 558 L870 494 L930 494 L930 744 Z" fill="#0b1220" />

    {/* 中景楼 */}
    <rect x="300" y="392" width="262" height="352" fill="#070c16" />
    <rect x="878" y="352" width="302" height="392" fill="#070c16" />
    <rect x="886" y="360" width="288" height="384" fill="url(#cy-rain-win-dim)" opacity="0.6" />
    <rect x="548" y="506" width="228" height="238" fill="url(#cy-rain-win-dim)" opacity="0.45" />

    {/* 近景左楼 */}
    <path d="M0 900 L0 170 L148 170 L148 126 L262 126 L262 210 L404 210 L404 900 Z" fill="#05080f" />
    <g clipPath="url(#cy-rain-clip-left)">
      <rect x="6" y="140" width="400" height="760" fill="url(#cy-rain-win-cyan)" opacity="0.9" />
      <g fill="#05080f">
        <rect x="0" y="472" width="404" height="28" opacity="0.7" />
        <rect x="0" y="688" width="404" height="24" opacity="0.55" />
        <rect x="130" y="248" width="274" height="16" opacity="0.5" />
        <rect x="0" y="352" width="120" height="20" opacity="0.45" />
      </g>
    </g>
    {/* 近景右楼 */}
    <path d="M1440 900 L1440 140 L1262 140 L1262 236 L1136 236 L1136 188 L1024 188 L1024 900 Z" fill="#04070e" />
    <g clipPath="url(#cy-rain-clip-right)">
      <rect x="1020" y="150" width="420" height="750" fill="url(#cy-rain-win-mag)" opacity="0.85" />
      <g fill="#04070e">
        <rect x="1018" y="428" width="422" height="30" opacity="0.65" />
        <rect x="1018" y="640" width="422" height="26" opacity="0.6" />
        <rect x="1018" y="296" width="230" height="18" opacity="0.5" />
      </g>
    </g>
    <rect x="148" y="126" width="114" height="2" fill="#2c5c6e" opacity="0.35" />
    <rect x="1024" y="188" width="112" height="2" fill="#4a2a58" opacity="0.4" />

    {/* 霓虹招牌：光源本体 + 小范围模糊光晕 */}
    <rect x="244" y="278" width="72" height="212" rx="12" fill="#ff3fbf" opacity="0.32" filter="url(#cy-rain-blur-mag)" />
    <rect x="252" y="286" width="56" height="196" rx="8" fill="url(#cy-rain-sign-mag)" />
    <g fill="#3a0a2c" opacity="0.72">
      <rect x="268" y="316" width="24" height="5" rx="2.5" />
      <rect x="268" y="336" width="18" height="5" rx="2.5" />
      <rect x="268" y="356" width="26" height="5" rx="2.5" />
      <rect x="268" y="386" width="12" height="12" rx="6" />
      <rect x="268" y="416" width="22" height="5" rx="2.5" />
      <rect x="268" y="436" width="16" height="5" rx="2.5" />
    </g>

    <rect x="1054" y="308" width="260" height="78" rx="12" fill="#22d3ee" opacity="0.26" filter="url(#cy-rain-blur-cyan)" />
    <rect x="1062" y="316" width="244" height="62" rx="8" fill="url(#cy-rain-sign-cyan)" />
    <g fill="#04222a" opacity="0.72">
      <rect x="1086" y="334" width="44" height="7" rx="3.5" />
      <rect x="1086" y="352" width="28" height="7" rx="3.5" />
      <rect x="1146" y="334" width="30" height="25" rx="4" />
      <rect x="1192" y="334" width="44" height="7" rx="3.5" />
      <rect x="1192" y="352" width="62" height="7" rx="3.5" />
    </g>

    <rect x="958" y="490" width="52" height="146" rx="8" fill="#ff3fbf" opacity="0.22" filter="url(#cy-rain-blur-mag)" />
    <rect x="966" y="498" width="36" height="130" rx="5" fill="url(#cy-rain-sign-mag)" opacity="0.9" />
    <g fill="#3a0a2c" opacity="0.6">
      <rect x="976" y="520" width="16" height="4" rx="2" />
      <rect x="976" y="534" width="20" height="4" rx="2" />
      <rect x="976" y="548" width="12" height="4" rx="2" />
    </g>

    <rect x="648" y="580" width="170" height="56" rx="8" fill="#22d3ee" opacity="0.18" filter="url(#cy-rain-blur-cyan)" />
    <rect x="656" y="588" width="154" height="40" rx="5" fill="url(#cy-rain-sign-cyan)" opacity="0.75" />
    <g fill="#04222a" opacity="0.55">
      <rect x="672" y="604" width="34" height="6" rx="3" />
      <rect x="716" y="604" width="20" height="6" rx="3" />
      <rect x="746" y="604" width="48" height="6" rx="3" />
    </g>

    {/* 招牌附近楼体的冷光边，不铺满全屏 */}
    <rect x="402" y="286" width="2" height="196" fill="#7deeff" opacity="0.22" />
    <rect x="1060" y="316" width="2" height="62" fill="#9ff6ff" opacity="0.25" />
    <rect x="1024" y="498" width="2" height="130" fill="#ff9fe4" opacity="0.16" />

    {/* 地面：湿漉漉的深色路面 */}
    <rect x="0" y="744" width="1440" height="156" fill="url(#cy-rain-ground)" />
    <rect x="0" y="744" width="1440" height="52" fill="url(#cy-rain-ground-glow)" />
    <ellipse cx="720" cy="812" rx="620" ry="90" fill="#16314a" opacity="0.14" />

    {/* 积水里的倒影：窄亮条 + 轻微模糊，只在光源正下方出现 */}
    <g fill="url(#cy-rain-reflect-mag)" filter="url(#cy-rain-blur-refl)">
      <rect x="256" y="752" width="16" height="140" opacity="0.85" />
      <rect x="280" y="752" width="9" height="108" opacity="0.7" />
      <rect x="298" y="752" width="5" height="76" opacity="0.5" />
      <rect x="242" y="752" width="4" height="82" opacity="0.45" />
    </g>
    <g fill="#ff9fe4" opacity="0.26">
      <rect x="262" y="790" width="34" height="2" rx="1" />
      <rect x="254" y="824" width="46" height="2" rx="1" />
      <rect x="268" y="856" width="26" height="2" rx="1" />
      <rect x="258" y="880" width="38" height="2" rx="1" />
    </g>
    <g fill="url(#cy-rain-reflect-cyan)" filter="url(#cy-rain-blur-refl)">
      <rect x="1072" y="752" width="14" height="130" opacity="0.75" />
      <rect x="1106" y="752" width="9" height="102" opacity="0.65" />
      <rect x="1146" y="752" width="16" height="142" opacity="0.6" />
      <rect x="1190" y="752" width="8" height="96" opacity="0.55" />
      <rect x="1230" y="752" width="12" height="120" opacity="0.5" />
      <rect x="1272" y="752" width="5" height="78" opacity="0.4" />
    </g>
    <g fill="#bff6ff" opacity="0.22">
      <rect x="1090" y="786" width="150" height="2" rx="1" />
      <rect x="1110" y="818" width="188" height="2" rx="1" />
      <rect x="1122" y="850" width="120" height="2" rx="1" />
      <rect x="1098" y="878" width="164" height="2" rx="1" />
    </g>
    <g fill="url(#cy-rain-reflect-cyan)" opacity="0.4">
      <rect x="120" y="752" width="3" height="124" />
      <rect x="208" y="752" width="2" height="98" />
      <rect x="940" y="752" width="2" height="86" />
      <rect x="1318" y="752" width="4" height="132" />
    </g>
    <g fill="url(#cy-rain-reflect-mag)" opacity="0.36">
      <rect x="500" y="752" width="2" height="80" />
      <rect x="878" y="752" width="3" height="118" />
      <rect x="986" y="752" width="2" height="100" />
      <rect x="404" y="752" width="2" height="66" />
    </g>
    <ellipse cx="300" cy="836" rx="280" ry="54" fill="url(#cy-rain-pool-mag)" filter="url(#cy-rain-blur-pool)" />
    <ellipse cx="1130" cy="852" rx="300" ry="56" fill="url(#cy-rain-pool-cyan)" filter="url(#cy-rain-blur-pool)" />
    <ellipse cx="280" cy="784" rx="92" ry="18" fill="#ff4fc8" opacity="0.2" filter="url(#cy-rain-blur-pool)" />
    <ellipse cx="1180" cy="788" rx="150" ry="22" fill="#5fe9ff" opacity="0.16" filter="url(#cy-rain-blur-pool)" />
    <ellipse cx="720" cy="790" rx="110" ry="24" fill="#5fe9ff" opacity="0.1" filter="url(#cy-rain-blur-pool)" />
    <g fill="#d8fbff" opacity="0.1">
      <rect x="160" y="898" width="260" height="2" rx="1" />
      <rect x="620" y="872" width="180" height="2" rx="1" />
      <rect x="900" y="890" width="320" height="2" rx="1" />
      <rect x="1180" y="876" width="140" height="2" rx="1" />
    </g>

    {/* 雨幕盖在最上层 */}
    <rect width="1440" height="900" fill="url(#cy-rain-drops-a)" opacity="0.65" />
    <rect width="1440" height="900" fill="url(#cy-rain-drops-b)" opacity="0.5" />
  </svg>
)

// ------------------------------------------------------------
// 深空星域
// ------------------------------------------------------------
const deepSpace: SceneArt = ({ className }) => (
  <svg
    viewBox="0 0 1440 900"
    preserveAspectRatio="xMidYMid slice"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <radialGradient id="cy-deep-bg" cx="0.5" cy="0.48" r="0.78">
        <stop offset="0%" stopColor="#0d1b3f" />
        <stop offset="45%" stopColor="#081128" />
        <stop offset="100%" stopColor="#03060f" />
      </radialGradient>
      <radialGradient id="cy-deep-halo">
        <stop offset="0%" stopColor="#d8f4ff" stopOpacity="0.3" />
        <stop offset="40%" stopColor="#6fb9ff" stopOpacity="0.1" />
        <stop offset="100%" stopColor="#6fb9ff" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="cy-deep-ray">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
        <stop offset="28%" stopColor="#d6f4ff" stopOpacity="0.38" />
        <stop offset="68%" stopColor="#7cc8ff" stopOpacity="0.06" />
        <stop offset="100%" stopColor="#7cc8ff" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="cy-deep-neb-a">
        <stop offset="0%" stopColor="#5443a6" stopOpacity="0.14" />
        <stop offset="100%" stopColor="#5443a6" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="cy-deep-neb-b">
        <stop offset="0%" stopColor="#147a8f" stopOpacity="0.1" />
        <stop offset="100%" stopColor="#147a8f" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="cy-deep-station-light">
        <stop offset="0%" stopColor="#7df0ff" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#7df0ff" stopOpacity="0" />
      </radialGradient>
      <pattern id="cy-deep-stars" width="220" height="180" patternUnits="userSpaceOnUse">
        <circle cx="24" cy="30" r="1.1" fill="#dfeaff" opacity="0.65" />
        <circle cx="90" cy="72" r="1.4" fill="#ffffff" opacity="0.8" />
        <circle cx="160" cy="36" r="1" fill="#cfe0ff" opacity="0.45" />
        <circle cx="52" cy="140" r="1.2" fill="#e6efff" opacity="0.6" />
        <circle cx="188" cy="132" r="1.3" fill="#dbe7ff" opacity="0.5" />
        <circle cx="124" cy="110" r="0.9" fill="#c6d8f5" opacity="0.4" />
        <circle cx="200" cy="86" r="0.8" fill="#c6d8f5" opacity="0.3" />
      </pattern>
      <pattern id="cy-deep-stars-bright" width="440" height="360" patternUnits="userSpaceOnUse" patternTransform="translate(40 30)">
        <circle cx="60" cy="70" r="2" fill="#f2f7ff" opacity="0.9" />
        <circle cx="280" cy="190" r="1.8" fill="#e8f1ff" opacity="0.8" />
        <circle cx="380" cy="52" r="1.5" fill="#dbe9ff" opacity="0.7" />
      </pattern>
    </defs>

    {/* 深空底色、星点、星云 */}
    <rect width="1440" height="900" fill="url(#cy-deep-bg)" />
    <ellipse cx="300" cy="300" rx="360" ry="250" fill="url(#cy-deep-neb-a)" />
    <ellipse cx="1200" cy="720" rx="400" ry="260" fill="url(#cy-deep-neb-b)" />
    <rect width="1440" height="900" fill="url(#cy-deep-stars)" opacity="0.85" />
    <rect width="1440" height="900" fill="url(#cy-deep-stars-bright)" opacity="0.75" />

    {/* 透视网格：竖线汇向视点，横线间距随距离拉开 */}
    <g stroke="#2c5f9e" strokeWidth="1" opacity="0.16">
      <line x1="720" y1="455" x2="-560" y2="900" />
      <line x1="720" y1="455" x2="-380" y2="900" />
      <line x1="720" y1="455" x2="-200" y2="900" />
      <line x1="720" y1="455" x2="-20" y2="900" />
      <line x1="720" y1="455" x2="160" y2="900" />
      <line x1="720" y1="455" x2="340" y2="900" />
      <line x1="720" y1="455" x2="520" y2="900" />
      <line x1="720" y1="455" x2="720" y2="900" />
      <line x1="720" y1="455" x2="900" y2="900" />
      <line x1="720" y1="455" x2="1080" y2="900" />
      <line x1="720" y1="455" x2="1260" y2="900" />
      <line x1="720" y1="455" x2="1440" y2="900" />
      <line x1="720" y1="455" x2="1620" y2="900" />
      <line x1="720" y1="455" x2="1800" y2="900" />
      <line x1="720" y1="455" x2="1980" y2="900" />
    </g>
    <g stroke="#2c5f9e" strokeWidth="1" opacity="0.11">
      <line x1="0" y1="474" x2="1440" y2="474" />
      <line x1="0" y1="506" x2="1440" y2="506" />
      <line x1="0" y1="552" x2="1440" y2="552" />
      <line x1="0" y1="616" x2="1440" y2="616" />
      <line x1="0" y1="700" x2="1440" y2="700" />
      <line x1="0" y1="808" x2="1440" y2="808" />
    </g>

    {/* 星座：细连线 + 小节点 */}
    <g stroke="#7dd3fc" strokeWidth="1.2" fill="none" opacity="0.34">
      <polyline points="152,256 232,188 300,242 262,320 182,342 232,188" />
      <polyline points="1012,222 1082,180 1160,232 1122,312 1042,302 1082,180" />
      <polyline points="378,552 468,514 452,612 378,552" />
    </g>
    <g fill="#a5e9ff">
      <circle cx="152" cy="256" r="2.4" />
      <circle cx="232" cy="188" r="2.8" />
      <circle cx="300" cy="242" r="2.2" />
      <circle cx="262" cy="320" r="2.4" />
      <circle cx="182" cy="342" r="2" />
      <circle cx="1012" cy="222" r="2.2" />
      <circle cx="1082" cy="180" r="2.6" />
      <circle cx="1160" cy="232" r="2.2" />
      <circle cx="1122" cy="312" r="2.4" />
      <circle cx="1042" cy="302" r="2" />
      <circle cx="378" cy="552" r="2.4" />
      <circle cx="468" cy="514" r="2.2" />
      <circle cx="452" cy="612" r="2.6" />
    </g>
    <g fill="none" stroke="#9fe3ff" opacity="0.5">
      <circle cx="232" cy="188" r="7" strokeWidth="1.2" />
      <circle cx="1082" cy="180" r="8" strokeWidth="1.2" />
      <circle cx="452" cy="612" r="5" strokeWidth="1" />
    </g>

    {/* 远处空间站轮廓 */}
    <circle cx="1140" cy="610" r="46" fill="url(#cy-deep-station-light)" opacity="0.4" />
    <g transform="translate(1140 610) rotate(-14)">
      <rect x="-64" y="-13" width="128" height="26" rx="5" fill="#0c1626" stroke="#1d3350" strokeWidth="1.2" />
      <rect x="-112" y="-5" width="40" height="10" rx="2" fill="#0a1322" />
      <rect x="72" y="-5" width="40" height="10" rx="2" fill="#0a1322" />
      <line x1="0" y1="-13" x2="0" y2="-34" stroke="#132238" strokeWidth="2" />
      <circle cx="0" cy="-38" r="3" fill="#7dd3fc" opacity="0.9" />
      <circle cx="-40" cy="0" r="2" fill="#22d3ee" opacity="0.8" />
      <circle cx="46" cy="0" r="1.6" fill="#22d3ee" opacity="0.7" />
      <ellipse cx="0" cy="0" rx="78" ry="8" fill="none" stroke="#1b3350" strokeWidth="1" opacity="0.8" />
    </g>

    {/* 中心恒星：光晕、四道光芒、星核 */}
    <circle cx="720" cy="442" r="300" fill="url(#cy-deep-halo)" />
    <path
      d="M720 248 C724 372 730 410 894 440 C730 462 724 504 720 640 C716 504 710 462 546 440 C710 410 716 372 720 248 Z"
      fill="url(#cy-deep-ray)"
    />
    <g fill="none" stroke="#5ea9ff" strokeWidth="1" opacity="0.16">
      <circle cx="720" cy="442" r="210" strokeDasharray="4 10" />
      <circle cx="720" cy="442" r="318" strokeDasharray="3 14" />
      <circle cx="720" cy="442" r="430" strokeDasharray="2 18" opacity="0.6" />
    </g>
    <circle cx="720" cy="442" r="26" fill="none" stroke="#cdeeff" strokeWidth="1.5" strokeOpacity="0.35" />
    <circle cx="720" cy="442" r="8" fill="#f9feff" />
    <circle cx="720" cy="442" r="3.4" fill="#ffffff" />

    {/* 恒星附近的几粒尘埃，避免中心过空 */}
    <g fill="#cfeaff">
      <circle cx="600" cy="360" r="1.2" opacity="0.5" />
      <circle cx="836" cy="330" r="1" opacity="0.45" />
      <circle cx="880" cy="500" r="1.4" opacity="0.4" />
      <circle cx="572" cy="512" r="1" opacity="0.35" />
    </g>
  </svg>
)

export const CYBER_SCENES: Record<string, SceneArt> = {
  'cyber-orbit-station': orbitStation,
  'cyber-neon-rain': neonRain,
  'cyber-deep-space': deepSpace,
}
