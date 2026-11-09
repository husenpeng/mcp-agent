---
description: "Crew Remote roster stream, specification publication, run start and cancellation, and flow-ledger reads for browser clients."
kind: "package-reference"
---
# Robot Crew Controller

English | [中文](README.zh.md)

## Summary

`@tomato/api-robot-crew-controller` owns the Host `ctx.crewController` and the generated `crew` Remote namespace over the `@tomato/experimental-robot-crew` seam. `crew.watch` streams whole roster frames (the latest revision of every crew and every run) on open and after each `crew/changed`. `publish`, `start`, `cancel`, `revision`, `runs`, and `entries` mirror the seam; a rejected specification arrives as `crew/spec-invalid` with its field issues, a missing record as `crew/not-found`, and a refused state change as `crew/conflict`. The Client half installs `ctx.crewRuns` for the studio.

## Table of Contents

- [Use this package](#use-this-package)
- [Dev Note](#dev-note)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)

-----

<a id="use-this-package"></a>
## Use this package

Mount the Host controller after a crew provider; it injects `crews` and `typert`. Mount `@tomato/experimental-robot-crew-remote` in a browser assembly before `@tomato/client-ui-robot-crew` depends on `remote.crew`. Every value is JSON, so a reconnected generation's first frame already carries the whole roster. Ledger entries are read per run through `entries` rather than streamed, because one run can produce hundreds of entries.

<a id="dev-note"></a>
## Dev Note

The controller holds no state: every read projects `ctx.crews`, and `watch` streams whole roster frames after `crew/changed`. The registry owns validation, persistence, and the run lifecycle; the controller translates provider failures into `crew/...` Remote codes and specification-issue lists, and `entries` reads a run's flow ledger on demand instead of streaming it. Wire types live in `src/types.ts` and import the crew vocabulary through `@tomato/experimental-robot-crew/types`, so the client bundle never reaches Host runtime code.

## Model Experience

None, as this package carries browser transport and no model-visible text.

#### KV Cache effect

None; the package never enters a model request.

## Known Limitations and Deferred Work

- **No ledger stream** — clients re-read a selected run's entries through `entries`; a live run's entries arrive by polling at the client.
- **No per-run filter in the frame** — every frame carries every run, which is correct for the current roster sizes.
