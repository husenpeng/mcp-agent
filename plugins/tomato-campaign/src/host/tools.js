/**
 * Model-facing tools over the campaign, roster, Feishu and outreach endpoints.
 *
 * Every tool returns the BFF payload unchanged inside `{ data, meta }` so the
 * model can quote real ids and fields. Failures throw the client's classified
 * error, which the tool runtime turns into a visible failure.
 */

import { BffError } from './bff.js'

/** Path segment helper. */
const enc = encodeURIComponent

/** Tool output shared by every tool. */
const OUTPUT = {
  schema: { type: 'object', additionalProperties: true },
  render: (_args, value) => [{ type: 'text', text: JSON.stringify(value, null, 2) }],
}

/**
 * Wrap one BFF call as a canonical tool value.
 * @param call - BFF caller.
 * @param path - absolute `/api/...` path.
 * @param options - method, query, body.
 * @returns `{ data, meta }` from the upstream.
 */
async function invoke(call, path, options, exec) {
  const result = await call(path, { ...options, signal: exec?.signal })
  if (!result.ok) {
    throw new BffError(result.error?.code === 'UNAUTHENTICATED' ? 'unauthenticated' : 'rejected',
      result.error?.message ?? '公司 BFF 拒绝了这次请求。')
  }
  return { data: result.data, meta: result.meta }
}

/**
 * Build the tool definitions.
 * @param options - resolved config, BFF caller, and `defineTool`.
 * @returns the definitions to register on `ctx.tools`.
 */
export function createTools({ config, call, defineTool }) {
  const tools = []

  tools.push(defineTool({
    name: 'campaign_list',
    description: '列出一个账号可见的全部活动，可按状态或关键词过滤。返回 campaign-manager 的活动列表（含分页 meta）。',
    parameters: {
      status: { type: 'string', description: '按阶段过滤（如 running / pending / completed），留空表示全部。' },
      keyword: { type: 'string', description: '按活动名称或品牌搜索。' },
      page: { type: 'number', description: '页码，从 1 开始。' },
      pageSize: { type: 'number', description: '每页条数，默认由服务端决定。' },
    },
    output: OUTPUT,
    async execute(args, exec) {
      return invoke(call, '/api/v1/campaigns', {
        query: { status: args.status, keyword: args.keyword, page: args.page, pageSize: args.pageSize },
      }, exec)
    },
  }))

  tools.push(defineTool({
    name: 'campaign_get',
    description: '读取单个活动的详情：品牌、预算、阶段、负责人、统计与配置。',
    parameters: { campaignId: { type: 'string', required: true, description: '活动 id。' } },
    output: OUTPUT,
    async execute(args, exec) {
      return invoke(call, `/api/v1/campaigns/${enc(args.campaignId)}`, {}, exec)
    },
  }))

  tools.push(defineTool({
    name: 'roster_list',
    description: '列出活动下的达人清单（达人、平台、粉丝、互动率、报价、状态、邮箱是否解锁）。',
    parameters: {
      campaignId: { type: 'string', required: true, description: '活动 id。' },
      page: { type: 'number', description: '页码。' },
      pageSize: { type: 'number', description: '每页条数。' },
      keyword: { type: 'string', description: '按达人名或 handle 搜索。' },
    },
    output: OUTPUT,
    async execute(args, exec) {
      return invoke(call, `/api/v1/campaigns/${enc(args.campaignId)}/creators`, {
        query: { page: args.page, pageSize: args.pageSize, keyword: args.keyword },
      }, exec)
    },
  }))

  tools.push(defineTool({
    name: 'role_card_list',
    description: '列出活动下的角色卡（角色定位、品类、垂类、达人类型、内容任务、目标国家）及其搜索任务状态。',
    parameters: { campaignId: { type: 'string', required: true, description: '活动 id。' } },
    output: OUTPUT,
    async execute(args, exec) {
      return invoke(call, `/api/v1/campaigns/${enc(args.campaignId)}/role-cards`, {}, exec)
    },
  }))

  tools.push(defineTool({
    name: 'search_report_get',
    description: '读取某张角色卡最近一次推荐任务的报告（按平台分桶的候选达人、评分、推荐理由）。',
    parameters: {
      campaignId: { type: 'string', required: true, description: '活动 id。' },
      cardId: { type: 'string', required: true, description: '角色卡 id。' },
    },
    output: OUTPUT,
    async execute(args, exec) {
      return invoke(call, `/api/v1/campaigns/${enc(args.campaignId)}/role-cards/${enc(args.cardId)}/search-task/report`, {}, exec)
    },
  }))

  tools.push(defineTool({
    name: 'feishu_members',
    description: '搜索飞书通讯录成员（项目成员邀请的候选人来源）。需要当前账号已完成飞书授权。',
    parameters: {
      q: { type: 'string', description: '姓名或邮箱关键词。' },
      page: { type: 'number', description: '页码。' },
      pageSize: { type: 'number', description: '每页条数，上限 100。' },
    },
    output: OUTPUT,
    async execute(args, exec) {
      return invoke(call, '/api/auth/members', { query: { q: args.q, page: args.page, pageSize: args.pageSize } }, exec)
    },
  }))

  tools.push(defineTool({
    name: 'outreach_threads',
    description: '列出建联线程：待回、已联系、待联系或归档。返回线程状态、达人、最近一封邮件摘要。',
    parameters: {
      box: { type: 'string', description: 'inbox（默认）、archived 或 pending。' },
      page: { type: 'number', description: '页码。' },
      pageSize: { type: 'number', description: '每页条数。' },
    },
    output: OUTPUT,
    async execute(args, exec) {
      const path = args.box === 'archived'
        ? '/api/outreach/threads/archived'
        : args.box === 'pending' ? '/api/outreach/campaigns/pending' : '/api/outreach/threads'
      return invoke(call, path, { query: { page: args.page, pageSize: args.pageSize } }, exec)
    },
  }))

  if (config.allowWrites !== false) {
    tools.push(defineTool({
      name: 'campaign_update',
      description: '修改一个活动的字段（名称、预算、阶段、国家、周期等）。只提交要改的字段。',
      parameters: {
        campaignId: { type: 'string', required: true, description: '活动 id。' },
        patch: { type: 'object', required: true, description: '要修改的字段，键名与活动详情一致。', additionalProperties: true },
      },
      output: OUTPUT,
      async execute(args, exec) {
        return invoke(call, `/api/v1/campaigns/${enc(args.campaignId)}`, { method: 'PATCH', body: args.patch }, exec)
      },
    }))

    tools.push(defineTool({
      name: 'campaign_create',
      description: '新建一个活动。body 直接对应 campaign-manager 的创建字段。',
      parameters: {
        body: { type: 'object', required: true, description: '活动创建字段，至少包含名称与品牌。', additionalProperties: true },
      },
      output: OUTPUT,
      async execute(args, exec) {
        return invoke(call, '/api/v1/campaigns', { method: 'POST', body: args.body }, exec)
      },
    }))

    tools.push(defineTool({
      name: 'role_card_create',
      description: '给活动新建一张角色卡（body 即一张卡，不包数组）。返回新卡与字段级告警。',
      parameters: {
        campaignId: { type: 'string', required: true, description: '活动 id。' },
        card: { type: 'object', required: true, description: '角色卡字段。', additionalProperties: true },
      },
      output: OUTPUT,
      async execute(args, exec) {
        return invoke(call, `/api/v1/campaigns/${enc(args.campaignId)}/role-cards`, { method: 'POST', body: args.card }, exec)
      },
    }))

    tools.push(defineTool({
      name: 'search_task_start',
      description: '为一张角色卡发起推荐任务（异步）。改卡即作废旧结果；返回 taskId 与状态。',
      parameters: {
        campaignId: { type: 'string', required: true, description: '活动 id。' },
        cardId: { type: 'string', required: true, description: '角色卡 id。' },
      },
      output: OUTPUT,
      async execute(args, exec) {
        return invoke(call, `/api/v1/campaigns/${enc(args.campaignId)}/role-cards/${enc(args.cardId)}/search-task`, { method: 'POST', body: {} }, exec)
      },
    }))

    tools.push(defineTool({
      name: 'roster_import_feishu',
      description: '用飞书多维表格链接给活动批量导入达人（异步）。未授权或授权过期会被拒绝。',
      parameters: {
        campaignId: { type: 'string', required: true, description: '活动 id。' },
        url: { type: 'string', required: true, description: '飞书多维表格链接。' },
      },
      output: OUTPUT,
      async execute(args, exec) {
        return invoke(call, `/api/v1/campaigns/${enc(args.campaignId)}/creators/import-feishu`, { method: 'POST', body: { url: args.url } }, exec)
      },
    }))

    tools.push(defineTool({
      name: 'outreach_reply',
      description: '回复一个建联线程。正文以纯文本传入，服务按段落转成 HTML 后发送。',
      parameters: {
        threadId: { type: 'string', required: true, description: '线程 id。' },
        text: { type: 'string', required: true, description: '回复正文（纯文本）。' },
        subject: { type: 'string', description: '可选主题；留空沿用线程主题。' },
      },
      output: OUTPUT,
      async execute(args, exec) {
        const paragraphs = args.text.split(/\n{2,}/).map(part => part.trim()).filter(Boolean)
        const bodyHtml = paragraphs.map(part => `<p>${part.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')}</p>`).join('')
        return invoke(call, `/api/outreach/threads/${enc(args.threadId)}/reply`, {
          method: 'POST',
          body: { bodyHtml, bodyText: args.text, subject: args.subject ?? null },
        }, exec)
      },
    }))
  }

  return tools
}