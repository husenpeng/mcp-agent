/** Explicit exceptions and Host packages for the published dependency policy. */

/** Vendored framework and native packages that publish on their own version line, so dependents use `workspace:~`. */
export const INDEPENDENT_RELEASE_PACKAGE = new RegExp('^@tomato/(?:cordis$|cordis-plugin-'
  + '(?:group|hmr|include|loader|logger-console|timer)$|cosmokit$|schemastery$|node-addon-system(?:-|$))')

/** Packages treated as Client/Host packages without declaring `tomato.client`. */
const CLIENT_FACE_INCLUDE: readonly string[] = []

/** Packages exempted from automatic Client/Host treatment despite declaring `tomato.client`. */
const CLIENT_FACE_EXCLUDE: readonly string[] = [
  '@tomato/api-session-controller',
  '@tomato/api-workspace-controller',
]

/** Host-only packages whose peer relays are deliberately flattened. */
const HOST_DEPENDENCY_PACKAGES: readonly string[] = [
  '@tomato/llm',
  '@tomato/session',
]

/** Required Cordis services whose Host imports are type-only. */
const REQUIRED_SERVICE_PEERS = {
  '@tomato/api-terminal-controller': ['@tomato/subprocess'],
} as const satisfies Readonly<Record<string, readonly string[]>>

/** Development-only package relationships not represented by source imports. */
const CONFIGURATION_ONLY_DEV_DEPENDENCIES = {
  '@tomato/client-locale': ['@tomato/api-remotes'],
  '@tomato/client-ui-conversation': [
    '@tomato/api-remotes',
    '@tomato/client-ui-workspace',
  ],
  '@tomato/client-ui-model-selection': ['@tomato/client-ui-input-trigger'],
  '@tomato/client-ui-sidebar': ['@tomato/client-ui-workspace'],
  '@tomato/client-ui-subagent': ['@tomato/client-ui-input-trigger'],
  '@tomato/client-ui-theme': ['@tomato/api-remotes'],
  '@tomato/client-ui-tool': ['@tomato/api-remotes'],
} as const satisfies Readonly<Record<string, readonly string[]>>

/** Workspace packages whose complete runtime surface is safe across duplicate installations. */
const DUPLICATE_SAFE_PACKAGES: readonly string[] = [
  '@tomato/branded',
  '@tomato/lazy-require',
  '@tomato/typert-protocol',
  '@tomato/util-code-language',
  '@tomato/util-crypto',
  '@tomato/util-values',
]

/**
 * Runtime exports whose values remain valid when npm installs another package copy.
 * New entries are forbidden by default. Automated agents must not add an
 * exception; every addition requires explicit human review and a dedicated,
 * prominent heading in the pull request description.
 */
const SAFE_HOST_DEPENDENCY_EXPORTS = {
  '@tomato/atomic-write': ['withFileLock', 'writeFileAtomic'],
  '@tomato/computer-use/brand': ['ComputerUseProviderName'],
  '@tomato/credentials': ['credentialKey'],
  '@tomato/deque': ['Deque'],
  '@tomato/experimental-embeddings-http': ['probeEmbeddingsEndpoint'],
  '@tomato/llm': ['callConfigEquals'],
  '@tomato/session': ['SessionId'],
  '@tomato/session-format': ['sessionFormatLogFilename'],
  '@tomato/storage-domain': ['defineDomain'],
  '@tomato/timeout': ['MAX_TIMER_DELAY_MS'],
  // Both operate only on the caller's subprocess service and handle; the module memoizes only the binary path.
  '@tomato/util-ripgrep': ['readRipgrepLines', 'spawnRipgrep'],
  '@tomato/schemastery': ['default'],
} as const satisfies HostDependencyExports

/** Runtime exports that require every consumer to resolve the provider's shared peer instance. */
const PEER_REQUIRED_HOST_EXPORTS = {
  // Profile settings must match the installed Node provider's configuration schema.
  '@tomato/ptc-runtime-node/configuration': ['resolvePersistentExecution'],
  // CUA mounts the installed provider and shares executor error classes with PTC.
  '@tomato/ptc-runtime-node': ['default'],
  '@tomato/tool-executor-ptc/run-code': ['RunCodeConfig', 'createRunCodeTool'],
  // CUA checks UserQuestionError and preserves AttachmentError from image admission.
  '@tomato/attachment': ['admitEncodedImages'],
  '@tomato/user-questions': ['UserQuestionError'],
  // The tool registry and every subclass rely on `instanceof` against one HarnessError class.
  '@tomato/error': ['HarnessError'],
  // `instanceof` checks need the translator's own class instance.
  '@tomato/experimental-translator': ['TranslationError'],
  // Stateless; a safe classification would turn the forge panel's forge and worktree peers into dependencies.
  '@tomato/experimental-forge': ['changeRequestKey'],
  '@tomato/experimental-worktree': ['generatedWorktreeName', 'CREATED_RECORD', 'createdWorktreeSchema'],
  // The forge panel matches ctx.fs failures with `instanceof FsError`.
  '@tomato/fs': ['FsError'],
  '@tomato/scope': ['carrierKeyOf', 'createScope', 'scopeOf', 'scopeTarget'],
  // appendPluginRecord writes through the Session class's private log; pluginRecordOf is stateless.
  '@tomato/session': ['SESSION_FORMAT_VERSION', 'appendPluginRecord', 'pluginRecordOf'],
  '@tomato/session-persistence': ['SessionPersistenceNotFoundError'],
  // Readers recognize a deadline's TimeoutReason only by `instanceof` against their own copy.
  '@tomato/timeout': ['deadline'],
} as const satisfies HostDependencyExports

/** Exact import specifier to reviewed runtime exports. */
type HostDependencyExports = Readonly<Record<string, readonly string[]>>

/** Complete configurable input to package dependency classification. */
export interface PackageDependencyPolicy {
  readonly clientFaceInclude: readonly string[]
  readonly clientFaceExclude: readonly string[]
  readonly hostPackages: readonly string[]
  readonly requiredServicePeers?: Readonly<Record<string, readonly string[]>>
  readonly configurationOnlyDevDependencies: Readonly<Record<string, readonly string[]>>
  readonly duplicateSafePackages?: readonly string[]
  readonly safeHostDependencyExports: HostDependencyExports
  readonly peerRequiredHostExports: HostDependencyExports
}

/** Repository dependency policy consumed by verification and benchmarking. */
export const PACKAGE_DEPENDENCY_POLICY: PackageDependencyPolicy = {
  clientFaceInclude: CLIENT_FACE_INCLUDE,
  clientFaceExclude: CLIENT_FACE_EXCLUDE,
  hostPackages: HOST_DEPENDENCY_PACKAGES,
  requiredServicePeers: REQUIRED_SERVICE_PEERS,
  configurationOnlyDevDependencies: CONFIGURATION_ONLY_DEV_DEPENDENCIES,
  duplicateSafePackages: DUPLICATE_SAFE_PACKAGES,
  safeHostDependencyExports: SAFE_HOST_DEPENDENCY_EXPORTS,
  peerRequiredHostExports: PEER_REQUIRED_HOST_EXPORTS,
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Whether a package manifest declares a dynamically loaded Client entry. */
export function hasClientDeclaration(tomatoField: unknown): boolean {
  return isRecord(tomatoField) && Object.hasOwn(tomatoField, 'client')
}
