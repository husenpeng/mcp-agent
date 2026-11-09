# Agent Note: Muse insights summarize only new evidence

Status: implemented

English | [中文](2026-11-09-muse-insights-windowed-summary.zh.md)

## Problem

The first Muse insights recap summarized the whole local day and replaced the previous recap on every attempt. As the day grew, each run re-read and re-sent every Session and message, and the byte ceiling trimmed the tail of an already-long input; the model saw a shrinking, arbitrary part of the day and the recap became less accurate the more work it described. The two cadence keys were also misleading: `recapIntervalMinutes` paced retries of the same day's recap while the visible popup appeared once per day, and `taskIntervalMinutes` paced the unfinished-task analysis alone. A 4-hour recap setting therefore produced no recurring recap the user could see.

## Decision

The Host summarizes only evidence newer than the retained recap. `collectDay` accepts an exclusive `since` instant, equal to the retained recap's `latestEventTime`, so each run reads the day's top-level Sessions and only the human and assistant text after the previous run. The day's first run still reads the whole day.

The bounded request is `{ previousRecap, newSessions }`. `previousRecap` carries the day's current headline, summary, work items (with their `sessionIds`), and open tasks; `newSessions` carries each new Session's id, title, and messages. The model returns the complete updated recap: prior items keep their wording across runs, change status or solution when new evidence settles them, and new items name ids from either part. `parseRecap` validates Session ids against the new Sessions plus the prior items' ids, and the Host adds the window's message count to the retained total, merges Session highlights by identity, and keeps the latest model exchange. Input trimming removes the oldest new messages first, then the prior recap's work-item detail, so the ceiling bounds the request without dropping the day's narrative.

A failed model call still never replaces an existing recap, and a run with no new text writes nothing. A deterministic window recap never overwrites a model-written day.

The configuration splits the two cadences. `recapNoticeMinutes` (240) is the browser popup interval, carried in every snapshot and applied by the controller to both recap and unfinished-task notices. `summaryIntervalMinutes` (120) is the cadence of one summary run that refreshes the recap and the task analysis; the snapshot also uses it to request a run when the day's recap is older than the interval, so a Client without the timer still refreshes. The timer restart on a cadence change is unchanged.

`provider` and `model` default to `blueai` and `DeepSeek-V4.1-Flash-1017`, the route the shipped deployment configures, and both remain required together. The Configure page renders them as selects over the providers and models declared in the `llm-pi-ai` settings section, read through the shared `configForms` face; a stored route outside that section stays selectable.

## Alternatives considered

**Keep whole-day input and tighten the byte ceiling.** This preserves the existing request but still re-reads the day on every run and still truncates without a priority the model can trust; the inaccuracy the change addresses comes from the truncation.

**Send only the new window and let the Host merge work items.** The model must see the prior items to update their status, and a Host-side merge of model wording would either freeze statuses or invent item identity. Carrying `previousRecap` keeps identity and wording with the model that wrote them.

**Cap the popup count per day.** The user asked for a configurable popup cadence; a per-day cap would make a 4-hour setting ineffective for most of the day. The interval is the single rule.

## Consequences

Model-visible input changes to `previousRecap` plus `newSessions`; a stored recap's `model.input` is the complete material for that revision. Stored records keep format version 1, so no data migration is required and a legacy recap is served as the prior recap on the next run. A route the deployment does not configure still degrades to the deterministic recap with a logged failure. A long day accumulates one revision per run, and earlier revisions and their exact exchanges are not retained. Popups repeat the latest recap even when a run added no new evidence.