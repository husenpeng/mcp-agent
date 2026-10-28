---
kind: upgrade-guide
description: "Harness-owned DSH/dsh names are now TOMATO/tomato. Move environment, data, commands, and plugin manifests before starting the new build."
---

# Harness names are now Tomato

English | [中文](guide.zh.md)

## Change

Every name this repository owns changed from `DSH` / `dsh` to `TOMATO` / `tomato`. The old spellings are not read and no alias remains.

| Surface | Before | After |
|---|---|---|
| npm scope | `@deepseek-ai/*` | `@tomato/*` |
| Environment namespace | `DSH_*` | `TOMATO_*` |
| Harness home | `~/.dsh` | `~/.tomato` |
| CLI command | `dsh` | `tomato` |
| Manifest field | `"dsh"` | `"tomato"` |
| Settings keys | `dsh.*` | `tomato.*` |
| URL schemes | `dsh-app://`, `dsh-resource://`, `dsh-session:` | `tomato-app://`, `tomato-resource://`, `tomato-session:` |
| Release tags | `dsh-v<version>` | `tomato-v<version>` |
| Desktop app ID | `com.deepseek.dsh` | `vip.tomatoai.desktop` |
| Local desktop build ID | `com.deepseek.harness` | `vip.tomatoai.harness` |

DeepSeek's own identity did not change: `DEEPSEEK_API_KEY`, `DEEPSEEK_BASE_URL`, `api.deepseek.com`, `deepseek-*` model ids, the `deepseek-official` / `deepseek-account` / `deepseek-api-key` provider ids, and the `deepseek` adapter package leaves. The real third-party packages under `@deepseek-ai/libreoffice-kit*` also keep their names.

## Migration

1. Rename the home directory: `mv ~/.dsh ~/.tomato`. Without this, the new build starts with no sessions, settings, credentials, or profiles, while the old data stays untouched in `~/.dsh`.
2. Replace `DSH_` with `TOMATO_` in shell profiles, `.env` files, CI secrets, and packaging configuration. `DSH_HOME` is now `TOMATO_HOME`; desktop packaging variables such as `DSH_DESKTOP_APP_ID` are now `TOMATO_DESKTOP_APP_ID`.
3. Change commands from `dsh` to `tomato`, including `dsh web`, `dsh --profile`, and scripts that call the installed `dsh` / `dsh.cmd` launcher. Reinstall the installed command from the new package.
4. Update plugin and profile manifests: the package field is `"tomato"` and profile bundle lists live under `tomato.profile.bundles`; package names use the `@tomato/*` scope and drop the `dsh-` prefix, for example `@deepseek-ai/dsh-agent` becomes `@tomato/agent`.
5. Reinstall profile packages after the rename; the old lockfiles and package links reference names that no longer exist.
6. A desktop installation using the new app ID is a separate application. The previous build is not replaced in place, and its update feed no longer applies.

## Verification

- `tomato --version` resolves through the new launcher.
- `TOMATO_HOME` points at the renamed home and sessions appear in the sidebar.
- A model route configured under `tomato.profile.bundles` loads after the profile reload.