# Agent Note: Rbot agents own multi-agent collaboration

Status: implemented

English | [中文](2026-11-10-rbot-agent-collaboration-orchestration.zh.md)

## Problem

Multi-agent collaboration began as a canvas graph editor: the collaboration specification carried canvas coordinates (`CrewNode.at`), a member could be a bare role with no agent behind it, and the collaboration tab depended on switching to the canvas to create or edit a crew. The product model is the opposite: Tomato Rbot creates agents, and multi-agent collaboration is an orchestration of those agents. A canvas that owns the collaboration definition couples presentation state to the durable specification and lets a collaboration exist without any agent at all.

## Decision

`@tomato/client-ui-robot-crew` registers only the `collab` collaboration page; the `crews` canvas panel and its draggable graph are removed with `CrewCanvas`, the canvas geometry, and the one-sentence composer. The page adds members from the published Rbot roster, keeps them in handoff order, and saves the chain as the published edges; the settings inspector holds each member's bound Rbot revision, role, per-step task, kind, turns, and budget, plus the shared delivery, loop guard, memory, and A2A settings.

Publication requires every member to name a published Rbot revision. `validateCrewSpec` stays structural because it also runs when the provider opens its storage, so revisions published before this rule remain readable; `requireRobotMembers` is the additional publication rule the provider applies in `publish`. A stored revision without Rbot members still runs through the provider's compatibility path, and the editor requires a binding before it can republish that revision.

`CrewNode.at` leaves the vocabulary. Canvas coordinates are presentation state; stored JSON with the old field is ignored, so no data migration is needed.

`robot_crew_create` now takes a node's `robot` (name or specification id) and an optional `robotRevision`, resolves it against `ctx.robots`, and rejects an unknown Rbot with the published names instead of publishing a bare agent. The tool can orchestrate a graph; the collaboration editor intentionally exposes a linear handoff chain.

## Alternatives considered

**Keep the canvas as a read-only view.** It would keep the canvas component and its layout state alive without editing them, but the collaboration page still needed its own robot-centric editor, and the canvas would then be a second renderer of the same chain with no product owner. The desktop packaging had already removed the panel.

**Require the Rbot binding in the structural validator.** Stricter type-level validation would fail the provider's storage open for every collaboration published earlier, turning a product rule into an unavailable feature. Splitting structural validation from publication keeps old runs readable while every new publication is a real orchestration.

**Keep arbitrary graph editing in the page.** A DAG editor without a canvas needs a successor picker per member and can express fan-out. It was deferred in favor of the ordered chain so the page stays one readable list; `robot_crew_create` still publishes fan-out for callers that need it.

## Consequences

A collaboration is always an orchestration of existing agents, so creating one cannot silently author a blank agent; the empty state sends the user to Tomato Rbot instead. The product loses the canvas's drag-to-position affordance and the one-sentence composer; member order and the chain hint replace them. Chat orchestration is stricter for the model: an unknown `robot` is a rejected call with the published names as feedback. Existing revisions keep loading and running, but republishing them requires binding every member; the package and upgrade guide record that migration. The collaboration specification no longer carries presentation state, so a future view can render the same revision without changing durable data.
