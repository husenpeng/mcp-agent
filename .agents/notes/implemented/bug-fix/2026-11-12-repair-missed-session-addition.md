# Agent Note: Repair a missed Session addition from later notifications

Status: implemented

English | [中文](2026-11-12-repair-missed-session-addition.zh.md)

## Problem

A Session-list client learns collection membership from one forwarded `api-session/added` notification. Every later notification for the same Session (`api-session/status`, `api-session/activity`, `api-session/error`) only mutates an existing row. When that single addition notification is lost — a dropped forwarded-event stream, a reconnect gap, or a listing that read the store before the creation — the client holds no row and silently discards every later notification for that identity. The conversation stays invisible on that client until a reload or restart re-reads `session/list`. A phone that creates a session over the paired Host link reproduces this on the Mac desktop client.

A second, narrower case has the same effect on the same path: a row that arrives with `blank: true` stays a draft until a running status clears it, so a conversation another client wrote shows nothing when this client misses that status frame.

## Decision

`SessionManager` treats any live notification naming an unknown Session as evidence that its list is stale and asks for a list repair: one pull when no list request is in flight, or one pull after the in-flight request settles when its response may predate the notification. Each identity asks at most once per Host generation; the set clears on reconnect and on removal. Collection membership still comes only from `session/list`; a notification never fabricates a row.

A durable user-authored message (`api-session/activity`) also records the existing engagement observation, and `handleSessionAdded` applies the same `effectiveBlank` reconciliation the list path uses, so a Session announced while already running is not presented as a draft.

## Alternatives considered

**Poll the list on a timer.** The iOS client already re-reads every 60 seconds as its own repair. A background timer in the desktop client spends requests for every quiet client and still leaves an unbounded blind window.

**Merge a placeholder row from the notification.** The notification carries a Session id, not a summary; a placeholder would show a row whose title, directory, and projections come from no read, and the Host list remains the only authority for membership.

**Refresh on window focus or visibility.** Covers the user-visible case only when the client returns to the foreground; a conversation created while the window is visible and the event stream dropped stays invisible.

## Consequences

- A lost addition costs at most one extra list read per appearance of its identity; a client that received every addition reads exactly what it read before.
- The repair is client-local: no Host event, wire field, or persisted format changes.
- A Session that legitimately never enters `session/list` — a resident subagent addressed through its parent catalog, for example — is excluded from repair through the resident-instance and address checks.

## Verification

- `packages/api/session-controller/tests/manager.client.spec.ts` covers a lost addition recovered from a status and from an activity notification, the follow-up read after an in-flight pull, one repair per identity and generation, a running announcement that is not a draft, and activity ending the draft presentation.
- `packages/api/session-controller/tests/client-apply.client.spec.ts` covers the same recovery through the assembled client's `$events` stream.

## Related decisions

The [blank reconciliation note](2026-09-15-client-session-blank-reconciliation.md) owns the engagement observation this change extends; the [client Session references note](../architecture/2026-09-15-client-session-references.md) owns list refresh and retention.