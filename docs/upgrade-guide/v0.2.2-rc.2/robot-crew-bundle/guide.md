---
kind: upgrade-guide
description: "The Rbot bundle no longer mounts the crew workflow; enable the new Robot Crew bundle to keep the crew tab, canvas, controller, and agent tool."
---

# The crew workflow moved to its own bundle

English | [中文](guide.zh.md)

## Change

`@tomato/experimental-robot-app` no longer contributes the crew workflow. It keeps the robot registry, the runtime, the triggers, the templates, the robot page, and the collaboration room. The five crew rows — the storage-backed crew provider, its Remote transport, the generated crew controller, the agent crew tool, and the crew page with the canvas and group-chat tab — now live in the optional bundle `@tomato/experimental-robot-crew-bundle`.

A profile that selects only the Rbot bundle therefore shows no crew tab in the left sidebar, exposes no `crew` Remote namespace, and offers no crew tool to agents. The durable `tomato_crew` domain keeps every stored crew and run; nothing is deleted or migrated.

## Migration

1. To keep the crew workflow, add `@tomato/experimental-robot-crew-bundle` to the profile's bundle list, or enable **Robot Crew** under Plugins in Web or Desktop.
2. Confirm the left sidebar shows the group-chat tab for crews, the canvas opens from it, and an agent can call the crew tool.
3. Profiles that never used the crew workflow need no action: leaving the bundle out is the new default.