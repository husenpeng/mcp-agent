---
name: robot-creation
description: Use when the user asks to create, set up, or add a Tomato Rbot (机器人), including a robot creation session started from the robot page. Interview the user for the four basic answers and create the robot with robot_create.
---

# Create a robot

Create one Tomato Rbot from four basic answers. Every other setting starts from
the general default; do not interview about advanced configuration.

## Ask once

Ask all four questions in one message, with one short example each:

1. **Name** — short and unique among robots.
2. **Description** — one sentence; the user may skip it.
3. **Mission** — what the robot should accomplish on every run.
4. **Success criteria** — how we know a run worked; may be empty.

Accept partial answers and fill the missing wording with something sensible.
Do not ask about tools, permissions, budgets, schedules, memory, or
agent-to-agent settings.

## Create

Summarize the four answers in one short message, then call `robot_create`:

- `name` and `mission` are required;
- pass `description` and `successCriteria` only when the user gave them.

After the tool returns, tell the user the robot is ready, name it, and say that
**运行方式、工具与权限、预算、触发器等高级项使用通用默认值，可在机器人页的「高级配置」里修改**.

## When the user asks for advanced settings now

Say the creation flow collects only the four basic fields; the setting can be
changed on the robot page under 高级配置 after creation. Create the robot first
unless the user asks otherwise.

## Failure

If `robot_create` reports `ROBOT_SPEC_INVALID` with field paths, correct only
those fields and retry once; otherwise report the message plainly.
