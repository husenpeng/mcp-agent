---
description: "In-process superagent team — take bot or app requests, plan, run, review, and let a person step in mid-run."
kind: "package-reference"
---

# @tomato/superagent-runtime

English | [中文](README.zh.md)

## Summary

Run a whole team in one Host: read the bot service on a schedule or take requests the app submits, decide what each request becomes, run every accepted ticket's work, and review it. The package composes the engine, the in-process providers, and the durable store; it owns only their order and each step's failure containment. Refused requests are recorded, and a ready result reaches a person only after the internal review clears it. A person watching the app can cancel an in-flight run, send the ticket new context, and watch the next run continue from it.

## Table of Contents

- [Use this package](#use-this-package)
- [Dev Note](#dev-note)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)

-----

<a id="use-this-package"></a>
## Use this package

```yml
- id: team
  plugin: '@tomato/superagent-runtime'
  config:
    directory: .
    provider: deepseek
    model: deepseek-chat
    allowedSenders: [ou_owner]
    bot: { baseUrl: http://127.0.0.1:8013, userId: tomato-supervisor }
    pollSeconds: 15
    botOpenId: ou_bot
    replies: true
```

Omit `bot` to run app-only: requests then arrive through the ticket panel's composer instead of a bot service, and `pollSeconds: 0` keeps the team idle until something is submitted.

```yml
- id: team
  plugin: '@tomato/superagent-runtime'
  config:
    directory: .
    provider: deepseek
    model: deepseek-chat
    pollSeconds: 0
```

The Host must already carry `ctx.agents`, `ctx.sessions`, `ctx.storageDomain`, and an LLM service that resolves the configured model route. An unavailable route rejects the mount before polling starts. A deployment that publishes `ctx.botGateway` uses its own client; otherwise the runtime reads the configured bot service over HTTP, and without a `bot` configuration it reads none. The policy always admits the configured `appUser` on the `app` source.

With `replies: true` the team answers where the request arrived: one message naming what it opened and the state the work reached, or why the request was not taken. A service that refuses the reply is logged, never thrown. App submissions have no reply channel; the panel reads the work where it was submitted.

`ctx.superagent.runOnce()` runs one cycle by hand — the shape every test and the CLI use — and `ctx.superagent.tickets()` lists everything stored in the open domain. The person's operations are on the same service: `submit(text)` admits one app request and queues its work, `message(ticket, text)` joins the ticket's thread and continues it with that context, `cancel(ticket)` aborts the in-flight run and leaves the ticket open, `stop(ticket)` ends it for good, and `detail(ticket)` reads the mandate, every run and report, the latest review, and the thread messages.

Browser clients call `ctx.remote.superagentTickets`: `list` and the same five operations, plus `watch`, a stream that yields one `TicketsFrame` immediately and one after every committed change. The Remote opens the durable store on its first read.

-----

<a id="dev-note"></a>
## Dev Note

<details>
<summary>Implementation internals — click to expand</summary>

`apply` publishes the ticket Remote before the team and the domain: a browser read during mount opens the store, operations that need the team wait for the mount, `tickets()` reads only an already-open store, and a failed open can be retried. Disposal stops new reads and cycles, waits for admitted operations, then closes the store and supervising Agent. The supervising Agent is created on first use with the session id every ticket names, and disposal disposes it.

One work pump runs tickets one at a time in queue order. A cycle polls the bot service (when one is configured), runs intake with the supervisor as its judge, and enqueues each accepted ticket; a `continued` verdict enqueues the reached ticket with the new message as its context. `submit` shares the same intake decision path through the engine's `decideTriggers`. Messages that arrive during a run accumulate as the next run's context, and the run that settles re-enqueues its own ticket when context is pending. Each run goes through `runAssignment` and — when the report says ready — `runReview`; one ticket's failure is logged and the rest of the queue still runs. Below `pollSeconds`, a timer runs a cycle; a tick that arrives while one is still working is skipped, a failing cycle is logged and does not stop the schedule, and disposing the plugin clears the timer.

`cancel` reaches the in-flight lease through the `onLease` hook `runAssignment` exposes; a cancel requested before the lease exists aborts it the moment it appears. The aborted turn reports `dropped`, which frees the ticket's slot without stopping it. Every committed change emits `superagent/changed`, and the pump records the ticket list on the supervising session when it drains, as do `submit`, `message`, and `stop`.

Every ticket records `superagent-supervisor` as its supervisor, so a person reading a report can also read the Sessions the work ran in through `createTicketSessionAccess`.

</details>

-----

## Model Experience

Indirectly, through the three turns one accepted ticket costs: the supervision turn, the work turn, and the review turn. A continuation run adds one work turn (and a review when it reports ready); its brief carries the person's accumulated messages as the latest instruction on the same subject.

#### KV Cache effect

Each of the three turns is its own Session with no earlier context, so a request that opens two tickets makes two independent supervision-to-review chains rather than reusing one conversation. A continuation run is a fresh Session too: the context travels in its brief, not in a reused conversation.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **Isolation needs the worktree service** — with `isolate: true` each ticket gets its own checkout through `ctx.worktrees`, created for the supervising Agent; a Host without that service refuses to mount rather than sharing one directory silently.
- **No merge step** — a reviewed ticket stops at the person; nothing opens or merges the change request.
- **Two sources** — Feishu events and app submissions; another source needs its own gateway and thread vocabulary.
- **Cancel reaches the work run only** — a supervision or review turn in flight runs to its end; `cancel` refuses with `superagent/not-running` while no assignment is open.
- **Replies speak only for one cycle** — a ticket that finishes later, after a person answers a question, is not announced again in the bot conversation; the app panel follows every change through `watch`.
