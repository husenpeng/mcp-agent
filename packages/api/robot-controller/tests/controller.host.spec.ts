import { brandString } from '@tomato/branded'
import { Context } from '@tomato/cordis'
import type { RobotId, RobotSpec, RobotSpecId, RobotTemplate, RobotTemplateId, RunId } from '@tomato/experimental-robot/types'
import RobotTemplateRegistry from '@tomato/experimental-robot/templates'
import LocalRobots from '@tomato/experimental-robot-local'
import Storage from '@tomato/storage'
import { DomainFacility } from '@tomato/storage-domain'
import TypertRegistry from '@tomato/typert-registry'
import { describe, expect, it } from 'vitest'
import { MemoryMediaPool, MemoryStorageBackend } from '../../../storage/storage-domain/tests/helpers/memory-backend.ts'
import RobotController from '../src/index.ts'
import type { RobotSnapshotFrame } from '../src/types.ts'

const BASE = {
  name: 'Reviewer',
  description: 'Reviews changes',
  position: {
    owner: 'alice',
    callers: ['alice'],
    callees: [],
    escalation: ['alice'],
    visibility: 'team',
  },
  goal: {
    mission: 'Review changes',
    successCriteria: ['find defects'],
    triggers: [{ kind: 'manual' }],
    strategy: 'plan',
    stopConditions: ['done'],
    failurePolicy: 'retry',
    budget: { tokens: 1000, millis: 1000, cost: 0.1, toolCalls: 10 },
    maxConcurrentRuns: 1,
  },
  capability: {
    tools: { allow: ['read'], deny: [] },
    mcpServers: [],
    skills: [],
    workspaceRoots: ['/tmp/workspace'],
    dataClasses: ['internal'],
    credentials: [],
    sandbox: 'workspace',
    permissionPreset: 'workspace',
    network: 'none',
  },
  io: {
    input: { schema: 'review.request', version: 1 },
    output: { schema: 'review.result', format: 'markdown', delivery: 'chat' },
    acceptance: ['cites evidence'],
  },
  memory: { read: [], write: [], recall: 'none' },
  a2a: { intents: [], peers: [] },
} satisfies RobotSpec

const TEMPLATE: RobotTemplate = {
  id: brandString<RobotTemplateId>('reviewer'),
  category: 'engineering',
  text: {
    en: { category: 'Engineering', name: 'Reviewer', description: 'Reviews changes', mission: 'Review changes', successCriteria: ['find defects'], acceptance: ['cites evidence'] },
    zh: { category: '工程', name: '审查员', description: '审查改动', mission: '审查改动', successCriteria: ['找出缺陷'], acceptance: ['引用证据'] },
  },
  spec: {
    position: BASE.position,
    goal: { ...BASE.goal, budget: { tokens: 400_000, millis: 1_800_000, cost: 0, toolCalls: 300 } },
    capability: { ...BASE.capability, network: 'any' },
    io: { input: BASE.io.input, output: BASE.io.output },
    memory: BASE.memory,
    a2a: BASE.a2a,
  },
}

async function nextMatching(frames: AsyncIterator<RobotSnapshotFrame>, accept: (frame: RobotSnapshotFrame) => boolean) {
  for (;;) {
    const frame = await frames.next()
    if (frame.done === true) throw new Error('watch ended before the expected frame')
    if (accept(frame.value)) return frame.value
  }
}

async function bench(options: { templates?: boolean } = {}) {
  const ctx = new Context()
  await ctx.plugin(Storage)
  const backend = new MemoryStorageBackend(new MemoryMediaPool())
  ctx.effect(() => ctx.storage.backend.register('fixture', backend))
  const facility = new DomainFacility(ctx, { backend: 'fixture' })
  ctx.effect(() => {
    const unmount = ctx.storage.mount('domain', facility)
    ctx.provide('storageDomain', facility)
    return async () => {
      await facility.closeAll()
      unmount()
    }
  })
  await ctx.plugin(TypertRegistry)
  await ctx.plugin(LocalRobots)
  if (options.templates === true) {
    await ctx.plugin(RobotTemplateRegistry)
    ctx.effect(() => ctx.robotTemplates.register(TEMPLATE))
  }
  await ctx.plugin(RobotController)
  return ctx
}

describe('robot Remote controller', () => {
  it('publishes, instantiates, rebinds, and starts runs through the namespace face', async () => {
    const ctx = await bench()
    try {
      const first = await ctx.robotController.publish({ spec: structuredClone(BASE) })
      const robot = await ctx.robotController.instantiate({ ref: first.ref })
      expect(robot).toMatchObject({ name: 'Reviewer', spec: first.ref })

      const next = structuredClone(BASE)
      next.goal.mission = 'Review changes twice'
      const second = await ctx.robotController.publish({ spec: next, previous: first.ref })
      await expect(ctx.robotController.rebind({ robotId: robot.id, ref: second.ref }))
        .resolves.toMatchObject({ id: robot.id, spec: second.ref })

      const run = await ctx.robotController.start({ robotId: robot.id, message: 'review' })
      await expect(ctx.robotController.runs({ robotId: robot.id })).resolves.toMatchObject([{ id: run.id }])
      await expect(ctx.robotController.start({ robotId: robot.id, message: 'again' })).rejects.toMatchObject({ code: 'robot/conflict' })
      await expect(ctx.robotController.specs()).resolves.toMatchObject([{ ref: second.ref }])
      await expect(ctx.robotController.robots()).resolves.toMatchObject([{ id: robot.id }])
      await ctx.robotController.cancel({ runId: run.id })
      await expect(ctx.robotController.runs({ robotId: robot.id })).resolves.toMatchObject([{ state: 'cancelled' }])
    } finally {
      await ctx.fiber.dispose()
    }
  })

  it('maps specification rejection and missing records to Remote codes', async () => {
    const ctx = await bench()
    try {
      const invalid = structuredClone(BASE)
      invalid.goal.budget.tokens = -1
      await expect(ctx.robotController.publish({ spec: invalid })).rejects.toMatchObject({
        code: 'robot/spec-invalid',
        details: { issues: [{ path: 'goal.budget.tokens' }] },
      })
      await expect(ctx.robotController.revision({ ref: { spec: brandString<RobotSpecId>('missing'), revision: 1 } }))
        .rejects.toMatchObject({ code: 'robot/not-found' })
      await expect(ctx.robotController.start({ robotId: brandString<RobotId>('missing-robot'), message: 'go' }))
        .rejects.toMatchObject({ code: 'robot/not-found' })
      await expect(ctx.robotController.cancel({ runId: brandString<RunId>('missing-run') }))
        .rejects.toMatchObject({ code: 'robot/not-found' })
      const missingRef = { spec: brandString<RobotSpecId>('missing'), revision: 1 }
      await expect(ctx.robotController.instantiate({ ref: missingRef })).rejects.toMatchObject({ code: 'robot/not-found' })
      const published = await ctx.robotController.publish({ spec: structuredClone(BASE) })
      const robot = await ctx.robotController.instantiate({ ref: published.ref })
      await expect(ctx.robotController.rebind({ robotId: robot.id, ref: missingRef })).rejects.toMatchObject({ code: 'robot/not-found' })
      await expect(ctx.robotController.publish({ spec: { ...structuredClone(BASE), description: 'duplicate name' } }))
        .rejects.toMatchObject({ code: 'robot/conflict' })
      // A rejection that only borrows the class name, without an issue list, is a conflict, not a field report.
      ctx.robots.publish = () => Promise.reject(Object.assign(new Error('forged'), { name: 'RobotSpecValidationError', issues: 'none' }))
      await expect(ctx.robotController.publish({ spec: structuredClone(BASE) })).rejects.toMatchObject({ code: 'robot/conflict', message: 'forged' })
      // A provider rejecting with a non-Error value still reaches the caller as a readable conflict.
      // oxlint-disable-next-line typescript/prefer-promise-reject-errors -- the case under test is a non-Error rejection
      ctx.robots.start = () => Promise.reject('stopped')
      await expect(ctx.robotController.start({ robotId: robot.id, message: 'go' })).rejects.toMatchObject({ code: 'robot/conflict', message: 'stopped' })
    } finally {
      await ctx.fiber.dispose()
    }
  })

  it('opens with the whole registry and re-reads after a change', async () => {
    const ctx = await bench()
    const abort = new AbortController()
    try {
      const frames: AsyncIterator<RobotSnapshotFrame> = ctx.robotController.watch(abort.signal)[Symbol.asyncIterator]()
      const first = await frames.next()
      expect(first.value).toMatchObject({ specs: [], robots: [], runs: [], templates: [] })

      const revision = await ctx.robotController.publish({ spec: structuredClone(BASE) })
      const second = await frames.next()
      expect(second.value).toMatchObject({ specs: [{ ref: revision.ref }] })

      abort.abort()
      expect(await frames.next()).toMatchObject({ done: true })
    } finally {
      await ctx.fiber.dispose()
    }
  })

  it('projects local skills, tools, MCP servers, and Workspaces into editor choices', async () => {
    const ctx = await bench()
    const queries: unknown[] = []
    try {
      ctx.provide('skills', {
        list: async (options: unknown) => {
          queries.push(options)
          return [
            { name: 'office-docx', description: 'Create Word documents', path: '/work/alpha/.agents/skills/office-docx/SKILL.md' },
            { name: 'quiet-skill', description: '' },
          ]
        },
      } as never)
      ctx.provide('tools', {
        definitions: () => [
          { name: 'read', description: 'Read a file' },
          { name: 'bash' },
        ],
      } as never)
      ctx.provide('mcpResources', { list: () => ['web', 'github'] } as never)
      ctx.provide('workspaceRegistry', {
        list: () => [{ path: '/work/alpha', title: 'Alpha' }],
      } as never)

      await expect(ctx.robotController.capabilities({ cwd: '/work/alpha' })).resolves.toEqual({
        skills: [
          {
            value: 'office-docx',
            label: 'office-docx',
            description: 'Create Word documents',
            path: '/work/alpha/.agents/skills/office-docx',
          },
          { value: 'quiet-skill', label: 'quiet-skill' },
        ],
        tools: [
          { value: 'bash', label: 'bash' },
          { value: 'read', label: 'read', description: 'Read a file' },
        ],
        mcpServers: [
          { value: 'web', label: 'web' },
          { value: 'github', label: 'github' },
        ],
        workspaceRoots: [{ value: '/work/alpha', label: 'Alpha', path: '/work/alpha' }],
      })
      await ctx.robotController.capabilities({})
      expect(queries).toEqual([{ cwd: '/work/alpha' }, {}])
    } finally {
      await ctx.fiber.dispose()
    }
  })

  it('returns empty choices when no capability source is mounted', async () => {
    const ctx = await bench()
    try {
      await expect(ctx.robotController.capabilities({})).resolves.toEqual({
        skills: [], tools: [], mcpServers: [], workspaceRoots: [],
      })
    } finally {
      await ctx.fiber.dispose()
    }
  })

  it('hires a localized, user-owned copy of a template and numbers repeated names', async () => {
    const ctx = await bench({ templates: true })
    try {
      const first = await ctx.robotController.hire({ templateId: TEMPLATE.id, locale: 'zh-CN' })
      expect(first).toMatchObject({ name: '审查员', state: 'idle' })
      const revision = await ctx.robotController.revision({ ref: first.spec })
      expect(revision.spec).toMatchObject({
        description: '审查改动',
        goal: { mission: '审查改动', budget: { tokens: 400_000, millis: 1_800_000, toolCalls: 300 } },
        capability: { network: 'any' },
        io: { acceptance: ['引用证据'] },
      })
      const again = { templateId: TEMPLATE.id, locale: 'zh' }
      await expect(ctx.robotController.hire(again)).resolves.toMatchObject({ name: '审查员 2' })
      await expect(ctx.robotController.hire(again)).resolves.toMatchObject({ name: '审查员 3' })
      await expect(ctx.robotController.hire({ templateId: TEMPLATE.id, locale: 'en', name: 'Mine' })).resolves.toMatchObject({ name: 'Mine' })
      await expect(ctx.robotController.hire({ templateId: TEMPLATE.id, locale: 'en', name: 'Mine' }))
        .rejects.toMatchObject({ code: 'robot/conflict' })
    } finally {
      await ctx.fiber.dispose()
    }
  })

  it('gives a rootless hired template the caller Workspace directory', async () => {
    const ctx = await bench({ templates: true })
    try {
      const rootless: RobotTemplate = {
        ...TEMPLATE,
        id: brandString<RobotTemplateId>('rootless'),
        spec: { ...TEMPLATE.spec, capability: { ...TEMPLATE.spec.capability, workspaceRoots: [] } },
      }
      ctx.effect(() => ctx.robotTemplates.register(rootless))
      const robot = await ctx.robotController.hire({ templateId: rootless.id, locale: 'en', workspaceRoot: '/projects/hire' })
      const revision = await ctx.robotController.revision({ ref: robot.spec })
      expect(revision.spec.capability.workspaceRoots).toEqual(['/projects/hire'])
    } finally {
      await ctx.fiber.dispose()
    }
  })

  it('keeps an edited hire independent of its template', async () => {
    const ctx = await bench({ templates: true })
    try {
      const robot = await ctx.robotController.hire({ templateId: TEMPLATE.id, locale: 'en' })
      const revision = await ctx.robotController.revision({ ref: robot.spec })
      const { goal } = revision.spec
      const edited: RobotSpec = { ...revision.spec, goal: { ...goal, budget: { ...goal.budget, tokens: 50_000 } } }
      const next = await ctx.robotController.publish({ spec: edited, previous: robot.spec })
      await ctx.robotController.rebind({ robotId: robot.id, ref: next.ref })
      expect(TEMPLATE.spec.goal.budget.tokens).toBe(400_000)
      expect(ctx.robotTemplates.get(TEMPLATE.id)?.spec.goal.budget.tokens).toBe(400_000)
      const stored = await ctx.robotController.revision({ ref: next.ref })
      expect(stored.spec.goal.budget.tokens).toBe(50_000)
    } finally {
      await ctx.fiber.dispose()
    }
  })

  it('reports an unknown template or a missing registry as not found', async () => {
    const withRegistry = await bench({ templates: true })
    const without = await bench()
    try {
      const templateId = brandString<RobotTemplateId>('missing')
      await expect(withRegistry.robotController.hire({ templateId, locale: 'en' })).rejects.toMatchObject({ code: 'robot/not-found' })
      await expect(without.robotController.hire({ templateId: TEMPLATE.id, locale: 'en' })).rejects.toMatchObject({ code: 'robot/not-found' })
    } finally {
      await withRegistry.fiber.dispose()
      await without.fiber.dispose()
    }
  })

  it('streams registered templates and re-reads after a template change', async () => {
    const ctx = await bench({ templates: true })
    const abort = new AbortController()
    try {
      const frames: AsyncIterator<RobotSnapshotFrame> = ctx.robotController.watch(abort.signal)[Symbol.asyncIterator]()
      expect((await frames.next()).value).toMatchObject({ templates: [{ id: 'reviewer' }] })
      const dispose = ctx.robotTemplates.register({ ...TEMPLATE, id: brandString<RobotTemplateId>('second') })
      expect((await frames.next()).value).toMatchObject({ templates: [{ id: 'reviewer' }, { id: 'second' }] })
      dispose()
      expect((await frames.next()).value).toMatchObject({ templates: [{ id: 'reviewer' }] })
      const hired = await ctx.robotController.hire({ templateId: TEMPLATE.id, locale: 'en' })
      const withRobot = await nextMatching(frames, frame => frame.robots.length === 1)
      expect(withRobot).toMatchObject({ robots: [{ id: hired.id }], runs: [] })
      abort.abort()
    } finally {
      await ctx.fiber.dispose()
    }
  })
})
