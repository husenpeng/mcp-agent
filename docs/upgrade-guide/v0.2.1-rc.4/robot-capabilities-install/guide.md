---
kind: upgrade-guide
description: "Tomato Rbot specifications now declare plugins, a robot must be installed before a dependent run starts, and a robot can be deleted while keeping its specifications and runs."
---

# Robot capabilities, installation, and deletion

English | [中文](guide.zh.md)

## Change

A robot specification's `capability` block gains `plugins`, a list of plugin module names the robot depends on. Every specification published from this release carries the field; a stored version-2 revision that predates it opens with an empty list, so existing profiles keep working without a manual migration. A JSON caller that publishes a specification must now include `capability.plugins`, because the specification schema rejects unknown and missing required fields.

Installing a robot becomes an explicit step. `robot.install` resolves the declared skills, plugins, MCP servers, and permission preset against the live deployment and records the installation on the robot only when every one is available; otherwise it fails with `robot/capabilities-missing` and names each gap. A plugin counts as available when the plugin inventory reports it enabled and active. Installation verifies dependencies and never installs a plugin package. Rebinding a robot to a new revision clears the installation, so a run is never covered by a verification the user did not perform. `robot.start` refuses a specification that declares skills, plugins, or MCP servers until its bound revision is installed; runs started through `ctx.robots.start` by triggers or other Host code keep their own acceptance rules.

`robot.remove` deletes the robot instance only. Published revisions and recorded runs stay readable, and a robot that still owns a non-terminal run refuses removal until the run settles.

The model-facing tools grow with the same vocabulary. `robot_create` accepts optional `skills`, `plugins`, and `mcpServers` lists, and `robot_update` republishes only the lists a call changes on an existing robot. Creation Sessions created by the robot page also load the bundled `grilling` skill, which supplies the one-question-at-a-time interview method the `robot-creation` skill follows.

## Migration

1. Add `"plugins": []` to every `RobotSpec` payload produced by a script, integration, or saved fixture; a payload without it is rejected as an invalid specification. Stored specifications are upgraded when the robot storage domain opens.
2. Install each existing robot whose specification declares skills, plugins, or MCP servers before its next manual run. The robot page shows a **Needs install** tag on the card and an **Install** button on the robot; a missing plugin is installed from Settings → Plugins, then installation is retried.
3. Re-check any automation that starts runs through the `robot` Remote namespace rather than the robot page: a dependent robot that was never installed is reported as `robot/conflict` with `not-installed`.
4. Review creation prompts that instruct a model to collect capability choices. `robot_create` now accepts them directly; `robot_update` changes an existing robot without recreating it. A profile that mounts `@tomato/experimental-robot-app` receives the `grilling` skill with no configuration change.