---
name: tomato-post-task-review
description: Use after finishing any task that changed files, before reporting it complete — reviews the task's own diff against this repository's standards and against the original request, fixes the findings that block, re-runs the checks the touched surface needs, and reports what remains.
---

# Post-task review and fix

Every finished task reviews itself. The pass runs in the same session as the work, without the person asking for it, and a task is not reported complete until it passes.

The procedure has four parts: establish the task's scope, run the mechanical checks its surface needs, review the diff on two axes (standards and the request itself), then fix what blocks and verify again. Repeat the review until a pass finds no new blocking finding.

## 1. Establish the task's scope

The unit of review is what this task changed, not the working tree and not the repository. Capture it before reading code:

```sh
git status --short --branch
git diff --stat
git diff
git ls-files --others --exclude-standard
```

Read every untracked file the task created. When other work shares the checkout, identify the files this task touched and judge those; state the exclusion in the report instead of reviewing someone else's half-finished feature.

## 2. Mechanical checks

Run the checks the touched surface needs, not the full suite. These gates catch what reading cannot: formatting, types, compile errors, broken snapshots, documentation link and budget rules.

| Surface | Command |
| --- | --- |
| TypeScript package or script | `pnpm run typecheck`, then the owning `pnpm vitest run <file>`; `pnpm run build:check` after the latest `build:artifacts` before claiming completion |
| Documentation, skill, or catalog | `pnpm run test:docs`; `pnpm run doc-sync` for the full documentation gates |
| Client UI | `pnpm run lint`, `verify-client-ui-i18n`, and a focused `test:web` target |
| iOS app (`apps/ios`) | `xcodebuild … build`, `pnpm run ios:lint`, `pnpm run ios:format` |
| Profile, configuration, or package manifest | `pnpm run hygiene`, plus the owning profile or built-artifact smoke |
| Model- or user-visible output | The focused keyless snapshot or runnable example that owns the output |

A failing gate is a `P0` finding. Do not report a gate as passing unless it ran against the current diff.

## 3. Standards review

Read the diff against the repository rules first, then the general checklist. A documented rule always outranks general advice. For a PR-sized diff, [dsh-code-review](../dsh-code-review/SKILL.md) owns the repository-specific review; the list below is the baseline every task applies.

**Repository obligations.** [AGENTS.md](../../../AGENTS.md) and the surface-specific pages it links (defensive patterns, package rules, documentation rules, prose standard, error handling). Changes to conversation, session, lifecycle, concurrency, or teardown code need [docs/defensive-patterns](../../../docs/defensive-patterns/README.md) read for the touched artifact.

**Design.** The change belongs where it was made. Interactions between its pieces make sense. It integrates with the existing system rather than duplicating a capability that already exists.

**Correctness.** The code does what the request intended, including empty input, large input, concurrent callers, cancellation, and failure. Read every changed line and enough surrounding code to understand it; do not scan a changed function.

**Complexity.** Individual lines, functions, and types are understandable quickly. No abstraction, parameter, or hook exists for a need the request does not have.

**Tests.** A behavior change carries a test that fails when the behavior regresses. Assertions check observable results, not the implementation restated. A test that cannot fail is worse than no test.

**Error handling.** Failures are typed and owned, reported where a person or caller can act on them, and never swallowed to keep a happy path. Recovery paths restore the state their later work depends on.

**Names, comments, and documentation.** Names say what the thing is. Comments state contracts and reasons the code cannot carry, not narration. Public behavior, configuration, errors, and wire fields update their owning documentation in the same diff.

**Consistency and style.** Follow the documented style and the surrounding code. Formatting that tooling owns is not a review finding.

**Security and data.** No secret, token, or user data is logged, committed, or left in storage its owner did not intend. Credentials are cleared when their pairing or session ends.

**Performance.** A user-visible slowdown has evidence, not an assumption. A hot path does not repeat work per item, per token, or per frame.

**Smell baseline**, applied as judgement calls rather than violations: duplicated code, feature envy, data clumps, primitive obsession, repeated switches, shotgun surgery, divergent change, speculative generality, message chains, middle man, refused bequest, mysterious name.

## 4. Spec review

Compare the diff with what was actually asked, quoting the request line that each finding belongs to.

- **Missing or partial.** A requested behavior is absent, implemented for one case only, or silently dropped.
- **Scope creep.** Behavior or refactoring nobody asked for. Report it; do not revert unrelated pre-existing work.
- **Implemented but wrong.** The feature exists and behaves incorrectly, or claims more than it does.

## 5. Fix loop

Fix findings in place, smallest change first.

- `P0` and `P1` are fixed in this task. A `P2` is fixed when it is local and cheap; otherwise it is reported.
- Add or adjust the test that proves the fix, and keep unrelated refactoring out of the same change.
- Re-run the checks that cover the touched surface after each batch, then rerun sections 3 and 4.
- Stop when a pass produces no new `P0` or `P1`. Two clean passes in a row is the normal end state.

## 6. Report

Report, in this order and only with facts:

1. The findings that were fixed, each with file, line, severity, and the rule or behavior it broke.
2. The findings deliberately left, with the reason (out of scope, pre-existing, needs a decision from the owner).
3. The commands actually run, with their result.
4. Residual risk the checks cannot show, such as an untested device, network, or platform path.

A clean pass says so in one sentence. Never invent a finding to appear thorough, never claim a check that did not run, and never report a deferred `P0` or `P1` as if the task were complete.

## Sources

The checklist condenses the widely used review rules these references state; read the originals when a judgement call needs more than this page.

- Google engineering practices: [the code review standard](https://github.com/google/eng-practices/blob/master/review/reviewer/standard.md) and [what to look for](https://github.com/google/eng-practices/blob/master/review/reviewer/looking-for.md).
- [thoughtbot code review guide](https://github.com/thoughtbot/guides/tree/main/code-review): tone, alternatives, and tested suggestions.
- [Awesome code review checklists](https://github.com/mgreiler/awesome-code-review-checklists): a curated index of general, security, and language-specific checklists.
- [Conventional comments](https://conventionalcomments.org/): labels that separate a blocking issue from a suggestion, nit, or praise.
- Automated review prior art: [reviewdog](https://github.com/reviewdog/reviewdog) (linters reported as review comments) and [PR-Agent](https://github.com/qodo-ai/pr-agent) (review, describe, and improve on the pull request itself). Both automate the mechanical half; the semantic half stays here.