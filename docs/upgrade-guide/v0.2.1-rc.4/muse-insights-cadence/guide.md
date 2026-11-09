---
kind: upgrade-guide
description: "Muse insights now separates the recap popup cadence from the summary run cadence, summarizes only new evidence, and defaults the recap route to the deployment's blueai gateway model."
---

# Muse insights split popup cadence from summary cadence

English | [中文](guide.zh.md)

## Change

`@tomato/experimental-muse-insights` replaces two configuration keys and changes what each cadence means.

| Before | After | Meaning |
|---|---|---|
| `recapIntervalMinutes` (`30`) | `recapNoticeMinutes` (`240`) | Minutes between recap popups in the browser |
| `taskIntervalMinutes` (`15`) | `summaryIntervalMinutes` (`120`) | Minutes between summary runs that refresh today's recap and unfinished tasks |

A summary run now reads only the day's evidence newer than the retained recap and folds it into that day's recap, so a long day's input stays bounded instead of re-reading and truncating the whole day. The request carries the day's prior recap plus the new Sessions; work items keep their wording across runs and change status when new messages settle them. A run with no new text writes nothing.

The recap popup is no longer announced once per day. It repeats the latest recap every `recapNoticeMinutes`, and the same interval paces the unfinished-task reminder. The Host sends the interval in every snapshot, so a saved interval changes the cadence without a page reload.

`provider` and `model` now default to `blueai` and `DeepSeek-V4.1-Flash-1017`, the route the shipped deployment configures. Both remain required together, and the Configure page offers the providers and models declared in the `llm-pi-ai` settings section instead of free text. A route the Host cannot serve still degrades to the deterministic recap with a logged failure.

## Migration

1. Rename the keys in every `cordis.patch.yml` or overlay that sets them: `recapIntervalMinutes` → `recapNoticeMinutes`, `taskIntervalMinutes` → `summaryIntervalMinutes`. A patch replaces the row's whole `config`, so a row that names only the old keys loses them and falls back to the new defaults (`240` and `120`).
2. Set `recapNoticeMinutes` to the desired popup cadence. The old value was a generation retry spacing, not a popup cadence; a 4-hour recap popup is `240`. The minimum remains 1 minute.
3. Set `summaryIntervalMinutes` to how often new Session evidence should enter today's recap. The previous recap is replaced in place; no separate retry key exists.
4. Review `provider` and `model` if the deployment does not configure the `blueai` gateway. Choose a configured route on the row's Configure page, or set the pair in `cordis.patch.yml`; clearing only one half is refused at load.
5. Expect the recap tab to show the same day's recap with a newer revision after a summary run, and the notice to repeat at the popup interval. Stored records keep format version 1; no data migration is required.

Verify the row loads with the new keys, a save on the Configure page shows the configured routes, and the next run after new Session text updates the recap's message count and revision.