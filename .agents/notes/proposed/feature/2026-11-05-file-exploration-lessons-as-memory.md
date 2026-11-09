# Agent Note: File-exploration lessons as long-term memory

Status: proposed

English | [中文](2026-11-05-file-exploration-lessons-as-memory.zh.md)

## Problem

The [long-term memory proposal](2026-11-05-long-term-memory-for-muse-and-robots.md) adds episodic capture to Muse and plans robot reuse. The local claude-mem checkout (v15.9.0, commit `d8bf121ae`, [upstream](https://github.com/thedotmack/claude-mem)) supplies the pipeline it adapts: capture tool outcomes, compress them, retrieve progressively, and inject a bounded history. This note records the first concrete instance that justifies the episodic layer, and the tool-surface defects it exposed.

An agent working in this repository tried to answer "what is in this directory" through browser JavaScript instead of a filesystem tool. The cause is not model preference:

- **No directory primitive.** The fs tool set exposes `read`, `write`, `edit`, `read_image`, `glob`, and `grep`. `glob` describes itself as "Find files, not directories" ([glob.ts](../../../../packages/fs/tool-fs-search/src/glob.ts)), so "list this directory" has no cheap call.
- **Glob does not converge.** It has only `pattern` and `path`; hidden and ignored files are included by default, a pattern without `/` matches basenames at any depth, and a bare `*` walks the whole tree. The observed call returned 840 paths, the interface showed 100, and the rest went to a spill file.
- **`read` always resends.** Every call renders the window in full ([read.ts](../../../../packages/fs/tool-fs/src/read.ts)); the observation policy already records a version per Session, but no delivered-read state turns an unchanged file into a short notice.
- **The defaults are shared by every Agent.** `@tomato/tool-fs` and `@tomato/tool-fs-search` register model-facing tools and prompt sections for all profiles. A robot configuration cannot fix a default that every Agent inherits, and no robot setting prevents a model from constructing another whole-tree glob.

The same instance shows what the episodic layer is for: the next session has no record that this tree is large and that a broad glob spills, so it repeats the cost.

## Proposal

### Tool surfaces

- **`list_dir`** (`@tomato/tool-fs`): a bounded directory view with `path`, `depth` (default one level), `all`, `exclude`, and `limit`. It skips hidden names and configured build directories by default, never returns file contents, and registers its own prompt guidance telling the model to start here before searching. Config keys: `list`, `listDepth`, `listMaxDepth`, `listMaxEntries`, `listExcludes`.
- **`glob` narrowing** (`@tomato/tool-fs-search`): add `depth`, `exclude`, and `hidden` to the schema. `depth` maps to ripgrep's `--max-depth`; `exclude` adds negated globs; `hidden: false` drops `--hidden` and `--no-ignore` so ignore rules and dot-name skipping apply. Config bounds: `globMaxDepth`, `globMaxExcludes`. The default command is unchanged, so existing snapshots and behavior stay stable.
- **Prompt guidance** names `list_dir` first and tells the model to pass `depth` or `exclude` instead of a bare recursive pattern.
- **`read` delivery state** is deferred: a correct implementation must key on the Session surface generation, not only on the file version, or a post-compaction read would suppress content the model no longer has. The observation policy's version is necessary but insufficient.

### Deterministic lessons

- A successful `glob` whose result is capped, or returns at least `lessonGlobMinPaths` paths, becomes one `discovery` episode with a title such as `Broad glob returned 840 paths` and a narrative telling the next Session to use `list_dir` or a narrower search.
- The lesson is derived from the tool's own result metadata (`total`, `truncated`), so it costs no auxiliary model request and is reproducible from the result. Its fingerprint is the search root and pattern, so a repeated search updates the earlier episode instead of appending.
- `@tomato/experimental-tool-memory` owns the listener. `lessonCapture` defaults to on, `lessonMaxPerSession` bounds writes, and the existing project-history injection carries the lesson into a later Session's first request.
- This is the episodic layer's first non-LLM producer. It complements, rather than replaces, the tool-observation capture and the explicit fact rules: a lesson is an observation, never a `preference`, `constraint`, or `fact`, and it never requires a person's quote.

### Personal memory execution

- Explicit facts keep their quote-confirmed write path. Lessons and tool observations are episodes, stored in `tomato_memory_episodes`, selected by the same history budget, and ranked with the same lexical and vector path as other episodes.
- The lesson listener reads memory access once per call and honors sign-in and project scope, so a signed-out Host records nothing rather than writing under the wrong owner.
- The deterministic producer runs outside the capture queue, so it cannot delay a tool result; a write failure is logged and the tool result still returns.

## Alternatives considered

**Only change the system prompt** — rejected. A prompt reduces the chance of a whole-tree glob but cannot answer "what is here"; the missing primitive is the root cause.

**Write a robot-specific guideline** — rejected. The tool defaults and prompt sections belong to shared packages, and a robot spec cannot stop a model from calling `glob` with a new pattern.

**Compress broad searches with the observer model** — rejected for this case. The path count and truncation flag are already in the tool result; a model request adds cost, latency, and a non-deterministic record for a fact that is already known.

**Block broad globs outright** — rejected. Some tasks genuinely need a whole-tree search; the remedy is a cheap directory view and narrowing parameters, not a prohibition.

**Deduplicate `read` by file version alone** — rejected as unsafe. The version does not prove the earlier content is still on the model surface after compaction; the implementation waits for surface-generation-aware delivery state.

## Acceptance criteria

- `list_dir` lists a fake tree one level by default, honors depth, `all`, `exclude`, and `limit`, reports truncation, and never reads file contents; its schema and prompt section disappear when `list: false`.
- `glob` accepts `depth`, `exclude`, and `hidden`, validates them against configured caps, and adds the expected argv; the default argv is unchanged.
- A capped or large glob run through the real `tools/post-execute` waterfall stores one lesson episode, a repeated pattern updates it, and `lessonMaxPerSession` bounds further writes; a focused glob, a delegated Agent, a Session without a project, or `lessonCapture: false` stores nothing.
- A later Session's snapshot can carry the lesson through the existing project-history block within `maxHistoryBytes`.
- Tests cover the new tool, schema validation, prompt guidance, lesson derivation, listener limits, and storage; configuration and tool catalogs regenerate.

## Risks

- **Lesson noise.** Every search over the threshold writes an episode. The per-Session cap and fingerprint update bound it, but a project with many large searches accumulates discovery episodes; the per-project episode cap and retention still apply.
- **Stale advice.** A lesson says "this tree is large" even after the tree shrinks. It is an observation with a date, not a constraint, and the injection labels history as not instructions.
- **Tool coupling.** The lesson listener recognizes the `glob` tool by name and result meta. Another search provider with a different name produces no lesson, and a schema change that renames the meta fields silently stops lessons; the tool-catalog tests and README pin the contract.
- **Deferred read dedupe.** The repeated full read remains. A naive version check would be worse than the cost it saves, because a compacted Session could lose content the model needs for an edit.
- **No directory content.** `list_dir` names entries only; a model still needs `read` for content and `glob` for patterns. The guidance ordering, not a merged tool, is what prevents the wrong first call.