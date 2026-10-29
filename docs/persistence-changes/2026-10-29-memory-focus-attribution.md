---
description: "Records a persistence type transition and its compatibility acknowledgement."
kind: persistence-change
---

# 2026-10-29-memory-focus-attribution

English | [中文](2026-10-29-memory-focus-attribution.zh.md)

## Summary

Adds the experimental-memory, experimental-focus, and experimental-tool-memory attribution kinds to logged model context.

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
    after: "b51e45845d3f93a468e074920e35b10bc0eccff54996e5b58a58d1fa04d79c7e"
    decision: same-version
  - root: "event:developer/message"
    previous: "2026-10-28-tomato-namespace"
    after: "ff42e532e68e4974890e489a57673e7245d18b1ad5d065d16616141b3e3f579d"
    decision: same-version
  - root: "event:session/title-llm-request"
    previous: "2026-10-28-tomato-namespace"
    after: "86642fe542042af40c12990a7389131d6254093e19af555d83b67042b01d64e8"
    decision: same-version
  - root: "event:user/message"
    previous: "2026-10-28-tomato-namespace"
    after: "5e9e1a01674a4a8c7b534c5a34ecc3cb08fb17efb83ff2383b36edc727b43c82"
    decision: same-version
```

<a id="compatibility"></a>
## Compatibility

Existing messages and records are unchanged. Readers without the memory or focus plugins preserve the experimental-memory and experimental-focus source kinds and their JSON metadata and derive the recorded text as ordinary context. Each producer reads only its own kind: the memory tools to suppress an unchanged snapshot, and focus to label its ledger and reminders. The experimental-tool-memory kind marks only the input of the auxiliary query-expansion request and never appears on a conversation surface; its request and outcome are logged as the ignorable plugin record plugin:tool-memory/query-expansion. No kind grants authority or changes replay interpretation.

<a id="verification"></a>
## Verification

pnpm exec vitest run packages/experimental/memory packages/experimental/tool-memory packages/experimental/focus packages/experimental/muse-bundle packages/tomato/gateway: every test passed with 100% coverage of the memory, tool-memory, and focus sources and of the gateway account state. The bundle test boots the shipped rows through the real profile Loader and asserts the logged profile and pinned snapshot and the goal-round ledger in the model requests.

<a id="dev-note"></a>
## Dev Note

None.
