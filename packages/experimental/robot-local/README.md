---
description: "In-memory robot specification registry with immutable revisions, idle instantiation, and run acceptance."
kind: "package-reference"
---

# @tomato/experimental-robot-local

English | [中文](README.zh.md)

## Summary

`@tomato/experimental-robot-local` is the storage-backed provider for the [`ctx.robots`](../robot/README.md) service definition. It validates a specification, publishes immutable revisions, instantiates robots in `idle`, and accepts and cancels runs. Records live in the durable `tomato_robot` storage domain; it executes no work and adds no prompt, tool, or transport.

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Further Exploration](#further-exploration)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

Mount the plugin after `@tomato/storage-domain` and a storage backend; it waits for `storageDomain`, opens the `tomato_robot` domain, and registers as `ctx.robots`.

- Every consumer injects `robots` and calls the operations declared by the [service definition](../robot/README.md).
- The provider has no configuration fields and no bundle entry.
- `parseRobotSpec` and `RobotSpecValidationError` are exported so a caller can pre-check a specification before publishing.

Publishing a specification with the same name as another latest specification fails; updating a specification keeps its identity and requires the current latest revision as `previous`.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

Validation runs a Zod schema over every field, then checks cross-field invariants: duplicate entries in declared lists, a tool in both `allow` and `deny`, and a goal without triggers. A rejected specification throws `RobotSpecValidationError` with field paths. A successful publish deep-freezes the specification before it enters storage, so later caller mutations cannot change the revision.

The provider opens the `tomato_robot` domain and keeps no separate mutable state: revisions, robots, and runs are read from the domain's validated in-memory tables, and every write is durable before its promise resolves. The domain validates every stored record when it opens, so a malformed record rejects activation instead of being skipped. A single provider-owned chain serializes mutations, so concurrent publishes cannot pass the same name check and concurrent starts cannot both claim one robot.

Revisions are append-only rows keyed by specification identity and revision number. The latest revision per specification is derived on each read, and `specs()` returns one entry per specification in first-publication order. Instantiation binds one robot to the exact published revision and returns it in `idle`.

`start` accepts one run per robot and records it as `queued`; `robot()` and `robots()` report `running` while a non-terminal run exists. `cancel` updates the run to `cancelled`, records `endedAt`, so the robot reports `idle` again. `finish` records the executor's terminal state with its output or error detail; a run that is already terminal keeps its state. Cancelling an already terminal run returns without a write. A restarted provider reads the same domain and reports the same revisions, robots, and runs.

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

- [`@tomato/experimental-robot`](../robot/README.md) — the service definition, types, and contract.
- [Robot platform](../../../docs/subsystems/robot.md) — specifications, revisions, lifecycle, and agent-to-agent fields.
- [Robot platform product architecture](../../../.agents/notes/proposed/architecture/2026-10-29-robot-platform-product-architecture.md) — runtime, A2A, memory, and delivery decisions.

-----

<a id="model-experience"></a>
## Model Experience

None, as this in-memory provider registers no prompt, tool, or model context.

#### KV Cache effect

The provider changes no model request; a runtime provider owns any prompt sections and tool schemas it adds.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **Requires storage** — the composition must provide `storageDomain` and a backend serving the `kv` facet; there is no in-memory fallback.
- **No executor** — an accepted run stays `queued` until an executor settles it. Mount [`@tomato/experimental-robot-runtime`](../robot-runtime/README.md) to drive queued runs; this provider itself executes nothing.
- **One active run per robot** — `GoalSpec.maxConcurrentRuns` is not enforced; a second `start` rejects until the active run is cancelled.
- **No agent-to-agent transport** — envelopes, mailboxes, delivery guarantees, and peer budgets arrive with the A2A package.
- **No Session-log control plane** — durable state lives in the `tomato_robot` storage domain. The `robot-control` Session kind and projections from the architecture proposal require a persisted Session-kind change and are not implemented yet.
- **No exported JSON Schema** — validation is Zod-based and provider-owned; consumers that need a portable schema must wait for the published contract.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>