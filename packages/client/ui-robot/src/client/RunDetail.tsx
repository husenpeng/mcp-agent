/** One robot run as a conversation: the instruction, its process, answers, outcome, and the composer that continues or starts a run. */
import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import type { Run } from '@tomato/api-robot-controller/client'
import type { PropsLocale } from '@tomato/client-ui-slots'
import {
  Button,
  IconChevronDownOutlineRegular,
  IconChevronUpOutlineRegular,
  IconCodeOutlineRegular,
  IconDeliverDocRegular,
  IconGlobeOutlineRegular,
  IconSearchOutlineRegular,
  IconSparkleRegular,
  IconWarningOutlineRegular,
  Input,
  type MarkdownLabels,
  MarkdownText,
  StateDot,
  Tooltip,
  UserMessageBubble,
} from '@tomato/client-ui-primitives'
import { groupSteps, type RunActionStep, type RunStep } from './run-steps.ts'
import { runMeta } from './run-time.ts'
import { RobotAvatar } from './RobotAvatar.tsx'
import { NS, type RobotKey } from './locales.ts'
import { readTechnicalDetail, writeTechnicalDetail } from './technical-preference.ts'
import css from './RunDetail.module.css'

/** Identity one robot contributes to its conversation surface. */
export interface RobotIdentity {
  /** Display name shown in the header and beside each answer. */
  readonly name: string
  /** Skill ids selecting the avatar artwork. */
  readonly skills: readonly string[]
}

/** One call the detail offers to the Host. */
export interface RunDetailActions {
  /** Pause the executing run and keep it for a correction. */
  readonly interrupt: (run: Run) => void
  /** Deliver a correction, or a plain continue, into the run. */
  readonly correct: (run: Run, message: string) => void
  /** Settle the run as cancelled. */
  readonly stop: (run: Run) => void
  /** Start a new run of the same robot with one instruction. */
  readonly start: (message: string) => void
}

/** Translate seat of the robot namespace. */
type Translate = PropsLocale<typeof NS>['t']

/** Props of the run conversation. */
export interface RunDetailProps {
  /** Selected run, or `undefined` when the robot has no conversation open yet. */
  readonly run: Run | undefined
  /** Robot whose conversation this is. */
  readonly robot: RobotIdentity
  /** Whether the Session behind the run is still loading its history. */
  readonly openState: 'cold' | 'loading' | 'open' | 'error'
  /** Load failure of the run's Session, when any. */
  readonly openError: string | undefined
  /** Timeline lines folded from the run's Session. */
  readonly steps: readonly RunStep[]
  readonly actions: RunDetailActions
  /** Whether another run of this robot still holds the execution slot. */
  readonly startBlocked: boolean
  /** Whether the robot has any run to select. */
  readonly hasRuns: boolean
  /** Epoch milliseconds anchoring relative labels. */
  readonly now: number
  readonly t: Translate
}

/** Run states that still accept an interrupt, a correction, or a stop. */
const LIVE_STATES: ReadonlySet<Run['state']> = new Set<Run['state']>(['queued', 'leased', 'running', 'waiting', 'finalizing'])

/** State labels the strip and the run list share. */
export const STATE_KEYS: Readonly<Record<Run['state'], RobotKey>> = {
  queued: 'run.state.queued',
  leased: 'run.state.leased',
  running: 'run.state.running',
  waiting: 'run.state.waiting',
  finalizing: 'run.state.finalizing',
  succeeded: 'run.state.succeeded',
  failed: 'run.state.failed',
  cancelled: 'run.state.cancelled',
  timed_out: 'run.state.timed_out',
}

/** Business phrase of each tool this page knows; unknown tools use the fallback. */
const TOOL_KEYS: Readonly<Record<string, RobotKey>> = {
  read: 'run.tool.read',
  read_file: 'run.tool.read',
  write: 'run.tool.write',
  write_file: 'run.tool.write',
  edit: 'run.tool.edit',
  bash: 'run.tool.command',
  pwsh: 'run.tool.command',
  search: 'run.tool.search',
  grep: 'run.tool.search',
  glob: 'run.tool.search',
  run_code: 'run.tool.program',
  web_search: 'run.tool.web',
  fetch: 'run.tool.web',
}

/** Word patterns that give an unregistered tool a recognizable business phrase. */
const TOOL_PATTERNS: readonly (readonly [RegExp, RobotKey])[] = [
  [/browser|playwright/, 'run.tool.browser'],
  [/web|fetch|http|url|curl/, 'run.tool.web'],
  [/search|grep|glob|find/, 'run.tool.search'],
  [/write|create|append/, 'run.tool.write'],
  [/edit|patch|replace/, 'run.tool.edit'],
  [/read|open|cat/, 'run.tool.read'],
  [/list|dir|tree/, 'run.tool.list'],
  [/bash|shell|command|terminal/, 'run.tool.command'],
  [/code|script|eval|run/, 'run.tool.program'],
]

/**
 * Read the business phrase for one tool. Registered names win; a name built by
 * another tool ecosystem still reads as an action once one of its words matches.
 * @param tool - registered tool name.
 * @param t - robot page translate seat.
 * @returns the phrase, or a generic action for an unrecognized tool.
 */
export function toolPhrase(tool: string, t: Translate): string {
  const key = TOOL_KEYS[tool] ?? TOOL_PATTERNS.find(([pattern]) => pattern.test(tool.toLowerCase()))?.[1]
  return key === undefined ? t('run.tool.other') : t(key)
}

/**
 * Pick the leading glyph of one action row; the running state shows the shared
 * loader instead so a live step reads as in progress without extra chrome.
 * @param step - action row.
 * @returns the icon element.
 */
function toolIcon(step: RunActionStep): ReactNode {
  if (step.status === 'running') return <StateDot state="ongoing" />
  switch (TOOL_KEYS[step.tool]) {
    case 'run.tool.read':
    case 'run.tool.write':
    case 'run.tool.edit':
      return <IconDeliverDocRegular size={14} />
    case 'run.tool.command':
    case 'run.tool.program':
      return <IconCodeOutlineRegular size={14} />
    case 'run.tool.search':
      return <IconSearchOutlineRegular size={14} />
    case 'run.tool.web':
      return <IconGlobeOutlineRegular size={14} />
    default:
      return <IconSparkleRegular size={14} />
  }
}

/**
 * Decide whether one key press submits the composer.
 * @param event - key press and its composition state.
 * @returns whether the press is a plain Enter, not an input-method confirmation.
 */
export function submitsCorrection(event: { readonly key: string; readonly nativeEvent: { readonly isComposing?: boolean } }): boolean {
  return event.key === 'Enter' && event.nativeEvent.isComposing !== true
}

/**
 * Render one step's status word.
 * @param status - step status.
 * @param t - robot page translate seat.
 * @returns the localized status.
 */
function statusWord(status: RunActionStep['status'], t: Translate): string {
  switch (status) {
    case 'running':
      return t('run.step.running')
    case 'failed':
      return t('run.step.failed')
    default:
      return t('run.step.done')
  }
}

/**
 * Render the consecutive actions between two messages as one disclosure.
 * @param props - the actions, the open state, the technical switch, and copy.
 * @returns the process card.
 */
function ProcessBlock({
  steps, open, onToggle, technical, t,
}: {
  readonly steps: readonly RunActionStep[]
  readonly open: boolean
  readonly onToggle: () => void
  readonly technical: boolean
  readonly t: Translate
}): ReactNode {
  const failed = steps.filter(step => step.status === 'failed').length
  return (
    <section className={css.process}>
      <button
        type="button"
        className={css.processHead}
        aria-expanded={open}
        onClick={onToggle}
      >
        {open ? <IconChevronUpOutlineRegular size={14} /> : <IconChevronDownOutlineRegular size={14} />}
        <span className={css.processTitle}>{t('run.process')}</span>
        <span className={css.sep} aria-hidden="true">·</span>
        <span>{t('run.stepCount', { n: steps.length })}</span>
        {failed === 0 ? null : (
          <>
            <span className={css.sep} aria-hidden="true">·</span>
            <span className={css.processFail}>{t('run.failedCount', { n: failed })}</span>
          </>
        )}
        <span className={css.processToggle}>{open ? t('run.collapse') : t('run.expand')}</span>
      </button>
      {open ? (
        <div className={css.stepList}>
          {steps.map(step => (
            <div key={step.key} className={css.step} data-status={step.status}>
              <span className={css.stepGlyph} aria-hidden="true">{toolIcon(step)}</span>
              <span className={css.stepBody}>
                <span className={css.stepPhrase}>{toolPhrase(step.tool, t)}</span>
                {step.detail === undefined ? null : <span className={css.stepDetail}>{step.detail}</span>}
              </span>
              <span className={css.stepStatus}>{statusWord(step.status, t)}</span>
              {step.status === 'failed' && step.output !== undefined
                ? <span className={css.stepFailure}>{step.output}</span>
                : null}
              {technical ? <code className={css.raw}>{step.tool} {step.raw ?? ''}</code> : null}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  )
}

/**
 * Render the conversation of one robot run: header, thread, outcome, and composer.
 * @param props - run, robot identity, Session state, folded steps, actions, and copy.
 * @returns the conversation surface.
 */
export function RunDetail({
  run, robot, openState, openError, steps, actions, startBlocked, hasRuns, now, t,
}: RunDetailProps): ReactNode {
  const [technical, setTechnical] = useState(readTechnicalDetail)
  const [draft, setDraft] = useState('')
  // Markdown chrome (code toolbar, footnotes) stays stable so the renderer keeps
  // its memoized vocabulary across frames.
  const labels: MarkdownLabels = useMemo(() => ({
    code: {
      copyLabel: t('copy'),
      copiedLabel: t('copied'),
      toolbarLabels: {
        codeLabel: t('codeBlock.title'),
        wrapLabel: t('codeBlock.wrap'),
        unwrapLabel: t('codeBlock.unwrap'),
      },
    },
    footnotes: t('markdown.footnotes'),
  }), [t])
  /** Manual process disclosure for one run, discarded when another run opens. */
  const [disclosure, setDisclosure] = useState<{ readonly runId: string; readonly open: boolean }>()
  const live = run !== undefined && LIVE_STATES.has(run.state)
  const paused = run?.state === 'waiting'
  const blocks = useMemo(() => groupSteps(steps), [steps])
  const failedCount = useMemo(() => steps.filter(step => step.kind === 'action' && step.status === 'failed').length, [steps])
  const actionCount = useMemo(() => steps.filter(step => step.kind === 'action').length, [steps])
  const processOpen = run === undefined
    ? false
    : disclosure?.runId === run.id ? disclosure.open : live
  const trimmed = draft.trim()
  const canSend = live ? paused || trimmed !== '' : !startBlocked && trimmed !== ''

  const send = (): void => {
    if (run !== undefined && live) {
      // A paused run can continue without a new instruction; the reviewer still
      // needs one real user message to drive the next turn, so the page sends a
      // visible "continue" message rather than a hidden one.
      const message = trimmed === '' ? (paused ? t('run.continueMessage') : '') : trimmed
      if (message === '') return
      actions.correct(run, message)
    } else {
      if (trimmed === '') return
      actions.start(trimmed)
    }
    setDraft('')
  }

  const placeholder = live
    ? (paused ? t('run.correctPlaceholderPaused') : t('run.correctPlaceholderRunning'))
    : t('run.composerIdle')
  const hint = live
    ? t('run.hintLive')
    : startBlocked ? t('run.newRunBlocked') : run === undefined ? t('run.composerIdleExample') : t('run.hintIdle')
  const sendLabel = live ? (paused ? t('run.resume') : t('run.send')) : t('roster.run')

  const header = (
    <header className={css.head}>
      <span className={css.headAvatar}><RobotAvatar name={robot.name} skills={robot.skills} size={30} /></span>
      <div className={css.headText}>
        <span className={css.headTitle}>
          {robot.name}
          {run === undefined ? null : (
            <span className={css.stateTag} data-state={run.state}>{t(STATE_KEYS[run.state])}</span>
          )}
        </span>
        {run === undefined ? null : (
          <span className={css.headMeta}>{runMeta(run, actionCount, failedCount, now, t).join(' · ')}</span>
        )}
      </div>
      <div className={css.headActions}>
        {live && (
          <Button size="sm" variant="outline" onClick={() => { actions.interrupt(run) }}>
            {t('run.interrupt')}
          </Button>
        )}
        {live && (
          <Button size="sm" variant="outline" onClick={() => { actions.stop(run) }}>
            {t('run.stop')}
          </Button>
        )}
        {run === undefined ? null : (
          <Tooltip label={t('run.technical')} side="bottom">
            <Button
              size="sm"
              variant="ghost"
              aria-pressed={technical}
              onClick={() => {
                const next = !technical
                setTechnical(next)
                writeTechnicalDetail(next)
              }}
            >
              {t('run.technicalShort')}
            </Button>
          </Tooltip>
        )}
      </div>
    </header>
  )

  let body: ReactNode
  if (run === undefined) {
    body = (
      <div className={css.empty}>
        <span className={css.emptyAvatar}><RobotAvatar name={robot.name} skills={robot.skills} size={44} /></span>
        <span className={css.emptyTitle}>{hasRuns ? t('run.emptyDetail') : t('run.emptyTitle')}</span>
        {hasRuns ? null : <p className={css.emptyBody}>{t('run.emptyBody')}</p>}
      </div>
    )
  } else {
    const lastAnswer = [...blocks].reverse().find(block => block.kind === 'answer')
    const output = run.output?.trim()
    const duplicatesAnswer = output === undefined || output === ''
      || (lastAnswer !== undefined && lastAnswer.kind === 'answer' && lastAnswer.text.trim() === output)
    const settled = run.endedAt !== undefined
    body = (
      <div className={css.thread}>
        {blocks.length === 0 ? (
          <div className={css.userRow}>
            <UserMessageBubble className={css.userBubble}>{run.input.message}</UserMessageBubble>
          </div>
        ) : null}

        {openState === 'error' ? (
          <p className={css.notice} role="alert">
            {t('run.historyFailed', { message: openError ?? t('run.historyFailedUnknown') })}
          </p>
        ) : openState !== 'open' && blocks.length === 0 ? (
          <p className={css.notice}>{t('run.loading')}</p>
        ) : null}

        {blocks.map((block) => {
          if (block.kind === 'input') {
            return (
              <div key={block.key} className={css.userRow}>
                <UserMessageBubble className={css.userBubble}>{block.text}</UserMessageBubble>
              </div>
            )
          }
          if (block.kind === 'answer') {
            return (
              <div key={block.key} className={css.answer}>
                <span className={css.answerAvatar}><RobotAvatar name={robot.name} skills={robot.skills} size={22} /></span>
                <div className={css.answerText}><MarkdownText text={block.text} labels={labels} /></div>
              </div>
            )
          }
          return (
            <ProcessBlock
              key={block.key}
              steps={block.steps}
              open={processOpen}
              technical={technical}
              onToggle={() => {
                setDisclosure({ runId: run.id, open: !processOpen })
              }}
              t={t}
            />
          )
        })}

        {duplicatesAnswer || output === undefined ? null : (
          <div className={css.answer}>
            <span className={css.answerAvatar}><RobotAvatar name={robot.name} skills={robot.skills} size={22} /></span>
            <div className={css.answerText}><MarkdownText text={output} labels={labels} /></div>
          </div>
        )}

        {run.error === undefined ? null : (
          <div className={css.outcome} data-tone="error" role="alert">
            <IconWarningOutlineRegular size={14} />
            <span>{run.error}</span>
          </div>
        )}

        {openState === 'open' && blocks.length === 0 && run.error === undefined
          && (run.output === undefined || run.output.trim() === '')
          ? <p className={css.notice}>{settled ? t('run.noResult') : t('run.emptyProgress')}</p>
          : null}
      </div>
    )
  }

  return (
    <section className={css.detail} aria-label={t('run.label')}>
      {header}
      <div className={css.body}>{body}</div>
      <footer className={css.composer}>
        <div className={css.composerRow}>
          <Input
            className={css.composerInput}
            value={draft}
            aria-label={live ? t('run.correctLabel') : t('roster.message')}
            placeholder={placeholder}
            onChange={(event) => { setDraft(event.target.value) }}
            onKeyDown={(event) => {
              if (!submitsCorrection(event)) return
              send()
            }}
          />
          <Button size="sm" variant="primary" disabled={!canSend || (run === undefined && startBlocked)} onClick={send}>
            {sendLabel}
          </Button>
        </div>
        <span className={css.hint}>{hint}</span>
      </footer>
    </section>
  )
}
