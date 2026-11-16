---
description: "In-process superagent executor — one ticket, one child Agent, one report line."
kind: "package-reference"
---

# @tomato/superagent-local

English | [中文](README.zh.md)

## Summary

Run one superagent ticket in one child Agent of this Host, and review its result the same way. `createInProcessWorker` gives the engine a `Worker`: a lease creates a Session in the directory the caller named, the run hands it the ticket's brief, waits for its turn to end, reads the report line that turn wrote, and disposes the Agent whatever happened. `createInProcessReviewer` gives it a `Reviewer`: one child Agent reads the ready result and writes its verdict lines. `createInProcessSupervisor` gives it a `Supervisor`: one child Agent reads a request and decides what work it becomes. It also carries the durable store: `createStorageStore(ctx)` opens the `tomato_superagent` domain and gives the engine a `SuperagentStore` whose triggers and tickets survive a restart. The package owns no scheduling; the engine still records every assignment and decides what the report or verdict means.

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)

-----

<a id="use-this-package"></a>
## Use this package

```ts
const store = await createStorageStore(ctx)
const worker = createInProcessWorker(ctx, { directory, model: { provider, model } })
const ticket = await runAssignment(store, ticketId, worker)
await store.flush()
```

`InMemoryStore` from `@tomato/superagent` remains the cheap store for tests.

The worker needs a mounted `ctx.agents` factory and `ctx.sessions`. The model route is required: the caller names it instead of inheriting a deployment default, so a run that nobody configured cannot start.

A reviewer's turn writes one `FINDING: <severity> <path>:<line> <summary>` line per problem and ends with `REVIEW: pass` or `REVIEW: fail`.

A worker's turn ends by writing one `REPORT: <state> - <summary>` line. The engine's `parseReport` reads it, and a turn with no marker counts as `waiting`, which releases the ticket's slot for the next message.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

`lease()` creates one Agent per run with a Session id derived from the ticket, subscribes to that Session's events, and returns `{ session, directory, run }`. `run()` writes the brief with `workerBriefText`, waits for `whenIdle()`, flushes the Session, and returns `reportOf(turn)`. The reviewer shares that turn runner and hands the text to `parseReview` instead, so both ports read one finished turn the same way. Disposal runs in a `finally` and is idempotent, so a lease spent once cannot dispose its Agent twice.

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
- **No cancellation** — a run drives until its turn ends; stopping an in-flight ticket is not wired.