# Loadable Harness plugin packages

This file is GENERATED from workspace manifests (`scripts/gen-plugin-packages.ts`) and verified fresh by `pnpm run verify-plugin-packages` (part of `doc-sync`); do not edit it by hand.

Every package below exports a Cordis plugin that a bundle patch can name in a Loader row. `Config` marks packages whose row accepts a `config` mapping; query `Config.listConfigs` through `cordis_inspect_query` (filter by `name`, then query the `entry` id) for the mounted schema. Packages under `experimental` are pre-stable.

## acp

| Package | Config | Description |
|---|---|---|
| `@tomato/acp` | yes | Automation-only Agent Client Protocol server for driving Tomato Harness agents over JSON-RPC stdio |

## api

| Package | Config | Description |
|---|---|---|
| `@tomato/api-account-controller` | no | Expose safe account operations over authenticated Remote |
| `@tomato/api-gateway` | yes | Typert Remote Host dispatcher and Client API endpoint |
| `@tomato/api-job-controller` | yes | Job Remote observation stream and the reference-counted client job-output service |
| `@tomato/api-remote-access` | no | Method-level Remote access control for non-owner Peers and the per-Peer access snapshot |
| `@tomato/api-remotes` | no | Remote BFF assembly for application-selected Host capabilities |
| `@tomato/api-session-controller` | yes | Session Remote commands, cold reads, and live control transport |
| `@tomato/api-settings-controller` | yes | Remote owner for the configuration surfaces over the settings-domain seams |
| `@tomato/api-terminal-controller` | yes | Session-owned interactive terminals with shell discovery, screen recovery and typed Remote control |
| `@tomato/api-workspace-controller` | yes | Workspace Remote commands and reconnect-safe state transport |
| `@tomato/api-workspace-files` | yes | Workspace file service and Client resource provider: bounded reads, directory listing, and live metadata over the workspaceFiles Remote namespace |

## attachment

| Package | Config | Description |
|---|---|---|
| `@tomato/attachment-local` | yes | Private content-addressed TOMATO_HOME attachment storage |

## boot

| Package | Config | Description |
|---|---|---|
| `@tomato/config-editor` | no | Persist plugin configuration through profile patches and Loader reconciliation |
| `@tomato/hmr` | yes | Coordinated module and profile configuration hot reload |
| `@tomato/plugin-manager` | yes | Current-profile plugin and bundle management shared by tomato CLI, Web and agent tools |
| `@tomato/plugin-market` | yes | Configured plugin market indexes for the Web Discover page and the plugin_market agent tool |

## browser-use

| Package | Config | Description |
|---|---|---|
| `@tomato/browser-use` | no | Exclusive named browser-use provider registration |

## bundle

| Package | Config | Description |
|---|---|---|
| `@tomato/acp-app` | no | The tomato ACP profile bundle: automation-only JSON-RPC stdio and process lifecycle over @tomato/base |
| `@tomato/headless` | yes | The tomato one-shot bundle: a direct core Agent/Session runner over @tomato/base with no Host, HTTP, or browser layer |
| `@tomato/sdk-app` | yes | The tomato SDK profile bundle: stdio JSON-RPC serving and process lifecycle over @tomato/base |
| `@tomato/web-app` | yes | The tomato browser-surface bundle: the web patch layer over @tomato/base plus the runtime glue plugin (frontend dist serving, bash runtime variables, URL line) |

## client

| Package | Config | Description |
|---|---|---|
| `@tomato/client-connection` | yes | Authenticated RPC transport and generation lifecycle |
| `@tomato/client-file-upload` | no | Agent-scoped browser file upload, streaming intake, and staged receipt service |
| `@tomato/client-hmr` | yes | Web client graph synchronization and rebuilt-bundle reload transport |
| `@tomato/client-locale` | no | Locale plugin: Host-backed preference, extensible language catalog, browser fallback, and typed built-in dictionaries |
| `@tomato/client-modules` | no | Client module system, dual-face: node half composes the __TOMATO_BOOT__ entry graph (incremental tomato.client scan, bundle route, index tap, webPlugins service); browser half is the lazy-CJS module table the vendored cordis Loader consumes as its internal seam |
| `@tomato/client-product-analytics` | yes | Desktop product event collection and authenticated Host reporting |
| `@tomato/client-resources` | no | Unified client resource model: protocol-registered providers turn URL addresses into live values, consumed through the useResource global standard hook |
| `@tomato/client-shortcuts` | yes | Application keyboard command registry and physical-key routing |
| `@tomato/client-ui-agent-preset` | no | Agent-preset surfaces: the default for later sessions, this session's seat, and the composition editor |
| `@tomato/client-ui-approval` | no | Approval composer takeover over the scoped Remote Event waterfall |
| `@tomato/client-ui-attachment` | no | Dynamic attachment presentation plugin for conversation input, message-image, and trajectory image slots |
| `@tomato/client-ui-brand-official` | no | Official Tomato Harness brand occupants for the Web client's sidebar slots |
| `@tomato/client-ui-chat` | no | Chat Conversation target, node definitions, renderers, and details surface |
| `@tomato/client-ui-commands` | no | Client command surface: global directory cache, '/' source, three command UI kinds, popupSelect registry |
| `@tomato/client-ui-conversation` | no | Target-neutral Conversation assembly, shell, composer, queue, and view navigation |
| `@tomato/client-ui-deepseek-model-label-1017` | no | Temporary 1017 release badge for official DeepSeek Flash model labels |
| `@tomato/client-ui-deliverables` | no | Changed-files card with per-file comparison tabs, delivery cards, and clickable final-response file references for Web |
| `@tomato/client-ui-directory-picker-browse` | no | In-app directory browsing surface: the workspace directory-flow owner rendering the host's listing and creation primitives |
| `@tomato/client-ui-directory-picker-native` | no | Native directory-picker surface: the renderless workspace directory-flow occupant driving the local Desktop or Host OS chooser |
| `@tomato/client-ui-entry-customization` | no | Customize plugin entries in the left sidebar, conversation views, and right sidebar, and quickly create new plugins. |
| `@tomato/client-ui-file-drag` | no | Application-owned file drag transfers and localized failure feedback |
| `@tomato/client-ui-goal` | no | Session goal surface: GoalBar docked above the composer, read from the goal session projection |
| `@tomato/client-ui-input-trigger` | no | Input trigger pipeline: '/' and '@' detection, candidate menu, pick routing to registered sources |
| `@tomato/client-ui-jobs` | no | Session-header background-job list with on-demand streaming record panels |
| `@tomato/client-ui-layout` | no | Shell plugin: three-column AppFrame with drag handles, ctx.layout viewing-state service (navigation + panels) |
| `@tomato/client-ui-message-feedback` | no | The Web feedback surface: per-message Like/Dislike in the assistant-message action strip and the feedback dialog behind both ratings and /feedback, backed by the messageFeedback and sessionFeedback Host Remotes |
| `@tomato/client-ui-model-selection` | no | Model selection over the shared model catalog, Session projection, and session.selectModel |
| `@tomato/client-ui-open-in-app` | no | Web "Open In..." controls: the Session-header split button opening the workspace directory in an installed application, and the document preview's default-application controls for one file |
| `@tomato/client-ui-permission-presets` | no | Permission surfaces: a new-session default in General settings and a current-session /permission popup over the permissions projection |
| `@tomato/client-ui-plan` | no | Plan mode controls, persistent transcript plan cards, and sidebar Markdown previews |
| `@tomato/client-ui-plugin-manager` | yes | Plugin management for the tomato web client: the sidebar Plugins panel installs, enables, disables, retries, and composes installed plugin packages |
| `@tomato/client-ui-plugin-market` | no | Discover tab of the tomato web Plugins page: browse configured plugin market indexes and install their bundles |
| `@tomato/client-ui-reference` | no | Unified Web @file and @session reference source |
| `@tomato/client-ui-renderer` | no | Browser UI renderer: React slot bindings, ctx.uiRenderer, and the assembled application root |
| `@tomato/client-ui-schedule` | no | Host task management page and Session reminder catalog |
| `@tomato/client-ui-secret-mask` | no | Web display masking for recognized credentials in sent user text |
| `@tomato/client-ui-session` | no | Session Controller adapter for React and session-scoped slots |
| `@tomato/client-ui-settings` | no | Settings domain base plugin: shared configuration forms and the canonical settings slot-type contract |
| `@tomato/client-ui-settings-account` | yes | Manage DeepSeek login and open Platform billing pages |
| `@tomato/client-ui-settings-agent-loop` | no | Settings page of the agent loop on the tomato web client's Plugins page: the parallel tool-call cap of the agent-loop namespace |
| `@tomato/client-ui-settings-general` | no | Settings ownerless-copy and product onboarding plugin: the General section, shell trigger/header chrome content, settings dictionaries, and the versioned welcome notice |
| `@tomato/client-ui-settings-models` | yes | Models settings and shared product-onboarding dialogs over existing settings and credential joins |
| `@tomato/client-ui-settings-plugin-inventory` | no | Read-only Cordis Loader inventory tab in Web Plugins settings |
| `@tomato/client-ui-settings-plugins` | no | Built-in plugins settings section for the tomato web client: the Settings navigation entry and the tab chrome feature-owned tabs register into |
| `@tomato/client-ui-settings-session-log` | no | General settings control for Session-log upload with DeepSeek API requests |
| `@tomato/client-ui-settings-shell` | no | Settings page of the shell executor on the tomato web client's Plugins page: the command timeout and the per-stream output cap of the shell namespace |
| `@tomato/client-ui-settings-subagent` | no | Settings page of Subagent delegation on the tomato web client's Plugins page: recursion depth, parallel capacity, and the models agents may choose for subagents |
| `@tomato/client-ui-settings-web-search` | no | Settings page of the DeepSeek web-search provider on the tomato web client's Plugins page: its API key, endpoint, and per-request search budget |
| `@tomato/client-ui-shortcuts` | no | Keyboard shortcut reference, recording, and local preference editing |
| `@tomato/client-ui-sidebar` | no | Sidebar plugin: session multi-level tree, search, grouping, state dots |
| `@tomato/client-ui-sidebar-browser` | no | Sandboxed Web browser tabs for the right Sidebar |
| `@tomato/client-ui-sidebar-documentpreview` | yes | Extensible Sidebar previews for Office documents, spreadsheets, Markdown, code, images, PDF, HTML, and plain text |
| `@tomato/client-ui-sidebar-files` | no | Workspace file tree tab type for the right Sidebar: lazy directory listing over the workspaceFiles Remote namespace, opening files into the Sidebar |
| `@tomato/client-ui-sidebar-right` | no | Right Sidebar: the docking surface's session-bound state, its panel and header expand control, and the navigation service over it |
| `@tomato/client-ui-sidebar-terminal` | no | Interactive shell tabs for the right Sidebar |
| `@tomato/client-ui-skill` | no | Web skill references and the dedicated skill tool row |
| `@tomato/client-ui-skill-browser` | no | Skills tab type for the right Sidebar: browse every installed skill, open its details, and edit personal skill files |
| `@tomato/client-ui-subagent` | no | Subagent conversation catalog, continuation routing UI, and '@' reference source |
| `@tomato/client-ui-theme` | yes | Theme plugin: Host bootstrap for the pre-plugin palette; ThemeRuntime for light/dark/system state and icon replacements; --dsw-* token styles and Appearance settings row |
| `@tomato/client-ui-tool` | no | Client Tool call-tree renderer and keyed per-tool presentation slot |
| `@tomato/client-ui-trajectory` | no | Trajectory event ledger with an interactive timing overview: pure-consumer plugin registering into the conversation ViewMap (no service) |
| `@tomato/client-ui-user-questions` | no | Web ask_user_question composer takeover and plan-review presentation UI |
| `@tomato/client-ui-workflow-run` | no | Durable workflow-run Conversation Node and nested member disclosure for tomato web |
| `@tomato/client-ui-workspace` | no | Workspace picker plugin: one WorkspacePicker registered into the sidebar and empty-state workspace slots |

## compaction

| Package | Config | Description |
|---|---|---|
| `@tomato/command-compact` | no | Human-facing slash command for explicit session compaction |
| `@tomato/compaction-basic` | yes | Token-meter-driven compaction policy and LLM summarization backend for the Tomato Harness |
| `@tomato/compaction-image-offload` | no | Durable image offload for image-capable routes: replace over-budget request images with placeholders and retry |
| `@tomato/compaction-tool-result-pruner` | yes | Replay-safe model-free head/middle/tail pruning for tool-result surface nodes |

## computer-use

| Package | Config | Description |
|---|---|---|
| `@tomato/computer-use` | no | Exclusive named computer-use provider registration |

## context

| Package | Config | Description |
|---|---|---|
| `@tomato/agent-instructions` | yes | Workspace context loader for AGENTS.md/CLAUDE.md instruction files |
| `@tomato/file-reference-local` | yes | Local-filesystem ctx.fileReferences provider with bounded fuzzy indexes |
| `@tomato/harness-dev-context` | no | Model context naming the Tomato Harness checkout and Web GUI URL without letting either change the system prompt |
| `@tomato/session-reference` | yes | Cross-session snapshot references and durable untrusted model context (ctx.sessionReferenceResolver) |
| `@tomato/time-context` | yes | Durable per-step context with the current time and elapsed time |
| `@tomato/tmux-context` | yes | Opt-in durable per-step context with this agent's tmux pane and window location |

## core

| Package | Config | Description |
|---|---|---|
| `@tomato/agent` | no | Agent interface, registry, initiator scope, and event vocabulary for the Tomato Harness |
| `@tomato/agent-default-model` | yes | Default model selection shared by Agent entry points |
| `@tomato/agent-loop` | yes | The concrete agent loop plugin for the Tomato Harness |
| `@tomato/agent-tool-presentation` | yes | Deprecated tool presentation selector; use @tomato/tool-executor-native or @tomato/tool-executor-ptc directly |
| `@tomato/session` | no | Event-sourced session store for the Tomato Harness |
| `@tomato/system-prompt` | yes | System prompt assembly registry for the Tomato Harness |
| `@tomato/tool-executor-native` | no | Native tool execution plugin |
| `@tomato/tool-executor-ptc` | yes | PTC program execution, tool bindings, and generated SDK prompts |
| `@tomato/tools` | no | Tool registry and execution pipeline for the Tomato Harness |

## credentials

| Package | Config | Description |
|---|---|---|
| `@tomato/authorization` | no | Authorization seam (ctx.authorization): plugin-owned flows that obtain a credential through a conversation with the human |
| `@tomato/credentials-local` | yes | File-backed credentials provider ($TOMATO_HOME/.env under the live process environment) for the Tomato Harness |
| `@tomato/deepseek-account-platform` | yes | Authorize DeepSeek accounts through browser PKCE |

## deliverables

| Package | Config | Description |
|---|---|---|
| `@tomato/deliverable-file-references` | no | Shared model guidance for file links and deliverables across Tomato Harness hosts |
| `@tomato/tool-present` | yes | Explicit workspace file delivery declarations for the Tomato Harness |
| `@tomato/workspace-changes` | yes | Per-turn workspace file changes recorded from git working-tree snapshots and whole-file captures, with per-file comparisons, for the Tomato Harness |

## document

| Package | Config | Description |
|---|---|---|
| `@tomato/office-to-pdf` | yes | Shared Office-to-PDF conversion with bounded queues and caching |

## experimental

| Package | Config | Description |
|---|---|---|
| `@tomato/action-cards` | yes | Optional action cards below answers: one shared proposal tool, card state, user actions and status notices |
| `@tomato/client-ui-action-cards` | no | Action cards below completed answers: the shared card frame, kind bodies and the compact tool row |
| `@tomato/client-ui-creation-recommendations` | no | Body of the personalized page card: location choice, creation progress, Keep, Undo and Restore |
| `@tomato/client-ui-plugin-recommendations` | no | Official plugin card body with catalog text and enabling |
| `@tomato/creation-recommendations` | no | Create persistent removable interface plugins from explicit conversation needs |
| `@tomato/cua` | no | Shared Computer Use application objects, authorization, and logged tool execution |
| `@tomato/experimental-agent-team` | yes | Implicit-root Agent Teams roster, direct peer messaging, and shared task DAG |
| `@tomato/experimental-api-speech-to-text` | yes | Authenticated experimental speech transcription for browser clients |
| `@tomato/experimental-auto-review` | no | Per-tool LLM authorization review for the Tomato Harness Auto permission preset |
| `@tomato/experimental-browser-use-chrome-devtools-mcp` | yes | Experimental per-Session Chromium browser tools through chrome-devtools-mcp |
| `@tomato/experimental-browser-use-playwright-mcp` | yes | Experimental per-Session Chromium browser tools through @playwright/mcp |
| `@tomato/experimental-browser-use-stagehand-native` | yes | Experimental Stagehand browser tools with separately configured native models |
| `@tomato/experimental-claude-code-mods` | yes | Experimental bridge: load Claude Code mods (hooks modules) and run their hook chains on Tomato Harness extension points |
| `@tomato/experimental-client-ui-agent-team` | no | Web Agent Teams roster, task board, and teammate navigation |
| `@tomato/experimental-client-ui-claude-code-mods` | no | Web band above the prompt for Claude Code mods: draws each session's mod tree and sends button presses back to the bridge |
| `@tomato/experimental-client-ui-cot-translation` | yes | Optional machine translation of expanded reasoning, preserving original Session text |
| `@tomato/experimental-client-ui-voice-input` | no | Record speech and insert editable text into the conversation draft |
| `@tomato/experimental-computer-use-cua-driver-mcp` | yes | Experimental computer use through an installed Cua Driver MCP executable |
| `@tomato/experimental-computer-use-cua-driver-native` | no | Experimental computer-use provider embedding the Cua Driver native npm SDK |
| `@tomato/experimental-cua-macos` | yes | macOS native provider for shared Computer Use application and window objects |
| `@tomato/experimental-inspector` | yes | Experimental cross-realm CDP hub for Host debugging and Client Runtime inspection |
| `@tomato/experimental-ptc-runtime-python` | yes | CPython subprocess implementation of the Tomato Harness PTC execution seam |
| `@tomato/experimental-session-inspector` | no | Experimental virtualized Session log and live Chat group/node inspectors |
| `@tomato/experimental-speech-to-text` | yes | Experimental speech recognition with independently selectable providers |
| `@tomato/experimental-speech-to-text-sensevoice` | yes | Local SenseVoice ONNX transcription with a managed sherpa-onnx process |
| `@tomato/experimental-subagent-oar` | yes | Experimental one-shot subagents through OAR runtimes |
| `@tomato/experimental-tool-agent-team` | yes | Scoped model-facing Agent Teams tools over ctx.agentTeams |
| `@tomato/experimental-tool-subagent-oar` | yes | Delegate standalone tasks to configured external subagent providers |
| `@tomato/experimental-tool-worktree` | no | Model tool that creates and enters a new Git worktree |
| `@tomato/experimental-translator` | yes | Machine translation with reusable Session results |
| `@tomato/experimental-worktree` | yes | Creates a named Git worktree and changes the calling Session working directory |
| `@tomato/hooks-claude-code` | yes | Bridge plugin: run a Claude Code hooks.json / settings hook config on the Tomato Harness interception seams |
| `@tomato/hooks-codex` | yes | Bridge plugin: run a Codex hooks.json hook config on the Tomato Harness interception seams |
| `@tomato/plugin-recommendations` | no | Official plugin suggestions with explicit user activation and persistent conversation decisions |
| `@tomato/session-title-all-prompts-llm` | yes | All-user-messages LLM provider plugin for Tomato Harness session titles |
| `@tomato/skill-badge` | no | Bundled tomato badge skill provider for Tomato Harness |
| `@tomato/tool-ralph` | yes | Model-facing fresh-agent Ralph loop over the workflow and subagent seams |
| `@tomato/tool-session-query` | yes | Workspace-authorized model-facing session history search, trace, and event read tools |
| `@tomato/tool-terminal` | yes | Six model-facing persistent PTY tools with owner isolation and generic background-job integration |
| `@tomato/webhook` | no | Fire-and-forget webhook rule runtime that creates Workspace-backed Tomato Harness Sessions |
| `@tomato/webhook-github` | yes | Signed GitHub HTTP webhook adapter for the Tomato Harness webhook runtime |

## extensions

| Package | Config | Description |
|---|---|---|
| `@tomato/client-ui-cordis` | no | Cordis dynamic-plugin definition card: the keyed cordis_define tool row with its run/stop switch |
| `@tomato/cordis-client-runner` | no | Browser half of dynamic dual-half plugin packages: event subscription, closure evaluation, guard facade, and loader entries |
| `@tomato/cordis-host-runner` | yes | Dynamic package definition registry, host-half sandbox lifecycle, and invoke handler table for model-mounted dual-half packages |
| `@tomato/tool-cordis` | no | Read-only runtime API inspection for Harness plugin development |

## feedback

| Package | Config | Description |
|---|---|---|
| `@tomato/command-feedback` | no | Log-only session feedback: the record event, the sessionFeedback Host Remote, and the human-facing slash command |
| `@tomato/message-feedback` | yes | Canonical Session-log ratings and notes for finalized assistant messages |

## fs

| Package | Config | Description |
|---|---|---|
| `@tomato/fs-local` | yes | Local-filesystem implementation of the Tomato Harness filesystem seam (ctx.fs) |
| `@tomato/fs-observation-policy` | no | File-context policy plugin for the Tomato Harness — observed-state, read-before-edit, and version-guarded write/edit added over the ctx.fs provider seam through the fs/* event gate (no service API) |
| `@tomato/fs-sandbox` | yes | Sandbox-enforcing implementation of the Tomato Harness filesystem seam: fences write/edit by the per-call sandbox mode (read-only denies mutation, workspace-write contains it to the workspace + temp roots) while reads pass through |
| `@tomato/tool-fs` | yes | Model-facing filesystem tools (read, write, edit) over the Tomato Harness filesystem seam (ctx.fs) |
| `@tomato/tool-fs-search` | yes | Model-facing filesystem discovery tools (glob, grep) backed by the packaged ripgrep binary (@vscode/ripgrep) |
| `@tomato/tool-str-replace-editor` | yes | Model-facing view, create, literal replace, and line insert tool over the Harness filesystem service |

## goal

| Package | Config | Description |
|---|---|---|
| `@tomato/command-goal` | no | Human-facing slash command for persisted same-session goals |
| `@tomato/goal` | yes | Event-sourced same-session goal state and lifecycle service for the Tomato Harness |
| `@tomato/goal-round-driver` | no | Race-fenced same-session goal-round driver |
| `@tomato/tool-goal` | yes | Model-facing same-session goal tools with execution-time authority checks |

## guard

| Package | Config | Description |
|---|---|---|
| `@tomato/repeat-tool-reminder` | yes | Repeat-tool-call guard plugin: advisory reminders when an agent loops on identical tool calls |
| `@tomato/tool-call-timeout-policy` | no | Tool-call timeout policy: a tools/execute wrapper that arms a per-tool deadline on exec.signal and returns TOOL_TIMEOUT when it wins |

## host

| Package | Config | Description |
|---|---|---|
| `@tomato/host-directory-picker-auto` | no | Adaptive chooser of the directory-picker seam: resolves the host situation at boot and mounts the native or browse backend for the Tomato Harness web GUI host |
| `@tomato/host-directory-picker-browse` | yes | In-app browsing backend of the directory-picker seam (listing/creation primitives over the host filesystem) |
| `@tomato/host-directory-picker-native` | no | Native-OS-chooser backend of the directory-picker seam for the Tomato Harness web GUI host |
| `@tomato/host-frontend-static` | yes | SPA dist server for the Web shell: owns the webserver fallback seat, serving explicit index entries and static assets with traversal rejection and 404 misses |
| `@tomato/host-open-in-app` | yes | Host half of open-in-app: resolved application catalog, icons, and the launch endpoint as three webServer routes |
| `@tomato/host-plugin-inventory` | no | Read-only Remote projection of current Cordis Loader plugin state |
| `@tomato/host-product-telemetry-otel` | yes | Explicit product usage events exported through OpenTelemetry HTTP logs |
| `@tomato/host-webserver` | yes | Web route-registration plugin: HTTP and upgrade routes, per-Peer index transform taps, and static dist fallback |

## interaction

| Package | Config | Description |
|---|---|---|
| `@tomato/commands` | no | Plugin-owned human command registry for Tomato Harness UIs |
| `@tomato/permission-presets` | yes | User-facing permission presets (ctx.permissionPresets) for the Tomato Harness: one product-level Permissions select bundling the sandbox-mode and approval-policy knobs, written through to their own session events |
| `@tomato/tool-ask-user` | yes | Model-facing ask_user_question tool over the ctx.userQuestions seam |
| `@tomato/user-approval` | yes | User-approval seam (ctx.approval) for the Tomato Harness: one-shot permission decisions dispatched to composed answerers over the approval/request waterfall, fail-closed by default |
| `@tomato/user-questions` | no | Abstract user-questions seam (ctx.userQuestions) for asking the human during agent runs |

## jobs

| Package | Config | Description |
|---|---|---|
| `@tomato/jobs-local` | yes | Process-local implementation of the Tomato Harness background job registry seam |
| `@tomato/tool-jobs` | yes | Model-facing background job control tools (job_output, job_list, job_kill) over the ctx.jobs registry |

## llm

| Package | Config | Description |
|---|---|---|
| `@tomato/deepseek-llm-api-extensions` | no | Additive request-field registry for the official DeepSeek LLM API adapter |
| `@tomato/llm` | no | Provider-neutral LLM service interface for the Tomato Harness |
| `@tomato/llm-deepseek-account` | yes | DeepSeek account provider authentication and discovery |
| `@tomato/llm-deepseek-api-key` | yes | DeepSeek api-key provider authentication and discovery |
| `@tomato/llm-pi-ai` | yes | pi-ai-backed DeepSeek adapter for the Tomato Harness LLM seam (design-verification twin of @tomato/llm-deepseek) |
| `@tomato/llm-retry` | yes | Provider-routed LLM request retry policy for the Tomato Harness |
| `@tomato/plugin-package-inventory-deepseek` | yes | Active Loader-backed plugin package inventory for official DeepSeek LLM API requests |
| `@tomato/token-meter` | yes | Replay-aware token measurement service (ctx.tokenMeter) for the Tomato Harness |

## lsp

| Package | Config | Description |
|---|---|---|
| `@tomato/lsp` | no | Abstract LSP capability seam (ctx.lsp) for the Tomato Harness — language-server provider registry keyed by branded id and extension mapping, order-independent per-query selection, normalized definition/references/implementation/hover requests and results, and the LspError taxonomy |
| `@tomato/lsp-stdio` | yes | Generic stdio language-server provider for the Tomato Harness LSP capability seam (ctx.lsp) — spawns configured servers, translates JSON-RPC, and serves transient-open goToDefinition/findReferences/goToImplementation/hover queries in the host filesystem namespace |
| `@tomato/tool-lsp` | yes | Model-facing lsp tool over the Tomato Harness LSP capability seam (ctx.lsp) — one read-only tool with goToDefinition/findReferences/goToImplementation/hover operations, one-based UTF-16 cursor coordinates, bounded location rendering, and hover normalization |

## mcp

| Package | Config | Description |
|---|---|---|
| `@tomato/mcp-client` | yes | MCP client bridge: connects to MCP servers and registers their tools on ctx.tools |
| `@tomato/mcp-resources` | no | Scoped MCP resource discovery and reading through shared model tools |

## plan

| Package | Config | Description |
|---|---|---|
| `@tomato/plan-mode` | yes | Logged per-agent plan mode with deployment guidance, a direct slash command, and a user-reviewed exit |

## preset

| Package | Config | Description |
|---|---|---|
| `@tomato/agent-preset` | yes | Declare an Agent capability composition in Cordis YAML |
| `@tomato/agent-preset-registry` | yes | Declarative Agent preset registry and profile-backed editing |
| `@tomato/persona` | yes | Composition-authored deployment persona section for the Tomato Harness |

## ptc-runtime

| Package | Config | Description |
|---|---|---|
| `@tomato/ptc-runtime-node` | yes | Node PTC execution with per-call sandboxed processes or in-memory REPL state |

## sandbox

| Package | Config | Description |
|---|---|---|
| `@tomato/sandbox-local` | yes | Local process-sandbox backends for the Tomato Harness sandbox seam: bwrap, the npm-distributed landlock-run launcher, macOS Seatbelt, or the Windows ACL restricted-token runner — functionally probed, fail-closed |
| `@tomato/sandbox-policy` | yes | Per-call sandbox policy resolver and current model context: deployment fallbacks plus each session's mode and workspace root, shared by every enforcing capability family |

## schedule

| Package | Config | Description |
|---|---|---|
| `@tomato/schedule` | yes | Host-wide durable reminders with shared management and original-Session delivery |
| `@tomato/tool-schedule` | no | Model-facing reminder management tools (schedule_create, schedule_list, schedule_update, schedule_delete) over the Host ctx.schedule service |

## sdk

| Package | Config | Description |
|---|---|---|
| `@tomato/sdk-jsonrpc-server` | yes | Stdio JSON-RPC server plugin for out-of-process Tomato Harness SDK clients |

## session

| Package | Config | Description |
|---|---|---|
| `@tomato/message-quotes` | no | Selected-text quotation and Markdown blockquote presentation |
| `@tomato/session-checkpoint-policy` | no | Semantic session durability checkpoints before model requests and tool side effects |
| `@tomato/session-log-deepseek` | yes | Incremental lossless session-log request extension for the official DeepSeek LLM API |
| `@tomato/session-persistence-jsonl` | yes | JSONL durable session persistence backend for the Tomato Harness |
| `@tomato/session-projection` | no | Session-projection seam: the merge-extensible projection type table, the provider contract, and the ctx.sessionProjections registry serving whole current values of log-derived per-session state |
| `@tomato/session-projection-cache` | yes | Persisted projection cache (ctx.sessionProjectionCache): durable per-session checkpoint records on the session_projcache storage domain (per-record layout), throttled write-behind, and the cached listing read |
| `@tomato/session-stats` | no | Whole-log conversation counts and wall times projection (sessionStats) for the Tomato Harness |
| `@tomato/session-telemetry-otel` | yes | Feedback-authorized Session logs over byte-bounded OpenTelemetry HTTP requests |
| `@tomato/session-title` | yes | Log-backed session title service and provider registry for the Tomato Harness |
| `@tomato/session-title-first-prompt-llm` | yes | First-message LLM provider plugin for Tomato Harness session titles |
| `@tomato/session-turn-outline` | no | Whole-log turn outline projection (turnOutline) for the Tomato Harness |
| `@tomato/tool-working-directory` | no | Read and change the active Session working directory |
| `@tomato/working-directory` | yes | Session working directories with durable changes and model context |

## session-query

| Package | Config | Description |
|---|---|---|
| `@tomato/session-log-export` | yes | Web Session-log ZIP export and Session Markdown copy |
| `@tomato/session-query-sqlite` | yes | Concrete ctx.sessionQuery backend with SQLite FTS5 search |

## settings

| Package | Config | Description |
|---|---|---|
| `@tomato/settings` | no | Abstract user-settings seam (ctx.settings) for the Tomato Harness |

## shell

| Package | Config | Description |
|---|---|---|
| `@tomato/bash-local` | yes | Local-subprocess implementation of the Tomato Harness bash executor seam |
| `@tomato/bash-sandbox` | yes | Sandbox-consuming implementation of the Tomato Harness bash executor seam (confines every command via ctx.sandbox, reports denial/enforcement result facts) |
| `@tomato/pwsh-local` | yes | Local PowerShell implementation of the Tomato Harness bash executor seam |
| `@tomato/pwsh-sandbox` | yes | Sandbox-consuming implementation of the Tomato Harness PowerShell executor seam (confines every command via ctx.sandbox, reports denial/enforcement result facts) |
| `@tomato/shell-env` | yes | Tool-independent managed TOMATO_* shell environment registry |
| `@tomato/tool-bash` | yes | Model-facing bash tool with optional generic background-job and sandbox-escalation support |
| `@tomato/tool-bash-persistent` | yes | Model-facing owner-scoped persistent Bash tool backed by the Harness PTY service |
| `@tomato/tool-pwsh` | yes | Model-facing pwsh tool over the bash executor seam |
| `@tomato/tool-pwsh-persistent` | yes | Model-facing owner-scoped persistent PowerShell tool backed by the Harness PTY service |

## skill

| Package | Config | Description |
|---|---|---|
| `@tomato/skill` | yes | Agent skill provider registry for the Tomato Harness |
| `@tomato/skill-filesystem` | yes | Local filesystem skill provider for the Tomato Harness |
| `@tomato/skill-office` | yes | Bundled Word, PowerPoint, and Excel workflows and LibreOffice Kit operations |
| `@tomato/tool-skill` | yes | Model-facing skill loading tool for the Tomato Harness |
| `@tomato/tool-workspace-dependencies` | yes | The load_workspace_dependencies tool: absolute paths into a bundled Python, Node.js, and pnpm payload |

## spill

| Package | Config | Description |
|---|---|---|
| `@tomato/spill-local` | yes | Local-filesystem implementation of the Tomato Harness spill storage seam (private session-scoped files) |
| `@tomato/spill-policy` | yes | Token-budgeted tool-result retention with recoverable text and image paths |

## ssh

| Package | Config | Description |
|---|---|---|
| `@tomato/fs-ssh` | no | Filesystem provider over the shared POSIX SSH helper |
| `@tomato/sandbox-ssh` | no | Remote POSIX sandbox argv provider over the shared SSH helper |
| `@tomato/ssh` | yes | Shared OpenSSH connection and versioned POSIX remote helper |
| `@tomato/subprocess-ssh` | no | Subprocess and terminal provider over the shared POSIX SSH helper |

## storage

| Package | Config | Description |
|---|---|---|
| `@tomato/storage` | no | Storage hub (ctx.storage): named backend registry plus mounted data-form facilities for the Tomato Harness |
| `@tomato/storage-domain` | yes | Domain data form (ctx.storage.domain): schema-validated, event-emitting KV domains over storage backends for the Tomato Harness |
| `@tomato/storage-json` | yes | JSON file KV storage backend for the Tomato Harness storage hub |
| `@tomato/storage-sqlite` | yes | SQLite storage backend (kv facet) for the Tomato Harness storage hub |

## subagent

| Package | Config | Description |
|---|---|---|
| `@tomato/subagent` | yes | Abstract subagent seam (ctx.subagents): named-provider registry for delegating to child agents |
| `@tomato/subagent-acp` | yes | Out-of-process ACP subagent backend: drives a child agent in a spawned subprocess over the Agent Client Protocol |
| `@tomato/subagent-claude-code` | yes | One-shot Claude Code subagent provider over the official Agent SDK |
| `@tomato/subagent-codex` | yes | One-shot Codex subagent provider over the official app-server protocol |
| `@tomato/subagent-sdk` | yes | Out-of-process SDK subagent backend: drives a child Tomato Harness runtime subprocess over stdio JSON-RPC through the TypeScript SDK client |
| `@tomato/subagent-fork-in-process` | yes | In-process fork subagent backend: runs a child agent seeded with a prefix of the parent's log |
| `@tomato/subagent-spawn-in-process` | yes | In-process spawn subagent backend: runs a fresh child agent on ctx.agents |
| `@tomato/tool-subagent` | yes | Model-facing subagent delegation tool over the ctx.subagents seam |
| `@tomato/tool-subagent-control` | no | Shared messaging, interruption, and child discovery tools for subagents |

## subprocess

| Package | Config | Description |
|---|---|---|
| `@tomato/subprocess-local` | no | Local-subprocess implementation of the Tomato Harness subprocess seam |

## telemetry

| Package | Config | Description |
|---|---|---|
| `@tomato/otel` | no | Cordis service for independent ordinary-event and byte-bounded Session-log OTLP channels |

## terminal

| Package | Config | Description |
|---|---|---|
| `@tomato/terminal` | no | Persistent PTY session seam for the Tomato Harness — owner-scoped ids, backend registry, interactive sends, reads, signals, and awaited cleanup |
| `@tomato/terminal-bash` | yes | Persistent shell PTY backend over the Tomato Harness subprocess terminal primitive |

## test-support

| Package | Config | Description |
|---|---|---|
| `@tomato/llm-replay` | yes | Replay LLM plugin: short-circuits llm/stream with model chunks reconstructed from a recorded session JSONL (keyless snapshot tests) |

## todo

| Package | Config | Description |
|---|---|---|
| `@tomato/tool-todo` | yes | Model-facing todo_write tool over the Tomato Harness event-sourced session log |

## tomato

| Package | Config | Description |
|---|---|---|
| `@tomato/account` | no | Tomato account surface: sidebar launcher and settings page over the local gateway's auth_service session |
| `@tomato/brand` | no | Tomato brand occupants for the sidebar and conversation-hero slots |
| `@tomato/gateway` | yes | Tomato local gateway: same-origin auth routes and a fixed-table HTTP forwarder for company services |
| `@tomato/telemetry` | yes | Session-event traces for Tomato AI, delivered as OTLP/HTTP JSON to the internal relay |

## typert

| Package | Config | Description |
|---|---|---|
| `@tomato/typert-loader` | yes | Loader integration for generated Typert package contributions |

## web

| Package | Config | Description |
|---|---|---|
| `@tomato/tool-web` | yes | Model-facing web tools (web_search, web_fetch) over the Tomato Harness web capability seam (ctx.web) |
| `@tomato/web` | yes | Abstract web access capability seam (ctx.web) for the Tomato Harness — search/fetch provider registry, registration-order-independent selection, request/result vocabulary, and the WebError taxonomy |
| `@tomato/web-deepseek-api` | yes | DeepSeek Search and Fetch API providers for the Tomato Harness web capability seam (ctx.web) |
| `@tomato/web-fetch-http` | yes | Anonymous HTTP(S) fetch provider for the Tomato Harness web capability seam (ctx.web) |
| `@tomato/web-search-deepseek` | yes | DeepSeek-backed search provider (native web_search via the Anthropic-compatible API) for the Tomato Harness web capability seam (ctx.web) |
| `@tomato/web-search-exa` | yes | Exa-backed search provider for the Tomato Harness web capability seam (ctx.web) |
| `@tomato/web-search-perplexity` | yes | Perplexity-backed search provider for the Tomato Harness web capability seam (ctx.web) |

## workflow

| Package | Config | Description |
|---|---|---|
| `@tomato/tool-workflow` | yes | Model-facing workflow tool: run a JavaScript orchestration script over ctx.workflowEngine |
| `@tomato/workflow-ptc` | yes | Workflow orchestration in the shared sandboxed Node PTC runtime |

## workspace

| Package | Config | Description |
|---|---|---|
| `@tomato/workspace` | no | Workspace entity registry (ctx.workspaceRegistry): durable workspace records with validated session attachment over the domain data form for the Tomato Harness |
