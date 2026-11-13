---
kind: upgrade-guide
description: "Multi-agent collaboration is now an orchestration of published Tomato Rbot agents: the standalone canvas panel is gone, every member must bind an Rbot, and robot_crew_create takes a robot name instead of an optional specification id."
---

# Multi-agent collaboration orchestrates Rbot agents

English | [中文](guide.zh.md)

## Change

`@tomato/client-ui-robot-crew` now registers only the `collab` multi-agent collaboration page; the `crews` collaboration-canvas panel and its draggable graph are removed from the package. The page edits a collaboration by picking members from the published Tomato Rbot roster, ordering them, and chaining their handoffs; the run transcript and shared settings stay on the same page.

The collaboration specification changes with it:

| Before | After | Meaning |
|---|---|---|
| `CrewNode.at` (`{x, y}`) | removed | Canvas coordinates no longer belong to the published specification |
| `CrewNode.robot` optional | required by publication | `validateCrewSpec` stays structural; `requireRobotMembers` is the new publication rule |
| `robot_crew_create` node `robotSpec` / `robotRevision` | node `robot` (name or specification id) plus optional `robotRevision` | The tool resolves a published Rbot and never creates one |

The provider applies both rules on `publish`: a member without a published Rbot revision is rejected with its field path. Stored revisions published before the rule still open and run through the compatibility path, but they cannot be republished until every member binds an Rbot. Canvas positions in stored JSON are ignored.

## Migration

1. Remove references to the `crews` panel key from layouts, pinned sidebar entries, or automation. The `collab` key and its label are unchanged; the package no longer registers a second main panel.
2. Open each existing collaboration in **Edit** and bind every member to a published Rbot. A member row that shows **No Rbot bound** must be fixed before **Save**; publications before this release remain readable and runnable in the meantime.
3. Update prompts or integrations that call `robot_crew_create`: replace a node's optional `robotSpec`/`robotRevision` pair with required `robot` (the published Rbot's name or specification id) and keep `robotRevision` only to pin a revision other than the latest. An unknown name is rejected with the published names instead of publishing a bare agent.
4. Do not add Rbot creation to a collaboration call. Create the agents in Tomato Rbot first, then orchestrate them; the tool never authors an agent's mission or capabilities.

Verify that a new collaboration cannot be saved with an unbound member, that an existing collaboration still appears in the rail and its latest run still opens, and that a chat call with an unknown `robot` reports the published Rbot names.
