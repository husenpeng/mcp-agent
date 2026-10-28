---
description: "Tomato AI's company product surface: account launcher, brand occupants, same-origin gateway, and OTLP reporting."
kind: "package-group"
---

# tomato/ — company product surface

English | [中文](README.zh.md)

## Summary

This group carries the packages that make the harness a Tomato AI product rather than an upstream build: the signed-in account surface, the three brand slots, the same-origin gateway in front of the company login service, and the OTLP reporter for the internal relay. They compose through the shipped bundles; no package here owns agent behavior, model access, or session storage.

## Table of Contents

- [Packages](#packages)
- [Related documentation](#related-documentation)
- [Dev Note](#dev-note)

<a id="packages"></a>
## Packages

| Package | Role |
|---|---|
| [`account`](account/README.md) | Sidebar launcher and Account settings page over the gateway's auth session |
| [`brand`](brand/README.md) | Sidebar mark, sidebar name, and hero mark occupants |
| [`gateway`](gateway/README.md) | Same-origin `/api/auth/*` and fixed-table `/api/services/*` routes |
| [`telemetry`](telemetry/README.md) | Turn and tool spans sent to the internal OTLP relay |

<a id="related-documentation"></a>
## Related documentation

- [Product decisions](../../docs/tomato/decisions.md) — current product behavior and the decisions behind it.
- [ADRs](../../docs/tomato/adr/README.md) — implemented decisions and their consequences.

<a id="dev-note"></a>
## Dev Note

None.