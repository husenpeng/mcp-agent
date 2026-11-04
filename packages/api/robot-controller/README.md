---
description: "Host robot Remote controller: whole registry snapshots, specification publication, instantiation, rebinding, and run control mirrored to the browser."
kind: "package-reference"
---
# Robot Controller

English | [中文](README.zh.md)

## Summary

`@tomato/api-robot-controller` owns the Host `ctx.robotController` service and the generated Client `ctx.remote.robot` namespace over the `@tomato/experimental-robot` seam. `robot.watch` streams whole registry frames — the latest revision of every specification, every robot, every run, and every registered template — once on open and after each `robot/changed` event. `publish`, `instantiate`, `rebind`, `start`, `cancel`, `interrupt`, `correct`, `hire`, and `capabilities` mirror the seam's operations: a rejected specification arrives as `robot/spec-invalid` carrying the provider's field issues, a missing record as `robot/not-found`, and a refused state change as `robot/conflict`. The Client half installs `ctx.robotRuns`, the snapshot and control service a robot page renders.

## Table of Contents

- [Use this package](#use-this-package)
- [Dev Note](#dev-note)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)

-----

<a id="use-this-package"></a>
## Use this package

Mount the Host controller after a `@tomato/experimental-robot` provider: it injects `robots` and `typert`, and the generated `robot` namespace is the only surface browsers use. `robot.watch(signal)` has no natural end while mounted; the carrier closes it, and a reconnected generation's first frame already carries the whole registry. Every request and value shape is JSON, so a client re-renders from a frame without any additional read.

`interrupt` records a run as `waiting` and aborts its active turn while keeping the inbox, so the Agent and its Session stay alive; `correct` delivers a message into that run's own live Agent — the next turn while waiting, steering while running — and records `running` again. Both refuse a run whose Agent is no longer executing, so a correction never cold-resumes a Session no executor settles.

`hire` reads the template from the optional `robotTemplates` registry, fills its copy for the requested locale, gives a template without Workspace roots the caller's `workspaceRoot` when supplied, and names the robot after the localized template name; when that name is taken it appends ` 2`, ` 3`, and so on. An explicit `name` is used as given and conflicts like any publication. An unknown template, or a deployment without the registry, is `robot/not-found`; frames then carry an empty `templates` list.

`capabilities` projects the local choices the specification editor offers as options: skills visible to the requested Workspace, registered tool names, configured MCP server names, and Workspace directories. Every source is optional, so a deployment without one contributes an empty list instead of failing the read; the Client passes the viewed Session's directory so project skills apply.

The Client entry mounts only where the assembly selected `remote.robot`; it opens one reconnecting snapshot stream for the app lifetime and exposes the RPC passthroughs as `RemoteResult` values. The service is named `robotRuns` so the browser context keeps its future `ctx.robots` slot free for a client-side domain service.

<a id="dev-note"></a>
## Dev Note

The controller holds no state: reads are `ctx.robots` projections and `watch` re-reads after `robot/changed`. The seam owns validation and persistence; the controller only translates failures into Remote codes and shapes whole-set frames. Wire types live in `src/types.ts`, which imports the domain vocabulary through `@tomato/experimental-robot/types` so the client bundle never reaches Host runtime code.

<a id="model-experience"></a>
## Model Experience

None, as the namespace only carries browser control-plane calls and registry snapshots; the runtime package assembles the model context of a robot run.

#### KV Cache effect

The controller never assembles or sends provider requests.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- `robot.watch` pushes whole registry frames; there is no per-record subscription, delta frame, or pagination, and a large registry ships in every frame.
- Run retention and history pruning are the provider's business; the controller returns whatever `ctx.robots.runs` lists.
- Remote access roles are not declared for robot operations; deployments that need them must add a resource kind before exposing the namespace to untrusted Peers.
