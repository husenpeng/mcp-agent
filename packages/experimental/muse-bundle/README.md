---
description: "Switch on account-scoped profile and workspace memory across sessions and goal-round focus together in a Web or Desktop profile."
kind: "package-bundle"
---

# @tomato/experimental-muse-bundle

English | [中文](README.zh.md)

## Summary

Give agents memory of stated preferences, decisions, and facts about the person across sessions: profile memories in every workspace and workspace memories in one project directory, owned by the signed-in account where the Host names accounts. Keep long goals from repeating failed calls. The layer inserts three Host rows: the memory service, its tools and `/memory` command, and goal focus. Web and Desktop ship it switched off and leave it out of the default plugin list. It adds three tool schemas to every request and asks for no approval until a profile configures `approvalTools`.

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

### Install into a profile

In **Plugins → Add plugin**, enter `@tomato/experimental-muse-bundle`, choose **Install**, then **Enable now**. TOMATO uses the shipped copy without downloading another one. Alternatively, add the name to `tomato.profile.bundles` in the target [profile](../../boot/app-boot/README.md#profiles)'s `package.json`. With HMR enabled the selection applies live; otherwise restart the application. Switching it off removes its layer; saved memories stay in storage.

The rows need the base composition's storage, goal, approval, and command services, which every shipped Web and Desktop profile mounts.

### What you get

| Row id | Package | Adds |
|---|---|---|
| `optional-memory` | [`@tomato/experimental-memory`](../memory/README.md) | `ctx.memory` over the `tomato_memory` storage domain, scoped by owner, then by profile or workspace |
| `optional-tool-memory` | [`@tomato/experimental-tool-memory`](../tool-memory/README.md) | `memory_search` with query expansion, `memory_write`, `memory_forget`, `/memory`, profile and pinned-memory injection |
| `optional-focus` | [`@tomato/experimental-focus`](../focus/README.md) | Goal-round failure ledger, repeated-failure reminders, optional per-tool approval |

To ask before costly tools, override the focus row in the profile's `cordis.patch.yml`:

```yaml
- id: optional-focus
  config:
    approvalTools: ['mcp__hicreator__*']
```

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation details — click to expand</summary>

[`cordis.patch.yml`](cordis.patch.yml) inserts the three rows at the Host level, so their tools register in the global tool layer and every preset, including minimal, receives them. Later profile patches override the rows by id. The [profile composer](../../boot/app-boot/README.md) owns patch ordering and errors.

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

[Memory service](../memory/README.md) · [Memory tools](../tool-memory/README.md) · [Goal focus](../focus/README.md)

-----

<a id="model-experience"></a>
## Model Experience

Indirectly, through the [memory tools](../tool-memory/README.md) and [goal focus](../focus/README.md), which own every tool, result, and injected context.

#### KV Cache effect

The layer adds no request content directly. Switching it on or off changes the tool list of live Sessions, which invalidates their cached request prefix once.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- Memory is scoped to one project directory on one Host; it does not follow a signed-in account or another device.

-----

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Maintainer context — click to expand</summary>

None.

</details>
