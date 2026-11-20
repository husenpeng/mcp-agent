---
description: "Optional Robot Crew layer: crew providers, Remote controller, agent tool, and the crew canvas with its group-chat tab."
kind: "package-bundle"
---

# @tomato/experimental-robot-crew-bundle

English | [中文](README.zh.md)

## Summary

Add the multi-agent crew workflow on top of the Rbot bundle: a versioned handoff graph, a durable run ledger, the crew canvas, and the group-chat tab that starts a run and reads its transcript. The layer ships switched off and also mounts the agent-facing crew tool.

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

Enable **Robot Crew** under Plugins in Web or Desktop. The left sidebar then gains the group-chat tab for crews, its canvas page opens from that tab, and agents can accept a crew specification through the crew tool. Disable it to remove all five rows; the `tomato_crew` storage domain keeps its data, so selecting the layer again restores the crews and their runs.

The Rbot bundle stays independent: it carries the robot registry, the robot page, and the collaboration room, and never mounts a crew row on its own.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation details — click to expand</summary>

[`cordis.patch.yml`](cordis.patch.yml) contributes the storage-backed crew provider, its Remote transport, the generated crew controller, the agent tool, and the crew UI package. The provider opens the durable `tomato_crew` domain and executes accepted runs on the Host; the page is inert without a Web host and renders only while its client service is mounted.

</details>

-----

<a id="model-experience"></a>
## Model Experience

Indirectly, through the crew packages, which own the member brief, the ledger, and the loop guard.

#### KV Cache effect

The layer adds no request content itself.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- A crew run does not resume after a Host restart: the provider settles every non-terminal run as failed.
- The group-chat tab reads crew runs only; the collaboration room is a separate product surface with its own wiring.

### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>