/**
 * The eleven creator-marketing robot templates. Every template shares one
 * execution profile — a manual trigger, a planned run with retry, a
 * 400k-token, 30-minute, 300-tool-call budget, unrestricted network, and a
 * file deliverable (an HTML report plus an xlsx detail workbook) — and
 * differs in the skill it loads and in its copy.
 * @module @tomato/experimental-robot-templates-marketing
 */

import { brandString } from '@tomato/branded'
import type { RobotTemplate, RobotTemplateId, RobotTemplateSpec, RobotTemplateText } from '@tomato/experimental-robot'

/** Shared run-level acceptance, prepended to each template's own lines. */
const ACCEPTANCE = {
  en: [
    'Writes one self-contained HTML report and one xlsx workbook into the working directory and names both paths in the final message.',
    'Every metric in the report states its source, collection time, and formula; estimated values are labeled as estimates.',
    'Sources that could not be reached, and missing credentials, are listed in a data gaps section instead of being silently skipped.',
  ],
  zh: [
    '在工作目录写出一份可独立打开的 HTML 报告和一份 xlsx 明细表，并在最终回复中给出两个文件路径。',
    '报告中每个指标都注明数据来源、采集时间和计算口径；估算值明确标注为估算。',
    '无法访问的数据源和缺失的凭据列在「数据缺口」一节，不得静默跳过。',
  ],
} as const

/**
 * Build the shared specification blocks for one template.
 * @param skill - bundled skill the run loads first.
 * @returns the non-localized template blocks.
 */
function marketingSpec(skill: string): RobotTemplateSpec {
  return {
    position: { owner: 'me', callers: [], callees: [], escalation: [], visibility: 'team' },
    goal: {
      triggers: [{ kind: 'manual' }],
      strategy: 'plan',
      stopConditions: [],
      failurePolicy: 'retry',
      budget: { tokens: 400_000, millis: 1_800_000, cost: 0, toolCalls: 300 },
      maxConcurrentRuns: 1,
    },
    capability: {
      tools: { allow: [], deny: [] },
      mcpServers: [],
      skills: [skill],
      workspaceRoots: [],
      dataClasses: ['public'],
      credentials: [],
      sandbox: 'workspace',
      permissionPreset: 'workspace-write',
      network: 'any',
    },
    io: {
      input: { schema: 'robot.request', version: 1 },
      output: { schema: 'marketing.report', format: 'file', delivery: 'artifact' },
    },
    memory: { read: [], write: [], recall: 'none' },
    a2a: { intents: [], peers: [] },
  }
}

interface TemplateCopy {
  readonly id: string
  readonly category: string
  readonly skill: string
  readonly en: Omit<RobotTemplateText, 'acceptance'> & { readonly acceptance: readonly string[] }
  readonly zh: Omit<RobotTemplateText, 'acceptance'> & { readonly acceptance: readonly string[] }
}

function template(copy: TemplateCopy): RobotTemplate {
  const skillLine = {
    en: `Load the ${copy.skill} skill before collecting data and follow its pipeline.`,
    zh: `采集数据前先加载 ${copy.skill} 技能，并按其中的流程执行。`,
  }
  return {
    id: brandString<RobotTemplateId>(copy.id),
    category: copy.category,
    text: {
      en: { ...copy.en, mission: `${copy.en.mission} ${skillLine.en}`, acceptance: [...ACCEPTANCE.en, ...copy.en.acceptance] },
      zh: { ...copy.zh, mission: `${copy.zh.mission}${skillLine.zh}`, acceptance: [...ACCEPTANCE.zh, ...copy.zh.acceptance] },
    },
    spec: marketingSpec(copy.skill),
  }
}

/**
 * Platform pair: one product-selection and one data-insight template per platform.
 * @param platform - display name such as `TikTok`.
 * @param key - lowercase id prefix and category such as `tiktok`.
 * @param selection - platform-specific selection copy.
 * @param insight - platform-specific insight copy.
 * @returns the two templates.
 */
function platformPair(
  platform: string,
  key: string,
  selection: { readonly en: string; readonly zh: string; readonly signalsEn: string; readonly signalsZh: string },
  insight: { readonly en: string; readonly zh: string; readonly signalsEn: string; readonly signalsZh: string },
): readonly RobotTemplate[] {
  return [
    template({
      id: `${key}-product-selection`,
      category: key,
      skill: `${key}-product-selection`,
      en: {
        category: platform,
        name: `${platform} product selection analyst`,
        description: selection.en,
        mission: `Given a category, keywords, market, and price band from the run instruction, find products with rising demand on ${platform}: collect ${selection.signalsEn}, validate demand against search interest, estimate margin, and rank opportunities.`,
        successCriteria: [
          'Ranks at least ten candidate products with an opportunity score and the signals behind it.',
          'Marks each product as validated, watch, or rejected using both content heat and search-interest trend.',
        ],
        acceptance: ['The xlsx workbook has one sheet each for products, raw posts or videos, search interest, and cost assumptions.'],
      },
      zh: {
        category: platform,
        name: `${platform} 选品分析师`,
        description: selection.zh,
        mission: `根据运行指令给出的品类、关键词、市场和价格带，在 ${platform} 上找出需求上升的商品：采集${selection.signalsZh}，用搜索热度做双重验证，估算利润，并给出机会排序。`,
        successCriteria: [
          '至少给出 10 个候选商品的机会分及其依据信号。',
          '结合内容热度和搜索热度趋势，把每个商品标为已验证、待观察或淘汰。',
        ],
        acceptance: ['xlsx 明细表分别包含商品、原始帖子或视频、搜索热度、成本假设四个工作表。'],
      },
    }),
    template({
      id: `${key}-data-insight`,
      category: key,
      skill: `${key}-data-insight`,
      en: {
        category: platform,
        name: `${platform} data insight analyst`,
        description: insight.en,
        mission: `Given accounts, topics, or keywords from the run instruction, analyze ${platform} performance: collect ${insight.signalsEn}, compute engagement and growth metrics against peers, detect emerging trends, and recommend actions.`,
        successCriteria: [
          'Reports engagement rate, posting cadence, and growth for every requested account against at least one peer benchmark.',
          'Separates lasting trends from short spikes using growth, spread, and persistence.',
        ],
        acceptance: ['The xlsx workbook has one sheet each for accounts, posts or videos, topic time series, and benchmarks.'],
      },
      zh: {
        category: platform,
        name: `${platform} 数据洞察师`,
        description: insight.zh,
        mission: `根据运行指令给出的账号、话题或关键词，分析 ${platform} 上的表现：采集${insight.signalsZh}，计算互动率和增长指标并与同类对标，识别新兴趋势，给出行动建议。`,
        successCriteria: [
          '对每个指定账号给出互动率、发布节奏和增长，并至少与一个同类账号对标。',
          '用增速、扩散度和持续时间区分长期趋势和短期热点。',
        ],
        acceptance: ['xlsx 明细表分别包含账号、帖子或视频、话题时序、对标四个工作表。'],
      },
    }),
  ]
}

/** All marketing templates in display order. */
export const MARKETING_TEMPLATES: readonly RobotTemplate[] = [
  template({
    id: 'brand-insight',
    category: 'brand',
    skill: 'brand-insight',
    en: {
      category: 'Brand insight',
      name: 'Brand marketing insight analyst',
      description: 'Share of voice, net sentiment, search interest, discussion topics, and positioning for a brand against its competitors.',
      mission: 'Given a brand, its competitors, aliases, markets, and a time window from the run instruction, measure share of voice, net sentiment, search and attention trends, discussion topics, and positioning across news, Reddit, YouTube, and the brands\' sites.',
      successCriteria: [
        'Reports share of voice by mentions and by engagement for the brand and every named competitor.',
        'Explains each mention spike with the events or posts that caused it.',
      ],
      acceptance: ['States which net-sentiment formula the report uses.'],
    },
    zh: {
      category: '品牌洞察',
      name: '品牌营销洞察师',
      description: '对比品牌与竞品的声量份额、净情感、搜索热度、讨论话题和品牌定位。',
      mission: '根据运行指令给出的品牌、竞品、别名、市场和时间窗，从新闻、Reddit、YouTube 和品牌官网衡量声量份额、净情感、搜索与关注度趋势、讨论话题和品牌定位。',
      successCriteria: [
        '给出品牌和每个竞品按提及量、按互动量两种口径的声量份额。',
        '对每个提及量峰值，说明引发它的事件或帖子。',
      ],
      acceptance: ['写明报告采用的净情感计算公式。'],
    },
  }),
  template({
    id: 'influencer-marketing',
    category: 'influencer',
    skill: 'influencer-marketing',
    en: {
      category: 'Influencer marketing',
      name: 'Influencer marketing specialist',
      description: 'Creator discovery, lookalikes, audience quality, engagement benchmarks, rate estimates, and verified public contacts across TikTok, YouTube, Instagram, and X.',
      mission: 'Given a niche, market, platforms, follower tiers, and seed creators or competitors from the run instruction, discover matching creators, find lookalikes, score engagement and audience quality against tier benchmarks, estimate rates, and extract publicly listed business contacts.',
      successCriteria: [
        'Lists creators with followers, median engagement rate, its tier percentile, an audience quality score, and an estimated rate.',
        'Every contact email is publicly listed by the creator and carries a verification result.',
      ],
      acceptance: ['The xlsx workbook has creators, posts, lookalikes, contacts, and outreach-log sheets.'],
    },
    zh: {
      category: '达人营销',
      name: '达人营销专家',
      description: '在 TikTok、YouTube、Instagram、X 上找达人、找相似达人，评估受众质量和互动基准，估算报价，提取并校验公开联系方式。',
      mission: '根据运行指令给出的细分领域、市场、平台、粉丝档位和种子达人或竞品，发现匹配的达人并扩展相似达人，按粉丝档位基准评估互动率和受众质量，估算报价，提取达人公开的商务联系方式。',
      successCriteria: [
        '列出每位达人的粉丝数、互动率中位数及其所在档位分位、受众质量分和报价估算。',
        '每个联系邮箱都是达人公开列出的，并附校验结果。',
      ],
      acceptance: ['xlsx 明细表包含达人、帖子、相似达人、联系方式、建联记录五个工作表。'],
    },
  }),
  template({
    id: 'creative-intelligence',
    category: 'creative',
    skill: 'creative-intelligence',
    en: {
      category: 'Creative and competitor intelligence',
      name: 'Creative and competitor intelligence analyst',
      description: 'Competitor ads from public ad libraries, long-running creatives, hook and format breakdowns, landing-page offers, and testable creative briefs.',
      mission: 'Given competitor brands, pages or domains, markets, and a time window from the run instruction, collect their ads from public ad libraries, cluster creative variants, break down hooks, formats, selling points, and calls to action, compare landing pages, and write creative briefs to test.',
      successCriteria: [
        'Ranks long-running creatives by days running and variant count, with the first frame and hook text of each.',
        'Ends with at least three creative briefs that cite the competitor creatives they draw on.',
      ],
      acceptance: ['States which markets the ad libraries cover for commercial ads.'],
    },
    zh: {
      category: '素材竞品',
      name: '素材与竞品情报分析师',
      description: '从公开广告库收集竞品广告，找出长投素材，拆解 hook 和形式，对比落地页 offer，产出可测试的创意 brief。',
      mission: '根据运行指令给出的竞品品牌、主页或域名、市场和时间窗，从公开广告库收集其广告，聚合素材变体，拆解 hook、形式、卖点和行动号召，对比落地页，并写出待测试的创意 brief。',
      successCriteria: [
        '按投放天数和变体数排出长投素材，并附每条的首帧和 hook 文案。',
        '最后至少给出三条创意 brief，并注明所借鉴的竞品素材。',
      ],
      acceptance: ['写明各广告库对商业广告覆盖哪些市场。'],
    },
  }),
  ...platformPair('TikTok', 'tiktok', {
    en: 'TikTok Shop product opportunities from sold-count snapshots, content heat, search interest, and a margin model.',
    zh: '用已售数快照、内容热度、搜索热度和利润模型找出 TikTok Shop 商品机会。',
    signalsEn: 'product prices and sold counts, related video views and engagement, and Creative Center keyword popularity',
    signalsZh: '商品价格与已售数、相关视频的播放与互动、Creative Center 关键词热度',
  }, {
    en: 'Account, hashtag, sound, and video analytics with trend and breakout detection on TikTok.',
    zh: 'TikTok 账号、话题、音乐和视频分析，识别趋势与爆发点。',
    signalsEn: 'profiles, videos, hashtags, and sounds with their view, like, comment, and share counts',
    signalsZh: '账号资料、视频、话题和音乐及其播放、点赞、评论、分享数',
  }),
  ...platformPair('Instagram', 'instagram', {
    en: 'Product demand on Instagram from Reels and hashtag mentions, purchase-intent comments, and cross-platform validation.',
    zh: '从 Reels、话题提及、购买意向评论和跨平台验证判断 Instagram 上的商品需求。',
    signalsEn: 'hashtag and Reels posts, product mentions, and purchase-intent comments',
    signalsZh: '话题与 Reels 帖子、商品提及和带购买意向的评论',
  }, {
    en: 'Profile, post, and Reels analytics with hashtag contribution and posting-time patterns on Instagram.',
    zh: 'Instagram 账号、帖子和 Reels 分析，含话题贡献度与发布时段规律。',
    signalsEn: 'profiles, posts, Reels, and hashtags with their engagement counts',
    signalsZh: '账号资料、帖子、Reels 和话题及其互动数',
  }),
  ...platformPair('X', 'x', {
    en: 'Product and trend discovery from keyword buzz, recommendation threads, and demand signals in X posts.',
    zh: '从 X 帖子的关键词讨论、推荐串和需求信号中发现商品与趋势。',
    signalsEn: 'posts matching product keywords with their engagement, and requests or recommendations for products',
    signalsZh: '匹配商品关键词的帖子及其互动，以及求推荐、推荐商品的帖子',
  }, {
    en: 'Account and topic analytics with sentiment and conversation drivers on X.',
    zh: 'X 账号与话题分析，含情感倾向和讨论驱动因素。',
    signalsEn: 'profiles, posts, replies, and topic searches with their engagement counts',
    signalsZh: '账号资料、帖子、回复和话题搜索结果及其互动数',
  }),
  ...platformPair('YouTube', 'youtube', {
    en: 'Product opportunities from review and unboxing videos, comment demand mining, and affiliate links on YouTube.',
    zh: '从 YouTube 测评和开箱视频、评论需求挖掘和联盟链接中找商品机会。',
    signalsEn: 'review and unboxing videos with their views and engagement, comments, and affiliate links in descriptions',
    signalsZh: '测评与开箱视频及其播放和互动、评论，以及视频描述中的联盟链接',
  }, {
    en: 'Channel and video analytics with view velocity, outlier videos, and comment themes on YouTube.',
    zh: 'YouTube 频道与视频分析，含播放增速、异常爆款视频和评论主题。',
    signalsEn: 'channels, uploads, and comments with their view, like, and comment counts',
    signalsZh: '频道、上传视频和评论及其播放、点赞、评论数',
  }),
]
