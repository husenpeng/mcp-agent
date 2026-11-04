---
name: brand-insight
description: Brand versus competitor insight for marketing reports — share of voice by mentions and by engagement, VADER net sentiment, Wikipedia and news attention trends, discussion topics, positioning keywords, and daily mention spikes with their likely drivers — from GDELT, Wikimedia Pageviews, Hacker News, and optionally Reddit and YouTube, written as an HTML report plus an xlsx workbook. Use for brand health checks, competitor benchmarking, or explaining a mention spike.
---

# Brand insight

Collect public mentions and attention series for a brand and its competitors, compute share of voice, net sentiment, and spikes, and write one HTML report and one xlsx workbook.

## 1. Read the run instruction

Extract from the user's instruction:

- **Brand** — the focus brand; one `--brand`, listed first.
- **Competitors** — each becomes one `--competitor`.
- **Aliases** — product names, tickers, or spellings; each becomes `--alias "Brand=alias"`. Prefer specific aliases for ambiguous names (Notion, Apple) and say the result is noisy otherwise.
- **Wikipedia titles** — when the article title differs from the brand name, `--wiki-article "Brand=Exact_Title"`; for another language use `--wiki-project de.wikipedia`.
- **Market** — GDELT operators such as `--gdelt-filter "sourcecountry:US sourcelang:english"`, and `--region US` for YouTube.
- **Time window** — `--days`, default 30 ending yesterday (UTC); GDELT DOC covers roughly the last 90 days.

If no brand is given, ask for one instead of guessing.

## 2. Prepare the interpreter

Use a Python 3.11 or later that has XlsxWriter. When the `load_workspace_dependencies` tool is available, call it and use its `python` path; otherwise check `python3 --version` and install XlsxWriter alongside the requirements. Install the pinned packages once per run into a scratch directory:

```sh
<python> -m pip install --quiet --target ./.brand-deps -r <skill dir>/scripts/requirements.txt
export PYTHONPATH="$PWD/.brand-deps"
```

`vaderSentiment` scores sentiment and `praw` reads Reddit. If installation fails, the run continues: sentiment is left empty and Reddit is skipped, and both appear as data gaps.

## 3. Choose the source

Keyless sources always run, with a descriptive User-Agent:

- GDELT DOC 2.0 `ArtList` (news article mentions, titles only) and `TimelineVol` (daily share of monitored coverage). GDELT allows one request every five seconds; the script waits and retries HTTP 429 twice, so a five-brand run takes a few minutes.
- Wikimedia Pageviews (daily article views, the search-interest proxy).
- Hacker News Algolia search (stories and comments with points).

Official APIs run only when their keys are set:

- `REDDIT_CLIENT_ID` and `REDDIT_CLIENT_SECRET` → Reddit search through PRAW with application-only, read-only OAuth. Reddit's free Data API tier is for non-commercial use only; the report always states this in its data gaps. Tell the user that commercial use needs a Reddit data agreement.
- `YOUTUBE_API_KEY` → YouTube Data API `search.list` (100 units per brand) for video mentions and the total-results count, plus `videos.list` (1 unit) for likes and comments.

When a key is missing, say exactly which one and what it would add. Never log in with user accounts, pass cookies, or download media.

## 4. Run

```sh
<python> <skill dir>/scripts/brand_insight.py --brand "<brand>" --competitor "<competitor>" \
  --alias "<brand>=<alias>" --days 30 --out ./brand-insight
```

The script prints the HTML path and the xlsx path on stdout and each data gap on stderr. Exit status 2 means no source returned a mention or an attention series: report the stderr reasons and stop.

## 5. Interpret and reply

Open the HTML report, then reply with:

1. The two file paths.
2. Three to five findings grounded in the numbers: the focus brand's share of voice by mentions and by engagement against each competitor, net sentiment and what drives the negative side, attention trends, and each spike with the posts or articles listed as its likely drivers (open them before naming a cause; label unconfirmed causes as likely).
3. The data gaps, verbatim, and what would close them.

Metric definitions (the report repeats them):

- Share of voice = brand metric ÷ sum over the brand and competitors × 100, once with mention counts and once with engagement (Reddit score + comments, Hacker News points + comments, YouTube likes + comments). GDELT articles carry no engagement, so they count only toward mention SOV.
- Sentiment: VADER compound ≥ 0.05 positive, ≤ −0.05 negative, otherwise neutral; reliable for English only.
- Net sentiment (headline formula) = (positive − negative) ÷ (positive + negative) × 100; the report also lists (positive − negative) ÷ all scored mentions × 100. State which one you quote.
- Spike = a day whose z-score, (value − window mean) ÷ population standard deviation, exceeds 2 in the brand's daily mentions, GDELT volume, or pageviews.

Mentions are capped samples, not full counts. Do not invent numbers that the files do not contain; label any estimate as an estimate. This skill does not monitor brand websites; say so if the user asked for site changes.
