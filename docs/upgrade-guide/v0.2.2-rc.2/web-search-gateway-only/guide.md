---
kind: upgrade-guide
description: "Web search and fetch now run only through the signed-in company gateway; the DeepSeek, Exa, and Perplexity providers and the web-search settings page are removed."
---

# Web access runs only through the company gateway

English | [中文](guide.zh.md)

## Change

`@tomato/web-deepseek-api`, `@tomato/web-search-deepseek`, `@tomato/web-search-exa`, and `@tomato/web-search-perplexity` no longer ship. `@tomato/web` selects among the remaining providers: the company gateway's search and fetch providers, and the anonymous HTTP fetch provider. `@tomato/client-ui-settings-web-search` is gone with them, because the gateway origin comes from the launch environment and the gateway holds the vendor credentials, so nothing is left to configure in the GUI.

Selection now takes an ordered candidate list instead of one pinned id. `searchProviders` and `fetchProviders` replace `searchProvider` and `fetchProvider`; the first candidate that is registered and available wins, so a signed-in step uses the gateway while a signed-out step can still fall back to the anonymous HTTP fetch provider. The environment variables `$TOMATO_WEB_SEARCH_PROVIDERS` and `$TOMATO_WEB_FETCH_PROVIDERS` carry the same comma-separated lists. An empty list keeps the previous auto-select rule.

A step without a signed-in gateway session declares neither `web_search` nor `web_fetch` unless `http` is one of its fetch candidates.

## Migration

1. Remove every composed row that names one of the removed packages: `web-deepseek-api`, `web-search-deepseek`, and any `web-search-exa` or `web-search-perplexity` row from profile patches and custom bundles.
2. In the same files, replace the selection fields:

   ```yaml
   - id: web
     config:
       searchProviders: [company]
       fetchProviders: [company, http]
   ```

   Drop `http` from `fetchProviders` if a deployment must not fetch without a signed-in session.
3. Delete any `web-deepseek-api`, `web-search-deepseek`, or `web-search-exa` / `web-search-perplexity` settings keys and the `DEEPSEEK_SEARCH_BASE_URL` variable from profile settings and launch environments; the providers that read them no longer exist.
4. Restart the profile with `tomato --profile <name>`, and run `tomato --profile <name> --dump-config` to confirm the `web` row shows the candidate lists you wrote.
5. Ask for a web search in a signed-in session: the model receives `web_search` and the request reaches the gateway. Sign out, or point the profile at a deployment without a gateway origin: the step declares no `web_search`, and `web_fetch` is admitted only when `http` is among its fetch candidates.
