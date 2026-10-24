# Tomato Harness

English | [中文](README.zh.md)

Tomato Harness is an internal desktop agent for creator marketing. It runs a DeepSeek Harness (`dsh`) runtime inside an Electron shell, signs in with the company account, sends every model request through the company relay, and reports turn and tool activity to an internal OTLP relay that forwards to Langfuse.

This repository is a one-time hard fork of `deepseek-harness` at commit `22ddee3792`; it does not merge upstream. Upstream packages keep their `@deepseek-ai/*` names, and Tomato-specific packages use `@tomato/*`. [docs/tomato/decisions.md](docs/tomato/decisions.md) records every product and engineering decision behind this fork.

## Summary

- **Shell**: `apps/desktop` (Electron main, preloads, welcome window, updates, coding-free packaging) and `apps/desktop-host` (the private Node host process that boots a `desktop` profile).
- **Runtime**: dsh's Cordis plugin tree. Every capability — the model adapter, the tool registry, the session log, the agent loop itself — is a plugin mounted from a profile composed of bundle layers.
- **Product surface**: the dsh web client, served by the host and loaded through the `dsh-app://` scheme, with the DeepSeek account, session-log upload, and product analytics rows switched off.
- **Company integration**: `@tomato/brand` (sidebar and hero marks), `@tomato/telemetry` (turn/tool spans), and the shell's `tomato-auth.ts` (browser sign-in, token exchange, credential write).

## Table of Contents

- [Architecture](#architecture)
- [Design decisions](#design-decisions)
- [Prerequisites](#prerequisites)
- [Initialize](#initialize)
- [Run](#run)
- [Local services](#local-services)
- [Logging and developer mode](#logging-and-developer-mode)
- [Production readiness](#production-readiness)
- [Troubleshooting](#troubleshooting)

<a id="architecture"></a>

## Architecture

### Processes

| Process | Owns | Does not own |
|---|---|---|
| Electron main (`apps/desktop`) | Window, tray, menus, shortcuts, single instance, profile initialization, credential storage, update and quit policy | Agent behavior, sessions, tools, model calls |
| Preload scripts | Whitelisted IPC bridging from the renderer to the main process | Any business logic |
| Renderer (the dsh web client) | Conversation, tool cards, approvals, settings, session navigation | Credentials, filesystem access |
| Host (`apps/desktop-host`) | The dsh runtime: agent loop, sessions, tools, model requests, HTTP and WebSocket server | Windows, the tray, native dialogs |
| Company login service | Identity, session policy, token issuance | Anything on the machine |
| Company model relay | Model routing, per-person quota, accounting | Business data |
| Company OTLP relay | Trace mapping, Langfuse credentials, redaction | Client state |

The Host listens on an OS-assigned loopback port; the main process authenticates to it once with a one-shot cookie and forwards application HTTP requests from the `dsh-app://app/` document to it. Node IPC between main and Host carries boot injections, readiness, shutdown, and quit inspection.

### Profile composition

A profile is a stack of bundle layers, each a `cordis.patch.yml` that inserts or overrides rows by id:

```text
$DSH_HOME/profiles/desktop/package.json      dsh.profile.bundles = [dsh-base, dsh-web-app]
        │
        ├── @deepseek-ai/dsh-base        shared core: llm, session, tools, shell, fs, permissions, telemetry seams
        ├── @deepseek-ai/dsh-web-app     browser surface: host controllers, web server, the client plugin roster
        │     ├── presets/standard.patch.yml   per-session agent composition
        │     ├── presets/ptc.patch.yml
        │     ├── presets/minimal.patch.yml
        │     └── presets/cordis.patch.yml
        └── $DSH_HOME/profiles/desktop/cordis.patch.yml   user and deployment overrides (last write wins)
```

Tomato's changes live in the two shipped bundle files, so a fresh profile inherits them without a second layer:

| Row | Change |
|---|---|
| `system-prompt`, four presets | Persona reads as a creator-marketing assistant |
| `agent-default-model` | `tomato-relay` / `tomato-chat` |
| `llm-pi-ai` | One hand-declared route: `api: openai-completions`, `apiKeyEnv: TOMATO_RELAY_API_KEY`, `baseURL` at the local mock |
| `deepseek-account`, `llm-deepseek`, `llm-deepseek-account`, `deepseek-llm-api-extensions`, `session-log-deepseek`, `plugin-package-inventory-deepseek` | `disabled: true` |
| `session-telemetry-otel`, `product-analytics`, `desktop-product-telemetry` | `disabled: true` |
| `web-search-deepseek`, `web-deepseek-api` | `disabled: true`; HTTP fetch stays |
| `tomato-telemetry` | New row: OTLP spans to `TOMATO_OTLP_ENDPOINT` |
| `ui-brand-official` | `disabled: true`; `@tomato/brand` takes the three brand slots |
| `ui-settings-account`, `account-controller` | `disabled: true` |

### Capability seams

Every capability has three roles, and extensions depend on the definition, never on a provider:

- **Definition** — a Cordis `Service` with a `ctx.<key>` and shared types, e.g. `ctx.agent`, `ctx.session`, `ctx.tools`, `ctx.llm`, `ctx.settings`, `ctx.credentials`, `ctx.slots`, `ctx.theme`.
- **Provider** — one concrete implementation, e.g. `dsh-llm-pi-ai` behind `ctx.llm`, `dsh-session-persistence-jsonl` behind `ctx.sessions`.
- **Consumer** — a model-facing tool or a UI plugin that only injects the definition.

Replacing a provider therefore moves the whole execution world at once: swapping the shell executor relocates Bash, PTY, and LSP together.

### Model-visible equals logged

The session log is an append-only event stream. Any content that reaches a model request must be reconstructible from that log, so plugins contribute context as ordinary user-role or system-role events rather than through a side channel. Two consequences matter here:

- `@tomato/telemetry` reads `session/event` and never writes, so it cannot alter what the model sees.
- Compaction, annotations, and replay all operate on the same log, which keeps a long conversation reproducible.

### Threading and lifecycle

- Every registration runs through `ctx.effect()` and returns a disposer, so unloading a plugin removes exactly what it added.
- Configuration reloads per profile; module roots are opt-in.
- Sessions survive restarts as JSONL under `$DSH_HOME/sessions`; the desktop keeps its state under a development or packaged Harness home, never the user's everyday `~/.dsh`.

### Client plugin composition

The web client is itself a Cordis application. `dsh-client-modules` scans every mounted row that declares `dsh.client`, composes `window.__DSH_BOOT__`, and serves each browser bundle at `/plugins/<id>/client.js`. UI composition uses typed slots:

| Slot | Declared by | Occupant |
|---|---|---|
| `sidebar.brand.mark`, `sidebar.brand.name` | `ui-sidebar` | `@tomato/brand` |
| `conversation.hero.brand.mark` | `ui-conversation` | `@tomato/brand` |
| `tool.call.toolview` (keyed by wire tool name) | `ui-tool` | Built-in cards; future business cards |

A UI plugin registers into a slot it does not declare, and waits on the owner's declaration through `ctx.slots.inject`, so occupants follow the owner's lifetime.

<a id="design-decisions"></a>

## Design decisions

| Decision | Choice | Why |
|---|---|---|
| Repository model | One-time hard fork, no upstream merge | The product diverges structurally; ledger-style tracking would have no reference point |
| Product codes | `packages/tomato/*`, `@tomato/*` | Distinguishable from upstream at a glance, without a repository-wide rename |
| Change location | Direct edits to the two shipped bundles | One place to read; a new bundle layer would hide the divergence |
| Model access | `llm-pi-ai` with one declared route | Zero kernel change; the relay is an OpenAI-compatible endpoint |
| Model list | Discovered from `GET /v1/models` | The relay owns its catalog; a hard-coded id would drift |
| Sign-in | Company desktop token endpoint, browser redirect to a loopback listener | No embedded browser, no credential in a URL; the token never reaches the renderer |
| Token storage | Electron `safeStorage` under `userData`, plus the Host credential store | The welcome flow can answer "signed in?" before the Host starts; the relay route resolves the same value per request |
| Telemetry | Own OTLP reporter to an internal relay | Langfuse credentials stay server-side; dsh's own channels are off |
| Brand | Slot occupants plus a single-color glyph | Slot composition is the supported route; `currentColor` follows both themes |
| Distribution | Unsigned macOS arm64 build, no auto-update | Internal audience; signing and feeds come with production |

<a id="prerequisites"></a>

## Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| Node.js | `>= 24.9.0` (repo `engines`) | The Desktop payload pins its own Node for packaged runs |
| pnpm | `11.28.5` | `packageManager` in the root manifest; `corepack enable` installs it |
| Git | any recent | The build embeds the commit hash in client artifacts |
| macOS | arm64 | The only distribution target; the shell also builds on Windows upstream |
| Disk | ~3 GB | `node_modules`, `~/.dsh`-style build caches, Electron (≈300 MB), the primary runtime payload |
| Network | npm registry, PyPI, `electron` release host | The payload downloads pinned archives; an internal mirror is fine |

Optional for a first run: nothing. The local mock serves the model, login, and relay, so no credentials are needed.

<a id="initialize"></a>

## Initialize

```sh
git clone <this repository> tomatoHarness
cd tomatoHarness
corepack enable
pnpm install
pnpm run build:artifacts      # Host, Client bundles, and the Web frontend (~30 s warm)
```

`build:artifacts` writes `apps/web/dist`, every `packages/*/*/lib`, `apps/cli/lib`, `apps/desktop/lib`, and `apps/desktop-host/lib`. `pnpm run build` additionally records the client artifact digest.

If Electron's binary download stalls, point it at a mirror and reinstall just that package:

```sh
ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/ \
  pnpm --filter @deepseek-ai/dsh-desktop exec install-electron
```

<a id="run"></a>

## Run

<a id="run-from-source"></a>

### Run from source

Two terminals:

```sh
# 1) local stand-ins for the relay, the login service, and the OTLP sink
pnpm run mock:tomato

# 2) the desktop application (builds, prepares the payload, launches Electron)
TOMATO_OTLP_ENDPOINT=http://127.0.0.1:4010/v1/traces \
TOMATO_AUTH_URL=http://127.0.0.1:4010 \
pnpm run dev:desktop
```

`dev:desktop` runs the artifact build, materializes a disposable project under `apps/desktop/.desktop-build/development`, prepares the primary runtime on first use (a several-hundred-megabyte download), and launches Electron with:

| Variable | Development default | Purpose |
|---|---|---|
| `DSH_HOME` | `apps/desktop/.desktop-build/development/home` | Sessions, settings, credentials |
| `DSH_DESKTOP_USER_DATA_DIR` | `…/development/electron-user-data` | Chromium profile and the token file |
| `DSH_DESKTOP_PRIMARY_RUNTIME_DIR` | `…/targets/mac-arm64/runtime/primary-runtime` | Python, Office libraries, pnpm; required by an unpackaged launch |
| `DSH_DESKTOP_MAIN_INSPECT_PORT` | `9229` | Main-process inspector |
| `DSH_DESKTOP_RENDERER_DEBUG_PORT` | `9222` | Renderer debugging protocol |
| `DSH_DESKTOP_HOST_INSPECT_PORT` | `9230` | Host-process inspector |
| `DSH_DESKTOP_OPEN_DEVTOOLS` | `1` | Open a detached DevTools window on launch |

Skip the rebuild on a later launch with `pnpm run start:desktop`.

<a id="local-services"></a>

## Local services

`pnpm run mock:tomato` is one process on port 4010 serving all three off-machine dependencies:

| Route | Serves |
|---|---|
| `GET /v1/models` | A two-model catalog for the Models page |
| `POST /v1/chat/completions` | OpenAI-compatible SSE; a prompt mentioning 「列出目录」 produces one `bash` tool call |
| `GET /desktop/authorize` | The login page; approves immediately and redirects to the CLI listener with a code |
| `POST /desktop/token` | Exchanges that code for a token |
| `POST /v1/traces` | Accepts OTLP batches and logs their size |

Pointing a real deployment at the company services means changing three values: the relay `baseURL` (Models page or the profile patch), `TOMATO_AUTH_URL`, and `TOMATO_OTLP_ENDPOINT`.

<a id="logging-and-developer-mode"></a>

## Logging and developer mode

### Diagnostic log

The shell writes one rolling JSONL-style text log per day under the platform logs directory (`~/Library/Logs/Tomato Harness/` on macOS, `%APPDATA%\Tomato Harness\logs` on Windows under Electron's logs path):

```text
2026-10-24T05:12:31.481Z [info] shell started (version 0.2.1-rc.3, developer=true) { electron: '44.7.0', ... }
2026-10-24T05:12:32.907Z [host] stdout: dsh web listening on http://127.0.0.1:52341
2026-10-24T05:12:33.010Z [info] host ready at http://127.0.0.1:52341
2026-10-24T05:13:02.114Z [renderer] http://dsh-app:3951/…:1 Uncaught TypeError: …
2026-10-24T05:13:02.115Z [error] fatal (renderer) Error: …
```

Recorded channels: `info` (lifecycle), `host` (Host stdout and stderr, passed through unchanged to the terminal), `renderer` (error-level console lines with their bundle location), `warn`, and `error` (uncaught exceptions, unhandled rejections, and every fatal path). Files roll at 8 MB and keep five by modification time. Credential-shaped substrings — bearer tokens, `sk-…` keys, `TOMATO_RELAY_API_KEY=…` assignments, and `?token=` query values — are redacted before the line is written.

### Developer mode

Developer mode adds a Developer submenu and keeps DevTools reachable in a packaged build:

| Entry point | Effect |
|---|---|
| `TOMATO_DEVELOPER_MODE=1` | On in a packaged build (an unpackaged launch is on unless set to `0`) |
| Developer → Open DevTools (`CmdOrCtrl+Alt+I`) | Opens the renderer's DevTools window |
| Developer → Inspect Element (`CmdOrCtrl+Shift+C`) | Forwards the browser's element-picker shortcut |
| Developer → Reload Page (`CmdOrCtrl+R`) | Reloads the application document |
| Developer → Show Log File in Finder / Open Log File | Reveals or opens today's diagnostic log |

### Locating client code from a log line

Client bundles are built with sourcemaps whose sources are rewritten to `../../../packages/<group>/<package>/src/…` and whose `sourcesContent` carries the original TSX; `dsh-client-modules` serves the map beside the bundle at `/plugins/<id>/client.js.map`. A logged location therefore resolves two ways:

1. **In the log**: `http://dsh-app:…/plugins/@tomato/brand/client.js:42` names the plugin and bundle line. Open `packages/tomato/brand/src/client/…` — the map in DevTools → Sources shows the exact TSX line.
2. **In DevTools**: with the application document open, Sources lists `packages/…` files because the map carries their text; a breakpoint or a thrown error lands on the authored line, not the bundled one.

For the Host side, `DSH_DESKTOP_HOST_INSPECT_PORT` attaches a Node inspector to the Host process, and Host stack traces address `packages/…/lib/*.js` with matching maps.

<a id="production-readiness"></a>

## Production readiness

M1 is an internal, unsigned, unreleased build. The gaps below are ordered by what blocks a wider rollout.

### Blocking

1. **Server endpoints** — the desktop token endpoint (`/desktop/authorize`, `/desktop/token`), the internal OTLP relay, and the business MCP gateway are mocks. Each needs a real implementation, an agreed token lifetime, and revocation.
2. **Code signing and notarization** — an unsigned build stops at Gatekeeper on every machine and cannot be installed by a non-technical user. Signing needs a Developer ID certificate, `notarize`, and a stable bundle id (`DSH_DESKTOP_APP_ID`).
3. **Update channel** — there is no feed, no update policy, and no rollback. Shipping means choosing a feed host, a channel name, and whether updates are mandatory.
4. **Secret hygiene at rest** — the token file falls back to plaintext when `safeStorage` is unavailable (Linux without a keyring, or a locked keychain). A packaged macOS build has Keychain access, but the fallback should refuse to start rather than silently downgrade.
5. **Permission posture** — `danger-full-access` lets model output drive arbitrary local commands. A production build should either hide that preset or require an explicit, per-machine unlock.

### Important

6. **Crash reporting** — crash reports are written locally and never uploaded. A production build needs an opt-in upload path with the same redaction rules as the diagnostic log.
7. **Telemetry content policy** — spans deliberately carry timing and outcome only. If prompt or response capture is wanted, redaction and retention are a product decision, not an engineering default.
8. **Session data lifecycle** — JSONL sessions accumulate under the Harness home with no retention policy, no export, and no per-user quota.
9. **Business UIs** — tool cards for the MCP tools and the right-sidebar detail view are M2 work; until then business results render as generic JSON cards.
10. **Localization coverage** — the shell ships eight languages, but the business copy and the new product name are only reviewed in Chinese and English.
11. **Model catalog drift** — the declared `tomato-chat` placeholder resolves only through the relay's listing. An offline or listing-less relay leaves the picker on a model the gateway may not serve.
12. **Accessibility and keyboard** — the welcome flow and the Developer menu are not covered by the repository's UI review skills; both should be checked with a screen reader before release.

### Nice to have

13. **Reproducible builds** — the client artifact digest is recorded, but the primary runtime payload is downloaded rather than vendored; an internal mirror with pinned checksums would make offline builds possible.
14. **Windows** — the code paths exist upstream and remain untested here; packaging, signing, and the installer are out of scope for M1.
15. **Test depth** — the shell has unit and built-Host acceptance tests, but no end-to-end run of the packaged application.

<a id="troubleshooting"></a>

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `Downloading Electron binary...` never finishes | The release host is slow or blocked | Reinstall with `ELECTRON_MIRROR` as shown above |
| `The operation was aborted due to timeout` from `dev:desktop` | The primary runtime download exceeded its timeout | Pre-run `pnpm --filter @deepseek-ai/dsh-desktop run prepare:primary-runtime`, or raise `DSH_RESOURCE_DOWNLOAD_TIMEOUT_MS` |
| Welcome window shows, sign-in never returns | No login service reachable at `TOMATO_AUTH_URL` | Start `pnpm run mock:tomato`; confirm the port matches |
| Conversation replies fail with a missing credential | The token was never written to the Host store | Sign in again; the shell writes `TOMATO_RELAY_API_KEY` on exchange |
| Model list is empty | The relay has no `/v1/models` | Check `curl $TOMATO_RELAY_BASE_URL/models` |
| Logs are missing | `app.setAppLogsPath()` picks the platform directory | Run `pnpm run dev:desktop` and read the printed `userData` path; logs sit beside it |

## License

Upstream dsh is MIT-licensed; see [LICENSE](LICENSE) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
