---
kind: upgrade-guide
description: "The plugin markets ship as the @tomato/plugin-tomato-market bundle in the Web and Desktop profiles; the separately installed tomato-market plugin is retired."
---

# Plugin markets ship with the Web and Desktop profiles

English | [中文](guide.zh.md)

## Change

The Marketing plugins and General plugins tabs used to need a separately packed plugin, `tomato-market`, added to a profile with `tomato plugin add`. Its browser half could not load through the client module table, so a profile that listed it still showed no tabs.

That bundle is now `@tomato/plugin-tomato-market`, a workspace package mounted by the Web template, which the Desktop profile starts from. A new Web or Desktop profile therefore shows **General market** and **Marketing market** between **Installed** and **Discover** with nothing installed. The browser half is the client package `@tomato/client-ui-tomato-market`.

`@tomato/plugin-tomato-market` owns the host routes; its client package renders the tabs. A profile that drops the bundle's rows loses both tabs, and one that keeps them elsewhere needs both.

## Migration

1. Start each profile once with `tomato --profile <name>`. A Desktop profile still naming `tomato-market` is rewritten to `@tomato/plugin-tomato-market`; no manual edit is needed. A profile that pins the package must change the entry to `@tomato/plugin-tomato-market`.
2. Remove a `tomato-market` entry from the profile's `package.json` dependencies with `tomato plugin --profile <name> remove tomato-market`; the former package ships no bundle this release loads.
3. Keep overrides on the market's row under its new id, `plugin-tomato-market`. The `tomato-market` config fields `indexUrls`, `starUrls`, `timeoutMs`, `cacheTtlMs`, and `skillRoot` keep their names and defaults.
4. Confirm: the Plugins page lists **General market** and **Marketing market** after **Installed**, and `tomato --profile <name> --dump-config` shows the `plugin-tomato-market` row mounted.
