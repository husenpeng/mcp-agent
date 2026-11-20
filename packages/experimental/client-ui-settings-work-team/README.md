---
description: "The work-team settings page on the tomato web client's Plugins page: the defaults every work_team_create robot inherits over the tool-work-team entry, and the model route of each published robot over the client robot registry."
kind: "package-reference"
---

# @tomato/client-ui-settings-work-team

English | [中文](README.zh.md)

## Summary

Open **Plugins** in the sidebar and select **Work team** in the Official group to set the model route and confinement every robot the `work_team_create` tool creates, and to change the model of each already-published robot. The page exists while the Host serves the `tool-work-team` entry; the robot section reads the client robot registry and stays usable even when the defaults form is not ready.

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

**Team defaults** stages the four live-editable Config fields of the Host's `tool-work-team` entry: default provider, default model, permission preset, and sandbox (a choice of none, workspace, or full). Each field shows its effective value; emptying a text field and saving lets it re-inherit the composition default. One **Save** writes every staged edit as one revision-fenced mutation, and a refused save keeps the drafts with the failure reported. Leaving the page drops the drafts.

**Robot agents** lists every published robot specification with its current provider and model. Edit either input and press the row's **Save**: the page publishes a new specification revision with the updated `goal.model`, then rebinds every robot instance bound to that specification to the new revision. The row reports success or failure in place; a failed save keeps the draft so it can be corrected and retried.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

The Host half is an empty `apply`, present only so the package holds a Loader row the client module system serves the browser half for. The browser half binds the `tool-work-team` entry through `ctx.configForms.get`: `WorkTeamDefaultsCardController` stages the four fields over the shared `SettingsFormModel` of `ui-primitives`, with a sandbox field spec that admits only the three confinement levels. `workTeamCardFace` composes that form with the `ctx.robotRuns` registry source and its `publish`/`rebind` passthroughs into the one face `WorkTeamSettingsCard` renders; per-spec drafts and save outcomes are component-local state. The page registers into the Plugins page's `plugins.item` slot through `ctx.configForms.whileServed` over the entry.

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

- [ui-plugin-manager](../../client/ui-plugin-manager/README.md) — the Plugins page and the `plugins.item` slot the page registers into.
- [ui-settings](../../client/ui-settings/README.md) — the settings scope and the served-namespace watch the page rides.
- [ui-primitives](../../client/ui-primitives/README.md) — the settings form model and fields the defaults section renders.
- [tool-work-team](../tool-work-team/README.md) — the Host tool whose Config fields the defaults section edits.
- [api-robot-controller](../../api/robot-controller/README.md) — the client robot registry, publication, and rebinding the robot section drives.

-----

<a id="model-experience"></a>
## Model Experience

None, as the package is a browser-side settings surface that registers no model surface.

#### KV Cache effect

None; this package neither assembles nor sends a provider request.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **Robot rows edit only the model route** — provider and model are free text with no catalogue validation; a route the deployment cannot reach is accepted by the registry and fails at run time.
- **Rebinding reads the snapshot at save time** — a robot instance created between the publish and the rebind loop keeps its old revision until the next save.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>
