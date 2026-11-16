---
description: "In-process superagent team — read the bot service, plan, run, and review in one Host."
kind: "package-reference"
---

# @tomato/superagent-runtime

English | [中文](README.zh.md)

## Summary

Run a whole team in one Host: read the bot service on a schedule, decide what each request becomes, run every accepted ticket's work, and review it. The package composes the engine, the in-process providers, and the durable store; it owns only the order they run in and the containment of each step's failure. A request that was refused is recorded rather than dropped, work that stopped short of ready records its state, and a ready result reaches a person only after the internal review clears it.

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
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

The Host must already carry `ctx.agents`, `ctx.sessions`, and `ctx.storageDomain`. A deployment that publishes `ctx.botGateway` uses its own client; otherwise the runtime reads the bot service over HTTP with the configured identity.

With `replies: true` the team answers where the request arrived: one message naming what it opened and the state the work reached, or why the request was not taken. A service that refuses the reply is logged, never thrown.

`ctx.superagent.runOnce()` runs one cycle by hand — the shape every test and the CLI use — and `ctx.superagent.tickets()` lists everything stored.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

`apply` publishes the service before the domain opens: the first cycle opens the store, `tickets()` reads what is open, and disposal closes it. The supervising Agent is created on first use with the session id every ticket names, and disposal disposes it. One cycle polls the bot service, runs intake with the supervisor as its judge, then carries each accepted ticket through `runAssignment` and — when the report says ready — `runReview`. Below `pollSeconds`, a timer runs that cycle; a tick that arrives while one is still working is skipped, a failing cycle is logged and does not stop the schedule, and disposing the plugin clears the timer.

Every ticket records `superagent-supervisor` as its supervisor, so a person reading a report can also read the Sessions the work ran in through `createTicketSessionAccess`.

</details>

-----

## Model Experience

Indirectly, through the three turns one accepted ticket costs: the supervision turn, the work turn, and the review turn.

#### KV Cache effect

Each of the three turns is its own Session with no earlier context, so a request that opens two tickets makes two independent supervision-to-review chains rather than reusing one conversation.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **Isolation needs the worktree service** — with `isolate: true` each ticket gets its own checkout through `ctx.worktrees`, created for the supervising Agent; a Host without that service refuses to mount rather than sharing one directory silently.
- **No merge step** — a reviewed ticket stops at the person; nothing opens or merges the change request.
- **One bot source** — only Feishu events are read; another source needs its own gateway and thread vocabulary.
- **Replies speak only for one cycle** — a ticket that finishes later, after a person answers a question, is not announced again; nothing resumes the conversation when the work moves.
