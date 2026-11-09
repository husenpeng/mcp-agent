# Agent Note: Robot creation as a guided flow

Status: implemented

English | [中文](2026-11-06-robot-creation-interaction.zh.md)

## Problem

Robot creation offered two paths that disagreed about interaction. The manual form opened the specification editor, where only a name was required: an unfinished draft published `New robot` / `Describe what this robot does.` and instantly became a robot that ran a stub task. The chat path sent a long meta-instruction as the user's own first message, and the `robot-creation` skill asked all four questions in one message, so the user had to answer a form in prose. After creation the user stayed in a workspace chat with no way back to the robot, and a name conflict only surfaced after the whole interview.

## Decision

Creation is a three-step flow in the robot page: what the robot does on every run, its name and one-line description, then optional success criteria and a preview. The flow asks for a real mission and name, checks name uniqueness against the registry before publishing, prefills the Workspace directory the page is viewing, and publishes plus instantiates in place. It never accepts the placeholder name or mission from `emptyRobotSpec()`; a missing answer returns to the step that needs it, and a provider rejection stays in the flow with its message. The specification editor is now an editing surface: it validates the same two required fields and keeps the advanced tab.

The chat path keeps the Session but changes the request: the page starts it with a short user-voice sentence instead of a meta-instruction. The `robot-creation` skill asks one question at a time, uses `ask_user_question` for a form card when the deployment mounts it, writes the description itself, shows the four-field draft, waits for confirmation, and only then calls `robot_create`.

`robot_create` rejects a blank or placeholder name or mission with `ROBOT_SPEC_INVALID` naming the field to collect. Its successful result carries `{ robotId, name }` as presentation metadata, and `@tomato/client-ui-robot` renders a dedicated `robot_create` tool row with **Open robot**, which selects the robot and opens the panel. That row is the way back from the creation Session.

## Alternatives considered

**Keep the editor as the only creation surface and add validation.** Validation alone fixes the placeholder robot but keeps a forty-control form as the first impression; the guided flow asks only for the decision that matters at each step and states that advanced settings keep their defaults.

**Ask the four questions in one `ask_user_question` batch.** A single form is shorter but produces four empty fields at once and no place to explain why the mission matters; one question per turn lets the model react to a vague answer before spending more of the user's attention.

**Keep the long kickoff prompt as the user message.** The prompt was visible as if the user had typed it, leaked harness vocabulary (`skill`, `robot_create`), and made the assistant repeat the same instructions back. A short request relies on the skill description for triggering.

**Let the tool accept any mission string.** The model could satisfy a required field with the placeholder, which is the exact path that produced the existing stub robot; the tool now refuses the value and tells the model which field to ask about.

## Consequences

- A robot cannot be published with the placeholder name or mission from the client flow or from `robot_create`; old records keep their values until someone edits them.
- The creation Session still leaves the robot page, because it is a real workspace Session; the created row's **Open robot** action is the documented return path.
- The tool result schema is unchanged, so existing Sessions replay; presentation metadata is additive and only the robot row reads it.
- The client flow, the skill, the tool guard, and the row are covered by `create-flow.client.spec.tsx`, `robot-create-row.client.spec.tsx`, `page.client.spec.tsx`, `config-editor.client.spec.tsx`, `robot-tool.spec.ts`, and `robot-app.spec.ts`.
- Both package READMEs and the robot subsystem page describe the flow, the one-question interview, and the row in both languages.