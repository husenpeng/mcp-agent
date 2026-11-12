---
description: "Storage-backed Robot Room provider: durable room log, bounded wake scheduler, persistent member Sessions, and member tools."
kind: "package-reference"
---
# Robot Room Local

English | [中文](README.zh.md)

## Summary

`@tomato/experimental-robot-room-local` implements `ctx.rooms` over a `tomato_room` storage domain. It persists rooms, revisions, the visible log, episodes, read cursors, approvals, and guard snapshots; routes human messages; admits A2A proposals; schedules member wakes; creates one persistent Agent Session per member; and registers the five room tools.

The provider enforces the package invariant: **a member model can only propose a message; this provider writes the log, decides whether any member wakes, and bounds the wake before it starts.** It also denies every tool that could contact an agent outside the room log.

## Table of Contents

- [Use this package](#use-this-package)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

Mount it after a storage backend and `@tomato/storage-domain`, with the Agent registry and default-model services available for execution:

```yaml
- name: '@tomato/storage-json'
- name: '@tomato/storage-domain'
- name: '@tomato/experimental-robot-room-local'
```

Publishing validates the complete specification, allocates a room identity for a new room, and appends an immutable revision. Posting a human message records it in the log, opens or continues the episode, and wakes the routed members only while the room is active. `messages(room, afterSeq?, limit?)` reads the log in sequence order; every member message carries the `sessionRef` of the Session and turn that produced it, and a row stored before that reference was recorded still reports its member's stable Session with turn 0. Pausing stops new wakes without dropping messages: they remain in the log and queue, and resume drains the queue.

### Member execution

A member's Session id is `room-<room id>-<member id>`. The provider resumes it when persisted, otherwise creates it, mounts a `room:charter` system-prompt section, and registers the room tools. It denies `send_message`, `subagent`, `workflow`, and Team task tools in the member scope, so the room log is the only path to another agent.

One wake builds `buildMemberInput` from the member's read cursor, runs the preflight budget check, appends an `activity` message that names the member Session and turn, delivers one user message, waits for the turn to settle, records measured usage, updates the cursor, and appends the finished activity with the same reference. A message the member posts during the turn records the same reference. The room's `routing.floor` bounds concurrent member turns; the scheduler coalesces repeated wakes for the same member. A turn that does not settle within `guard.memberTurnTimeoutMs` is cancelled and trips the room with the `storm` reason.

### Refusals and approvals

An A2A refusal appends a `guard` message with the typed code and detail and returns it to the tool caller. A receiver whose `requiresApproval` names the sender writes an `approval` message and waits for `approve`; an approved envelope is emitted normally, a rejected one appends a system note. A guard trip stops the room, clears the wake queue, appends the trip record, and leaves human messages recordable without waking anyone. Trips and approvals also emit `room/notice`; a channel plugin may deliver that notice externally.

## Model Experience

### Member turn

#### What the model sees

Each wake delivers exactly one user message built by `buildMemberInput`: the summary of older unread messages, the raw window of recent room messages, the wake reason and trigger text, and a closing line naming the room tools. The member's system prompt carries the room name, charter, its role, and the member roster from a `room:charter` section; `room_ask` and `room_post` accept a member name or id. Tool results report either the accepted message sequence or the refusal code and detail. When `ctx.llm` is mounted, the provider asks the member's model for the older-message summary; a missing route, timeout, or model failure falls back to the deterministic summary.

#### Token effect

One bounded user message per wake, capped by the room's context window and per-message limits; the preflight refuses a wake whose prompt and expected output cannot fit the turn, episode, and member-day budgets. Measured `assistant/message` usage replaces estimates for later turns.

#### KV Cache effect

Append-only per member Session: the system prompt and earlier history remain stable, and each wake appends one user message. Resuming a persisted Session rewrites nothing.

## Known Limitations and Deferred Work

- **In-process scheduler** — wakes are queued in memory; a restart loses queued wakes and does not replay a robot chain. Durable guard snapshots are written, but a restart does not resume an interrupted member turn.
- **No cross-process delivery** — all member Agents run in the host process; remote executors and multi-host rooms are deferred.
- **Robot capability is not applied yet** — the provider mounts the room charter and tool restrictions but does not yet resolve each member's `RobotSpec` tool, skill, and permission limits.
- **One message per wake** — a member cannot fetch an unbounded history; `room_read` is capped at 50 messages and counts against the turn.
- **No streaming UI feed** — `room/changed` is emitted after writes; a streaming frame controller belongs to the Remote consumer.

### Dev Note

The provider serializes every mutation through one chain, awaits each storage-domain write before reading, and keeps guard counters in memory while persisting a snapshot for inspection. The next stage adds guard restore and a Remote controller.
