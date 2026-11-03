# 机器人平台

[English](robot.md) | 中文

[`@tomato/experimental-robot`](../../packages/experimental/robot/README.zh.md) 服务定义拥有有版本机器人的持久词汇：规格、机器人实例、run 与 agent-to-agent 契约字段。它注册 `ctx.robots`；执行、持久化和传输属于已安装的提供者。[Agent Note](../../.agents/notes/proposed/architecture/2026-10-29-robot-platform-product-architecture.zh.md) 拥有产品架构与交付决策。

## 规格与 revision

`RobotSpec` 包含五个区块：地位与权限、目标与执行、能力与边界、输入与输出、记忆与 A2A。发布时校验规格并返回一个 `RobotSpecRevision`。revision 只追加，已发布的 revision 不可修改。实例化把一个 `Robot` 绑定到一个精确的 `RobotSpecRef`，因此后续 revision 不会移动已有机器人。

## 创建机器人

[机器人页](../../packages/client/ui-robot/README.zh.md)提供手动创建与会话创建，两者共用四项基础字段：名称、描述、任务目标、成功标准。基础配置页只收集这些字段；其余高级区块都从 [`emptyRobotSpec()`](../../packages/experimental/robot/src/spec.ts) 的通用默认值开始——手动触发器、plan 策略、workspace 沙箱与权限预设、100k token/600 秒/100 次工具调用预算、无网络、无记忆、无 A2A intent——并可在「高级配置」中修改。

会话创建会在当前工作区新开一个会话，草稿点名随包提供的 `robot-creation` 技能。技能向用户询问同样的四项回答，并调用 [`@tomato/experimental-tool-robot`](../../packages/experimental/tool-robot/README.zh.md) 提供的 `robot_create`。该工具在一次调用中发布规格并实例化修订；只有调用方是存活的顶层 Agent、且当前回合包含人类消息时才执行。未选择 `@tomato/experimental-robot-app` 的 profile 既没有该工具，也没有该技能。

## 机器人与 run 生命周期

`RobotState` 覆盖 `provisioning`、`idle`、`running`、`paused`、`failed` 与 `stopped`。`RunState` 覆盖 `queued`、`leased`、`running`、`waiting`、`finalizing`、`succeeded`、`failed`、`cancelled` 与 `timed_out`；`isTerminalRunState` 报告四个已结束状态。run 只能从 `idle` 接受，取消是协作式的，已经结束的 run 保持其状态。

## 权威与 agent-to-agent 字段

`PositionSpec` 声明负责人、`reportsTo` 权威、调用方、被调用方、升级顺序与可见范围。`A2aSpec` 声明接受的 intent 以及每个对端的预算与审批要求。服务决定是否准入；传输提供者在机器人之间承载信封。

## 提供者职责

本定义不添加提示、工具、存储或传输。提供者实现每个操作，拥有校验诊断与持久化，并把每次 run 绑定到规格 revision。存储支持的[本地提供者](../../packages/experimental/robot-local/README.zh.md)实现发布、实例化与 run 接受，但不执行；[运行时](../../packages/experimental/robot-runtime/README.zh.md)为每个 run 组合一个 Agent 并驱动排队的 run；[触发器包](../../packages/experimental/robot-triggers/README.zh.md)从 cron 调度与机器人事件主题启动 run。各包 README 记录剩余的触发器、预算、记忆与 A2A 缺口。

<!-- BEGIN GENERATED cordis-surface (gen-cordis-catalog.ts) — do not edit between markers -->

<a id="cordis-surface"></a>

## Cordis API

Generated from source by `scripts/gen-cordis-catalog.ts` (verified fresh by `pnpm run verify-cordis-catalog` in doc-sync; regenerate with `pnpm run gen-cordis-catalog`) — the language sides differ only in locale-specific paired document paths. Signature blocks use a `ts cordis-catalog` fence and keep the original source JSDoc; dispatch modes are defined in the [primer](../cordis-primer.zh.md#dispatch-modes), and the framework-inherited `ctx` API lives in [cordis-api/inherited.md](../cordis-api/inherited.md).

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

<a id="robot-events"></a>

### `robot/*` events

<a id="robotchanged--emit"></a>

#### `robot/changed` — emit

A robot registry mutation observers re-read.

```ts cordis-catalog
/**
 * A robot registry mutation observers re-read.
 * @param kind - record family that changed: specifications, robots, or runs.
 * @mode emit
 */
'robot/changed'(kind: 'specs' | 'robots' | 'runs'): void
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