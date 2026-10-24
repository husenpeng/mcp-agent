---
description: "Tomato brand occupants for the Web client's sidebar and conversation-hero brand slots, for deployments replacing the shipped DeepSeek mark."
kind: "package-reference"
---

# @tomato/brand

English | [中文](README.zh.md)

## Summary

This package gives Tomato Harness its own sidebar mark, sidebar name, and blank-session hero mark. It occupies the three generic brand slots the shell declares, so the shipped `ui-brand-official` occupants stay out of the composition and no fish or DeepSeek wordmark reaches the interface. It has no runtime state and does not affect model requests.

## Table of Contents

- [Use this package](#use-this-package)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)

<a id="use-this-package"></a>

## Use this package

Mount this plugin in the browser roster and leave `@deepseek-ai/dsh-client-ui-brand-official` out of the same composition. Two declarations are filled:

| Slot | Occupant | Owner props |
|---|---|---|
| `sidebar.brand.mark` | `TomatoSidebarMark` | `size` |
| `sidebar.brand.name` | `TomatoBrandName` | none |
| `conversation.hero.brand.mark` | `TomatoMark` | `size`, `className` |

Each registration waits on its owner's declaration through `ctx.slots.inject`, so the occupants follow the sidebar and conversation lifetimes and withdraw together during reload.

The sidebar name is fixed product text, not a translated string: brand names are not localized. The mark is the product favicon geometry, drawn with `currentColor` so it follows the surrounding palette in both themes.

<a id="model-experience"></a>

## Model Experience

None, as the package contributes browser presentation only and nothing here reaches a model request.

#### KV Cache effect

None; this package neither assembles nor sends a provider request.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **Mark is single-color** — the favicon's gradient is dropped so the glyph can inherit `currentColor`. A multi-color mark needs the theme's icon-replacement surface, not this package.
- **The hero wordmark is not registered** — the shell's own hero fallback stays; only the square mark is replaced.
- **The browser tab title is a build value** — `DSH_CLIENT_TITLE` selects it at build time and is outside the slot system.
