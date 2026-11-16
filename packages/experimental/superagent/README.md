---
description: "Superagent work vocabulary — triggers, threads, mandates, tickets, and the stage each ticket waits in."
kind: "package-reference"
---

# @tomato/superagent

English | [中文](README.zh.md)

## Summary

Name the work a person asks for, decide whether it may start, and drive it to a reviewable result. A source turns an external event into a `Trigger`; the triggers a source groups into one conversation form a `Thread`; admission judges the actor and the address; an acceptance records a `Mandate` saying why the work may be done and how far it may go; a `Ticket` holds that work and derives its own stage from the latest `AssignmentReport`. The package also carries the gates that keep unready work away from a person: the internal review gate and the merge gate. It adds no model request, transport of its own, or durable storage contract beyond the four store operations.

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)

-----

<a id="use-this-package"></a>
## Use this package

Read the vocabulary when writing a source, an executor, or the engine that stores tickets. Nothing mounts: the package exports types plus the stage predicates that any caller can use without a service.

```ts
import { InMemoryStore, accept, assign, intake, report, ticketStage } from '@tomato/superagent'

const store = new InMemoryStore()
intake(store, trigger)
const ticket = accept(store, { id, subject, mandate, thread })
const assignment = assign(store, ticket.id, { session: 'worker-1', directory: worktree })
report(store, ticket.id, assignment.id, { state: 'ready', summary: 'PR open' })
ticketStage(store.ticket(ticket.id)!.ticket).stage
```

`Trigger` carries what a source knows and nothing it does not: the actor in that source's namespace, whether a person wrote it, how it addressed the agent, the threads it belongs to, the address a reply belongs to, and source-native `meta` the engine never reads.

The engine advances state through `SuperagentStore`: `intake` stores a trigger once and hands it to the tickets subscribed to its threads, `accept` creates a ticket and subscribes it to the thread it came from, `assign` binds one executor run, `report` records what that run says, and `stop` or `end` settle it. `InMemoryStore` is the reference implementation; a durable provider reproduces the same four operations.

A worker reports in text: it ends its turn with one `REPORT: <state>` line, and `parseReport` turns that line into the assignment report. A turn that ends with no marker counts as `waiting` — it yields without claiming a result, releasing the ticket's slot so a later message can start the next run. Only a run that reports `progress` keeps the slot.

Before any ticket exists, an optional `Supervisor` judges the request: it ends its turn with one `DECISION: <investigate|change|release> <what the work is>` line per piece, or `DECISION: reject <why>` to decline. `runCycle` opens one ticket per planned piece and records a declined request with its reason; without a judge it opens the single ticket its text names.

A ticket's work runs through two ports: a `Worker` leases a run the engine records as an assignment, and a `Reviewer` reads the ready result before any person sees it. `runAssignment` leases, records, drives, and reports — a run that throws reports itself as failed instead of escaping, and a run that ends without a marker releases the slot as `waiting`. `runReview` records the verdict and returns what it decided, so a blocking `p0` finding sends the work back until the round budget is spent.

`pollFeishu` reads one page of inbound events from a `BotGateway` and feeds each through the engine; `runCycle` adds admission and acceptance, so one call reads the service and either starts a ticket, lets an open one continue, or records why a request was refused. `admit` is the deterministic gate: only a person's addressed message from an actor the policy names may start work, and every refusal carries its reason. `review` keeps a result away from a person while a `p0` finding remains, and hands it to the implementer until the round budget is spent. `mergeReadiness` names what still blocks a change: a draft, pending or failing checks, a conflict, or a blocking finding. A person's approval is always required to merge and is never a blocker of readiness. `mergeChange` turns that answer into one merge: it refuses while a blocker stands, refuses without a stated approval, and only then asks a `MergeExecutor` to merge and report the commit or the reason it did not happen.

`Ticket` holds its own state instead of following an executor session, so the same work survives a handoff, a resume, or several assignments. `Mandate` is immutable: a wider request needs a new ticket. A ticket also names its `supervisor`, the Session that accepted the work; `createTicketSessionAccess` turns that into the cross-Session read grant a deployment publishes, so a supervisor can read the Sessions its tickets ran in and nothing else.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

`ticketStage` reads only the ticket it is given. The rows it checks, in order: an ended ticket; a ready report; a structured question; a blocked or failed report that nobody has answered; an assignment that never started or already ended; anything else while an assignment runs. `waitsForPerson` answers the narrower question of whether the ticket currently waits on a person, and `canStart` answers whether a new assignment may take it now; a stopped ticket never starts again.

Ids are compile-time brands, so a `TicketId` cannot be passed where a `ThreadId` is expected. The package holds no runtime identity, storage, or I/O; [src](src) is the complete contract.

</details>

-----

<a id="model-experience"></a>
## Model Experience

None, as this vocabulary adds no prompt, tool, or context of its own.

#### KV Cache effect

Reading these types changes no model request; the engine, sources, and executor own every prompt section and tool schema.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **No concrete worker or reviewer** — `Worker` and `Reviewer` are ports; the in-process agent executor and the review session that implement them are not built yet.
- **No durable store** — `InMemoryStore` is the only implementation; a storage-backed provider is a separate package.
- **No durability rules** — replay, crash recovery, and how a stored trigger keeps its thread membership are decisions the provider will make, not this package.