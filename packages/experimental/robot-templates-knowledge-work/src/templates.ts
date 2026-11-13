/**
 * One Tomato robot template per vendored Claude knowledge-work role, built from
 * the plugin's own manifest description and the shipped skill names. Every
 * template shares one execution profile and differs in its skills and copy.
 * @module @tomato/experimental-robot-templates-knowledge-work/templates
 */

import { brandString } from '@tomato/branded'
import type { RobotTemplate, RobotTemplateId, RobotTemplateSpec, RobotTemplateText } from '@tomato/experimental-robot'

/** Copy for one role, without the skill-derived lines. */
interface RoleCopy {
  readonly en: Omit<RobotTemplateText, 'acceptance' | 'successCriteria'>
  readonly zh: Omit<RobotTemplateText, 'acceptance' | 'successCriteria'>
}

const ACCEPTANCE = {
  en: ['The final message states what was produced and where it was written, or why the request could not be completed.'],
  zh: ['最终回复说明产出了什么、写到了哪里，或说明为何无法完成该请求。'],
} as const

const SUCCESS = {
  en: [
    'Selects the role skill that matches the request and follows its documented workflow instead of improvising a different process.',
    'Names the connectors, files, and data sources it actually read, and lists every unavailable source instead of skipping it.',
  ],
  zh: [
    '选用与该请求匹配的岗位技能，并按其记录的流程执行，不另起一套流程。',
    '说明实际读取的连接器、文件与数据源；不可用的来源逐条列出，不得跳过。',
  ],
} as const

/**
 * Build the specification blocks every knowledge-work template shares.
 * @param skills - shipped skill names the run may load.
 * @returns the non-localized template blocks.
 */
function knowledgeSpec(skills: readonly string[]): RobotTemplateSpec {
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
      plugins: [],
      skills,
      workspaceRoots: [],
      dataClasses: ['public', 'internal'],
      credentials: [],
      sandbox: 'workspace',
      permissionPreset: 'workspace-write',
      network: 'any',
    },
    io: {
      input: { schema: 'robot.request', version: 1 },
      output: { schema: 'knowledge-work.deliverable', format: 'markdown', delivery: 'chat' },
    },
    memory: { read: [], write: [], recall: 'none' },
    a2a: { intents: [], peers: [] },
  }
}

/** Role copy keyed by vendored plugin directory name. */
export const ROLE_COPY: Readonly<Record<string, RoleCopy>> = {
  marketing: {
    en: {
      category: 'Marketing',
      name: 'Marketing operator',
      description: 'Creates content, plans campaigns, enforces brand voice, briefs on competitors, and reports campaign performance.',
      mission: 'Run marketing work end to end: draft or review content, plan campaigns, keep brand voice consistent, brief on competitors, and report what is working.',
    },
    zh: {
      category: '营销',
      name: '营销运营机器人',
      description: '撰写内容、策划活动、统一品牌语气、整理竞品简报，并汇报活动效果。',
      mission: '端到端完成营销工作：起草或审校内容、策划活动、保持品牌语气一致、整理竞品简报，并汇报实际效果。',
    },
  },
  sales: {
    en: {
      category: 'Sales',
      name: 'Sales operator',
      description: 'Researches prospects, prepares calls, reviews the pipeline, drafts outreach, and keeps competitive battlecards current.',
      mission: 'Run sales work end to end: research accounts and contacts, prepare calls, review deals and pipeline, draft follow-ups, and answer with competitive positioning.',
    },
    zh: {
      category: '销售',
      name: '销售运营机器人',
      description: '调研潜在客户、准备通话、审查销售漏斗、起草外联内容，并维护竞品应对要点。',
      mission: '端到端完成销售工作：调研客户与联系人、准备通话、审查商机和漏斗、起草跟进内容，并给出有竞争力的应答。',
    },
  },
  'customer-support': {
    en: {
      category: 'Customer support',
      name: 'Customer support operator',
      description: 'Triages tickets, drafts responses, packages escalations, researches customer context, and turns resolved issues into knowledge base articles.',
      mission: 'Run customer support work end to end: triage incoming tickets, research the customer and product context, draft a reply or escalation, and turn a resolved issue into a reusable answer.',
    },
    zh: {
      category: '客户支持',
      name: '客户支持机器人',
      description: '分诊工单、起草回复、整理升级材料、调研客户背景，并把已解决问题沉淀为知识库文章。',
      mission: '端到端完成客户支持工作：分诊工单、调研客户与产品背景、起草回复或升级材料，并把已解决问题沉淀为可复用的答案。',
    },
  },
  'product-management': {
    en: {
      category: 'Product management',
      name: 'Product management operator',
      description: 'Writes specs, plans roadmaps, synthesizes user research, keeps stakeholders updated, and tracks the competitive landscape.',
      mission: 'Run product management work end to end: write or review a spec, plan the roadmap, synthesize research and feedback, prepare a stakeholder update, and track competitors.',
    },
    zh: {
      category: '产品管理',
      name: '产品管理机器人',
      description: '撰写需求文档、规划路线图、汇总用户研究、同步干系人，并跟踪竞争格局。',
      mission: '端到端完成产品管理工作：撰写或评审需求文档、规划路线图、汇总研究与反馈、准备干系人更新，并跟踪竞品。',
    },
  },
  productivity: {
    en: {
      category: 'Productivity',
      name: 'Productivity operator',
      description: 'Manages tasks, calendars, daily workflows, and personal context so less time is spent repeating the same instructions.',
      mission: 'Run personal productivity work end to end: turn a request into a plan, schedule, or update, and keep the surrounding task and context notes current.',
    },
    zh: {
      category: '个人效率',
      name: '个人效率机器人',
      description: '管理任务、日历与日常工作流，维护个人上下文，减少重复交代。',
      mission: '端到端完成个人效率工作：把请求变成计划、日程或更新，并维护相关的任务与上下文记录。',
    },
  },
  legal: {
    en: {
      category: 'Legal',
      name: 'Legal operator',
      description: 'Reviews contracts, triages NDAs, works through compliance questions, assesses risk, and drafts templated responses.',
      mission: 'Run in-house legal work end to end: review an agreement, triage an NDA, answer a compliance question with cited rules, and draft a templated response for counsel to approve.',
    },
    zh: {
      category: '法务',
      name: '法务机器人',
      description: '审阅合同、分流 NDA、处理合规问题、评估风险，并起草模板化回复。',
      mission: '端到端完成法务工作：审阅协议、分流 NDA、依据条文回答合规问题，并起草供法务确认的模板化回复。',
    },
  },
  finance: {
    en: {
      category: 'Finance',
      name: 'Finance operator',
      description: 'Prepares journal entries, reconciles accounts, generates statements, analyzes variances, runs the close, and supports audits.',
      mission: 'Run finance and accounting work end to end: prepare entries, reconcile a period, analyze variances, assemble the close package, and answer auditor requests with traceable figures.',
    },
    zh: {
      category: '财务',
      name: '财务机器人',
      description: '编制凭证、核对账目、生成报表、分析差异、执行月结，并支持审计。',
      mission: '端到端完成财务工作：编制凭证、核对期间账目、分析差异、整理月结包，并以可追溯的数字回应审计要求。',
    },
  },
  data: {
    en: {
      category: 'Data',
      name: 'Data analyst robot',
      description: 'Writes SQL, explores datasets, runs statistical analysis, builds dashboards, and validates results before sharing.',
      mission: 'Run data analysis end to end: state the question, write and run SQL, check the result, build the chart or dashboard, and name every assumption before sharing.',
    },
    zh: {
      category: '数据',
      name: '数据分析机器人',
      description: '编写 SQL、探索数据集、做统计分析、构建看板，并在分享前验证结果。',
      mission: '端到端完成数据分析：明确问题、编写并执行 SQL、校验结果、产出图表或看板，并在分享前说明每一条假设。',
    },
  },
  'enterprise-search': {
    en: {
      category: 'Enterprise search',
      name: 'Enterprise search operator',
      description: 'Finds anything across email, chat, documents, and wikis with one query across company tools.',
      mission: 'Answer a company question end to end: search every connected tool, cite where each answer came from, and report which sources were unavailable.',
    },
    zh: {
      category: '企业搜索',
      name: '企业搜索机器人',
      description: '跨邮件、聊天、文档与 Wiki 检索，一次提问覆盖公司各类工具。',
      mission: '端到端回答公司内部问题：检索全部已连接工具，注明每个答案的来源，并说明哪些来源不可用。',
    },
  },
  'bio-research': {
    en: {
      category: 'Bio research',
      name: 'Bio research operator',
      description: 'Searches preclinical literature and databases, analyzes genomics data, and prioritizes targets for early-stage R&D.',
      mission: 'Run preclinical research work end to end: search literature and databases, check the evidence for a target or molecule, and report findings with study citations.',
    },
    zh: {
      category: '生物研发',
      name: '生物研发机器人',
      description: '检索临床前文献与数据库，分析基因组数据，为早期研发排序靶点。',
      mission: '端到端完成临床前研究：检索文献与数据库，核查靶点或分子的证据，并附研究引用汇报结论。',
    },
  },
  engineering: {
    en: {
      category: 'Engineering',
      name: 'Engineering operator',
      description: 'Runs engineering workflows: standups, code review, architecture decisions, and incident response.',
      mission: 'Run engineering workflow work end to end: prepare the standup or review, write the decision record or incident timeline, and leave the next action explicit.',
    },
    zh: {
      category: '工程',
      name: '工程机器人',
      description: '处理工程流程：站会、代码评审、架构决策与故障响应。',
      mission: '端到端完成工程流程工作：准备站会或评审、撰写决策记录或故障时间线，并明确下一步行动。',
    },
  },
  design: {
    en: {
      category: 'Design',
      name: 'Design operator',
      description: 'Runs design workflows: critique, design system management, UX writing, and accessibility review.',
      mission: 'Run design work end to end: critique the work against the brief and system rules, write the UX copy, and check accessibility before handoff.',
    },
    zh: {
      category: '设计',
      name: '设计机器人',
      description: '处理设计流程：设计评审、设计系统管理、UX 文案与可访问性检查。',
      mission: '端到端完成设计工作：依据需求和设计系统规则评审方案、撰写 UX 文案，并在交付前检查可访问性。',
    },
  },
  'human-resources': {
    en: {
      category: 'Human resources',
      name: 'People operations robot',
      description: 'Runs people operations: recruiting, onboarding, performance reviews, and compensation questions.',
      mission: 'Run people operations work end to end: prepare a role or interview loop, assemble onboarding, draft review material, and answer compensation questions from the policy in force.',
    },
    zh: {
      category: '人力资源',
      name: '人力运营机器人',
      description: '处理人力运营：招聘、入职、绩效评估与薪酬问题。',
      mission: '端到端完成人力运营工作：准备岗位或面试流程、整理入职材料、起草评估材料，并依据现行政策回答薪酬问题。',
    },
  },
  operations: {
    en: {
      category: 'Operations',
      name: 'Business operations robot',
      description: 'Improves business operations: vendor management, process documentation, and change management.',
      mission: 'Run business operations work end to end: assess a vendor or process, document how the work actually runs, and plan the change with owners and dates.',
    },
    zh: {
      category: '业务运营',
      name: '业务运营机器人',
      description: '优化业务运营：供应商管理、流程文档与变更管理。',
      mission: '端到端完成业务运营工作：评估供应商或流程、记录工作真实运行方式，并给出带责任人与时间点的变更计划。',
    },
  },
  'small-business': {
    en: {
      category: 'Small business',
      name: 'Small business operator',
      description: 'Runs prebuilt small business workflows for cash, invoicing, payroll, sales, and marketing.',
      mission: 'Run small business work end to end: route the owner request to the matching workflow, carry it through with the available data, and say what the owner must decide.',
    },
    zh: {
      category: '小微企业',
      name: '小微企业运营机器人',
      description: '执行为小微企业预置的工作流，覆盖现金流、开票、薪酬、销售与营销。',
      mission: '端到端完成小微企业运营工作：把老板的诉求路由到匹配的工作流，用现有数据执行完毕，并说明哪些决定必须由老板做出。',
    },
  },
  'cowork-plugin-management': {
    en: {
      category: 'Plugin management',
      name: 'Plugin management operator',
      description: 'Creates new plugins or customizes existing ones for an organization’s tools, terminology, and workflows.',
      mission: 'Build or customize a plugin end to end: interview for the role and tools, write the skills and connector configuration, and state how to install and verify it.',
    },
    zh: {
      category: '插件管理',
      name: '插件管理机器人',
      description: '按组织自己的工具、术语与流程创建新插件或定制现有插件。',
      mission: '端到端创建或定制插件：访谈岗位与工具、编写技能与连接器配置，并说明如何安装与验证。',
    },
  },
}

/**
 * Turn one role's copy and shipped skills into a registered template.
 * @param id - vendored plugin directory name, used as template identity and category.
 * @param copy - English and Chinese template copy.
 * @param skills - shipped skill names the run may load.
 * @returns the template.
 * @throws when the role has no copy or no skills.
 */
export function roleTemplate(id: string, copy: RoleCopy, skills: readonly string[]): RobotTemplate {
  if (skills.length === 0) throw new Error(`${id}: a template needs at least one skill`)
  const skillLine = {
    en: ` Choose the matching ${id.replaceAll('-', ' ')} skill before acting and follow its workflow.`,
    zh: `行动前先选用匹配的${copy.zh.category}技能，并按其中流程执行。`,
  }
  return {
    id: brandString<RobotTemplateId>(id),
    category: id,
    text: {
      en: { ...copy.en, mission: `${copy.en.mission}${skillLine.en}`, successCriteria: SUCCESS.en, acceptance: ACCEPTANCE.en },
      zh: { ...copy.zh, mission: `${copy.zh.mission}${skillLine.zh}`, successCriteria: SUCCESS.zh, acceptance: ACCEPTANCE.zh },
    },
    spec: knowledgeSpec(skills),
  }
}
