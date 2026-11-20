# Agent Note: node-pty builds from source with hidden visibility so native errors do not abort the host

Status: implemented

English | [中文](2026-11-19-pty-hidden-visibility.zh.md)

## Problem

A packaged-runtime smoke run under the macOS file sandbox aborted with `SIGABRT` (`terminating due to uncaught exception of type Napi::Error`) the moment it allocated a PTY. The crash stack threw from `PtyFork` in `pty.node` and unwound into `Napi::details::CallbackData<…>::Wrapper` located in `koffi.node`, then `__cxxabiv1::failed_throw` → `std::terminate`.

Two independent defects stack:

- The Seatbelt profile denies `file-write*` outside the workspace and temp roots, and `posix_openpt(O_RDWR)` is a write-open of `/dev/ptmx`, so PTY allocation inside a confined process fails with `EPERM`. node-pty reports that as `throw Napi::Error::New(env, err)` on the `pty_posix_spawn` error path.
- node-pty's upstream prebuilds compile with C++ exceptions (`node_addon_api_except`) and export node-addon-api's callback wrapper as a **weak external** symbol. koffi's prebuilt `koffi.node` exports the identical weak symbol but is built **without** exception support (no `__cxa_throw`/`__cxa_begin_catch`/personality imports). dyld and ELF coalesce weak definitions process-wide, so whichever addon loads first owns the wrapper for both. The product and the smoke load koffi before node-pty, so a node-pty throw unwinds through koffi's wrapper, which has no catch, and aborts the process instead of becoming a JS error. Every node-pty error path (spawn failure, usage error, ioctl failure) is affected, not only the sandbox case.

Reproduced both layers: with koffi loaded first a prebuild `pty.spawn` aborts (exit 134); without koffi the same call throws a catchable `posix_openpt failed: Operation not permitted`; the same payload spawns cleanly outside the sandbox.

## Decision

Extend the node-pty patch so Unix builds from source with hidden symbol visibility:

- `binding.gyp` adds `-fvisibility=hidden -fvisibility-inlines-hidden` (and the matching Xcode `GCC_SYMBOLS_PRIVATE_EXTERN`/`GCC_INLINES_ARE_PRIVATE_EXTERN`) to the non-Windows target. The callback wrapper and `Napi::Error` typeinfo become private externals, so dyld/ELF cannot coalesce them with koffi's copy and `pty.node` binds to its own catching wrapper. `napi_register_module_v1` stays exported through `NAPI_MODULE_EXPORT`'s default visibility.
- `scripts/prebuild.js` removes the prebuilds and exits non-zero on non-Windows so `node-gyp rebuild` runs and the flags take effect. Windows keeps its prebuilds: it has no weak-symbol interposition.

The native throw then surfaces as a catchable JS error, which `spawnTerminal`'s existing try/catch rethrows to the consumer; the provider keeps rejecting with the platform's original error as the subprocess seam documents.

## Alternatives considered

**Convert node-pty to the no-exceptions `node_addon_api` target and rewrite every `throw` site.** Rejected: it diverges from upstream across ~15 throw sites in `pty.cc` and the Windows ConPTY sources, raising the cost of each node-pty version bump. Hidden visibility keeps upstream code unchanged and fixes the whole class with one build flag.

**Guarantee node-pty loads before koffi.** Rejected: load order is process-wide and fragile across the many packages that import koffi; it is not an enforceable invariant.

**Preflight `/dev/ptmx` in JS before `pty.spawn`.** Rejected: it covers only the sandbox trigger and leaves every other native throw path still aborting.

**Allow `/dev/ptmx` and `/dev/ttys*` in the Seatbelt profile.** Deferred: it is a sandbox-policy decision about whether terminals run confined, separate from making native errors reportable. The crash fix does not depend on it.

## Consequences

Unix installs (workspace, profile, and the Desktop runtime install) now compile node-pty with node-gyp instead of unpacking a prebuild; the C++ toolchain this already requires for koffi, fs-ext, and the native system addon covers it. The Desktop install already allows `node-pty` build scripts. `loadNativeModule` resolves `build/Release` first, so the source-built `pty.node` and `spawn-helper` load without further changes.

The Desktop runtime file policy omits node-pty's `build/` makefiles, `config.gypi`, debug builds, and compiler intermediates while retaining `build/Release/pty.node` and `spawn-helper` (and the Windows ConPTY binaries). It matches individual entries rather than whitelisting files so the copy filter does not prune the `build/Release` directory itself. The shared patch hash in `pnpm-lock.yaml` moves with the patch bytes; `prepare-runtime-patches` verifies it.

Windows is unchanged: it keeps the upstream prebuilds and the bundled console host behaviour recorded in the [console host note](2026-09-28-pty-bundled-console-host.md).

The catchable denial also restores the user-authorization path. A confined command that needs a PTY now fails with a non-zero exit and `Operation not permitted` on stderr, which the seatbelt denial dialect (`matchesSignature`) classifies as a sandbox denial; `tool-bash` then renders the denial marker and the escalation hint, and the model's `sandbox_permissions` retry resolves through `approveEscalation` to a user approval prompt. The abort this replaces was a signal death with no exit code, so it never matched a denial and offered no authorization. The grant today is the only strictly wider mode, `danger-full-access`; a PTY-only least-privilege grant (a narrow `/dev/ptmx` + `/dev/ttys*` capability routed through the same approval seam) is deferred. The product's interactive terminals allocate the PTY in the unconfined host and confine only the spawned shell, so they never hit this denial.

## Testing

`packages/subprocess/subprocess-local/tests/pty-native-error.spec.ts` spawns a fixture that loads koffi first, then calls `pty.native.open()` with no arguments — a deterministic native throw before any syscall — and asserts the child exits 0 with a caught error rather than dying by signal. It is skipped on Windows, where the hazard does not exist. Against a coalesced prebuild wrapper the fixture aborts; against the hidden-visibility build it reports `CAUGHT:Usage: pty.open(cols, rows)`.

`packages/sandbox/sandbox/tests/diagnostics.spec.ts` pins that a node-pty `Operation not permitted` denial on a failed exit matches the seatbelt denial dialect (and so reaches the approval escalation), while the SIGABRT signal death does not.

`apps/desktop/tests/runtime-file-policy.spec.ts` pins the new `build/` exclusions and the retained Release binaries across platforms. The PTY-dependent `subprocess-local` specs pass outside the sandbox; inside it they fail with the catchable `posix_openpt` error rather than aborting, which is the sandbox policy, not this change. No snapshot applies: the change alters how a native failure is contained, not model- or product-user-visible output of its own.