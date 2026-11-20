---
description: "The team's tickets beside the conversation — submit work, watch the flow live, and step in mid-run."
kind: "package-reference"
---

# @tomato/client-ui-superagent

English | [中文](README.zh.md)

## Summary

Registers a right-sidebar page over the Host team's `superagentTickets` Remote. A composer submits a request to the team; the list follows every committed change live and shows each ticket's subject, stage, what it waits on at a person, the state its last run reported, review rounds, and blocking findings. Selecting a ticket opens its flow — authorization, every run and report, the latest review, and the thread messages — with controls to cancel the in-flight run, stop the ticket, or send new context that the next run continues from. The panel asks no model.

## Table of Contents

- [Use this package](#use-this-package)
- [Dev Note](#dev-note)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)

-----

<a id="use-this-package"></a>
## Use this package

Mount it beside `@tomato/superagent-runtime` in a Web profile:

```yml
- insert:
    - id: client-ui-superagent
      name: '@tomato/client-ui-superagent'
```

The page appears in the right sidebar of any Session, titled **Team tickets**. Opening the page reads the Host's durable ticket store and starts following its `watch` stream; **Refresh** reads the list again. A failed first read offers **Retry**, and a failed read or dropped stream keeps the previous rows visible.

Type a request and press **Submit**: the team admits it, plans it, and runs it in the background; a declined or refused request stays visible with its reason. Select a row to read the whole flow. While a run is in flight, **Cancel run** aborts it and leaves the ticket open; **Stop ticket** ends it for good. The message box sends context or an answer to the ticket's thread, and the next run reads it as the latest instruction.

-----

<a id="dev-note"></a>
## Dev Note

<details>
<summary>Implementation internals — click to expand</summary>

The client half mounts the generated Remote contribution from `@tomato/superagent-runtime/remote`, then registers the panel after `remote.superagentTickets` becomes available. One Host read controller owns the identity-stable snapshot: concurrent list reads share a request, the `watch` stream publishes each frame, disposal cancels the active read and stream, and late settlements do not overwrite state. Each successful mutation refreshes the list; the detail read refetches when the selected ticket's rows change.

</details>

-----

## Model Experience

None, as no model request carries this page's text.

#### KV Cache effect

None: the page never runs a turn.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **One selected ticket.** The flow view opens one ticket at a time; there is no multi-ticket comparison.
- **Cancel reaches the work run only.** While the team plans or reviews, the ticket has no open assignment and the cancel control is absent; the Host refuses a cancel with `superagent/not-running`.
- **No merge control.** A reviewed ticket waits for a person; merging belongs to a surface this panel does not own.