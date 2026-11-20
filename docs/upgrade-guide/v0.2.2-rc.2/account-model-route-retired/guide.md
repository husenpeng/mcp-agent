---
kind: upgrade-guide
description: "The account LLM route is retired; default model initialization now uses registered third-party API providers, and the account sign-out snapshot is removed."
---

# The account model route is retired

English | [中文](guide.zh.md)

## Change

The product no longer mounts an account-specific LLM provider. `@tomato/llm-deepseek-account` and its `deepseek-account` route are not part of the composition, and the `snapshots/sdk/account-provider-signout` scenario is retired with its fixtures.

`initializeDefaultModel()` now selects the first available model from the registered provider catalog when no provider has a configured API key. It no longer waits for an account login or prefers an account-owned model. Credential checks no longer special-case the account route.

## Migration

1. Configure the third-party API provider and model the deployment should use; the account identity surface does not supply a model route.
2. Remove profile rows or overlays that name `@tomato/llm-deepseek-account`; a missing package no longer has a replacement route.
3. Remove references to the retired `account-provider-signout` snapshot from local tooling. Recorded sessions that mention the old route remain historical records.