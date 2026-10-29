---
description: "Records a persistence type transition and its compatibility acknowledgement."
kind: persistence-change
---

# 2026-10-29-memory-focus-attribution

English | [中文](2026-10-29-memory-focus-attribution.zh.md)

## Summary

Adds the experimental-memory and experimental-focus attribution kinds to logged model context.

## Table of Contents

- [Declaration](#declaration)
- [Compatibility](#compatibility)
- [Verification](#verification)
- [Dev Note](#dev-note)

<a id="declaration"></a>
## Declaration

```yaml persistence-change
schemaVersion: 1
id: 2026-10-29-memory-focus-attribution
baseline: false
changes:
  - root: "event:agent/inbox/spliced"
    previous: "2026-10-28-tomato-namespace"
    after: "edd257f0e29e7f57c5f5d131e95dd8ef0c69aa73a86753971005b471f850c3db"
    decision: same-version
  - root: "event:developer/message"
    previous: "2026-10-28-tomato-namespace"
    after: "86877e6a31f0e29ec48c4e75929297b0e69523b684bb8cdc2a776b8e8ed01f5a"
    decision: same-version
  - root: "event:session/title-llm-request"
    previous: "2026-10-28-tomato-namespace"
    after: "62e6e682a6ab93b4b25a1b604fd700abe031f792c18de76841556962696c94d7"
    decision: same-version
  - root: "event:user/message"
    previous: "2026-10-28-tomato-namespace"
    after: "c349e1235c48af8b64f1e5c36955488940daf633fd9d703b7a9e2714073cd551"
    decision: same-version
```

<a id="compatibility"></a>
## Compatibility

Existing messages and records are unchanged. Readers without the memory or focus plugins preserve both source kinds and their JSON metadata and derive the recorded text as ordinary context. Each producer reads only its own kind: the memory tools to suppress an unchanged pinned snapshot, and focus to label its ledger and reminders. Neither kind grants authority or changes replay interpretation.

<a id="verification"></a>
## Verification

pnpm exec vitest run packages/experimental/memory packages/experimental/tool-memory packages/experimental/focus packages/experimental/muse-bundle: 51 tests passed with 100% coverage of their sources. The bundle test boots the shipped rows through the real profile Loader and asserts the logged pinned snapshot and goal-round ledger in the model requests.

<a id="dev-note"></a>
## Dev Note

None.
