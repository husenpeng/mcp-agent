---
description: "Starts robot runs from cron schedules and robot event topics."
kind: "package-reference"
---

# @tomato/experimental-robot-triggers

English | [中文](README.zh.md)

## Summary

`@tomato/experimental-robot-triggers` starts queued-in-time robot runs from the specification's `cron` schedules and from `robot/event` topics. It stores no trigger state: schedules are recomputed from every robot's published revision when the plugin loads and after registry writes, and occurrences missed while the host was down are not replayed.

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

Mount the plugin after `@tomato/experimental-robot-local`; it requires `robots` and has no configuration fields.

- A `cron` trigger starts a run with the robot's mission when its next occurrence arrives.
- An `event` trigger starts a run when another plugin emits `ctx.emit('robot/event', topic, payload)`.
- A start rejected because the robot is already running is logged; it is not queued for later.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

Cron expressions and zones are parsed by `@tomato/schedule`; the trigger plugin only computes the next occurrence after the current wall-clock reading and arms one host timer for the earliest pending entry. When the timer fires, every due entry starts a run, recomputes its next occurrence, and the timer re-arms. A schedule whose expression cannot produce a future occurrence is logged and skipped.

`domain/changed` writes for the `tomato_robot` `robots` and `revisions` tables trigger a refresh, so new instances and new specification revisions are picked up without a restart. An event trigger matches the exact topic; each matching robot receives one start with a user message that names the topic and carries the JSON payload. Multiple robots with the same topic each run.

Nothing is persisted: disposing the plugin clears its timer, and a restart recomputes every schedule from the current time.

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

- [`@tomato/experimental-robot`](../robot/README.md) — the trigger vocabulary and service contract.
- [`@tomato/experimental-robot-local`](../robot-local/README.md) — the durable registry this package reads.
- [`@tomato/experimental-robot-runtime`](../robot-runtime/README.md) — the executor that drives the runs this package starts.
- [Robot platform](../../../docs/subsystems/robot.md) — specifications, revisions, lifecycle, and agent-to-agent fields.

-----

<a id="model-experience"></a>
## Model Experience

### Trigger run input

#### What the model sees

A trigger starts a run whose user message is the robot's mission; an event trigger appends the topic and payload.

##### Trigger messages

```markdown
## Cron
<mission>

## Event
<mission>

Robot event: <topic>
<JSON payload>
```

#### Token effect

Adds one user message to the run's first model request; no system prompt, tool schema, or other context is contributed.

#### KV Cache effect

Each triggered run opens its own Session, so the message does not replace an earlier request prefix. Different payloads change that run's user message and therefore its first request.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **Only cron and event triggers** — `webhook`, `dependency`, and `threshold` triggers are accepted by the specification but start no runs.
- **Missed occurrences are skipped** — a host that was down does not replay cron occurrences it missed; the next future occurrence is scheduled.
- **Invalid cron expressions are logged, not rejected at publish** — specification validation checks only that the expression is non-empty; an unusable expression is skipped when the trigger loads.
- **Start failures are logged, not queued** — a trigger that fires while the robot is already running is dropped; the next occurrence or event can start a new run.
- **No durable trigger state or cross-process lease** — every host recomputes schedules, so two hosts sharing one registry can both start the same occurrence.
- **One message per trigger** — the mission is the whole message; specifications cannot declare per-trigger input text or payload schemas.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>