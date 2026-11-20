# 机器人平台

[English](robot.md) | 中文

[`@tomato/experimental-robot`](../../packages/experimental/robot/README.zh.md) 服务定义拥有有版本机器人的持久词汇：规格、机器人实例、run 与 agent-to-agent 契约字段。它注册 `ctx.robots`；执行、持久化和传输属于已安装的提供者。[Agent Note](../../.agents/notes/proposed/architecture/2026-10-29-robot-platform-product-architecture.zh.md) 拥有产品架构与交付决策。

## 规格与 revision

`RobotSpec` 包含五个区块：地位与权限、目标与执行、能力与边界、输入与输出、记忆与 A2A。发布时校验规格并返回一个 `RobotSpecRevision`。revision 只追加，已发布的 revision 不可修改。实例化把一个 `Robot` 绑定到一个精确的 `RobotSpecRef`，因此后续 revision 不会移动已有机器人。

## 创建机器人

[机器人页](../../packages/client/ui-robot/README.zh.md)提供三步创建向导与会话创建，两者共用四项基础字段：名称、描述、任务目标、成功标准。向导先问每次运行要做什么，再问名称与描述，然后是可选的成功标准，最后用预览确认并显示工作目录；它要求真实的名称与任务目标，在保存前检查重名，并就地发布规格、实例化修订。向导不会发布 [`emptyRobotSpec()`](../../packages/experimental/robot/src/spec.ts) 里的占位名称或占位任务。其余高级区块——手动触发器、plan 策略、workspace 沙箱与权限预设、100k token/600 秒/100 次工具调用预算、无网络、无记忆、无 A2A intent——都使用该通用默认值，创建后可在规格编辑器的「高级配置」中修改。模型字段写入 `goal.model`：选项是部署当前可路由的 provider 与模型（`session/modelCatalog`），包括在设置中配置的第三方 API provider；不选择时沿用部署默认模型。技能、插件、工具、MCP 服务器与工作区根字段是选择器，选项来自部署的实时值（`robot.capabilities`）；本地没有来源的值仍可自由输入，来源缺失时显示弹出层的空状态并保留输入框。插件选项是插件清单报告为启用且活跃的模块名。技能、插件、MCP 服务器与工作区根改用弹出层而不是菜单：技能行显示来源文件夹，插件行列出活跃的部署插件，MCP 行列出部署已配置的服务器，工作区根还提供基于 directory-picker seam 的应用内文件夹浏览器（部署提供 native 能力时改用宿主自己的选择器）。

会话创建会在当前工作区新开一个会话，并用用户的口吻发送一句简短的创建请求。随包提供的 `robot-creation` 技能一次只问一个问题，并按内置的 `grilling` 方法推进访谈，自己起草一句话描述，展示四项草稿并等待确认，然后调用 [`@tomato/experimental-tool-robot`](../../packages/experimental/tool-robot/README.zh.md) 提供的 `robot_create`。用户点名技能、插件或 MCP 服务器时，技能把它们写入工具参数；之后修改这些列表时调用同一包的 `robot_update`，它会重新发布最新修订并重绑定机器人。部署挂载 `ask_user_question` 时，每个问题会渲染成表单卡；没有该工具时改用纯文本提问。该工具在一次调用中发布规格并实例化修订，拒绝空白或占位的名称与任务目标，并把创建的机器人记录为展示元数据，让对话中的工具行提供「打开机器人」。只有调用方是存活的顶层 Agent、且当前回合包含人类消息时才执行。未选择 `@tomato/experimental-robot-app` 的 profile 既没有该工具，也没有该技能。

## 模板

`RobotTemplate` 是可聘用的起点：稳定的 `RobotTemplateId`、一个分类、按语言提供的文案（`RobotTemplateText`：分类名、名称、描述、任务目标、成功标准、验收标准），以及所有与语言无关的规格区块。模板包通过 `ctx.robotTemplates` 注册模板，该服务由单独的 `@tomato/experimental-robot/templates` 行提供。聘用时调用 `templateSpec()`，根据模板和页面语言生成规格，作为一份新规格发布并实例化；因此被聘用的机器人是普通的、归用户所有的机器人：编辑它会发布该规格的新修订，模板的变化不会影响它。[`@tomato/experimental-robot-templates-marketing`](../../packages/experimental/robot-templates-marketing/README.zh.md) 提供创作者营销模板。[`@tomato/experimental-robot-templates-knowledge-work`](../../packages/experimental/robot-templates-knowledge-work/README.zh.md) 把 Anthropic 的知识工作插件适配成十六个岗位模板及其内置技能。

## 安装与删除

规格在 `capability.skills`、`capability.plugins`（按部署加载的模块名）与 `capability.mcpServers` 中声明 run 必须解析的依赖。安装会按当前部署逐项校验：机器人工作目录可见的技能目录、插件清单中启用且活跃的项、已配置的 MCP 服务器，以及权限目录；只有全部可用时才在机器人上记录 `installation`。失败时按 `skill`、`plugin`、`mcpServer` 或 `permissionPreset` 列出每个缺失依赖；页面正是以此报告部署尚未安装的插件，因为安装只校验、从不安装包。重绑定到其他 revision 会清除安装记录，因此 run 不会沿用用户未执行过的校验。

规格声明上述三类列表任一项时，机器人页面会在其绑定 revision 安装之前阻止开始新的手动运行。触发器或其他 Host 代码通过 `ctx.robots.start` 启动的 run 仍按自身规则接受；运行时在 run 开始时仍会解析每个声明依赖，缺失时显式失败。

删除机器人只删除实例：已发布 revision 与运行记录仍可读取；仍有未终态 run 的机器人在该 run 结束前拒绝删除。

## 机器人与 run 生命周期

`RobotState` 覆盖 `provisioning`、`idle`、`running`、`paused`、`failed` 与 `stopped`。`RunState` 覆盖 `queued`、`leased`、`running`、`waiting`、`finalizing`、`succeeded`、`failed`、`cancelled` 与 `timed_out`；`isTerminalRunState` 报告四个已结束状态。run 只能从 `idle` 接受，取消是协作式的，已经结束的 run 保持其状态。

只要 run 未到终态，它就会跨越多个回合。执行者通过 `advance` 报告进展——驱动工作时为 `running`，为等待人工纠正而保留暂停 run 的 Agent 时为 `waiting`，结算时为 `finalizing`；终态 run 保持其状态。Remote 控制器拥有 `interrupt`：先记录 `waiting`，再中止当前回合并保留 inbox；以及 `correct`：把消息投递给 run 自己的存活 Agent——等待中作为下一回合，运行中作为 steer——并重新记录 `running`。没有存活 Agent 的 run 会拒绝两者，而不是恢复出一条无人结算的 Session。

## 权威与 agent-to-agent 字段

`PositionSpec` 声明负责人、`reportsTo` 权威、调用方、被调用方、升级顺序与可见范围。`A2aSpec` 声明接受的 intent 以及每个对端的预算与审批要求。服务决定是否准入；传输提供者在机器人之间承载信封。

## 提供者职责

本定义不添加提示、工具、存储或传输。提供者实现每个操作，拥有校验诊断与持久化，并把每次 run 绑定到规格 revision。存储支持的[本地提供者](../../packages/experimental/robot-local/README.zh.md)实现发布、实例化与 run 接受，但不执行；[运行时](../../packages/experimental/robot-runtime/README.zh.md)为每个 run 组合一个 Agent 并驱动排队的 run，并在创建 Agent 前校验所选模型路由；[触发器包](../../packages/experimental/robot-triggers/README.zh.md)从 cron 调度与机器人事件主题启动 run。各包 README 记录剩余的触发器、预算、记忆与 A2A 缺口。

<!-- BEGIN GENERATED cordis-surface (gen-cordis-catalog.ts) — do not edit between markers -->

<a id="cordis-surface"></a>

## Cordis API

Generated from source by `scripts/gen-cordis-catalog.ts` (verified fresh by `pnpm run verify-cordis-catalog` in doc-sync; regenerate with `pnpm run gen-cordis-catalog`) — the language sides differ only in locale-specific paired document paths. Signature blocks use a `ts cordis-catalog` fence and keep the original source JSDoc; dispatch modes are defined in the [primer](../cordis-primer.zh.md#dispatch-modes), and the framework-inherited `ctx` API lives in [cordis-api/inherited.md](../cordis-api/inherited.md).

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

Types: [SessionId](core.zh.md)

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
 * Read the work records one room produced.
 * @param request - room identity.
 * @returns one record per ticket, oldest first.
 */
@Remote('work') work(request: RoomTargetRequest): Promise<readonly RoomWorkRecord[]>

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

Types: [Room](../../packages/experimental/experimental-robot-room/README.zh.md) · [RoomApprovalRequest](../../packages/api/api-robot-room-controller/README.zh.md) · [RoomMessage](../../packages/experimental/experimental-robot-room/README.zh.md) · [RoomMessagesRequest](../../packages/api/api-robot-room-controller/README.zh.md) · [RoomPauseRequest](../../packages/api/api-robot-room-controller/README.zh.md) · [RoomPostRequest](../../packages/api/api-robot-room-controller/README.zh.md) · [RoomPublicationRequest](../../packages/api/api-robot-room-controller/README.zh.md) · [RoomSnapshotFrame](../../packages/api/api-robot-room-controller/README.zh.md) · [RoomTargetRequest](../../packages/api/api-robot-room-controller/README.zh.md) · [RoomWorkRecord](../../packages/experimental/experimental-robot-room/README.zh.md)

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
 * Read the work records one room produced, oldest first.
 * @param id - room identity.
 * @returns one record per ticket the room opened.
 */
abstract work(id: RoomId): Promise<readonly RoomWorkRecord[]>

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

Types: [Room](../../packages/experimental/experimental-robot-room/README.zh.md) · [RoomId](../../packages/experimental/experimental-robot-room/README.zh.md) · [RoomMessage](../../packages/experimental/experimental-robot-room/README.zh.md) · [RoomPost](../../packages/experimental/experimental-robot-room/README.zh.md) · [RoomSpec](../../packages/experimental/experimental-robot-room/README.zh.md) · [RoomWorkRecord](../../packages/experimental/experimental-robot-room/README.zh.md)

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

Types: [RoomId](../../packages/experimental/experimental-robot-room/README.zh.md)

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

Types: [RoomNotice](../../packages/experimental/experimental-robot-room/README.zh.md)

Source: [`packages/experimental/experimental-robot-room/src/index.ts`](../../packages/experimental/experimental-robot-room/src/index.ts)
<!-- END GENERATED cordis-surface -->