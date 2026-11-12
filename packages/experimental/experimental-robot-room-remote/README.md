---
description: "Mounts the generated room Remote contribution in an optional client assembly."
kind: "package-reference"
---
# Robot Room Remote

English | [中文](README.zh.md)

## Summary

`@tomato/experimental-robot-room-remote` is the optional client row that mounts the generated `room` Remote contribution. The Host entry is an ordinary Loader-visible no-op so the package appears in a composition; the browser entry installs the contribution into `ctx.remote` for the plugin's lifetime. The contribution and the `ctx.roomRuns` client service live in `@tomato/api-robot-room-controller`.

## Table of Contents

- [Use this package](#use-this-package)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

Mount it after `@tomato/api-robot-room-controller` and `@tomato/api-gateway` in a client assembly:

```yaml
- name: '@tomato/experimental-robot-room-remote'
- name: '@tomato/client-ui-robot-room'
```

The browser half calls `ctx.remote.$mount(roomRemote)` and returns the unmount disposer, so disabling the row removes the namespace and every method it exposed.

## Model Experience

### Remote mount

#### What the model sees

None; the browser half calls `ctx.remote.$mount` and carries no prompt text or tool schema.

#### Token effect

None; mounting a Remote namespace does not enter a model request.

#### KV Cache effect

None; the package never writes a model request.

## Known Limitations and Deferred Work

- **No default composition** — the row is opt-in; a build that does not mount it has no `room` namespace and the Room page cannot resolve `ctx.roomRuns`.
- **One namespace** — a second controller package cannot mount a second `room` namespace in the same client.

### Dev Note

This package exists only to keep the room namespace out of the shared client assembly. The Node entry is a no-op; the browser entry is the generated contribution mount.
