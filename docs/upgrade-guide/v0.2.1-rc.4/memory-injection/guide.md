---
kind: upgrade-guide
description: "Memory injection keeps a delivered snapshot while the account loads, adds request-relevant records, drops self-session episodes, and captures profile preferences as active."
---

# Memory injection follows the verified account and the turn

English | [中文](guide.zh.md)

## Change

Both memory packages change what a turn receives and what capture stores.

| Before | After |
|---|---|
| `sign-in-required` while the gateway had not verified a browser | `account-loading` before verification; `sign-in-required` only after a confirmed sign-out. A resumed Session no longer injects the cleared notice during startup. |
| profile and pinned workspace records only | up to `maxRelevantRecords` active workspace records covering at least `minRelevantScore` of the turn's first person message |
| history and index named any lexical match, including the Session's own cards | both exclude the asking Session, drop matches below `minHistoryScore`, and keep one line per title |
| `promote()` grouped every observation fact | failure observations and bare exit codes never promote |
| the Muse bundle left capture off | it sets `capture: true`: one bounded request per finished turn, carrying a tool-activity digest and saved facts |
| capture stored every statement as a candidate | a quote-verified profile statement becomes active when `captureProfileActive` is on; an existing profile value is replaced, while a workspace candidate never overwrites |
| cleared text said earlier memories no longer apply | it says no memory is shown for this turn and earlier ones may no longer apply |

Observation cards now name the command after a leading `cd … &&` and index the paths it touches.

## Migration

1. A profile mounting the packages directly needs no edit. To keep the previous request count, set `capture: false` on `optional-tool-memory`.
2. Handle `account-loading` in every exhaustive `MemoryAccess` switch: keep the shown surface and retry.
3. Remove candidates written by earlier failed-call promotion with `/memory forget <id>`; this change prevents new ones but keeps stored records.
4. New bounds: `maxRelevantRecords` (`5`, `0` disables), `minRelevantScore` (`0.25`), `minHistoryScore` (`0.25`), `captureProfileActive` (`true`), and `captureMaxToolBytes` (`1200`).
5. A preference stated in an earlier turn still needs restating or `/memory confirm`.

Verify that a resumed Session keeps its remembered record while the account loads, that a matching unpinned record appears under `Saved memories relevant to this request`, and that a captured profile statement is active in the next snapshot.
