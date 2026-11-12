---
description: "Observe an attached iPhone's screen and perform one action per call from a Host session."
kind: "package-reference"
---

# @tomato/experimental-phone-use

English | [中文](README.zh.md)

## Summary

Lets a Host session read an attached iPhone's screen and act on it: one tool observes the visible elements, another performs a single gesture, text entry, launch, or wait. A phone behind a LAN, a tailnet, or the desktop tunnel stays reachable because the runner dials the Host; nothing listens on the device. Irreversible actions pause for a person instead of trusting the model.

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

Mount the plugin in a profile that already carries `tools`, the Typert registry, and the Typert loader; the loader registers this package's generated `./typert` artifact, without which the namespace never appears.

### When to choose it

Choose it when a task exists only inside an iOS app and no API reaches it, and when the phone can carry a developer signature. Avoid it for App Store distribution and for screens the system protects: passcodes, Face ID, and the wallet application stay out of reach.

### Minimal configuration

```yaml
- id: phone-use
  name: '@tomato/experimental-phone-use'
  config:
    commandTimeoutMs: 15000
```

| Field | Default | Meaning |
|---|---|---|
| `commandTimeoutMs` | `15000` | Deadline for one engine command; the Host cancels and fails it afterwards. |
| `observeMaxElements` | `80` | Most elements one observation asks for. |
| `maxRenderElements` | `40` | Most element lines either tool renders back to the model. |

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

One session per attached device holds the attach stream and the commands in flight. A command settles when `phone/result` names its id; a newer attach replaces the older stream and fails its pending commands, and nothing is replayed after a reconnect.

The runner enforces its own lease and risk gate. The Host adds the part the device cannot do — asking a person — through the question surface.

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

- [Device manager](../phone-use-macos/README.md): renewal, installation, and runner launch.
- [Bundle](../phone-use-bundle/README.md): the profile layer that inserts both rows.
- [Runner](../../../apps/ios/TomatoRunner/README.md): the on-device engine and its device findings.

-----

<a id="model-experience"></a>
## Model Experience

### phone_observe

#### What the model sees

The frontmost application, its visible elements as `ref role "label" (x,y,w,h)` lines, and OCR text when the tree is thin.

#### Token effect

At most `maxRenderElements` element lines per answer.

#### KV Cache effect

None: the tool adds no system-prompt section.

### phone_act

#### What the model sees

The action arguments, then the settled screen in the same element-line form.

#### Token effect

One call usually replaces a separate read, because the answer already carries the screen.

#### KV Cache effect

The tool adds no system-prompt section.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- Device-level credentials are not implemented: the runner presents the application's owner credential.
- Confirmation needs an agent-owned execution; without one a refusal cannot be cleared.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>
