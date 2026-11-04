---
name: instagram-data-insight
description: Instagram profile, post, and Reels analytics for marketing reports — engagement rate, format comparison, posting-hour heatmap, hashtag contribution, peer benchmarks, and growth between runs — written as an HTML report plus an xlsx workbook. Use for Instagram account health checks, competitor benchmarking, or content-format analysis.
---

# Instagram data insight

Collect public Instagram profiles and their recent posts, compute marketing metrics, and write one HTML report and one xlsx workbook. Media is never downloaded.

## 1. Read the run instruction

Extract from the user's instruction:

- **Accounts** — usernames, `@name`, or profile URLs to analyze; each becomes one `--account`.
- **Competitors** — peer accounts; each becomes one `--competitor`. Add at least one, because the benchmark needs a peer.
- **Limit** — recent posts per account; default 30 on the official path, 12 on the keyless path, which caps it at 50.
- **Timezone** — hours from UTC of the audience's market; becomes `--utc-offset`, default 0.
- **State file** — use a stable path such as `./instagram-insight/state.json` for `--state` so a later run can compute growth.

If no account is given, ask for one instead of guessing. This skill reads accounts only; for hashtag or product demand, use `instagram-product-selection`.

## 2. Prepare the interpreter

Use Python 3.11 or later with XlsxWriter. When the `load_workspace_dependencies` tool is available, call it and use its `python` path; otherwise check `python3 --version` and install XlsxWriter next to instaloader. Install the pinned collector once per run into a scratch directory, not into a shared environment:

```sh
<python> -m pip install --quiet --target ./.ig-deps -r <skill dir>/scripts/requirements.txt
export PYTHONPATH="$PWD/.ig-deps"
```

If installation fails (no network or index access), continue only when both `META_ACCESS_TOKEN` and `IG_USER_ID` are set; the Graph API path needs no extra package.

## 3. Choose the source

- `META_ACCESS_TOKEN` and `IG_USER_ID` both set → the script uses Business Discovery (`/{ig-user-id}?fields=business_discovery.username(x){followers_count,media_count,media{...}}`). It reads only Business and Creator accounts; a personal account fails with a data gap. Budget: about 200 calls per user per hour. Views cover Reels only.
- Either one missing → the script iterates public profiles through instaloader anonymously, with a pause between posts (`--sleep`, default 3 seconds) and no login. Each post costs one request, and Instagram often refuses anonymous reads; the script stops instead of waiting out a long rate limit and keeps the posts it already has. Tell the user exactly which variable is missing and that it gives a compliant, steadier source.

Never log in, pass cookies or session files, or download media. Anonymous collection carries Terms of Use risk; the report says so and marks each account's source.

## 4. Run

```sh
<python> <skill dir>/scripts/instagram_insight.py --account "<name>" --competitor "<peer>" --utc-offset 8 --state ./instagram-insight/state.json --out ./instagram-insight
```

The script prints the HTML path and the xlsx path on stdout and each data gap on stderr. Exit status 2 means no source returned a post: report the stderr reasons and stop.

## 5. Interpret and reply

Open the HTML report, then reply with:

1. The two file paths.
2. Three to five findings grounded in the numbers: how engagement and cadence compare with peers, which format and posting hours lead, which hashtags contribute, and which are lasting trends versus spikes.
3. The data gaps, verbatim, and what would close them.

Metric definitions (the report repeats them):

- Engagement rate = (likes + comments + saves + shares) ÷ followers, with reach as the denominator when a post has it. Neither source returns saves, shares, or reach, so reports show (likes + comments) ÷ followers.
- Modash engagement rate = median likes of the last 60 days' posts ÷ followers.
- Hashtag contribution index = mean engagement of posts with the hashtag ÷ the account's mean engagement.
- Trend labels = `lasting` (3 or more active weeks of 4), `spike` (fewer), `insufficient` (under 3 posts).
- Growth = change since the `--state` snapshot of an earlier run. Without a snapshot there is no growth number; never derive one from post dates. The first run writes the baseline.

Do not invent numbers that the files do not contain; label any estimate as an estimate.
