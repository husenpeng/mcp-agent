---
description: "Robot Room vocabulary and pure policy: room specification, A2A v2 envelopes, admission, loop guard, budgets, and member context."
kind: "package-reference"
---
# Robot Room

English | [中文](README.zh.md)

## Summary

`@tomato/experimental-robot-room` owns the vocabulary and pure policy of a durable group conversation: the versioned room specification, the `tomato-a2a/2` envelope, the admission pipeline, the loop and budget guard, and the bounded context a member reads on one wake. It holds no transport, persistence, or execution; `@tomato/experimental-robot-room-local` provides them.

The invariant behind every function here: **a member model can only propose a message; the host decides whether it is delivered, who is woken, and what the wake may spend.**

## Table of Contents

- [Use this package](#use-this-package)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

Use the specification helpers (`emptyRoomSpec`, `validateRoomSpec`, `requireRoomSpec`, `reviewSpecOf`, `ROOM_PRESETS`), the A2A v2 protocol (`createEnvelopeV2`, `roomSignature`, `clampText`), the admission and guard (`RoomGuard`, `routeHuman`, `wakeMatches`, `similarity`), the budget arithmetic (`grantFor`, `preflight`, `softLimitCrossed`), and the context builder (`buildMemberInput`, `visibleTo`, `unreadCount`). The `Rooms` service definition is the seam the provider implements; `work(room)` reads the tickets a room produced as `RoomWorkRecord` rows.

### Room specification

A room names its charter, two to twelve members, each member's published Rbot revision, role, wake rule, A2A permissions, per-turn and daily budgets, an optional model override, and the room's routing, guard, budget, context, and review limits. The validator reports every field problem at once. `review` is optional: `selfReview`, `acceptance`, and `maxRounds` default to on, on, and three, so a revision stored before the field keeps running; providers read it through `reviewSpecOf`. `capability` is optional too: its tool allow/deny, skill, and MCP-server lists can only narrow each member's `RobotSpec`, and its permission preset must match the robot's own. A member's room-level A2A permissions only narrow the robot's own `position.callers` and `a2a` limits; the provider intersects the two.

### A2A v2

`createEnvelopeV2` builds an immutable envelope carrying `request`, `delegate`, `handoff`, `inform`, or `reply`, one to `routing.maxFanout` receivers, a task of at most 4000 characters, context of at most 8000 characters, referenced artifacts rather than inlined bodies, a causal depth, a token grant, a deadline, and a normalized signature. `inform` never wakes a receiver; a `reply` wakes only a sender that is waiting for it. Delivery is asynchronous: the sender's tool returns acceptance, not the peer's answer.

### Admission and guard

`RoomGuard.admit` runs the complete pipeline before any counter changes: member and receiver existence, breaker state, ACL and accepted intents, depth, fanout, episode turns/messages/tokens/time, member rate, receiver pending limit, duplicate signature, pair ping-pong, and grant attenuation. A refusal is a typed code with a one-sentence detail; a successful admission consumes the rate bucket, records the message, depth, signature, pair alternation, and pending request. `recordTurn` adds measured tokens and text, trips `no-progress` when the recent window is near-identical, and `check` enforces the wall clock. The breaker moves `closed → open → half-open → closed`; `resume` enters half-open, `settle` closes it, and `relaxOnce` raises the current episode's limits by 50% without changing the specification.

### Budgets and grants

`grantFor` gives a request at most half of the sender's remaining episode budget and no more than the sender's turn input cap, so each delegation depth receives strictly less than its parent. `preflight` refuses a wake whose known prompt plus expected output cannot fit the turn, episode, or member-day limit. Measured usage replaces estimates when the adapter reports it.

### Member context

`buildMemberInput` produces one bounded user message per wake: a deterministic summary of unread messages outside the window, the raw window of recent messages, the wake reason with its trigger text, and the available room tools. Private A2A is visible only to its sender and receivers; every message remains visible to the operator. `unreadCount` and `visibleTo` support the provider's scheduling and the UI's badges.

## Model Experience

### Member input

#### What the model sees

The provider delivers one user message built by `buildMemberInput`: the summarized older unread messages, the raw messages inside the configured window with per-message clamping, the wake reason and trigger text, and a closing line naming `room_post`, `room_ask`, `room_reply`, and `room_pass`. Private A2A the member neither sent nor received is absent.

#### Token effect

Capped by `context.window` raw messages, `context.messageChars` per message, `context.summaryChars` for the summary, and `context.triggerChars` for the waking message; the preflight refuses a wake that cannot fit the turn, episode, and member-day budgets.

#### KV Cache effect

Append-only per member Session: the system prompt and earlier history stay stable, and each wake appends one message. A new room revision or a changed wake reason does not rewrite earlier turns.

## Known Limitations and Deferred Work

- **Policy only** — the package performs no delivery, persistence, scheduling, or model call; `@tomato/experimental-robot-room-local` owns those and must record every delivered message.
- **Deterministic summary** — `fallbackSummary` keeps message headers and first lines without a summarization model; a provider may replace it with one, but must keep the same character bound.
- **Pair detection is pairwise** — ping-pong counts alternations for one unordered pair; a cycle across three or more members is bounded only by depth, turns, and the no-progress window.
- **No tokenizer** — `estimateTokens` is a stable length heuristic used when an adapter reports no usage; budgets become exact only with measured usage.
### Dev Note

Pure functions with no I/O, timers, or global state; one `RoomGuard` per room. Counters restart on every episode, while the breaker, rate buckets, and member days survive across episodes. Tests inject the clock, so they do not depend on real time.
