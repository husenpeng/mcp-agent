---
description: "Model-facing robot_crew_create tool that orchestrates published Tomato Rbot agents into a crew from a conversation."
kind: "package-reference"
---
# Tool: Robot Crew Create

English | [中文](README.zh.md)

## Summary

`@tomato/experimental-tool-robot-crew` registers `robot_crew_create`, which orchestrates published Tomato Rbot agents into a crew specification from a name, mission, success criteria, two to six members, and their handoffs. Every member names the existing Rbot it runs as, resolved by name or specification id from the deployment's Rbot registry; the tool never creates an agent. It requires a direct human turn on a top-level agent, so a delegated or unattended turn cannot publish a crew. Chat orchestration and the collaboration editor therefore produce the same versioned specification.

## Table of Contents

- [Use this package](#use-this-package)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

Mount it where a crew provider (`ctx.crews`) and an Rbot registry (`ctx.robots`) are available and the model should be able to orchestrate agents from a conversation. Member ids are lowercase slugs; edges must stay acyclic. Each member's `robot` names a published Rbot by name or specification id, and an optional `robotRevision` pins one revision; an unknown Rbot is rejected with the published names.

## Model Experience

### `robot_crew_create`

#### What the model sees

The tool description asks for a small graph of published Rbot agents and states that every member shares the mission and extracted memory. Parameters are `name`, `mission`, `description`, `successCriteria`, `nodes` (`id`, `label`, `role`, `instruction`, `kind`, required `robot`, optional `robotRevision`), and `edges` (`from`, `to`, `kind`). The result names the specification id, revision, crew name, and member count; a rejected specification reports each field path, and an unknown Rbot reports the published names.

#### Token effect

Only the tool schema and one result append to the calling Session.

#### KV Cache effect

The tool schema is a stable prefix; only the append-only result invalidates cache after the call.

## Known Limitations and Deferred Work

- **No run start** — the tool publishes a crew; starting it remains a page action.
- **No agent creation** — every member must already exist in Tomato Rbot; the tool cannot author a new agent's mission, capabilities, or permissions.
- **One revision per member** — a member pins one Rbot revision at publication; later Rbot revisions do not move it.
- **One-turn members** — the tool fixes every member at one turn and the recommended token ceiling.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

The tool publishes through `ctx.crews`, where the same `validateCrewSpec` guards every published revision, so a crew created in chat stays editable in the canvas studio. Authority checks reject any caller that is not the live driver agent of its own open turn.

</details>
