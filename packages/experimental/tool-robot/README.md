---
description: "Model-facing robot_create and robot_update tools: create a Tomato Rbot from basic fields and capability lists, then change those lists later."
kind: "package-reference"
---

# @tomato/experimental-tool-robot

English | [中文](README.zh.md)

## Summary

Adds `robot_create` and `robot_update` so a creation Session can turn four answers — name, description, mission, success criteria — plus the skills, plugins, and MCP servers the user named into a published specification and an instantiated robot, and later change those lists on an existing robot. It refuses a blank or placeholder name or mission rather than publishing a stub robot, and records the created robot's identity as presentation metadata so a Client transcript row can offer its page. Every advanced setting starts from the shared general default; later changes belong to the robot page's advanced configuration.

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
| `skills` | no | Skills the robot loads on every run |
| `plugins` | no | Plugin module names the robot depends on |
| `mcpServers` | no | MCP servers the robot may use |

One call publishes the specification and instantiates that revision, returning the robot id, specification id, and revision. Capability lists are trimmed and deduplicated; omitting one leaves the shared empty default. A robot that declares any of them must be installed on its page before its first run, because installation verifies the deployment can resolve them. The name and mission must be real answers: a blank value or the placeholder text `New robot` / `Describe what this robot does.` is rejected as `ROBOT_SPEC_INVALID` with the field to collect. Success criteria are trimmed, and an empty list is omitted. Every other field comes from `emptyRobotSpec()` in `@tomato/experimental-robot`, so a conversation-made robot and a manually created robot run the same advanced configuration. The successful result also carries `{ robotId, name }` presentation metadata on the `tool/result` event; `@tomato/client-ui-robot` renders it as a row with an **Open robot** action, without exposing that metadata to the model.

`robot_update` takes `robot` (name or id) plus any of `skills`, `plugins`, and `mcpServers`. It republishes the latest revision with only the supplied lists replaced, rebinds the robot, and tells the model the new revision needs installation; resolving a name that matches several robots asks for the id instead. Both tools refuse unless the calling agent is a live top-level agent whose open turn contains a human message; delegated and unattended turns cannot change robots. Tool registration, publication, and instantiation belong to the mounting fiber and its provider.

<a id="model-experience"></a>
## Model Experience

### robot_create and robot_update

#### What the model sees

One tool description and parameter schema per tool (`robot_create`, `robot_update`). Creation names the created robot, its specification revision, and the robot identity; an update names the republished revision and the install requirement. Provider rejections carry each invalid field path.

#### Token effect

One short schema in every request. The conversation adds only the four answers the user gave.

#### KV Cache effect

The schema is stable across turns and sessions; creation adds no system-prompt section and no per-request text beyond the tool result.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- The tools expose the four basic fields and the three capability lists. They do not expose triggers, tools, permissions, budgets, memory, or agent-to-agent settings; those remain under the robot page's advanced configuration.

<a id="dev-note"></a>
### Dev Note

`robot_create` passes the same authority check as any Host-side robot tool call — a live top-level agent with a direct human message in the open turn — before it publishes through `ctx.robots`. It records the calling Session's `cwd` as the robot's first Workspace root, so the robot works in the Workspace the conversation is in; a Session without one leaves the specification's roots empty, and the runtime resolves a fallback directory per run. The tool maps the four answers and the three capability lists onto `emptyRobotSpec()` defaults and owns no other advanced field; a field added to the editor does not change this schema.
