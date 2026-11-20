---
description: "Model-facing work_team_create tool that authors the robots a team needs and publishes them as one robot crew from a conversation."
kind: "package-reference"
---
# Tool: Work Team Create

English | [中文](README.zh.md)

<a id="summary"></a>
## Summary

`@tomato/tool-work-team` registers `work_team_create`, which turns a described team into a complete, runnable work team: it creates one Tomato Rbot per member (mission, model route, and confinement) and publishes the crew that wires them together. Unlike `robot_crew_create`, which only binds already-published Rbots, this tool authors the missing agents, so describing a team's roles in chat produces both the robots and the crew. It requires a direct human turn on a top-level agent, so a delegated or unattended turn cannot create a team.

<a id="table-of-contents"></a>
## Table of Contents

- [Use this package](#use-this-package)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

Mount it where a crew provider (`ctx.crews`), an Rbot registry (`ctx.robots`), and the agent registry are available and the model should be able to build a team from a conversation. The `work-team-bundle` mounts it beside the crew layer and the work-team settings page.

The team defaults are live-editable Config fields, exposed by the work-team settings page and persisted through the profile's Cordis patch: `defaultProvider` (default `blueai`), `defaultModel` (default `DeepSeek-V4.1-Flash-1017`), `permissionPreset` (default `workspace-write`), and `sandbox` (default `workspace`). Each created robot uses these defaults unless the member names its own `provider`/`model`. Changes take effect on the next creation without a remount.

Member ids are lowercase slugs; edges must stay acyclic. When no edges are given, the members are chained in order. Robot display names are kept unique among published specifications by appending a numeric suffix on collision.

## Model Experience

### [`work_team_create`](../../../docs/tool-catalog.md#tomatotool-work-team)

#### What the model sees

The tool description asks for a team of roles and states that it creates one Rbot per member and publishes the crew that wires them together. Parameters are `name`, `mission`, `description`, `successCriteria`, `members` (`id`, `label`, `role`, `instruction`, optional `kind`, `provider`, `model`, `maxTurns`, `budgetTokens`), and `edges` (`from`, `to`, `kind`). A member that names no `maxTurns` or `budgetTokens` gets one turn and 60,000 tokens; the crew validates the range, so `maxTurns` must be 1 to 8. The result names the specification id, revision, team name, member count, and the robots it created. A rejected specification reports each field path; fewer than two members is refused by the member-count check, and sizes above it are bounded only by the crew's own node ceiling.

#### Token effect

Only the tool schema and one result append to the calling Session.

#### KV Cache effect

The tool schema is a stable prefix; only the append-only result invalidates cache after the call.

## Known Limitations and Deferred Work

- **No run start** — the tool publishes the team; starting a run remains a page action.
- **One revision per member** — each member pins the robot revision created for it; later robot revisions do not move it.
- **One-turn members by default** — the tool gives every member one turn and 60,000 tokens unless the call names `maxTurns` or `budgetTokens` for that member.
- **Defaults apply at creation** — editing the team defaults later does not republish robots already created; reconfigure those robots individually.

### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

The tool publishes robots through `ctx.robots.publish` + `instantiate` and the crew through `ctx.crews.publish`, where the same `validateCrewSpec` guards every published revision, so a team created in chat stays editable in the crew canvas. Authority checks reject any caller that is not the live driver agent of its own open turn with a direct human message.

</details>