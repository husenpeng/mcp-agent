---
description: "The team's tickets beside the conversation — one read-only row per ticket with where it stands."
kind: "package-reference"
---

# @tomato/client-ui-superagent

English | [中文](README.zh.md)

## Summary

Registers a right-sidebar page that lists the team's tickets for the Session you are reading. It renders only what the runtime already logged: the page reads the newest `plugin:superagent/tickets` record in that Session's event window and shows each ticket's subject, where it stands, what it waits on at a person, the state its last run reported, how many reviews it had, and how many findings still block it. The panel is read-only and asks no model.

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)

-----

<a id="use-this-package"></a>
## Use this package

Mount it in a Web profile beside the workspace rows:

```yml
- insert:
    - id: client-ui-superagent
      name: '@tomato/client-ui-superagent'
```

The page appears in the right sidebar of any Session, titled **Team tickets**. Until the runtime has written a list, the page says so instead of rendering an empty table.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

The client half reads rows from the Session's own event window (`latestTickets` takes the newest record), so it needs no Host endpoint and adds no Remote namespace. Malformed records are dropped field by field rather than trusted, and a record that is not an array yields no rows.

The panel subscribes per Session and caches one source per Session identity; the last subscriber removes the subscription.

</details>

-----

## Model Experience

None, as no model request carries this page's text.

#### KV Cache effect

None: the page never runs a turn.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **It shows the Session you opened.** The runtime writes the list into the supervising Session, so a different Session's sidebar shows its own (empty) list until the team runs there; reading the team's list from any Session needs a Host Remote.
- **It cannot act.** The panel offers no confirm, retry, or stop control: a ticket's next step belongs to the engine and, where required, to a person acting elsewhere.
