---
description: "The Tomato Rbot bundle: robot registry, run executor, triggers, Remote controller, sidebar roster, specification editor, and a conversation surface separate from workspace chats."
kind: "package-bundle"
---
# Robot App

English | [中文](README.zh.md)

## Summary

`@tomato/experimental-robot-app` mounts the Tomato Rbot feature as one optional bundle: `@tomato/experimental-robot-local` stores specifications, robots, and runs; `@tomato/experimental-robot-runtime` executes queued runs through one Agent per run and records the run's Session; `@tomato/experimental-robot-triggers` starts runs for cron and event schedules; `@tomato/api-robot-controller` exposes the registry over the `robot` Remote namespace; `@tomato/client-ui-robot` renders the sidebar roster, the basic and advanced specification editor, and the run conversation; `@tomato/experimental-tool-robot` adds the model-facing `robot_create` tool; and the bundle registers the bundled `robot-creation` skill for creation Sessions. A profile that does not add this bundle is unchanged.

## Table of Contents

- [Use this package](#use-this-package)
- [Create a robot](#create-a-robot)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)

-----

<a id="use-this-package"></a>
## Use this package

Add `@tomato/experimental-robot-app` to a profile's bundle list (or install it from the official optional-bundle catalog). The Host rows need a storage backend through `@tomato/storage-domain`, an Agent factory, the Session projection registry, and, for cron triggers, `@tomato/schedule`. The browser row renders only where `ctx.robotRuns` is mounted.

<a id="create-a-robot"></a>
## Create a robot

Manual creation opens the specification editor on the basic tab: name, description, task goal, and success criteria. Every other block — position and authority, triggers, budgets, tools and limits, input/output, memory, and agent-to-agent settings — stays on the advanced tab at the general default from `emptyRobotSpec()`; the editor states that unchanged fields keep those defaults.

Conversation creation opens a new Session in the current Workspace with a draft that names the `robot-creation` skill. The skill interviews the user for the same four answers, summarizes them, then calls `robot_create`; the tool publishes the specification and instantiates it, so the robot appears in the roster when the Session finishes. The skill ships with this bundle and is registered as a bundled skill, so it is available in any Workspace rather than only in this repository. `robot_create` requires a live top-level agent and a human message in the open turn.

<a id="model-experience"></a>
## Model Experience

### Run mission

#### What the model sees

Each run's Agent receives one `robot:mission` system-prompt section built from the specification's mission, success criteria, stop conditions, and output acceptance text, plus the allow/deny tool restriction and the configured permission preset. The page and the Remote namespace add no other model-visible input.

#### Token effect

One prompt section per run, sized by the specification text.

#### KV Cache effect

The section is stable for one revision; a new revision changes the prefix and starts a fresh cache on the next run.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- Run leases, budgets, A2A transport, approvals, tasks, and memory views are not implemented.
- The runtime consumes the mission, tool restrictions, first workspace root, and permission preset; the remaining specification fields are stored but not enforced.
- Cron and event triggers can start paid model runs; the bundle is opt-in for that reason.
- `robot_create` collects only the four basic fields; triggers, tools, permissions, budgets, memory, and agent-to-agent settings remain editor-only.

<a id="dev-note"></a>
### Dev Note

The bundle owns composition only: `cordis.patch.yml` inserts the feature rows, and no shipped profile template selects it, so installing the bundle is the opt-in. The page row is inert without a Web host and renders only while `ctx.robotRuns` is mounted; the runtime writes the `robotRun` projection that keeps a run Session out of the workspace session list.
