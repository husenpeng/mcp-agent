---
kind: upgrade-guide
description: "Scheduled tasks gain a persisted pause state, so the schedule storage domain moves to version 2 and a downgraded Desktop discards those task rows."
---

# Scheduled tasks can be paused

English | [中文](guide.zh.md)

## Change

A reminder can now be paused and resumed. `@tomato/schedule` stores the state as a `pausedAt` instant on the task row, keeps the rule, and arms no timer while it is set; resuming re-anchors the rule at the resume instant. The Remote namespace gains `create`, `pause`, and `resume`, and `schedule/catalog` reports `paused` and `pausedAt` on every entry.

| Before | After | Meaning |
|---|---|---|
| `schedule/*` without a pause state | task row `pausedAt?: string`, catalog entry `paused: boolean` | A paused task stays visible and never becomes due |
| schedule domain version 1 | schedule domain version 2, compatible versions `[1]` | This reader opens version 1 rows unchanged |
| `schedule/catalog` entries without `paused` | every entry carries `paused` | A task created before pausing existed reads as `paused: false` |

## Migration

1. Nothing to edit: existing tasks open as unpaused, and the domain rewrites each file with the version 2 stamp on its next write.
2. Do not downgrade a Desktop that has written paused tasks or new tasks to a release older than this one. An older reader rejects the unknown `pausedAt` key, which fails the whole schedule domain, so reminders stop delivering until the newer Desktop runs again.
3. Integrations that read `schedule/catalog` may now see `paused: true`; treat it as "active but not armed" rather than as ended (`status: 'inactive'`).
