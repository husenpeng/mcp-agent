/**
 * Embedded skill: the campaign → roster → outreach chain the tools implement.
 *
 * The body is what the model reads after loading the skill; it names the tools
 * and states the order, the destructive actions, and the quota-sensitive calls.
 */

/** Skill contributed through `ctx.skills.register`. */
export const SKILL = {
  name: 'campaign-outreach',
  description: '达人营销活动的完整链路：看活动 → 读角色卡与推荐报告 → 确认达人清单 → 导入飞书达人 → 回复建联线程。',
  whenToUse: '当用户要求查看、管理活动，筛选或确认达人，发起推荐任务，从飞书导入达人，或回复建联邮件时。',
  content: `# 达人营销活动链路

## 顺序

1. \`campaign_list\` 找目标活动；用户只说品牌或品类时先按 keyword 过滤。
2. \`campaign_get\` 读活动详情；需要达人时 \`roster_list\`，需要角色卡时 \`role_card_list\`。
3. 推荐：\`search_task_start\` 发起任务（异步），完成后 \`search_report_get\` 读报告。
4. 导入：用户给飞书多维表格链接时用 \`roster_import_feishu\`；只接受链接，不要编造。
5. 触达：\`outreach_threads\` 查线程 → 读最近邮件 → \`outreach_reply\` 发送。

## 规则

- 写操作（\`campaign_update\`、\`campaign_create\`、\`role_card_create\`、\`search_task_start\`、\`roster_import_feishu\`、\`outreach_reply\`）先说明将改什么、发给谁，再调用。
- 回复邮件用纯文本，署名不要编造；不确定报价时先问用户。
- 推荐任务会覆盖旧报告；改角色卡会让旧任务作废，先确认。
- 邮箱解锁、导出、批量导入会消耗团队额度或涉及个人信息，非用户明确要求不要调用。
- 工具里出现 UNAUTHENTICATED 表示会话失效：让用户去 Settings → Account 重新用飞书登录，不要重试。
`,
}