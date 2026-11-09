# Agent Note: Robot platform product form, runtime, and A2A

Status: proposed

English | [中文](2026-10-29-robot-platform-product-architecture.zh.md)

## Problem

A robot today is a Session with a chat surface. The DS Bot plugin shows the limit: each Bot is a Session in one workspace, created by conversation, configured through a settings page, and reachable only by messages. Position, execution logic, capability limits, and input/output contract are not part of the object, and its A2A path is an inbox write without retry, deduplication, or cross-process delivery.

Tomato owns the durable pieces — Session logs, projections, jobs, schedules, goals, subagents, presets, deliverables, credentials, sandboxes, and approvals — but no package owns a robot as a versioned, runnable process. A person cannot see what robots exist, what they are doing, what they may touch, what they consume and produce, or how they call each other.

## Proposal

### Product form

1. **Floor.** The default page lists robots as cards with state, current run, queue depth, remaining budget, last failure, and pending approvals; filters cover team, capability, and state.
2. **Robot detail.** Tabs show Spec (rendered, editable, diffable), Runs (timeline and replay), Tasks, Comms (A2A messages with causality), Memory, and Artifacts.
3. **Task board.** Tasks are grouped by `queued`, `running`, `waiting`, `done`, and `failed`, with owner, deadline, dependency edges, and acceptance criteria.
4. **Run trace and inbox.** One run renders its complete timeline — input envelope, assembled context, plan, each model request, tool call, A2A call, artifact, cost, and outcome — and can be replayed; approvals, questions, escalations, and dead letters land in one inbox.
5. **Creation.** A spec wizard with five blocks feeds validation, a dry run, a version diff, publish, and instantiation. Conversation may draft a spec; it never publishes one.

### Domain model

| Object | Contract |
|---|---|
| `RobotSpec` | Versioned definition; a published revision is immutable |
| `Robot` | Instance bound to one spec revision; owns a mailbox, an execution slot, and state |
| `Run` | One activation; one Session log; replayable |
| `Task` | Work unit with owner, dependency edges, deadline, acceptance criteria, artifacts |
| `Envelope` | A2A message referencing task, trace, artifacts, and memory |
| `MemoryRecord` | Entry with namespace, source, status, and expiry |
| `Artifact` | Output with type, version, and storage reference |
| `Approval` | Human decision that blocks a run and resumes it as input |

- Control-plane events and each run's Session log are the only sources of truth; every view is a projection.
- Every model-visible input is reconstructable from that run's Session.
- Every side effect carries an idempotency key and a compensation record; an unknown outcome is reported, never treated as success.
- Every cross-robot call passes a permission check at the sender and the receiver; absence of a grant denies.
- A spec change never affects runs in flight; new runs bind the new revision.

### Spec as the creation contract

| Block | Fields |
|---|---|
| Position and authority | owner, `reportsTo`, callers, callees, escalation path, visibility |
| Goal and execution | mission, success criteria, triggers, strategy, stop conditions, failure policy, budgets, concurrency |
| Capability and limits | tool allowlist and denylist, MCP servers, skills, workspace roots, data classes, credential references, sandbox and permission preset, network policy |
| Input and output | input schema and version, output schema, artifact format, delivery target, acceptance criteria |
| Memory and A2A | read and write namespaces, retention, recall policy, allowed intents, per-peer budget and rate, approvals required by peer |

1. The form and a YAML document edit the same spec; JSON Schema validation reports errors on the field.
2. Publishing runs a dry run with mock tools and recorded model output and shows a sample run trace.
3. Publishing shows a diff against the previous revision; a published revision cannot be edited, only superseded.
4. Missing dependencies — model, credential, workspace, MCP server, permission preset — fail instantiation.

### Runtime and run lifecycle

- Robot state: `provisioning`, `idle`, `running`, `paused`, `failed`, `stopped`.
- Run state: `queued`, `leased`, `running`, `waiting`, `finalizing`, `succeeded`, `failed`, `cancelled`, `timed_out`.
- Triggers: manual, cron, event topic, webhook, dependency completion, threshold. Schedule only fires a trigger; it does not schedule runs.
- A run takes a lease with a heartbeat, assembles the spec revision, memory snapshot, and input envelope, plans, executes steps, writes artifacts, finalizes, writes back memory, and notifies.
- One execution slot per robot; queue order uses priority and fairness; leases expire and requeue after a crash, with idempotency keys preventing duplicate effects.
- Budgets cover tokens, wall-clock time, cost, and tool calls and are checked at step boundaries; exhaustion follows the spec's degrade, pause, or fail policy.
- Failure classes are `transient`, `permanent`, `policy`, and `unknown`; policy selects retry with backoff, circuit breaking, escalation, or a dead letter. Finalization always records outcome, cost, artifacts, and memory candidates.
- An approval blocks the run; the decision resumes it as an input envelope.

### A2A protocol

```json
{
  "id": "msg_...",
  "traceId": "trace_...",
  "conversationId": "task_...",
  "from": "robot:a",
  "to": "robot:b",
  "intent": "request|accept|reject|progress|result|error|cancel|delegate|escalate|event|ack",
  "schema": { "id": "review.request", "version": 1 },
  "payload": {},
  "refs": { "taskId": "...", "artifactId": "...", "memory": ["..."] },
  "deadline": "2026-10-29T12:00:00Z",
  "ttlSeconds": 3600,
  "priority": "normal",
  "budget": { "tokens": 50000, "millis": 600000, "cost": 0.5 },
  "idempotencyKey": "...",
  "replyTo": "msg_...",
  "lineage": { "depth": 2, "chain": ["robot:user", "robot:a"] },
  "policy": { "approval": "none", "dataClass": "internal" }
}
```

- `request` returns `accept` or `reject` with a reason, then zero or more `progress`, then `result` or `error`; accept may negotiate deadline and budget.
- `delegate` transfers task ownership; `request` keeps it.
- `cancel` is cooperative and propagates to descendant tasks; a target that already produced effects reports compensation or an unknown outcome.
- `escalate` carries a context bundle to the next authority on `reportsTo`.
- `event` publishes to a topic and expects no reply; `ack` means the receiver committed the envelope to its log.
- Each robot has a durable mailbox with at-least-once delivery and deduplication by `idempotencyKey`; ordering holds per `conversationId`, not globally.
- TTL, retry backoff, and a dead-letter queue are part of the mailbox; transport is a capability seam with in-process, HTTP, and ACP providers that carry the same envelope.
- `lineage.depth`, a per-task message budget, a per-run peer-call budget, and a lineage cycle check stop A2A loops.
- Sender and receiver both check the ACL, `policy.dataClass` limits payloads, each peer pair has a rate limit, every envelope is audited, and topologies cover peer to peer, supervisor chains, topic buses, rooms, and an optional contract net.

### Shared memory and recall

- Namespaces: `robot:<id>`, `team:<id>`, `task:<id>` (blackboard), `user:<id>`, `workspace:<hash>`.
- A record carries entity, key, value, kind, namespace, source, confidence, status (`candidate` or `active`), pinned, and expiry.
- A robot writes its own namespace; the team namespace requires authority or an explicit grant; every task participant writes the blackboard.
- `recall(query, namespaces, filters, limit)` returns ranked records with their source; retrieval is hybrid, and injection respects a character budget.
- The memory section of a system prompt is frozen when a run starts; writes made during the run are visible through `recall`.
- A2A messages carry memory references, not copied values; a finished task archives its blackboard into the team or robot namespace.
- Writeback combines automatic review with explicit `remember`; every change is journaled and can be forgotten or expired.

### Package topology and control plane

| Package | Role |
|---|---|
| `@tomato/robot` | Service Definition `ctx.robots`: spec registry, revisions, lifecycle, validation |
| `@tomato/robot-runtime` | Provider: triggers, leases, run orchestration over jobs and agents |
| `@tomato/robot-a2a` | Envelope, mailbox, delivery, retry, loop prevention; local, HTTP, and ACP transports |
| `@tomato/robot-memory` | Multi-namespace memory and recall |
| `@tomato/tool-robot` | Model-facing call and query tools; no tool writes a spec |

| Existing capability | Package |
|---|---|
| Durable logs and views | `session`, `session-projection`, session kinds |
| Background execution and time | `jobs`, `schedule` |
| Goals, plans, workflows | `goal`, `plan-mode`, `workflow` |
| Spec to agent | `preset`, `persona`, `subagent` |
| Artifacts and limits | `deliverables`, `workspace`, `credentials`, `sandbox`, `permission-presets`, `interaction` |

- A `robot-control` team Session holds spec publications, roster, task, and mailbox events; each run has its own Session; `storage-domain` indexes both.
- Durable events live in the `robot/*`, `task/*`, and `a2a/*` domains; Floor, Task board, and Comms are projections.
- The capability seam has all three roles: `@tomato/robot` defines `ctx.robots`, `@tomato/robot-runtime` provides it, and UI, API, and tools consume it.
- Slice 1 ships the definition, storage provider, and executor as `@tomato/experimental-robot`, `@tomato/experimental-robot-local`, and `@tomato/experimental-robot-runtime`; promotion maps the definition and executor to `@tomato/robot` and `@tomato/robot-runtime`, while the storage provider stays a local implementation.
- Slice 2 ships cron and event triggers as `@tomato/experimental-robot-triggers`; webhook, dependency, and threshold triggers await their domains.
- A remote robot uses an A2A transport provider plus ACP or the SDK, with signed identity and end-to-end permissions when it crosses hosts.

### Delivery slices

1. Domain model, control-plane log, spec validation and revisions, manual single-host runs, and Run trace.
2. Triggers, queue, leases, budgets, failure semantics, and approvals.
3. A2A v1: mailbox, envelope, request/response/cancel, trace, and loop prevention.
4. Shared memory: namespaces, recall, blackboard.
5. Team orchestration: supervisor chain, task DAG, escalation, `reportsTo` authority, Task board.
6. Remote robots, HTTP/ACP transport, and multiple hosts.
7. Operations: quotas, audit, metrics, backup, migration, and upgrade guides.

### Decisions

1. The control plane is a `robot-control` Session kind, not a separate event store. Slice 1 stores durable state in the `tomato_robot` storage domain because a persisted Session kind requires a session-format change; the Session-log control plane remains the target for replay and projections.
2. Each run gets its own Session, not one long Session per robot.
3. The first A2A transport is the local mailbox; HTTP follows the same envelope.
4. Shared memory is a new `@tomato/robot-memory`, not an extension of `@tomato/experimental-memory`. The [long-term memory proposal](../feature/2026-11-05-long-term-memory-for-muse-and-robots.md) amends this decision: `ctx.memory` keeps one read surface with a per-scope write policy, and `@tomato/robot-memory` becomes the robot-facing policy and assembly layer.
5. Authority uses `reportsTo` plus capability ACLs; either alone is insufficient.

## Alternatives considered

**Building on DS Bot** — rejected: it binds a robot to a chat Session, its creation path is conversation, and its inter-Bot delivery has no retry, deduplication, or cross-process guarantee. Reusing its UI lessons is not the same as reusing its product model.

**Chat as the primary surface** — rejected: a chat transcript cannot show queue depth, budget, dependency edges, or pending approvals, and it makes every operation a message. Conversation is retained as the intervention path.

**One long-lived Session per robot** — rejected: it couples every run's context, budget, and replay to all earlier runs, makes cancellation and retry ambiguous, and forces compaction to carry execution state. A run-scoped Session keeps each activation inspectable.

**A dedicated event store for the control plane** — rejected: the Session log already provides durable append, replay, projections, export, and migrations. A second store adds a second consistency model for the same facts.

**Extending `@tomato/experimental-memory` with team and task namespaces** — rejected: its owner is an account or workspace, its records are profile or workspace facts, and its write path is user-confirmed. Robot memory needs agent-owned writes, task blackboards, and source across agents; the record and recall code can be shared without merging the services.

**HTTP as the first A2A transport** — rejected: it introduces authentication, serialization versions, and failure modes before the local protocol semantics are proven. The local mailbox exercises the same envelope and delivery rules.

**Capability ACL alone, without `reportsTo`** — rejected: escalation, approval, and organizational visibility need a chain of authority. ACLs answer whether a call is allowed, not who decides when two robots disagree.

**Conversation-driven creation** — rejected: it cannot preview the assembled prompt, tool list, and permissions, cannot reproduce the same spec from the same words, and validates only after the robot exists. Conversation may draft; a reviewed spec publishes.

## Acceptance criteria

- Creating a robot requires a valid spec and a published revision; the UI shows the compiled prompt sections, tool list, permission preset, and a dry-run trace before publish.
- Every run can be reconstructed from its Session log: input envelope, assembled memory, plan, model requests, tool calls, A2A envelopes, artifacts, cost, and outcome.
- A2A delivery is at-least-once with deduplication; a cancelled task propagates cancellation to descendants and reports compensation or an unknown outcome.
- Every recalled memory record carries its source; a robot cannot read a namespace it was not granted, and the denial is visible in the audit log.
- Floor, Robot detail, Task board, Run trace, Comms, and Inbox read only from projections and remain correct after a host restart.
- The five decisions above are reflected in package boundaries; no package imports a concrete provider across a seam.

## Risks

- **Control-plane contention.** Every robot event appends to one team Session. If write throughput becomes a bottleneck, task and mailbox records move to `storage-domain` tables with the Session carrying only audit events; the projection contract stays.
- **Run-per-Session overhead.** Thousands of small runs create many Session directories. Retention and archival policies must be part of slice 1, not an afterthought.
- **Memory consistency.** A frozen prompt section plus live recall can show a fact that contradicts the frozen section. The run trace must label which memory revision each request used.
- **Remote trust.** A signed envelope authenticates a robot, not its intent. Cross-host permissions, data classes, and rate limits must be enforced at the receiving host.
- **Spec complexity.** Five blocks with schemas can overwhelm a first-time user. Templates and a guided form are product requirements, not documentation.
- **Overlap with Agent Teams.** The experimental team package already owns a roster and task DAG. This proposal supersedes its model for production robots; keeping both without a migration path would duplicate the same state.