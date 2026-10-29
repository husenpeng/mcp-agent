---
description: "Goal-round failure ledger, repeated-failure reminders, and per-tool approval for maintainers choosing, configuring, or debugging long-running goals."
kind: "package-reference"
---

# @tomato/experimental-focus

English | [中文](README.zh.md)

## Summary

Keep long goals from repeating the same failed call. During an automatic goal round, each new round carries a ledger of the goal's failures, and a call that fails the same way twice draws a reminder to change approach, ask, or report the blocker. Configured tools also ask for approval before each call. The plugin schedules no round and retries nothing; `@tomato/goal-round-driver` keeps continuation and its round limit.

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Further Exploration](#further-exploration)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

Switch on the **Memory and goal focus** bundle in Plugins; it mounts this plugin on the Host beside the goal service.

### When to choose it

Choose it when goals run unattended across many rounds and tools can fail repeatedly, for example on quota or missing data. Skip it when goals are short or every round is steered by a person. Ledger and reminders apply only after the Session's first goal round.

### Configuration

```yaml
- id: optional-focus
  name: '@tomato/experimental-focus'
  config:
    approvalTools: ['mcp__hicreator__*']
```

| Field | Default | Meaning |
|---|---|---|
| `repeatedFailureThreshold` | `2` | Consecutive identical failures of one call that draw a reminder |
| `maxLedgerEntries` | `5` | Distinct failures listed in the ledger |
| `maxMessageChars` | `200` | Characters of a failure message quoted in the ledger |
| `approvalTools` | `[]` | `*`-wildcard tool names that ask for approval before each call |

The generated [configuration catalog](../../../docs/config-catalog.md#tomatoexperimental-focus) is the exhaustive source for every accepted field.

### Failure identity

A failure is identified by the tool name, its canonical arguments, and the failure code; cancellations are not failures. Any success of a tool restarts the streaks of that tool. Nested calls inside a script count only through their outer call.

### Approval

A call whose name matches `approvalTools` asks through the composed approval service after every other pre-execute policy allows it; an earlier denial stays a denial. Without an approval service, or under an approval policy of `never`, the call is denied. Calls without an agent are not asked.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

A host-only Session projection `experimentalFocus` folds the ledger from logged events: a goal-round `user/message` of another goal resets it, a `tool/call` records the call's identity until its `tool/result`, and a failed result updates the matching entry. The ledger therefore survives resume without reading history.

The `tools/post-execute` listener runs first in the waterfall, computes the entry the result will produce, delegates, and adds its reminder to the final decision, including a downstream block. The `agent/pre-step` listener appends the ledger to a step that admits a goal-round message of the same goal.

| File | Owns |
|---|---|
| [`src/index.ts`](src/index.ts) | Projection, ledger, reminder, and approval listeners |

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

- [Goal service](../../goal/goal/README.md) — goal phases and the round limit
- [Goal round driver](../../goal/goal-round-driver/README.md) — when rounds start and stop
- [Approval service](../../interaction/user-approval/README.md) — policies and answerers
- [Repeat-call reminder](../../guard/repeat-tool-reminder/README.md) — identical calls regardless of outcome
- [Memory and goal focus bundle](../muse-bundle/README.md) — the shipped switch

-----

<a id="model-experience"></a>
## Model Experience

### Goal-round ledger

#### What the model sees

When a step admits a goal round and the goal has logged failures, one user-role snapshot follows the round message. It starts with the heading below; each failure follows as `- <tool> failed <count>× (<code>, latest in round <round>): <message>`, most recent first.

##### Ledger heading

```markdown
Failures so far in this goal (do not repeat a failed call unchanged; change the approach, ask the user, or report the blocker):
```

#### Token effect

At most `maxLedgerEntries` lines of at most `maxMessageChars` message characters per goal round with failures; rounds without failures add nothing.

#### KV Cache effect

Append-only: the ledger follows the round message and leaves the earlier prefix reusable.

### Repeated-failure reminder

#### What the model sees

When a call fails the same way `repeatedFailureThreshold` or more times in a row during a goal, a notice follows its tool result:

##### Reminder text

```markdown
The <tool> call has now failed <count> times in a row with the same arguments and the same error (<code>). Repeating it unchanged will fail again. Inspect the error, then change the arguments or the approach, ask the user for what is missing, or report the blocker.
```

#### Token effect

One short notice per repeated failure at or above the threshold.

#### KV Cache effect

Append-only, after the tool result.

### Approval denial

#### What the model sees

A denied or unanswered call returns the approval service's denial text as its tool result, for example `the user rejected tool "send_email"`.

#### Token effect

One error result per denied call.

#### KV Cache effect

Append-only, in place of the tool's own result.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **Goal rounds only** — failures outside an automatic goal round get neither ledger nor reminder.
- **Exact identity** — a call that fails again with slightly different arguments starts a new entry; near-duplicates are not grouped.
- **Name-based approval** — `approvalTools` matches tool names only; it cannot tell a read-only MCP call from a write by its arguments.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>
