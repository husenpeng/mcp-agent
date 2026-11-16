# Robot platform

English | [中文](robot.zh.md)

The [`@tomato/experimental-robot`](../../packages/experimental/robot/README.md) service definition owns the durable vocabulary for versioned robots: specifications, robot instances, runs, and agent-to-agent contract fields. It registers `ctx.robots`; execution, persistence, and transport belong to an installed provider. The [Agent Note](../../.agents/notes/proposed/architecture/2026-10-29-robot-platform-product-architecture.md) owns the product architecture and delivery decisions.

## Specifications and revisions

`RobotSpec` carries five blocks: position and authority, goal and execution, capability and limits, input and output, and memory and A2A. Publication validates the specification and returns one `RobotSpecRevision`. Revisions are append-only, and a published revision is immutable. Instantiation binds a `Robot` to one exact `RobotSpecRef`, so a later revision does not move an existing robot.

## Creating robots

The [robot page](../../packages/client/ui-robot/README.md) offers a guided three-step creation flow and conversation creation over the same four basic fields: name, description, task goal, and success criteria. The flow asks what the robot does on every run, then its name and description, then optional success criteria, and ends in a preview that names its Workspace directory; it requires a real name and mission, checks name uniqueness before saving, and publishes the specification and instantiates the revision in place. It never publishes the placeholder name or mission from [`emptyRobotSpec()`](../../packages/experimental/robot/src/spec.ts). Every advanced block — a manual trigger, plan strategy, workspace sandbox and permission preset, a 100k-token/600s/100-tool-call budget, no network, no memory, and no A2A intents — starts from that shared default and becomes editable in the specification editor after creation. The model field stores `goal.model`: its choices are the providers and models the deployment currently routes (`session/modelCatalog`), including third-party API providers configured in Settings, and an empty choice keeps the deployment default model. Skill, plugin, tool, MCP-server, and Workspace-root fields are pickers over the deployment's live values (`robot.capabilities`); free entry stays for a value no local source publishes, and a source that is absent leaves the picker's empty hint and that input. Plugin options are the module names of plugins the inventory reports enabled and active. Skills, plugins, MCP servers, and Workspace roots open a modal rather than a menu: skill rows show the source folder, plugin rows name active deployment plugins, MCP rows name the servers the deployment configured, and Workspace roots add an in-app folder browser over the directory-picker seam (the Host's own chooser when the deployment serves the native capability).

Conversation creation opens a new Session in the current Workspace with a short request in the user's voice. The bundled `robot-creation` skill interviews one question at a time, follows the bundled `grilling` method for that interview, writes the one-line description itself, shows the four-field draft, waits for confirmation, and calls `robot_create`, provided by [`@tomato/experimental-tool-robot`](../../packages/experimental/tool-robot/README.md). When the user names skills, plugins, or MCP servers, the skill passes them to the tool; a later change to those lists calls `robot_update` on the same package, which republishes the latest revision and rebinds the robot. When the deployment mounts `ask_user_question`, each question renders as a form card; without it the skill asks in plain text. The tool publishes the specification and instantiates the revision in one call, rejects a blank or placeholder name or mission, and records the created robot as presentation metadata so the transcript row offers **Open robot**. It refuses unless the calling agent is a live top-level agent with a human message in its open turn. A profile that does not select `@tomato/experimental-robot-app` has neither the tool nor the skill.

## Templates

A `RobotTemplate` is a hireable starting point: a stable `RobotTemplateId`, a category, copy per locale (`RobotTemplateText`: category label, name, description, mission, success criteria, acceptance), and every non-localized specification block. Template packages register templates with `ctx.robotTemplates`, provided by the separate `@tomato/experimental-robot/templates` row. A hire calls `templateSpec()` to build a specification from the template and the page locale, publishes it as a new specification, and instantiates it, so the hired robot is an ordinary user-owned robot: editing it publishes revisions of that specification, and template changes never reach it. [`@tomato/experimental-robot-templates-marketing`](../../packages/experimental/robot-templates-marketing/README.md) contributes the creator-marketing templates. [`@tomato/experimental-robot-templates-knowledge-work`](../../packages/experimental/robot-templates-knowledge-work/README.md) adapts Anthropic's knowledge-work plugins into sixteen role templates and their bundled skills.

## Installing and removing robots

A specification declares the dependencies a run must resolve in `capability.skills`, `capability.plugins`, (by the module name the deployment loads), and `capability.mcpServers`. Installing checks each declared dependency against the live deployment — the skill catalog for the robot's working directory, the plugin inventory's enabled and active entries, the configured MCP servers, and the permission catalog — and records `installation` on the robot only when every one is available. A failure lists each missing dependency as `skill`, `plugin`, `mcpServer`, or `permissionPreset`; this is how the page reports a plugin the deployment has not installed, because installation verifies and never installs a package. Rebinding to another revision clears the installation, so a run is never covered by a verification the user did not perform.

The robot page blocks a new manual run until a specification that declares any of those three lists is installed for its bound revision. Runs started through `ctx.robots.start` by triggers or other Host code keep their own acceptance rules; the runtime still resolves every declared dependency when the run begins and fails it loudly when one is gone.

Deleting a robot removes the instance only: published revisions and recorded runs stay readable, and a robot that still owns a non-terminal run refuses removal until that run settles.

## Robot and run lifecycle

`RobotState` covers `provisioning`, `idle`, `running`, `paused`, `failed`, and `stopped`. `RunState` covers `queued`, `leased`, `running`, `waiting`, `finalizing`, `succeeded`, `failed`, `cancelled`, and `timed_out`; `isTerminalRunState` reports the four settled states. A run is accepted only from `idle`, and cancellation is cooperative, so a run that already settled keeps its state.

A run spans turns while it stays non-terminal. The executor reports progress through `advance` — `running` while it drives work, `waiting` while it holds a paused run's Agent for a human correction, and `finalizing` while it settles; a terminal run keeps its state. The Remote controller owns `interrupt`, which records `waiting` before aborting the active turn while keeping the inbox, and `correct`, which delivers a message into the run's own live Agent — the next turn while waiting, steering while running — and records `running` again. A run without a live Agent refuses both instead of resuming a detached Session.

## Authority and agent-to-agent fields

`PositionSpec` declares the owner, the `reportsTo` authority, callers, callees, the escalation order, and visibility. `A2aSpec` declares accepted intents plus each peer's budget and approval requirement. The service decides admission; a transport provider carries the envelope between robots.

## Provider responsibilities

The definition adds no prompt, tool, storage, or transport. A provider implements every operation, owns validation diagnostics and persistence, and binds each run to a specification revision. The storage-backed [local provider](../../packages/experimental/robot-local/README.md) implements publication, instantiation, and run acceptance without execution, the [runtime](../../packages/experimental/robot-runtime/README.md) drives queued runs through one Agent per run and verifies a selected model route before it creates the Agent, and the [trigger package](../../packages/experimental/robot-triggers/README.md) starts runs for cron schedules and robot event topics; the package READMEs record the remaining trigger, budget, memory, and A2A gaps.

<!-- BEGIN GENERATED cordis-surface (gen-cordis-catalog.ts) — do not edit between markers -->

<a id="cordis-surface"></a>

## Cordis API

Generated from source by `scripts/gen-cordis-catalog.ts` (verified fresh by `pnpm run verify-cordis-catalog` in doc-sync; regenerate with `pnpm run gen-cordis-catalog`) — the language sides differ only in locale-specific paired document paths. Signature blocks use a `ts cordis-catalog` fence and keep the original source JSDoc; dispatch modes are defined in the [primer](../cordis-primer.md#dispatch-modes), and the framework-inherited `ctx` API lives in [cordis-api/inherited.md](../cordis-api/inherited.md).

<a id="ctxcrewcontroller--crewcontroller"></a>

### `ctx.crewController` — `CrewController`

Host service backing the generated `ctx.remote.crew` namespace.

```ts cordis-catalog
/**
 * List the latest published revision of every crew.
 * @returns latest revisions in publication order.
 */
@Remote('specs') specs(): Promise<readonly CrewSpecRevision[]>

/**
 * Read one published revision.
 * @param request - exact revision.
 * @returns the revision.
 * @throws RemoteError `crew/not-found` when the revision was never published.
 */
@Remote('revision') async revision(request: CrewRevisionRequest): Promise<CrewSpecRevision>

/**
 * Validate and publish one specification revision.
 * @param request - complete specification and the revision it supersedes.
 * @returns the immutable published revision.
 * @throws RemoteError `crew/spec-invalid` with every field issue, or
 *   `crew/conflict` when the publication conflicts with existing records.
 */
@Remote('publish') async publish(request: CrewPublishRequest): Promise<CrewSpecRevision>

/**
 * Accept one run for a published crew revision.
 * @param request - revision and goal message.
 * @returns the accepted run.
 * @throws RemoteError `crew/not-found` for an unknown revision, or
 *   `crew/conflict` when the run cannot be accepted.
 */
@Remote('start') async start(request: CrewStartRequest): Promise<CrewRun>

/**
 * Cancel a run cooperatively.
 * @param request - run to cancel.
 * @returns nothing after the cancellation is recorded.
 * @throws RemoteError `crew/not-found` for an unknown run.
 */
@Remote('cancel') async cancel(request: CrewCancelRequest): Promise<void>

/**
 * List runs.
 * @param request - optional crew specification filter.
 * @returns runs in acceptance order.
 */
@Remote('runs') runs(request: CrewRunsRequest): Promise<readonly CrewRun[]>

/**
 * Read one run's complete flow ledger.
 * @param request - run whose ledger to read.
 * @returns entries in sequence order.
 * @throws RemoteError `crew/not-found` for an unknown run.
 */
@Remote('entries') async entries(request: CrewEntriesRequest): Promise<readonly CrewEntry[]>

/**
 * Stream whole roster frames: one on open, then one after each crew change.
 * The stream has no natural end; the carrier closes it.
 * @param signal - cancellation owned by the Remote stream carrier.
 * @returns the snapshot frames.
 */
@Remote({ mode: 'stream' }) watch(signal: AbortSignal): AsyncIterable<CrewSnapshotFrame>
```

Source: [`packages/api/api-robot-crew-controller/src/index.ts`](../../packages/api/api-robot-crew-controller/src/index.ts)

<a id="ctxcrews--crews-abstract-seam"></a>

### `ctx.crews` — `Crews` (abstract seam)

Abstract crew domain service. Subclass it, implement every operation, and load the subclass as the provider; it registers as `ctx.crews`.

Implementations must honor these semantics:

- publish validates the complete specification, requires every member to name a published Rbot revision, and returns an immutable revision; a rejected publication allocates no identity.
- Revisions are append-only and never change after publication.
- start accepts a run only for a published revision and returns before the run executes; observers follow run and the ledger.
- cancel is cooperative; a terminal run keeps its state.
- Ledger sequences are contiguous per run and never rewritten.

```ts cordis-catalog
/**
 * Validate and publish one crew specification revision.
 * @param spec - complete specification.
 * @param previous - revision this publication supersedes; omitted for a new crew.
 * @returns the immutable published revision.
 */
abstract publish(spec: CrewSpec, previous?: CrewSpecRef): Promise<CrewSpecRevision>

/**
 * Read one published revision.
 * @param ref - exact revision.
 * @returns the revision, or `undefined` when it was never published.
 */
abstract revision(ref: CrewSpecRef): Promise<CrewSpecRevision | undefined>

/**
 * List the latest revision of every crew.
 * @returns latest revisions in publication order.
 */
abstract specs(): Promise<readonly CrewSpecRevision[]>

/**
 * Accept one run.
 * @param ref - published revision to execute.
 * @param input - goal message.
 * @returns the accepted run before execution starts.
 */
abstract start(ref: CrewSpecRef, input: CrewRunInput): Promise<CrewRun>

/**
 * Cancel one run cooperatively.
 * @param run - run identity.
 */
abstract cancel(run: CrewRunId): Promise<void>

/**
 * Read one run.
 * @param run - run identity.
 * @returns the run, or `undefined` when it does not exist.
 */
abstract run(run: CrewRunId): Promise<CrewRun | undefined>

/**
 * List runs.
 * @param spec - restrict to one crew specification; omitted lists every run.
 * @returns runs in acceptance order.
 */
abstract runs(spec?: CrewSpecRef['spec']): Promise<readonly CrewRun[]>

/**
 * Read one run's complete flow ledger.
 * @param run - run identity.
 * @returns entries in sequence order.
 */
abstract entries(run: CrewRunId): Promise<readonly CrewEntry[]>

/**
 * Append one ledger entry. Providers expose it to the orchestrator and keep
 * the sequence themselves; consumers never choose a sequence number.
 * @param run - run identity.
 * @param entry - entry without its run and sequence.
 * @returns the stored entry.
 */
abstract append(run: CrewRunId, entry: Omit<CrewEntry, 'run' | 'seq'>): Promise<CrewEntry>
```

Source: [`packages/experimental/experimental-robot-crew/src/index.ts`](../../packages/experimental/experimental-robot-crew/src/index.ts)

<a id="ctxrobotcontroller--robotcontroller"></a>

### `ctx.robotController` — `RobotController`

Host service backing the generated `ctx.remote.robot` namespace.

```ts cordis-catalog
/**
 * List the latest published revision of every specification.
 * @returns latest revisions in publication order.
 */
@Remote('specs') specs(): Promise<readonly RobotSpecRevision[]>

/**
 * Read one published revision.
 * @param request - exact specification revision.
 * @returns the revision.
 * @throws RemoteError `robot/not-found` when the revision was never published.
 */
@Remote('revision') async revision(request: RobotRevisionRequest): Promise<RobotSpecRevision>

/**
 * List every robot.
 * @returns robots in creation order.
 */
@Remote('robots') robots(): Promise<readonly Robot[]>

/**
 * List the runs of one robot. A deleted robot keeps its recorded runs, so an
 * identity that no longer appears in the roster still answers with history.
 * @param request - robot whose runs to read.
 * @returns runs in acceptance order; empty for an identity with no run.
 */
@Remote('runs') async runs(request: RobotRunsRequest): Promise<readonly Run[]>

/**
 * Validate and publish one specification revision.
 * @param request - complete specification and the revision it supersedes.
 * @returns the immutable published revision.
 * @throws RemoteError `robot/spec-invalid` with every field issue, or
 *   `robot/conflict` when the publication conflicts with existing records.
 */
@Remote('publish') async publish(request: RobotPublishRequest): Promise<RobotSpecRevision>

/**
 * Instantiate a robot bound to one published revision.
 * @param request - exact specification revision.
 * @returns the new idle robot.
 * @throws RemoteError `robot/not-found` when the revision does not exist.
 */
@Remote('instantiate') async instantiate(request: RobotInstantiateRequest): Promise<Robot>

/**
 * Bind one robot to a newer published revision without moving runs in flight.
 * @param request - robot and the revision later runs should use.
 * @returns the rebound robot.
 * @throws RemoteError `robot/not-found` for an unknown robot or revision.
 */
@Remote('rebind') async rebind(request: RobotRebindRequest): Promise<Robot>

/**
 * Verify the robot's declared skills, plugins, MCP servers, and permission
 * preset against this deployment and record the installation of its bound
 * revision. A revision that declares nothing resolvable installs immediately.
 * Installation does not start a run; the runtime still resolves every
 * dependency when the run begins.
 * @param request - robot to install.
 * @returns the robot with an installation naming its bound revision.
 * @throws RemoteError `robot/not-found` for an unknown robot or revision, or
 *   `robot/capabilities-missing` with every dependency this deployment lacks.
 */
@Remote('installRobot') async install(request: RobotInstallRequest): Promise<Robot>

/**
 * Delete one robot instance. Its published specifications and recorded runs
 * stay, so the history it produced remains readable; a robot that still owns
 * a non-terminal run refuses removal.
 * @param request - robot to delete.
 * @returns nothing after the robot is deleted.
 * @throws RemoteError `robot/not-found` for an unknown robot, or
 *   `robot/conflict` while a run is still executing.
 */
@Remote('removeRobot') async remove(request: RobotRemoveRequest): Promise<void>

/**
 * Publish a user-owned copy of one registered template and instantiate it.
 * The copy is an ordinary specification: later template changes never
 * modify it, and editing it never modifies the template.
 * @param request - template, locale for its copy, an optional name, and the
 *   Workspace directory a rootless template inherits.
 * @returns the new idle robot.
 * @throws RemoteError `robot/not-found` for an unknown template or a missing
 *   template registry, `robot/spec-invalid` when the template does not
 *   validate, or `robot/conflict` when publication conflicts.
 */
@Remote('hire') async hire(request: RobotHireRequest): Promise<Robot>

/**
 * Accept one run for a robot. A specification that declares skills, plugins,
 * or MCP servers must be installed for its bound revision first; installing
 * verifies the deployment can resolve what the run will need.
 * @param request - robot and the input message.
 * @returns the accepted run.
 * @throws RemoteError `robot/not-found` for an unknown robot, or
 *   `robot/conflict` while the robot cannot accept a run, including when its
 *   declared dependencies were never installed.
 */
@Remote('start') async start(request: RobotStartRequest): Promise<Run>

/**
 * Cancel a run cooperatively.
 * @param request - run to cancel.
 * @returns nothing after the cancellation is recorded.
 * @throws RemoteError `robot/not-found` for an unknown run.
 */
@Remote('cancel') async cancel(request: RobotCancelRequest): Promise<void>

/**
 * Pause an executing run: record it as `waiting`, then abort its active turn
 * so the user can correct the robot before it continues. The Session, its
 * history, and the Agent stay alive, so a later `correct` continues the same
 * run instead of starting from an empty Session.
 * @param request - run to pause.
 * @returns nothing after the run is waiting for input.
 * @throws RemoteError `robot/not-found` for an unknown run, or
 *   `robot/conflict` while the run has no live Agent to pause.
 */
@Remote('interrupt') async interrupt(request: RobotInterruptRequest): Promise<void>

/**
 * Deliver the user's correction to a run. A waiting run receives it as the
 * next turn; a running run receives it as steering for the next step, which
 * leaves the current work in place.
 * @param request - run and the correction text.
 * @returns nothing after the Agent accepted the message.
 * @throws RemoteError `robot/not-found` for an unknown run,
 *   `robot/conflict` while the run is not executing, or
 *   `gateway/bad-request` when the correction has no text.
 */
@Remote('correct') async correct(request: RobotCorrectRequest): Promise<void>

/**
 * List the local values the specification editor offers as choices. Each
 * source is optional: a deployment without the skill, plugin, tool, MCP, or
 * Workspace service contributes an empty list instead of failing the read.
 * @param request - Workspace whose project skills apply.
 * @returns skill, plugin, tool, MCP-server, and Workspace-directory options.
 */
@Remote('capabilities') async capabilities(request: RobotCapabilitiesRequest): Promise<RobotCapabilityCatalog>

/**
 * Stream whole registry frames: one on open, then one after each registry
 * change. The stream has no natural end; the carrier closes it.
 * @param signal - cancellation owned by the Remote stream carrier.
 * @returns the snapshot frames.
 */
@Remote({ mode: 'stream' }) watch(signal: AbortSignal): AsyncIterable<RobotSnapshotFrame>
```

Source: [`packages/api/robot-controller/src/index.ts`](../../packages/api/robot-controller/src/index.ts)

<a id="ctxrobots--robots-abstract-seam"></a>

### `ctx.robots` — `Robots` (abstract seam)

Abstract robot domain service. Subclass it, implement every operation, and load the subclass as the provider; it registers as `ctx.robots`.

Implementations must honor these semantics:

- publish validates the specification and returns an immutable revision; a failed validation rejects without allocating an identity.
- Revisions are append-only: revision `n + 1` supersedes `n`, and a published revision never changes.
- instantiate binds one robot to one exact revision; later revisions do not move an existing robot unless rebind names the new revision explicitly.
- rebind changes the revision later runs use; a run keeps the revision it was accepted with.
- install records that the bound revision's declared dependencies were verified; rebind clears an installation that named another revision.
- remove deletes the robot instance only; published revisions and runs stay readable, and a robot with a non-terminal run refuses removal.
- attachSession records the Session an executor drives for one run; the link is write-once and a later different Session is refused.
- start accepts a run only from `idle` and rejects while the robot is `provisioning`, `paused`, `failed`, or `stopped`.
- cancel is cooperative and settles the run as `cancelled` unless it already reached a terminal state.
- advance records executor progress in non-terminal states; a terminal run keeps its existing state.
- finish records the executor's terminal state; a terminal run keeps its existing state.

```ts cordis-catalog
/**
 * Validate and publish one specification revision.
 * @param spec - complete specification to publish.
 * @param previous - revision this publication supersedes; omitted for a new specification.
 * @returns the immutable published revision.
 * @throws when validation fails or `previous` does not exist.
 */
abstract publish(spec: RobotSpec, previous?: RobotSpecRef): Promise<RobotSpecRevision>

/**
 * Read one published revision.
 * @param ref - exact specification revision.
 * @returns the revision, or `undefined` when it was never published.
 */
abstract revision(ref: RobotSpecRef): Promise<RobotSpecRevision | undefined>

/**
 * List the latest published revision of every specification.
 * @returns latest revisions in publication order.
 */
abstract specs(): Promise<readonly RobotSpecRevision[]>

/**
 * Instantiate a robot bound to one published revision.
 * @param ref - exact specification revision.
 * @returns the new provisioned robot in `idle` state.
 * @throws when the revision does not exist or a dependency is unavailable.
 */
abstract instantiate(ref: RobotSpecRef): Promise<Robot>

/**
 * Bind one robot to a newer published revision. Runs already accepted keep
 * the revision they started with; later runs use `ref`.
 * @param robot - robot identity.
 * @param ref - revision to bind.
 * @returns the rebound robot.
 * @throws when the robot or the revision does not exist.
 */
abstract rebind(robot: RobotId, ref: RobotSpecRef): Promise<Robot>

/**
 * Record that the robot's bound revision was verified in this deployment.
 * The caller resolves the revision's declared skills, plugins, MCP servers,
 * and permission preset and calls this only after every one is available;
 * the provider owns the durable installation record, not the verification.
 * Installing twice keeps the latest successful time.
 * @param robot - robot identity.
 * @returns the robot with an installation naming its bound revision.
 * @throws when the robot does not exist.
 */
abstract install(robot: RobotId): Promise<Robot>

/**
 * Delete one robot instance. Published revisions and recorded runs stay, so
 * run history remains readable after the robot leaves the roster.
 * @param robot - robot identity.
 * @returns nothing after the robot is deleted.
 * @throws when the robot does not exist or a run it owns is not terminal.
 */
abstract remove(robot: RobotId): Promise<void>

/**
 * Read one robot.
 * @param id - robot identity.
 * @returns the robot, or `undefined` when it does not exist.
 */
abstract robot(id: RobotId): Promise<Robot | undefined>

/**
 * List every robot.
 * @returns robots in creation order.
 */
abstract robots(): Promise<readonly Robot[]>

/**
 * Accept one run for a robot.
 * @param robot - robot identity.
 * @param input - run input.
 * @returns the accepted run.
 * @throws when the robot does not exist or cannot accept a run in its current state.
 */
abstract start(robot: RobotId, input: RunInput): Promise<Run>

/**
 * Cancel a run cooperatively.
 * @param run - run identity.
 * @returns nothing after the cancellation is recorded.
 * @throws when the run does not exist.
 */
abstract cancel(run: RunId): Promise<void>

/**
 * Record executor progress for one run in a non-terminal state. `waiting`
 * means the run is paused for human input and the executor keeps its Agent
 * alive; `running` reports it drives work again; `finalizing` reports it is
 * settling. A run that already reached a terminal state keeps that state.
 * @param run - run identity.
 * @param state - executor-owned state to record.
 * @returns nothing after the state is recorded.
 * @throws when the run does not exist.
 */
abstract advance(run: RunId, state: ActiveRunState): Promise<void>

/**
 * Settle one run with its executor's outcome.
 * @param run - run identity.
 * @param outcome - terminal state and any output or failure detail.
 * @returns nothing after the outcome is recorded.
 * @throws when the run does not exist.
 */
abstract finish(run: RunId, outcome: RunOutcome): Promise<void>

/**
 * Record the Session one run's execution logs to.
 * @param run - run identity.
 * @param session - Session the executor drives for this run.
 * @returns nothing after the link is recorded.
 * @throws when the run does not exist or already names a different Session.
 */
abstract attachSession(run: RunId, session: SessionId): Promise<void>

/**
 * Read one run.
 * @param id - run identity.
 * @returns the run, or `undefined` when it does not exist.
 */
abstract run(id: RunId): Promise<Run | undefined>

/**
 * List runs owned by one robot.
 * @param robot - robot identity.
 * @returns runs in acceptance order.
 */
abstract runs(robot: RobotId): Promise<readonly Run[]>
```

Types: [SessionId](core.md)

Source: [`packages/experimental/robot/src/index.ts`](../../packages/experimental/robot/src/index.ts)

<a id="ctxrobottemplates--robottemplateregistry"></a>

### `ctx.robotTemplates` — `RobotTemplateRegistry`

In-memory registry of robot templates contributed by mounted plugins. Registration order is listing order. Each change emits `robot/changed` with `templates`.

```ts cordis-catalog
/**
 * Add one template until the returned disposer runs. Call it inside the
 * contributing plugin's `ctx.effect` so unloading removes the template.
 * @param template - template whose id is not registered yet.
 * @returns the disposer that removes exactly this registration.
 * @throws when a template with the same id is already registered.
 */
register(template: RobotTemplate): () => void

/**
 * List every registered template.
 * @returns templates in registration order.
 */
list(): readonly RobotTemplate[]

/**
 * Read one template.
 * @param id - template identity.
 * @returns the template, or `undefined` when none is registered under `id`.
 */
get(id: RobotTemplateId): RobotTemplate | undefined

/**
 * Build the specification one hire publishes from a registered template.
 * @param id - template identity.
 * @param locale - locale whose copy fills the name, description, mission, and criteria.
 * @param name - display name to publish; defaults to the localized template name.
 * @returns a new specification independent of the template, or `undefined` when none is registered under `id`.
 */
hireSpec(id: RobotTemplateId, locale: string, name?: string): RobotSpec | undefined
```

Source: [`packages/experimental/robot/src/templates.ts`](../../packages/experimental/robot/src/templates.ts)

<a id="ctxroomcontroller--roomcontroller"></a>

### `ctx.roomController` — `RoomController`

Host service backing the generated `ctx.remote.room` namespace.

```ts cordis-catalog
/**
 * List current rooms.
 * @returns every published room in publication order.
 */
@Remote('rooms') rooms(): Promise<readonly Room[]>

/**
 * Read one room.
 * @param request - room identity.
 * @returns the room.
 * @throws RemoteError `room/not-found` for an unknown room.
 */
@Remote('room') async room(request: RoomTargetRequest): Promise<Room>

/**
 * Publish a new room or a new revision.
 * @param request - existing room and complete specification.
 * @returns the saved room.
 * @throws RemoteError `room/spec-invalid` with every field issue, or
 *   `room/conflict` when the provider refuses the save.
 */
@Remote('publish') async publish(request: RoomPublicationRequest): Promise<Room>

/**
 * Record one human message.
 * @param request - room, text, mentions, and optional author.
 * @returns the recorded message.
 * @throws RemoteError `room/not-found` or `room/conflict`.
 */
@Remote('post') async post(request: RoomPostRequest): Promise<RoomMessage>

/**
 * Read room messages.
 * @param request - room, start sequence, and limit.
 * @returns messages in sequence order.
 * @throws RemoteError `room/not-found`.
 */
@Remote('messages') async messages(request: RoomMessagesRequest): Promise<readonly RoomMessage[]>

/**
 * Pause or resume a room.
 * @param request - room and whether robot wakes stop.
 * @returns the updated room.
 */
@Remote('pause') async pause(request: RoomPauseRequest): Promise<Room>

/**
 * Resume a tripped room.
 * @param request - room target and decision input.
 * @returns the room after the change.
 */
@Remote('resume') async resume(request: RoomTargetRequest): Promise<Room>

/**
 * Raise the current episode's limits by 50% once.
 * @param request - room target and decision input.
 * @returns the room after the change.
 */
@Remote('relaxOnce') async relaxOnce(request: RoomTargetRequest): Promise<Room>

/**
 * End the current episode.
 * @param request - room target and decision input.
 * @returns the room after the change.
 */
@Remote('endEpisode') async endEpisode(request: RoomTargetRequest): Promise<Room>

/**
 * Decide one pending approval.
 * @param request - room target and decision input.
 * @returns the room after the change.
 */
@Remote('approve') async approve(request: RoomApprovalRequest): Promise<Room>

/**
 * Stream room frames: one on open, then one after each change.
 * @param signal - cancellation owned by the Remote stream carrier.
 * @returns the snapshot frames.
 */
@Remote({ mode: 'stream' }) watch(signal: AbortSignal): AsyncIterable<RoomSnapshotFrame>
```

Types: [Room](../../packages/experimental/experimental-robot-room/README.md) · [RoomApprovalRequest](../../packages/api/api-robot-room-controller/README.md) · [RoomMessage](../../packages/experimental/experimental-robot-room/README.md) · [RoomMessagesRequest](../../packages/api/api-robot-room-controller/README.md) · [RoomPauseRequest](../../packages/api/api-robot-room-controller/README.md) · [RoomPostRequest](../../packages/api/api-robot-room-controller/README.md) · [RoomPublicationRequest](../../packages/api/api-robot-room-controller/README.md) · [RoomSnapshotFrame](../../packages/api/api-robot-room-controller/README.md) · [RoomTargetRequest](../../packages/api/api-robot-room-controller/README.md)

Source: [`packages/api/api-robot-room-controller/src/index.ts`](../../packages/api/api-robot-room-controller/src/index.ts)

<a id="ctxrooms--rooms-abstract-seam"></a>

### `ctx.rooms` — `Rooms` (abstract seam)

Abstract Robot Room service. Implement every operation in a provider and load the provider as the plugin.

Implementations must honor these semantics:

- A room revision is immutable and append-only; a running episode keeps the revision it started under.
- Every message a member model can read is durably recorded before delivery.
- A member has no side channel: only `ctx.rooms` admits and delivers messages.
- An open breaker stops robot wakes; human messages are still recorded.
- An interrupted episode is not replayed after a restart.

```ts cordis-catalog
/**
 * List current rooms in publication order.
 * @returns every published room.
 */
abstract list(): Promise<readonly Room[]>

/**
 * Read one room.
 * @param id - room identity.
 * @returns the room, or `undefined` when it does not exist.
 */
abstract room(id: RoomId): Promise<Room | undefined>

/**
 * Publish a new room or save a new revision of one.
 * @param id - existing room, or `undefined` for a new room.
 * @param spec - complete specification.
 * @returns the saved room with its new revision.
 */
abstract publish(id: RoomId | undefined, spec: RoomSpec): Promise<Room>

/**
 * Record one human message and schedule its wakes.
 * @param input - room, text, mentions, and author.
 * @returns the recorded message.
 */
abstract post(input: RoomPost): Promise<RoomMessage>

/**
 * Read room messages in sequence order.
 * @param id - room identity.
 * @param afterSeq - read messages after this sequence; omitted starts at `1`.
 * @param limit - maximum messages to return; omitted uses the provider default.
 * @returns messages in sequence order.
 */
abstract messages(id: RoomId, afterSeq?: number, limit?: number): Promise<readonly RoomMessage[]>

/**
 * Pause or resume a room.
 * @param id - room identity.
 * @param paused - whether robot wakes stop.
 * @returns the updated room.
 */
abstract pause(id: RoomId, paused: boolean): Promise<Room>

/**
 * Resume a tripped room: the breaker enters half-open.
 * @param id - room identity.
 * @returns the updated room.
 */
abstract resume(id: RoomId): Promise<Room>

/**
 * Raise the current episode's limits by 50% once.
 * @param id - room identity.
 * @returns the updated room.
 */
abstract relaxOnce(id: RoomId): Promise<Room>

/**
 * End the current episode and close its breaker.
 * @param id - room identity.
 * @returns the updated room.
 */
abstract endEpisode(id: RoomId): Promise<Room>

/**
 * Decide one pending A2A approval.
 * @param id - room identity.
 * @param approval - approval identity.
 * @param decision - operator decision.
 * @returns the updated room.
 */
abstract approve(id: RoomId, approval: string, decision: 'approved' | 'rejected'): Promise<Room>
```

Types: [Room](../../packages/experimental/experimental-robot-room/README.md) · [RoomId](../../packages/experimental/experimental-robot-room/README.md) · [RoomMessage](../../packages/experimental/experimental-robot-room/README.md) · [RoomPost](../../packages/experimental/experimental-robot-room/README.md) · [RoomSpec](../../packages/experimental/experimental-robot-room/README.md)

Source: [`packages/experimental/experimental-robot-room/src/index.ts`](../../packages/experimental/experimental-robot-room/src/index.ts)

<a id="crew-events"></a>

### `crew/*` events

<a id="crewchanged--emit"></a>

#### `crew/changed` — emit

A crew record family observers re-read.

```ts cordis-catalog
/**
 * A crew record family observers re-read.
 * @param kind - family that changed: specifications, runs, or ledger entries.
 * @mode emit
 */
'crew/changed'(kind: CrewChangeKind): void
```

Source: [`packages/experimental/experimental-robot-crew/src/index.ts`](../../packages/experimental/experimental-robot-crew/src/index.ts)

<a id="robot-events"></a>

### `robot/*` events

<a id="robotchanged--emit"></a>

#### `robot/changed` — emit

A robot registry mutation observers re-read.

```ts cordis-catalog
/**
 * A robot registry mutation observers re-read.
 * @param kind - record family that changed: specifications, robots, runs, or registered templates.
 * @mode emit
 */
'robot/changed'(kind: 'specs' | 'robots' | 'runs' | 'templates'): void
```

Source: [`packages/experimental/robot/src/index.ts`](../../packages/experimental/robot/src/index.ts)

<a id="robotevent--emit"></a>

#### `robot/event` — emit

One robot event topic declared by an event trigger.

```ts cordis-catalog
/**
 * One robot event topic declared by an event trigger.
 * @param topic - topic matched against event triggers.
 * @param payload - JSON-compatible payload handed to the run.
 * @mode emit
 */
'robot/event'(topic: string, payload: unknown): void
```

Source: [`packages/experimental/robot-triggers/src/index.ts`](../../packages/experimental/robot-triggers/src/index.ts)

<a id="room-events"></a>

### `room/*` events

<a id="roomchanged--emit"></a>

#### `room/changed` — emit

One room record family changed.

```ts cordis-catalog
/**
 * One room record family changed.
 * @param room - room whose records changed.
 * @mode emit
 */
'room/changed'(room: RoomId): void
```

Types: [RoomId](../../packages/experimental/experimental-robot-room/README.md)

Source: [`packages/experimental/experimental-robot-room/src/index.ts`](../../packages/experimental/experimental-robot-room/src/index.ts)

<a id="roomnotice--emit"></a>

#### `room/notice` — emit

One operator-facing room notice for an external notification channel.

```ts cordis-catalog
/**
 * One operator-facing room notice for an external notification channel.
 * @param notice - room, kind, text, and time.
 * @mode emit
 */
'room/notice'(notice: RoomNotice): void
```

Types: [RoomNotice](../../packages/experimental/experimental-robot-room/README.md)

Source: [`packages/experimental/experimental-robot-room/src/index.ts`](../../packages/experimental/experimental-robot-room/src/index.ts)
<!-- END GENERATED cordis-surface -->