---
description: "Records a persistence type transition and its compatibility acknowledgement."
kind: persistence-change
---

# 2026-11-20-upstream-sync-persistence

English | [中文](2026-11-20-upstream-sync-persistence.zh.md)

## Summary

Records the upstream sync's declared Session persistence changes: LiveShare viewer calls now carry a share-viewer principal variant; the retry source keeps only its browser correlation fields; three merged MessageSourceMap members — experimental-memory-dream, skill-catalog completeness, and subagent-settled stop reasons — reach these message lists; and the removed DeepSeek web-search plugin no longer emits its request record.

## Table of Contents

- [Declaration](#declaration)
- [Compatibility](#compatibility)
- [Verification](#verification)
- [Dev Note](#dev-note)

<a id="declaration"></a>
## Declaration

```yaml persistence-change
schemaVersion: 1
id: 2026-11-20-upstream-sync-persistence
baseline: false
changes:
  - root: "event:agent/inbox/spliced"
    previous: "2026-11-04-image-evidence"
    after: "b75001ef50c434d75ec4c79fffbcc65c0847a385056f7b9d6c20a7038d8c7f69"
    decision: same-version
  - root: "event:developer/message"
    previous: "2026-11-04-image-evidence"
    after: "4e611a4822b2496a924c639b3a4de28aadf3a2096d16d0f7897ef800adb4a6f9"
    decision: same-version
  - root: "event:session/title-llm-request"
    previous: "2026-11-04-image-evidence"
    after: "7553260011a5bf221587f52e348e76fd45e14995a43f3ec965f2289763ec894a"
    decision: same-version
  - root: "event:user/message"
    previous: "2026-11-04-image-evidence"
    after: "73302ed9463eab6c9b2abb88f288b47cdf4faf17b10944561d858888573f0b3b"
    decision: same-version
  - root: "event:web/deepseek-search-llm-request"
    previous: "2026-10-13-deepseek-search-thinking"
    after: null
    decision: same-version
```

<a id="compatibility"></a>
## Compatibility

Every structural difference is readable in both directions. `principal` is optional on the user and retry sources, so a record without it still reads as the owner's own prompt; a new principal variant is refused by authorization only when a caller supplies one, because PrincipalMap is merge-extensible and the authorization layer matches on `kind`. Existing retry records keep `rpcId` and `clientTimeZone`; readers of those fields are unchanged, and a producer can no longer attach an optional `principal`. The multilingual message lists gain source kinds merged in elsewhere, all with `kind` discriminants: an older reader that meets one falls through the extensible source union and shows the message as unattributed, exactly as it does for any other producer-declared kind. `skill-catalog.incomplete` and `subagent-settled.stopReason` are optional, so historical records stay valid, and a reader that finds them absent publishes the catalog as complete and omits the stop reason, which is the behavior those historical records were written under. `web/deepseek-search-llm-request` was only ever a log-only record of a search plugin this tree no longer ships; no reader consumes it, and old logs of it remain untouched in their generations.

<a id="verification"></a>
## Verification

pnpm exec vitest run packages/api/session-controller/tests packages/session/session-title-llm/tests packages/subagent/subagent/tests packages/skill/tool-skill/tests packages/experimental/memory-dream/tests packages/experimental/liveshare/tests: all suites passed. pnpm run verify-persistence-catalog regenerated and verified the inventory.

<a id="dev-note"></a>
## Dev Note

None.
