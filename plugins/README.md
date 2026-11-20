# plugins/

English | [中文](README.zh.md)

Standalone plugin sources. One directory is the workspace package the shipped bundles mount; the others are third-party plugins an owner installs into a profile.

| Directory | Content |
|---|---|
| [`ds-bot/`](ds-bot/FORK.md) | DS Bot 0.2.3 adapted for Tomato (Apache-2.0, community plugin) |
| [`tomato-campaign/`](tomato-campaign/README.md) | Tomato Campaign adaptation copy |
| [`tomato-market/`](tomato-market/README.md) | The plugin markets' Host half: reads the open Tomato plugin catalog and the curated marketing catalog, and hands every install to the Plugins page's own dialog (MIT). Its tabs are `@tomato/client-ui-tomato-market` |

Installation is described in each directory. `tomato-market` is a workspace package checked by the repository's tests, type checks, and bilingual pairing; the other copies are installed only when wanted.
