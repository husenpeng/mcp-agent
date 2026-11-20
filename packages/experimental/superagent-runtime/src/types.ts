/** JSON-safe ticket read models and Remote request types shared by the Host Remote and browser panel. */

/** One ticket as a watcher reads it, with the state that matters on one line. */
export interface TicketSummary {
  /** Ticket identity, as commands and reports name it. */
  readonly id: string
  /** What the work is. */
  readonly subject: string
  /** Where the ticket stands: `working`, `person`, `idle`, or `ended`. */
  readonly stage: 'working' | 'person' | 'idle' | 'ended'
  /** What the ticket waits on at a person, when it waits on one. */
  readonly needs?: 'delivery' | 'answer' | 'review' | 'blocked' | 'failed' | undefined
  /** State the last run reported. */
  readonly state?: 'progress' | 'waiting' | 'ready' | 'blocked' | 'failed' | 'dropped' | undefined
  /** Blocking findings the review left, zero when it cleared the work. */
  readonly blocking: number
  /** How many reviews the work had. */
  readonly rounds: number
  /** Whether an assignment is in flight and can be cancelled. */
  readonly running: boolean
  /** Whether a person stopped the ticket for good. */
  readonly stopped: boolean
}

/** One assignment as the detail view reads it. */
export interface AssignmentView {
  /** Assignment identity within the ticket. */
  readonly id: string
  /** Executor session the work ran in. */
  readonly session: string
  /** Directory the executor worked in. */
  readonly directory: string
  /** Whether the run ended. */
  readonly ended: boolean
  /** What the run reported, once it made one. */
  readonly report?: {
    readonly state: 'progress' | 'waiting' | 'ready' | 'blocked' | 'failed' | 'dropped'
    readonly summary?: string | undefined
    readonly question?: string | undefined
  } | undefined
}

/** One review finding as the detail view reads it. */
export interface FindingView {
  readonly summary: string
  readonly severity: 'p0' | 'p1' | 'p2'
  readonly file: string
  readonly line?: number | undefined
}

/** One trigger as the detail view reads it: who said what, when, on which source. */
export interface TriggerView {
  readonly at: string
  readonly source: string
  readonly actor: string
  readonly text: string
}

/** Everything one ticket holds, for a person reading the whole flow. */
export interface TicketDetail {
  /** The one-line state the list shows. */
  readonly summary: TicketSummary
  /** Why the work may be done and how far it may go. */
  readonly mandate: {
    readonly scope: 'investigate' | 'change' | 'release'
    readonly strength: 'explicit' | 'proposed'
    readonly policyVersion: string
    readonly sender: string
    readonly at: string
  }
  /** Every run the ticket had, oldest first. */
  readonly assignments: readonly AssignmentView[]
  /** The latest review, absent until a reviewer read a ready result. */
  readonly review?: { readonly rounds: number; readonly findings: readonly FindingView[] } | undefined
  /** Messages on the threads the ticket follows, oldest first. */
  readonly triggers: readonly TriggerView[]
  /** Whether the work reached its end. */
  readonly ended: boolean
}

/** What one app submission became. */
export type SubmitResult =
  | { readonly kind: 'accepted'; readonly tickets: readonly TicketSummary[] }
  | { readonly kind: 'declined'; readonly reason: string }
  | { readonly kind: 'refused'; readonly reason: string }

/** One app submission a person typed into the GUI. */
export interface SubmitRequest {
  /** The request text; blank text is refused. */
  readonly text: string
}

/** One ticket a Remote operation names. */
export interface TicketTargetRequest {
  readonly ticket: string
}

/** One message a person sends to a ticket's conversation. */
export interface TicketMessageRequest {
  readonly ticket: string
  /** The context or answer text; blank text is refused. */
  readonly text: string
}

/** One live frame of the team's ticket list. */
export interface TicketsFrame {
  readonly tickets: readonly TicketSummary[]
}

declare module '@tomato/typert-protocol' {
  interface RemoteErrorDetailsMap {
    /** The named ticket does not exist in the team's store. */
    'superagent/not-found': { readonly id: string }
    /** The ticket has no in-flight run to cancel. */
    'superagent/not-running': { readonly id: string }
    /** The ticket is stopped or ended and takes no further messages. */
    'superagent/closed': { readonly id: string }
    /** The submitted text was blank. */
    'superagent/empty-text': {}
  }
}
