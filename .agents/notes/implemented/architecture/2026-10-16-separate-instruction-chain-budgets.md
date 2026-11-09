# Agent Note: Separate byte budgets for the user-global and project instruction chains

Status: implemented

English | [中文](2026-10-16-separate-instruction-chain-budgets.zh.md)

## Problem

`dsh-agent-instructions` rendered the user-global and project files as one chain under one `maxBytes`, the rule of the [original workspace-context decision](../../archived/feature/2026-06-24-workspace-context.md). Rendering omits the broadest files first, and user-global files are the broadest, so a large project chain removed them: under the shipped 65,536-byte budget, 20 KiB user-global, 30 KiB project root, and 20 KiB nested files rendered without the user-global file.

## Decision

The renderer splits the loaded files into the user-global and project chains, keeping their order, and budgets the instruction content of each under the same `maxBytes`: omit the broadest files, then truncate the last remaining file to the remaining content budget. The reminder frame, per-file headings, one intro, and the budget notice are scaffolding and are added on top, so no content is cut to make room for them and a chain may exceed `maxBytes` by that overhead. The project chain keeps the result it has when rendered alone; user-global files are omitted or truncated only beyond their own content budget.

When all content fits one `maxBytes`, or only one chain has files, the single-budget rendering applies. Otherwise one `<system-reminder>` frame holds the merged notice when a file was omitted or truncated, one full intro, and the rendered sections in loaded order, with user-global files first in a baseline; the message carries at most twice `maxBytes` of content plus that scaffolding, and a merged frame is never shortened to save bytes. Reconciliation batches apply the same split.

The `maxBytes` key and the baseline identity are unchanged, so a resumed session keeps its visible baseline and receives a user-global file that baseline omitted as one additional-instructions transition.

## Alternatives considered

**One budget that gives user-global files priority.** A large user-global file then truncates or omits the project root file, and bytes near the limit decide which chain loses content.

**One budget with a user-global share.** The project chain still shrinks, and no measurement supports a share size.

**A configuration field for the second chain.** No deployment needs different sizes, and the field would join the baseline identity, so resumed sessions would resend their baselines.

**The Codex layout: an unbounded user-global file and a root-first project chain.** Output has no bound, and the project chain keeps its broadest files, not its most specific ones.

## Consequences

- A baseline or batch holding both chains carries at most twice `maxBytes` of content plus the frame, headings, intro, and notice; deployments that sized `maxBytes` as a total prompt size leave that overhead in their margin. The rename-era numbers in the [upgrade guide](../../../../docs/upgrade-guide/v0.2.1-rc.1/agent-instructions-chain-budgets/guide.md) still describe the earlier total-size accounting.
- No content or intro text is dropped to satisfy the byte cap: the cap applies to instruction content, and a message may exceed it by its scaffolding.
- User-global instructions survive a large project chain.
- The `agent-instructions-budget` snapshot shows a truncated user-global file beside the whole project file; `agent-instructions-budget-chains` shows two chains that fit only separately.
- The package README, `Config.maxBytes` JSDoc, and configuration catalog state the per-chain bound.
