# Agent Note: The superagent team takes app requests and person control

Status: implemented

English | [中文](2026-11-19-superagent-app-source-person-control.zh.md)

## Problem

The superagent team read one source: Feishu events polled from a bot service. A desktop deployment without that service could not start work, the ticket panel was read-only, an in-flight run could not be stopped, and a follow-up message on a ticket's thread was recorded without continuing the work. The product goal is that the app can trigger and observe the whole flow, interrupt a run mid-flight, and continue it from the current node with manually entered context.

The [room work-cycle note](2026-11-17-room-superagent-work-cycle.md) owns the room's reuse of the engine; this note records the team runtime's own source and control surface, not a change to the room.

## Decision

The engine gains the pieces the app surface needs, and the runtime composes them:

- `appTrigger` normalizes a GUI submission as a direct human trigger on the `app` source with no reply channel. `decideTriggers` runs admission and acceptance over already-intaken triggers, so `runCycle` (Feishu) and `submit` (app) share one decision path; the policy always admits the configured `appUser` on `app`.
- `WorkerBrief.context` carries the person's accumulated messages; `workerBriefText` renders them as the latest instruction on the same subject. `WorkerLease.cancel()` aborts a run: the local worker calls the Agent's `cancel({ kind: 'user' })`, the aborted turn reports `dropped`, and a cancel that arrives before the turn resolves `dropped` without driving one. `runAssignment` takes `context` and an `onLease` hook so the runtime can reach the lease.
- `SuperagentStore.triggers()` reads every stored event; the room work store refuses it the way it refuses `trigger()`, because the room guard owns admission there.
- The runtime's `bot` configuration is optional. One work pump runs tickets one at a time in queue order; messages that arrive during a run accumulate as the next run's context, and a `continued` cycle verdict enqueues the reached ticket with the new message. `submit`, `message`, `cancel`, `stop`, and `detail` live on `SuperagentTeam` and the `superagentTickets` Remote; `watch` streams one frame per committed change through the `superagent/changed` event. `cancel` aborts only an open assignment and refuses with `superagent/not-running` otherwise; `stop` keeps the engine's permanent semantics.
- The ticket panel submits requests, follows `watch`, opens one ticket's flow (mandate, runs, review, messages), and offers cancel, stop, and a message box. The desktop development project writes an app-only patch when `TOMATO_SUPERAGENT_BOT_URL` is empty.

## Alternatives considered

**Poll the ticket list instead of streaming.** Polling is simpler but shows stale stages between reads and misses the point of watching a run. The Remote already supports stream methods, and the room controller's `watch` pattern proves the shape; the panel follows committed changes instead.

**Make cancel a permanent stop.** The engine's `stop` never resumes, which contradicts continuing from the current node. Cancel records a `dropped` report through the existing report path, so the ticket keeps its stage semantics and its slot frees for the next message; permanent stop stays a separate operation.

**Cancel supervision and review turns too.** Those turns are short, and reaching them needs a lease shape on the `Reviewer` and `Supervisor` ports. The worker lease carries the long phase; cancel refuses while no assignment is open, and the limitation is recorded rather than hidden.

**A second intake path for app requests.** A separate admission-and-acceptance loop for the GUI would drift from the Feishu path. Extracting `decideTriggers` keeps one decision path with two sources.

## Consequences

- A Feishu follow-up on an open ticket's thread now runs the ticket again with the message as context; deployments that relied on record-only follow-ups must stop the ticket to prevent continuation.
- One Host runs one assignment at a time; a submitted request waits for the queue, and the panel shows it as queued work.
- Continuation context travels in a fresh Session's brief, not in a reused conversation, so each run keeps the engine's KV-cache isolation.
- The supervising session's ticket record is written when the pump drains and after each person operation, not only at cycle end.

## Verification

`packages/experimental/superagent/tests/app-source.spec.ts` covers the app trigger, shared decisions, continuation context, and the lease hook; `packages/experimental/superagent-local/tests/worker.spec.ts` covers pre-run and mid-turn cancellation; `packages/experimental/superagent-runtime/tests/app.spec.ts` covers app-only mount, submit, message continuation, cancel-and-resume, accumulated context, stop, detail, the Remote operations, the watch stream, and Feishu continuation; `packages/experimental/client-ui-superagent/tests` covers the controller's stream and actions and the panel's composer, flow view, and controls; `apps/desktop/tests/development-project.spec.ts` covers the app-only patch.