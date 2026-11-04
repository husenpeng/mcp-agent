---
description: "Records a persistence type transition and its compatibility acknowledgement."
kind: persistence-change
---

# 2026-11-04-image-evidence

English | [中文](2026-11-04-image-evidence.zh.md)

## Summary

Adds the image-evidence log event and attribution kind to logged model context.

## Table of Contents

- [Declaration](#declaration)
- [Compatibility](#compatibility)
- [Verification](#verification)
- [Dev Note](#dev-note)

<a id="declaration"></a>
## Declaration

```yaml persistence-change
schemaVersion: 1
id: 2026-11-04-image-evidence
baseline: false
changes:
  - root: "event:agent/inbox/spliced"
    previous: "2026-10-29-memory-focus-attribution"
    after: "1e7476b2b4ddc982aac967cd5ad26b4d31ccfc87fb25c68e9ee4b468118f28d9"
    decision: same-version
  - root: "event:developer/message"
    previous: "2026-10-29-memory-focus-attribution"
    after: "da5aeac9717470c7e7dfddf229d82bc2064f6f235cc182fbbeddaab56ac5707a"
    decision: same-version
  - root: "event:image/evidence"
    previous: null
    after: "293fc1c00c43d7945f9069adce482ef3c4d7b08ca13d6e411800007f9c785040"
    decision: same-version
  - root: "event:session/title-llm-request"
    previous: "2026-10-29-memory-focus-attribution"
    after: "07d1980452c7af1d700aa048d87285cacfd680ae4b50a368e20aa8f7a92f4654"
    decision: same-version
  - root: "event:user/message"
    previous: "2026-10-29-memory-focus-attribution"
    after: "978741f47f1f603abc1fc38d88d0865b3d4fc66b2018739d85c72e20a27beb81"
    decision: same-version
```

<a id="compatibility"></a>
## Compatibility

Existing messages and records are unchanged; the new kind and event are only written when the image-evidence plugin is mounted. Readers without the plugin preserve the @tomato/image-evidence source kind and its JSON metadata and derive the recorded text as ordinary context, as with the earlier plugin attribution kinds. The image/evidence event is a durable log-only record: it never carries surfaceOp, adds no model history, and only the plugin's own projection folds it; it carries engine identity, attempt outcomes, and usage, not image bytes. The kind marks the input of the auxiliary vision request and grants no authority or replay interpretation.

<a id="verification"></a>
## Verification

pnpm exec vitest run packages/llm/image-evidence packages/core/session/tests: 27 test files and 610 tests passed, including the composition test that reads image/evidence back from the session log and the projection test that folds it.

<a id="dev-note"></a>
## Dev Note

None.
