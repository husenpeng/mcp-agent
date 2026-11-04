---
name: influencer-marketing
description: Creator discovery and vetting for influencer campaigns — YouTube niche discovery, TikTok/Instagram/X handle enrichment, Modash-style engagement with tier benchmarks, a transparent audience-quality heuristic, CPM-based rate estimates, TF-IDF lookalikes, and MX-checked public business emails — written as an HTML report plus an xlsx workbook with an outreach log. Use to build or vet a creator shortlist for a niche, market, or seed creator.
---

# Influencer marketing

Discover and vet creators, rank lookalikes, estimate rates, and extract publicly listed business emails; write one HTML report and one xlsx workbook. Media is never downloaded and no account is logged in.

## 1. Read the run instruction

Extract from the user's instruction:

- **Niches** — keywords for YouTube channel discovery; each becomes one `--niche`.
- **Seed creators** — YouTube channel ids (`UC…`), `@handles`, or URLs; each becomes one `--channel`. Seeds anchor the lookalike ranking.
- **Handle list** — TikTok, Instagram, X (and optionally YouTube) handles. Write them to a CSV with `platform,handle` columns (optional `seed` column with `yes`) and pass `--creators <file>`.
- **Follower tier** — `--min-followers` / `--max-followers` (nano 1k–10k, micro 10k–100k, mid 100k–1M, mega 1M+).
- **Market** — ISO country code as `--region` for API channel search.
- **Budget assumptions** — CPM overrides as `--cpm youtube=20-40` (USD).
- **Limits** — `--limit` channels per niche (default 20), `--posts` recent posts per creator (default 30).

If no niche, seed, or handle list is given, ask for one instead of guessing.

## 2. Prepare the interpreter

Use a Python 3.11 or later that has XlsxWriter. When the `load_workspace_dependencies` tool is available, call it and use its `python` path, which includes XlsxWriter; otherwise check `python3 --version` and install XlsxWriter next to the collectors. Install the pinned collectors once per run into a scratch directory:

```sh
<python> -m pip install --quiet --target ./.im-deps -r <skill dir>/scripts/requirements.txt
export PYTHONPATH="$PWD/.im-deps"
```

If installation fails, continue only when `YOUTUBE_API_KEY` is set and the run has no TikTok or Instagram handles; say which sources are unavailable.

## 3. Choose the source

- **YouTube** — `YOUTUBE_API_KEY` set → Data API v3 (`search.list type=channel` costs 100 units; `channels.list`, `playlistItems.list`, `videos.list` cost 1 unit each; 10,000 units per day). Not set → yt-dlp `ytsearch` in flat mode for discovery and each channel's `/videos` tab; subscriber counts, likes, comments, and dates are often missing. Tell the user that a `YOUTUBE_API_KEY` gives complete counts.
- **TikTok** — yt-dlp profile video list. Follower counts and bios are not exposed, so engagement, view/follower ratio, and emails stay empty for TikTok; the report says so.
- **Instagram** — instaloader anonymous profile. Instagram often rate-limits anonymous requests (HTTP 401/429); the creator is then reported as a data gap. Do not retry with a login.
- **X** — X API v2 only when `X_BEARER_TOKEN` is set; otherwise X handles are skipped and listed as a data gap.
- **MX check** — DNS-over-HTTPS to `https://dns.google/resolve`; `--no-mx` skips it.

Never log in, pass cookies, or download media.

## 4. Run

```sh
<python> <skill dir>/scripts/influencer_marketing.py --niche "<niche>" --channel "<seed>" --creators handles.csv --min-followers 10000 --max-followers 500000 --out ./influencer-marketing
```

The script prints the HTML path and the xlsx path on stdout and each data gap on stderr. Exit status 2 means no creator was collected: report the stderr reasons and stop.

The workbook sheets are `creators`, `posts`, `audience_sample`, `lookalikes`, `contacts`, `outreach_log` (a template pre-filled with each valid email and status `not_contacted`), `benchmarks`, and `run`.

## 5. Interpret and reply

Open the HTML report, then reply with:

1. The two file paths.
2. Three to five findings grounded in the numbers: the strongest fits and why (engagement band within tier, heuristic score, seed similarity), creators whose heuristic signals look anomalous, the rate range for the shortlist, and how many verified public emails were found.
3. The data gaps, verbatim, and what would close them (an API key, a bearer token, or a manual check).

Metric definitions (the report repeats them):

- Engagement rate (Modash) = median likes of posts in the last 60 days ÷ followers × 100; tier bands come from Modash's Instagram benchmark table and are a reference only for other platforms.
- Percentile = mid-rank percentile of the engagement rate within this sample, overall and within the same tier.
- Audience-quality heuristic (0–100) = equal-weight mean of available signals: likes/comment ratio band, median views ÷ followers, and posting-interval regularity. It is a heuristic from public counts, not a fake-follower audit; always call it a heuristic.
- Rate estimate = CPM range × median views ÷ 1000, in USD per post; label it an estimate.
- Lookalikes = TF-IDF cosine similarity of names, bios, and post titles.

Only emails the creator published in a bio or channel description are extracted; MX success does not prove the mailbox exists. Remind the user that outreach must follow CAN-SPAM and GDPR. Do not invent numbers that the files do not contain.
