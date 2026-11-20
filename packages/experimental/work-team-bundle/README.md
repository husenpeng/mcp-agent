---
description: "Optional Work Team layer: robot-based work teams with conversational robot creation, the crew canvas and team tab, and a work-team settings page."
kind: "package-bundle"
---

# @tomato/work-team-bundle

English | [中文](README.zh.md)

<a id="summary"></a>
## Summary

Add robot-based work teams on top of the Rbot bundle: describe a team's roles in chat and the `work_team_create` tool creates one robot per role and publishes the crew that wires them together. The layer mounts the crew workflow (provider, Remote controller, canvas, and the team tab), the work-team settings page, and replaces the collaboration-room tab with the work-team tab.

<a id="table-of-contents"></a>
## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

Enable **Work Team** under Plugins in Web or Desktop, on top of the Rbot bundle. The left sidebar's collaboration-room tab is replaced by the **工作团队 / Work teams** tab; its canvas opens from that tab, and **Create from chat** opens a Session whose agent builds the team with `work_team_create`. The work-team settings page (under Plugins settings) edits the default model route and confinement applied to newly created robots, and reconfigures each robot's model route.

The default route for new team robots is `blueai` / `DeepSeek-V4.1-Flash-1017`; it is live-editable in the settings page and persisted through the profile's Cordis patch. Disable the layer to remove its rows; the `tomato_crew` and `tomato_robot` storage domains keep their data, so selecting it again restores the teams and robots.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation details — click to expand</summary>

[`cordis.patch.yml`](cordis.patch.yml) disables the collaboration-room UI row and contributes the storage-backed crew provider, its Remote transport, the generated crew controller, the crew tool, the work-team tool, the crew UI package, and the work-team settings page. The work-team tool reads its live default route from its volatile Config; the settings page edits that Config through the shared configuration forms.

</details>

-----

## Model Experience

Indirectly, through the crew packages and the work-team tool, which own the member brief, the ledger, and the creation schema.

#### KV Cache effect

The layer adds no request content itself.

## Known Limitations and Deferred Work

- A crew run does not resume after a Host restart: the provider settles every non-terminal run as failed.
- Editing the team defaults does not republish robots already created; reconfigure those robots individually in the settings page.

### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>