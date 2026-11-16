/** Copy for the ticket panel, in the shipped languages. */
export const TICKETS_NS = 'superagentTickets'

/** Keys the panel renders. */
export type Key =
  | 'tab.title'
  | 'empty'
  | 'stage.working'
  | 'stage.person'
  | 'stage.idle'
  | 'needs.review'
  | 'needs.answer'
  | 'needs.blocked'
  | 'needs.failed'
  | 'row.state'
  | 'row.blocking'
  | 'row.rounds'

/** English copy. */
export const en: Record<Key, string> = {
  'tab.title': 'Team tickets',
  empty: 'No ticket yet: the team writes its list after a cycle.',
  'stage.working': 'In progress',
  'stage.person': 'Needs a person',
  'stage.idle': 'Idle',
  'needs.review': 'review the result',
  'needs.answer': 'answer a question',
  'needs.blocked': 'unblock the work',
  'needs.failed': 'decide a failure',
  'row.state': 'Last run',
  'row.blocking': 'Blocking findings',
  'row.rounds': 'Review rounds',
}

/** Chinese copy. */
export const zh: Record<Key, string> = {
  'tab.title': '团队工单',
  empty: '还没有工单：团队跑完一轮后才会写出列表。',
  'stage.working': '进行中',
  'stage.person': '等人处理',
  'stage.idle': '空闲',
  'needs.review': '复核结果',
  'needs.answer': '回答问题',
  'needs.blocked': '解除阻塞',
  'needs.failed': '处理失败',
  'row.state': '最近一次执行',
  'row.blocking': '阻塞性发现',
  'row.rounds': '审查轮次',
}

declare module '@tomato/client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Team ticket panel copy. */
    superagentTickets: Key
  }
}
