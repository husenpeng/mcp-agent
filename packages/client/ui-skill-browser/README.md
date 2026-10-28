---
description: "The right Sidebar's Skills tab type for the tomato web client: every installed skill as a lazily revealed card list, with a detail page and an editor for personal skill files."
kind: "package-reference"
---

# @tomato/client-ui-skill-browser

English | [中文](README.zh.md)

## Summary

Browse every skill the current Session composition can see, open one skill's metadata and instruction body, and edit skills stored in personal `$TOMATO_HOME/skills` or `$TOMATO_AGENTS_HOME/skills` directories. The tab is reached from the guide and claims no resource address.

## Table of Contents

- [What it registers](#what-it-registers)
- [The panel](#the-panel)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="what-it-registers"></a>
## What it registers

- **The type** — `ctx.sidebarRightTabs.register(...)` with kind `skills`, id `@tomato/client-ui-skill-browser`, band `builtin`, no address patterns, and one guide entry (order 40) whose title is the proper noun `Skills` in every language.
- **The body** — the keyed `sidebar.right.pane.tab` seat under that id. It receives the Session id and the tab record from the framework and calls only the injected face; the face talks to the Session-addressed `skills` Remote.
- **The chip title** — the keyed `sidebar.right.pane.tab.title` seat under that id: the shared skill glyph before the type's label.

State lives in the type's own store, bucketed by tab id. The owner's `signal` ends a bucket: closing the tab forgets its state, and a settlement that arrives afterwards writes nothing.

<a id="the-panel"></a>
## The panel

The list reads `skills/list` with `includeModelOnly: true` and `brief: true`, so model-only skills appear too while descriptions stay off the wire; the `/` composer source keeps its full, user-invocable request. Each row shows only the skill name, its source bucket, and a model-only marker when the composer hides it.

Rows are revealed in batches of 24. A sentinel after the mounted rows asks the store for the next batch when it enters the list's scroller; a fresh catalog rewinds the cursor. The whole catalog arrives in one RPC because skill directories are small.

Selecting a row reads `skills/get` for that one skill and fills the detail pane beside the list: description, optional routing hint, path, source, and the instruction body rendered as Markdown. The list stays visible with the selected row marked; the close control empties the detail pane. When the Sidebar is narrow, the two panes stack, with the list capped above the detail.

`editable` is a Host decision: the winning provider must support updates, the skill must have a file, and its source must be a personal directory. Only then does the detail offer **Edit**. The form edits description, routing hint, and the Markdown body; the name is read-only. **Save** sends `skills/save` and publishes the Host readback onto both the detail and its card. A failed save keeps the draft and shows the failure in place; **Cancel** discards the draft.

The list shows a loading skeleton, an inline failure with retry, and an empty state; the detail shows its own loading skeleton and a retry for a failed read. The header's reload control rereads the catalog and carries the tab's refresh shortcut.

Source files under `src/client/`: `definition.tsx` (the type), `store.ts` (what it keeps), `face.ts` (Remote reads and writes), `SkillsBody.tsx` (the card list and detail switch), `SkillDetail.tsx` (detail, view/edit form), `format.ts` (source and failure copy), `locales.ts` (what it says), and `index.ts` (the wiring).

<a id="model-experience"></a>
## Model Experience

Indirectly, through the `skill` calls and user-explicit `/name` invocations that later load an edited `SKILL.md`; the panel itself assembles no model request.

#### KV Cache effect

None in the panel itself. A later skill invocation embeds the edited body in its request, exactly as it embeds any current skill file.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>
- **No create or rename.** The panel edits existing personal skills; the skill name stays read-only because renaming moves its directory or file and changes every `/name` reference.
- **No search or filters.** The list is the complete catalog in name order.
- **Client-side lazy rendering, not RPC paging.** The catalog arrives in one read and cards mount in batches. A catalog large enough to matter would need cursor paging in `skills/list`.
- **Last write wins.** Saves are atomic full-file writes with no optimistic version handshake; two editors can overwrite each other.
- **Manual catalog refresh.** Preset and plugin changes in another client are picked up by the reload control, not pushed.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

Writing is owned by `@tomato/skill-filesystem`: it rereads the raw file, merges the named fields into the existing YAML frontmatter, preserves unknown keys, and rewrites the body. The Remote restricts this capability to personal sources and resolves the target from the winning catalog entry, so the request never supplies a path. The provider's write is fenced to the skill file's own directory when it goes through `ctx.fs`, because a personal root normally sits outside the deployment workspace.

</details>
