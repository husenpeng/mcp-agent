---
kind: upgrade-guide
description: "Memory records move to one document per record, a write lock serializes concurrent Host processes, and recall re-reads on an interval; a downgraded build reads only the frozen legacy file."
---

# Memory survives concurrent Host processes

English | [中文](guide.zh.md)

## Change

`@tomato/experimental-memory` now keeps its records the way several Host processes can share one tomato home.

| Before | After | Meaning |
|---|---|---|
| `tomato_memory.json` / `tomato_memory_episodes.json` rewritten whole per write | one versioned document per record under `<unit>/<table>/<key>.json` | A write touches its own document; it never republishes another process's records |
| last writer wins across processes | `remember()` takes `<TOMATO_HOME>/memory/write.lock` and re-reads the record domain under it | Two processes cannot both leave a current version of one identity; a lock that stays taken past `writeLockTimeoutMs` fails with `write-busy` |
| a mirror loaded at activation | `recall()`, `searchEpisodes()`, `history()`, and the turn snapshot re-read a domain whose medium token moved, at most once per `refreshIntervalMs` | Another process's record reaches search and the snapshot without a restart; `0` disables the re-read |
| a sidecar that failed to open failed activation | the sidecar opens with a 5 s busy timeout, merges rows on rebuild, and falls back to the domain scan | Memory tools stay available; a rebuild no longer drops rows another process indexed |

The legacy whole-unit file is not deleted or rewritten: the first activation copies its records into the new tree and leaves `<unit>.migrated.json` beside it.

## Migration

1. Nothing to edit and no configuration change. The bootstrap runs once per unit and stamps each copied record with the current domain version.
2. Back up `<TOMATO_HOME>/storages` before downgrading. A build older than this change reads only the untouched legacy `<unit>.json`, so records written after the upgrade are invisible to it, and its own writes land in a file this build no longer reads.
3. Processes must share one `TOMATO_HOME` to serialize writes: the lock lives under the home, not beside a routed storage root. Point every process that writes one memory store at the same home.
4. `write-busy` means another process held the lock for `writeLockTimeoutMs`; retry the write instead of treating it as data loss.
