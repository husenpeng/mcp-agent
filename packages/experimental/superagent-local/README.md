---
description: "In-process superagent executor — one ticket, one child Agent, one report line."
kind: "package-reference"
---

# @tomato/superagent-local

English | [中文](README.zh.md)

## Summary

Run one superagent ticket in one child Agent and review its result the same way. Workers execute a brief and return its report; reviewers assess ready results; supervisors decide what a request becomes. `createStorageStore(ctx)` opens the durable `tomato_superagent` domain, so triggers and tickets survive restart. The engine owns scheduling and assignment semantics; this package owns in-process turns and storage.

## Table of Contents

- [Use this package](#use-this-package)
- [Dev Note](#dev-note)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)

-----

<a id="use-this-package"></a>
## Use this package

```ts
import { createInProcessWorker, createStorageStore } from '@tomato/superagent-local'
import type { TicketId } from '@tomato/superagent'

declare const ctx: Parameters<typeof createStorageStore>[0]
declare const directory: string
declare const model: { readonly provider: string; readonly model: string }
declare const provider: string
declare const ticketId: TicketId
declare function runAssignment(
  store: Awaited<ReturnType<typeof createStorageStore>>, ticket: TicketId, worker: ReturnType<typeof createInProcessWorker>,
): Promise<unknown>

const store = await createStorageStore(ctx)
const worker = createInProcessWorker(ctx, { directoryOf: async () => directory, model: { provider, model: model.model } })
const ticket = await runAssignment(store, ticketId, worker)
await store.flush()
```

`InMemoryStore` from `@tomato/superagent` remains the cheap store for tests.

The worker needs a mounted `ctx.agents` factory and `ctx.sessions`. The model route is required: the caller names it instead of inheriting a deployment default, so a run that nobody configured cannot start.

A reviewer's turn writes one `FINDING: <severity> <path>:<line> <summary>` line per problem and ends with `REVIEW: pass` or `REVIEW: fail`.

A worker's turn ends by writing one `REPORT: <state> - <summary>` line. The engine's `parseReport` reads it, and a turn with no marker counts as `waiting`, which releases the ticket's slot for the next message.

A lease's `cancel()` stops the run as the person's own cancellation: it aborts the active turn, which reports `dropped`, and a run cancelled before its turn started resolves `dropped` without driving one. The ticket keeps its slot released, so the next message starts a fresh run.

-----

<a id="dev-note"></a>
## Dev Note

<details>
<summary>Implementation internals — click to expand</summary>

`lease()` creates one Agent per run with a Session id derived from the ticket, subscribes to that Session's events, and returns `{ session, directory, run, cancel }`. `run()` writes the brief with `workerBriefText`, waits for `whenIdle()`, flushes the Session, and returns `reportOf(turn)`. `cancel()` records the cancellation and calls the Agent's own `cancel({ kind: 'user' })`; the aborted turn ends with reason `aborted`, which `reportOf` reads as `dropped`. The reviewer shares that turn runner and hands the text to `parseReview` instead, so both ports read one finished turn the same way. Disposal runs in a `finally` and is idempotent, so a lease spent once cannot dispose its Agent twice. An optional lifecycle `signal` refuses Agent creation after cancellation and disposes a handle created during cancellation; it does not abort an admitted turn.

`createStorageStore` keeps a writable mirror in memory so the engine's synchronous reads stay synchronous, queues every write in order, and logs a write the medium refuses instead of failing the caller. `flush()` resolves once the queued writes are durable; a restart is a new Host over the same medium, which reopens the domain and finds every trigger and ticket.

`reportOf` reads the turn's ending: `completed` defers to the report line, `aborted` becomes `dropped`, an error carries its code and message, and a turn with no ending at all is a failure. Text from any other Session is filtered out, so a run never reads someone else's turn.

</details>

-----

## Model Experience

Indirectly, through the one brief each run sends as its only user message.

#### KV Cache effect

Each run is a fresh Session with no earlier turns, so a worker sent the same brief in two tickets makes two separate first requests rather than reusing one conversation.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **One directory per Host** — every run of a Host works in the directory the options name; per-ticket worktrees belong to the caller's prepare step.
- **Worker runs cancel; supervisor and reviewer turns do not** — only the worker lease carries `cancel()`; a supervision or review turn runs to its end.