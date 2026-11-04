---
name: x-product-selection
description: Product and trend discovery from X posts (official pay-per-use API) or, without an X token, from Reddit and Hacker News — product entity extraction with alias merging, e-commerce link domains, demand signals, and a z-score trend score — written as an HTML report plus an xlsx workbook. Use to find products with rising buzz for a category or keyword.
---

# X product selection

Search recent posts for seed keywords, extract the products they mention, merge aliases, classify commerce links, score each product's trend, and write one HTML report and one xlsx workbook. X is read only through the official API; X web pages are never scraped.

## 1. Read the run instruction

Extract from the user's instruction:

- **Keywords** — category words or product phrases; each becomes one `--keyword`. Use English terms when the market is English-speaking.
- **Known products** — products, brands, or competitor items with spellings people use; each becomes one `--product "Name=alias1|alias2"`. These always appear in the ranking.
- **Market and language** — `--lang en` (an X language code) filters X searches.
- **Price band** — passed as `--price-band`; recorded in the cost-assumptions sheet.
- **Limit** — posts per keyword per source; default 100, at most 500.
- **X budget** — `--max-reads` caps X reads (posts plus authors); default 2000 ≈ $10 at $0.005 per read.

If no keyword is given, ask for one instead of guessing.

## 2. Prepare the interpreter

Use a Python 3.11 or later that has XlsxWriter. When the `load_workspace_dependencies` tool is available, call it and use its `python` path, which includes XlsxWriter; otherwise check `python3 --version` and install XlsxWriter next to PRAW. Install the pinned dependency once per run into a scratch directory, not into a shared environment:

```sh
<python> -m pip install --quiet --target ./.xps-deps -r <skill dir>/scripts/requirements.txt
export PYTHONPATH="$PWD/.xps-deps"
```

If installation fails, continue: X and Hacker News need only the standard library; only the Reddit source is lost, and the report records it.

## 3. Choose the source

- `X_BEARER_TOKEN` set → X API v2 recent search (`/2/tweets/search/recent`, last 7 days, originals only) with `tweet.fields=public_metrics,created_at,lang,author_id`, `expansions=author_id`, and `user.fields=public_metrics,created_at`. X has no free tier: every returned post and author object is one read, estimated at $0.005. The rate comes from 2026 secondary sources and must be checked at developer.x.com; the report and the `run` sheet record reads and the estimated cost. Add `--cross-check` to also collect Reddit and Hacker News.
- Not set → X is **not** collected. The script uses Hacker News Algolia search (keyless) and Reddit through PRAW when `REDDIT_CLIENT_ID` and `REDDIT_CLIENT_SECRET` are set (app-only, read-only; free for non-commercial use only). The data gaps section states that X data was not collected and why. Tell the user that adding `X_BEARER_TOKEN` (paid) gives X data, and Reddit credentials add Reddit.

twscrape is deliberately not a dependency: it needs user-supplied logged-in X accounts and its automated scraping violates the X terms of service, which risks account suspension. twikit and Scweet are excluded for the same reason. Never log in with user accounts, pass cookies, or download media.

## 4. Run

```sh
<python> <skill dir>/scripts/x_product_selection.py --keyword "<keyword>" --product "<Name>=<alias>|<alias>" --lang en --out ./x-product-selection
```

The script prints the HTML path and the xlsx path on stdout, the X read count and cost estimate on stderr, and each data gap on stderr. Exit status 2 means no source returned a post: report the stderr reasons and stop.

## 5. Interpret and reply

Open the HTML report, then reply with:

1. The two file paths, and the X reads and estimated cost (or that X was not called).
2. Three to five findings grounded in the numbers: which products are validated and why (trend score, spread across authors and communities), which demand signals dominate (requests, where-to-buy, complaints), and which commerce domains carry the links.
3. The data gaps, verbatim, and what would close them.

Metric definitions (the report repeats them):

- Engagement = likes + reposts + replies + quotes on X; score or points + comments on Reddit and Hacker News.
- Trend score = (current mentions − baseline mean) ÷ max(baseline standard deviation, 1) × ln(1 + total engagement). With X data the buckets are days (last 24 hours against the prior 6 days), because recent search covers only 7 days; otherwise weeks (this week against the prior 4 weeks).
- Status: validated when the trend score is positive and the product spread to ≥ 3 authors in ≥ 2 communities; watch when one holds; rejected otherwise.
- Opportunity = 100 × (0.5 trend + 0.3 ln engagement + 0.2 demand posts), each min-max scaled across candidates.

Discussion sources carry no sales: never present mentions as sales or GMV, and label every estimate as an estimate. Entity extraction is rule-based; review the top names and rerun with `--product` aliases when a brand or person was picked up as a product.
