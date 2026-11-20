// @vitest-environment jsdom
/** The work-team page as the Plugins page renders it: staged defaults plus per-robot publish-and-rebind saves. */

import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { brandString } from '@tomato/branded'
import { createSnapshotStore } from '@tomato/client-store'
import { bindSnapshotSelector, makeTranslate, RemoteError } from '@tomato/client-test-runtime'
import type { SettingsFieldState, SettingsFormShell } from '@tomato/client-ui-primitives'
import type {
  Robot, RobotId, RobotPublishRequest, RobotRebindRequest, RobotRunsSnapshot, RobotSpec, RobotSpecRef, RobotSpecRevision,
} from '@tomato/api-robot-controller/client'
import type { RobotModel } from '@tomato/experimental-robot/types'
import type { RemoteResult } from '@tomato/typert-protocol'
import { WorkTeamSettingsCard, type WorkTeamSettingsCardProps } from '../src/client/WorkTeamSettingsCard.tsx'
import type { WorkTeamDefaultsCardState } from '../src/client/work-team-card-controller.ts'
import { en } from '../src/client/locales.ts'

afterEach(cleanup)

const t = makeTranslate(en) as WorkTeamSettingsCardProps['t']

const settled: SettingsFormShell = {
  available: true,
  writable: true,
  dirty: false,
  invalid: false,
  saving: false,
  failed: false,
}

function field(text: string, rest: Partial<SettingsFieldState> = {}): SettingsFieldState {
  return { text, overridden: false, invalid: false, ...rest }
}

const MODEL: RobotModel = { provider: 'blueai', model: 'DeepSeek-V4.1-Flash-1017' }

/** One complete published specification for the registry fixture. */
function specOf(name: string, model?: RobotModel): RobotSpec {
  return {
    name,
    position: { owner: 'me', callers: [], callees: [], escalation: [], visibility: 'team' },
    goal: {
      mission: 'Scout creators',
      successCriteria: [],
      triggers: [],
      ...(model === undefined ? {} : { model }),
      strategy: 'loop',
      stopConditions: [],
      failurePolicy: 'pause',
      budget: { tokens: 1000, millis: 60_000, cost: 1, toolCalls: 10 },
      maxConcurrentRuns: 1,
    },
    capability: {
      tools: { allow: [], deny: [] },
      mcpServers: [],
      plugins: [],
      skills: [],
      workspaceRoots: [],
      dataClasses: ['internal'],
      credentials: [],
      sandbox: 'workspace',
      permissionPreset: 'workspace-write',
      network: 'none',
    },
    io: {
      input: { schema: 'text', version: 1 },
      output: { schema: 'text', format: 'text', delivery: 'chat' },
      acceptance: [],
    },
    memory: { read: [], write: [], recall: 'none' },
    a2a: { intents: [], peers: [] },
  }
}

const SCOUT_REF: RobotSpecRef = { spec: brandString<RobotSpecRef['spec']>('spec-scout'), revision: 1 }
const SCOUT: RobotSpecRevision = { ref: SCOUT_REF, spec: specOf('Scout', MODEL), publishedAt: 0 }
const PUBLISHED: RobotSpecRevision = {
  ref: { spec: SCOUT_REF.spec, revision: 2 },
  spec: specOf('Scout', { provider: 'other', model: MODEL.model }),
  publishedAt: 1,
  supersedes: 1,
}
const OTHER: RobotSpecRevision = {
  ref: { spec: brandString<RobotSpecRef['spec']>('spec-reviewer'), revision: 1 },
  spec: specOf('Reviewer'),
  publishedAt: 0,
}
const SCOUT_ROBOT: Robot = { id: brandString<RobotId>('robot-scout'), name: 'Scout', spec: SCOUT_REF, state: 'idle', createdAt: 0 }
const REVIEWER_ROBOT: Robot = { id: brandString<RobotId>('robot-reviewer'), name: 'Reviewer', spec: OTHER.ref, state: 'idle', createdAt: 0 }

function renderCard(
  defaultsState: Partial<WorkTeamDefaultsCardState> = {},
  snapshot: RobotRunsSnapshot = { specs: [SCOUT, OTHER], robots: [SCOUT_ROBOT, REVIEWER_ROBOT], runs: [], templates: [] },
  view: 'summary' | 'page' = 'page',
) {
  const defaults = createSnapshotStore<WorkTeamDefaultsCardState>({
    ...settled,
    defaultProvider: field(MODEL.provider),
    defaultModel: field(MODEL.model),
    permissionPreset: field('workspace-write'),
    sandbox: field('workspace'),
    ...defaultsState,
  })
  const registry = createSnapshotStore<RobotRunsSnapshot>(snapshot)
  const actions = {
    edit: vi.fn(),
    resetField: vi.fn(),
    save: vi.fn(),
    discard: vi.fn(),
    publishRobot: vi.fn<(request: RobotPublishRequest) => Promise<RemoteResult<RobotSpecRevision>>>(
      () => Promise.resolve({ ok: true, value: PUBLISHED }),
    ),
    rebindRobot: vi.fn<(request: RobotRebindRequest) => Promise<RemoteResult<Robot>>>(
      () => Promise.resolve({ ok: true, value: SCOUT_ROBOT }),
    ),
  }
  const props = {
    ...actions,
    view,
    t,
    robotSnapshot: () => registry.getSnapshot(),
    useWorkTeamDefaults: bindSnapshotSelector(defaults),
    useRobotRegistry: bindSnapshotSelector(registry),
  } as WorkTeamSettingsCardProps
  render(<WorkTeamSettingsCard {...props} />)
  return { actions, defaults, registry }
}

describe('work-team defaults section', () => {
  it('renders the four fields with their effective values', () => {
    renderCard()
    expect(screen.getByLabelText(en.providerLabel)).toHaveProperty('value', MODEL.provider)
    expect(screen.getByLabelText(en.modelLabel)).toHaveProperty('value', MODEL.model)
    expect(screen.getByLabelText(en.permissionPresetLabel)).toHaveProperty('value', 'workspace-write')
    const sandbox = screen.getByLabelText(en.sandboxLabel)
    expect(sandbox).toHaveProperty('value', 'workspace')
    expect(screen.getByRole('option', { name: en.sandboxNone })).toHaveProperty('value', 'none')
    expect(screen.getByRole('option', { name: en.sandboxFull })).toHaveProperty('value', 'full')
  })

  it('stages edits, resets, and one footer save through the form actions', () => {
    const { actions } = renderCard({ dirty: true, sandbox: field('workspace', { overridden: true }) })
    fireEvent.change(screen.getByLabelText(en.providerLabel), { target: { value: 'other' } })
    fireEvent.change(screen.getByLabelText(en.sandboxLabel), { target: { value: 'full' } })
    expect(actions.edit.mock.calls).toEqual([['defaultProvider', 'other'], ['sandbox', 'full']])
    fireEvent.click(screen.getByRole('button', { name: en.reset }))
    expect(actions.resetField.mock.calls).toEqual([['sandbox']])
    fireEvent.click(screen.getByRole('button', { name: en.save }))
    expect(actions.save).toHaveBeenCalledOnce()
  })

  it('drops the staged defaults when leaving the page', () => {
    const { actions } = renderCard({ dirty: true })
    cleanup()
    expect(actions.discard).toHaveBeenCalledOnce()
  })

  it('keeps the robot section usable while the defaults form is unavailable', () => {
    renderCard({ available: false })
    expect(screen.getByRole('status').textContent).toBe(en.unavailable)
    expect(screen.getByLabelText('Provider for Scout')).toHaveProperty('value', MODEL.provider)
  })

  it('disables the defaults controls on a read-only document', () => {
    renderCard({ writable: false })
    expect(screen.getByText(en.readOnly)).toBeTruthy()
    expect(screen.getByLabelText(en.providerLabel)).toHaveProperty('disabled', true)
    expect(screen.getByLabelText(en.sandboxLabel)).toHaveProperty('disabled', true)
  })

  it('renders its one-liner in the summary view', () => {
    renderCard({}, undefined, 'summary')
    expect(document.body.textContent).toBe(en.description)
  })
})

describe('work-team robot section', () => {
  it('renders one row per published spec with its current model route', () => {
    renderCard()
    expect(screen.getByText('Scout')).toBeTruthy()
    expect(screen.getByText('Reviewer')).toBeTruthy()
    expect(screen.getByLabelText('Provider for Scout')).toHaveProperty('value', MODEL.provider)
    expect(screen.getByLabelText('Model for Scout')).toHaveProperty('value', MODEL.model)
    expect(screen.getByLabelText('Provider for Reviewer')).toHaveProperty('value', '')
    expect(screen.getAllByRole('button', { name: en.robotSave })).toHaveLength(2)
  })

  it('shows the empty state when nothing is published', () => {
    renderCard({}, { specs: [], robots: [], runs: [], templates: [] })
    expect(screen.getByText(en.robotsEmpty)).toBeTruthy()
  })

  it('publishes the edited route and rebinds only the robots bound to that spec', async () => {
    const { actions, registry } = renderCard()
    const save = screen.getAllByRole('button', { name: en.robotSave })[0]!
    expect(save).toHaveProperty('disabled', true)
    fireEvent.change(screen.getByLabelText('Provider for Scout'), { target: { value: 'other' } })
    expect(save).toHaveProperty('disabled', false)
    fireEvent.click(save)
    await screen.findByText(en.robotSaved)
    expect(actions.publishRobot).toHaveBeenCalledWith({
      spec: { ...SCOUT.spec, goal: { ...SCOUT.spec.goal, model: { provider: 'other', model: MODEL.model } } },
      previous: SCOUT.ref,
    })
    expect(actions.rebindRobot.mock.calls).toEqual([[{ robotId: SCOUT_ROBOT.id, ref: PUBLISHED.ref }]])
    // The watch frame lands: the row re-seeds from the new revision, draft gone.
    act(() => {
      registry.set({
        specs: [PUBLISHED, OTHER],
        robots: [{ ...SCOUT_ROBOT, spec: PUBLISHED.ref }, REVIEWER_ROBOT],
        runs: [],
        templates: [],
      })
    })
    expect(screen.getByLabelText('Provider for Scout')).toHaveProperty('value', 'other')
    expect(screen.getAllByRole('button', { name: en.robotSave })[0]).toHaveProperty('disabled', true)
  })

  it('keeps the draft and reports failure when publication is refused', async () => {
    const { actions } = renderCard()
    actions.publishRobot.mockImplementation(() => Promise.resolve({
      ok: false as const,
      error: new RemoteError('robot/spec-invalid', 'refused', { issues: [] }),
    }))
    fireEvent.change(screen.getByLabelText('Model for Scout'), { target: { value: 'other-model' } })
    fireEvent.click(screen.getAllByRole('button', { name: en.robotSave })[0]!)
    await screen.findByText(en.robotSaveFailed)
    expect(actions.rebindRobot).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Model for Scout')).toHaveProperty('value', 'other-model')
  })

  it('reports failure when a rebind is refused after a landed publication', async () => {
    const { actions } = renderCard()
    actions.rebindRobot.mockImplementation(() => Promise.resolve({
      ok: false as const,
      error: new RemoteError('robot/not-found', 'gone', { id: 'robot-scout' }),
    }))
    fireEvent.change(screen.getByLabelText('Provider for Scout'), { target: { value: 'other' } })
    fireEvent.click(screen.getAllByRole('button', { name: en.robotSave })[0]!)
    await screen.findByText(en.robotSaveFailed)
    expect(actions.publishRobot).toHaveBeenCalledOnce()
    expect(screen.getByLabelText('Provider for Scout')).toHaveProperty('value', 'other')
  })

  it('blocks a row save while its route is empty and locks the row while saving', async () => {
    const { actions } = renderCard()
    let release: (value: { ok: true; value: RobotSpecRevision }) => void = () => {}
    actions.publishRobot.mockImplementation(() => new Promise((resolve) => { release = resolve }))
    fireEvent.change(screen.getByLabelText('Provider for Scout'), { target: { value: '' } })
    const save = screen.getAllByRole('button', { name: en.robotSave })[0]!
    expect(save).toHaveProperty('disabled', true)
    fireEvent.change(screen.getByLabelText('Provider for Scout'), { target: { value: 'other' } })
    fireEvent.click(save)
    expect(screen.getByRole('button', { name: en.saving })).toHaveProperty('disabled', true)
    expect(screen.getByLabelText('Provider for Scout')).toHaveProperty('disabled', true)
    await act(async () => { release({ ok: true, value: PUBLISHED }) })
    await waitFor(() => { expect(screen.getByText(en.robotSaved)).toBeTruthy() })
  })
})
