---
description: "Mounts the generated crew Remote contribution in an optional client assembly."
kind: "package-reference"
---
# Robot Crew Remote

English | [中文](README.zh.md)

## Summary

`@tomato/experimental-robot-crew-remote` is the client row that mounts the generated `crew` Remote contribution in browser assemblies that select the robot bundle. It exists separately from `@tomato/api-robot-crew-controller/client` because that service injects `remote.crew`: the namespace must be installed before a plugin may depend on it.

## Table of Contents

- [Use this package](#use-this-package)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

Select the row after `@tomato/api-robot-crew-controller` and before `@tomato/client-ui-robot-crew`. The Node half is a Loader-visible no-op; the client half mounts the contribution for the plugin's lifetime.

## Model Experience

None, as this package carries no model-visible text.

#### KV Cache effect

None; the package never enters a model request.

## Known Limitations and Deferred Work

- **Separate row is required** — a client plugin cannot mount a Remote contribution in its own apply body and still depend on that namespace as an injected service.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

The Node half is an intentional no-op so the package appears as an ordinary Loader row. The browser half mounts the generated `crew` contribution, which carries the Remote descriptors.

</details>
