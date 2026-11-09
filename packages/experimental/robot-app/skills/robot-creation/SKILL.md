---
name: robot-creation
description: Use when the user wants to create, set up, or add a Tomato Rbot (机器人), including a robot creation session started from the robot page. Interview one question at a time, confirm a concrete draft, then create the robot with robot_create.
---

# Create a robot

Turn a vague wish into one runnable robot by interviewing the user **one
question at a time**. A robot created from guessed or placeholder text looks
ready but runs the wrong task, so asking is cheaper than recreating it.

## Ask one question, then wait

Ask only the next question that unlocks the rest; do not list every question
at once. If the user already answered something, keep that answer and do not
ask again.

1. **What should it do, every run?** Start from what the user already said. If
   that is missing, ask what the robot should accomplish in one run and give
   one concrete example from their domain. When the answer is too vague to act
   on ("帮我干活", "做营销"), ask one follow-up for the object, the deliverable,
   and how often it should run.
2. **What should we call it?** Propose two or three short names built from the
   mission; the user may choose one or write their own. Names are unique among
   robots.
3. **How do we know a run succeeded?** Offer two or three observable checks
   derived from the mission. The user may pick, rewrite, or skip them; never
   invent criteria without asking.

Write the one-line description yourself from the mission and show it in the
draft; do not spend a turn asking for it.

When the `ask_user_question` tool is available, use it for each question: one
question per call, with a few concrete options and free text. It renders as a
form card instead of a wall of prose. Without it, ask the same single question
in plain text.

## Confirm the draft

Before calling the tool, show a compact draft and ask "就按这个创建吗？":

- **名称**
- **一句话描述**
- **每次运行做什么**
- **成功标准**（可以为空）

Wait for confirmation. If the user changes anything, update the draft and
confirm again. Do not create while the mission is still vague.

## Create

Call `robot_create` with `name`, `description`, `mission`, and
`successCriteria`. Never pass the placeholder text
`Describe what this robot does.` or a name such as `New robot`; when you do not
have a real answer, ask for it.

If the result reports `ROBOT_SPEC_INVALID`, correct exactly the named fields and
retry once. If it reports a name conflict (`robot/conflict`), propose one
alternative name and ask before retrying.

## Tell the user where the robot is

After the tool returns, reply with:

1. The robot's name and that it is ready to run.
2. Where it lives: the **机器人** panel in the sidebar; open its card to see
   「运行记录」.
3. One concrete first instruction they can send, written for this robot's
   mission.
4. That **运行方式、工具与权限、预算、触发器等高级项使用通用默认值，可在机器人页的
   「高级配置」里修改**.

Do not start a run yourself; runs start from the robot page.

## Out of scope

Do not interview about tools, permissions, budgets, schedules, memory, or
agent-to-agent settings. If the user asks for them now, create the robot from
the basic answers first, then say where to change them. Create one robot per
request, in the user's language.
