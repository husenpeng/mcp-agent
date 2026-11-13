---
description: "Sixteen knowledge-work robot templates and the bundled skills adapted from Anthropic's knowledge-work-plugins repository."
kind: "package-reference"
---

# @tomato/experimental-robot-templates-knowledge-work

English | [中文](README.zh.md)

## Summary

`@tomato/experimental-robot-templates-knowledge-work` adapts Anthropic's open-source [knowledge-work-plugins](https://github.com/anthropics/knowledge-work-plugins) repository into Tomato: sixteen role plugins become sixteen hireable robot templates and 181 bundled skills. The vendored `plugins/` tree stays byte-for-byte upstream (Apache-2.0), so a new upstream commit replaces it without a merge; the adapter in `src/` turns each `SKILL.md`, `commands/*.md`, and `.mcp.json` declaration into the Tomato skill vocabulary and reports every Claude-only feature it cannot carry.

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Further Exploration](#further-exploration)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

The `@tomato/experimental-robot-app` bundle mounts this plugin after the marketing templates row. It requires `robotTemplates` and `skills` and has no configuration fields. Outside that bundle, add the row yourself:

```yaml
- id: robot-templates-knowledge-work
  name: '@tomato/experimental-robot-templates-knowledge-work'
```

- Each of the sixteen roles appears as one template card on the robot page. Hiring it publishes a user-owned specification; later template or upstream changes never reach a hired robot.
- Every template runs on a manual trigger with the same 400,000-token, 30-minute, 300-tool-call budget as the marketing templates, the `workspace-write` permission preset, unrestricted network, and a chat deliverable.
- The template's `capability.skills` names every skill its role ships, so a run's skill catalog contains that role's skills and nothing else from this package.
- Templates declare no MCP servers. A run stays runnable without any connector; the vendored `.mcp.json` declarations are available through `connectorPlan` for a deployment that mounts the servers itself.

| Role | Template id | Skills | Approx. catalog tokens |
|---|---|---|---|
| Marketing | `marketing` | 8 | 644 |
| Sales | `sales` | 36 | 3,092 |
| Customer support | `customer-support` | 5 | 338 |
| Product management | `product-management` | 9 | 589 |
| Productivity | `productivity` | 4 | 246 |
| Legal | `legal` | 9 | 744 |
| Finance | `finance` | 8 | 535 |
| Data | `data` | 10 | 744 |
| Enterprise search | `enterprise-search` | 5 | 296 |
| Bio research | `bio-research` | 6 | 612 |
| Engineering | `engineering` | 10 | 633 |
| Design | `design` | 7 | 456 |
| Human resources | `human-resources` | 9 | 577 |
| Operations | `operations` | 9 | 617 |
| Small business | `small-business` | 44 | 5,450 |
| Plugin management | `cowork-plugin-management` | 2 | 155 |

Catalog tokens are computed at the `tool-skill` default 500-character description cap.

[Third-party notices](THIRD_PARTY_NOTICES.md) record the vendored source and its license.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

`src/plugins.ts` reads every vendored plugin: the manifest supplies the version and summary, `skills/*/SKILL.md` and `commands/*.md` supply instructions, and `.mcp.json` supplies connector declarations. It converts each file to the Tomato skill vocabulary with three rewrites, all applied at load time so the vendored bytes stay editable and diffable against upstream:

- **Connector placeholders.** `~~category` becomes `<category> tool`; labels listed in the plugin's `CONNECTORS.md` are replaced first, longest first, so a two-word label wins over its first word.
- **Slash commands.** A `/name` token that names a skill or command shipped by the same plugin becomes `the <name> skill`; a token naming a command the plugin does not ship stays verbatim, because no Tomato skill resolves it.
- **Command arguments.** `$ARGUMENTS` becomes `the user's request`, so an imported command reads as an ordinary user-invocable skill.

Four skill names exist in two roles — `competitive-brief` in marketing and product management, `lead-triage` in sales and small business, `start` in bio research and productivity. The adapter prefixes every one of those names with its role (`marketing-competitive-brief`, `sales-lead-triage`, `bio-research-start`), so both versions stay loadable, and leaves the other 175 names as upstream wrote them.

`src/templates.ts` owns the sixteen role card texts in English and Chinese and one shared execution profile. `src/index.ts` builds one skill candidate per file, registers one bundled provider whose resource base is the skill directory, and registers each template inside `ctx.effect`, so disposal removes both. `src/connectors.ts` converts an `.mcp.json` declaration into an `mcp-client` row, normalizes its server name to the `[A-Za-z0-9_-]{1,32}` namespace, and reports declarations with no endpoint, OAuth grants, and endpoint conflicts instead of emitting a broken row.

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

- [knowledge-work-plugins](https://github.com/anthropics/knowledge-work-plugins) — the vendored upstream repository.
- [`@tomato/experimental-robot`](../robot/README.md) — the template registry and the conversion from template to specification.
- [`@tomato/experimental-robot-runtime`](../robot-runtime/README.md) — the run executor that restricts a run's skill catalog to the template's declared skills.
- [`@tomato/experimental-robot-templates-marketing`](../robot-templates-marketing/README.md) — the creator-marketing templates that share this execution profile.
- [`@tomato/mcp-client`](../../mcp/mcp-client/README.md) — the plugin that mounts a connector row.

-----

<a id="model-experience"></a>
## Model Experience

### Robot mission

#### What the model sees

A hired robot's run receives the template's mission, success criteria, and acceptance lines through the runtime's `robot:mission` prompt section. The mission names the role and tells the model to choose the matching role skill before acting.

#### Token effect

The mission section adds roughly 150 to 250 tokens per run.

#### KV Cache effect

The mission is stable for one specification revision; loading a skill appends its body after the cached prefix.

### Bundled skill catalog

#### What the model sees

Every mounted skill contributes one catalog line (name plus description) whenever the `skill` tool is visible. All 181 lines total about 15,700 tokens at the default 500-character description cap; a robot run declares only its role's skills, so its catalog costs the role column above instead.

#### Token effect

Mounting the plugin adds the full catalog once per session; a robot run adds only its role's share. Loading one body adds the `SKILL.md` content, typically 500 to 1,500 tokens.

#### KV Cache effect

The catalog is stable while the provider is mounted. It is appended as a durable replacement when membership changes, so it does not invalidate the prefix before it.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **Connectors need a person.** All 85 declared servers are Streamable HTTP endpoints, and most rely on Claude's interactive OAuth grant. `mcp-client` accepts a URL and static headers but performs no OAuth flow, so those declarations appear under `connectorPlan().gaps.needsOAuth` and a deployment must supply a token header (a `!!js` value in `cordis.yml`) before naming the server in a robot.
- **`allowed-tools` is dropped.** 44 vendored skills declare a Claude tool allow list. Tomato restricts tools per robot, not per skill, so the line stays in the vendored file, the adapter ignores it, and a run executes with the template's `capability.tools` lists.
- **Commands import as skills without argument placeholders.** The one vendored command (`product-management/commands/brainstorm.md`) becomes an ordinary user-invocable skill; `/brainstorm` works through the skill gesture, but `$ARGUMENTS` substitution does not exist in Tomato and the body is rewritten instead.
- **`CONNECTORS.md` links stay relative.** Bodies keep `[CONNECTORS.md](../../CONNECTORS.md)` because the vendored directory layout is preserved; a run that reads the link from another working directory will not resolve it, and the rewritten `~~category` text carries the actionable instruction instead.
- **Upstream drift is manual.** Vendored files are never edited in place, so a new upstream commit is a directory replacement plus one adapter test run. A skill the adapter cannot convert (missing `description`, a name that differs from its directory) fails the plugin load with the file path.
- **All sixteen role labels are this package's copy.** Upstream ships no card text; the English and Chinese mission, success criteria, and acceptance lines are authored here and need review when upstream adds a role.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

Re-sync from a fresh upstream checkout:

```sh
rsync -a --delete \
  --exclude .git --exclude .github --exclude partner-built --exclude pdf-viewer \
  /path/to/knowledge-work-plugins/ packages/experimental/robot-templates-knowledge-work/plugins/
```

Then run the package suite. Adding a role requires a `ROLE_COPY` entry, otherwise the plugin refuses to load and names the directory. `readPlugins` and `connectorPlan` are exported so a script or test can inspect the vendored tree without mounting the plugin.

</details>