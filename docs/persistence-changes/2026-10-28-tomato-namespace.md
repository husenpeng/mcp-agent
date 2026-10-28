---
description: "Records a persistence type transition and its compatibility acknowledgement."
kind: persistence-change
---

# 2026-10-28-tomato-namespace

English | [中文](2026-10-28-tomato-namespace.zh.md)

## Summary

Renames the session-title message source kind from `dsh-session-title-llm` to `@tomato/session-title-llm`.

## Table of Contents

- [Declaration](#declaration)
- [Compatibility](#compatibility)
- [Verification](#verification)
- [Dev Note](#dev-note)

<a id="declaration"></a>
## Declaration

```yaml persistence-change
schemaVersion: 1
id: 2026-10-28-tomato-namespace
baseline: false
changes:
  - root: "event:agent/inbox/spliced"
    previous: "2026-10-22-action-card-status"
    after: "996ff51295d8c4bbe3caa4fb2cd0facc9c7b6d22806aa2efe4c3354dfed53013"
    decision: same-version
  - root: "event:developer/message"
    previous: "2026-10-22-action-card-status"
    after: "1896fea192821ffd98706a7d67e48e83fc538ee231f537da0f0ea48dd4336018"
    decision: same-version
  - root: "event:session/title-llm-request"
    previous: "2026-10-22-action-card-status"
    after: "c2b8789dfe88043e92fb88aa38176e6b93040984e07cae9f929607181231b288"
    decision: same-version
  - root: "event:user/message"
    previous: "2026-10-22-action-card-status"
    after: "660d9583025ca7231c1b7f5f02c4db95201a854a2e93ad80dec0d3dc399e9e54"
    decision: same-version
```

<a id="compatibility"></a>
## Compatibility

Both reader directions are safe. The v3-to-v4 migration rewrites released V3 plugin ids and the direct source kind to the new value. Sessions already written at v4 keep the old kind, which `MessageSourceMap` still declares, so the current reader accepts both spellings; new writes use the new kind. The discriminator set is explicit, so no header version bump is needed.

<a id="verification"></a>
## Verification

pnpm exec vitest run packages/session/session-format-v3-to-v4 packages/session/session-title-llm packages/session/session-format-v0-to-v1: 517 tests passed.

<a id="dev-note"></a>
## Dev Note

None.
