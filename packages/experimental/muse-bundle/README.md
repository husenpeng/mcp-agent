---
description: "Switch on account-scoped profile and workspace memory across sessions and goal-round focus together in a Web or Desktop profile."
kind: "package-bundle"
---

# @tomato/experimental-muse-bundle

English | [中文](README.zh.md)

## Summary

Give agents memory of the person across sessions: profile memories in every workspace and workspace memories in one project directory, owned by the signed-in account where the Host names accounts. Keep long goals from repeating failed calls, and show a daily recap with unfinished-task reminders. The layer inserts four Host rows: memory and its tools, goal focus, and daily insights with a notice and right-Sidebar pages. Web and Desktop ship it off and omit it from the default list. It adds four tool schemas per request and asks before tools when a profile sets `approvalTools`; insights adds no model tool.

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

In **Plugins**, open the experimental-bundle list and switch on **Memory and goal focus**. TOMATO uses the shipped copy without downloading another one. Alternatively, add the name to `tomato.profile.bundles` in the target [profile](../../boot/app-boot/README.md#profiles)'s `package.json`. With HMR enabled the selection applies live; otherwise restart the application. Switching it off removes its layer; saved memories stay in storage.

The rows need the base composition's storage, goal, approval, command, session-query, and LLM services, which every shipped Web and Desktop profile mounts. The optional timer service drives the insights background runs.

### What you get

| Row id | Package | Adds |
|---|---|---|
| `optional-memory` | [`@tomato/experimental-memory`](../memory/README.md) | `ctx.memory` over the `tomato_memory` storage domain, scoped by owner, then by profile or workspace |
| `optional-tool-memory` | [`@tomato/experimental-tool-memory`](../tool-memory/README.md) | `memory_search` with query expansion, `memory_write`, `memory_forget`, `/memory`, profile and pinned-memory injection |
| `optional-focus` | [`@tomato/experimental-focus`](../focus/README.md) | Goal-round failure ledger, repeated-failure reminders, optional per-tool approval |
| `optional-muse-insights` | [`@tomato/experimental-muse-insights`](../muse-insights/README.md) | Daily recap service, unfinished-task analysis, one frame-wide notice, and right-Sidebar pages |

To ask before costly tools, override the focus row in the profile's `cordis.patch.yml`:

```yaml
- id: optional-focus
  config:
    approvalTools: ['mcp__hicreator__*']
```

All four rows accept configuration, and each has a **Configure** page on the Plugins page: insights, memory, memory tools, and goal focus. The pages come from the browser half of [`@tomato/experimental-muse-insights`](../muse-insights/README.md#configuration), which this bundle loads, so bounds, switches, and approval patterns change without editing `cordis.patch.yml`; the Host refuses a value outside the plugin's Config range.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation details — click to expand</summary>

[`cordis.patch.yml`](cordis.patch.yml) inserts the four rows at the Host level, so their tools register in the global tool layer and every preset, including minimal, receives them. The insights row loads its browser half through the same package. Later profile patches override the rows by id. The [profile composer](../../boot/app-boot/README.md) owns patch ordering and errors.

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

[Memory service](../memory/README.md) · [Memory tools](../tool-memory/README.md) · [Goal focus](../focus/README.md) · [Muse insights](../muse-insights/README.md)

-----

<a id="model-experience"></a>
## Model Experience

Indirectly, through the memory tools, goal focus, and the insights daily-recap request, which own every tool, result, injected context, and auxiliary request.

#### KV Cache effect

The layer adds no content to conversation requests. The insights row dispatches one auxiliary daily-recap request outside every conversation, documented by [its package](../muse-insights/README.md#model-experience). Switching the layer on or off changes the tool list of live Sessions, which invalidates their cached request prefix once.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- Memory is scoped to one project directory on one Host; it does not follow a signed-in account or another device.
- A daily recap reads only Sessions created inside its lookback window, and its notices are browser-local.

-----

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Maintainer context — click to expand</summary>

None.

</details>
