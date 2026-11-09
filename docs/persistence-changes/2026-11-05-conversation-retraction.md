---
description: "Records a persistence type transition and its compatibility acknowledgement."
kind: persistence-change
---

# 2026-11-05-conversation-retraction

English | [中文](2026-11-05-conversation-retraction.zh.md)

## Summary

Add the durable conversation/retraction event so a human can remove the trailing exchange from derived model history.

## Table of Contents

- [Declaration](#declaration)
- [Compatibility](#compatibility)
- [Verification](#verification)
- [Dev Note](#dev-note)

<a id="declaration"></a>
## Declaration

```yaml persistence-change
schemaVersion: 1
id: 2026-11-05-conversation-retraction
baseline: false
changes:
  - root: "event:conversation/retraction"
    previous: null
    after: "ed99eec168ee791a94081ab3cd56e505975271dd69177c89d7937cfb93133737"
    decision: same-version
```

<a id="compatibility"></a>
## Compatibility

New event type only. Sessions without a retraction keep their previous model history exactly. Older V4 readers meet an event type outside their known set without the ignorable marker and refuse the Session before resume, mutation, or recovery truncation, so they cannot reconstruct the retracted prompt as model input. The Session header remains V4; no existing event, property, or payload meaning changes.

<a id="verification"></a>
## Verification

Surface folds, derived history, session-query classification, V4 lifecycle relationships, command validation, and Web Chat rendering cover retraction, leaf-only enforcement, replacement-node refusal, and fork-boundary refusal. Persistence schema extraction reports the new root as an addition with no predecessor.

<a id="dev-note"></a>
## Dev Note

None.
