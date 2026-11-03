# Agent Note: Muse post-turn capture as candidates

Status: implemented

English | [中文](2026-11-03-muse-turn-capture.zh.md)

## Problem

Memory only grows when the model decides to call `memory_write` during the turn. Models forget that decision, and a person rarely repeats a standing rule on demand, so the store stays empty where it would be most useful. Hindsight ingests conversations automatically, but its extraction runs in the service on its own queue and can take minutes to become recallable. Muse needs a local version that never lets an unconfirmed guess reach a later Session.

## Decision

`capture` (off by default) adds one auxiliary request per finished turn. The request reads only the person's text messages of that turn, each prefixed with its event seq and bounded by `captureMaxInputBytes`; assistant text and synthetic context never enter it, so the model cannot reinforce its own claims. The reply is parsed as at most three candidates and every one must clear three gates before storage: its quote must be found in a turn message, no record of the same scope and identity may exist, and `duplicates()` must find no near-duplicate. A `MemoryError` drops that candidate; any other storage failure propagates.

Every stored candidate is `status: 'candidate'` with `pinned: false`, so it never reaches search, the snapshot, or the project index before a person confirms it with `/memory confirm`. The quote match supplies `source.userMessageSeq`, which is the evidence `/memory show` prints.

The request and its outcome are logged in the Session as `plugin:tool-memory/turn-capture`: route, exact system text, the first and last input seq, the token cap, and one of `stored` (ids), `empty`, `skipped` (reason), or `failed` (reason). Logging the seq range instead of the text keeps the model-visible input reconstructable without copying the conversation into the log.

Wiring is optional: the listener registers only when `@tomato/session-query` is mounted, and it reads the route from the turn's own last `request/header`. A turn without person text, without a route, or while nobody is signed in sends nothing. The request runs after `turn/end` on a tracked operation, so it never delays the turn; disposal aborts it and awaits settlement.

## Alternatives considered

**Activate captured memories directly.** A model paraphrase that reaches every later Session without a person's confirmation is exactly the failure candidate status exists to prevent; capture would become the largest source of unverified context.

**Include assistant text as evidence.** It would let the model cite itself, pushing its own earlier guesses into long-term memory. The person's words are the only evidence muse accepts anywhere else.

**Capture from `agent/turn-stopping`.** The turn can still be steered after that event, so the transcript would be incomplete and the request would compete with the loop for latency.

**Store the full request exchange in the record.** The input is derivable from the logged seq range, and copying it would duplicate conversation text in the Session log.

**Enable capture by default.** It spends one request per turn whether or not anything durable was said; an experimental layer must not change the cost profile of a profile that merely updates the bundle.

**Let the model write without a quote.** Quote matching costs one containment check and is what keeps a captured candidate tied to something the person actually said.

## Consequences

- Capture reduces omissions, not duplicates of judgement: a captured statement still needs a person to confirm it, and the near-duplicate and identity gates only reject lexical repeats.
- A turn that logs no request header captures nothing, and a composition without `@tomato/session-query` keeps capture dormant even when the flag is on.
- The plugin record is an experimental persistence type, so the persistence catalog changes; readers that do not know the type retain and skip it.
- The request is model-visible, so the package README's capture section, both README languages, the config catalog in both languages, and the tool catalog's write list change.
- Coverage stays at 100%. The [bundle composition test](../../../../packages/experimental/muse-bundle/tests/bundle.spec.ts) boots the shipped rows with `capture` on and asserts the stored candidate, the logged record, and the candidate's absence from a later Session's snapshot; the [relations note](2026-11-03-muse-memory-relations-and-health.md) records the layers this one completes, and the [duplicate-hints note](2026-11-03-muse-memory-duplicate-hints.md) records the gate it reuses.