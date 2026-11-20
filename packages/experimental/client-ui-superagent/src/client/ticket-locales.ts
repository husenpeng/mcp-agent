/** Copy for the ticket panel, in the shipped languages. */
export const TICKETS_NS = 'superagentTickets'

/** Keys the panel renders. */
export type Key =
  | 'tab.title'
  | 'empty'
  | 'refresh'
  | 'retry'
  | 'error'
  | 'loading'
  | 'guide.description'
  | 'stage.working'
  | 'stage.person'
  | 'stage.idle'
  | 'stage.ended'
  | 'needs.delivery'
  | 'needs.review'
  | 'needs.answer'
  | 'needs.blocked'
  | 'needs.failed'
  | 'row.state'
  | 'row.blocking'
  | 'row.rounds'
  | 'row.running'
  | 'row.stopped'
  | 'composer.placeholder'
  | 'composer.submit'
  | 'notice.declined'
  | 'notice.refused'
  | 'notice.failed'
  | 'detail.title'
  | 'detail.loading'
  | 'detail.error'
  | 'detail.mandate'
  | 'detail.runs'
  | 'detail.review'
  | 'detail.findings'
  | 'detail.messages'
  | 'detail.noFindings'
  | 'detail.question'
  | 'action.cancel'
  | 'action.stop'
  | 'action.send'
  | 'action.messagePlaceholder'
  | 'scope.investigate'
  | 'scope.change'
  | 'scope.release'
  | 'strength.explicit'
  | 'strength.proposed'
  | 'state.progress'
  | 'state.waiting'
  | 'state.ready'
  | 'state.blocked'
  | 'state.failed'
  | 'state.dropped'

/** English copy. */
export const en: Record<Key, string> = {
  'tab.title': 'Team tickets',
  empty: 'No tickets yet',
  refresh: 'Refresh',
  retry: 'Retry',
  error: 'Could not read team tickets',
  loading: 'Loading team tickets',
  'guide.description': 'Submit work, watch the team run it, and step in mid-run',
  'stage.working': 'In progress',
  'stage.person': 'Needs a person',
  'stage.idle': 'Idle',
  'stage.ended': 'Ended',
  'needs.delivery': 'review the delivery',
  'needs.review': 'review the result',
  'needs.answer': 'answer a question',
  'needs.blocked': 'unblock the work',
  'needs.failed': 'decide a failure',
  'row.state': 'Last run',
  'row.blocking': 'Blocking findings',
  'row.rounds': 'Review rounds',
  'row.running': 'Running',
  'row.stopped': 'Stopped',
  'composer.placeholder': 'Ask the team to do something…',
  'composer.submit': 'Submit',
  'notice.declined': 'Not taken:',
  'notice.refused': 'Refused:',
  'notice.failed': 'The operation failed:',
  'detail.title': 'Ticket flow',
  'detail.loading': 'Loading the ticket flow',
  'detail.error': 'Could not read the ticket flow',
  'detail.mandate': 'Authorization',
  'detail.runs': 'Runs',
  'detail.review': 'Review',
  'detail.findings': 'Findings',
  'detail.messages': 'Messages',
  'detail.noFindings': 'No findings',
  'detail.question': 'Question',
  'action.cancel': 'Cancel run',
  'action.stop': 'Stop ticket',
  'action.send': 'Send',
  'action.messagePlaceholder': 'Add context or answer, then continue…',
  'scope.investigate': 'investigate',
  'scope.change': 'change',
  'scope.release': 'release',
  'strength.explicit': 'explicit',
  'strength.proposed': 'proposed',
  'state.progress': 'in progress',
  'state.waiting': 'waiting',
  'state.ready': 'ready',
  'state.blocked': 'blocked',
  'state.failed': 'failed',
  'state.dropped': 'cancelled',
}

/** Chinese copy. */
export const zh: Record<Key, string> = {
  'tab.title': '团队工单',
  empty: '还没有工单',
  refresh: '刷新',
  retry: '重试',
  error: '无法读取团队工单',
  loading: '正在读取团队工单',
  'guide.description': '提交任务、观察团队执行，并可中途介入',
  'stage.working': '进行中',
  'stage.person': '等人处理',
  'stage.idle': '空闲',
  'stage.ended': '已结束',
  'needs.delivery': '验收交付',
  'needs.review': '复核结果',
  'needs.answer': '回答问题',
  'needs.blocked': '解除阻塞',
  'needs.failed': '处理失败',
  'row.state': '最近一次执行',
  'row.blocking': '阻塞性发现',
  'row.rounds': '审查轮次',
  'row.running': '执行中',
  'row.stopped': '已终止',
  'composer.placeholder': '让团队做点什么……',
  'composer.submit': '提交',
  'notice.declined': '未受理：',
  'notice.refused': '已拒绝：',
  'notice.failed': '操作失败：',
  'detail.title': '工单流程',
  'detail.loading': '正在读取工单流程',
  'detail.error': '无法读取工单流程',
  'detail.mandate': '授权',
  'detail.runs': '执行记录',
  'detail.review': '审查',
  'detail.findings': '发现',
  'detail.messages': '消息',
  'detail.noFindings': '没有发现问题',
  'detail.question': '待回答的问题',
  'action.cancel': '打断执行',
  'action.stop': '终止工单',
  'action.send': '发送',
  'action.messagePlaceholder': '补充上下文或回答问题，然后继续……',
  'scope.investigate': '仅调查',
  'scope.change': '可修改',
  'scope.release': '可发布',
  'strength.explicit': '明确要求',
  'strength.proposed': '建议',
  'state.progress': '进行中',
  'state.waiting': '等待中',
  'state.ready': '已就绪',
  'state.blocked': '受阻',
  'state.failed': '失败',
  'state.dropped': '已打断',
}

declare module '@tomato/client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Team ticket panel copy. */
    superagentTickets: Key
  }
}
