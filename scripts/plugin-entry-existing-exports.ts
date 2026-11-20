/**
 * Value exports that plugin entries already had when verify-plugin-entry-exports started enforcing the plugin entry
 * rule in docs/defensive-patterns/package-surface.md. Each line records existing debt, not an approved exception. The
 * gate passes a listed export and fails a line when its package has no plugin entry, when its export list is empty or
 * repeats a name, or when it names an export the entry no longer reports, so removing an export removes its line in
 * the same change. A line added after the gate's introduction is an exception under the rule, and the rule requires
 * the domain owner's confirmation for it.
 */
export const EXISTING_PLUGIN_ENTRY_EXPORTS = {
  '@tomato/acp-app': ['ACP_APP_STARTUP_SERVICE'],
  '@tomato/action-cards': ['Config', 'isPluginStopping'],
  '@tomato/agent': [
    'AgentModel', 'agentCarrier', 'agentEvents', 'assembleContextFor', 'emitAgentEvent', 'foldConsumedWork',
    'installModelSelection', 'modelSelectionProjectionDefinition',
  ],
  '@tomato/agent-instructions': [
    'discoverBaselineInstructionFiles', 'loadBaselineInstructions', 'renderAgentInstructions',
  ],
  '@tomato/agent-loop': ['CONFIGURED_AGENT_IDENTITIES_KEY', 'DEFAULT_MAX_PARALLEL_TOOL_CALLS'],
  '@tomato/agent-preset-registry': [
    'agentPresetProjectionDefinition', 'auditRows', 'entryListProblem', 'leakedServices',
  ],
  '@tomato/agent-team': ['TeamId', 'TeamMessageId', 'TeamTaskId'],
  '@tomato/api-remote-access': ['REMOTE_ACCESS_SNAPSHOT_KEY'],
  '@tomato/api-remotes': ['API_REMOTE_FORWARDED_EVENTS'],
  '@tomato/attachment-local': [
    'DEFAULT_IMAGE_COMPRESSION_CONCURRENCY', 'DEFAULT_MAX_IMAGES_PER_MESSAGE', 'DEFAULT_MAX_IMAGE_BYTES',
    'DEFAULT_MAX_IMAGE_DIMENSION', 'DEFAULT_MAX_IMAGE_PIXELS', 'DEFAULT_MAX_MESSAGE_IMAGE_BYTES',
    'DEFAULT_NORMALIZED_IMAGE_MAX_BYTES', 'DEFAULT_NORMALIZED_IMAGE_MAX_DIMENSION',
    'DEFAULT_NORMALIZED_IMAGE_MAX_PIXELS', 'MAX_IMAGE_COMPRESSION_CONCURRENCY', 'canPassThroughNormalization',
    'commitPreparedImageFile', 'normalizeImage', 'prepareImageFile', 'readImageFile', 'readRequestImageFile',
    'requestImageVariantId', 'saveImageFile', 'validateImageFile',
  ],
  '@tomato/bash-local': ['ENV_OVERRIDES', 'assertServiceableBashConfig'],
  '@tomato/client-connection': [
    'API_PATH', 'CONNECT_PATH', 'Peer', 'RpcId', 'clientRequestSchema', 'rpcErrorSchema', 'rpcIdSchema',
    'rpcMessageSchema', 'rpcResultSchema', 'serverResponseSchema', 'transportError',
  ],
  '@tomato/client-hmr': ['EVENTS_ENDPOINT'],
  '@tomato/client-locale': ['LOCALE_IDS', 'LOCALE_PREFERENCE_FIELD', 'LOCALE_SETTINGS_NAMESPACE'],
  '@tomato/client-modules': ['bootInjections', 'orderByModuleGraph', 'stripClientSuffix'],
  '@tomato/client-ui-chat': [
    'CHAT_SETTINGS_NAMESPACE', 'DEFAULT_TRANSCRIPT_VIEW_MODE', 'LEGACY_EXPANDED_TRANSCRIPT_VIEW_MODE',
    'LEGACY_TRANSCRIPT_VIEW_MODE', 'TRANSCRIPT_VIEW_FIELD', 'TRANSCRIPT_VIEW_MODES',
  ],
  '@tomato/client-ui-conversation': [
    'BUSY_ENTER_BEHAVIORS', 'BUSY_ENTER_FIELD', 'CONVERSATION_SETTINGS_NAMESPACE', 'DEFAULT_BUSY_ENTER_BEHAVIOR',
  ],
  '@tomato/client-ui-theme': [
    'DEFAULT_FONT_SIZE', 'DEFAULT_PREFERENCE', 'FONT_SIZE_FIELD', 'FONT_SIZE_MAX', 'FONT_SIZE_MIN', 'THEME_PREFERENCES',
    'THEME_PREFERENCE_FIELD', 'THEME_SETTINGS_NAMESPACE',
  ],
  '@tomato/command-feedback': ['FEEDBACK_CATEGORIES', 'recordFeedback'],
  '@tomato/commands': ['CommandDefinitionId', 'CommandId', 'name', 'parseCommand'],
  '@tomato/compaction-tool-result-pruner': ['DEFAULTS', 'PRUNE_MARKER', 'codePointLength', 'resolveConfig'],
  '@tomato/cordis-host-runner': [
    'ApprovalRequestId', 'CordisDynamicPackageId', 'CordisDynamicPluginId', 'CordisDynamicPluginRunId',
  ],
  '@tomato/credentials-local': [
    'CREDENTIALS_FILENAME', 'DOCUMENT_VERSION', 'parseCredentialsDocument', 'renderFlatLayoutMigration', 'resolveSpec',
  ],
  '@tomato/cua': ['CuaConfig', 'installCua'],
  '@tomato/experimental-claude-code-mods': [
    'DEFAULT_TOOL_ALIASES', 'KNOWN_EVENTS', 'MODS_API_VERSION', 'SERVED_EVENTS', 'defineMod',
  ],
  '@tomato/experimental-cua-macos': ['GUIDANCE'],
  '@tomato/experimental-forge': ['changeRequestKey'],
  '@tomato/experimental-inspector': ['resolveInspectorOptions', 'startInspector'],
  '@tomato/experimental-ptc-runtime-python': [
    'checkDoneValue', 'detachResidual', 'encodeJsonPlain', 'hasNonLosslessNumber', 'hasUnsafeIntegerToken',
    'hostFrameParseCeiling', 'logTruncationMarker', 'readProcessStart', 'resolvePythonBin', 'validateChildFrame',
  ],
  '@tomato/experimental-worktree': [
    'CREATED_RECORD', 'createdWorktreeSchema', 'generatedWorktreeName', 'worktreeProjection',
  ],
  '@tomato/goal': [
    'GOAL_CHANGE_VERSION', 'GoalId', 'applyGoalProjection', 'decodeGoalChange', 'foldGoal', 'goalChangeRef',
    'goalProjectionDefinition',
  ],
  '@tomato/goal-round-driver': ['renderGoalRoundPrompt'],
  '@tomato/host-directory-picker-auto': [
    'BACKEND_PACKAGES', 'SURFACE_PACKAGES', 'canExecute', 'hasLinuxChooserBinary', 'resolveDirectoryPickerBackend',
  ],
  '@tomato/host-directory-picker-browse': ['boundedInsert', 'fullyQualified', 'raceAbort'],
  '@tomato/host-directory-picker-native': ['pickNativeDirectory'],
  '@tomato/host-plugin-inventory': ['pluginEntryId', 'readPluginInventory'],
  '@tomato/host-product-telemetry-otel': ['Config'],
  '@tomato/host-webserver': [
    'bindUrlHost', 'isLoopbackHost', 'isWildcardHost', 'normalizeBindAddress', 'renderIndexInjections',
  ],
  '@tomato/jobs-local': ['TASK_WAIT_TIMEOUT'],
  '@tomato/llm': [
    'ACCOUNT_QUOTA_EXCEEDED_CODE', 'APP_IDENTITY', 'AssistantStreamAccumulator', 'BlockAssembler',
    'CONTEXT_SUMMARY_MAX_CHARS', 'CONTEXT_WINDOW_EXCEEDED_CODE', 'EMPTY_RESPONSE_CODE', 'IMAGE_OFFLOAD_REQUIRED_CODE',
    'INVALID_CREDENTIAL_CODE', 'LLM_FAILURE_CODES', 'LlmAdapter', 'LlmAttemptId', 'MessageId', 'ProviderRequestId',
    'QUOTA_EXCEEDED_CODE', 'RETRY_CODE_CHOICES', 'ReasoningEffortId', 'RetryPolicySchema', 'ToolCallId',
    'assembleAssistantStream', 'assertUsableApiKey', 'assistantStreamChunks', 'assistantStreamFirstTokenTime',
    'assistantStreamHasVisibleContent', 'assistantStreamHasVisibleText', 'attributionHeaders', 'boundContextSummary',
    'callConfigEquals', 'chunkHasVisibleText', 'contentHasFile', 'contentHasImage', 'createAssistantMessage',
    'createDeveloperMessage', 'createMessage', 'createSystemMessage', 'createToolResultMessage', 'createUserMessage',
    'errorChain', 'expandAssistantStream', 'fileHandleText', 'freezeMessage', 'isAgentLoopRequest',
    'isContextWindowExceededError', 'isHarnessError', 'isQuotaExceededError', 'isTokenDelta', 'isVisibleChunk',
    'joinAssistantStreamText', 'lastAssistantStreamChunk', 'markAgentLoopRequest', 'normalizeApiKey',
    'offloadedImageText', 'projectFilesToText', 'projectImagesForTextModel', 'projectOffloadedImages',
    'projectToolUpdates', 'requestImageHandleText', 'requiredImageOffload', 'resolveImageAttachmentAccess',
    'resolveRetryPolicy', 'runFirstTokenTime', 'runFirstVisibleTime', 'textOnlyImageText', 'userAgent',
  ],
  '@tomato/llm-deepseek-api-key': ['plainOptions', 'resolveAdapterOptions'],
  '@tomato/llm-pi-ai': ['PiAiAdapter', 'supportedProtocols'],
  '@tomato/llm-replay': [
    'deriveReplayScript', 'installLlmReplay', 'loadReplayScript', 'loadSessionScripts', 'parseSessionHeader',
    'parseSessionLog', 'prepareSessionSnapshotFixtureForComparison', 'resolveScriptedEntry',
  ],
  '@tomato/llm-retry': ['RetryId'],
  '@tomato/lsp': ['LspProviderId', 'finalExtension'],
  '@tomato/mcp-client': [
    'ReconnectSchema', 'SERVER_NAME_PATTERN', 'assertTemplateSyntax', 'connectionStatusOf', 'createMcpToolDefinition',
    'probeServer', 'resolveReconnectPolicy',
  ],
  '@tomato/office-kit': ['Config', 'OfficeKitGeneration', 'OfficeKitKey', 'OfficeSourceKey'],
  '@tomato/permission-presets': ['AUTO_PRESET', 'CUSTOM_PRESET'],
  '@tomato/persona': ['PERSONA_PREFIX_SECTION', 'PERSONA_SUFFIX_SECTION'],
  '@tomato/plan-mode': ['EXIT_PLAN_MODE', 'planProjectionDefinition', 'resolveConfig'],
  '@tomato/plugin-manager': ['classifyInstallFailure', 'parseInstallSpec', 'pinnedGitOrigin'],
  '@tomato/pwsh-local': [
    'ENCODING_PREAMBLE', 'ENV_OVERRIDES', 'assertServiceablePwshConfig', 'candidatePwshPaths', 'resolvePwshPath',
  ],
  '@tomato/sandbox-policy': ['SANDBOX_MODES', 'setSandboxMode'],
  '@tomato/schedule': [
    'DEFAULT_LIST_LIMIT', 'MAX_LIST_LIMIT', 'MAX_TITLE_LENGTH', 'MIN_EVERY_INTERVAL_SECONDS', 'REQUIRED_TITLE_MESSAGE',
    'ScheduleId', 'canonicalizeCronExpression', 'createAfterScheduleRecord', 'createAtScheduleRecord',
    'createCronScheduleRecord', 'createDailyScheduleRecord', 'createEveryScheduleRecord', 'createWeeklyScheduleRecord',
    'decodeScheduleRecord', 'formatScheduleLocalTime', 'isRecurringScheduleRecord', 'normalizeWeekdays',
    'parseCronInput', 'parseWeeklyInput', 'renderRecurringReminderBatchFraming', 'renderReminderFraming',
    'resolveCronOccurrence', 'resolveDailyOccurrence', 'resolveEveryOccurrence', 'resolveRecurringOccurrence',
    'resolveWeeklyOccurrence', 'scheduleDomain', 'scheduleTitle', 'weeklyTime',
  ],
  '@tomato/sdk-app': ['SDK_APP_STARTUP_SERVICE'],
  '@tomato/sdk-jsonrpc-server': ['HarnessSdkJsonRpcServer'],
  '@tomato/session': [
    'KNOWN_SESSION_EVENT_TYPES', 'SESSION_FORMAT_VERSION', 'Session', 'SessionId', 'SessionLogOffset',
    'SessionPreparation', 'SessionSeq', 'TOOL_NOT_STARTED', 'TOOL_OUTCOME_UNKNOWN', 'ToolCallRecovery',
    'adoptSessionEvent', 'appendPluginRecord', 'buildForkSeed', 'canonicalHeader', 'decodeSeqRanges',
    'deriveEventMessage', 'encodeSeqRanges', 'foldRequestHeader', 'foldSurface', 'headerEquals',
    'interruptedTurnClosers', 'isAppendSurfaceEvent', 'isReplacementSurfaceEvent', 'isSurfaceEligibleType',
    'isSurfaceEvent', 'pluginRecordOf', 'snapshotSessionEvent',
  ],
  '@tomato/session-log-deepseek': ['acceptedThrough'],
  '@tomato/session-log-export': [
    'DEFAULT_SESSION_LOG_COMPRESSION_LEVEL', 'SESSION_LOG_EXPORT_PATH', 'SESSION_LOG_FILENAME', 'flushLiveSessionLog',
    'formatSessionMarkdown', 'readSessionLogText', 'serializeSessionLog', 'sessionLogExportDeps',
    'sessionLogZipEntries', 'sessionLogZipFilename', 'streamSessionLogZip',
  ],
  '@tomato/session-persistence-jsonl': ['JsonlCompressionSchema'],
  '@tomato/session-projection-cache': [
    'Config', 'checkpointIdentity', 'checkpointRecord', 'checkpointRow', 'projectionCacheDomainSpec',
  ],
  '@tomato/session-query-sqlite': [
    'SESSION_QUERY_SQLITE_APPLICATION_ID', 'SESSION_QUERY_SQLITE_DEFAULT_LIMIT', 'SESSION_QUERY_SQLITE_MAX_LIMIT',
    'SESSION_QUERY_SQLITE_PATH_KEY', 'SESSION_QUERY_SQLITE_SCHEMA_VERSION', 'SESSION_QUERY_SQLITE_SNIPPET_CHARS',
  ],
  '@tomato/session-reference': [
    'DEFAULT_CANDIDATE_LIMIT', 'DEFAULT_MAX_REFERENCE_BYTES', 'MAX_REFERENCES', 'SESSION_REFERENCE_SCHEME',
    'decodeSessionReferenceUri', 'encodeSessionReferenceUri', 'formatSessionReferenceMention',
    'parseSessionReferenceText',
  ],
  '@tomato/session-telemetry-otel': [
    'Config', 'DEFAULT_SHUTDOWN_TIMEOUT_MILLIS', 'DEFAULT_TELEMETRY_MODE', 'SessionTelemetryMode',
  ],
  '@tomato/session-title': [
    'SessionTitleProviderId', 'fallbackSessionTitle', 'foldSessionTitle', 'normalizeSessionTitle',
    'titleProjectionDefinition', 'truncateTitleUtf8',
  ],
  '@tomato/settings': ['redactSecrets'],
  '@tomato/skill': [
    'BUNDLED_SKILL_RANK', 'escapeText', 'isModelInvocable', 'isSkillName', 'isUserInvocable', 'renderSkillContent',
  ],
  '@tomato/skill-filesystem': ['FileSystemSkillProvider'],
  '@tomato/spill-local': [
    'DEFAULT_ROOT_PREFIX', 'discoverDefaultRoots', 'encodeSegment', 'isErrno', 'privateRoot', 'saveTextFile',
    'sessionDir', 'sweepSpillRoots',
  ],
  '@tomato/storage': ['BackendRegistry', 'UNIT_NAME_RE', 'storageBackendServiceKey'],
  '@tomato/storage-domain': ['DomainFacility', 'defineDomain', 'descriptorOf', 'domainTable'],
  '@tomato/storage-json': ['JsonStorageBackend'],
  '@tomato/storage-sqlite': ['STORAGE_SQLITE_SCHEMA_VERSION', 'SqliteStorageBackend'],
  '@tomato/subagent': [
    'AssistantOutputFold', 'NO_START_CAPABILITIES', 'ROOT_AGENT_NAME', 'STRUCTURED_OUTPUT_TOOL',
    'SUBAGENT_DESCRIPTOR_VERSION', 'SubagentRunId', 'appendDelegatedPolicyOverrides', 'applyChildComposition',
    'assertPositiveFinite', 'assertSubagentMaxDepth', 'assertUsableCwd', 'captureDelegatedPolicyOverrides',
    'childSessionMeta', 'delegationDepthOf', 'finalAssistantOutput', 'foldSubagentDescriptor',
    'parentAgentOptionsForDelegation', 'resolveChildAgentOptions', 'resolveChildDepth', 'settleRunResult',
    'snapshotSubagentDescriptor', 'subprocessRunHandle',
  ],
  '@tomato/system-prompt': [
    'PERSONA_PREFIX_SECTION', 'PERSONA_SUFFIX_SECTION', 'TOOL_ORDER_REST', 'joinContextSections',
    'renderContextSections', 'renderContextSnapshot', 'renderPrompt',
  ],
  '@tomato/terminal': ['TerminalSessionId'],
  '@tomato/terminal-bash': ['BashTerminalBackend', 'PWSH_PROMPT_SETUP'],
  '@tomato/terminal-panel': ['GUIDANCE'],
  '@tomato/tool-call-timeout-policy': ['TOOL_TIMEOUT'],
  '@tomato/tool-executor-native': ['NativeToolExecutor'],
  '@tomato/tool-executor-ptc': [
    'PtcExecutor', 'jsonSchemaToPy', 'jsonSchemaToTs', 'renderToolsSdk', 'renderToolsSdkPy',
  ],
  '@tomato/tool-fs-search': [
    'GLOB_MAX_RESULTS', 'GLOB_VCS_EXCLUDES', 'GREP_MAX_LINE_BYTES', 'GREP_MAX_MATCHES', 'RAW_OUTPUT_MAX_BYTES',
    'SEARCH_GRACE_MS', 'SEARCH_META_MAX_BYTES', 'SEARCH_STDERR_MAX_BYTES', 'SEARCH_TIMEOUT_MS', 'applyGlobTool',
    'applyGrepTool', 'buildGlobCommand', 'buildGrepCommand', 'formatGlobOutput', 'formatGrepMatches',
    'formatGrepOutput', 'parseGlobArgs', 'parseGrepArgs', 'parseGrepMatches', 'presentGlobCall', 'presentGlobResult',
    'presentGrepCall', 'presentGrepResult', 'previewLine', 'resolveRgPath', 'runRipgrep', 'sampleAcrossTopLevel',
    'toWorkdirRelative', 'trySaveFormattedResult',
  ],
  '@tomato/tool-lsp': [
    'DEFAULT_LSP_TOOL_TIMEOUT_MS', 'DEFAULT_MAX_LOCATIONS', 'DEFAULT_MAX_RESULT_CHARS', 'LSP_OPERATIONS',
    'LSP_PROMPT_TEXT', 'formatHover', 'formatLocations', 'parseLspArgs', 'presentLspCall', 'renderUri',
  ],
  '@tomato/tool-session-query': ['DEFAULT_MAX_SEARCH_RESULTS', 'DEFAULT_SEARCH_TIMEOUT_MS'],
  '@tomato/tool-terminal': ['DEFAULT_MAX_RESULT_BYTES', 'MIN_MAX_RESULT_BYTES'],
  '@tomato/tool-web': [
    'DEFAULT_FETCH_MAX_OUTPUT_CHARS', 'DEFAULT_WEB_TOOL_TIMEOUT_MS', 'WEB_SEARCH_MAX_QUERIES', 'WEB_SEARCH_MAX_RESULTS',
    'applyWebFetchTool', 'applyWebSearchTool', 'fetchMetaFromResult', 'fetchMetaFromValue', 'formatFetchOutput',
    'formatSearchOutput', 'parseFetchArgs', 'presentFetchCall', 'presentFetchResult', 'presentSearchCall',
    'presentSearchResult', 'searchMetaFromResult', 'searchMetaFromValue',
  ],
  '@tomato/tool-workspace-dependencies': [
    'copyPrimaryRuntime', 'installPrimaryRuntime', 'parsePrimaryRuntime', 'primaryRuntimePythonAliases',
    'readPrimaryRuntime', 'resolvePrimaryRuntime', 'workspaceDependencyPaths',
  ],
  '@tomato/tools': [
    'RUN_CODE_NAME', 'TOOL_ABORTED', 'TOOL_ABORTED_BEFORE_DISPATCH', 'assertObjectJsonSchema',
    'assertSupportedJsonSchema', 'defineTool', 'isJsonSchemaRecord', 'isPlainJsonArray', 'isPlainJsonRecord',
    'parameterSchemaSpecToJsonSchema', 'projectToolSchema', 'validateArgs', 'validateJsonSchemaValue',
    'valueSchemaSpecToJsonSchema',
  ],
  '@tomato/typert-loader': ['TYPERT_HOST_EXPORT', 'validateTypertManifest'],
  '@tomato/typert-registry': ['typertEndpoint', 'typertKey', 'typertPackageKey'],
  '@tomato/user-approval': ['APPROVAL_POLICIES', 'ApprovalRequestId', 'setApprovalPolicy'],
  '@tomato/user-questions': ['TIMED_WAIT_PARAMETER', 'isTimedAskUserQuestionSchema'],
  '@tomato/web-app': ['internals'],
  '@tomato/web-fetch-http': ['DEFAULT_USER_AGENT', 'HttpFetchProvider', 'LOCAL_FETCH_PROVIDER_ID'],
  '@tomato/webhook': ['WebhookDeliveryId', 'WebhookRuleId', 'WebhookSourceId'],
  '@tomato/workflow-ptc': ['materializeFromRealm', 'validateMeta'],
  '@tomato/workspace': [
    'WorkspaceId', 'realpathNormalize', 'workspaceDomainSpec', 'workspaceDomainState', 'workspaceRecord',
  ],
} as const satisfies Readonly<Record<string, readonly string[]>>
