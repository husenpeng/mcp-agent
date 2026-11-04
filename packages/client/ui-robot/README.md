---
description: "Tomato Rbot page: a card gallery of robots and hireable templates, the robot roster in the left sidebar, the basic and advanced specification editor, conversation creation, and a robot conversation surface separate from workspace chats."
kind: "package-reference"
---
# Robot UI

English | [中文](README.zh.md)

## Summary

`@tomato/client-ui-robot` is the Tomato Rbot plugin. It registers the `robots` panel and sidebar roster, opens on a card gallery of hired robots and templates, and renders each run as a detail bound to its Session through a `SessionProvider`: a run list beside the status strip, instruction, progress, result, and interrupt, correction, and stop controls. The editor keeps four fields and one advanced tab, saving a revision that instantiates or rebinds a robot. A creation button starts a Session with the bundled `robot-creation` skill. Registry state and calls go through `ctx.robotRuns`; the plugin holds no transport state.

## Table of Contents

- [Use this package](#use-this-package)
- [Dev Note](#dev-note)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)

-----

<a id="use-this-package"></a>
## Use this package

Mount the plugin in a browser assembly that also mounts `@tomato/api-robot-controller` and a `@tomato/experimental-robot` provider. It requires `slots`, `locale`, `layout`, `robotRuns`, `sessions`, and `uiWorkspace`.

Manual creation opens the editor on the basic tab: name, description, task goal, and success criteria. Every other block stays on the advanced tab at the general default from [`emptyRobotSpec()`](../../experimental/robot/src/spec.ts); the tabs share one draft, and a provider issue outside the basic paths switches to the advanced tab. Advanced list fields are pickers: skills, tools, MCP servers, Workspace roots, data classes, intents, and known robot names come from `robot.capabilities` and the registry, with free entry kept for a value no local source publishes. A new robot, and an existing one whose specification declares no root, starts with the Workspace directory the page is viewing, so a saved robot always names an inspectable working directory; hiring a template without roots passes the same directory. An empty source leaves only the free-entry input and explains where the value comes from. Conversation creation is offered only while the access snapshot allows `session/create`; it calls `uiWorkspace.startSession` with the robot-creation prompt, so the new Session carries the skill that interviews the user and calls `robot_create`. The page is reached from the sidebar icon or a roster row; the row opens the robot page and selects that robot.

With no robot selected, the page shows a card gallery: a search box that matches names, descriptions, and template categories; an all, running, or idle filter; the user's robots with state, description, and run count; and the registered templates. The running filter hides templates. The plus button on a template card calls `hire` with the active locale and opens the new robot; a failed hire shows its message under the gallery. Template copy follows the same locale fallback the Host uses when it publishes the hire. Cards draw role artwork selected by the robot's first recognized skill — brand, influencer, creative, or one platform's product-selection or data-insight pair — and fall back to the name's first grapheme for every other robot.

The run area is two panes. The left pane lists the robot's runs with a business state label — including `waiting` for a paused run — and its own instruction preview, and holds the input that starts a new run; while a run is still live that input is disabled and says why, because the robot has one execution slot. The right pane shows the selected run as a task: the status strip with `interrupt`, `stop`, and a technical-detail switch; the instruction that started the run; a progress list folded from the run Session's Chat nodes into business lines (read a file, ran a command, searched, an answer); and the result or failure detail. A correction input stays at the bottom: while the run is live it sends a correction into the run, and once the run is paused the same input continues it. The timeline reads the Session's registered Chat snapshot through `ctx.uiConversation.binding(sessionId).target('chat')`; the switch reveals tool names and raw arguments without a second view. The page retains the run Session under the `robotRun` reference source only while the run is selected and releases it on unmount. A run whose row has left the Client catalog — its Agent ended, so the Host withdrew the row — pulls that catalog once before retention; if the Session stays unresolvable, the pane still shows the run's status, instruction, and result, and the progress list states that the history is unavailable, instead of failing the page.

<a id="dev-note"></a>
## Dev Note

The page selection store projects `useRobotPage`, including the gallery's search text and filter; the store instance also supplies the PropsStore `actions`. Registry data is the `robotRuns` snapshot replaced by whole `robot.watch` frames, so roster and run state converge without polling. The workspace browser excludes Sessions whose summary carries the `robotRun` projection, which the runtime writes from the run's log record.

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

- The progress list folds the Chat target's nodes, so `@tomato/client-ui-chat` must be mounted; the timeline reads only its materialized nodes and does not own their definitions.
- The technical-detail switch persists in browser storage rather than in the profile's Settings, so another browser or a cleared profile starts with business language again.
- A run's token usage, cost, and produced artifacts are not summarized in the detail yet.
- Memory, sandbox, network, data-class, credential, and agent-to-agent fields are persisted but not yet enforced by the runtime; the editor states which fields apply at run time.
- Task board, approvals, A2A transport, and memory views are not implemented.
