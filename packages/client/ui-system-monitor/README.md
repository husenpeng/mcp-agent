---
description: "Floating system monitor overlay for the web client: a collapsed pill that opens into processor, graphics, memory, network, disk, power, and process readings, mounted at the root shell.overlay seat."
kind: "package-reference"
---
# System Monitor Overlay

English | [中文](README.zh.md)

<a id="summary"></a>
## Summary

`@tomato/client-ui-system-monitor` contributes one entry to the root-scoped `shell.overlay` seat: a floating card that rests above the bottom-right corner as a pill showing CPU, GPU, and memory, and expands into a dashboard of the Host's processor, graphics, memory, network, disk, power, and highest-CPU processes. Frames arrive through the `systemMonitor` client service, so the card owns no transport: it registers dictionaries, one overlay entry, and the injected snapshot hook, and it releases the sampling stream whenever it collapses to a paused state or unmounts.

<a id="table-of-contents"></a>
## Table of Contents

- [What it draws](#what-it-draws)
- [Placement and interaction](#placement-and-interaction)
- [Desktop panel](#desktop-panel)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="what-it-draws"></a>
## What it draws

The header carries the title, a stream-state dot (`live`, `reconnecting`, `unavailable`, `paused`), a sampling pause control, and a collapse control. Below it the card shows the machine model and chip, core count, installed memory and uptime, then one section per reading: processor with a sparkline over the retained points, a per-core bar row, and the load average; graphics with a sparkline and GPU memory; memory with an occupancy meter, a sparkline, free memory, and swap; network down and up rates; root-volume capacity; battery charge, charging state, and thermal pressure; and the process rows the Host sampled, highest CPU first.

A field the platform cannot report is omitted rather than shown as zero: no GPU section without a graphics reading, no network rows without counters, no disk or power section when the probes return nothing. Collectors that refused outright are named under the process list, so an empty section never reads as an idle machine. Before the first frame the card shows the waiting state, and the collapsed pill falls back to the current stream state instead of inventing values.

<a id="placement-and-interaction"></a>
## Placement and interaction

The card floats above every column and survives panel navigation because `shell.overlay` covers the whole frame; the layer passes pointer events through, and only the monitor itself accepts them. The monitor has three forms: the collapsed pill, the expanded card, and the ball parked against an edge.

Holding any part of the pill or card that is not a control drags it with pointer capture, clamped inside the window with a 16px margin; a press becomes a drag only after 4 CSS pixels of travel, so releasing in place stays a click, and the readings and process rows keep their own presses. The position, form, parked edge, and pause flag are stored under `tomato.system-monitor.v1` in local storage, and a browser that refuses storage simply forgets them on the next mount. The card is 348×452 CSS pixels, the pill is 236 wide, and the card's body scrolls, so a short window never clips a section.

The close control on the pill and the card folds the monitor into a 44px ball against the nearer side edge, half of it outside the window, centered on where the monitor was. The ball keeps one reading, processor usage, colored by load: green below 60%, amber up to 85%, red above it, and neutral while paused or before the first frame. Clicking the ball expands the form it came from, the pill or the card, at its last free position; a window resize keeps the ball on the same edge. A context menu, also reachable from the keyboard menu key, offers pause or resume, expand on the ball, float on the desktop, hide the panel, and tuck to the edge.

Dragging and parking transition over 160ms and stop under `prefers-reduced-motion: reduce`.

Pausing releases this card's reference to the shared observation stream, which closes the stream once no other surface holds it; resuming reopens it. The copy for every label, control, and status is owned by the plugin's `systemMonitor` dictionary namespace and registered in the eight shipped locale ids.

## Desktop panel

On macOS the desktop shell hosts the same card in its own floating window. That window is frameless, transparent over the sidebar vibrancy material, always on top of other applications, and closable from its own header. Its size follows the form the document shows: 360×480 for the card, and the card's width by a pill's height for the pill and the ball, keeping the edge it rests against and its vertical center; a hidden panel only records the form and adopts it when it next opens. Closing the panel stores the card-sized bounds. It loads the application page with `?surface=system-monitor`; the plugin then marks `<html data-system-monitor-window>`, renders the card across the whole window, lets the surface stylesheet hide the application chrome behind it, and wires the window's close control through the desktop bridge. The window has no system title bar, so the card's header is a native drag region: holding any part of it that is not a control moves the whole floating window past its own edges, and releasing stores its position for the next open. The in-app card's header grows a float control whenever that bridge exists, so the panel is one click away and pressing it again hides the panel without destroying it.

## Model Experience

None, as this package draws an already-sampled frame in a floating overlay and registers no prompt, tool, or Session event.

#### KV Cache effect

No direct effect; the overlay reads browser state and never enters a model request.

## Known Limitations and Deferred Work

- **No keyboard entry** — the card has no shortcut and no settings row; it mounts with the shipped bundle and can only be collapsed, paused, or moved from its own controls.
- **Fixed geometry** — the card does not resize, and a narrow window scrolls its body rather than reflowing the sections.
- **No history beyond the stream** — the sparklines cover the 90 points the client service retains; collapsing the card keeps sampling only while another surface watches, and every mount starts a fresh series.
- **The panel boots the whole application document** — it loads the same page and hides the chrome with CSS, so a second renderer and a second observation stream exist while it is open; a dedicated lightweight panel document is deferred.
- **Touch gestures are limited to the title bar** — the card is not an OS-level window and cannot be dragged past the frame edges.
- **The preview is the sampled frame, not a measurement** — values are whatever the Host probes reported for that interval; the overlay neither smooths nor re-samples them.

### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>