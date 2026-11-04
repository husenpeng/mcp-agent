---
description: "Executes queued robot runs through one composed Agent per run and records their outcomes."
kind: "package-reference"
---

# @tomato/experimental-robot-runtime

English | [中文](README.zh.md)

## Summary

`@tomato/experimental-robot-runtime` turns queued runs from [`@tomato/experimental-robot-local`](../robot-local/README.md) into Agent turns. It scans queued runs when it loads, follows later run writes, creates one Agent per run, applies the bound specification to that Agent, drives the run's turns while the run stays non-terminal, and settles the run through `ctx.robots.finish`.

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

Mount the plugin after `@tomato/experimental-robot-local` and an Agent factory (`@tomato/agent-loop`) in the same composition. It requires `agentDefaultModel`, `agents`, `robots`, and `sessions`.

- `pauseTimeoutMs` bounds how long a paused run waits for human input before it settles as `cancelled`; it defaults to 30 minutes.
- A run is claimed when it is `queued`; the runtime creates an Agent, reports `running`, drives turns, and settles the run as `succeeded`, `failed`, or `cancelled`.
- `waiting` means the run is paused for a correction: the Agent, its Session, and the run stay alive, and the next correction continues the same Session.
- Cancelling the run settles it in the provider and aborts the Agent owned by that run; unloading the plugin disposes every Agent it still owns.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

Each run gets a fresh Session under a `robot-run-<uuid>` identity and one Agent composed by the Agent factory. The run works in the specification's first workspace root, else the deployment's first registered Workspace, else the Host process directory, and always records that directory on the Session. The specification contributes one prompt section, a tool admission mask, a skill restriction, a permission preset, and the default model selected by `agentDefaultModel`.

A non-empty `allow` list becomes an allow mask; otherwise a non-empty `deny` list becomes a deny mask. A specification naming a tool absent from the composition fails the run instead of silently admitting it. When the deployment registers MCP tools (`mcp__<server>__<tool>`), the run admits only those of servers named in `capability.mcpServers`; an empty list admits none of them, and the remaining native tools follow `allow` whether or not it is empty. A selected MCP server that the deployment does not configure, or a selected skill that the catalog does not list, fails the run before the Agent exists; an empty skill list leaves the deployment catalog in place, and a non-empty one restricts the Agent scope through `ctx.skills.restrict`. The permission preset is applied through `permissionPresets` when that optional service is mounted.

The runtime listens to committed `session/event` events for that Agent only. The last assistant text becomes the run output; the last `turn/end` reason decides the outcome: `completed` succeeds, `error` fails with the provider code and message, `aborted` settles as `cancelled`, and any other reason fails with its kind. A run whose turn settles without a `turn/end` event fails. After each idle turn the runtime reads the run record: a `waiting` run keeps its Agent and waits for the next write, a terminal run releases the Agent without settling again, and any other non-terminal state settles the run with the turn outcome. A pause that outlives `pauseTimeoutMs` settles the run as `cancelled` with the expired wait as its error. Agent creation or turn-driving failures settle the run as `failed` with the error message.

Queued runs are found in two ways: a scan when the plugin loads, and `domain/changed` writes for the `tomato_robot` `runs` table afterwards. In-process bookkeeping prevents the same run from being claimed twice. Unloading the plugin disposes every Agent it still owns.

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

- [`@tomato/experimental-robot`](../robot/README.md) — the service definition, types, and contract.
- [`@tomato/experimental-robot-local`](../robot-local/README.md) — the durable specification and run registry this runtime consumes.
- [Robot platform](../../../docs/subsystems/robot.md) — specifications, revisions, lifecycle, and agent-to-agent fields.
- [Robot platform product architecture](../../../.agents/notes/proposed/architecture/2026-10-29-robot-platform-product-architecture.md) — runtime, A2A, memory, and delivery decisions.

-----

<a id="model-experience"></a>
## Model Experience

### Robot mission prompt section

#### What the model sees

One section named `robot:mission` at order `-500`, built from the bound specification; the last three headings appear only when their list is non-empty.

##### Robot mission section

```markdown
## Robot mission
<mission>

## Success criteria
- <criterion>

## Stop conditions
- <condition>

## Output acceptance
- <acceptance>
```

#### Token effect

Adds the mission text and one bullet per listed success criterion, stop condition, and acceptance item to every model request in the run.

#### KV Cache effect

The section is stable for one specification revision, so it extends the reusable request prefix; publishing a revision or editing those lists replaces the text and invalidates reuse from this section.

### Tool admission

#### What the model sees

Only tools admitted by `capability.tools` and the selected MCP servers are visible: a non-empty `allow` list restricts the model to those names, `deny` removes names, and `mcp__<server>__*` tools appear only for servers named in `capability.mcpServers` — an empty list hides every MCP tool. A non-empty `capability.skills` list narrows the skill catalog to those names.

#### Token effect

Reduces tool schema tokens by omitting denied tools.

#### KV Cache effect

Changing either list changes the visible tool schemas and invalidates reuse from the first changed schema token.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **No planning loop** — `GoalSpec.strategy` is not interpreted; the runtime drives turns until the run settles but never re-plans on its own to keep going.
- **Default model only** — the specification has no per-robot model field yet; every run uses `agentDefaultModel.currentSelection()`.
- **No budget enforcement** — token, time, cost, and tool-call budgets are recorded in the specification but not enforced.
- **Single-process claim** — two hosts sharing one storage backend could execute the same queued run; there is no cross-process lease.
- **No memory or A2A** — memory namespaces and agent-to-agent envelopes are not implemented; those specification fields stay stored.
- **Mounting is deployment work** — the runtime never starts an MCP server or installs a skill; it only withholds tools and names the deployment already provides.
- **No triggers or scheduler** — runs arrive only through the provider's `start`; cron, event, webhook, and dependency triggers are absent.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>