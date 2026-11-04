---
name: youtube-data-insight
description: YouTube channel and video analytics for marketing reports — engagement rate, views per hour, outlier videos, and affiliate links — written as an HTML report plus an xlsx workbook. Use for YouTube channel benchmarking, competitor channel analysis, or finding breakout videos for a keyword.
---

# YouTube data insight

Collect public YouTube video metadata for search queries and channels, compute marketing metrics, and write one HTML report and one xlsx workbook. Media is never downloaded.

## 1. Read the run instruction

Extract from the user's instruction:

- **Searches** — keywords or product names; each becomes one `--search`.
- **Channels** — channel ids (`UC…`), handles (`@name`), or channel URLs; each becomes one `--channel`.
- **Limit** — videos per search or channel; default 50, at most 200.
- **Order** — `relevance` (default), `viewCount`, or `date`.
- **Region** — ISO country code for API searches, when the market is named.

If neither a search nor a channel is given, ask for one instead of guessing.

## 2. Prepare the interpreter

Use a Python 3.11 or later that has XlsxWriter. When the `load_workspace_dependencies` tool is available, call it and use its `python` path, which includes XlsxWriter; otherwise check `python3 --version` and install XlsxWriter next to yt-dlp. Install the pinned collector once per run into a scratch directory, not into a shared environment:

```sh
<python> -m pip install --quiet --target ./.yt-deps -r <skill dir>/scripts/requirements.txt
export PYTHONPATH="$PWD/.yt-deps"
```

If installation fails (no network or index access), continue only when `YOUTUBE_API_KEY` is set; the Data API path needs no extra package.

## 3. Choose the source

- `YOUTUBE_API_KEY` set → the script uses the YouTube Data API v3. Budget: a search costs 100 units, everything else 1 unit per call; the free quota is 10,000 units per day. Keep searches × pages under 80 per run.
- Not set → the script lists videos through yt-dlp in flat mode. Likes, comments, and full descriptions are often missing; the report states this in its data gaps section. Tell the user that adding a `YOUTUBE_API_KEY` gives complete counts.

Never log in, pass cookies, or download media.

## 4. Run

```sh
<python> <skill dir>/scripts/youtube_insight.py --search "<query>" --channel "<channel>" --limit 50 --order viewCount --out ./youtube-insight
```

The script prints the HTML path and the xlsx path on stdout and each data gap on stderr. Exit status 2 means no source returned a video: report the stderr reasons and stop.

## 5. Interpret and reply

Open the HTML report, then reply with:

1. The two file paths.
2. Three to five findings grounded in the numbers: which videos are outliers and why they might have broken out (title, length, timing), how median engagement compares across channels, and which affiliate networks dominate.
3. The data gaps, verbatim, and what would close them.

Metric definitions (the report repeats them):

- Engagement rate = (likes + comments) ÷ views.
- VPH = views ÷ hours since publication.
- Outlier = views ÷ median views of the same channel's latest 30 videos in the sample; ≥ 3 is a breakout.

Do not invent numbers that the files do not contain; label any estimate as an estimate.
