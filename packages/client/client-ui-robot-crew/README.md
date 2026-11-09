---
description: "Tomato Rbot crew studio: a workflow canvas, member and guardrail inspector, one-sentence composition, and a live flow ledger."
kind: "package-reference"
---
# Robot Crew Studio

English | [中文](README.zh.md)

## Summary

`@tomato/client-ui-robot-crew` registers the `collab` collaboration tab and the `crews` canvas studio, each with a sidebar entry. The collaboration tab lists every published crew as a group chat, creates one by hand, from chat, or from the development template, starts a task, and renders the run as a transcript of member reports and the lead's answers. The studio shows the roster as chips, a draggable workflow canvas with handoff edges, a crew, member, or handoff inspector, a one-sentence composer, and a live flow ledger for the selected run. Registry and run state come from `ctx.crewRuns`; the plugin keeps only viewing state.

## Table of Contents

- [Use this package](#use-this-package)
- [Dev Note](#dev-note)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)

-----

<a id="use-this-package"></a>
## Use this package

Select the row after `@tomato/api-robot-crew-controller` and `@tomato/experimental-robot-crew-remote`. The page needs the robot roster to offer robot bindings; without a selected robot every member runs on default capabilities. "Compose in chat" opens a Session whose agent can call `robot_crew_create`; the new crew appears in the roster when the tool publishes it.

The collaboration tab lists published crews as group chats. "New group chat" opens the canvas; "Create from chat" opens a Session whose agent publishes with `robot_crew_create`; "Create a development group" publishes a five-member crew where the lead agent assigns work, build, test, and review each deliver, and the lead agent returns the next round. The composer starts a run with the task text. The transcript is that run's flow ledger with member labels, so step results read as reports and handoffs name both sides. The final dispatch can be reused as the next task; dispatching it starts a new run rather than continuing the same one.

The inspector edits the mission, success criteria, stop conditions, run prompt, workspace, loop limits, memory budget, and A2A admission. Every change is local until Save publishes a revision. Run requires a saved revision and opens the ledger.

<a id="dev-note"></a>
## Dev Note

The page stages editor state in its own controllers; the roster and run ledgers arrive through `ctx.crewRuns`, while publication and run verbs stay on the generated `crew` Remote namespace. Canvas layout is client-only and not persisted. Wire types come from `@tomato/experimental-robot-crew/types`, so the bundle never reaches Host runtime code.

<a id="model-experience"></a>
## Model Experience

None, as this package renders browser state and carries no model-visible text.

#### KV Cache effect

None; the package never enters a model request.

## Known Limitations and Deferred Work

- **Canvas is not zoomable** — members can be dragged and auto-laid-out, but a large graph can require scrolling.
- **No inline run answers** — the ledger shows step text; member conversations open through their Session records, which this page does not embed.
- **One-sentence composition is deterministic** — it splits clauses and chains them; deeper composition goes through chat.
