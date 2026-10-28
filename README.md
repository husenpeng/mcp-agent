# Tomato AI

English | [中文](README.zh.md)

Tomato AI is an internal desktop agent for creator marketing. It runs a Tomato Harness (`tomato`) runtime inside an Electron shell, signs in with the company account, sends model requests to the third-party API configured on the Models page, and reports turn and tool activity to an internal OTLP relay that forwards to Langfuse.

This repository is a one-time hard fork of `deepseek-harness` at commit `22ddee3792`; it does not merge upstream. Every package in this repository uses the `@tomato/*` scope. [docs/tomato/decisions.md](docs/tomato/decisions.md) records every product and engineering decision behind this fork.

## Summary

- **Shell**: `apps/desktop` (Electron main, preloads, welcome window, updates, coding-free packaging) and `apps/desktop-host` (the private Node host process that boots a `desktop` profile).
- **Runtime**: Tomato's Cordis plugin tree. Every capability — the model adapter, the tool registry, the session log, the agent loop itself — is a plugin mounted from a profile composed of bundle layers.
- **Product surface**: the Tomato web client, served by the host and loaded through the `tomato-app://` scheme, with the DeepSeek account, session-log upload, and product analytics rows switched off.
- **Company integration**: `@tomato/brand` (sidebar and hero marks), `@tomato/telemetry` (turn/tool spans), and the shell's `tomato-auth.ts` (browser sign-in, token exchange, credential write).

## Table of Contents

- [Architecture](#architecture)
- [Design decisions](#design-decisions)
- [Prerequisites](#prerequisites)
- [Initialize](#initialize)
- [Run](#run)
- [Sign-in](#sign-in)
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
| Renderer (the tomato web client) | Conversation, tool cards, approvals, settings, session navigation | Credentials, filesystem access |
| Host (`apps/desktop-host`) | The tomato runtime: agent loop, sessions, tools, model requests, HTTP and WebSocket server | Windows, the tray, native dialogs |
| Company login service | Identity, session policy, token issuance | Anything on the machine |
| Company OTLP relay | Trace mapping, Langfuse credentials, redaction | Client state |

The Host listens on an OS-assigned loopback port; the main process authenticates to it once with a one-shot cookie and forwards application HTTP requests from the `tomato-app://app/` document to it. Node IPC between main and Host carries boot injections, readiness, shutdown, and quit inspection.

### Profile composition

A profile is a stack of bundle layers, each a `cordis.patch.yml` that inserts or overrides rows by id:

```text
$TOMATO_HOME/profiles/desktop/package.json      tomato.profile.bundles = [@tomato/base, @tomato/web-app]
        │
        ├── @tomato/base        shared core: llm, session, tools, shell, fs, permissions, telemetry seams
        ├── @tomato/web-app     browser surface: host controllers, web server, the client plugin roster
        │     ├── presets/standard.patch.yml   per-session agent composition
        │     ├── presets/ptc.patch.yml
        │     ├── presets/minimal.patch.yml
        │     └── presets/cordis.patch.yml
        └── $TOMATO_HOME/profiles/desktop/cordis.patch.yml   user and deployment overrides (last write wins)
```

Tomato's changes live in the two shipped bundle files, so a fresh profile inherits them without a second layer:

| Row | Change |
|---|---|
| `system-prompt`, four presets | Persona reads as a creator-marketing assistant |
| `agent-default-model` | Empty provider/model: no default until the user selects one |
| `llm-pi-ai` | No routes shipped; the Models page declares third-party OpenAI- or Anthropic-compatible endpoints |
| `deepseek-account`, `llm-deepseek`, `llm-deepseek-account`, `deepseek-llm-api-extensions`, `session-log-deepseek`, `plugin-package-inventory-deepseek` | `disabled: true` |
| `session-telemetry-otel`, `product-analytics`, `desktop-product-telemetry` | `disabled: true` |
| `web-search-deepseek`, `web-deepseek-api` | `disabled: true`; HTTP fetch stays |
| `tomato-telemetry` | New row: OTLP spans to `TOMATO_OTLP_ENDPOINT` |
| `ui-brand-official` | `disabled: true`; `@tomato/brand` takes the three brand slots |
| `ui-settings-account`, `account-controller` | `disabled: true`; `@tomato/account` registers the sidebar launcher and Account settings section |
| `tomato-gateway` | New row: same-origin `/api/auth/*` and fixed-table `/api/services/*` |

### Capability seams

Every capability has three roles, and extensions depend on the definition, never on a provider:

- **Definition** — a Cordis `Service` with a `ctx.<key>` and shared types, e.g. `ctx.agent`, `ctx.session`, `ctx.tools`, `ctx.llm`, `ctx.settings`, `ctx.credentials`, `ctx.slots`, `ctx.theme`.
- **Provider** — one concrete implementation, e.g. `@tomato/llm-pi-ai` behind `ctx.llm`, `@tomato/session-persistence-jsonl` behind `ctx.sessions`.
- **Consumer** — a model-facing tool or a UI plugin that only injects the definition.

Replacing a provider therefore moves the whole execution world at once: swapping the shell executor relocates Bash, PTY, and LSP together.

### Model-visible equals logged

The session log is an append-only event stream. Any content that reaches a model request must be reconstructible from that log, so plugins contribute context as ordinary user-role or system-role events rather than through a side channel. Two consequences matter here:

- `@tomato/telemetry` reads `session/event` and never writes, so it cannot alter what the model sees.
- Compaction, annotations, and replay all operate on the same log, which keeps a long conversation reproducible.

### Threading and lifecycle

- Every registration runs through `ctx.effect()` and returns a disposer, so unloading a plugin removes exactly what it added.
- Configuration reloads per profile; module roots are opt-in.
- Sessions survive restarts as JSONL under `$TOMATO_HOME/sessions`; the desktop keeps its state under a development or packaged Harness home, never the user's everyday `~/.tomato`.

### Client plugin composition

The web client is itself a Cordis application. `@tomato/client-modules` scans every mounted row that declares `tomato.client`, composes `window.__TOMATO_BOOT__`, and serves each browser bundle at `/plugins/<id>/client.js`. UI composition uses typed slots:

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
| Model access | `llm-pi-ai` with user-declared routes on the Models page | No route ships; any OpenAI- or Anthropic-compatible third-party API works without kernel changes |
| Model list | Discovered per provider from its listing, or entered by hand | The provider owns its catalog; a hard-coded id would drift |
| Sign-in | Company Feishu flow through the company BFF, one-time handoff code to the local gateway | Feishu secrets stay server-side; the browser never receives the session id in a URL |
| Token storage | Electron `safeStorage` under `userData`; the main process injects `X-Tomato-Session` | Neither the renderer nor the Host credential store receives the session id |
| Telemetry | Own OTLP reporter to an internal relay | Langfuse credentials stay server-side; tomato's own channels are off |
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
| Disk | ~3 GB | `node_modules`, `~/.tomato`-style build caches, Electron (≈300 MB), the primary runtime payload |
| Network | npm registry, PyPI, `electron` release host | The payload downloads pinned archives; an internal mirror is fine |

Optional for a first run: a model provider. The account surface needs `AUTH_SERVICE_URL` and `TOMATO_WEB_URL` for company sign-in; without them the workspace still starts and local sessions work. Add a third-party model API in Settings → Models before the first message.

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
  pnpm --filter @tomato/desktop exec install-electron
```

<a id="run"></a>

## Run

<a id="run-from-source"></a>

### Run from source

Two terminals:

```sh
# 1) external login services: services-monorepo auth_service and the company BFF
#    (their origins are configured on the gateway; see the handoff contract)

# 2) the desktop application (builds, prepares the payload, launches Electron)
pnpm run dev:desktop
```

`dev:desktop` reads `apps/desktop/config/development.env` for its local login origins (`http://localhost:8020` and `http://localhost:3000`), so no shell exports are needed; an explicit `AUTH_SERVICE_URL` / `TOMATO_WEB_URL` in the launching shell still wins. Optional telemetry uses the inherited environment, for example `TOMATO_OTLP_ENDPOINT=http://127.0.0.1:4318/v1/traces pnpm run dev:desktop`.

Without the external login services the workspace still starts; the account surface reports “sign-in service unavailable” and local sessions, tools, and the configured model provider keep working.

Packaged builds seal `TOMATO_DESKTOP_AUTH_SERVICE_URL` and `TOMATO_DESKTOP_TOMATO_WEB_URL` from the selected packaging file into the application manifest (see [packaging](apps/desktop/packaging/README.md)); the variables above are only for source launches, and an explicit launch value still overrides a sealed one.

`dev:desktop` runs the artifact build, materializes a disposable project under `apps/desktop/.desktop-build/development`, prepares the primary runtime on first use (a several-hundred-megabyte download), and launches Electron with:

| Variable | Development default | Purpose |
|---|---|---|
| `TOMATO_HOME` | `apps/desktop/.desktop-build/development/home` | Sessions, settings, credentials |
| `TOMATO_DESKTOP_USER_DATA_DIR` | `…/development/electron-user-data` | Chromium profile and the token file |
| `TOMATO_DESKTOP_PRIMARY_RUNTIME_DIR` | `…/targets/mac-arm64/runtime/primary-runtime` | Python, Office libraries, pnpm; required by an unpackaged launch |
| `TOMATO_DESKTOP_MAIN_INSPECT_PORT` | `9229` | Main-process inspector |
| `TOMATO_DESKTOP_RENDERER_DEBUG_PORT` | `9222` | Renderer debugging protocol |
| `TOMATO_DESKTOP_HOST_INSPECT_PORT` | `9230` | Host-process inspector |
| `TOMATO_DESKTOP_OPEN_DEVTOOLS` | `1` | Open a detached DevTools window on launch |

Skip the rebuild on a later launch with `pnpm run start:desktop`.

<a id="sign-in"></a>

### Sign-in

Sign-in runs through the company web application's Feishu routes. The local gateway is the only origin the browser calls; it never holds Feishu secrets:

1. The welcome window's **Sign in** button opens the Host's `/api/auth/start` in an isolated Electron window (Web uses a popup).
2. The gateway generates a `state` and a `verifier`, keeps the verifier, and redirects to the company BFF's `/api/auth/feishu/start` with the verifier challenge and a loopback callback.
3. The BFF completes Feishu OAuth at its own origin, exchanges the code with auth_service, and mints a one-time handoff code bound to the challenge.
4. The BFF redirects to the gateway's `/api/auth/callback`; the gateway redeems the code with the verifier and sets the httpOnly `tomato_session` cookie.
5. Desktop reads that cookie once, stores the session id with `safeStorage`, and injects `X-Tomato-Session` on forwarded Host requests. The renderer and the Host credential store never receive it.

Session state is verified with auth_service on every `/api/auth/session` read and every `/api/services/*` request. Sign-out attempts `/api/v1/auth/session/revoke`, then clears local state even when the upstream call fails.

| Variable | Default | Meaning |
|---|---|---|
| `AUTH_SERVICE_URL` | `''` | auth_service base URL; empty keeps login unavailable |
| `TOMATO_WEB_URL` | `''` | Company BFF base URL; empty keeps login unavailable |

The exact mint/redeem contract is in [docs/tomato/auth-handoff-contract.md](docs/tomato/auth-handoff-contract.md). Both endpoints are server-side work; until they exist, the account surface reports unavailable and no mock fallback is used.

<a id="configure-models"></a>

### Configure a model provider

No model route ships in the base composition. Open **Settings → Models**, choose **Add model provider → Custom model API**, and enter a Provider ID, endpoint, API protocol, at least one model, and the API key. The page writes the route profile into the active profile and stores the key write-only; the key never returns to the browser.

| Data | Stored in | Protection |
|---|---|---|
| Provider profile (ID, display name, protocol, base URL, models) | `$TOMATO_HOME/profiles/desktop/cordis.patch.yml` | Plain YAML owned by the OS user |
| API key (`<ROUTE>_API_KEY`) | `$TOMATO_HOME/.credentials.yaml` | Mode 0600; POSIX refuses a file other users can read; the Client receives only configured/missing state |
| Desktop sign-in session | `userData/tomato-auth.json` | `safeStorage` encryption when available; injected only as `X-Tomato-Session` by the main process |

The credential file is plaintext YAML guarded by OS user permissions. The agent runs tools as the same OS user, so file permissions do not isolate a key from the agent itself. Custom provider `headers` remain deployment configuration in `cordis.patch.yml`; the page does not edit them.

<a id="local-services"></a>

## Local gateway

For company services, the browser calls only the Host's same-origin gateway. It has no mock routes:

| Route | Serves |
|---|---|
| `GET /api/auth/start` | Creates a login attempt and redirects to the company BFF |
| `GET /api/auth/callback` | Redeems the handoff code and sets `tomato_session` |
| `GET /api/auth/session` | Three-state account projection verified with auth_service |
| `POST /api/auth/logout` | Revokes the auth_service session best-effort and clears the cookie |
| `/api/services/<service>/<path>` | Fixed-table forwarding with verified-user identity; no browser-supplied host |

auth_service, the company BFF, and every future service entry are external processes. Run them separately and fill `AUTH_SERVICE_URL` / `TOMATO_WEB_URL`; the gateway starts with both empty and reports login unavailable. OTLP telemetry remains a direct Host request to `TOMATO_OTLP_ENDPOINT`, not a gateway route.

<a id="logging-and-developer-mode"></a>

## Logging and developer mode

### Diagnostic log

The shell writes one rolling JSONL-style text log per day under the platform logs directory (`~/Library/Logs/Tomato AI/` on macOS, `%APPDATA%\Tomato AI\logs` on Windows under Electron's logs path):

```text
2026-10-24T05:12:31.481Z [info] shell started (version 0.2.1-rc.3, developer=true) { electron: '44.7.0', ... }
2026-10-24T05:12:32.907Z [host] stdout: tomato web listening on http://127.0.0.1:52341
2026-10-24T05:12:33.010Z [info] host ready at http://127.0.0.1:52341
2026-10-24T05:13:02.114Z [renderer] http://tomato-app:3951/…:1 Uncaught TypeError: …
2026-10-24T05:13:02.115Z [error] fatal (renderer) Error: …
```

Recorded channels: `info` (lifecycle), `host` (Host stdout and stderr, passed through unchanged to the terminal), `renderer` (error-level console lines with their bundle location), `warn`, and `error` (uncaught exceptions, unhandled rejections, and every fatal path). Files roll at 8 MB and keep five by modification time. Credential-shaped substrings — bearer tokens, `sk-…` keys, and `?token=` query values — are redacted before the line is written.

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

Client bundles are built with sourcemaps whose sources are rewritten to `../../../packages/<group>/<package>/src/…` and whose `sourcesContent` carries the original TSX; `@tomato/client-modules` serves the map beside the bundle at `/plugins/<id>/client.js.map`. A logged location therefore resolves two ways:

1. **In the log**: `http://tomato-app:…/plugins/@tomato/brand/client.js:42` names the plugin and bundle line. Open `packages/tomato/brand/src/client/…` — the map in DevTools → Sources shows the exact TSX line.
2. **In DevTools**: with the application document open, Sources lists `packages/…` files because the map carries their text; a breakpoint or a thrown error lands on the authored line, not the bundled one.

For the Host side, `TOMATO_DESKTOP_HOST_INSPECT_PORT` attaches a Node inspector to the Host process, and Host stack traces address `packages/…/lib/*.js` with matching maps.

<a id="production-readiness"></a>

## Production readiness

M1 is an internal, unsigned, unreleased build. The gaps below are ordered by what blocks a wider rollout.

### Blocking

1. **Server endpoints** — auth_service and the company BFF do not implement the handoff mint/redeem contract yet, and the business MCP gateway is not implemented. Until they do, sign-in is unavailable; no mock fallback ships.
2. **Code signing and notarization** — an unsigned build stops at Gatekeeper on every machine and cannot be installed by a non-technical user. Signing needs a Developer ID certificate, `notarize`, and a stable bundle id (`TOMATO_DESKTOP_APP_ID`).
3. **Update channel** — there is no feed, no update policy, and no rollback. Shipping means choosing a feed host, a channel name, and whether updates are mandatory.
4. **Secret hygiene at rest** — the session file falls back to plaintext when `safeStorage` is unavailable (Linux without a keyring, or a locked keychain). A packaged macOS build has Keychain access, but the fallback should refuse to start rather than silently downgrade.
5. **Permission posture** — `danger-full-access` lets model output drive arbitrary local commands. A production build should either hide that preset or require an explicit, per-machine unlock.

### Important

6. **Crash reporting** — crash reports are written locally and never uploaded. A production build needs an opt-in upload path with the same redaction rules as the diagnostic log.
7. **Telemetry content policy** — spans deliberately carry timing and outcome only. If prompt or response capture is wanted, redaction and retention are a product decision, not an engineering default.
8. **Session data lifecycle** — JSONL sessions accumulate under the Harness home with no retention policy, no export, and no per-user quota.
9. **Business UIs** — tool cards for the MCP tools and the right-sidebar detail view are M2 work; until then business results render as generic JSON cards.
10. **Localization coverage** — the shell ships eight languages, but the business copy and the new product name are only reviewed in Chinese and English.
11. **Model configuration is manual** — no route ships and there is no organization-managed default. A first run must add a third-party endpoint and key before it can send a message.
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
| `The operation was aborted due to timeout` from `dev:desktop` | The primary runtime download exceeded its timeout | Pre-run `pnpm --filter @tomato/desktop run prepare:primary-runtime`, or raise `TOMATO_RESOURCE_DOWNLOAD_TIMEOUT_MS` |
| Sign-in says the service is unavailable | `AUTH_SERVICE_URL` or `TOMATO_WEB_URL` is empty/unreachable, or the BFF lacks the handoff endpoints | Fill both values and verify the contract in `docs/tomato/auth-handoff-contract.md` |
| Conversation replies fail with a missing credential | The route's API key was never stored | Re-enter the key on Settings → Models; it is written to the credential store, not the profile |
| Model list is empty | No provider is configured, or its listing failed | Add or edit a provider on Settings → Models, then use **Fetch available models** |
| Sending a message asks for a model | No default model is selected | Pick a model from the composer, or configure a provider first |
| Logs are missing | `app.setAppLogsPath()` picks the platform directory | Run `pnpm run dev:desktop` and read the printed `userData` path; logs sit beside it |

## License

Upstream tomato is MIT-licensed; see [LICENSE](LICENSE) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
