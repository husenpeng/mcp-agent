# RULE.md — What a finished task and its commit must satisfy

Two standing rules hold for every change in this repository: the review pass every finished task runs, and what a commit may contain. A task that skips the first is not finished, and a commit that breaks the second is rejected.

## Every finished task runs the review pass

A task ends only after its own diff has been reviewed and every finding worth fixing has been fixed. Run [tomato-post-task-review](.agents/skills/tomato-post-task-review/SKILL.md) in the same session, without being asked, before reporting the task complete.

- **Review the diff, not the memory of it.** Compare against the point where the task started and read every untracked file the task created. The task's own edits are the scope, not the whole working tree and not the whole repository.
- **Severity decides what blocks.** Fix `P0` (broken behavior, data loss, leaked credentials, corrupted state) and `P1` (wrong behavior at an edge, a failure path with no owner, a contract the code no longer meets) inside the same task. Fix `P2` (naming, duplication, structure) when the change is local and cheap, and report it otherwise. Report nits and do not spend the task on them.
- **Evidence over preference.** Every finding names the file, the line, and the rule or behavior it breaks. A preference no page of this repository states is a nit, not a finding.
- **Fix, then verify again.** Re-run the checks the touched surface needs after each fix batch, then run the review again; stop when a pass produces no new `P0` or `P1`.
- **Report what remains.** State what was found and fixed, what was left and why, and the commands actually run. A clean pass is a valid result: never invent a finding to look thorough, and never claim a check that did not run.

## What a commit may contain

A commit contains source, its tests, and its documentation. It never contains files a build, a package manager, or a local debugging session produces. `pnpm run verify-commit-hygiene` enforces the mechanical part of this page: the `pre-commit` hook runs it with `--cached` against the files a commit adds or changes, and the `hygiene` aggregate runs it against every tracked file.

### Build output

- Compiler and bundler output belongs in the ignored `lib/` or `dist/` directory of its package, never beside its source. A `.js`, `.mjs`, `.cjs`, `.d.ts`, `.d.mts`, `.d.cts`, or `.map` file under `src/` whose `.ts`, `.tsx`, `.mts`, or `.cts` source is also tracked is rejected. It appears when `tsc` runs without the package's `outDir`; delete it and build with `pnpm run build:artifacts`.
- A hand-written ambient declaration, such as `src/css-modules.d.ts`, has no sibling source and stays allowed.
- `node_modules/`, `lib/`, `dist/`, `*.tgz` package tarballs, and `*.tsbuildinfo` are never committed.

### Local debugging residue

- Logs (`*.log`, `desktop-test-logs/`) stay on the machine that wrote them. Put the relevant excerpt in the issue or PR description.
- Name throwaway files `*.local.<ext>` or `*.scratch.<ext>`, or keep them in a `scratch/` directory. `.gitignore` ignores these names and the gate rejects them if they are force-added.
- A focused test (`it.only`, `describe.only`, `test.only`) hides the rest of its file from CI. Filter locally with `pnpm vitest run <file> -t <name>` instead.
- `debugger` statements, Python `breakpoint()`, and `pdb` imports are removed before committing.
- Code meant only for a local run carries an uppercase `// NOCOMMIT` or `// DO NOT COMMIT` comment, so the hook rejects the commit until that code is removed.
- `console.log` probes in tests and temporary `it.skip` are not detected; the review pass rejects them.

### When the hook rejects a commit

1. Read the reported path or line and its suggested fix.
2. Unstage generated or local files with `git restore --staged <path>`; delete stray build output beside sources.
3. Do not bypass the hook with `git commit --no-verify`; CI runs the same check through `pnpm run hygiene`.
4. If a file is a legitimate source that the gate misreads, change [scripts/verify-commit-hygiene.ts](scripts/verify-commit-hygiene.ts) and its spec in the same PR, and explain the exception there.