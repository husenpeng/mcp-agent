# Robot platform

English | [中文](robot.zh.md)

The [`@tomato/experimental-robot`](../../packages/experimental/robot/README.md) service definition owns the durable vocabulary for versioned robots: specifications, robot instances, runs, and agent-to-agent contract fields. It registers `ctx.robots`; execution, persistence, and transport belong to an installed provider. The [Agent Note](../../.agents/notes/proposed/architecture/2026-10-29-robot-platform-product-architecture.md) owns the product architecture and delivery decisions.

## Specifications and revisions

`RobotSpec` carries five blocks: position and authority, goal and execution, capability and limits, input and output, and memory and A2A. Publication validates the specification and returns one `RobotSpecRevision`. Revisions are append-only, and a published revision is immutable. Instantiation binds a `Robot` to one exact `RobotSpecRef`, so a later revision does not move an existing robot.

## Creating robots

The [robot page](../../packages/client/ui-robot/README.md) offers manual and conversation creation over the same four basic fields: name, description, task goal, and success criteria. The basic tab collects only those fields; every advanced block starts from [`emptyRobotSpec()`](../../packages/experimental/robot/src/spec.ts) — a manual trigger, plan strategy, workspace sandbox and permission preset, a 100k-token/600s/100-tool-call budget, no network, no memory, and no A2A intents — and remains editable under the advanced tab. Skill, tool, MCP-server, and Workspace-root fields are pickers over the deployment's live values (`robot.capabilities`); free entry stays for a value no local source publishes, and a source that is absent leaves only that input with a hint.

Conversation creation opens a new Session in the current Workspace with a draft that names the bundled `robot-creation` skill. The skill interviews the user for the same four answers and calls `robot_create`, provided by [`@tomato/experimental-tool-robot`](../../packages/experimental/tool-robot/README.md). The tool publishes the specification and instantiates the revision in one call, and refuses unless the calling agent is a live top-level agent with a human message in its open turn. A profile that does not select `@tomato/experimental-robot-app` has neither the tool nor the skill.

## Templates

A `RobotTemplate` is a hireable starting point: a stable `RobotTemplateId`, a category, copy per locale (`RobotTemplateText`: category label, name, description, mission, success criteria, acceptance), and every non-localized specification block. Template packages register templates with `ctx.robotTemplates`, provided by the separate `@tomato/experimental-robot/templates` row. A hire calls `templateSpec()` to build a specification from the template and the page locale, publishes it as a new specification, and instantiates it, so the hired robot is an ordinary user-owned robot: editing it publishes revisions of that specification, and template changes never reach it. [`@tomato/experimental-robot-templates-marketing`](../../packages/experimental/robot-templates-marketing/README.md) contributes the creator-marketing templates.

## Robot and run lifecycle

`RobotState` covers `provisioning`, `idle`, `running`, `paused`, `failed`, and `stopped`. `RunState` covers `queued`, `leased`, `running`, `waiting`, `finalizing`, `succeeded`, `failed`, `cancelled`, and `timed_out`; `isTerminalRunState` reports the four settled states. A run is accepted only from `idle`, and cancellation is cooperative, so a run that already settled keeps its state.

A run spans turns while it stays non-terminal. The executor reports progress through `advance` — `running` while it drives work, `waiting` while it holds a paused run's Agent for a human correction, and `finalizing` while it settles; a terminal run keeps its state. The Remote controller owns `interrupt`, which records `waiting` before aborting the active turn while keeping the inbox, and `correct`, which delivers a message into the run's own live Agent — the next turn while waiting, steering while running — and records `running` again. A run without a live Agent refuses both instead of resuming a detached Session.

## Authority and agent-to-agent fields

`PositionSpec` declares the owner, the `reportsTo` authority, callers, callees, the escalation order, and visibility. `A2aSpec` declares accepted intents plus each peer's budget and approval requirement. The service decides admission; a transport provider carries the envelope between robots.

## Provider responsibilities

The definition adds no prompt, tool, storage, or transport. A provider implements every operation, owns validation diagnostics and persistence, and binds each run to a specification revision. The storage-backed [local provider](../../packages/experimental/robot-local/README.md) implements publication, instantiation, and run acceptance without execution, the [runtime](../../packages/experimental/robot-runtime/README.md) drives queued runs through one Agent per run, and the [trigger package](../../packages/experimental/robot-triggers/README.md) starts runs for cron schedules and robot event topics; the package READMEs record the remaining trigger, budget, memory, and A2A gaps.

<!-- BEGIN GENERATED cordis-surface (gen-cordis-catalog.ts) — do not edit between markers -->

<a id="cordis-surface"></a>

## Cordis API

Generated from source by `scripts/gen-cordis-catalog.ts` (verified fresh by `pnpm run verify-cordis-catalog` in doc-sync; regenerate with `pnpm run gen-cordis-catalog`) — the language sides differ only in locale-specific paired document paths. Signature blocks use a `ts cordis-catalog` fence and keep the original source JSDoc; dispatch modes are defined in the [primer](../cordis-primer.md#dispatch-modes), and the framework-inherited `ctx` API lives in [cordis-api/inherited.md](../cordis-api/inherited.md).

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
 * List the runs of one robot.
 * @param request - robot whose runs to read.
 * @returns runs in acceptance order.
 * @throws RemoteError `robot/not-found` for an unknown robot.
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
 * Accept one run for a robot.
 * @param request - robot and the input message.
 * @returns the accepted run.
 * @throws RemoteError `robot/not-found` for an unknown robot, or
 *   `robot/conflict` while the robot cannot accept a run.
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
 * source is optional: a deployment without the skill, tool, MCP, or Workspace
 * service contributes an empty list instead of failing the read.
 * @param request - Workspace whose project skills apply.
 * @returns skill, tool, MCP-server, and Workspace-directory options.
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
<!-- END GENERATED cordis-surface -->