/**
 * Room specification defaults and the complete validator. A publication
 * rejects every field problem at once so the editor reports them together.
 * @module @tomato/experimental-robot-room
 */

import type {
  RoomBudgetSpec, RoomContextSpec, RoomGuardSpec, RoomMemberId, RoomMemberSpec, RoomSpec, RoomSpecIssue,
} from './types.ts'
import { RoomSpecValidationError } from './types.ts'

/** Balanced loop protection; a healthy room rarely meets these limits. */
export const DEFAULT_ROOM_GUARD: RoomGuardSpec = Object.freeze({
  maxDepth: 4,
  episodeTurns: 12,
  episodeMessages: 40,
  episodeTokens: 250_000,
  wallClockMs: 20 * 60 * 1000,
  memberTurnTimeoutMs: 2 * 60 * 1000,
  memberTurnsPerMinute: 6,
  memberBurst: 3,
  maxPendingPerMember: 3,
  maxDuplicates: 2,
  pingPongLimit: 4,
  noProgressWindow: 3,
  noProgressSimilarity: 0.85,
})

/** Balanced room budget. */
export const DEFAULT_ROOM_BUDGET: RoomBudgetSpec = Object.freeze({
  dailyTokens: 3_000_000,
  softLimitRatio: 0.8,
})

/** Default context construction. */
export const DEFAULT_ROOM_CONTEXT: RoomContextSpec = Object.freeze({
  window: 20,
  messageChars: 1500,
  summaryChars: 1200,
  triggerChars: 6000,
})

/** One named guard and budget preset the editor offers. */
export interface RoomPreset {
  /** Display label key the editor localizes. */
  readonly id: 'conservative' | 'balanced' | 'permissive'
  /** Guard limits. */
  readonly guard: RoomGuardSpec
  /** Budget limits. */
  readonly budget: RoomBudgetSpec
}

/** The three guard presets a new room can start from. */
export const ROOM_PRESETS: readonly RoomPreset[] = Object.freeze([
  {
    id: 'conservative',
    guard: {
      maxDepth: 2, episodeTurns: 6, episodeMessages: 20, episodeTokens: 100_000,
      wallClockMs: 10 * 60 * 1000, memberTurnTimeoutMs: 90 * 1000,
      memberTurnsPerMinute: 4, memberBurst: 2, maxPendingPerMember: 2, maxDuplicates: 1, pingPongLimit: 3,
      noProgressWindow: 3, noProgressSimilarity: 0.85,
    },
    budget: { dailyTokens: 1_000_000, softLimitRatio: 0.8 },
  },
  { id: 'balanced', guard: DEFAULT_ROOM_GUARD, budget: DEFAULT_ROOM_BUDGET },
  {
    id: 'permissive',
    guard: {
      maxDepth: 6, episodeTurns: 24, episodeMessages: 80, episodeTokens: 600_000,
      wallClockMs: 45 * 60 * 1000, memberTurnTimeoutMs: 3 * 60 * 1000,
      memberTurnsPerMinute: 10, memberBurst: 5, maxPendingPerMember: 5, maxDuplicates: 3, pingPongLimit: 6,
      noProgressWindow: 4, noProgressSimilarity: 0.9,
    },
    budget: { dailyTokens: 8_000_000, softLimitRatio: 0.8 },
  },
])

/** Largest member list a room may publish. */
export const MAX_MEMBERS = 12

/** Smallest member list a room may publish. */
export const MIN_MEMBERS = 2

/** Member id grammar; the id doubles as the A2A address. */
const MEMBER_ID = /^[a-z][a-z0-9-]{0,31}$/u

/** One member the editor fills when creating a room. */
export interface EmptyRoomMemberInput {
  /** Lowercase member id. */
  readonly id: string
  /** Published Rbot spec id. */
  readonly robot: string
  /** Positive published revision. */
  readonly revision: number
  /** Display name. */
  readonly name: string
  /** Role. */
  readonly role: RoomMemberSpec['role']
  /** Optional model override. */
  readonly model?: RoomMemberSpec['model']
}

/** One field the editor fills when creating a room. */
export interface EmptyRoomInput {
  /** Display name. */
  readonly name: string
  /** Charter. */
  readonly charter: string
  /** Starting members; at least two are required to publish. */
  readonly members: readonly EmptyRoomMemberInput[]
  /** Preset id; defaults to balanced. */
  readonly preset?: RoomPreset['id']
  /** Optional workspace root. */
  readonly workspaceRoot?: string
}

/**
 * Build a publishable starter room from named members.
 * @param input - name, charter, members, and preset.
 * @returns a specification with the preset limits and conservative member defaults.
 */
export function emptyRoomSpec(input: EmptyRoomInput): RoomSpec {
  const preset = ROOM_PRESETS.find(candidate => candidate.id === (input.preset ?? 'balanced'))
    ?? { id: 'balanced' as const, guard: DEFAULT_ROOM_GUARD, budget: DEFAULT_ROOM_BUDGET }
  const members = input.members.map((member, index): RoomMemberSpec => ({
    id: member.id as RoomMemberId,
    robot: { spec: member.robot.trim(), revision: member.revision },
    displayName: member.name.trim(),
    role: member.role,
    wake: { kind: member.role === 'coordinator' ? 'all-human' : 'mention' },
    a2a: {
      canAddress: '*',
      accepts: member.role === 'observer' ? [] : ['request', 'delegate', 'handoff', 'reply'],
      requiresApproval: [],
    },
    budget: {
      turnInputTokens: 48_000,
      turnOutputTokens: 6_000,
      dailyTokens: 600_000,
    },
    ...member.model === undefined ? {} : { model: member.model },
    enabled: true,
    ...index === 0 ? { color: 'indigo' } : {},
  }))
  const coordinator = members.find(member => member.role === 'coordinator')?.id ?? members[0]?.id
  return {
    name: input.name.trim(),
    charter: input.charter.trim(),
    members,
    routing: {
      humanDefault: 'coordinator',
      ...coordinator === undefined ? {} : { coordinator },
      maxFanout: Math.min(3, Math.max(1, members.length - 1)),
      floor: 1,
    },
    guard: { ...preset.guard },
    budget: { ...preset.budget },
    context: { ...DEFAULT_ROOM_CONTEXT },
    ...input.workspaceRoot === undefined || input.workspaceRoot.trim() === ''
      ? {}
      : { workspaceRoot: input.workspaceRoot.trim() },
  }
}

/**
 * Validate one complete room specification.
 * @param spec - specification to check.
 * @returns every field-level problem; empty when the specification is publishable.
 */
export function validateRoomSpec(spec: RoomSpec): RoomSpecIssue[] {
  const issues: RoomSpecIssue[] = []
  const issue = (path: string, message: string): void => { issues.push({ path, message }) }
  const text = (value: unknown): value is string => typeof value === 'string'

  if (!text(spec.name) || spec.name.trim().length === 0) issue('name', 'a non-empty display name is required')
  else if (spec.name.trim().length > 80) issue('name', 'must be at most 80 characters')
  if (!text(spec.charter) || spec.charter.trim().length === 0) issue('charter', 'a non-empty charter is required')
  else if (spec.charter.trim().length > 4000) issue('charter', 'must be at most 4000 characters')

  const members: readonly RoomMemberSpec[] = Array.isArray(spec.members) ? spec.members : []
  if (members.length < MIN_MEMBERS || members.length > MAX_MEMBERS) {
    issue('members', `must hold between ${MIN_MEMBERS} and ${MAX_MEMBERS} members`)
  }
  const ids = new Set<string>()
  for (const [index, member] of members.entries()) {
    const path = `members.${index}`
    if (!MEMBER_ID.test(member.id)) issue(`${path}.id`, 'must be a lowercase slug of at most 32 characters')
    if (ids.has(member.id)) issue(`${path}.id`, `duplicate member id "${member.id}"`)
    ids.add(member.id)
    if (!text(member.robot.spec) || member.robot.spec.trim().length === 0) issue(`${path}.robot.spec`, 'a published Rbot spec id is required')
    if (!Number.isInteger(member.robot.revision) || member.robot.revision < 1) issue(`${path}.robot.revision`, 'must be a positive integer')
    if (member.displayName !== undefined && (member.displayName.trim().length === 0 || member.displayName.length > 40)) {
      issue(`${path}.displayName`, 'must be between 1 and 40 characters when set')
    }
    if (!['coordinator', 'worker', 'reviewer', 'observer'].includes(member.role)) issue(`${path}.role`, 'is not a known role')
    if (!['mention', 'keywords', 'all-human'].includes(member.wake.kind)) issue(`${path}.wake.kind`, 'is not a known wake rule')
    if (member.wake.kind === 'keywords' && (member.wake.keywords.length === 0 || member.wake.keywords.some(word => word.trim() === ''))) {
      issue(`${path}.wake.keywords`, 'must hold at least one non-empty keyword')
    }
    if (member.a2a.canAddress !== '*' && !Array.isArray(member.a2a.canAddress)) issue(`${path}.a2a.canAddress`, "must be '*' or a member list")
    if (member.a2a.accepts.some(intent => !['request', 'delegate', 'handoff', 'inform', 'reply'].includes(intent))) {
      issue(`${path}.a2a.accepts`, 'names an unknown intent')
    }
    if (member.a2a.requiresApproval.some(id => !ids.has(id) && id !== member.id)) issue(`${path}.a2a.requiresApproval`, 'names an unknown member')
    if (!Number.isInteger(member.budget.turnInputTokens) || member.budget.turnInputTokens < 1000) issue(`${path}.budget.turnInputTokens`, 'must be at least 1000')
    if (!Number.isInteger(member.budget.turnOutputTokens) || member.budget.turnOutputTokens < 256) issue(`${path}.budget.turnOutputTokens`, 'must be at least 256')
    if (!Number.isInteger(member.budget.dailyTokens) || member.budget.dailyTokens < 10_000) issue(`${path}.budget.dailyTokens`, 'must be at least 10000')
    if (member.budget.turnInputTokens > 1_000_000) issue(`${path}.budget.turnInputTokens`, 'must be at most 1000000')
    if (member.budget.turnOutputTokens > 128_000) issue(`${path}.budget.turnOutputTokens`, 'must be at most 128000')
    if (member.budget.dailyTokens > 50_000_000) issue(`${path}.budget.dailyTokens`, 'must be at most 50000000')
    if (member.model !== undefined && (member.model.provider.trim() === '' || member.model.model.trim() === '')) {
      issue(`${path}.model`, 'provider and model must be non-empty when set')
    }
    if (member.fallbackModel !== undefined && (member.fallbackModel.provider.trim() === '' || member.fallbackModel.model.trim() === '')) {
      issue(`${path}.fallbackModel`, 'provider and model must be non-empty when set')
    }
  }
  if (members.length > 0 && !members.some(member => member.role === 'coordinator') && spec.routing.humanDefault === 'coordinator') {
    issue('members', 'a room routing unmentioned messages to the coordinator needs a coordinator member')
  }
  const known = new Set(members.map(member => member.id))
  if (spec.routing.coordinator !== undefined && !known.has(spec.routing.coordinator)) issue('routing.coordinator', 'names an unknown member')
  if (spec.routing.humanDefault === 'coordinator' && spec.routing.coordinator === undefined) {
    issue('routing.coordinator', 'is required when unmentioned messages route to the coordinator')
  }
  if (!['coordinator', 'mentioned', 'all-eligible'].includes(spec.routing.humanDefault)) issue('routing.humanDefault', 'is not a known routing rule')
  const maxFanout = Math.max(1, members.length - 1)
  if (!Number.isInteger(spec.routing.maxFanout) || spec.routing.maxFanout < 1 || spec.routing.maxFanout > maxFanout) {
    issue('routing.maxFanout', `must be between 1 and ${maxFanout}`)
  }
  if (!Number.isInteger(spec.routing.floor) || spec.routing.floor < 1 || spec.routing.floor > Math.max(1, members.length)) {
    issue('routing.floor', 'must be between 1 and the member count')
  }

  const guard = spec.guard
  if (!Number.isInteger(guard.maxDepth) || guard.maxDepth < 1 || guard.maxDepth > 8) issue('guard.maxDepth', 'must be between 1 and 8')
  if (!Number.isInteger(guard.episodeTurns) || guard.episodeTurns < 1 || guard.episodeTurns > 200) issue('guard.episodeTurns', 'must be between 1 and 200')
  if (!Number.isInteger(guard.episodeMessages) || guard.episodeMessages < 1 || guard.episodeMessages > 500) issue('guard.episodeMessages', 'must be between 1 and 500')
  if (!Number.isFinite(guard.episodeTokens) || guard.episodeTokens < 10_000) issue('guard.episodeTokens', 'must be at least 10000')
  if (!Number.isFinite(guard.wallClockMs) || guard.wallClockMs < 1000) issue('guard.wallClockMs', 'must be at least 1000')
  if (!Number.isFinite(guard.memberTurnTimeoutMs) || guard.memberTurnTimeoutMs < 1000) issue('guard.memberTurnTimeoutMs', 'must be at least 1000')
  if (!Number.isFinite(guard.memberTurnsPerMinute) || guard.memberTurnsPerMinute <= 0) issue('guard.memberTurnsPerMinute', 'must be positive')
  if (!Number.isInteger(guard.memberBurst) || guard.memberBurst < 0) issue('guard.memberBurst', 'must be a non-negative integer')
  if (!Number.isInteger(guard.maxPendingPerMember) || guard.maxPendingPerMember < 0) issue('guard.maxPendingPerMember', 'must be a non-negative integer')
  if (!Number.isInteger(guard.maxDuplicates) || guard.maxDuplicates < 0 || guard.maxDuplicates > 10) issue('guard.maxDuplicates', 'must be between 0 and 10')
  if (!Number.isInteger(guard.pingPongLimit) || guard.pingPongLimit < 1 || guard.pingPongLimit > 20) issue('guard.pingPongLimit', 'must be between 1 and 20')
  if (!Number.isInteger(guard.noProgressWindow) || guard.noProgressWindow < 2 || guard.noProgressWindow > 10) issue('guard.noProgressWindow', 'must be between 2 and 10')
  if (guard.noProgressSimilarity < 0.5 || guard.noProgressSimilarity > 1) issue('guard.noProgressSimilarity', 'must be between 0.5 and 1')

  if (!Number.isFinite(spec.budget.dailyTokens) || spec.budget.dailyTokens < 10_000) issue('budget.dailyTokens', 'must be at least 10000')
  if (spec.budget.softLimitRatio <= 0 || spec.budget.softLimitRatio >= 1) issue('budget.softLimitRatio', 'must be between 0 and 1 exclusive')

  if (!Number.isInteger(spec.context.window) || spec.context.window < 1 || spec.context.window > 200) issue('context.window', 'must be between 1 and 200')
  if (!Number.isInteger(spec.context.messageChars) || spec.context.messageChars < 100 || spec.context.messageChars > 20_000) issue('context.messageChars', 'must be between 100 and 20000')
  if (!Number.isInteger(spec.context.summaryChars) || spec.context.summaryChars < 200 || spec.context.summaryChars > 20_000) issue('context.summaryChars', 'must be between 200 and 20000')
  if (!Number.isInteger(spec.context.triggerChars) || spec.context.triggerChars < 200 || spec.context.triggerChars > 50_000) issue('context.triggerChars', 'must be between 200 and 50000')
  return issues
}

/**
 * Validate a specification and throw with every issue when it is not publishable.
 * @param spec - specification to check.
 * @throws RoomSpecValidationError when any field is invalid.
 */
export function requireRoomSpec(spec: RoomSpec): void {
  const issues = validateRoomSpec(spec)
  if (issues.length > 0) throw new RoomSpecValidationError(issues)
}

/**
 * Find one member by id.
 * @param spec - room specification.
 * @param id - member id.
 * @returns the member, or undefined when the room holds none.
 */
export function roomMember(spec: RoomSpec, id: RoomMemberId): RoomMemberSpec | undefined {
  return spec.members.find(member => member.id === id)
}
