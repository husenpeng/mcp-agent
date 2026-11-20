---
description: "Host hardware and process sampling streamed to browsers over Typert Remote: processor, graphics, memory, disk, network, power, and the highest-CPU processes, plus the reference-counted Client observation service."
kind: "package-reference"
---
# System Monitor Controller

English | [中文](README.zh.md)

<a id="summary"></a>
## Summary

`@tomato/api-system-monitor-controller` owns the Host `ctx.systemMonitorController` service and the generated Client `ctx.remote.systemMonitor` namespace. Its one Remote stream, `systemMonitor.sample`, yields a frame per interval: machine identity, processor load with per-core shares, memory and swap occupancy, graphics utilization, root-volume capacity, interface throughput, power and thermal state, and the highest-CPU processes. The Client half installs `ctx.systemMonitor`, the reference-counted service that keeps one stream open while any surface watches it, retains the last 90 headline percentages, and reopens the stream after a carrier interruption. Nothing here touches the model's request path, the Session log, or a Session's Agent.

<a id="table-of-contents"></a>
## Table of Contents

- [Use this package](#use-this-package)
- [Host probes](#host-probes)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

The Host controller requires the Typert Remote registry (`ctx.typert`) and fails to load without it; every other dependency is a Host command the collectors run directly. `systemMonitor.sample({ intervalMs?, processLimit? }, signal)` yields the current reading immediately, then one frame after each wait. The stream has no natural end: the carrier closes it when the browser disconnects, and a frame already being collected settles before the generator returns. Intervals are clamped to 250–10,000 ms and the process list to 0–50 rows, so a caller cannot turn the dashboard into a busy loop or an unbounded list.

Each frame is independent: `at`, `host`, `cpu`, `memory`, and `processes` are always present, while `gpu`, `disk`, `network`, and `power` are null when the platform exposes nothing without elevation. A probe that refuses — an unreadable swap record, a denied `ps`, no interface counters — costs only its own field and adds its id to `unavailable`, so a partial frame is still honest rather than a failed stream. CPU shares and network rates are differences against the previous frame: the first frame of a sampler reports zeroes for both, and a counter that moves backwards (an interface reset) reports a zero rate.

The Client entry installs `ctx.systemMonitor` (`ISystemMonitor`), backed by the package-internal `ClientSystemMonitorModel`. `watch()` keeps one stream open however many surfaces hold it and closes it after the last release, which stops Host sampling; `state` exposes `{ frame, points, status, failure }`, where `points` retains the last 90 processor, graphics, and memory percentages for sparklines and `status` moves through `idle`, `live`, `reconnecting`, and `failed`. A carrier interruption keeps the last frame on screen and the Gateway reopens the stream; samples carry no cursor, so a new generation replaces the previous reading whole. The plugin resolves the Gateway stream factory and the `systemMonitor` namespace while its own context is current, because stream (re)opens run on caller stacks whose dynamic context has not declared `remote.systemMonitor`.

<a id="config"></a>
### Config

| Field | Default | Meaning |
|---|---:|---|
| `intervalMs` | `1000` | Sampling interval in milliseconds; clamped to 250–10,000 |
| `processLimit` | `6` | Process rows per frame, highest CPU first; clamped to 0–50 |
| `commandTimeoutMs` | `2000` | Deadline for one platform probe in milliseconds |

The generated [configuration catalog](../../../docs/config-catalog.md#tomatoapi-system-monitor-controller) is the exhaustive source for accepted fields and their JSDoc.

<a id="host-probes"></a>
## Host probes

| Field | macOS | Linux | Other platforms |
|---|---|---|---|
| `host` | `node:os` plus `sysctl -n hw.model` | `node:os` plus the DMI product name | `node:os`, empty model |
| `cpu` | `os.cpus()` tick deltas, `os.loadavg()` | same | same |
| `memory` | `vm_stat`, `sysctl -n vm.swapusage` | `/proc/meminfo` | `os.totalmem`/`os.freemem` |
| `gpu` | `ioreg -c IOAccelerator` performance statistics | `/sys/class/drm/card*/device/gpu_busy_percent` | null |
| `disk` | `statfs` of `/` | `statfs` of `/` | `statfs` of `SystemDrive` |
| `network` | `netstat -ib`, non-loopback interfaces | `/proc/net/dev` | null |
| `power` | `pmset -g batt`, `pmset -g therm` | `/sys/class/power_supply` | null |
| `processes` | `ps -Ao pid=,pcpu=,pmem=,comm=` | same | empty |

Identity is cached for 60 seconds; per-frame state (the previous processor snapshot and interface counters) belongs to the sampler instance. Commands run argv-only through `execFile` with a deadline and an output cap, never through a shell.

## Model Experience

None, as this package samples Host hardware on demand and registers no prompt, tool, or Session event.

#### KV Cache effect

No direct effect; frames are browser observations and never enter a model request.

## Known Limitations and Deferred Work

- **Windows coverage is structural** — the `statfs` drive path and the absent GPU, network, and power probes are exercised only by fixtures; no Windows lane runs this package's live paths.
- **Graphics utilization is the driver's own accounting** — macOS reports `Device Utilization %` from `IOAccelerator` and Linux reads `gpu_busy_percent`; a machine that hides both reports null rather than estimating, and `powermetrics` (root-only) is deliberately unused.
- **Process CPU is the lifetime average** — macOS and Linux `ps` report CPU time since process start, not an instantaneous share, so a long-lived busy process reads lower than Activity Monitor shows.
- **Interface counters exclude loopback only** — tunnel and bridge interfaces are counted alongside their physical carriers, so a VPN can make throughput look larger than the wire carried.
- **Two browsers mean two samplers** — the reference count is per browser connection, so concurrent dashboards probe the Host twice per interval.
- **The frame carries the Host name** — `host.hostname` reaches the browser; a deployment that treats machine names as sensitive must redact it before display.

### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>