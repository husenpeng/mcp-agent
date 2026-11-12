---
description: "Robot Room Remote stream, publication, posting, approval, and message reads for browser clients."
kind: "package-reference"
---
# Robot Room Controller

English | [中文](README.zh.md)

## Summary

`@tomato/api-robot-room-controller` owns the generated `room` Remote namespace. The Host controller streams current rooms as whole frames and exposes publication, human posting, pause/resume, relax/end, approval, and message reads. The client half installs `ctx.roomRuns`, one reconnecting snapshot stream plus RPC passthroughs. The controller holds no domain state; every read projects `ctx.rooms`.

## Table of Contents

- [Use this package](#use-this-package)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

Mount the Host controller after `@tomato/experimental-robot-room-local`, and the client contribution through `@tomato/experimental-robot-room-remote`:

```yaml
- name: '@tomato/experimental-robot-room-local'
- name: '@tomato/api-robot-room-controller'
- name: '@tomato/experimental-robot-room-remote'
- name: '@tomato/client-ui-robot-room'
```

The Host methods are `rooms`, `room`, `publish`, `post`, `messages`, `pause`, `resume`, `relaxOnce`, `endEpisode`, `approve`, and the `watch` stream. A publication rejection carries `room/spec-invalid` with every field issue; unknown records carry `room/not-found`; a refusal from a room's current state carries `room/conflict`.

The client service exposes `ctx.roomRuns.state` with `{ rooms }` and the same methods, each returning `RemoteResult`.

## Model Experience

### Room Remote

#### What the model sees

None; the controller exposes `ctx.roomRuns` as a browser-facing projection and carries no system-prompt text or tool schema.

#### Token effect

None; no controller operation enters a model request.

#### KV Cache effect

None; the controller never writes a model request.

## Known Limitations and Deferred Work

- **Whole-room frames** — `watch` yields every room on each change; a room with hundreds of messages still gets its messages through a separate `messages` read, not the frame.
- **No optimistic concurrency** — publication does not carry an expected revision; the last writer replaces the spec, and the provider's revision counter is the only ordering.
- **Polling fallback** — the client snapshot is stream-fed, but the page still reads messages on a one-second interval because the stream does not carry message deltas.

### Dev Note

The Host controller is a thin `TypertRemoteService`; every method delegates to `ctx.rooms`. The client service follows the crew controller pattern: one `$stream` generation feeding a `RoomRunsModel`, with RPC methods returned as `RemoteResult` so the page never wraps a carrier failure.
