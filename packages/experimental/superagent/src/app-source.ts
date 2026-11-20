/**
 * The app source: requests a person types into the deployment's own GUI rather
 * than a bot conversation. The trigger is direct and human by construction;
 * admission still judges it against the policy's `app` part.
 */
import type { ActorId, ThreadRef, Trigger, TriggerId } from './types.ts'

/** Source name of the deployment's own GUI surface. */
export const APP_SOURCE = 'app'

/**
 * The conversation one app submission belongs to. Each new request starts its
 * own thread; later messages on a ticket reuse the thread it follows.
 * @param id - conversation key the caller chose.
 * @returns the source-qualified thread.
 */
export function appThread(id: string): ThreadRef {
  return { source: APP_SOURCE, id }
}

/** What one app submission states. */
export interface AppTriggerRequest {
  /** Identity the caller assigns; a repeat of the same id is the same event. */
  readonly id: TriggerId
  /** Text the person typed. */
  readonly text: string
  /** Conversation the submission belongs to. */
  readonly thread: ThreadRef
  /** Actor the deployment admits app requests from. */
  readonly actor: ActorId
  /** When the submission arrived, as an ISO 8601 instant. */
  readonly at: string
}

/**
 * Normalize one app submission into the domain trigger. The person addressed
 * the agent directly by typing into its own surface, and no reply channel
 * exists: the GUI reads the work where it was submitted.
 * @param request - identity, text, thread, actor, and arrival time.
 * @returns the trigger to store.
 */
export function appTrigger(request: AppTriggerRequest): Trigger {
  return {
    id: request.id,
    source: APP_SOURCE,
    threads: [request.thread],
    actor: request.actor,
    human: true,
    addressed: 'direct',
    at: request.at,
    text: request.text,
    meta: {},
  }
}
