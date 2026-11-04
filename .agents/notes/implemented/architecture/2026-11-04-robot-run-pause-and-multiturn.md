# Agent Note: Robot run pause, correction, and the working directory

Status: implemented

English | [中文](2026-11-04-robot-run-pause-and-multiturn.zh.md)

## Problem

A robot run ended when its single turn ended. A person who saw the robot take the wrong approach could only cancel the run, which settled it as `cancelled` and disposed the Agent that held the context: the corrected retry started from an empty Session. The Host also had no way to pause a run, so an interrupt either ended it or did nothing.

The working directory had a second defect. `@tomato/experimental-robot-runtime` wrote `meta.cwd` only when the specification named a Workspace root; marketing templates and the default specification name none. The Session history Remote treated a header without `cwd` as a missing Session, so those runs reported `session/not-found` and their transcript could not be opened at all, live or cold.

Humans also could not see executor progress: no provider operation wrote a non-terminal state, so a run reported `queued` for its whole execution.

## Decision

**Run working directory.** The runtime resolves one directory per run: the specification's first Workspace root, else the deployment's first registered Workspace, else the Host process directory. The Agent always records it, so a run's history and outputs stay inspectable. Creation prefills the specification instead of leaving the choice to the runtime: `robot_create` inherits the calling Session's `cwd`, `robot.hire` accepts an optional `workspaceRoot` for a template that pins none, and the specification editor fills an empty `workspaceRoots` list from the Workspace the page is viewing.

**Session reachability.** Session history no longer treats a header without `cwd` as `session/not-found`; whether the log exists decides reachability. The attachment Remote keeps its narrower `prepared`-and-no-`cwd` check.

**Executor progress.** `ctx.robots.advance(run, state)` records `running`, `waiting`, or `finalizing`; a terminal run keeps its state. `waiting` means the run is paused for human input and the executor keeps its Agent alive. `robot-local` implements it as a state write that ignores terminal rows.

**Multi-turn runs.** The executor keeps the run's Agent alive while the run is non-terminal and settles it only when a turn ends naturally without a pause (`finish` with the last turn's outcome) or when the run is cancelled. An abort that follows `waiting` leaves the run and the Agent in place, and the next correction continues the same Session. A pause is bounded by the runtime's `pauseTimeoutMs` (default 30 minutes): an expired wait settles the run as `cancelled` with an error naming the expired wait.

**Host-side control.** `robot.interrupt` records `waiting` *before* aborting the active turn, so the executor reads the pause rather than treating the abort as a settled turn; it keeps the inbox. `robot.correct` delivers the message into the run's own live Agent — `queue` while waiting, `steer` while running — and records `running`. A run without a live Agent is refused with `robot/conflict` rather than cold-resuming a detached Session, because no executor would settle that turn.

## Alternatives considered

**End the run on interrupt and start a corrected run.** Rejected: the correction would start from an empty Session. A run owns exactly one Session, so a second run cannot continue the first run's log, and the context the person is trying to correct is exactly what a new Session loses.

**Only steering, no pause.** Rejected: `agent.steer` is delivered at the next step boundary, so it cannot stop a long-running tool call. A person who wants the robot to stop what it is doing needs the turn aborted, and the Host already had `agent.cancel` with the inbox kept.

**Keep the pause in client state only.** Rejected: a refresh or a second client would show the run still executing, and the executor would settle it as a normal completion. The pause is a durable fact about the run, so it belongs to the run record.

**Write pause state through the controller.** Rejected: the executor is the only owner of an Agent's turns. The controller records the pause but cannot report the run's state after a turn on its own.

**Resume by sharing one Session across two runs.** Rejected: the robot architecture keeps one Session per run so every run stays reconstructible from one log; a shared log would mix two runs' inputs, outputs, and outcomes.

## Consequences

- A run now spans turns until it settles. The documented "one turn per run" limitation in the robot runtime and UI READMEs is gone; the run trace is still one Session, one run.
- A paused run holds the robot's only execution slot and its Agent. The bounded wait keeps a forgotten pause from blocking a robot forever, and an expired pause ends `cancelled` with an explanatory `error`.
- `robot.interrupt` and `robot.correct` exist on the Remote namespace; a deployment without a live Agent refuses both instead of pretending to deliver.
- Correcting a waiting run queues one turn; correcting a running run steers the current one, so the caller sees different placement for the same action.
- The robot page presents each run as a task: a two-pane run list and detail, a business-language progress list folded from the run Session's Chat nodes, and `interrupt`, `correct`, and `stop` controls. The detail reads the registered Chat target through `ctx.uiConversation.binding(sessionId).target('chat')`, so `@tomato/client-ui-chat` must be mounted, and its technical switch persists in browser storage rather than in profile Settings.

## Testing

- `packages/experimental/robot-runtime/tests/runtime.spec.ts` covers the fallback order, a pause that keeps the Agent until a correction continues it, and an expired pause that settles the run.
- `packages/experimental/robot-local/tests/local.spec.ts` covers executor progress and a terminal run keeping its state.
- `packages/api/robot-controller/tests/interrupt-correct.host.spec.ts` covers pause ordering, correction placement, and the refusals.
- `packages/api/session-controller/tests/session-cold.host.spec.ts` covers a stored Session without `cwd`.
- `packages/experimental/tool-robot/tests/robot-tool.spec.ts` covers the inherited creation directory; `packages/api/robot-controller/tests/controller.host.spec.ts` covers the rootless hire.
- `packages/client/ui-robot/tests/run-detail.client.spec.tsx` covers the detail states, controls, and step folding; `packages/client/ui-robot/tests/page.client.spec.tsx` covers the run list and the hire directory.