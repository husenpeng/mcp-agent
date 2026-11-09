# Agent Note: Muse daily insights without Session events

Status: implemented

English | [中文](2026-11-02-muse-daily-insights.zh.md)

## Problem

Muse memory keeps stated preferences, decisions, and facts, but it does not say what the person did today or what they left unfinished. Those answers live across several Sessions, while memory values are capped at 1024 bytes and profile records reach every new Session. A daily recap therefore cannot be one more memory record, and it has no Session that owns an auxiliary model request. The browser also needs a place to show a short notice and the detail it opens without turning the optional bundle into a release dependency.

## Decision

`@tomato/experimental-muse-insights` is one experimental package with a Host service and a browser half. The [Muse bundle](../../../../packages/experimental/muse-bundle/README.md) inserts it as `optional-muse-insights`, so enabling memory and goal focus also enables recaps and unfinished-task reminders; the package adds no model tool.

The Host keeps one `tomato_muse_insights` domain: one recap per owner and local day, plus the owner's latest unfinished-task analysis. A recap reads only direct human and assistant text newer than the day's retained recap from top-level Sessions created inside the seven-day lookback, skips fork-inherited prefixes and subagent Sessions, and bounds each run by Session, message, and byte limits; the [windowed-summary decision](../architecture/2026-11-09-muse-insights-windowed-summary.md) owns how a run folds new evidence into the day. The analysis reads the existing `todos` projection, treats every pending or in-progress item as a task, suppresses recap wording a completed todo already names, and merges the latest recap's `openTasks`. Owner resolution matches memory: `account:<id>` where the gateway names an account, otherwise `local`, and no access while signed out.

The recap model request is auxiliary and belongs to no Session. Its exact system instruction, framed user input, output cap, route, and accepted response text are stored with the recap, which is what makes the model-visible input reconstructable without inventing a Session. The route is the explicit `provider`/`model` pair, defaulting to the deployment's `blueai` gateway model; a direct caller that supplies neither still falls back to the latest `request/header`. A missing route, failed call, timeout, or malformed response produces a deterministic Session-based recap; a failed call never replaces an existing recap for that day.

The browser half mounts its generated Remote contribution itself and polls `snapshot()` once a minute. A frame-wide notice shows one recap or reminder at a time; clicking it opens one right-Sidebar page type with a recap view and an unfinished-task view, starting a Session when none is on screen. The recap popup and reminder intervals live in `localStorage` as the last-shown instants, so they survive a reload without becoming Host records.

## Alternatives considered

**Store recaps as memory records.** A memory value is capped at 1024 bytes, and profile records would inject every day's summary into every new Session; it lost because the data shape, lifecycle, and context cost all disagree.

**Log the recap request as a Session event.** No Session owns a cross-Session recap, so the choices were a synthetic Session or writing invisible events into a real one; both make Session history claim work that never belonged to it. Storing the exchange with the recap keeps reconstruction without the false ownership.

**Forward a Host event to the browser.** The central `@tomato/api-remotes` assembly is a release package and cannot depend on an experimental one, and promoting the capability to a release surface for one optional bundle is disproportionate; polling lost only the immediate delivery time.

**Summarize in the browser.** The browser has no durable corpus for the day and no model route, and generation would stop whenever the page closes; it lost on both correctness and lifecycle.

**Derive unfinished tasks from the model only.** A model can restate tasks, but the `todos` projection is the authoritative record the agent actually wrote; it lost because a second model pass adds cost and hallucination to data the Host already has.

## Consequences

- Recaps and analyses are local to one Host and its signed-in owner; the browser notice state is local to one browser.
- A long-running Session created before the lookback contributes no text, and work visible only in tool calls, files, or images is not summarized.
- The auxiliary request is absent from Session history by design. The [package README](../../../../packages/experimental/muse-insights/README.md) owns the stored exchange and the limitations; `sessionQuery` will not find it.
- The package adds a documented Remote face, configuration, and two generated catalog entries. The [real-composition test](../../../../packages/experimental/muse-insights/tests/loader-composition.spec.ts) boots the profile row with real Session, projection, todo, LLM, query, and JSON storage plugins; [browser tests](../../../../packages/experimental/muse-insights/tests) cover the notice, page, polling, and mount/disposal.
- No recorded-session snapshot covers the recap request because it belongs to no Session. The Host row's profile boot and scripted model cover the model-visible request; a browser e2e with the optional bundle enabled remains the named coverage gap.