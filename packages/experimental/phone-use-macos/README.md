---
description: "Keep one iPhone usable as a phone-use target: renewal, installation, runner launch, and health."
kind: "package-reference"
---

# @tomato/experimental-phone-use-macos

English | [中文](README.zh.md)

## Summary

Keeps an iPhone usable as a phone-use target from the Mac. An expiring profile, a rebooted phone, and a crashed runner all look like "the phone stopped answering", so this package repairs them: check the toolchain, rebuild and reinstall with provisioning updates, launch the runner with the Host credentials in its environment, and watch on an interval. It also answers the `phoneDevice` namespace the device card reads.

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Further Exploration](#further-exploration)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

Mount it beside `@tomato/experimental-phone-use` on macOS only; the bundle does that with a platform guard.

### When to choose it

Choose it when the phone must keep working without a person rebuilding it by hand every week. Skip it when another machine already renews the runner, or when the phone is updated by an MDM-managed process.

### Minimal configuration

```yaml
- id: phone-use-macos
  name: '@tomato/experimental-phone-use-macos'
  config:
    iosProjectDir: /path/to/apps/ios
```

| Field | Default | Meaning |
|---|---|---|
| `iosProjectDir` | required | Absolute path to `apps/ios`; a packaged Desktop ships no sources. |
| `udid` | the only attached phone | Device to manage when several are paired. |
| `renewBeforeHours` | `48` | Renew when the profile has less time left than this. |
| `checkIntervalMs` | `300000` | Watch interval; `0` disables the loop. |
| `transport` | `usb` | `usb` starts a usbmuxd relay so the Host dials the phone; `vpn` makes the runner dial out. |
| `relayPort` | `18200` | Mac loopback port the USB relay listens on. |
| `relayScript` | `<iosProjectDir>/tests/usbmux-relay.mjs` | The relay the manager starts. |
| `hostBase` | unset | Injected as `TOMATO_HOST_BASE`; `vpn` transport only. |
| `credentialEnv` | `TOMATO_PHONE_CREDENTIAL` | Host-side variable whose value becomes the runner credential. |

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

`DeviceManager.pass()` decides once per interval: renew, launch, wait, or nothing. The decision is a pure function over the device reading, the profile expiry, and the last known runner state, so the loop is tested against recorded tool output.

Every tool runs through the subprocess seam with an explicit argv, directory, output bound, and deadline; nothing passes through a shell.

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

- [Phone tools](../phone-use/README.md): observation, actions, and confirmation.
- [Bundle](../phone-use-bundle/README.md): the profile layer that inserts this row.

-----

<a id="model-experience"></a>
## Model Experience

None, as the manager repairs the device behind `phone_observe` and `phone_act` and registers no prompt or tool of its own.

#### KV Cache effect

None.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- A launch that fails because the phone is locked reports `需要解锁` and backs off; it never prompts for a passcode.
- The expiry is read from the built application, so a build that never ran keeps launching.
- Device-level Host credentials are not implemented; `credentialEnv` names a deployment variable.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>
