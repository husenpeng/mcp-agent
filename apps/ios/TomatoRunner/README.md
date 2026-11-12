# TomatoRunner

English | [中文](README.zh.md)

On-device control endpoint: a long-lived XCUITest runner that reads the screen, synthesizes input, and serves both this phone's application and the Mac session.

This is milestone M0 of [the phone-use plan](../docs/phone-use-plan.md). The Host plugin, the Mac device manager, and the on-device task loop are separate packages.

## Why a test bundle

iOS gives an ordinary application no way to observe or touch another application. The only supported mechanism that reaches the whole system is UI testing, so the runner is a `bundle.ui-testing` target: XCTest installs it, its `testServe` test never returns, and the process keeps serving while other applications are in front.

Two properties matter and are easy to lose: no host application (a hosted runner dies with its host), and no failing test (XCTest tears the process down when a test records a failure).

## Task loop

The runner runs the phone's own tasks: `task.start` takes a goal and a provider, and the loop observes, lets the model choose one action, performs it, and reads the screen again — up to the step budget. It lives in this process because the application is suspended as soon as a task drives another app.

Every turn is answered with its own result: a failed action comes back as the reason it failed, so a stale ref costs a step rather than the whole task, and an action whose screen did not change says so instead of letting the model repeat it. Only the newest screen stays in full — an older one misleads a model that has to decide on what is in front of the phone now — and the loop releases its lease when the task ends, so the page can take the device back at once.

A refused risky action is not retried here: the loop posts a confirmation notification and blocks that step until the owner answers, then continues with the one-shot token or ends the task.

## Wire contract

The runner and the application compile one file, [`PhoneProtocol.swift`](../TomatoRemote/Shared/PhoneProtocol.swift). The Host mirrors it in `packages/experimental/phone-use/src/protocol.ts`; a version bump touches all three and the shared fixtures.

- `GET /health` — unauthenticated readiness.
- `POST /pair` — issues a credential after the owner allows a notification.
- `POST /rpc` — JSON-RPC 2.0 with `Authorization: Bearer <credential>`.

## Device findings that shaped this design

Measured on an iPhone 15 Pro (iOS 26.5.2) with Xcode 27.0.

| Finding | Consequence |
|---|---|
| `XCUIApplication.debugDescription` returns the whole subtree in one round trip | The reader parses that text; walking `children` stalls for tens of seconds on SpringBoard. |
| XCTest requires the main thread for `launch` and `terminate` | Engine work runs on the main thread, inline or hopped to it. |
| Application-state queries block far past their timeout | The engine never asks for state; an empty dump falls back to SpringBoard. |
| `UIScreen.main.bounds` reports 320x480 in the runner process | Screen geometry comes from the dump's first window frame. |
| Taps near the bottom edge are swallowed by the home indicator | The self-check scrolls before tapping a bottom row. |
| Icon-only controls carry no label | Their `identifier` stands in for the label. |

## Running it

```bash
# engine and wire checks, one device
TOMATO_IPHONE_UDID=<udid> apps/ios/tests/phone-runner-smoke.sh

# serve (blocks until the test is stopped)
xcodebuild test -project TomatoRemote.xcodeproj -scheme TomatoRunner \
  -destination id=<udid> -derivedDataPath .derived -allowProvisioningUpdates \
  -only-testing:TomatoRunner/RunnerEntry/testServe TEST_RUNNER_TOMATO_RUNNER_SERVE=1
```

## Known limits

- Lock screen, passcode entry, Face ID, Apple Pay, and the wallet application are out of reach by design.
- `openUrl` goes through LaunchServices' private entry point; when a future iOS removes it the action answers `INTERNAL`.
- The foreground application is whatever the engine last bound; a switch made by hand is not observed until the next read falls back to SpringBoard.
- A seven-day certificate expiry stops the runner from launching; the Mac device manager owns renewal.
