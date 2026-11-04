---
name: tiktok-data-insight
description: TikTok account, hashtag, and sound analytics — engagement rate, breakout rate, posting cadence, hashtag growth and acceleration, and Exolyt-style trend vs spike classification — written as an HTML report plus an xlsx workbook. Use for TikTok account benchmarking, competitor accounts, or judging whether a hashtag or sound is a lasting trend.
---

# TikTok data insight

Collect public TikTok account, hashtag, and sound metadata (plus the authorized account's own videos when a Display API token is set), compute marketing metrics, and write one HTML report and one xlsx workbook. Media is never downloaded.

## 1. Read the run instruction

Extract from the user's instruction:

- **Accounts** — handles such as `@brand`; each becomes one `--account`. Benchmarks need at least two, so add a named peer or ask for one.
- **Hashtags** — without `#`; each becomes one `--hashtag`.
- **Sounds** — numeric music ids from a sound URL (`/music/<name>-<id>`); each becomes one `--sound`.
- **Single videos** — video URLs to re-check; each becomes one `--video-url`.
- **Limit** — videos per account, hashtag, or sound; default 30, at most 100.
- **State file** — keep one `--state` path per project, such as `./tiktok-insight-state.json`; follower and hashtag-view growth per day need it across runs.

If no account, hashtag, sound, or video is given and `TIKTOK_ACCESS_TOKEN` is not set, ask for one instead of guessing.

## 2. Prepare the interpreter

Use Python 3.11 or later with XlsxWriter. When the `load_workspace_dependencies` tool is available, call it and use its `python` path; otherwise check `python3 --version` and install XlsxWriter next to the collectors. Install the pinned collectors once per run into a scratch directory:

```sh
<python> -m pip install --quiet --target ./.tti-deps -r <skill dir>/scripts/requirements.txt
export PYTHONPATH="$PWD/.tti-deps"
<python> -m playwright install chromium
```

If installation fails, continue only when `TIKTOK_ACCESS_TOKEN` is set; the Display API path needs no extra package.

## 3. Choose the source

- `TIKTOK_ACCESS_TOKEN` set → the TikTok Display API (`/v2/user/info/`, `/v2/video/list/`) reads the profile and videos of the account that authorized the token (scopes `user.info.basic`, `user.info.profile`, `user.info.stats`, `video.list`). It never reads other accounts.
- `TIKTOK_MS_TOKEN` set → public accounts, hashtags, and sounds through TikTokApi. It is an **unofficial** wrapper that drives a headless Playwright browser; TikTok rate-limits it and may block it at any time. The token is the `msToken` cookie of a logged-out tiktok.com visit.
- Neither → only `--video-url` checks run, through yt-dlp metadata extraction. Tell the user which variable would add the missing data.

The TikTok Research API is academic-only and is not used. Never log in, pass account cookies, or download media.

## 4. Run

```sh
<python> <skill dir>/scripts/tiktok_insight.py --account @brand --account @peer --hashtag lipoil \
  --sound 7016547803243022337 --limit 30 --state ./tiktok-insight-state.json --out ./tiktok-insight
```

Breakout and classification thresholds can be overridden with `--thresholds overrides.json`, for example `{"breakout_multiple": 5, "trend_min_creators": 10}`.

The script prints the HTML and xlsx paths on stdout and each data gap on stderr. Exit status 2 means nothing was collected: report the stderr reasons and stop. On the first run, follower and hashtag-view growth per day are blank; they appear when the same `--state` is reused.

## 5. Interpret and reply

Open the HTML report, then reply with:

1. The two file paths.
2. Three to five findings grounded in the numbers: how each account's median views, engagement, breakout rate, and cadence compare with the peer median; what the breakout videos share; which hashtags or sounds are lasting trends versus spikes or fads, and why (growth, creators, active weeks).
3. The data gaps, verbatim, and what would close them.

Metric definitions (the report repeats them):

- Engagement rate = (likes + comments) ÷ views; follower ER (Modash) = median likes of the last 60 days ÷ followers.
- Breakout rate = share of videos with views > 3 × the account's median views.
- Posting cadence = posts per week over the sampled span, median gap in days, and best posting hour (UTC).
- Hashtag growth = posts in the last 7 (28) days ÷ the previous 7 (28) − 1; acceleration = this week's 7-day growth − last week's.
- Trend = growing, posted in at least 3 of the last 4 weeks, by at least 5 creators; spike = half the posts within 3 days or one creator dominating; fad = latest week below half the peak week.

Do not invent numbers that the files do not contain; label any estimate as an estimate.
