# Computer use

English | [中文](computer-use.zh.md)

Computer use lets a model observe and operate the local desktop through a configured provider. The shared TOMATO capability is called **computer use**; **Cua Driver** names the upstream implementation.

[Computer Use](../../packages/experimental/cua-bundle/README.md) provides an optional experimental switch for macOS CUA permission setup.

The [`macOS CUA provider`](../../packages/experimental/cua-macos/README.md) uses the [shared CUA objects and executor](../../packages/experimental/cua/README.md), which enforce application consent through User Questions and profile configuration.

The CUA provider owns `ctx.cuaAccess` for system-permission status, explicit system requests, and application revocation. Its [permission page](../../packages/experimental/cua/README.md) projects these controls; app/window operations enforce the provider's consent policy before dispatch.

| Permission type | Meaning |
|---|---|
| `CuaApplicationId`, `CuaApplicationGrant` | An executable/signature identity and its displayed saved decision. |
| `CuaSystemPermission` | Accessibility or Screen Recording, selected by the human. |
| `CuaPermissionProcess`, `CuaSystemPermissionState` | Native privilege checks, observed helper/parent processes, and the application identified by macOS process responsibility at helper startup. Application metadata is absent if the optional system query or application lookup is unavailable. |
| `CuaApplicationState` | Saved grants, refused applications, and whether persistence is available. Session-only grants remain internal to the provider. System observations and application icons are queried separately so the page can display each result as it arrives. |

## Choose a provider

Mount [`@tomato/computer-use`](../../packages/computer-use/computer-use/README.md) and one provider in the same composition. Both Cua Driver providers are experimental public npm packages and require explicit activation.

| Provider | Runtime |
|---|---|
| [Cua Driver MCP](../../packages/experimental/computer-use-cua-driver-mcp/README.md) | An already installed `cua-driver` executable connected through MCP |
| [Cua Driver native](../../packages/experimental/computer-use-cua-driver-native/README.md) | The platform-native runtime installed with the npm dependency |

Each provider supplies its upstream tool catalog. The shared service registers only a name and rejects any second provider, including another instance with the same name. It has no common desktop-operation methods or model-controlled selector.

## Lifetime and desktop sharing

A provider retains its registration while it shuts down its tools and owned resources. Startup failure releases the attempted registration. The MCP provider keeps its registration during reconnects.

One registered provider does not reserve a desktop for a Session. Callers coordinate complete observe, act, and verify workflows across Sessions and separate TOMATO processes. A cancelled call cannot undo input that the desktop already received.

## Results and platform requirements

Tools use the normal execution pipeline and Session log. Image-capable model routes with an attachment store receive durable screenshots; unsupported image routes receive the existing MCP image diagnostic. Provider READMEs own installation, permission, and platform limitations.

The [decision record](../../.agents/notes/implemented/architecture/2026-09-12-computer-use-provider-registration.md) explains the registration-only service and the two Cua Driver integrations.

<!-- BEGIN GENERATED cordis-surface (gen-cordis-catalog.ts) — do not edit between markers -->

<a id="cordis-surface"></a>

## Cordis API

Generated from source by `scripts/gen-cordis-catalog.ts` (verified fresh by `pnpm run verify-cordis-catalog` in doc-sync; regenerate with `pnpm run gen-cordis-catalog`) — the language sides differ only in locale-specific paired document paths. Signature blocks use a `ts cordis-catalog` fence and keep the original source JSDoc; dispatch modes are defined in the [primer](../cordis-primer.md#dispatch-modes), and the framework-inherited `ctx` API lives in [cordis-api/inherited.md](../cordis-api/inherited.md).

<a id="ctxcomputeruse--computeruseregistry"></a>

### `ctx.computerUse` — `ComputerUseRegistry`

Owns one optional provider registration in the shared computer-use service.

```ts cordis-catalog
/**
 * Reserve the sole provider slot until the contribution is disposed.
 * A second registration fails even when it repeats the current name. Providers
 * must stop their tools and await owned work before releasing this registration.
 * @param name - provider-owned name used in registration diagnostics.
 * @returns the effect disposer for this exact registration.
 */
register(name: ComputerUseProviderName): () => Promise<void>
```

Source: [`packages/computer-use/computer-use/src/index.ts`](../../packages/computer-use/computer-use/src/index.ts)

<a id="ctxcuaaccess--cuaaccess"></a>

### `ctx.cuaAccess` — `CuaAccess`

Browser controls for provider-owned native permission and application decisions.

```ts cordis-catalog
/** Read PTC execution state separately from native permission checks.
 * @returns Whether the shared runtime retains memory and has an editable profile entry.
 */
@Remote ptcConfiguration(): { persistent: boolean; writable: boolean }

/** Persist in-memory PTC execution through the existing profile editor and Loader lifecycle.
 * @returns Completion after the shared runtime reload; already-persistent runtimes are left intact.
 */
@Remote async enablePersistentPtc(): Promise<void>

/**
 * Read fresh stored application decisions without issuing a native request.
 * @returns Saved grants, refused applications and durable-storage availability.
 */
@Remote applications(): Promise<CuaApplicationState>

/**
 * Inspect system privileges independently of application decisions and icons.
 * @returns Platform-tagged access observations and native process metadata.
 */
@Remote async systemStatus(): Promise<CuaSystemPermissionState>

/**
 * Load presentation icons separately from application decisions.
 * @returns Optional native PNG icons keyed by executable path; applications without paths are skipped.
 */
@Remote async applicationIcons(): Promise<Record<string, string>>

/**
 * Request the selected system privilege through the native provider.
 * @param permission macOS privilege to request.
 * @param locale Current Client language for provider-owned permission UI.
 * @returns Current permission observations; requesting does not establish consent.
 */
@Remote async requestPermission(permission: CuaSystemPermission, locale: string): Promise<CuaSystemPermissionState>

/**
 * Open the macOS privacy pane selected by the user.
 * @param permission Corresponding system privilege.
 * @param locale Current Client language for provider-owned recovery instructions.
 * @returns Completion after macOS accepted the open request.
 */
@Remote async openSettings(permission: CuaSystemPermission, locale: string): Promise<void>

/**
 * Remove saved and session access and join affected operations.
 * @param id Application identity displayed on the permission page.
 * @returns Completion after persistence and cancellation; dispatched input cannot be undone.
 */
@Remote revoke(id: CuaApplicationId): Promise<void>

/**
 * Clear this application's refusals across sessions so each session may ask for access again.
 * @param id Refused or revoked application displayed on the permission page.
 * @returns Completion after clearing refusals; no permission is granted and no action is replayed.
 */
@Remote async retryApproval(id: CuaApplicationId): Promise<void>
```

Source: [`packages/experimental/cua/src/access.ts`](../../packages/experimental/cua/src/access.ts)

<a id="ctxphonedeviceremote--phonedeviceremote"></a>

### `ctx.phoneDeviceRemote` — `PhoneDeviceRemote`

Owner of the `phoneDevice` namespace.

```ts cordis-catalog
/**
 * Read the last known device state without touching the phone.
 * @returns the status the watch loop last recorded.
 */
@Remote('status') status(): DeviceStatus

/**
 * Check the toolchain and the attached phones now.
 * @returns the refreshed status.
 * @throws RemoteError `phoneDevice/*` when the toolchain or device is missing.
 */
@Remote('doctor') async doctor(): Promise<DeviceStatus>

/**
 * Rebuild, reinstall, and relaunch the runner.
 * @returns the refreshed status.
 * @throws RemoteError `phoneDevice/command-failed` when a tool fails.
 */
@Remote('renew') async renew(): Promise<DeviceStatus>

/**
 * Launch the runner with the current credentials.
 * @returns the refreshed status.
 * @throws RemoteError `phoneDevice/command-failed` when the launch fails.
 */
@Remote('relaunch') async relaunch(): Promise<DeviceStatus>
```

Types: [DeviceStatus](../../packages/experimental/phone-use-macos/README.md)

Source: [`packages/experimental/phone-use-macos/src/remote.ts`](../../packages/experimental/phone-use-macos/src/remote.ts)

<a id="ctxphoneremote--phoneremote"></a>

### `ctx.phoneRemote` — `PhoneRemote`

Owner of the `phone` namespace.

```ts cordis-catalog
/**
 * Attach one runner. The stream carries ready, command, cancel, and ping
 * frames; the runner answers each command through `result`.
 * @param request - runner identity and capabilities.
 * @param signal - cancellation owned by the Remote stream carrier.
 * @returns frames for this attachment.
 * @throws RemoteError `phone/refused` when the protocol version disagrees.
 */
@Remote({ mode: 'stream' }) attach(request: PhoneAttachRequest, signal: AbortSignal): AsyncIterable<PhoneDownFrame>

/**
 * Settle one command with the outcome the runner reported.
 * @param request - attach, command, and either value or failure.
 */
@Remote('result') result(request: PhoneCommandResult): void

/**
 * Record one out-of-band event from a runner.
 * @param request - attach identity and event kind.
 */
@Remote('event') event(request: PhoneDeviceEvent): void

/**
 * List every attached device.
 * @returns device summaries in attach order.
 */
@Remote('devices') devices(): PhoneDeviceSummary[]
```

Types: [PhoneAttachRequest](../../packages/experimental/phone-use/README.md) · [PhoneCommandResult](../../packages/experimental/phone-use/README.md) · [PhoneDeviceEvent](../../packages/experimental/phone-use/README.md) · [PhoneDeviceSummary](../../packages/experimental/phone-use/README.md) · [PhoneDownFrame](../../packages/experimental/phone-use/README.md)

Source: [`packages/experimental/phone-use/src/remote.ts`](../../packages/experimental/phone-use/src/remote.ts)
<!-- END GENERATED cordis-surface -->
