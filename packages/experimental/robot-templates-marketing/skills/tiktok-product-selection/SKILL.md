---
name: tiktok-product-selection
description: TikTok Shop product selection from sold-count snapshots — daily sold and GMV by snapshot difference, hashtag content heat, keyword-trend dual validation, and a FastMoss-style margin model — written as an HTML report plus an xlsx workbook. Use to rank TikTok Shop candidate products for a category, keyword, market, or price band.
---

# TikTok product selection

Rank TikTok Shop candidate products from repeated sold-count snapshots, hashtag video heat, and keyword search interest, then write one HTML report and one xlsx workbook. Sales and margins are estimates. Media is never downloaded.

## 1. Read the run instruction

Extract from the user's instruction:

- **Products** — a snapshot CSV path (`product_id,title,price,sold_count,captured_at`, optional `category,keyword,shop,cogs`) → `--snapshot-csv`; or product page URLs the user names → `--product-url`. Fetch only URLs the user gives.
- **Keywords** — product words such as `lip oil`; each becomes one `--keyword`. Override the derived hashtag with `--hashtag "lip oil=lipoil"`.
- **Search interest** — a `keyword,date,value` CSV exported from TikTok Creative Center keyword insights or Google Trends → `--trend-csv`.
- **Category** — selects the creator-commission median (`--category beauty`).
- **Price band** — `--price-min`, `--price-max`.
- **State file** — keep one `--state` path per project, such as `./tiktok-state.json`, and reuse it on every run.

If neither a snapshot CSV nor a product URL is given, ask for one. Do not scrape TikTok Creative Center or Shop search pages to build the product pool.

## 2. Prepare the interpreter

Use Python 3.11 or later with XlsxWriter. When the `load_workspace_dependencies` tool is available, call it and use its `python` path; otherwise check `python3 --version` and install XlsxWriter next to the collector. Install the pinned collector once per run into a scratch directory:

```sh
<python> -m pip install --quiet --target ./.tt-deps -r <skill dir>/scripts/requirements.txt
export PYTHONPATH="$PWD/.tt-deps"
<python> -m playwright install chromium
```

If installation fails, continue without content heat: snapshots, trends, and margins need only the standard library.

## 3. Choose the source

TikTok has no official API for Shop sales or hashtag statistics that permits this use; the Research API is academic-only.

- Sold counts come from the user's CSV or from `--product-url` pages fetched over plain HTTP. The script reads price and title from JSON-LD `Product.offers`; a page without JSON-LD or without a visible sold count is a data gap — ask the user to record those products in the CSV instead.
- `TIKTOK_MS_TOKEN` set → hashtag views and recent videos through TikTokApi. It is an **unofficial** wrapper that drives a headless Playwright browser; TikTok rate-limits it and may block it at any time. The token is the `msToken` cookie of a logged-out tiktok.com visit.
- Not set → content heat is missing and dual validation can only return `watch`. Tell the user that setting `TIKTOK_MS_TOKEN` adds it.

Never log in, pass account cookies, or download media.

## 4. Run

```sh
<python> <skill dir>/scripts/tiktok_selection.py --snapshot-csv products.csv --keyword "lip oil" \
  --trend-csv trends.csv --category beauty --state ./tiktok-state.json --out ./tiktok-selection
```

Margin and scoring defaults (6% platform fee, $3.57 fulfillment, category commission medians beauty 15% / womenswear 10% / health 20% / fashion accessories 8% / sports & outdoor 10%, score weights) can be overridden with `--assumptions overrides.json`, for example `{"cogs_rate": 0.25, "commission_by_category": {"home": 0.12}}`.

The script prints the HTML and xlsx paths on stdout and each data gap on stderr. Exit status 2 means no product snapshot was collected: report the stderr reasons and stop.

**First run.** With one snapshot per product there is no delta: daily sold and GMV are blank and the report says so. Tell the user to run again with the same `--state` after at least one day; the second run computes the deltas.

## 5. Interpret and reply

Open the HTML report, then reply with:

1. The two file paths.
2. Three to five findings grounded in the numbers: which products are validated and why, where GMV is concentrated (CR3), which candidates have heat without search interest (or the reverse), and which margins break once commission and fulfillment are paid.
3. The data gaps, verbatim, and what would close them (second snapshot, `TIKTOK_MS_TOKEN`, a trend CSV, more products).

Metric definitions (the report repeats them):

- Daily sold = (sold_t − sold_t−1) ÷ days between snapshots; GMV ≈ sold × price (estimate).
- Dual validation: content heat growing AND keyword trend slope > 0 with p < 0.1 → validated; heat not growing and slope ≤ 0 → rejected; anything else → watch.
- Net margin = price − COGS − platform fee − creator commission − fulfillment − ads − return reserve (estimate).

Do not invent numbers that the files do not contain; label every sales and margin figure as an estimate.
