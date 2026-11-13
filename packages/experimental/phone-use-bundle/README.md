---
description: "Optional profile layer that adds iPhone control to a tomato --profile surface."
kind: "package-bundle"
---

# @tomato/experimental-phone-use-bundle

English | [中文](README.zh.md)

## Summary

Adds iPhone control to a profile: two tools that observe and operate an attached phone, and on macOS the device manager that renews and launches the runner. Pair the phone once in the Tomato Remote application and the `phone` namespace carries every command; nothing listens on the device. The layer owns no behavior itself — each row's package does.

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Further Exploration](#further-exploration)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

Add the layer to a profile that already carries the base composition, then point `iosProjectDir` at a source checkout before relying on renewal.

### Install into a profile

```text
tomato plugin --profile <name> add @tomato/experimental-phone-use-bundle
tomato plugin --profile <name> remove @tomato/experimental-phone-use-bundle
```

### What you get

| Row | Owner | Surface |
|---|---|---|
| `phone-use` | `@tomato/experimental-phone-use` | `phone_observe`, `phone_act`, the `phone` namespace. |
| `phone-use-macos` | `@tomato/experimental-phone-use-macos` | Renewal, launch, and the `phoneDevice` namespace; macOS only. |

Without a paired phone the tools answer `没有已连接的手机` and nothing else changes.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

The patch inserts two rows. `phone-use-macos` carries `!!js process.platform !== 'darwin'`, so other platforms skip it silently. A profile overrides either row by id, and the last write wins per row.

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

- [Phone tools](../phone-use/README.md): observation, actions, and confirmation.
- [Device manager](../phone-use-macos/README.md): renewal and launch on the Mac.
- [Base bundle](../../bundle/base/README.md): the composition this layer extends.

-----

<a id="model-experience"></a>
## Model Experience

Indirectly, through the inserted rows: `phone-use` owns the tools the model sees.

#### KV Cache effect

None.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- The bundle installs and launches no runner; the device manager row does, and only on macOS.
- `iosProjectDir` has no default: a packaged Desktop carries no `apps/ios` sources.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>
