/**
 * Wire contract for the phone-use capability, mirroring
 * `apps/ios/TomatoRemote/Shared/PhoneProtocol.swift`.
 *
 * The runner and the iOS application compile the Swift half; this file validates
 * what crosses the Remote namespace. A version bump touches both halves and the
 * shared fixtures under `fixtures/protocol`.
 * @module @tomato/experimental-phone-use/src/protocol
 */

import { z } from 'zod'
import type { PhoneJson } from './types.ts'

/** Lossless JSON, validated recursively and typed by this package. */
export const PhoneJsonSchema: z.ZodType<PhoneJson> = z.lazy(() => z.union([
  z.null(),
  z.boolean(),
  z.number(),
  z.string(),
  z.array(PhoneJsonSchema),
  z.record(z.string(), PhoneJsonSchema),
]))

/** Protocol version the runner reports and this Host accepts. */
export const PHONE_PROTOCOL_VERSION = 1

/** Largest number of elements one observation may carry. */
export const MAX_OBSERVATION_ELEMENTS = 200

/** Longest command the Host leaves unanswered before it cancels and fails. */
export const DEFAULT_COMMAND_TIMEOUT_MS = 15_000

/** A point in UIKit points, origin at the screen's top-left. */
export const PhonePoint = z.object({ x: z.number(), y: z.number() }).strict()

/** Screen geometry in points and the backing scale factor. */
export const PhoneScreen = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
  scale: z.number().positive(),
}).strict()

/** The application in front, as far as the runner can prove. */
export const PhoneForeground = z.object({
  bundleId: z.string().min(1),
  name: z.string().optional(),
}).strict()

/** One actionable element of the current observation. */
export const PhoneElement = z.object({
  ref: z.string().min(1),
  role: z.string().min(1),
  label: z.string(),
  value: z.string().optional(),
  /** `[x, y, width, height]` in points. */
  frame: z.array(z.number()).length(4),
  enabled: z.boolean(),
}).strict()

/** One OCR result offered when the accessibility tree is thin. */
export const PhoneOCRItem = z.object({
  ref: z.string().min(1),
  text: z.string(),
  frame: z.array(z.number()).length(4),
}).strict()

/** A system alert covering the screen. */
export const PhoneAlert = z.object({
  title: z.string().optional(),
  buttons: z.array(z.string()),
}).strict()

/** One reading of the device screen. */
export const PhoneObservation = z.object({
  observationId: z.string().min(1),
  foreground: PhoneForeground.optional(),
  screen: PhoneScreen,
  elements: z.array(PhoneElement).max(MAX_OBSERVATION_ELEMENTS),
  ocr: z.array(PhoneOCRItem).optional(),
  truncated: z.boolean(),
  keyboardVisible: z.boolean(),
  alert: PhoneAlert.optional(),
}).strict()

/** Who currently holds the device. */
export const PhoneLeaseState = z.object({
  holder: z.string().min(1),
  since: z.string().min(1),
}).strict()

/** Runner readiness, answered without waiting for the engine. */
export const PhoneHealth = z.object({
  protocol: z.number().int().positive(),
  runnerVersion: z.string(),
  build: z.string(),
  screen: PhoneScreen,
  locked: z.boolean(),
  foreground: PhoneForeground.optional(),
  lease: PhoneLeaseState.optional(),
  hostLink: z.string(),
}).strict()

/** Result of `lease.acquire`. */
export const PhoneLeaseGrant = z.object({
  granted: z.boolean(),
  holder: z.string().min(1),
}).strict()

/** Actions the engine performs. */
export const PhoneActionKind = z.enum([
  'tap', 'longPress', 'swipe', 'type', 'press', 'launch', 'openUrl', 'wait',
])

/** One action; `type` selects which optional fields apply. */
export const PhoneAction = z.object({
  type: PhoneActionKind,
  ref: z.string().optional(),
  point: PhonePoint.optional(),
  from: PhonePoint.optional(),
  to: PhonePoint.optional(),
  direction: z.enum(['up', 'down', 'left', 'right']).optional(),
  durationMs: z.number().int().min(100).max(5000).optional(),
  count: z.union([z.literal(1), z.literal(2)]).optional(),
  text: z.string().max(4000).optional(),
  submit: z.boolean().optional(),
  clear: z.boolean().optional(),
  button: z.enum(['home', 'volumeUp', 'volumeDown']).optional(),
  bundleId: z.string().optional(),
  name: z.string().optional(),
  fresh: z.boolean().optional(),
  arguments: z.array(z.string()).optional(),
  url: z.string().optional(),
  ms: z.number().int().min(0).max(10_000).optional(),
  untilText: z.string().optional(),
  timeoutMs: z.number().int().min(0).max(60_000).optional(),
}).strict()

/** Parameters of `act`. */
export const PhoneActRequest = z.object({
  action: PhoneAction,
  observeAfter: z.boolean().optional(),
  confirmToken: z.string().optional(),
}).strict()

/** Result of one action, with a fresh observation unless suppressed. */
export const PhoneActResult = z.object({
  ok: z.boolean(),
  pageChanged: z.boolean(),
  foreground: PhoneForeground.optional(),
  hint: z.string().optional(),
  observation: PhoneObservation.optional(),
}).strict()

/** Parameters of `observe`. */
export const PhoneObserveRequest = z.object({
  maxElements: z.number().int().min(1).max(MAX_OBSERVATION_ELEMENTS).optional(),
  includeOcr: z.enum(['auto', 'always', 'never']).optional(),
}).strict()

/** Parameters of `screenshot`. */
export const PhoneScreenshotRequest = z.object({
  maxEdge: z.number().int().min(320).max(2048).optional(),
  quality: z.number().min(0.2).max(0.9).optional(),
}).strict()

/** Parameters of `lease.acquire`. */
export const PhoneLeaseRequest = z.object({
  holder: z.string().min(1),
  ttlMs: z.number().int().min(1000).max(3_600_000).optional(),
}).strict()

/** Parameters of `lease.release`. */
export const PhoneLeaseReleaseRequest = z.object({ holder: z.string().min(1) }).strict()

/** Parameters of `apps.resolve`. */
export const PhoneResolveRequest = z.object({ query: z.string().min(1) }).strict()

/** Opening frame a runner sends when it attaches to the Host. */
export const PhoneAttachRequest = z.object({
  deviceId: z.string().min(1),
  deviceName: z.string().min(1),
  protocol: z.number().int().positive(),
  runnerVersion: z.string(),
  screen: PhoneScreen,
  capabilities: z.array(z.string()),
}).strict()

/** One command the Host sends to an attached runner. */
export const PhoneCommandFrame = z.object({
  type: z.literal('command'),
  commandId: z.string().min(1),
  method: z.string().min(1),
  params: PhoneJsonSchema,
  deadlineMs: z.number().int().positive(),
}).strict()

/** One cancellation for a command the Host no longer waits for. */
export const PhoneCancelFrame = z.object({
  type: z.literal('cancel'),
  commandId: z.string().min(1),
}).strict()

/** Every frame the Host sends down an attach stream. */
export const PhoneDownFrame = z.discriminatedUnion('type', [
  z.object({ type: z.literal('ready'), attachId: z.string().min(1) }).strict(),
  PhoneCommandFrame,
  PhoneCancelFrame,
  z.object({ type: z.literal('ping') }).strict(),
])

/** Result one runner reports for a command, delivered as a unary call. */
export const PhoneCommandResult = z.object({
  attachId: z.string().min(1),
  commandId: z.string().min(1),
  ok: z.boolean(),
  value: PhoneJsonSchema.optional(),
  error: z.object({
    code: z.string().min(1),
    message: z.string(),
    retryable: z.boolean(),
    details: PhoneJsonSchema.optional(),
  }).strict().optional(),
}).strict()

/** Out-of-band device event. */
export const PhoneDeviceEvent = z.object({
  attachId: z.string().min(1),
  type: z.enum(['halted', 'locked', 'unlocked', 'leaseChanged']),
  detail: z.string().optional(),
}).strict()

/** One attached device, as the device list reports it. */
export const PhoneDeviceSummary = z.object({
  deviceId: z.string().min(1),
  deviceName: z.string().min(1),
  protocol: z.number().int().positive(),
  runnerVersion: z.string(),
  screen: PhoneScreen,
  capabilities: z.array(z.string()),
  attachedAt: z.string().min(1),
  halted: z.boolean(),
}).strict()

/** Machine-readable failure codes the runner may return. */
export const PHONE_ERROR_CODES = [
  'LOCKED', 'STALE_REF', 'NOT_FOUND', 'NEEDS_CONFIRMATION', 'BLOCKED_APP', 'LEASE_HELD',
  'TIMEOUT', 'HALTED', 'BAD_REQUEST', 'UNAUTHORIZED', 'PAIR_DENIED', 'INTERNAL',
] as const

/** One failure code. */
export type PhoneErrorCode = typeof PHONE_ERROR_CODES[number]

/** Types of every schema above, named for consumers. */
export type PhonePoint = z.infer<typeof PhonePoint>
export type PhoneScreen = z.infer<typeof PhoneScreen>
export type PhoneForeground = z.infer<typeof PhoneForeground>
export type PhoneElement = z.infer<typeof PhoneElement>
export type PhoneOCRItem = z.infer<typeof PhoneOCRItem>
export type PhoneAlert = z.infer<typeof PhoneAlert>
export type PhoneObservation = z.infer<typeof PhoneObservation>
export type PhoneLeaseState = z.infer<typeof PhoneLeaseState>
export type PhoneHealth = z.infer<typeof PhoneHealth>
export type PhoneLeaseGrant = z.infer<typeof PhoneLeaseGrant>
export type PhoneActionKind = z.infer<typeof PhoneActionKind>
export type PhoneAction = z.infer<typeof PhoneAction>
export type PhoneActRequest = z.infer<typeof PhoneActRequest>
export type PhoneActResult = z.infer<typeof PhoneActResult>
export type PhoneObserveRequest = z.infer<typeof PhoneObserveRequest>
export type PhoneScreenshotRequest = z.infer<typeof PhoneScreenshotRequest>
export type PhoneLeaseRequest = z.infer<typeof PhoneLeaseRequest>
export type PhoneLeaseReleaseRequest = z.infer<typeof PhoneLeaseReleaseRequest>
export type PhoneResolveRequest = z.infer<typeof PhoneResolveRequest>
export type PhoneAttachRequest = z.infer<typeof PhoneAttachRequest>
export type PhoneCommandFrame = z.infer<typeof PhoneCommandFrame>
export type PhoneCancelFrame = z.infer<typeof PhoneCancelFrame>
export type PhoneDownFrame = z.infer<typeof PhoneDownFrame>
export type PhoneCommandResult = z.infer<typeof PhoneCommandResult>
export type PhoneDeviceEvent = z.infer<typeof PhoneDeviceEvent>
export type PhoneDeviceSummary = z.infer<typeof PhoneDeviceSummary>
