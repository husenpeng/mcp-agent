---
kind: upgrade-guide
description: "rememberEpisode() clips each field to its stored bound, so an oversized episode field no longer blocks the episode domain from opening on the next launch."
---

# Episode fields are clipped at write time

English | [中文](guide.zh.md)

## Change

`rememberEpisode()` now bounds every episode field before storing it: title 200 characters, subtitle 300, narrative 4096, each fact 300, each concept 256, each file path 512, tool 64, at most 20 facts, 12 concepts, and 20 file paths per list. An episode type longer than 32 characters rejects with `invalid-identifier`.

Before this change those fields were stored as given while the storage schema enforced the same limits only when `tomato_memory_episodes` opened. One oversized concept or fact therefore stored successfully and failed the next launch, which then refused to open the episode domain.

## Migration

1. Remove the project-history record named in the launch failure, for example `episode-0448bc12-7521-4ab5-a2eb-35d96bac2579`, from the `tomato_memory_episodes` domain before upgrading; a build with the old writer does not clip it.
2. Expect clipped text in a stored episode when a custom writer previously sent a longer title, narrative, fact, concept, or file path. Read the full value from the writer's own source when it matters.
3. Confirm the next launch opens the episode domain, and that `memory_recall` returns episodes again.
