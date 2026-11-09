---
description: "Tomato Rbot page: a card gallery of robots and hireable templates, the robot roster nested under the Tomato Rbot sidebar row, a guided three-step creation flow, the basic and advanced specification editor, conversation creation, and a robot conversation surface separate from workspace chats."
kind: "package-reference"
---
# Robot UI

English | [中文](README.zh.md)

## Summary

`@tomato/client-ui-robot` is the Tomato Rbot plugin. It registers the `robots` panel, whose sidebar row nests the roster while open, opens on a card gallery of robots and templates, and creates a robot through a guided three-step flow or a chat Session with the bundled `robot-creation` skill. Each run renders as a conversation bound to its Session through a `SessionProvider`: a run rail beside Markdown answers, folded tool actions, and one composer that starts, corrects, or continues it. The editor edits four basic fields and advanced defaults. Registry state and calls go through `ctx.robotRuns`; the plugin holds no transport state.

## Table of Contents

- [Use this package](#use-this-package)
- [Dev Note](#dev-note)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)

-----

<a id="use-this-package"></a>
## Use this package

Mount the plugin in a browser assembly that also mounts `@tomato/api-robot-controller` and a `@tomato/experimental-robot` provider. It requires `slots`, `locale`, `layout`, `robotRuns`, `sessions`, and `uiWorkspace`.

Creation is a guided three-step flow: what the robot does on every run, its name and one-line description, then its success criteria and a preview of the draft. The first step offers example missions from the deployment's domain and requires a real answer; the name must be non-empty and unique among robots; criteria are optional. The preview names the Workspace directory the robot will start in (and can change it through the folder picker) and states that every advanced block keeps its general default, and the final button publishes the specification and instantiates it, so only name and task goal are required. The flow never publishes the placeholder name or mission from [`emptyRobotSpec()`](../../experimental/robot/src/spec.ts); an unfinished draft returns to the step that needs an answer, and a provider rejection stays on the flow with its message.

Editing an existing robot opens the specification editor: the basic tab repeats the same four fields and every other block stays on the advanced tab at its default. The tabs share one draft, and a provider issue outside the basic paths switches to the advanced tab. Advanced list fields are pickers over `robot.capabilities` and the registry, with free entry kept for a value no local source publishes. Skills, MCP servers, and Workspace roots open a modal instead of a menu: the skill list shows each skill's source folder, the MCP list names deployment-configured servers, and Workspace roots add a **Browse folders…** action that reuses `uiWorkspace.listDirectory` for browse deployments and `uiWorkspace.pickDirectory` for native ones. The other list fields — tools, credentials, callers, data classes, intents, peers — keep the inline menu. An existing robot whose specification declares no root starts in the Workspace directory the page is viewing, so a saved robot always names an inspectable working directory; hiring a template without roots passes the same directory. An empty source leaves the picker's empty hint and the free-entry input and explains where the value comes from.

Conversation creation is offered only while the access snapshot allows `session/create`. It calls `uiWorkspace.startSession` with a short creation request, so the Session opens as if the user asked in their own words and the bundled `robot-creation` skill interviews one question at a time, confirms the draft, and calls `robot_create`. A successful `robot_create` call renders its own transcript row with the created robot's name and an **Open robot** button that selects the robot and opens this panel; the row reads the tool's recorded presentation metadata, so a reopened Session keeps the shortcut. The page is reached from the sidebar icon or a roster row; the row opens the robot page and selects that robot.

With no robot selected, the page shows a card gallery: a search box that matches names, descriptions, and template categories; an all, running, or idle filter; the user's robots with state, description, and run count; and the registered templates. The running filter hides templates. The plus button on a template card calls `hire` with the active locale and opens the new robot; a failed hire shows its message under the gallery. Template copy follows the same locale fallback the Host uses when it publishes the hire. Cards draw role artwork selected by the robot's first recognized skill — brand, influencer, creative, or one platform's product-selection or data-insight pair — and fall back to the name's first grapheme for every other robot.

The run area is two panes. The left rail shows the robot's avatar, name, and running or idle state above its runs; each run row carries its business state label — including `waiting` for a paused run — and its elapsed or total time, and the rail footer explains why a new run cannot start while one still holds the execution slot. The right pane is the conversation: a header with the run's state, start age, duration, step and failure counts, and the `interrupt`, `stop`, and technical-detail controls; the instruction as a user message; consecutive tool actions folded into one process disclosure that opens while the run is live and stays folded once it settles; answers rendered as Markdown from the run Session's Chat nodes; and an outcome row or failure message at the end. One composer serves the whole flow: it starts a new run when no run is live, sends a correction into a live run, and continues a paused one, so the page has no second, separate start input. The conversation reads the Session's registered Chat snapshot through `ctx.uiConversation.binding(sessionId).target('chat')`; the technical switch reveals tool names and raw arguments inside the process rows without a second view. The page retains the run Session under the `robotRun` reference source only while the run is selected and releases it on unmount. A run whose row has left the Client catalog — its Agent ended, so the Host withdrew the row — pulls that catalog once before retention; if the Session stays unresolvable, the pane still shows the run's status, instruction, and result, and the progress list states that the history is unavailable, instead of failing the page.

<a id="dev-note"></a>
## Dev Note

The page selection store projects `useRobotPage`, including the gallery's search text, filter, and the `create` view; the store instance also supplies the PropsStore `actions`. The creation flow keeps its draft and current step in component state, so leaving it discards the draft instead of publishing anything. Registry data is the `robotRuns` snapshot replaced by whole `robot.watch` frames, so roster and run state converge without polling. The workspace browser excludes Sessions whose summary carries the `robotRun` projection, which the runtime writes from the run's log record.

<a id="model-experience"></a>
## Model Experience

### Run mission

#### What the model sees

The page itself adds nothing. A robot run's model sees the `robot:mission` system-prompt section that `@tomato/experimental-robot-runtime` assembles from the specification's mission, success criteria, stop conditions, and output acceptance.

#### Token effect

One prompt section per run, sized by the specification text the editor writes; the page adds no tokens of its own.

#### KV Cache effect

The section is stable for one revision. Publishing and rebinding a new revision changes the prompt prefix, so the next run starts a fresh cache.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- The process disclosure folds the Chat target's nodes, so `@tomato/client-ui-chat` must be mounted; the timeline reads only its materialized nodes and does not own their definitions.
- The technical-detail switch persists in browser storage rather than in the profile's Settings, so another browser or a cleared profile starts with business language again.
- A run's token usage, cost, and produced artifacts are not summarized in the detail yet.
- Memory, sandbox, network, data-class, credential, and agent-to-agent fields are persisted but not yet enforced by the runtime; the editor states which fields apply at run time.
- Task board, approvals, A2A transport, and memory views are not implemented.
- Conversation creation leaves the robot page for a workspace Session; the created row's **Open robot** button is the way back.
