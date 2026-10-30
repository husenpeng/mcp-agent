/**
 * Canvas artwork for blade signs, advertising screens, and shop fascias: one influencer-marketing module per atlas slot,
 * from creator search to live commerce, so no advert of the launch city repeats. None shows the Tomato mark before its
 * reveal.
 */

import * as THREE from 'three'
import { SPLASH_SCREEN_SLOTS, SPLASH_SIGN_SLOTS } from './splash-city.ts'
import { splashShopName } from './splash-street.ts'

const CJK_FONT = '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif'
const LATIN_FONT = '"Montserrat", "Segoe UI", "Helvetica Neue", sans-serif'

type Context = CanvasRenderingContext2D

/** A neon colour: the saturated tube, its pale lit core, and the dark panel behind it. Cores stay below bloom. */
interface NeonInk {
  readonly tube: string
  readonly core: string
  readonly panel: string
}

const RED: NeonInk = { tube: '#ff2d3c', core: '#ffb8b0', panel: '#16060a' }
const CYAN: NeonInk = { tube: '#22c8ff', core: '#b6eeff', panel: '#03111b' }
const PINK: NeonInk = { tube: '#ff4c9e', core: '#ffc0db', panel: '#150613' }
const AMBER: NeonInk = { tube: '#ffa526', core: '#ffd99a', panel: '#150d03' }
const MINT: NeonInk = { tube: '#2ef0c0', core: '#b4f7e2', panel: '#031410' }
const VIOLET: NeonInk = { tube: '#a77dff', core: '#dacbff', panel: '#0c0717' }

/** One blade sign: the module name stacked down the panel and its English caption along the foot. */
export interface SplashSignArtwork {
  readonly glyphs: string
  readonly caption: string
  readonly ink: NeonInk
}

/** Blade-sign artwork in atlas-slot order; inks alternate warm and cool along each side of the avenue. */
export const SPLASH_SIGN_ARTWORK: readonly SplashSignArtwork[] = [
  { glyphs: '投流加热', caption: 'PAID BOOST', ink: AMBER },
  { glyphs: '相似达人', caption: 'LOOKALIKE', ink: MINT },
  { glyphs: '粉丝增长', caption: 'GROWTH', ink: RED },
  { glyphs: '竞品监测', caption: 'COMPETITORS', ink: RED },
  { glyphs: '达人报价', caption: 'RATE CARD', ink: MINT },
  { glyphs: '档期日历', caption: 'SCHEDULE', ink: AMBER },
  { glyphs: '达人管理', caption: 'CREATOR CRM', ink: CYAN },
  { glyphs: '数据复盘', caption: 'RECAP', ink: CYAN },
  { glyphs: '脚本审核', caption: 'SCRIPT REVIEW', ink: VIOLET },
  { glyphs: '爆款追踪', caption: 'TRENDING', ink: VIOLET },
  { glyphs: '达人画像', caption: 'PROFILE', ink: CYAN },
  { glyphs: '品牌安全', caption: 'BRAND SAFETY', ink: MINT },
  { glyphs: '矩阵分发', caption: 'DISTRIBUTION', ink: VIOLET },
  { glyphs: '种草投放', caption: 'SEEDING', ink: RED },
  { glyphs: '实时看板', caption: 'DASHBOARD', ink: PINK },
  { glyphs: '议价谈判', caption: 'NEGOTIATION', ink: PINK },
  { glyphs: '内容共创', caption: 'CO-CREATION', ink: PINK },
  { glyphs: '假粉检测', caption: 'FAKE CHECK', ink: AMBER },
]

/** Width over height of one sign slot and of one screen slot; panels crop their artwork to their own proportions. */
const SIGN_ASPECT = 0.25
const SCREEN_ASPECT = 2

const SIGN_SLOT = { width: 256, height: 1024 } as const
const SCREEN_SLOT = { width: 1024, height: 512 } as const
const SIGN_COLUMNS = 9
const SCREEN_COLUMNS = 3

function surface(width: number, height: number): { canvas: HTMLCanvasElement; context: Context } {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (context === null) throw new Error('splash: signage canvas is unavailable')
  return { canvas, context }
}

/** Shrink `font(size)` from `size` until `value` fits `width` pixels. */
function fitFont(context: Context, value: string, width: number, size: number, font: (size: number) => string): void {
  let fitted = size
  context.font = font(fitted)
  while (fitted > 10 && context.measureText(value).width > width) {
    fitted -= 1
    context.font = font(fitted)
  }
}

/** A neon tube along `trace`: a soft halo in the tube colour under a thin pale core. */
function tube(context: Context, ink: NeonInk, width: number, trace: () => void): void {
  context.save()
  context.lineJoin = 'round'
  context.lineCap = 'round'
  context.shadowColor = ink.tube
  context.shadowBlur = width * 2
  context.strokeStyle = ink.tube
  context.lineWidth = width
  trace()
  context.stroke()
  context.shadowBlur = 0
  context.strokeStyle = ink.core
  context.lineWidth = Math.max(1.5, width * 0.32)
  trace()
  context.stroke()
  context.restore()
}

/**
 * Paint one blade sign. Glyphs keep their exact outlines: a pale core inside a saturated inner rim, with the halo baked
 * into the artwork so it shrinks with the sign instead of blooming across its strokes.
 */
function drawSign(context: Context, layer: Context, left: number, top: number, artwork: SplashSignArtwork): void {
  const { width, height } = SIGN_SLOT
  const { ink } = artwork
  const panel = context.createLinearGradient(0, top, 0, top + height)
  panel.addColorStop(0, '#050307')
  panel.addColorStop(0.5, ink.panel)
  panel.addColorStop(1, '#050307')
  context.fillStyle = panel
  context.fillRect(left, top, width, height)
  // Panels crop up to 4% of their height, so the frame keeps 44 px clear of the slot's top and bottom.
  context.strokeStyle = 'rgba(255, 255, 255, 0.07)'
  context.lineWidth = 2
  context.strokeRect(left + 9, top + 30, width - 18, height - 60)
  tube(context, ink, 6, () => {
    context.beginPath()
    context.roundRect(left + 20, top + 46, width - 40, height - 92, 16)
  })
  const glyphs = Array.from(artwork.glyphs)
  const stepY = 700 / Math.max(1, glyphs.length)
  const size = Math.min(160, Math.floor(stepY * 0.86))
  layer.clearRect(0, 0, width, height)
  layer.globalCompositeOperation = 'source-over'
  layer.textAlign = 'center'
  layer.textBaseline = 'middle'
  layer.font = `700 ${size}px ${CJK_FONT}`
  layer.fillStyle = ink.core
  glyphs.forEach((glyph, index) => { layer.fillText(glyph, width / 2, 104 + stepY * (index + 0.5)) })
  layer.globalCompositeOperation = 'source-atop'
  layer.strokeStyle = ink.tube
  layer.lineWidth = Math.max(6, size * 0.065)
  layer.lineJoin = 'round'
  glyphs.forEach((glyph, index) => { layer.strokeText(glyph, width / 2, 104 + stepY * (index + 0.5)) })
  context.save()
  context.shadowColor = ink.tube
  context.shadowBlur = 18
  context.drawImage(layer.canvas, left, top)
  context.restore()
  tube(context, ink, 4, () => {
    context.beginPath()
    context.moveTo(left + 70, top + 842)
    context.lineTo(left + width - 70, top + 842)
  })
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  fitFont(context, artwork.caption, width - 76, 28, size => `500 ${size}px ${LATIN_FONT}`)
  context.fillStyle = ink.core
  context.fillText(artwork.caption, left + width / 2, top + 892)
}

/** Text placement for screen copy; sizes are in atlas pixels. */
interface Copy {
  readonly size: number
  readonly color: string
  readonly weight?: number
  readonly align?: CanvasTextAlign
  readonly latin?: boolean
  /** Halo colour; copy without one has no halo. */
  readonly glow?: string
}

function copy(context: Context, value: string, x: number, y: number, style: Copy): void {
  context.save()
  context.font = `${style.weight ?? 600} ${style.size}px ${style.latin === true ? LATIN_FONT : CJK_FONT}`
  context.textAlign = style.align ?? 'left'
  context.textBaseline = 'middle'
  context.fillStyle = style.color
  if (style.glow !== undefined) {
    context.shadowColor = style.glow
    context.shadowBlur = Math.round(style.size * 0.16)
  }
  context.fillText(value, x, y)
  context.restore()
}

/** The screen's module name and tagline in the upper left. */
function headline(context: Context, title: string, tagline: string, accent: string, y = 112): void {
  copy(context, title, 64, y, { size: 86, color: '#ffffff', weight: 800, glow: accent })
  copy(context, tagline, 68, y + 74, { size: 32, color: accent, weight: 600 })
}

function card(context: Context, x: number, y: number, width: number, height: number, fill: string | CanvasGradient, radius = 18): void {
  context.fillStyle = fill
  context.beginPath()
  context.roundRect(x, y, width, height, radius)
  context.fill()
}

function pill(context: Context, x: number, y: number, label: string, tint: string, latin = false): number {
  context.font = `600 26px ${latin ? LATIN_FONT : CJK_FONT}`
  const width = context.measureText(label).width + 40
  card(context, x, y, width, 46, tint, 23)
  copy(context, label, x + width / 2, y + 24, { size: 26, color: '#ffffff', align: 'center', latin })
  return width
}

/** A creator avatar: a tinted disc with a head-and-shoulders silhouette. */
function avatar(context: Context, x: number, y: number, radius: number, tint: string): void {
  context.save()
  context.beginPath()
  context.arc(x, y, radius, 0, Math.PI * 2)
  context.fillStyle = tint
  context.fill()
  context.clip()
  context.fillStyle = 'rgba(0, 0, 0, 0.42)'
  context.beginPath()
  context.arc(x, y - radius * 0.18, radius * 0.36, 0, Math.PI * 2)
  context.fill()
  context.beginPath()
  context.ellipse(x, y + radius * 0.82, radius * 0.66, radius * 0.5, 0, 0, Math.PI * 2)
  context.fill()
  context.restore()
}

function backdrop(context: Context, width: number, height: number, from: string, to: string): void {
  const sky = context.createLinearGradient(0, 0, width, height)
  sky.addColorStop(0, from)
  sky.addColorStop(1, to)
  context.fillStyle = sky
  context.fillRect(0, 0, width, height)
  const vignette = context.createRadialGradient(width / 2, height / 2, height * 0.3, width / 2, height / 2, width * 0.62)
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)')
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.45)')
  context.fillStyle = vignette
  context.fillRect(0, 0, width, height)
}

/** Outreach: an AI-drafted invitation email, its send button, and the running count of invitations sent. */
function drawOutreachScreen(context: Context, width: number, height: number): void {
  backdrop(context, width, height, '#2f0807', '#100203')
  headline(context, '一键建联', 'AI 写邮件 · 批量触达达人', '#ffb547')
  card(context, 580, 46, 380, 420, 'rgba(255, 236, 214, 0.1)')
  copy(context, 'To: creator@mail.com', 612, 96, { size: 26, color: '#ffe9cf', weight: 500, latin: true })
  copy(context, '合作邀请｜新品种草', 612, 146, { size: 30, color: '#ffffff', weight: 700 })
  context.fillStyle = 'rgba(255, 181, 71, 0.5)'
  context.fillRect(612, 176, 316, 3)
  const lines = [300, 316, 248, 290, 204]
  lines.forEach((lineWidth, index) => {
    context.fillStyle = `rgba(255, 233, 207, ${0.5 - index * 0.05})`
    context.fillRect(612, 206 + index * 34, lineWidth, 12)
  })
  card(context, 612, 384, 150, 52, '#ff6a2b', 26)
  copy(context, '发送', 687, 411, { size: 28, color: '#ffffff', weight: 700, align: 'center' })
  context.strokeStyle = '#ffb547'
  context.lineWidth = 5
  context.strokeRect(70, 300, 92, 64)
  context.beginPath()
  context.moveTo(70, 300)
  context.lineTo(116, 338)
  context.lineTo(162, 300)
  context.stroke()
  copy(context, '已发送', 188, 312, { size: 28, color: 'rgba(255, 233, 207, 0.75)' })
  copy(context, '1,286', 186, 360, { size: 52, color: '#ffffff', weight: 700, latin: true })
  for (let bar = 0; bar < 8; bar += 1) {
    const barHeight = 24 + ((bar * 37) % 11) * 6
    context.fillStyle = bar % 3 === 0 ? '#ffb547' : '#ff4b30'
    context.globalAlpha = 0.75
    context.fillRect(72 + bar * 52, 470 - barHeight, 32, barHeight)
  }
  context.globalAlpha = 1
}

/** Global creators: a dot-matrix world map with routes out of Shanghai and the platforms covered. */
function drawWorldScreen(context: Context, width: number, height: number): void {
  backdrop(context, width, height, '#02121a', '#01070c')
  headline(context, '全球达人', '覆盖 200+ 国家和地区', '#3dffd0')
  const continents = [
    [560, 160, 86, 62], [618, 320, 40, 80], [728, 136, 42, 32], [742, 272, 56, 78],
    [856, 164, 108, 72], [892, 286, 36, 17], [930, 366, 42, 26],
  ] as const
  context.fillStyle = 'rgba(61, 255, 208, 0.42)'
  for (let y = 70; y < 460; y += 13) {
    for (let x = 460; x < 990; x += 13) {
      const land = continents.some(([cx, cy, rx, ry]) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 < 1)
      if (!land) continue
      context.beginPath()
      context.arc(x, y, 3.2, 0, Math.PI * 2)
      context.fill()
    }
  }
  const hub = [876, 190] as const
  const routes = [[520, 186], [724, 128], [790, 232], [892, 292], [632, 340], [936, 366]] as const
  context.lineWidth = 4
  for (const [x, y] of routes) {
    context.strokeStyle = 'rgba(41, 214, 255, 0.85)'
    context.beginPath()
    context.moveTo(hub[0], hub[1])
    context.quadraticCurveTo((hub[0] + x) / 2, Math.min(hub[1], y) - 70, x, y)
    context.stroke()
    context.fillStyle = '#e4fbff'
    context.beginPath()
    context.arc(x, y, 7, 0, Math.PI * 2)
    context.fill()
  }
  context.fillStyle = '#3dffd0'
  context.beginPath()
  context.arc(hub[0], hub[1], 11, 0, Math.PI * 2)
  context.fill()
  let cursor = 66
  for (const platform of ['TikTok', 'YouTube']) {
    cursor += pill(context, cursor, 286, platform, 'rgba(61, 255, 208, 0.22)', true) + 14
  }
  pill(context, 66, 344, 'Instagram', 'rgba(61, 255, 208, 0.22)', true)
  copy(context, '1200万+', 66, 436, { size: 54, color: '#ffffff', weight: 800 })
  copy(context, '达人资源', 290, 440, { size: 30, color: '#9ff5df' })
}

/** E-contract: a signed agreement with its signature and a confirmation seal. */
function drawContractScreen(context: Context, width: number, height: number): void {
  backdrop(context, width, height, '#071330', '#03060f')
  headline(context, '电子签约', '报价 · 合同 · 在线确认', '#7fb4ff')
  card(context, 600, 40, 330, 432, 'rgba(190, 212, 255, 0.14)')
  copy(context, '合作协议', 632, 92, { size: 34, color: '#ffffff', weight: 700 })
  const lines = [260, 240, 266, 200, 252, 230]
  lines.forEach((lineWidth, index) => {
    context.fillStyle = `rgba(214, 228, 255, ${0.42 - index * 0.03})`
    context.fillRect(632, 136 + index * 30, lineWidth, 10)
  })
  context.strokeStyle = '#a9ccff'
  context.lineWidth = 5
  context.lineCap = 'round'
  context.beginPath()
  context.moveTo(640, 382)
  context.bezierCurveTo(670, 330, 690, 420, 720, 370)
  context.bezierCurveTo(740, 340, 760, 410, 800, 372)
  context.stroke()
  context.fillStyle = 'rgba(214, 228, 255, 0.4)'
  context.fillRect(632, 406, 200, 3)
  context.save()
  context.translate(860, 380)
  context.rotate(-0.18)
  context.strokeStyle = '#ff4b55'
  context.lineWidth = 7
  context.beginPath()
  context.arc(0, 0, 56, 0, Math.PI * 2)
  context.stroke()
  context.lineWidth = 2.5
  context.beginPath()
  context.arc(0, 0, 45, 0, Math.PI * 2)
  context.stroke()
  copy(context, '已签约', 0, 2, { size: 28, color: '#ff4b55', weight: 800, align: 'center' })
  context.restore()
  copy(context, '签约周期', 68, 318, { size: 30, color: 'rgba(214, 228, 255, 0.7)' })
  copy(context, '3 分钟', 66, 384, { size: 64, color: '#ffffff', weight: 800 })
}

/** Audience insight: a gender donut, an age histogram, and the share of genuine followers. */
function drawAudienceScreen(context: Context, width: number, height: number): void {
  backdrop(context, width, height, '#032332', '#010a10')
  headline(context, '受众洞察', '粉丝画像 · 真实度分析', '#29d6ff')
  const segments = [[0.62, '#29d6ff'], [0.38, '#ff4fa0']] as const
  let start = -Math.PI / 2
  for (const [share, tint] of segments) {
    context.strokeStyle = tint
    context.lineWidth = 32
    context.beginPath()
    context.arc(170, 372, 78, start + 0.03, start + share * Math.PI * 2 - 0.03)
    context.stroke()
    start += share * Math.PI * 2
  }
  copy(context, '女 62%', 170, 372, { size: 30, color: '#e4fbff', weight: 700, align: 'center' })
  const ages = [0.34, 0.86, 1, 0.58, 0.3, 0.16]
  const labels = ['18-', '18+', '25+', '31+', '41+', '50+']
  ages.forEach((age, index) => {
    const barHeight = 150 * age
    context.fillStyle = index === 2 ? '#3dffd0' : 'rgba(41, 214, 255, 0.75)'
    context.fillRect(320 + index * 60, 430 - barHeight, 38, barHeight)
    copy(context, labels[index] ?? '', 339 + index * 60, 458, { size: 20, color: 'rgba(228, 251, 255, 0.6)', align: 'center', latin: true })
  })
  copy(context, '真实粉丝', 720, 300, { size: 30, color: '#9feaff' })
  copy(context, '92%', 712, 380, { size: 96, color: '#e4fbff', weight: 800, latin: true, glow: '#29d6ff' })
  card(context, 720, 438, 220, 12, 'rgba(41, 214, 255, 0.2)', 6)
  card(context, 720, 438, 202, 12, '#29d6ff', 6)
}

/** Creator search: a query over matched creators with their match scores, beside a scanning radar. */
function drawSearchScreen(context: Context, width: number, height: number): void {
  backdrop(context, width, height, '#3a0424', '#05121e')
  headline(context, 'AI 达人搜索', '全网达人 · 秒级匹配', '#ff4fa0')
  card(context, 64, 238, 540, 64, 'rgba(255, 255, 255, 0.12)', 32)
  context.strokeStyle = '#ff9fd0'
  context.lineWidth = 4
  context.beginPath()
  context.arc(104, 268, 15, 0, Math.PI * 2)
  context.moveTo(115, 279)
  context.lineTo(128, 292)
  context.stroke()
  copy(context, '美妆 · 10万+粉丝 · 高互动', 144, 270, { size: 28, color: '#ffe2ef', weight: 500 })
  const results = [['#ff4fa0', '美妆', '98%'], ['#29d6ff', '护肤', '95%'], ['#ffae2e', '彩妆', '91%']] as const
  results.forEach(([tint, tag, score], index) => {
    const y = 322 + index * 56
    card(context, 64, y, 540, 46, 'rgba(255, 255, 255, 0.07)', 12)
    avatar(context, 92, y + 23, 17, tint)
    context.fillStyle = 'rgba(255, 255, 255, 0.6)'
    context.fillRect(124, y + 16, 126, 14)
    card(context, 270, y + 8, 76, 30, tint, 15)
    copy(context, tag, 308, y + 24, { size: 20, color: '#ffffff', align: 'center' })
    copy(context, score, 584, y + 24, { size: 28, color: tint, weight: 700, align: 'right', latin: true })
  })
  for (let ring = 0; ring < 5; ring += 1) {
    context.strokeStyle = `rgba(255, 79, 160, ${0.5 - ring * 0.08})`
    context.lineWidth = 3
    context.beginPath()
    context.arc(820, 270, 46 + ring * 30, 0, Math.PI * 2)
    context.stroke()
  }
  const sweep = context.createRadialGradient(820, 270, 0, 820, 270, 166)
  sweep.addColorStop(0, 'rgba(255, 79, 160, 0.42)')
  sweep.addColorStop(1, 'rgba(255, 79, 160, 0)')
  context.fillStyle = sweep
  context.beginPath()
  context.moveTo(820, 270)
  context.arc(820, 270, 166, -1.3, -0.5)
  context.fill()
  for (const [x, y, tint] of [[760, 190, '#29d6ff'], [910, 230, '#ffae2e'], [870, 360, '#ff4fa0'], [740, 330, '#3dffd0']] as const) {
    avatar(context, x, y, 18, tint)
  }
}

/** The airship's campaign advert: the practice's name over a rising return curve, laid out for the hull's wide screen. */
function drawCampaignScreen(context: Context, width: number, height: number): void {
  context.fillStyle = '#0a0216'
  context.fillRect(0, 0, width, height)
  // The airship screen is about 3:1, so only the band 83 < y < 429 shows.
  context.strokeStyle = 'rgba(255, 79, 160, 0.4)'
  context.lineWidth = 2
  for (let line = 0; line <= 16; line += 1) {
    context.beginPath()
    context.moveTo(width * 0.62, 250)
    context.lineTo(-300 + line * 120, 430)
    context.stroke()
  }
  for (let row = 0; row < 5; row += 1) {
    const y = 250 + (row / 4) ** 2 * 180
    context.beginPath()
    context.moveTo(0, y)
    context.lineTo(width, y)
    context.stroke()
  }
  copy(context, '达人营销', 64, 168, { size: 92, color: '#ffffff', weight: 800, glow: '#29d6ff' })
  copy(context, 'INFLUENCER MARKETING', 66, 250, { size: 38, color: '#bdf3ff', weight: 500, latin: true })
  copy(context, '品牌 × 达人 · 一站协同', 66, 318, { size: 32, color: '#ffc6e2', weight: 600 })
  const points = [[620, 330], [690, 300], [760, 312], [830, 236], [900, 196], [960, 120]] as const
  tube(context, PINK, 6, () => {
    context.beginPath()
    points.forEach(([x, y], index) => {
      if (index === 0) context.moveTo(x, y)
      else context.lineTo(x, y)
    })
  })
  context.fillStyle = '#ffe2ef'
  for (const [x, y] of points) {
    context.beginPath()
    context.arc(x, y, 8, 0, Math.PI * 2)
    context.fill()
  }
  copy(context, 'ROI 3.6x', 690, 392, { size: 52, color: '#ffffff', weight: 700, latin: true, glow: '#ff4fa0' })
}

/** Live commerce: a creator's live room on a phone, its product card, and the session's sales. */
function drawLiveScreen(context: Context, width: number, height: number): void {
  backdrop(context, width, height, '#2a0418', '#0c0310')
  card(context, 92, 34, 214, 444, '#05030a', 30)
  const room = context.createLinearGradient(0, 48, 0, 464)
  room.addColorStop(0, '#7a1d55')
  room.addColorStop(1, '#2a0c40')
  card(context, 102, 46, 194, 420, room, 22)
  avatar(context, 199, 210, 74, '#ff8fb8')
  card(context, 116, 62, 70, 32, '#ff2d55', 8)
  copy(context, 'LIVE', 151, 79, { size: 20, color: '#ffffff', weight: 700, align: 'center', latin: true })
  copy(context, '8.6万', 282, 79, { size: 22, color: '#ffffff', weight: 600, align: 'right' })
  card(context, 116, 360, 166, 86, 'rgba(255, 255, 255, 0.9)', 14)
  copy(context, '新品口红', 132, 384, { size: 22, color: '#2a0418', weight: 700 })
  copy(context, '¥99', 132, 422, { size: 30, color: '#ff2d55', weight: 800, latin: true })
  card(context, 206, 404, 64, 30, '#ff2d55', 15)
  copy(context, '抢购', 238, 420, { size: 18, color: '#ffffff', weight: 700, align: 'center' })
  context.fillStyle = '#ff6f9c'
  for (const [x, y, size] of [[330, 300, 16], [352, 238, 12], [336, 176, 9]] as const) {
    context.beginPath()
    context.moveTo(x, y + size)
    context.bezierCurveTo(x - size * 1.6, y - size * 0.2, x - size * 0.5, y - size * 1.3, x, y - size * 0.4)
    context.bezierCurveTo(x + size * 0.5, y - size * 1.3, x + size * 1.6, y - size * 0.2, x, y + size)
    context.fill()
  }
  copy(context, '直播带货', 420, 130, { size: 90, color: '#ffffff', weight: 800, glow: '#ff3a6e' })
  copy(context, '达人直播 · 边看边买', 424, 208, { size: 34, color: '#ff8fb0', weight: 600 })
  copy(context, '单场 GMV', 424, 318, { size: 30, color: 'rgba(255, 220, 232, 0.7)' })
  copy(context, '¥1,280万', 420, 392, { size: 76, color: '#ffffff', weight: 800 })
}

/** Creator ranking: this week's podium by heat. */
function drawRankingScreen(context: Context, width: number, height: number): void {
  backdrop(context, width, height, '#1c0b2a', '#08040e')
  headline(context, '达人榜单', '周热度 · 品类排行', '#ffcf4a')
  const podium = [[2, 610, 300, '#29d6ff', '数码'], [1, 760, 240, '#ffcf4a', '美妆'], [3, 910, 336, '#ff4fa0', '美食']] as const
  for (const [rank, x, top, tint, field] of podium) {
    const block = context.createLinearGradient(0, top, 0, 480)
    block.addColorStop(0, tint)
    block.addColorStop(1, 'rgba(255, 255, 255, 0.05)')
    card(context, x - 64, top, 128, 480 - top, block, 12)
    copy(context, String(rank), x, top + 52, { size: 64, color: '#1c0b2a', weight: 800, align: 'center', latin: true })
    avatar(context, x, top - 62, 44, tint)
    copy(context, field, x, top - 132, { size: 26, color: '#ffffff', weight: 600, align: 'center' })
  }
  copy(context, 'No.1 美妆 · 860万热度', 68, 330, { size: 32, color: '#ffe7a6', weight: 600 })
  copy(context, '↑ 32%', 64, 404, { size: 64, color: '#ffffff', weight: 800, latin: true })
}

/** One screen artwork: the module it advertises and its painter, in atlas-slot order. */
export interface SplashScreenArtwork {
  readonly module: string
  readonly paint: (context: Context, width: number, height: number) => void
}

/**
 * Screen artwork in atlas-slot order: the layout's facade screens take the first `SPLASH_SCREEN_SLOT.facades`, followed
 * by the airship's and the two bus-shelter posters'.
 */
export const SPLASH_SCREEN_ARTWORK: readonly SplashScreenArtwork[] = [
  { module: '受众洞察', paint: drawAudienceScreen },
  { module: '一键建联', paint: drawOutreachScreen },
  { module: '全球达人', paint: drawWorldScreen },
  { module: '电子签约', paint: drawContractScreen },
  { module: 'AI 达人搜索', paint: drawSearchScreen },
  { module: '达人营销', paint: drawCampaignScreen },
  { module: '直播带货', paint: drawLiveScreen },
  { module: '达人榜单', paint: drawRankingScreen },
]

const FASCIA_SLOT = { width: 448, height: 84 } as const
const FASCIA_COLUMNS = 4

/** Draw `value` centred on `x` with `spacing` extra pixels between characters. */
function spaced(context: Context, value: string, x: number, y: number, spacing: number): void {
  const characters = Array.from(value)
  const widths = characters.map(character => context.measureText(character).width)
  let cursor = x - (widths.reduce((sum, width) => sum + width, 0) + spacing * (characters.length - 1)) / 2
  context.textAlign = 'left'
  characters.forEach((character, index) => {
    context.fillText(character, cursor, y)
    cursor += (widths[index] ?? 0) + spacing
  })
}

/**
 * Paint the lettering of every shop fascia as a white-on-black coverage mask, one slot per shop; the facade shader
 * colours it as neon letters, a light box, or unlit letters.
 * @param shops - number of shops along the avenue, from `splashShopSlots`.
 * @param anisotropy - anisotropic filtering level for grazing views down the avenue.
 * @returns the fascia atlas; its texture holds linear coverage, not colour.
 */
export function createFasciaAtlas(shops: number, anisotropy: number): SplashAtlas {
  const rows = Math.max(1, Math.ceil(shops / FASCIA_COLUMNS))
  const { width, height } = FASCIA_SLOT
  const { canvas, context } = surface(width * FASCIA_COLUMNS, height * rows)
  context.fillStyle = '#000000'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.textBaseline = 'middle'
  for (let shop = 0; shop < shops; shop += 1) {
    const { name, trade } = splashShopName(shop)
    const x = (shop % FASCIA_COLUMNS) * width + width / 2
    const top = Math.floor(shop / FASCIA_COLUMNS) * height
    context.fillStyle = '#ffffff'
    context.font = `700 48px ${CJK_FONT}`
    spaced(context, name, x, top + 34, 6)
    context.fillStyle = '#a8a8a8'
    context.font = `500 15px ${LATIN_FONT}`
    spaced(context, trade, x, top + 70, 3)
  }
  const texture = atlasTexture(canvas, anisotropy)
  texture.colorSpace = THREE.NoColorSpace
  return { texture, grid: new THREE.Vector2(FASCIA_COLUMNS, rows), aspect: width / height }
}

function atlasTexture(canvas: HTMLCanvasElement, anisotropy: number): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = anisotropy
  texture.needsUpdate = true
  return texture
}

/** An artwork atlas: its texture, its column/row grid of slots, and one slot's width over height. */
export interface SplashAtlas {
  readonly texture: THREE.CanvasTexture
  readonly grid: THREE.Vector2
  readonly aspect: number
}

/**
 * Paint every blade sign into a grid of vertical slots.
 * @param anisotropy - anisotropic filtering level for grazing views down the avenue.
 * @returns the sign atlas.
 */
export function createSignAtlas(anisotropy: number): SplashAtlas {
  if (SPLASH_SIGN_ARTWORK.length !== SPLASH_SIGN_SLOTS) throw new Error('splash: sign artwork does not fill the sign atlas')
  const rows = Math.ceil(SPLASH_SIGN_SLOTS / SIGN_COLUMNS)
  const { canvas, context } = surface(SIGN_SLOT.width * SIGN_COLUMNS, SIGN_SLOT.height * rows)
  const layer = surface(SIGN_SLOT.width, SIGN_SLOT.height).context
  SPLASH_SIGN_ARTWORK.forEach((artwork, index) => {
    drawSign(context, layer, (index % SIGN_COLUMNS) * SIGN_SLOT.width, Math.floor(index / SIGN_COLUMNS) * SIGN_SLOT.height, artwork)
  })
  return { texture: atlasTexture(canvas, anisotropy), grid: new THREE.Vector2(SIGN_COLUMNS, rows), aspect: SIGN_ASPECT }
}

/**
 * Paint every advertising screen into a grid of slots.
 * @param anisotropy - anisotropic filtering level for grazing views down the avenue.
 * @returns the screen atlas.
 */
export function createScreenAtlas(anisotropy: number): SplashAtlas {
  if (SPLASH_SCREEN_ARTWORK.length !== SPLASH_SCREEN_SLOTS) throw new Error('splash: screen artwork does not fill the screen atlas')
  const rows = Math.ceil(SPLASH_SCREEN_SLOTS / SCREEN_COLUMNS)
  const { width, height } = SCREEN_SLOT
  const { canvas, context } = surface(width * SCREEN_COLUMNS, height * rows)
  SPLASH_SCREEN_ARTWORK.forEach((artwork, index) => {
    context.save()
    context.translate((index % SCREEN_COLUMNS) * width, Math.floor(index / SCREEN_COLUMNS) * height)
    context.beginPath()
    context.rect(0, 0, width, height)
    context.clip()
    artwork.paint(context, width, height)
    context.restore()
  })
  return { texture: atlasTexture(canvas, anisotropy), grid: new THREE.Vector2(SCREEN_COLUMNS, rows), aspect: SCREEN_ASPECT }
}
