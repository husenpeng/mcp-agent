---
kind: upgrade-guide
description: "Superagent worker leases must implement cancel(), stores must implement triggers(), and the runtime takes app submissions with an optional bot configuration."
---

# Superagent ports gain cancellation and the app source

English | [中文](guide.zh.md)

## Change

`@tomato/superagent` extends two public ports. `WorkerLease` now requires `cancel(): void`: it aborts the run a person stopped, and the run resolves with a `dropped` report. `SuperagentStore` now requires `triggers(): readonly Trigger[]`, reading every stored trigger oldest first. `runAssignment` accepts an optional fourth argument with `context` (the person's continuation messages) and `onLease` (the lease before the run is driven). `WorkerBrief` gains optional `context`, which `workerBriefText` renders into the prompt.

`@tomato/superagent-runtime` makes `bot` optional: without it the team runs app-only, taking requests through `ctx.superagent.submit(text)` and the `superagentTickets` Remote (`submit`, `detail`, `message`, `cancel`, `stop`, and the `watch` stream). The new `appUser` config names the actor the policy admits on the `app` source. `TicketSummary` gains `running` and `stopped`. A Feishu message that reaches an open ticket now continues that ticket's work with the message as context; previously it was recorded without running.

`@tomato/client-ui-superagent` is no longer read-only: its injected face adds `actions`, and the panel submits requests, follows the live stream, and offers cancel, stop, and message controls.

## Migration

1. A custom `Worker` implementation adds `cancel()` to each lease it returns; abort the active turn so the run reports `dropped`, and resolve `dropped` without driving a turn when the cancel arrived first.
2. A custom `SuperagentStore` implementation adds `triggers()`; a store that keeps no triggers (such as the room work store) may refuse the read the way it refuses `trigger()`.
3. A profile that mounted `superagent-runtime` with a `bot` configuration keeps working unchanged. To run without a Feishu service, remove `bot`, set `pollSeconds: 0`, and submit requests from the ticket panel; set `appUser` when the deployment admits a different local actor.
4. A consumer of `TicketSummary` reads the two new fields; existing fields keep their meaning.
5. Feishu deployments that relied on follow-up messages being recorded without running now see the reached ticket run again; stop a ticket to keep it from continuing.