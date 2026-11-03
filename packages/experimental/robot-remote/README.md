---
description: "Mounts the generated robot Remote contribution in an optional client assembly."
kind: "package-reference"
---
# Robot Remote

English | [中文](README.zh.md)

## Summary

`@tomato/experimental-robot-remote` is the client row that mounts the generated `robot` Remote contribution in browser assemblies that select the robot bundle. It exists separately from `@tomato/api-robot-controller/client` because that service injects `remote.robot`: the namespace must be installed before a plugin may depend on it. Keeping the mount in this optional row also keeps the shared client assembly free of any robot package reference.

## Table of Contents

- [Use this package](#use-this-package)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)

-----

<a id="use-this-package"></a>
## Use this package

Mount the plugin in a browser assembly that also mounts `@tomato/api-robot-controller`. It requires `remote`; its only behavior is `ctx.remote.$mount(robotRemote)`, returning the contribution disposer as its unload effect.

<a id="model-experience"></a>
## Model Experience

None, as the plugin mounts browser Remote descriptors and adds no model-visible input.

#### KV Cache effect

None; the plugin never assembles or sends provider requests.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- The contribution mounts once per plugin instance; a second row mounting the same contribution is rejected by the Gateway as a duplicate method.
- The fragment descriptor is generated from the Host face, so this package must be rebuilt with `pnpm run generate-typert` whenever `@tomato/api-robot-controller` changes its Remote methods.

<a id="dev-note"></a>
### Dev Note

The row exists so the mount follows the bundle selection instead of the shared client assembly: `@tomato/api-robot-controller/client` injects `remote.robot`, so this package must install the namespace before that service activates. The descriptor is generated from the Host face, so a build that changes the controller's Remote methods requires `pnpm run generate-typert` here.
