# Git 工作树

[English](worktrees.md) | 中文

实验性的 [`@tomato/experimental-worktree`](../../packages/experimental/worktree/README.zh.md) 服务提供 `ctx.worktrees`。其消费方 [`create_worktree`](../../packages/experimental/tool-worktree/README.zh.md) 创建新的 Git 分支与检出目录，再通过[工作目录服务](working-directory.zh.md)选中它。[Git 工作树可选 bundle](../../packages/experimental/tool-worktree/README.zh.md#use-this-package)通过 GUI 插件管理器一起加载这两个包。它随安装提供，但默认关闭；显式组合也可以挂载这两个包。

## 创建与保留

调用方 Session 的当前目录决定源仓库。创建操作在分配检出目录前，将请求的本地提交、分支或标签固定为具体提交；省略时选择 `HEAD`。每个名称必须对应新分支与未使用的检出路径。操作既不获取缺失对象，也不复制源检出目录中的暂存、未暂存、未跟踪或被忽略文件。

默认目标为 `<current checkout root>/.agents/worktrees/<name>`。`repositoryRoot` 是调用方当前检出目录的顶层目录；因此，链接检出目录会在自身内部保存工作树父目录。仅当服务的分配操作创建了配置指定的父目录时，服务才会写入内容为 `*` 加换行符的 `.gitignore`。已有文件与忽略规则保持不变。调用方 Session 的现有沙箱策略必须允许写入目标目录与共享 Git 管理目录。Git 初始化成功后才改变工作目录。

通过 `working_directory({ cd: path })` 离开时，会保留检出目录与分支。取消或失败也可能留下部分产物；错误会指出它们的位置。服务销毁时会中止待完成操作并等待它们结束。[包 README](../../packages/experimental/worktree/README.zh.md)拥有配置与 Git 要求。

## 请求与结果

请求只选择新名称与本地版本。结果标识创建的检出目录与确切提交；它不会改变 Session 的原始项目或写权限。

```ts type-equiv
/** A new checkout from a locally available Git commit, branch, or tag. */
interface CreateWorktreeRequest {
  /** New branch name, also used as the relative checkout directory; omission generates a name. */
  name?: string
  /** Local revision to resolve before creation; omission selects HEAD. */
  from?: string
}
```

```ts type-equiv
/** Committed Git baseline and the calling Session's resulting working directory. */
interface CreatedWorktree {
  /** Canonical absolute checkout directory in the filesystem provider's execution world. */
  path: string
  /** Newly created branch name. */
  branch: string
  /** Resolved commit object name; repository-local replacement refs can change its checked-out content. */
  baseCommit: string
  /** Canonical root of the source checkout. */
  repositoryRoot: string
}
```

<!-- BEGIN GENERATED cordis-surface (gen-cordis-catalog.ts) — do not edit between markers -->

<a id="cordis-surface"></a>

## Cordis API

Generated from source by `scripts/gen-cordis-catalog.ts` (verified fresh by `pnpm run verify-cordis-catalog` in doc-sync; regenerate with `pnpm run gen-cordis-catalog`) — the language sides differ only in locale-specific paired document paths. Signature blocks use a `ts cordis-catalog` fence and keep the original source JSDoc; dispatch modes are defined in the [primer](../cordis-primer.zh.md#dispatch-modes), and the framework-inherited `ctx` API lives in [cordis-api/inherited.md](../cordis-api/inherited.md).

<a id="ctxforge--forgeservice"></a>

### `ctx.forge` — `ForgeService`

Registry of forge providers. Watchers of one change request share a single polling loop; each forge has at most one fetch in flight, which batches every due change request of that forge.

```ts cordis-catalog
/**
 * Register the provider of one forge family as an effect on the calling
 * fiber. Watches of that forge receive an `unavailable` failure when the
 * registration ends. Unregistering cancels and awaits its in-flight calls;
 * results from the withdrawn registration are discarded.
 * @param provider - provider to serve `provider.forge`.
 * @returns the disposer that unregisters the provider and waits for its calls to finish.
 * @throws when another provider already serves the same forge.
 */
register(provider: ForgeProvider): () => Promise<void>

/**
 * Map a Git remote URL to a repository through the first provider that serves it.
 * @param url - fetch or push URL as Git reports it.
 * @returns the repository, or undefined when no provider serves the URL.
 */
repositoryFromRemote(url: string): ForgeRepository | undefined

/**
 * Map a change request web URL through the first provider that serves it.
 * @param url - web URL of a pull or merge request.
 * @returns the change request, or undefined when no provider serves the URL.
 */
changeRequestFromUrl(url: string): ChangeRequestRef | undefined

/**
 * Build the canonical web URL of a change request.
 * @param ref - change request served by a registered provider.
 * @returns the provider's canonical URL.
 * @throws when no provider serves the change request's forge.
 */
changeRequestUrl(ref: ChangeRequestRef): string

/**
 * Find open change requests whose head is `branch`, excluding the default branch and forks.
 * @param repository - repository served by a registered provider.
 * @param branch - head branch name on the host.
 * @param signal - cancellation for the lookup.
 * @returns matching change requests, newest first as the provider reports them.
 * @throws when no provider serves the repository's forge or the lookup fails.
 */
async findByHead(repository: ForgeRepository, branch: string, signal: AbortSignal): Promise<readonly ChangeRequestRef[]>

/**
 * Report whether the provider can reach the repository's host with current credentials.
 * @param repository - repository served by a registered provider.
 * @param signal - cancellation for the probe.
 * @returns the provider's readiness for the host.
 * @throws when no provider serves the repository's forge.
 */
async readiness(repository: ForgeRepository, signal: AbortSignal): Promise<ForgeReadiness>

/**
 * Mark a draft change request ready for review, then poll it at once when it is watched.
 * @param ref - change request served by a registered provider.
 * @param signal - cancellation of the request.
 * @returns undefined once the host accepted the change, or why it did not.
 * @throws when no provider serves the change request's forge, or with `signal.reason` when it aborts.
 */
async markReady(ref: ChangeRequestRef, signal: AbortSignal): Promise<ForgeActionFailure | undefined>

/**
 * Merge a change request while its head is still `request.headSha`, then
 * poll it at once when it is watched.
 * @param ref - change request served by a registered provider.
 * @param request - merge method and the head commit the user confirmed.
 * @param signal - cancellation of the request.
 * @returns undefined once the host merged it, or why it did not.
 * @throws when no provider serves the change request's forge, or with `signal.reason` when it aborts.
 */
async merge(ref: ChangeRequestRef, request: MergeRequest, signal: AbortSignal): Promise<ForgeActionFailure | undefined>

/**
 * Rerun the failed checks of a change request's head commit while the head is still `request.headSha`, then poll it
 * at once when it is watched.
 * @param ref - change request served by a registered provider.
 * @param request - the head commit whose checks the user saw.
 * @param signal - cancellation of the request.
 * @returns undefined once the host accepted the rerun, or why it did not; a provider that reruns no checks fails.
 * @throws when no provider serves the change request's forge, or with `signal.reason` when it aborts.
 */
async rerunChecks(ref: ChangeRequestRef, request: ForgeRerunRequest, signal: AbortSignal): Promise<ForgeActionFailure | undefined>

/**
 * Request reviews of a change request from more reviewers, then poll it at once when it is watched.
 * @param ref - change request served by a registered provider.
 * @param request - the reviewers to ask.
 * @param signal - cancellation of the request.
 * @returns undefined once the host accepted the request, or why it did not; a provider that requests no reviews fails.
 * @throws when no provider serves the change request's forge, or with `signal.reason` when it aborts.
 */
async requestReviews( ref: ChangeRequestRef, request: ForgeReviewersRequest, signal: AbortSignal, ): Promise<ForgeActionFailure | undefined>

/**
 * List accounts a review of a change request can be requested from.
 * @param ref - change request served by a registered provider.
 * @param query - text the login or name contains; empty for the host's suggestions and first accounts.
 * @param signal - cancellation of the read.
 * @returns the accounts, the host's suggestions first, or why the host did not list them; a provider that requests no
 * reviews returns `unsupported`.
 * @throws when no provider serves the change request's forge, or with `signal.reason` when it aborts.
 */
async reviewerCandidates( ref: ChangeRequestRef, query: string, signal: AbortSignal, ): Promise<readonly ForgeReviewerCandidate[] | ForgeFailure>

/**
 * Bring the base branch's new commits into a change request's head branch while its head is still
 * `request.headSha`, then poll it at once when it is watched.
 * @param ref - change request served by a registered provider.
 * @param request - update method and the head commit the user confirmed.
 * @param signal - cancellation of the request.
 * @returns undefined once the host accepted the update, or why it did not; a provider that updates no branches fails.
 * @throws when no provider serves the change request's forge, or with `signal.reason` when it aborts.
 */
async updateBranch(ref: ChangeRequestRef, request: BranchUpdateRequest, signal: AbortSignal): Promise<ForgeActionFailure | undefined>

/**
 * Read complete check details independently of periodic polling.
 * @param ref - change request served by a registered provider.
 * @param signal - cancellation of the detail view.
 * @returns a complete snapshot or the provider's failure; unsupported providers return unavailable.
 * @throws on cancellation, provider disposal, or expiry of this read's own `fetchTimeoutMs` deadline.
 */
async fetchChecks(ref: ChangeRequestRef, signal: AbortSignal): Promise<ChangeRequestSnapshot | ForgeFailure>

/**
 * Read the changes of a change request at one head commit as its host
 * computes them. The first `stale` failure at a head commit polls a watched
 * change request again at once, so its next status names the current head;
 * later stale reads at the same commit wait for the regular poll, which
 * bounds the reads while the host's answers disagree. When the latest status of a watched change request names
 * `headSha`, its `baseSha` goes to the provider, which may then read the patch while it confirms the head.
 * @param ref - change request served by a registered provider.
 * @param headSha - head commit the patch must describe, usually the head of the latest status.
 * @param signal - cancellation of the read.
 * @returns one unified patch with `a/` and `b/` path prefixes, or why the host did not provide it at `headSha`.
 * @throws when no provider serves the change request's forge, or with `signal.reason` when it aborts.
 */
async diff(ref: ChangeRequestRef, headSha: string, signal: AbortSignal): Promise<string | ForgeFailure>

/**
 * Read the review threads of a change request at one head commit. A
 * `stale` failure polls a watched change request again as {@link ForgeService.diff} does.
 * @param ref - change request served by a registered provider.
 * @param headSha - head commit the threads must be read at, usually the head of the displayed diff.
 * @param signal - cancellation of the read.
 * @returns the threads read at `headSha`, or why the host did not provide them; `unsupported` when the provider cannot read reviews.
 * @throws when no provider serves the change request's forge, or with `signal.reason` when it aborts.
 */
async readReview(ref: ChangeRequestRef, headSha: string, signal: AbortSignal): Promise<ForgeReviewData | ForgeFailure>

/**
 * Write to the review threads or the pending review of a change request while its head is still `write.headSha`, then
 * poll the change request at once when it is watched, unless the provider cannot write reviews. A `stale` result polls
 * it as a stale read does.
 * @param ref - change request served by a registered provider.
 * @param write - the write and the head commit the user saw.
 * @param signal - cancellation of the write.
 * @returns whether the host took the write; `unsupported` when the provider cannot write reviews, and `unknown` when the
 * outcome must be checked on the host before the write is tried again.
 * @throws when no provider serves the change request's forge, or with `signal.reason` when it aborts.
 */
async writeReview(ref: ChangeRequestRef, write: ForgeReviewWrite, signal: AbortSignal): Promise<ForgeReviewWriteResult>

/**
 * Read the signed-in user's viewed marks on the files of a change request at one head commit. A `stale` failure
 * polls a watched change request again as {@link ForgeService.diff} does.
 * @param ref - change request served by a registered provider.
 * @param headSha - head commit the marks must be read at, usually the head of the displayed diff.
 * @param signal - cancellation of the read.
 * @returns the marks read at `headSha`, why the host did not provide them, or undefined when the provider keeps no
 * viewed marks.
 * @throws when no provider serves the change request's forge, or with `signal.reason` when it aborts.
 */
async viewedFiles(ref: ChangeRequestRef, headSha: string, signal: AbortSignal): Promise<ForgeViewedFiles | ForgeFailure | undefined>

/**
 * Set or clear the signed-in user's viewed mark on one file of a change request while its head is still
 * `request.headSha`. A `stale` failure polls a watched change request again as {@link ForgeService.diff} does.
 * @param ref - change request served by a registered provider.
 * @param request - the file, its mark, and the head commit the user saw.
 * @param signal - cancellation of the request.
 * @returns undefined once the host saved the mark, or why it did not; a provider that keeps no viewed marks fails.
 * @throws when no provider serves the change request's forge, or with `signal.reason` when it aborts.
 */
async setViewed(ref: ChangeRequestRef, request: ForgeViewedRequest, signal: AbortSignal): Promise<ForgeActionFailure | undefined>

/**
 * List the commits of a change request at its current head.
 * @param ref - change request served by a registered provider.
 * @param signal - cancellation of the read.
 * @returns the commits, why the host did not provide them, or undefined when the provider does not read commits.
 * @throws when no provider serves the change request's forge, or with `signal.reason` when it aborts.
 */
async commits(ref: ChangeRequestRef, signal: AbortSignal): Promise<ForgeCommitList | ForgeFailure | undefined>

/**
 * Read the changes between two commits of a change request's repository.
 * @param ref - change request served by a registered provider.
 * @param base - full object name of the commit compared from.
 * @param head - full object name of a commit that descends from `base`.
 * @param signal - cancellation of the read.
 * @returns one unified patch with `a/` and `b/` path prefixes, or why the host did not provide it; a provider that
 * does not read commits returns `unavailable`.
 * @throws when no provider serves the change request's forge, or with `signal.reason` when it aborts.
 */
async compare(ref: ChangeRequestRef, base: string, head: string, signal: AbortSignal): Promise<string | ForgeFailure>

/**
 * Publish one comment or a completed review, then refresh the watched status.
 * @param ref - change request served by a registered provider.
 * @param request - explicitly selected commit, comments, and review decision.
 * @param signal - request cancellation.
 * @returns a publication URL or a failure, including an unknown write outcome.
 */
async submitReview(ref: ChangeRequestRef, request: ForgeReviewRequest, signal: AbortSignal): Promise<ForgeReviewResult>

/**
 * Read the text of one file at a commit of a change request's repository.
 * @param ref - change request served by a registered provider.
 * @param commit - commit object name.
 * @param path - path relative to the repository root.
 * @param signal - cancellation of the read.
 * @returns the text, or why the host did not provide it.
 * @throws when no provider serves the change request's forge, or with `signal.reason` when it aborts.
 */
async fileText(ref: ChangeRequestRef, commit: string, path: string, signal: AbortSignal): Promise<string | ForgeFailure>

/**
 * Build the web page of one file at a commit of a change request's repository.
 * @param ref - change request served by a registered provider.
 * @param commit - commit object name.
 * @param path - path relative to the repository root.
 * @returns the provider's URL.
 * @throws when no provider serves the change request's forge.
 */
fileUrl(ref: ChangeRequestRef, commit: string, path: string): string

/**
 * Watch one change request as an effect on the calling fiber. The first
 * watcher starts polling at once; listeners receive every later result,
 * and `latest` returns the current one. Polling stops when the last watcher
 * leaves. Listeners must not throw; a thrown error is logged and skipped.
 * @param ref - change request to poll.
 * @param listener - receives each polling result.
 * @returns the disposer that stops this watch.
 */
watch(ref: ChangeRequestRef, listener: ChangeRequestListener): () => void

/**
 * Poll a watched change request at once, including after a terminal state.
 * A fetch already in flight is followed immediately by another fetch; an
 * unwatched change request is unchanged.
 * @param ref - change request to poll.
 */
refresh(ref: ChangeRequestRef): void

/**
 * Read the latest polling result of a watched change request.
 * @param ref - change request to read.
 * @returns the latest result, or undefined before the first result or without a watch.
 */
latest(ref: ChangeRequestRef): ChangeRequestUpdate | undefined
```

Source: [`packages/experimental/forge/src/index.ts`](../../packages/experimental/forge/src/index.ts)

<a id="ctxforgepanel--forgepanelcontroller"></a>

### `ctx.forgePanel` — `ForgePanelController`

Serves the forge panel. Following a Session inspects the checkout of its current directory using the Session's permissions and execution world, recognizes the code host of the upstream remote or `origin`, probes sign-in for that host, and polls the Session's bound change requests through `ctx.forge` until the last follower of that Session leaves. A worktree request makes the panel create a branch and checkout through an optional `ctx.worktrees` and enter it while the Session's first message waits in the inbox, or at the first step proposal of a message no wait took. After a failed or stopped attempt the message keeps waiting for another attempt or for the request to be withdrawn. A message also waits while the worktree the Session works in is gone, until that worktree is checked out again or left for the source checkout. Changes to a Session's checkout run as Agent maintenance, so a message that arrives meanwhile waits for them.

```ts cordis-catalog
/**
 * Stream the panel state of a Session: the current state first, then each
 * later state. Intermediate states may be skipped when the reader is slower
 * than the updates. The stream ends when `signal` aborts or the Remote stops.
 * @param session - Session to follow.
 * @param signal - ends the stream.
 * @returns panel states in publication order.
 */
@Remote({ mode: 'stream' }) async *follow(session: Session, signal: AbortSignal): AsyncIterable<ForgePanelState>

/**
 * Stream the last known state of every change request that a listed
 * Session the caller may read binds: the stored states first, then each
 * state a poll changes or a new binding reveals. Listing reads no Session
 * log: loaded Sessions report their bindings, others the cached Session
 * summary, and a Session without one shows nothing until it is opened.
 * Closed requests are polled at the idle cadence so reopening is observed. The
 * stream ends when `signal` aborts or the Remote stops.
 * @param signal - ends the stream.
 * @returns frames in publication order.
 * @throws when the Host lacks the Session query, projection cache, storage, or Session store service.
 */
@Remote({ mode: 'stream' }) async *changeRequestStates(signal: AbortSignal): AsyncIterable<ForgeChangeRequestStatesFrame>

/**
 * Read or await the worktree service's archive cleanup of the Session's checkout.
 * @param session - Session whose cleanup is visible to the caller.
 * @param revision - null reads now; a matching revision waits for completion.
 * @returns the cleanup state, or null without a worktree service, an attempt, or a current revision.
 */
@Remote async worktreeCleanup(session: Session, revision: number | null): Promise<WorktreeCleanup | null>

/**
 * List the local branches that can start a worktree of the Session's current checkout.
 * @param session - Session whose current directory is listed.
 * @param signal - request cancellation.
 * @returns the checked-out branch and at most `maxBranches` local branches, the checked-out one first.
 * @throws when the current directory is not inside a checkout or Git fails.
 */
@Remote async branches(session: Session, signal: AbortSignal): Promise<ForgeBranches>

/**
 * List the branches the `branch` scope of the Session's current checkout can compare with.
 * @param session - Session whose checkout is read.
 * @param query - text the branch names must contain, ignoring case; empty for every branch.
 * @param signal - request cancellation.
 * @returns the automatic fork point and at most `maxBranches` remote-tracking and local branches each,
 * most recently committed first, without the checked-out branch.
 * @throws `forgePanel/not-a-checkout` outside a checkout; the Git error when Git fails or the listed refs exceed `maxDiffBytes`.
 */
@Remote async diffBases(session: Session, query: string, signal: AbortSignal): Promise<ForgeBaseBranches>

/**
 * Bind a change request to a Session by URL, or restore a dismissed binding.
 * @param session - Session that receives the binding.
 * @param url - web URL of the change request.
 * @param signal - request cancellation.
 * @throws `forgePanel/unrecognized-url` when no registered provider serves the URL.
 */
@Remote async track(session: Session, url: string, signal: AbortSignal): Promise<void>

/**
 * Hide a visible binding of a Session; other URLs leave the Session unchanged.
 * @param session - Session that owns the binding.
 * @param url - web URL of the change request.
 * @param signal - request cancellation.
 */
@Remote async dismiss(session: Session, url: string, signal: AbortSignal): Promise<void>

/**
 * Reinspect a followed Session's checkout, probe sign-in again, and poll its
 * change requests at once; an unfollowed Session is unchanged.
 * @param session - Session whose panel refreshes.
 * @param signal - request cancellation.
 * @returns settles once the inspection and the sign-in probe have ended; poll results reach the panel stream later.
 */
@Remote async refresh(session: Session, signal: AbortSignal): Promise<void>

/**
 * Read the changes one scope covers in the checkout of the Session's
 * current directory, with Git using the Session's sandbox policy.
 * @param session - Session whose checkout is read.
 * @param scope - which changes to read.
 * @param signal - request cancellation.
 * @returns the files, the base of the `branch` scope, and the untracked files left out.
 * @throws `forgePanel/not-a-checkout` outside a checkout; `forgePanel/base-missing` when the base branch
 * chosen for the `branch` scope does not exist; `forgePanel/no-fork-point` for the `branch` scope without
 * a fork point; `forgePanel/commits-missing` when chosen commits are not between the fork point and HEAD in order;
 * `forgePanel/commits-not-linear` when a chosen commit's first parent is not the commit listed before it;
 * `forgePanel/filter-config-failed` when filter configuration cannot be read completely, before
 * any comparison; `forgePanel/diff-too-large` over `maxDiffBytes`; the Git error when Git fails.
 */
@Remote async localDiff(session: Session, scope: ForgeLocalScope, signal: AbortSignal): Promise<ForgeLocalDiff>

/**
 * List the commits of the `branch` scope of the Session's current checkout, which the changes view can show one or
 * several of instead of the whole scope.
 * @param session - Session whose checkout is read.
 * @param base - the base ref of the `branch` scope, or null for its automatic fork point.
 * @param signal - request cancellation.
 * @returns the newest `maxCommits` commits between the fork point and HEAD, oldest first, and HEAD's commit.
 * @throws `forgePanel/not-a-checkout` outside a checkout; `forgePanel/base-missing` when the base branch does not
 * exist; `forgePanel/no-fork-point` without a fork point; the Git error when Git fails or the listing exceeds `maxDiffBytes`.
 */
@Remote async localCommits(session: Session, base: string | null, signal: AbortSignal): Promise<ForgeLocalCommits>

/**
 * Read the new side of one changed file in a scope, which supplies the
 * unchanged lines between its hunks: the index for `staged`, the last chosen commit for chosen commits of
 * the `branch` scope, else the working tree.
 * @param session - Session whose checkout is read.
 * @param scope - the scope the diff was read in.
 * @param path - path relative to the checkout's top-level directory, as the diff names it.
 * @param signal - request cancellation.
 * @returns the text.
 * @throws `forgePanel/not-a-checkout` outside a checkout; `forgePanel/diff-too-large` over `maxDiffBytes`;
 * `forgePanel/commits-missing` for a chosen commit that is not a full object name; an error for a path outside
 * the checkout, binary content, or a failed read.
 */
@Remote async localText(session: Session, scope: ForgeLocalScope, path: string, signal: AbortSignal): Promise<string>

/**
 * Load complete checks for the change request whose list the user opened.
 * @param session - Session retaining the visible binding.
 * @param url - binding URL.
 * @param headSha - commit displayed by the card; a different head rejects the result.
 * @param signal - cancellation when the list closes.
 * @returns the complete snapshot at the displayed head.
 * @throws `forgePanel/not-bound` for an invisible binding, `forgePanel/stale-head` for a moved head,
 * or `forgePanel/checks-failed` when the provider cannot complete the read.
 */
@Remote async changeRequestChecks(session: Session, url: string, headSha: string, signal: AbortSignal): Promise<ChangeRequestSnapshot>

/**
 * List the commits of a change request of a Session at its current head, which the changes view can show one or
 * several of instead of the whole change request.
 * @param session - Session the change request is bound to.
 * @param url - binding URL of the change request.
 * @param signal - request cancellation.
 * @returns the commits oldest first with the head they were read at, or null when the provider does not read commits.
 * @throws `forgePanel/not-bound` unless the URL is a visible binding of the Session that a provider serves;
 * `forgePanel/diff-failed` when the host does not list them.
 */
@Remote async changeRequestCommits(session: Session, url: string, signal: AbortSignal): Promise<ForgeCommitList | null>

/**
 * Read the changes of a change request of a Session as its code host
 * computes them, with each file's layer following the root `.gitattributes`
 * of the commit the diff ends at. Without `commits` the diff covers the change
 * request at the head commit of its latest status; a patch already read at the
 * same head commit and base branch is reused from memory with its attributes, for
 * any Session, until `maxCachedDiffBytes` evicts it. With `commits`, it covers those
 * commits, from the first one's first parent to the last, and is read every time.
 * @param session - Session the change request is bound to.
 * @param url - binding URL of the change request.
 * @param commits - consecutive commits of the change request, or null for all of it.
 * @param signal - request cancellation.
 * @returns the files, the commit they end at, each file's web page, and the commits the checkout has beyond the head.
 * @throws `forgePanel/not-bound` unless the URL is a visible binding of the Session that a provider serves;
 * `forgePanel/commits-missing` when chosen commits are not among the change request's commits in order;
 * `forgePanel/commits-not-linear` when a chosen commit's first parent is not the commit listed before it;
 * `forgePanel/stale-head` without `commits` when the head moved past the latest status, which is then polled again;
 * `forgePanel/diff-too-large` when the host or its provider refuses the diff over a size limit;
 * `forgePanel/diff-failed` before its status was read, for a first chosen commit without a parent, and when the host
 * does not provide the commits, the diff, or an existing `.gitattributes` otherwise.
 */
@Remote async changeRequestDiff( session: Session, url: string, commits: ForgeCommitRange | null, signal: AbortSignal, ): Promise<ForgeChangeRequestDiff>

/**
 * Read one file of a change request's repository at a commit, which
 * supplies the unchanged lines between the hunks of its diff.
 * @param session - Session the change request is bound to.
 * @param url - binding URL of the change request.
 * @param commit - commit object name, the head commit of the diff.
 * @param path - path relative to the repository root.
 * @param signal - request cancellation.
 * @returns the text.
 * @throws `forgePanel/not-bound` unless the URL is a visible binding of the Session that a provider serves;
 * `forgePanel/diff-too-large` when the host or its provider refuses the file over a size limit;
 * `forgePanel/diff-failed` when the host does not provide the file otherwise.
 */
@Remote async changeRequestText(session: Session, url: string, commit: string, path: string, signal: AbortSignal): Promise<string>

/**
 * Read the signed-in user's viewed marks on the files of a change request of a Session, which the host keeps for the
 * whole change request.
 * @param session - Session the change request is bound to.
 * @param url - binding URL of the change request.
 * @param headSha - head commit of the shown diff; marks read at another head are refused.
 * @param signal - request cancellation.
 * @returns the marks at `headSha`, or null when the provider keeps no viewed marks.
 * @throws `forgePanel/not-bound` unless the URL is a visible binding of the Session that a provider serves;
 * `forgePanel/stale-head` when the head moved past `headSha`, which is then polled again; `forgePanel/viewed-failed`
 * when the host does not provide the marks otherwise.
 */
@Remote async changeRequestViewed(session: Session, url: string, headSha: string, signal: AbortSignal): Promise<ForgeViewedFiles | null>

/**
 * Set or clear the signed-in user's viewed mark on one file of a change request of a Session.
 * @param session - Session the change request is bound to.
 * @param url - binding URL of the change request.
 * @param request - the file, its mark, and the head commit of the shown diff.
 * @param signal - request cancellation.
 * @throws `forgePanel/not-bound` unless the URL is a visible binding of the Session that a provider serves;
 * `forgePanel/stale-head` when the head moved past `request.headSha`; `forgePanel/action-failed` with the host's
 * reason when the host refuses, cannot be reached, or keeps no viewed marks; `forgePanel/action-unknown` when the host
 * did not confirm whether it saved the mark.
 */
@Remote async setFileViewed(session: Session, url: string, request: ForgeViewedRequest, signal: AbortSignal): Promise<void>

/**
 * Read the review threads of a change request of a Session at the head commit of its displayed diff. Threads read
 * at the same head commit and update time are reused from memory, for any Session, until they are
 * `reviewRefreshMs` old, `maxCachedReviewBytes` evicts them, or a review write through this panel drops them; a read
 * again after that age, or a `fresh` read, shows threads resolved elsewhere since, which do not change a GitHub pull
 * request's update time.
 * @param session - Session the change request is bound to.
 * @param url - binding URL of the change request.
 * @param headSha - head commit of the displayed diff.
 * @param fresh - whether to read from the host even when threads at this head and update time are kept, as after the
 * reader refreshes the view; the result replaces the kept threads.
 * @param signal - request cancellation.
 * @returns the threads at `headSha`, with `current` positions numbering the files of that diff.
 * @throws `forgePanel/not-bound` unless the URL is a visible binding of the Session that a provider serves;
 * `forgePanel/stale-head` when the latest status or the host names another head, which a host answer polls again;
 * `forgePanel/review-unsupported` when the provider cannot read reviews; `forgePanel/review-failed` before the
 * status was read and when the host does not provide the threads otherwise.
 */
@Remote async changeRequestReview(session: Session, url: string, headSha: string, fresh: boolean, signal: AbortSignal): Promise<ForgeReviewData>

/**
 * Publish a line comment or completed review for a visible Session binding. The threads kept for the change request
 * are dropped once the host answers, so the next read shows the comments.
 * @param session - Session retaining the change request.
 * @param url - visible binding URL.
 * @param request - reviewed head, ranges, plain text, and explicit review decision.
 * @param signal - request cancellation.
 * @returns confirmed publication or a typed failure; unknown outcomes require reconciliation on the host.
 */
@Remote async submitReview(session: Session, url: string, request: ForgeReviewRequest, signal: AbortSignal): Promise<ForgeReviewResult>

/**
 * Write to the review threads or the pending review of a change request of a Session while its head is still the
 * head the user saw. The threads kept for the change request are dropped once the host answers, so the next read
 * shows the write, which a resolve does not show through a GitHub pull request's update time.
 * @param session - Session the change request is bound to.
 * @param url - binding URL of the change request.
 * @param write - the write and the head commit of the threads the user saw.
 * @param signal - request cancellation.
 * @returns whether the host took the write; `stale` once the head moved, which polls the change request again, and
 * `unknown` when the outcome must be checked on the host before the write is tried again.
 * @throws `forgePanel/not-bound` unless the URL is a visible binding of the Session that a provider serves; an error
 * for a write without text, a head that is not a commit object name, or an invalid line range.
 */
@Remote async changeRequestReviewWrite( session: Session, url: string, write: ForgeReviewWrite, signal: AbortSignal, ): Promise<ForgeReviewWriteResult>

/**
 * Mark a draft change request of a Session ready for review; the change
 * request is polled again once the host answers.
 * @param session - Session the change request is bound to.
 * @param url - binding URL of the change request.
 * @param signal - request cancellation.
 * @throws `forgePanel/not-bound` unless the URL is a visible binding of the Session that a provider serves;
 * `forgePanel/action-failed` with the host's reason when the host refuses or cannot be reached.
 */
@Remote async markReady(session: Session, url: string, signal: AbortSignal): Promise<void>

/**
 * Merge a change request of a Session while its head is still `headSha`;
 * the change request is polled again once the host answers.
 * @param session - Session the change request is bound to.
 * @param url - binding URL of the change request.
 * @param method - how the commits enter the base branch.
 * @param headSha - head commit the user confirmed.
 * @param signal - request cancellation.
 * @throws `forgePanel/not-bound` unless the URL is a visible binding of the Session that a provider serves;
 * `forgePanel/stale-head` when the head moved past `headSha`; `forgePanel/action-failed` with the host's
 * reason when the host refuses otherwise or cannot be reached.
 */
@Remote async merge(session: Session, url: string, method: MergeMethod, headSha: string, signal: AbortSignal): Promise<void>

/**
 * Rerun the failed checks of a change request of a Session while its head is still the commit whose checks the user
 * saw; the change request is polled again once the host answers.
 * @param session - Session the change request is bound to.
 * @param url - binding URL of the change request.
 * @param request - the head commit whose checks the user saw.
 * @param signal - request cancellation.
 * @throws `forgePanel/not-bound` unless the URL is a visible binding of the Session that a provider serves;
 * `forgePanel/stale-head` when the head moved past `request.headSha`; `forgePanel/action-failed` with the host's
 * reason when the host refuses, cannot be reached, or reruns no checks; `forgePanel/action-unknown` when the host did
 * not confirm whether it started the rerun.
 */
@Remote async rerunChecks(session: Session, url: string, request: ForgeRerunRequest, signal: AbortSignal): Promise<void>

/**
 * Request reviews of a change request of a Session from more reviewers; the change request is polled again once the
 * host answers.
 * @param session - Session the change request is bound to.
 * @param url - binding URL of the change request.
 * @param reviewers - the reviewers to ask, by kind and login.
 * @param signal - request cancellation.
 * @throws `forgePanel/not-bound` unless the URL is a visible binding of the Session that a provider serves;
 * `forgePanel/action-failed` with the host's reason when the host refuses, cannot be reached, or requests no reviews;
 * `forgePanel/action-unknown` when the host did not confirm whether it requested the reviews.
 */
@Remote async requestReviews( session: Session, url: string, reviewers: readonly Pick<ChangeRequestReviewer, 'kind' | 'login'>[], signal: AbortSignal, ): Promise<void>

/**
 * List accounts a review of a change request of a Session can be requested from.
 * @param session - Session the change request is bound to.
 * @param url - binding URL of the change request.
 * @param query - text the login or name contains; empty for the host's suggestions and first accounts.
 * @param signal - request cancellation.
 * @returns the accounts, the host's suggestions first.
 * @throws `forgePanel/not-bound` unless the URL is a visible binding of the Session that a provider serves;
 * `forgePanel/reviewers-failed` when the host does not list them.
 */
@Remote async reviewerCandidates(session: Session, url: string, query: string, signal: AbortSignal): Promise<readonly ForgeReviewerCandidate[]>

/**
 * Bring the base branch's new commits into the head branch of a change request of a Session while its head is still
 * `headSha`; the change request is polled again once the host answers.
 * @param session - Session the change request is bound to.
 * @param url - binding URL of the change request.
 * @param method - merge commit or rebase.
 * @param headSha - head commit the user confirmed.
 * @param signal - request cancellation.
 * @throws `forgePanel/not-bound` unless the URL is a visible binding of the Session that a provider serves;
 * `forgePanel/stale-head` when the head moved past `headSha`; `forgePanel/action-failed` with the host's reason when
 * the host refuses, cannot be reached, or updates no branches; `forgePanel/action-unknown` when the host did not
 * confirm whether it started the update.
 */
@Remote async updateBranch(session: Session, url: string, method: BranchUpdateMethod, headSha: string, signal: AbortSignal): Promise<void>

/**
 * Ask for a new worktree before the Session's first turn, replacing an open
 * request and forgetting a failed attempt. While the next message waits in
 * the inbox, or else at the first step proposal, the panel creates a branch
 * from `from`, or from HEAD of the current checkout when it is null, and
 * enters its checkout. A message that already waits after a failed or
 * stopped attempt keeps waiting for {@link ForgePanelController.retryWorktree}.
 * @param session - Session without a started turn.
 * @param from - local base branch, or null for HEAD.
 * @param signal - request cancellation.
 * @throws `forgePanel/invalid-branch` when `from` is empty; `forgePanel/worktrees-unavailable`
 * without a worktree service; `forgePanel/session-started` after a turn started or the worktree was
 * created; `forgePanel/session-busy` while the worktree is being created.
 */
@Remote async requestWorktree(session: Session, from: string | null, signal: AbortSignal): Promise<void>

/**
 * Withdraw the open worktree request of a Session with its failed attempt,
 * which lets a waiting message go on in the current checkout; without a
 * request the Session is unchanged. Withdrawing needs no worktree service.
 * @param session - Session without a started turn.
 * @param signal - request cancellation.
 * @throws `forgePanel/session-started` after a turn started or the worktree was created;
 * `forgePanel/session-busy` while the worktree is being created.
 */
@Remote async cancelWorktree(session: Session, signal: AbortSignal): Promise<void>

/**
 * Stop the creation a message of the Session waits for; the message keeps
 * waiting with the request still open. Without such a creation the Session
 * is unchanged.
 * @param session - Session whose creation stops.
 * @param signal - request cancellation.
 */
@Remote async stopCreation(session: Session, signal: AbortSignal): Promise<void>

/**
 * Make another attempt, with a new branch name, at the worktree a message
 * of the Session waits for after a failed or stopped attempt.
 * @param session - Session whose message waits.
 * @param signal - request cancellation.
 * @throws `forgePanel/not-waiting` when no message waits or an attempt is running.
 */
@Remote async retryWorktree(session: Session, signal: AbortSignal): Promise<void>

/**
 * Check out the created worktree of a Session again at its recorded
 * directory when that directory is gone: its branch when the branch still
 * exists, otherwise a new branch of the same name at the base commit. Changes
 * that were never committed are not recovered. Runs as Agent maintenance,
 * inside the wait of a message that waits for the restoration, which then
 * goes on; without a missing directory the Session is unchanged.
 * @param session - Session whose worktree directory is gone.
 * @param signal - request cancellation, which aborts the restoration.
 * @throws `forgePanel/no-worktree` without a created worktree; `forgePanel/worktrees-unavailable`
 * without a worktree service; `forgePanel/session-busy` while the Session's Agent is not loaded or
 * has other work; `forgePanel/restore-failed` when Git fails.
 */
@Remote async restoreWorktree(session: Session, signal: AbortSignal): Promise<void>

/**
 * Move a Session from its created worktree to the source checkout the
 * worktree came from; the Session no longer works in the worktree. Runs as
 * Agent maintenance, inside the wait of a message that waits for the removed
 * worktree, which then goes on.
 * @param session - Session with a created worktree.
 * @param signal - request cancellation.
 * @throws `forgePanel/no-worktree` without a created worktree; `forgePanel/session-busy` while the
 * Session's Agent is not loaded or has other work; the working-directory service's error when the
 * source checkout no longer exists.
 */
@Remote async continueInProject(session: Session, signal: AbortSignal): Promise<void>
```

Types: [Session](session.zh.md)

Source: [`packages/experimental/client-ui-forge/src/index.ts`](../../packages/experimental/client-ui-forge/src/index.ts)

<a id="ctxforgesession--forgesessionservice"></a>

### `ctx.forgeSession` — `ForgeSessionService`

Session-scoped change request bindings. The `forgeChangeRequests` projection derives them from `gh pr create`, `gh pr view`, `gh pr edit`, `gh pr checkout`, and `git push` results and from `plugin:forge-session/binding` records. After each push result, and when a caller reports the branch a Session works on, the service looks up open change requests whose head is that branch and records the unbound ones as discovered. Watching a Session polls its visible change requests through `ctx.forge`.

```ts cordis-catalog
/**
 * List the change requests bound to a Session and not dismissed.
 * @param session - Session whose bindings are read.
 * @returns visible bindings in first-recorded order, each with its latest polling result.
 */
changeRequests(session: Session): SessionChangeRequest[]

/**
 * Bind a change request to a Session by URL, or restore a dismissed binding.
 * Appends a `track` record with the provider's canonical URL unless the
 * change request is already visible.
 * @param session - Session that receives the binding.
 * @param url - web URL of the change request.
 * @throws when no registered provider recognizes the URL.
 */
track(session: Session, url: string): void

/**
 * Look up open change requests whose head is a branch the Session works on,
 * and record the unbound ones as discovered, as after a push of that branch.
 * A remote that no provider recognizes changes nothing; a failed lookup is
 * logged and changes nothing.
 * @param session - Session that receives the bindings.
 * @param remote - URL of the remote that holds the branch.
 * @param branch - branch name on that remote.
 * @returns resolves once the lookup has recorded its bindings or failed.
 */
discoverBranch(session: Session, remote: string, branch: string): Promise<void>

/**
 * Hide a visible binding. Appends a `dismiss` record; a URL that is not
 * visibly bound leaves the log unchanged. Discovery never restores a
 * dismissed binding; `track` does.
 * @param session - Session that owns the binding.
 * @param url - web URL of the change request.
 */
dismiss(session: Session, url: string): void

/**
 * Watch a Session's visible change requests as an effect on the calling
 * fiber. Every visible change request that a provider recognizes is polled
 * through `ctx.forge` while the Session has a watcher. Listeners receive the
 * complete list after each later binding or provider change, or polling result; read the
 * current list with {@link changeRequests}. Listeners must not throw; a
 * thrown error is logged and skipped.
 * @param session - Session to watch.
 * @param listener - receives the complete visible list.
 * @returns the disposer that stops this watch.
 */
watch(session: Session, listener: SessionChangeRequestsListener): () => void
```

Types: [Session](session.zh.md)

Source: [`packages/experimental/forge-session/src/index.ts`](../../packages/experimental/forge-session/src/index.ts)

<a id="ctxworktrees--worktreeservice"></a>

### `ctx.worktrees` — `WorktreeService`

Creates retained Git worktrees under the mounted filesystem and sandbox providers, records each creation in the Session log, and reclaims a clean, unreferenced checkout when the Session that created it is archived.

```ts cordis-catalog
/**
 * Create a fresh branch and checkout at a pinned local revision, then enter it.
 * Existing branches or checkout paths fail. Uncommitted files stay in the source checkout.
 * Checkout disables configured clean, smudge, and process filters without changing Git config.
 * Repository-local replacement refs still apply; baseCommit reports the resolved object name.
 * The new checkout becomes current only after Git setup succeeds. Failures may retain newly
 * allocated Git/filesystem artifacts; no branch or checkout is removed automatically.
 * @param agent - caller whose current directory selects the source repository and file policy.
 * @param request - optional new name and local revision; defaults are generated name and HEAD.
 * @param signal - cancellation of lookup, creation, and working-directory publication.
 * @param onPhase - receives each stage before it begins; it must not throw.
 * @returns canonical checkout path, branch name, pinned commit, and source repository root.
 */
async create( agent: Agent, request: CreateWorktreeRequest = {}, signal?: AbortSignal, onPhase?: (phase: CreateWorktreePhase) => void, ): Promise<CreatedWorktree>

/**
 * Check out a removed worktree again at its recorded directory: its branch
 * when the branch still exists, otherwise a new branch of the same name at
 * `baseCommit`. Only the missing target's unlocked registration is removed, and an
 * existing directory fails. Changes that were never committed are not
 * recovered. Checkout disables configured clean, smudge, and process filters,
 * as creation does. The calling Session's working directory does not change.
 * Failures may retain newly allocated Git/filesystem artifacts.
 * @param agent - caller whose sandbox policy confines the commands.
 * @param request - recorded directory, branch, base commit, and source repository root.
 * @param signal - cancellation of the restoration.
 * @param onPhase - receives each stage before it begins; it must not throw.
 * @returns the directory and whether the branch was created again.
 */
async restore( agent: Agent, request: RestoreWorktreeRequest, signal?: AbortSignal, onPhase?: (phase: CreateWorktreePhase) => void, ): Promise<RestoredWorktree>

/**
 * Read the archive cleanup of a Session's created checkout; waiting never
 * starts one. Absent without the Workspace and query providers.
 * @param session - archived Session whose cleanup is read.
 * @param revision - null reads at once; a matching revision waits for that attempt to settle.
 * @returns the attempt state, or null when none exists, the revision was superseded, or the service is stopping.
 */
async cleanupOf(session: Session, revision: number | null): Promise<WorktreeCleanup | null>
```

Types: [Agent](core.zh.md) · [Session](session.zh.md)

Source: [`packages/experimental/worktree/src/index.ts`](../../packages/experimental/worktree/src/index.ts)

<a id="forge-events"></a>

### `forge/*` events

<a id="forgeproviders-changed--parallel"></a>

#### `forge/providers-changed` — parallel

Announces a provider registration or withdrawal after the registry changes. Listener failures are logged without preventing other listeners from running.

```ts cordis-catalog
/**
 * Announces a provider registration or withdrawal after the registry changes.
 * Listener failures are logged without preventing other listeners from running.
 * @param forge - family whose provider changed.
 * @mode parallel
 */
'forge/providers-changed'(forge: string): void | Promise<void>
```

Source: [`packages/experimental/forge/src/index.ts`](../../packages/experimental/forge/src/index.ts)

<a id="worktree-events"></a>

### `worktree/*` events

<a id="worktreecleanup--emit"></a>

#### `worktree/cleanup` — emit

A cleanup attempt changed state. Fires once at admission with `scheduled` and once at settlement with the final status.

```ts cordis-catalog
/**
 * A cleanup attempt changed state. Fires once at admission with
 * `scheduled` and once at settlement with the final status.
 * @param info - the archived Session, the checkout, and the attempt state.
 * @mode emit
 */
'worktree/cleanup'(info: { sessionId: SessionId; path: string; cleanup: WorktreeCleanup }): void
```

Types: [SessionId](core.zh.md)

Source: [`packages/experimental/worktree/src/archive.ts`](../../packages/experimental/worktree/src/archive.ts)
<!-- END GENERATED cordis-surface -->
