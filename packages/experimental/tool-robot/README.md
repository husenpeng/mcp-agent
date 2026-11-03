---
description: "Model-facing robot_create tool that publishes and instantiates a Tomato Rbot from the four basic fields."
kind: "package-reference"
---

# @tomato/experimental-tool-robot

English | [中文](README.zh.md)

## Summary

Adds one `robot_create` tool so a creation Session can turn four answers — name, description, mission, success criteria — into a published specification and an instantiated robot. Every advanced setting starts from the shared general default; later changes belong to the robot page's advanced configuration.

## Table of Contents

- [Use this package](#use-this-package)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)

-----

<a id="use-this-package"></a>
## Use this package

The `@tomato/experimental-robot-app` bundle inserts this row beside the robot registry:

```yaml
- id: robot-tool
  name: '@tomato/experimental-tool-robot'
```

The plugin requires `agents`, `robots`, and `tools`. The bundle also ships the `robot-creation` skill that guides the interview, so selecting the bundle adds both surfaces.

| Parameter | Required | Meaning |
|---|---|---|
| `name` | yes | Display name, unique among robots |
| `description` | no | One-line summary |
| `mission` | yes | Purpose every run pursues |
| `successCriteria` | no | Observable conditions a run must meet |

One call publishes the specification and instantiates that revision, returning the robot id, specification id, and revision. Every other field comes from `emptyRobotSpec()` in `@tomato/experimental-robot`, so a conversation-made robot and an untouched basic form run the same configuration.

The tool refuses unless the calling agent is a live top-level agent whose open turn contains a human message; delegated and unattended turns cannot create robots. Tool registration, publication, and instantiation belong to the mounting fiber and its provider.

<a id="model-experience"></a>
## Model Experience

### robot_create

#### What the model sees

One `robot_create` tool description and parameter schema. The result names the created robot, its specification revision, and the robot identity; provider rejections carry each invalid field path.

#### Token effect

One short schema in every request. The conversation adds only the four answers the user gave.

#### KV Cache effect

The schema is stable across turns and sessions; creation adds no system-prompt section and no per-request text beyond the tool result.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- This tool collects only the four basic fields. It does not expose triggers, tools, permissions, budgets, memory, or agent-to-agent settings; those remain under the robot page's advanced configuration.

<a id="dev-note"></a>
### Dev Note

`robot_create` passes the same authority check as any Host-side robot tool call — a live top-level agent with a direct human message in the open turn — before it publishes through `ctx.robots`. The tool maps the four answers onto `emptyRobotSpec()` defaults and owns no advanced field; a field added to the editor does not change this schema.
