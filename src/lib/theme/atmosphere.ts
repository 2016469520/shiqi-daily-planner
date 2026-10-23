// ============================================================
// 主题氛围系统：场景、角色、短句的数据契约
//
// 所有视觉素材都是本项目原创的 SVG（程序化绘制），随软件打包、离线可用，
// 不依赖任何第三方图片 URL，也不含任何受版权保护的角色/作品。
// 素材清单见 docs/ATMOSPHERE_ASSETS.md。
//
// 新增一套主题的氛围内容只需要：
// 1. 在 SCENES / CHARACTERS 里加条目
// 2. 在 components/atmosphere/art 下加对应的 SVG 组件并注册
// 3. 在 QUOTES 里加短句
// 运行时与设置界面会自动出现新选项。
// ============================================================

import type { ThemeId } from './types'

// ------------------------------------------------------------
// 场景
// ------------------------------------------------------------

export interface SceneDefinition {
  id: string
  themeId: ThemeId
  name: string
  description: string
  /** 缩略图与遮罩用的主色调 */
  tint: string
  /** 场景明暗：决定默认遮罩强度，保证文字可读 */
  luminance: 'light' | 'mid' | 'dark'
}

export const SCENES: SceneDefinition[] = [
  // 樱色 Anime
  {
    id: 'anime-sakura-street',
    themeId: 'anime',
    name: '樱花街道',
    description: '放学路上的坡道，风把花瓣吹成一条粉色的河',
    tint: '#f9a8d4',
    luminance: 'light',
  },
  {
    id: 'anime-sunset-city',
    themeId: 'anime',
    name: '日落城市',
    description: '天台上的黄昏，远处的楼群被染成橘色',
    tint: '#fb923c',
    luminance: 'mid',
  },
  {
    id: 'anime-star-night',
    themeId: 'anime',
    name: '星空',
    description: '夏夜的银河，蝉声和远处的灯',
    tint: '#818cf8',
    luminance: 'dark',
  },
  // 霓虹终端 Cyberpunk
  {
    id: 'cyber-orbit-station',
    themeId: 'cyber',
    name: '轨道空间站',
    description: '舷窗外是行星环，舱内只剩散热风扇的低鸣',
    tint: '#0e7490',
    luminance: 'dark',
  },
  {
    id: 'cyber-neon-rain',
    themeId: 'cyber',
    name: '霓虹雨夜',
    description: '雨水沿着全息广告流下去，数据在积水里发光',
    tint: '#22d3ee',
    luminance: 'dark',
  },
  {
    id: 'cyber-deep-space',
    themeId: 'cyber',
    name: '深空星域',
    description: '导航屏外的星图，每一颗都是一个待办坐标',
    tint: '#1e3a8a',
    luminance: 'dark',
  },
  // 云母 Fluent
  {
    id: 'fluent-aurora',
    themeId: 'fluent',
    name: '极光山峦',
    description: '清冷的极光压在雪线上，安静得像刚开的机',
    tint: '#7dd3fc',
    luminance: 'mid',
  },
  {
    id: 'fluent-dunes',
    themeId: 'fluent',
    name: '柔光沙丘',
    description: '风把沙脊吹成一条条温柔的曲线',
    tint: '#fcd9a8',
    luminance: 'light',
  },
  {
    id: 'fluent-morning',
    themeId: 'fluent',
    name: '晨光几何',
    description: '抽象的光斑与圆角矩形，像刚整理好的桌面',
    tint: '#c7dcf7',
    luminance: 'light',
  },
  // 留白 Minimal
  {
    id: 'minimal-ridge',
    themeId: 'minimal',
    name: '黑白山脊',
    description: '只有山、雾和你今天要做的事',
    tint: '#6b7280',
    luminance: 'light',
  },
  {
    id: 'minimal-lake',
    themeId: 'minimal',
    name: '雾湖',
    description: '湖面没有波纹，留白就是内容',
    tint: '#9ca3af',
    luminance: 'light',
  },
  {
    id: 'minimal-skyline',
    themeId: 'minimal',
    name: '城市天际线',
    description: '清晨六点的楼群，安静而克制',
    tint: '#a1a1aa',
    luminance: 'light',
  },
  // 像素机 Retro Pixel
  {
    id: 'pixel-town',
    themeId: 'pixel',
    name: '像素小镇',
    description: '存档点就设在小镇广场，走到哪儿都能重来',
    tint: '#29adff',
    luminance: 'mid',
  },
  {
    id: 'pixel-forest',
    themeId: 'pixel',
    name: '像素森林',
    description: '地图边缘的森林，据说有隐藏道具',
    tint: '#3ba55d',
    luminance: 'dark',
  },
  {
    id: 'pixel-sky',
    themeId: 'pixel',
    name: '像素夜空',
    description: '八位机的星空，星星只有四个像素',
    tint: '#1a1c2c',
    luminance: 'dark',
  },
  // 暗格 Dark Bento
  {
    id: 'bento-mesh',
    themeId: 'bento',
    name: '暗金网格',
    description: '低饱和的深色网格，工作台该有的样子',
    tint: '#f59e0b',
    luminance: 'dark',
  },
  {
    id: 'bento-ocean',
    themeId: 'bento',
    name: '深蓝洋流',
    description: '深海一样的蓝，适合长时间盯着屏幕',
    tint: '#0ea5e9',
    luminance: 'dark',
  },
  {
    id: 'bento-grain',
    themeId: 'bento',
    name: '颗粒渐变',
    description: '一层薄薄的颗粒，让深色不显得死',
    tint: '#7dd3fc',
    luminance: 'dark',
  },
]

export function scenesForTheme(themeId: ThemeId): SceneDefinition[] {
  return SCENES.filter((s) => s.themeId === themeId)
}

export function getScene(id: string | null | undefined): SceneDefinition | null {
  return SCENES.find((s) => s.id === id) ?? null
}

/** 主题的默认场景（第一张） */
export function defaultSceneFor(themeId: ThemeId): SceneDefinition {
  return scenesForTheme(themeId)[0]
}

// ------------------------------------------------------------
// 角色
// ------------------------------------------------------------

export type CharacterExpression = 'idle' | 'happy' | 'thinking' | 'working' | 'error' | 'sleepy'

export const EXPRESSION_LABELS: Record<CharacterExpression, string> = {
  idle: '待机',
  happy: '开心',
  thinking: '思考',
  working: '工作中',
  error: '抱歉',
  sleepy: '困了',
}

export interface CharacterDefinition {
  id: string
  themeId: ThemeId
  name: string
  /** 一句话设定，展示在设置页 */
  description: string
  expressions: CharacterExpression[]
}

export const CHARACTERS: CharacterDefinition[] = [
  {
    id: 'pixel-pix',
    themeId: 'pixel',
    name: 'PIX',
    description: '八位机里的冒险者。完成任务时他会跳一下，像捡到了金币。',
    expressions: ['idle', 'happy', 'thinking', 'working', 'error'],
  },
]

export const CHARACTER_IDS = CHARACTERS.map((c) => c.id)

export function charactersForTheme(themeId: ThemeId): CharacterDefinition[] {
  return CHARACTERS.filter((c) => c.themeId === themeId)
}

export function getCharacter(id: string | null | undefined): CharacterDefinition | null {
  return CHARACTERS.find((c) => c.id === id) ?? null
}

export function defaultCharacterFor(themeId: ThemeId): CharacterDefinition | null {
  return charactersForTheme(themeId)[0] ?? null
}

/** 角色台词：按真实状态切换，不编造不存在的进度 */
export const CHARACTER_LINES: Record<string, Partial<Record<CharacterExpression, string[]>>> = {
  'pixel-pix': {
    idle: ['READY.', '今天也要去打怪吗？', '任务清单还没清完呢。'],
    happy: ['LEVEL UP!', '这一关过了！'],
    thinking: ['让我看看地图…', '这条路对吗？'],
    working: ['正在执行。', '别打断我，快完成了。'],
    error: ['GAME OVER…再来一次。', '出 bug 了。'],
  },
}

export function linesFor(characterId: string, expression: CharacterExpression): string[] {
  const byExpression = CHARACTER_LINES[characterId]
  if (!byExpression) return []
  return byExpression[expression] ?? byExpression.idle ?? []
}

// ------------------------------------------------------------
// 短句库
//
// 原创短句为本项目创作；标注了作者的条目出自公有领域古籍（礼记/论语/庄子/
// 陶渊明/苏轼/王维等），作者与出处均已核对，不含任何现代版权文本。
// ------------------------------------------------------------

export interface Quote {
  text: string
  /** 作者或出处；原创短句留空 */
  author?: string
  /** 公有领域出处说明 */
  source?: string
}

export const QUOTES: Record<ThemeId, Quote[]> = {
  anime: [
    { text: '把想做的事写下来，就已经完成了一半。' },
    { text: '今天的一小步，是明天回忆里的高光时刻。' },
    { text: '樱花落下的速度，刚好够你做完一件事。' },
    { text: '不要小看每一次按时完成，它们在悄悄改变你。' },
    { text: '累的时候就看看天空，云不会因为你停下而责怪你。' },
    { text: '故事还没写完，今天只是其中一页。' },
    { text: '先把最重要的一件事做完，剩下的会变得轻一些。' },
    { text: '你认真生活的样子，本身就很动人。' },
  ],
  cyber: [
    { text: '未知不是障碍，是待解析的坐标。' },
    { text: '每一条待办，都是一次系统升级。' },
    { text: '信号可以中断，方向不可以。' },
    { text: '在噪声里保持频率，就是专业。' },
    { text: '把复杂拆成可执行的指令，问题就结束了一半。' },
    { text: '长夜之后，日志会证明你来过。' },
    { text: '不要等待最优解，先让系统跑起来。' },
    { text: '所有远征，都始于一次点击。' },
  ],
  fluent: [
    { text: '今天的天气不错，适合把重要的事放在上午。' },
    { text: '整理好桌面，思路也会跟着清楚。' },
    { text: '一步一步来，慢一点也算在前进。' },
    { text: '留一点空档，是给意外的好事腾地方。' },
    { text: '把大任务拆小，完成感会来得更早。' },
    { text: '做完一件，就歇三十秒——这是允许的。' },
    { text: '规律比冲刺更可靠。' },
    { text: '今天不需要完美，只需要完成。' },
  ],
  minimal: [
    { text: '少即是多。', source: '密斯·凡·德·罗（现代主义建筑格言）' },
    { text: '学而不思则罔，思而不学则殆。', author: '孔子', source: '《论语·为政》' },
    { text: '吾生也有涯，而知也无涯。', author: '庄子', source: '《庄子·养生主》' },
    { text: '盛年不重来，一日难再晨。', author: '陶渊明', source: '《杂诗》' },
    { text: '不识庐山真面目，只缘身在此山中。', author: '苏轼', source: '《题西林壁》' },
    { text: '行到水穷处，坐看云起时。', author: '王维', source: '《终南别业》' },
    { text: '重要的不是速度，而是方向。' },
    { text: '把一件事做完，比把十件事排进列表更难。' },
  ],
  pixel: [
    { text: '存档点已就位，随时可以重来。' },
    { text: '今天的目标：推进一格地图。' },
    { text: '遇到 BOSS，先看看背包里有什么。' },
    { text: '经验值不会骗人，它只承认你打过的怪。' },
    { text: '失败只是读档，不是结束。' },
    { text: '隐藏道具，通常在你多走一步的地方。' },
    { text: '别急着通关，支线往往更有意思。' },
    { text: '按 START 继续。', source: '街机通用提示语' },
  ],
  bento: [
    { text: '先做最难的那一格。' },
    { text: '把注意力放回手上这件事。' },
    { text: '今天的产出，比今天的计划更重要。' },
    { text: '留白不是浪费，是给思考的位置。' },
    { text: '一次只推进一个模块。' },
    { text: '好的工作节奏，是可持续的节奏。' },
    { text: '把完成的写下来，比把想做的写下来更有力量。' },
    { text: '深夜适合收尾，不适合开新坑。' },
  ],
}

export function quotesForTheme(themeId: ThemeId): Quote[] {
  return QUOTES[themeId] ?? []
}

/** 按日期取"每日一句"，同一天稳定 */
export function dailyQuoteIndex(themeId: ThemeId, extra: number, dateKey: string): number {
  const total = quotesForTheme(themeId).length + extra
  if (total <= 0) return 0
  let hash = 0
  for (let i = 0; i < dateKey.length; i++) hash = (hash * 31 + dateKey.charCodeAt(i)) % 100000
  return hash % total
}
