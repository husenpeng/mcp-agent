/** One robot run as a task: status, the instruction that started it, its steps, and the result. */
import type { ReactNode } from 'react'
import { useId, useMemo, useState } from 'react'
import type { Run } from '@tomato/api-robot-controller/client'
import type { PropsLocale } from '@tomato/client-ui-slots'
import { Button, Input, Tooltip } from '@tomato/client-ui-primitives'
import type { RunStep } from './run-steps.ts'
import { NS, type RobotKey } from './locales.ts'
import { readTechnicalDetail, writeTechnicalDetail } from './technical-preference.ts'
import css from './RunDetail.module.css'

/** One call the detail offers to the Host. */
export interface RunDetailActions {
  /** Pause the executing run and keep it for a correction. */
  readonly interrupt: (run: Run) => void
  /** Deliver a correction, or a plain continue, into the run. */
  readonly correct: (run: Run, message: string) => void
  /** Settle the run as cancelled. */
  readonly stop: (run: Run) => void
}

/** Translate seat of the robot namespace. */
type Translate = PropsLocale<typeof NS>['t']

/** Props of the run detail panel. */
export interface RunDetailProps {
  readonly run: Run
  /** Whether the Session behind the run is still loading its history. */
  readonly openState: 'cold' | 'loading' | 'open' | 'error'
  /** Load failure of the run's Session, when any. */
  readonly openError: string | undefined
  /** Timeline lines folded from the run's Session. */
  readonly steps: readonly RunStep[]
  readonly actions: RunDetailActions
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

/**
 * Read the business phrase for one tool.
 * @param tool - registered tool name.
 * @param t - robot page translate seat.
 * @returns the phrase, or a generic action for an unknown tool.
 */
export function toolPhrase(tool: string, t: Translate): string {
  const key = TOOL_KEYS[tool]
  return key === undefined ? t('run.tool.other') : t(key)
}

/**
 * Decide whether one key press submits the correction input.
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
function statusWord(status: 'running' | 'done' | 'failed', t: Translate): string {
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
 * Render the run detail: status strip, instruction, timeline, and outcome.
 * @param props - run, Session state, folded steps, actions, and copy.
 * @returns the detail panel body.
 */
export function RunDetail({
  run, openState, openError, steps, actions, t,
}: RunDetailProps): ReactNode {
  const [technical, setTechnical] = useState(readTechnicalDetail)
  const [draft, setDraft] = useState('')
  const draftId = useId()
  const live = LIVE_STATES.has(run.state)
  const paused = run.state === 'waiting'
  // Both controls are disabled outside a live run, so this body only runs while
  // the Host still owns the Agent.
  const send = (text: string): void => {
    // A paused run can continue without a new instruction; the reviewer still
    // needs one real user message to drive the next turn, so the page sends a
    // visible "continue" message rather than a hidden one.
    const message = text.trim() === '' ? (paused ? t('run.continueMessage') : '') : text.trim()
    if (message === '') return
    actions.correct(run, message)
    setDraft('')
  }
  const ordered = useMemo(() => [...steps].sort((left, right) => left.seq - right.seq), [steps])
  return (
    <section className={css.detail} aria-label={t('run.label')}>
      <header className={css.strip}>
        <span className={css.state} data-state={run.state}>{t(STATE_KEYS[run.state])}</span>
        <div className={css.stripActions}>
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
        </div>
      </header>

      <div className={css.body}>
        <section className={css.block}>
          <h3 className={css.blockTitle}>{t('run.task')}</h3>
          <p className={css.instruction}>{run.input.message}</p>
        </section>

        <section className={css.block}>
          <h3 className={css.blockTitle}>{t('run.progress')}</h3>
          {openState === 'error' ? <p className={css.notice} role="alert">
            {t('run.historyFailed', { message: openError ?? t('run.historyFailedUnknown') })}
          </p> : openState !== 'open' ? <p className={css.notice}>{t('run.loading')}</p> : ordered.length === 0
            ? <p className={css.notice}>{t('run.emptyProgress')}</p>
            : <ol className={css.steps}>
              {ordered.map(step => step.kind === 'action'
                ? <li key={step.key} className={css.step} data-status={step.status}>
                  <span className={css.stepText}>
                    {toolPhrase(step.tool, t)}
                    {step.detail === undefined ? null : <span className={css.stepDetail}>{step.detail}</span>}
                  </span>
                  <span className={css.stepStatus}>{statusWord(step.status, t)}</span>
                  {technical ? <code className={css.technical}>{step.tool} {step.raw ?? ''}</code> : null}
                </li>
                : <li key={step.key} className={css.step} data-status={step.kind}>
                  <span className={css.stepText}>
                    <span className={css.stepWho}>{step.kind === 'input' ? t('run.you') : t('run.robot')}</span>
                    {step.text}
                  </span>
                </li>)}
            </ol>}
        </section>

        <section className={css.block}>
          <h3 className={css.blockTitle}>{t('run.result')}</h3>
          {run.output === undefined || run.output.trim() === ''
            ? <p className={css.notice}>{run.error ?? t('run.noResult')}</p>
            : <p className={css.output}>{run.output}</p>}
        </section>
      </div>

      <footer className={css.footer}>
        <label className={css.draft} htmlFor={draftId}>{t('run.correctLabel')}</label>
        <div className={css.draftRow}>
          <Input
            id={draftId}
            value={draft}
            disabled={!live}
            placeholder={paused ? t('run.correctPlaceholderPaused') : t('run.correctPlaceholderRunning')}
            onChange={(event) => { setDraft(event.target.value) }}
            onKeyDown={(event) => {
              if (!submitsCorrection(event)) return
              send(draft)
            }}
          />
          <Button size="sm" variant="primary" disabled={!live || (draft.trim() === '' && !paused)} onClick={() => { send(draft) }}>
            {paused ? t('run.resume') : t('run.send')}
          </Button>
        </div>
      </footer>
    </section>
  )
}
