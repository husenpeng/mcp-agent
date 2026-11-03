# Agent Note: Marketing integrations as one settings-driven plugin

Status: implemented

English | [中文](2026-10-30-marketing-integration-bundle.zh.md)

## Problem

Advertising and marketing platforms each publish their own MCP server, and a deployment wants some of them without hand-editing `cordis.yml` for every provider. Listing the servers directly in a bundle patch makes them always-on rows whose credentials must be edited in files, and a profile that ships them to a person has no surface to switch them on with keys.

The harness already has the pieces: `@tomato/mcp-client` mounts one server per row, `@tomato/settings` exposes volatile fields as an editable form, and the credentials domain stores secrets outside the settings document. What was missing is a plugin that turns "this provider is switched on and its credentials resolve" into "mount this child now".

It builds on the shipped seams rather than replacing them: [profile-owned live configuration](2026-09-19-profile-owned-live-configuration.md) owns the settings write that reloads an entry, [volatile config references](2026-09-18-volatile-config-references.md) defines which fields a form may edit, and [MCP client](../../archived/feature/2026-07-07-mcp-client-plugin.md) owns each connection.

## Decision

One plugin, `@tomato/marketing`, owns a flat settings section with one switch and a credential reference per provider, plus one MCP catalog. `apply` resolves each reference through `ctx.credentials` and the launch environment, then creates one `@tomato/mcp-client` child for every provider that is on with resolvable credentials. Every provider is off by default, so adding the bundle to a profile publishes no tool, process, or prompt text.

`@tomato/client-ui-settings-marketing` renders the section on the Plugins page through `ctx.configForms` and writes each secret through `remote.credentials`, addressed by the reference the section names. A settings save changes the profile patch, which reloads the entry and re-runs `apply` with the new section, so switching a provider on mounts its server and switching it off disposes the child.

`@tomato/marketing-app` is the bundle: a patch with the plugin row and the page row, with no provider configured. It belongs to no shipped profile template.

The catalog is data in `providers.ts` — server name, command, arguments, required and optional env names — and the same table names the settings fields the page stages. A renamed upstream console script is corrected in configuration rather than in code.

## Alternatives considered

**One bundle per provider.** Seven bundles with seven settings namespaces and seven pages duplicate the same decision and multiply the test surface; it lost because the product gain is zero.

**Static MCP rows in the Web bundle.** Rows can be toggled, but their `env` comes from the profile patch, so a person configuring keys in the GUI has no path to the child; it lost because `mcp-client` reads env at connect time and nothing carries a GUI-written secret there.

**Credential references inside `mcp-client`.** Teaching the core client to resolve credentials in `env` would change a package every MCP row uses, for one integration family's benefit; it lost on blast radius.

**Nested per-provider sections in the settings document.** `SettingsFormModel` addresses top-level fields only, so nested sections would have needed a new form model instead of the shared one; it lost on reuse.

## Consequences

- Fields are flat and prefixed; a provider added later adds one switch and its reference fields to `index.ts` and one entry to the catalog.
- A provider that fails to start is reported by `@tomato/mcp-client` in the log; the page reports only credential state, so no page-level diagnostic exists yet.
- The bundle is a workspace package rather than a published one, so the Plugins page does not offer it for on-demand installation; a profile selects it explicitly.
- The composition smoke ([`marketing.composition.spec.ts`](../../../../packages/marketing/marketing/tests/marketing.composition.spec.ts)) boots a headless profile with the row and asserts zero `mcp__` tools, which pins the default-off promise; the mounted path is covered without spawning a server by [`resolve-mounts.spec.ts`](../../../../packages/marketing/marketing/tests/resolve-mounts.spec.ts).