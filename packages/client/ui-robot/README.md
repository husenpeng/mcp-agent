---
description: "Tomato Rbot page: the robot roster in the left sidebar, the basic and advanced specification editor, conversation creation, and a robot conversation surface separate from workspace chats."
kind: "package-reference"
---
# Robot UI

English | [中文](README.zh.md)

## Summary

`@tomato/client-ui-robot` is the Tomato Rbot browser plugin. It registers the `robots` panel and its `sidebar.panellist` icon, fills the `sidebar.robots` seat with defined robots, and renders each run's conversation through a `SessionProvider` on the run's Session, keeping robot conversations out of the workspace list. The editor opens on four basic fields, keeps advanced blocks on one tab, maps provider field issues onto the owning panel, and saves a revision that instantiates or rebinds a robot. A creation button starts a Session with the bundled `robot-creation` skill. Registry state and control calls go through `ctx.robotRuns`; the plugin holds no transport state.

## Table of Contents

- [Use this package](#use-this-package)
- [Dev Note](#dev-note)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)

-----

<a id="use-this-package"></a>
## Use this package

Mount the plugin in a browser assembly that also mounts `@tomato/api-robot-controller` and a `@tomato/experimental-robot` provider. It requires `slots`, `locale`, `layout`, `robotRuns`, `sessions`, and `uiWorkspace`.

Manual creation opens the editor on the basic tab: name, description, task goal, and success criteria. Every other block stays on the advanced tab at the general default from [`emptyRobotSpec()`](../../experimental/robot/src/spec.ts); the tabs share one draft, and a provider issue outside the basic paths switches to the advanced tab. Conversation creation is offered only while the access snapshot allows `session/create`; it calls `uiWorkspace.startSession` with the robot-creation prompt, so the new Session carries the skill that interviews the user and calls `robot_create`. The page is reached from the sidebar icon or a roster row; the row opens the robot page and selects that robot.

The page's robot conversation is the shared embedded Conversation factory, switched to the fixed chat view and wrapped in a SessionProvider for the selected run's `sessionId`. The page retains that Session under the `robotRun` reference source only while the run is selected and releases it on unmount.

<a id="dev-note"></a>
## Dev Note

The page selection store projects `useRobotPage`; the store instance also supplies the PropsStore `actions`. Registry data is the `robotRuns` snapshot replaced by whole `robot.watch` frames, so roster and run state converge without polling. The workspace browser excludes Sessions whose summary carries the `robotRun` projection, which the runtime writes from the run's log record.

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

- The robot runtime executes one turn per run; the conversation is a run transcript, and starting another run is the way to continue.
- Many specification fields are persisted but not yet enforced by the runtime; the editor does not mark them.
- Task board, approvals, A2A transport, and memory views are not implemented.
