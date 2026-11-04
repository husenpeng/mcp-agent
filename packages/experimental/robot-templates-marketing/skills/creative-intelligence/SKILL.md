---
name: creative-intelligence
description: Competitor ad intelligence from the Meta Ad Library API — days running, copy-variant clusters, weekly new-ad intensity, CTA and format mix, rule-based hook classification, optional landing-page offers, and draft creative briefs — written as an HTML report plus an xlsx workbook. Use to find a competitor's long-running ads, break down their hooks, and draft briefs to test.
---

# Creative intelligence

Collect competitor ads from the Meta Ad Library API, cluster copy variants, rank long-running creatives, tag hooks and CTAs with a transparent rule lexicon, optionally read landing pages, and write one HTML report and one xlsx workbook with at least three draft creative briefs. Media is never downloaded.

## 1. Read the run instruction

Extract from the user's instruction:

- **Competitors** — brand or product names, each one `--search`; or Facebook page ids, each one `--page-id` (batched 10 per query).
- **Markets** — ISO country codes, each one `--country` (default `GB`). Commercial ads come back only for EU member states and the UK; name this limit whenever another market is requested.
- **Time window** — `--since` and `--until` as `YYYY-MM-DD` (delivery dates).
- **Landing pages** — add `--landing-pages` when the user wants offers compared; `--landing-limit` caps fetched domains (default 5). The script fetches the home page of each domain linked in the ad copy (HTML only, no scripts run) and extracts the title, meta description, og:title and og:description, the first h1 and h2, visible text, price strings ($, €, £, ¥, ₹, 円, 元, R$, ISO codes), offer phrases, and button and CTA link texts. Pages rendered by JavaScript yield only their meta tags; the report lists them as a data gap.
- **Saved export** — a previous `ads_archive` JSON or JSON-lines file as `--ads-file`, for offline re-analysis.

If neither a competitor nor a saved file is given, ask for one instead of guessing.

## 2. Prepare the interpreter

Use a Python 3.11 or later that has XlsxWriter. When the `load_workspace_dependencies` tool is available, call it and use its `python` path, which includes XlsxWriter; otherwise check `python3 --version` and install XlsxWriter. The scripts need nothing else: Ad Library calls and landing-page fetches use `urllib`, and landing pages are parsed with `html.parser`. `scripts/requirements.txt` is intentionally empty, so no `pip install` step is required.

## 3. Choose the source

- `META_ACCESS_TOKEN` set → Graph API v21.0 `ads_archive` with `ad_type=ALL`, `ad_active_status=ALL`, the required `ad_reached_countries`, and the fields `ad_creative_bodies`, `ad_creative_link_titles`, `ad_delivery_start_time`, `ad_delivery_stop_time`, `ad_snapshot_url`, `page_name`, `publisher_platforms`, `languages`. The token needs Ad Library API access, which Meta grants after identity verification.
- Not set → there is no keyless ad source. Tell the user exactly that `META_ACCESS_TOKEN` is missing and how to get one (developers.facebook.com app plus identity verification at facebook.com/ID), or ask for a saved export to pass as `--ads-file`.
- Never scrape the Ad Library website, the TikTok Creative Center, or any login-gated page; never download images or video. Snapshot URLs stay links.

## 4. Run

```sh
<python> <skill dir>/scripts/creative_intelligence.py --search "<competitor>" --country DE --country FR --since 2026-08-01 --landing-pages --out ./creative-intelligence
```

The script prints the HTML path and the xlsx path on stdout and each data gap on stderr. Exit status 2 means no ad was collected: report the stderr reasons and stop.

The workbook sheets are `ads`, `creative_tags`, `clusters`, `landing_pages`, `frames_index` (snapshot links; frames are not extracted because media download is off), `briefs`, and `run`.

## 5. Interpret and reply

Open the HTML report, then reply with:

1. The two file paths.
2. Three to five findings grounded in the numbers: the longest-running clusters and their hook text, which hook types and CTAs dominate per competitor, the weekly new-ad trend, and landing-page offers when fetched.
3. The brief stubs, refined: the report's briefs are rule-generated **DRAFT** templates. Rewrite at least three into usable briefs (audience, key benefit, opening line, shot list, variants), keep each brief's citation of the cluster and ad ids it draws on, and keep calling them drafts until the user approves.
4. The coverage statement: commercial ads are covered only for the EU and the UK.
5. The data gaps, verbatim, and what would close them.

Metric definitions (the report repeats them):

- Days running = (delivery stop date or today) − delivery start date.
- Variant cluster = ads whose normalized first body shares word 3-gram shingles with Jaccard ≥ 0.8 (single link).
- Heat = 0.6 × z(max days running) + 0.4 × z(variants); no engagement data exists for competitor ads.
- Weekly intensity = new ads per ISO week of delivery start.
- Hook = first matching rule on the first sentence, in priority order: price shock, social proof, UGC/testimonial, contrast, pain point, question; otherwise statement. The report prints every rule.
- Format is a proxy from the returned fields; the API returns no media type.

Do not invent numbers that the files do not contain; label heat and format as proxies.
