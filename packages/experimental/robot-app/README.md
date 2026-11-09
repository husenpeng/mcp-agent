---
description: "The Tomato Rbot bundle: robot registry, run executor, triggers, Remote controller, sidebar roster, guided creation flow, specification editor, and a conversation surface separate from workspace chats."
kind: "package-bundle"
---
# Robot App

English | [中文](README.zh.md)

## Summary

`@tomato/experimental-robot-app` mounts the Tomato Rbot feature as one optional bundle: `@tomato/experimental-robot-local` stores specifications, robots, and runs; `@tomato/experimental-robot-runtime` executes queued runs through one Agent per run and records the run's Session; `@tomato/experimental-robot-triggers` starts runs for cron and event schedules; `@tomato/experimental-robot-templates-marketing` adds hireable marketing templates; `@tomato/api-robot-controller` exposes the registry over the `robot` Remote namespace; `@tomato/client-ui-robot` renders the card gallery of robots and templates, the sidebar roster, the guided three-step creation flow, the specification editor, and the run conversation; `@tomato/experimental-tool-robot` adds the model-facing `robot_create` tool; and the bundle registers the bundled `robot-creation` skill for creation Sessions. Profiles without this bundle are unchanged.

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

The robot page creates a robot through a guided three-step flow: what it does on every run, its name and description, then optional success criteria and a preview. Only name and task goal are required; the flow prefills the Workspace directory the page is viewing and lets the user change it from the preview. The flow publishes the specification and instantiates it in place, and refuses the placeholder name or mission from `emptyRobotSpec()`, so an unfinished draft cannot become a robot that runs a stub task. Every other block — position and authority, triggers, budgets, tools and limits, input/output, memory, and agent-to-agent settings — stays at the general default, and the editor offers them under Advanced after creation.

Conversation creation starts a new Session in the current Workspace with a short creation request. The `robot-creation` skill turns that into a one-question-at-a-time interview (the `ask_user_question` tool renders each question as a form card when the deployment has it), writes the one-line description itself, shows the four-field draft, and waits for confirmation before calling `robot_create`. The tool publishes the specification and instantiates it, so the robot appears in the roster when the call returns; a successful call also renders a transcript row naming the robot and offering **Open robot**. The skill ships with this bundle and is registered as a bundled skill, so it is available in any Workspace rather than only in this repository. `robot_create` requires a live top-level agent and a human message in the open turn, and rejects a placeholder name or mission instead of publishing a stub.

Hiring a template from the gallery publishes a user-owned specification copied from the template in the page language and instantiates it; the robot then edits and runs like any other.

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
- The runtime consumes the mission, tool restrictions, selected skills, selected MCP servers, the first workspace root, and the permission preset; memory, sandbox, network, data-class, credential, and agent-to-agent fields are stored but not enforced.
- MCP servers are mounted by the deployment as `@tomato/mcp-client` rows; a robot can select only servers the deployment already configured, and the runtime never starts one.
- Cron and event triggers can start paid model runs; the bundle is opt-in for that reason.
- `robot_create` collects only the four basic fields; triggers, tools, permissions, budgets, memory, and agent-to-agent settings remain editor-only.
- Conversation creation opens a workspace Session rather than staying inside the robot page; the created row's **Open robot** action is the path back.

<a id="dev-note"></a>
### Dev Note

The bundle owns composition only: `cordis.patch.yml` inserts the feature rows, and no shipped profile template selects it, so installing the bundle is the opt-in. The page row is inert without a Web host and renders only while `ctx.robotRuns` is mounted; the runtime writes the `robotRun` projection that keeps a run Session out of the workspace session list.
