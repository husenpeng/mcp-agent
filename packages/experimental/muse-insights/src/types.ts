/**
 * Browser-safe contract of the Muse insights capability: one daily work recap
 * and the current unfinished-task analysis, as the Client renders them.
 *
 * The Host owns generation and retention. The Client receives complete
 * detached values through `ctx.remote.museInsights.snapshot()` and polls for
 * later generations; this module imports no Host module and carries no codec.
 * @module @tomato/experimental-muse-insights/types
 */

/** How one work item ended the day; `unknown` marks a deterministic item whose outcome was not stated. */
export type RecapWorkStatus = 'done' | 'ongoing' | 'blocked' | 'unknown'

/** One problem the day's conversations addressed, with its outcome and its solution. */
export interface RecapWorkItem {
  /** The concrete problem or goal the Sessions worked on, stated in one line. */
  readonly problem: string
  /** The outcome or answer the work reached; empty when the source stated none. */
  readonly conclusion: string
  /** How the work was done: the approach, changes, and what was verified; empty without detail. */
  readonly solution: string
  /** Whether the work finished, continued, or stopped on a blocker. */
  readonly status: RecapWorkStatus
  /** Sessions that contributed to this item; empty for a recap stored before items named Sessions. */
  readonly sessionIds: readonly string[]
}

/** One Session that contributed to a daily recap. */
export interface RecapSessionHighlight {
  /** Session identity, so the Client can open the original conversation. */
  readonly sessionId: string
  /** The Session's latest title, or its first human message when no title was written. */
  readonly title: string
  /** One short excerpt of the Session's last visible assistant text. */
  readonly summary: string
  /** Number of human and assistant text messages the recap read from this Session today. */
  readonly messageCount: number
}

/**
 * One day's work summary. `source` states whether a model organized it or the
 * Host built it deterministically; `headline` and `summary` are empty in the
 * latter case so the Client can present its own localized framing.
 */
export interface DailyRecap {
  /** Local calendar day key `YYYY-MM-DD` on the Host. */
  readonly day: string
  /** Unix epoch milliseconds when this revision was produced. */
  readonly generatedAt: number
  /** Whether a model wrote the narrative fields. */
  readonly source: 'model' | 'local'
  /** One-line title of the day, empty for a deterministic recap. */
  readonly headline: string
  /** Short narrative of the day, empty for a deterministic recap. */
  readonly summary: string
  /** Work items ordered by the model's grouping, or one per contributing Session. */
  readonly workItems: readonly RecapWorkItem[]
  /** Concrete unfinished tasks the day left open; empty when none were stated. */
  readonly openTasks: readonly string[]
  /** Contributing Sessions, most recently active first. */
  readonly sessions: readonly RecapSessionHighlight[]
  /** Total human and assistant text messages represented in the input. */
  readonly messageCount: number
}

/** Lifecycle of one unfinished task. */
export type UnfinishedTaskStatus = 'pending' | 'in_progress'

/** Where an unfinished task was read from. */
export type UnfinishedTaskSource = 'todo' | 'recap'

/** One unfinished task or todo item that crossed the Host's lookback window. */
export interface UnfinishedTask {
  /** Stable digest of source, Session identity, and normalized text. */
  readonly id: string
  /** The task text as stored. */
  readonly title: string
  /** Optional further context, such as the last assistant excerpt that named it. */
  readonly detail: string
  /** Model-owned lifecycle state when read from a todo list, or `pending` from a recap. */
  readonly status: UnfinishedTaskStatus
  /** Whether a Session todo list or a daily recap named the task. */
  readonly source: UnfinishedTaskSource
  /** Original Session, present for a todo item. */
  readonly sessionId: string | null
  /** Original Session's title, present for a todo item. */
  readonly sessionTitle: string | null
}

/** Latest periodic unfinished-task analysis. */
export interface UnfinishedAnalysis {
  /** Unix epoch milliseconds of the latest completed analysis; 0 before the first one. */
  readonly analyzedAt: number
  /** Unfinished tasks after deduplication and ordering. */
  readonly tasks: readonly UnfinishedTask[]
}

/** Complete Client-facing state of the Muse insights capability. */
export interface MuseInsightsSnapshot {
  /** Whether a signed-in owner exists; a signed-out Host exposes no recaps or tasks. */
  readonly available: boolean
  /** Host-local calendar day of the snapshot, `YYYY-MM-DD`. */
  readonly day: string
  /** The most recent retained recap, or null before the first successful generation. */
  readonly recap: DailyRecap | null
  /** Latest periodic unfinished-task analysis; empty before the first run. */
  readonly unfinished: UnfinishedAnalysis
  /** Whether a recap or task analysis is running now. */
  readonly analyzing: boolean
}
