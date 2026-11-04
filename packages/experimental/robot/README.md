---
description: "Service definition for versioned robot specifications, robot instances, runs, and agent-to-agent contract fields."
kind: "package-reference"
---

# @tomato/experimental-robot

English | [中文](README.zh.md)

## Summary

`@tomato/experimental-robot` defines the durable vocabulary and the `ctx.robots` service contract for a robot platform: versioned specifications, robot instances bound to one exact revision, runs with explicit lifecycle states, and agent-to-agent admission fields. It adds no provider, persistence, execution, transport, tools, or prompt text; an installed provider owns all of that. It also ships the robot template registry, a separate in-memory `ctx.robotTemplates` row that lists hireable starting points.

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

This package is a Service Definition, not a provider. Load a package whose plugin subclasses `Robots`; that subclass registers as `ctx.robots` and implements every abstract operation.

- Consumers inject `robots` and call `publish`, `revision`, `specs`, `instantiate`, `robot`, `robots`, `start`, `cancel`, `finish`, `run`, and `runs`.
- The service has no configuration fields.
- `isTerminalRunState` is a pure predicate that any process can call without the service.
- Mount `@tomato/experimental-robot/templates` as its own row to provide `ctx.robotTemplates`. Template packages call `register(template)` inside `ctx.effect`; a duplicate id throws, and every change emits `robot/changed` with `templates`.
- `templateSpec(template, locale, name?)` builds the complete specification a hire publishes; `templateText(template, locale)` selects copy for an exact locale such as `zh-CN`, then its language `zh`, then `en`. The result shares no arrays with the template, so editing a hired robot never changes the template.

The provider owns specification validation, persistence, execution, and transport. This package only states what callers may rely on.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

The abstract class constructor binds the Cordis service key, so a second provider in one context throws under the standard duplicate-service rule. The implementation itself is four statements of contract:

- Published revisions are append-only. Revision `n + 1` supersedes `n`, and an existing revision never changes.
- `instantiate` binds one robot to one exact revision. Publishing a later revision does not move an existing robot.
- `start` accepts a run only from `idle`; it rejects while the robot is `provisioning`, `paused`, `failed`, or `stopped`.
- `cancel` is cooperative. A run that already reached a terminal state keeps that state.

Identities are compile-time brands, so a `RobotId` cannot be passed where a `RunId` is expected. The package has no runtime identity, storage, or I/O. The [source](src/index.ts) and [types](src/types.ts) are the complete contract.

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

- [Robot platform product architecture](../../../.agents/notes/proposed/architecture/2026-10-29-robot-platform-product-architecture.md) — product form, runtime, A2A, memory, and delivery decisions.
- [Agent Teams](../agent-team/README.md) — the experimental session-local roster, mailbox, and task board this contract supersedes for production robots.

-----

<a id="model-experience"></a>
## Model Experience

None, as this service definition adds no prompt, tool, or context of its own.

#### KV Cache effect

Installing the definition changes no model request; providers own their prompt sections and tool schemas.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **No provider in this package** — loading it alone creates no `ctx.robots` service. A provider must subclass `Robots`; until one is installed, no robot operation exists.
- **No persistence or control-plane log** — revisions, robots, and runs exist only as contract types. Durable storage, replay, and projections belong to the provider.
- **No validation implementation** — `publish` requires validation by contract, but the schema and diagnostics belong to the provider.
- **No agent-to-agent transport** — envelope, mailbox, delivery, and retry fields arrive with the A2A package.
- **No client surface** — Floor, robot detail, task board, run trace, and inbox are absent until a client package lands.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>