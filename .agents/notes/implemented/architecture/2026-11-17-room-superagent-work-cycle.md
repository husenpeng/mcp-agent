# Agent Note: Room work records through the superagent engine

Status: implemented

English | [中文](2026-11-17-room-superagent-work-cycle.zh.md)

## Problem

The Room provider scheduled member wakes and wrote every message to one log, but the log held no durable record of what a member was asked, what it produced, or whether the result was checked. Two product requirements needed that record: every finished task must pass the member's own review, and an outgoing A2A message must not reach the next member until that review clears it.

The [robot platform architecture](../../proposed/architecture/2026-10-29-robot-platform-product-architecture.md) describes the room as a product surface with runs, approvals, and A2A; the [collaboration orchestration note](2026-11-10-rbot-agent-collaboration-orchestration.md) owns the crew page's Rbot binding. This note records the work layer the room gained, not a change to either.

The superagent engine already owns the vocabulary for named work: a `Ticket` with an immutable `Mandate`, sequential `Assignment`s, a `Report` per run, and a `ReviewVerdict` with blocking findings. Reusing it inside a room keeps one work vocabulary instead of inventing a second, without turning the room into the engine's ticket-first product.

## Decision

The Room provider keeps `ctx.rooms`, the room log, admission, budgets, and A2A envelopes, and uses the superagent engine per member round:

- Each wake opens one ticket in a room-owned `tomato_room_work` domain, through an implementation of `SuperagentStore`. The triggering message supplies the subject and the `room` thread; a human trigger records an `explicit` mandate and a peer trigger a `proposed` one. The domain is separate from `tomato_superagent`, so the room never shares the engine's in-memory mirror with the Feishu team.
- One member round runs as one assignment. The provider synthesizes the report from the turn: `failed`, `dropped`, `blocked`, or `ready`, where `ready` requires a parsed passing self-review. The member never writes a `REPORT:` marker.
- Every finished turn runs one self-review turn in the same member Session, ending with `REVIEW: pass` or `REVIEW: fail` plus one bullet per problem. A failing or missing verdict opens another assignment on the same ticket and returns the findings to the member, up to `review.maxRounds`. Outbound A2A requests and replies are held during the turn and released only on a passing review.
- When every ticket of one request thread reports `ready`, the room's `reviewer` member runs an acceptance turn with the same verdict format. Failing acceptance returns findings to the worker as another assignment; exhausting the rounds appends a system line that leaves the task with the operator. A room with no enabled reviewer records that the request waits for acceptance.
- `RoomSpec.capability` narrows each member's Rbot revision: tool allow lists intersect, deny lists union, skills intersect, MCP servers the room did not name are denied by tool name, and a permission preset must match the robot's own or the member turn fails. The room never widens the robot.
- `RoomSpec.review` is optional: `selfReview`, `acceptance`, and `maxRounds` default to on, on, and three, so stored revisions written before the field keep working. A provider call reads the room's current configuration for new tickets; an assignment keeps the configuration it started under.

The crew workflow moved out of the Rbot bundle into `@tomato/experimental-robot-crew-bundle`, which ships switched off, so a profile that selects the Rbot layer mounts the room without a second group-chat tab or a crew tool.

## Alternatives considered

**Keep a room-owned work vocabulary.** A second task table with its own state names would duplicate the engine's ticket, assignment, report, and verdict shapes and drift from them. Reusing the engine keeps one vocabulary and one set of stage predicates.

**Gate only the final result, not A2A messages.** Delivering a delegation immediately and reviewing later lets an unreviewed message reach the next member, which is what the requirement forbids. Holding outbound messages costs same-turn peer answers, so a peer answers after the turn ends.

**Run the self-review in a fresh Session.** A separate reviewer Session reads the result more independently, but the member must fix its own work and the findings concern what it just produced. The same Session keeps that context and costs one turn instead of a second context load.

## Consequences

- A member model can propose an A2A message inside its turn but the peer hears it only after the review clears; a peer cannot answer inside the same turn.
- The room log gains operator-facing system lines for review passes, reworks, dropped messages, and acceptance outcomes. Self-review and acceptance text never enter the room log.
- Room work records outlive a restart, but an interrupted member turn is still not replayed: the ticket's last assignment keeps whatever report it wrote.
- The acceptance step needs a reviewer member; without one the request stays ready and waits.

## Verification

`packages/experimental/experimental-robot-room-local/tests/work.spec.ts` covers the domain store, thread, verdict parsing, and report synthesis; `review.spec.ts` covers the passing, failing, rework, round-budget, disabled-review, and missing-reviewer paths; `outbound.spec.ts` covers held and dropped A2A delivery; `spec.spec.ts` covers the review and capability validation; `capability.spec.ts` covers the intersection, MCP denial, preset application, and a mismatched preset.