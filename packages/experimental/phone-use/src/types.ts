/**
 * Identities and error codes shared by the phone-use Host packages.
 * @module @tomato/experimental-phone-use/src/types
 */

import type { Branded } from '@tomato/branded'

/**
 * Lossless JSON as this package owns it.
 *
 * Remote boundary types must be declared by the face that publishes them, so
 * this alias stands in for a validator library's recursive type.
 */
export type PhoneJson = null | boolean | number | string | PhoneJson[] | { [key: string]: PhoneJson }

// Remote boundary types live on this subpath so the Typert generator can name
// them without reaching into the package root.
export type {
  PhoneAction, PhoneAttachRequest, PhoneCommandResult, PhoneDeviceEvent, PhoneDeviceSummary,
  PhoneDownFrame, PhoneObservation,
} from './protocol.ts'

/** Stable identity of one phone, minted by the application on first pairing. */
export type PhoneDeviceId = Branded<'PhoneDeviceId'>

/** One attachment of a runner to this Host; renewed on every reconnect. */
export type PhoneAttachId = Branded<'PhoneAttachId'>

/** One command the Host sends to an attached runner. */
export type PhoneCommandId = Branded<'PhoneCommandId'>

/** A phone-use failure with a machine-readable code. */
export class PhoneUseError extends Error {
  /**
   * @param code - stable failure code.
   * @param message - actionable diagnostic.
   * @param details - optional structured context for the caller.
   */
  constructor(readonly code: PhoneUseErrorCode, message: string, readonly details?: Record<string, unknown>) {
    super(message)
    this.name = 'PhoneUseError'
  }
}

/** Failure codes this package raises in addition to the runner's own. */
export type PhoneUseErrorCode =
  | 'phone/no-device'
  | 'phone/ambiguous-device'
  | 'phone/disconnected'
  | 'phone/timeout'
  | 'phone/halted'
  | 'phone/rejected'
  | 'phone/refused'
