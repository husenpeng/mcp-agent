---
description: "Robot Room page: durable group chat, member configuration, monitor, approvals, and loop-guard recovery."
kind: "package-reference"
---
# Robot Room UI

English | [中文](README.zh.md)

## Summary

`@tomato/client-ui-robot-room` registers the `room` page and its sidebar entry. The page lists rooms and published Rbts, renders one room's visible log, posts human messages, and inspects the breaker, per-member usage, guard limits, and settings. A member drawer edits the room-level overrides that can only narrow a robot's own capabilities; a new-room dialog assembles a first revision from published Rbts.

The page reads rooms from `ctx.roomRuns.state`, the Rbot roster from `ctx.robotRuns.state`, and issues every command through `ctx.roomRuns`. It stores only selection, draft, and transient UI state.

## Table of Contents

- [Use this package](#use-this-package)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

Mount it after `@tomato/api-robot-room-controller/client`, `@tomato/experimental-robot-room-remote`, and the Tomato Rbot bundle. The page appears as **协作空间 / Rooms** in the sidebar.

The feed distinguishes human messages, member chat, asynchronous A2A relay cards, replies, activity summaries, guard trips, and approval cards. A main-area switch offers **Chat** and **Tickets**: the ticket view lists the room's work records grouped by request thread, with the member, subject, report state, assignment rounds, and acceptance findings. The inspector has **Monitor** and **Members**; a **Settings** drawer opened from the header holds the basic configuration (routing, review, workspace directory) and the advanced numbers (loop protection, budget, context). The workspace directory field opens the Host's own folder chooser when the deployment has one and otherwise stays a typed path. The advanced section also carries the capability fields: skills, MCP servers, and tool allow and deny lists are checklists over the deployment's live catalog, and every selection narrows the member's Rbot rather than widening it. A trip banner offers **Resume**, **Relax this episode**, and **End episode**. The member drawer edits identity, role, wake rule, addressable peers, approval peers, and turn/daily budgets.

An activity row and a member message each carry the `sessionRef` the provider recorded; **Open session** on either one, or the message avatar, selects that member's full Session in the workspace. A row without a recorded reference shows no link.

The page reads messages every second while a room is selected, so a local provider needs no extra stream. Room snapshots themselves are stream-fed by the controller.

## Model Experience

### Room page

#### What the model sees

None; the page reads `ctx.roomRuns.state` and renders browser state, carrying no prompt text, tool schema, or model-visible result.

#### Token effect

None; the page never enters a model request.

#### KV Cache effect

None; the page never writes a model request.

## Known Limitations and Deferred Work

- **One-second message reads** — the page polls `messages` while selected; a message-delta stream is deferred.
- **Member add opens the Rbot panel** — the members pane links to Tomato Rbot instead of embedding a robot creator; adding a new member after creation uses the room editor.
- **Settings are a flat form** — the page edits guard, budget, context, and routing fields directly; preset switching from the design prototype is not yet exposed.

### Dev Note

The page is a single slot component with pure helpers for color, role, wake, and intent labels. All product copy lives in the `room` locale dictionary; no string is hardcoded in the component.
