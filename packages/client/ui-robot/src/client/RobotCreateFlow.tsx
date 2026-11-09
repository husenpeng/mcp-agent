/** Guided creation: mission, name and description, success criteria, then a live preview. */
import type { ReactNode } from 'react'
import { useEffect, useId, useRef, useState } from 'react'
import type { DirectoryListing } from '@tomato/api-remotes/client'
import type { RobotSpec, RobotSpecIssue } from '@tomato/api-robot-controller/client'
import type { PropsLocale } from '@tomato/client-ui-slots'
import { Button, Input, isMobileDevice } from '@tomato/client-ui-primitives'
import { NS } from './locales.ts'
import { emptyRobotSpec, MISSION_STUB, NAME_STUB } from './spec.ts'
import { FolderPicker } from './FolderPicker.tsx'
import { RobotAvatar } from './RobotAvatar.tsx'
import css from './RobotCreateFlow.module.css'

/** Ordered creation steps. */
const STEPS = ['mission', 'identity', 'criteria'] as const

type Step = typeof STEPS[number]

/** Props of the guided robot creation flow. */
export interface RobotCreateFlowProps extends PropsLocale<typeof NS> {
  /** Names the registry already uses, checked before the first save. */
  readonly existingNames: readonly string[]
  /** Workspace directory the robot starts in; omitted when the page has none. */
  readonly defaultWorkspaceRoot?: string | undefined
  /** Whether a save is in flight. */
  readonly busy?: boolean | undefined
  /** Failure from the last save attempt. */
  readonly error?: string | undefined
  /** Provider field issues from the last rejected save. */
  readonly issues?: readonly RobotSpecIssue[] | undefined
  /** List one Host directory level; omitted hides the folder action. */
  readonly listDirectory?: ((path?: string, signal?: AbortSignal) => Promise<DirectoryListing>) | undefined
  /** Open the Host's own folder chooser; omitted hides the folder action. */
  readonly pickDirectory?: (() => Promise<string | null>) | undefined
  /** Leave the flow without creating a robot. */
  readonly onCancel: () => void
  /** Create the robot from the collected specification. */
  readonly onSubmit: (spec: RobotSpec) => void
}

/** Split textarea lines into trimmed, non-empty criteria. */
function lines(text: string): string[] {
  return text.split('\n').map(line => line.trim()).filter(line => line !== '')
}

/**
 * Walk the four basic answers one step at a time, ending in a preview the user
 * confirms before the specification is published.
 * @param props - existing names, workspace default, save state, and callbacks.
 * @returns the creation flow body.
 */
export function RobotCreateFlow({
  existingNames, defaultWorkspaceRoot, busy, error, issues, listDirectory, pickDirectory, onCancel, onSubmit, t,
}: RobotCreateFlowProps): ReactNode {
  const panelId = useId()
  const [step, setStep] = useState<Step>('mission')
  const [mission, setMission] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [criteria, setCriteria] = useState('')
  const [showErrors, setShowErrors] = useState(false)
  /** A folder the user picked here overrides the Workspace default. */
  const [pickedRoot, setPickedRoot] = useState<string>()
  const [folderOpen, setFolderOpen] = useState(false)
  const workspaceRoot = pickedRoot ?? defaultWorkspaceRoot
  const missionRef = useRef<HTMLTextAreaElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const criteriaRef = useRef<HTMLTextAreaElement>(null)
  // Moving between steps unmounts the previous control; put the caret in the
  // next answer instead of leaving keyboard focus on a removed button. A phone
  // keeps its keyboard closed until the user taps the field.
  useEffect(() => {
    /* v8 ignore next -- phone keyboards are not emulated in the jsdom lane */
    if (isMobileDevice()) return
    if (step === 'mission') missionRef.current?.focus()
    else if (step === 'identity') nameRef.current?.focus()
    else criteriaRef.current?.focus()
  }, [step])
  const missionText = mission.trim()
  const nameText = name.trim()
  const missionMissing = missionText === '' || missionText === MISSION_STUB
  const nameMissing = nameText === '' || nameText === NAME_STUB
  const nameTaken = !nameMissing
    && existingNames.some(existing => existing.trim().toLowerCase() === nameText.toLowerCase())
  const criteriaList = lines(criteria)
  const issueFor = (path: string): string | undefined => issues?.find(issue => issue.path === path)?.message
  const stepIndex = STEPS.indexOf(step)

  const next = (): void => {
    if (step === 'mission') {
      if (missionMissing) {
        setShowErrors(true)
        return
      }
      setShowErrors(false)
      setStep('identity')
      return
    }
    // Only the identity step renders a Next action from here.
    if (nameMissing || nameTaken) {
      setShowErrors(true)
      return
    }
    setShowErrors(false)
    setStep('criteria')
  }
  const back = (): void => {
    setShowErrors(false)
    setStep(step === 'identity' ? 'mission' : 'identity')
  }
  const submit = (): void => {
    // Navigation already enforces a mission and a name; the registry can still
    // learn the chosen name while this step is open, so that one is rechecked.
    if (nameTaken) {
      setShowErrors(true)
      setStep('identity')
      return
    }
    const spec = emptyRobotSpec({
      name: nameText,
      ...description.trim() === '' ? {} : { description: description.trim() },
      mission: missionText,
      successCriteria: criteriaList,
    })
    onSubmit(workspaceRoot === undefined
      ? spec
      : { ...spec, capability: { ...spec.capability, workspaceRoots: [workspaceRoot] } })
  }

  const addSuggestion = (suggestion: string): void => {
    if (criteriaList.includes(suggestion)) return
    setCriteria([...criteriaList, suggestion].join('\n'))
  }

  const fieldError = (message: string | undefined): ReactNode =>
    message === undefined ? null : <em className={css.issue} role="alert">{message}</em>

  return (
    <div className={css.flow}>
      <header className={css.header}>
        <h2>{t('create.title')}</h2>
        <p>{t('create.subtitle')}</p>
      </header>

      <ol className={css.steps} aria-label={t('create.progress')}>
        {STEPS.map((value, index) => (
          <li
            key={value}
            className={css.stepItem}
            data-state={value === step ? 'current' : index < stepIndex ? 'done' : 'pending'}
            aria-current={value === step ? 'step' : undefined}
          >
            <span className={css.stepNumber}>{index + 1}</span>
            <span className={css.stepName}>{t(`create.step.${value}`)}</span>
            {value === step
              ? <span className={css.stepCount}>{t('create.stepOf', { current: index + 1, total: STEPS.length })}</span>
              : null}
          </li>
        ))}
      </ol>

      <section className={css.panel}>
        {step === 'mission'
          ? (
            <div className={css.step}>
              <div className={css.intro}>
                <h3>{t('create.missionTitle')}</h3>
                <p>{t('create.missionBody')}</p>
              </div>
              <div className={css.field}>
                <label className={css.label} htmlFor={`${panelId}-mission`}>{t('create.missionTitle')}</label>
                <textarea
                  ref={missionRef}
                  id={`${panelId}-mission`}
                  rows={5}
                  value={mission}
                  placeholder={t('create.missionPlaceholder')}
                  onChange={(event) => { setMission(event.target.value) }}
                />
                {showErrors && missionMissing ? fieldError(t('create.missionRequired')) : fieldError(issueFor('goal.mission'))}
              </div>
              <div className={css.examples}>
                <span className={css.examplesLabel}>{t('create.examples')}</span>
                <div className={css.exampleList}>
                  <button type="button" className={css.example} onClick={() => { setMission(t('create.example.one')) }}>{t('create.example.one')}</button>
                  <button type="button" className={css.example} onClick={() => { setMission(t('create.example.two')) }}>{t('create.example.two')}</button>
                  <button type="button" className={css.example} onClick={() => { setMission(t('create.example.three')) }}>{t('create.example.three')}</button>
                </div>
              </div>
            </div>
          )
          : null}

        {step === 'identity'
          ? (
            <div className={css.step}>
              <div className={css.intro}>
                <h3>{t('create.nameTitle')}</h3>
                <p>{t('create.nameBody')}</p>
              </div>
              <div className={css.identityRow}>
                <RobotAvatar name={nameText === '' ? '?' : nameText} skills={[]} />
                <div className={css.identityFields}>
                  <div className={css.field}>
                    <label className={css.label} htmlFor={`${panelId}-name`}>{t('create.nameLabel')}</label>
                    <Input
                      ref={nameRef}
                      id={`${panelId}-name`}
                      value={name}
                      placeholder={t('create.namePlaceholder')}
                      onChange={(event) => { setName(event.target.value) }}
                    />
                    {showErrors && nameMissing ? fieldError(t('create.nameRequired')) : null}
                    {showErrors && nameTaken ? fieldError(t('create.nameTaken')) : null}
                    {fieldError(issueFor('name'))}
                  </div>
                  <div className={css.field}>
                    <label className={css.label} htmlFor={`${panelId}-description`}>{t('create.descriptionLabel')}</label>
                    <Input
                      id={`${panelId}-description`}
                      value={description}
                      placeholder={t('create.descriptionPlaceholder')}
                      onChange={(event) => { setDescription(event.target.value) }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )
          : null}

        {step === 'criteria'
          ? (
            <div className={css.step}>
              <div className={css.intro}>
                <h3>{t('create.criteriaTitle')}</h3>
                <p>{t('create.criteriaBody')}</p>
              </div>
              <div className={css.field}>
                <label className={css.label} htmlFor={`${panelId}-criteria`}>{t('create.criteriaTitle')}</label>
                <textarea
                  ref={criteriaRef}
                  id={`${panelId}-criteria`}
                  rows={4}
                  value={criteria}
                  placeholder={t('create.criteriaPlaceholder')}
                  onChange={(event) => { setCriteria(event.target.value) }}
                />
              </div>
              <div className={css.examples}>
                <span className={css.examplesLabel}>{t('create.criteriaSuggestions')}</span>
                <div className={css.exampleList}>
                  <button type="button" className={css.example} onClick={() => { addSuggestion(t('create.suggestion.one')) }}>{t('create.suggestion.one')}</button>
                  <button type="button" className={css.example} onClick={() => { addSuggestion(t('create.suggestion.two')) }}>{t('create.suggestion.two')}</button>
                  <button type="button" className={css.example} onClick={() => { addSuggestion(t('create.suggestion.three')) }}>{t('create.suggestion.three')}</button>
                </div>
              </div>
              <aside className={css.preview} aria-label={t('create.preview')}>
                <span className={css.previewLabel}>{t('create.preview')}</span>
                <div className={css.previewHead}>
                  <RobotAvatar name={nameText} skills={[]} />
                  <div className={css.previewIdentity}>
                    <strong>{nameText}</strong>
                    <span>{description.trim() === '' ? t('create.previewNoDescription') : description.trim()}</span>
                  </div>
                </div>
                <p className={css.previewMission}>{missionText}</p>
                {criteriaList.length === 0
                  ? null
                  : <ul className={css.previewCriteria}>{criteriaList.map(item => <li key={item}>{item}</li>)}</ul>}
                <div className={css.previewWorkspace}>
                  <span>{t('create.workspace')}</span>
                  {workspaceRoot === undefined ? null : <code>{workspaceRoot}</code>}
                  <span>{t('create.workspaceHint')}</span>
                  {listDirectory === undefined || pickDirectory === undefined
                    ? null
                    : (
                      <Button size="sm" variant="outline" onClick={() => { setFolderOpen(true) }}>
                        {workspaceRoot === undefined ? t('create.chooseWorkspace') : t('create.changeWorkspace')}
                      </Button>
                    )}
                </div>
                <p className={css.advancedNote}>{t('create.advancedNote')}</p>
              </aside>
            </div>
          )
          : null}
      </section>

      {error === undefined ? null : <p className={css.error} role="alert">{error}</p>}

      {listDirectory === undefined || pickDirectory === undefined
        ? null
        : (
          <FolderPicker
            t={t}
            open={folderOpen}
            title={t('picker.browseTitle')}
            description={t('picker.workspaceHint')}
            initialPath={workspaceRoot}
            listDirectory={listDirectory}
            pickDirectory={pickDirectory}
            onPicked={(path) => { setPickedRoot(path); setFolderOpen(false) }}
            onCancel={() => { setFolderOpen(false) }}
          />
        )}

      <footer className={css.actions}>
        <Button variant="ghost" onClick={onCancel}>{t('roster.cancel')}</Button>
        <div className={css.actionsRight}>
          {step === 'mission' ? null : <Button variant="outline" onClick={back}>{t('create.back')}</Button>}
          {step === 'criteria'
            ? (
              <Button variant="primary" disabled={busy === true} aria-busy={busy === true} onClick={submit}>
                {busy === true ? t('create.creating') : t('create.submit')}
              </Button>
            )
            : <Button variant="primary" onClick={next}>{t('create.next')}</Button>}
        </div>
      </footer>
    </div>
  )
}
