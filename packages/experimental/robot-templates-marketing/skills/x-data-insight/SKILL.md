---
name: x-data-insight
description: X account and topic analytics from the official pay-per-use API or, without an X token, from Reddit and Hacker News — account KPIs and peer benchmarks, VADER net sentiment, keyword co-occurrence topic clusters with trend-versus-spike labels, share of voice against named competitors, and outlier posts — written as an HTML report plus an xlsx workbook. Use for X account benchmarking, brand conversation analysis, or competitor share of voice.
---

# X data insight

Collect X account timelines and topic searches, score sentiment, cluster topics, benchmark accounts, measure share of voice, flag outlier posts, and write one HTML report and one xlsx workbook. X is read only through the official API; X web pages are never scraped.

## 1. Read the run instruction

Extract from the user's instruction:

- **Accounts** — X handles; each becomes one `--account @handle`. Ask for at least one peer account when only one is given, because benchmarks need a peer.
- **Topics** — keywords, hashtags, or campaign phrases; each becomes one `--topic`.
- **Brand and competitors** — `--brand "Name=alias1|alias2"` and one `--competitor` per named competitor, with handles and spellings people use. Each name is also searched.
- **Language** — `--lang en` filters X searches. VADER scores English only; other languages are listed as unscored.
- **Limit** — posts per account, topic, and source; default 100, at most 500.
- **X budget** — `--max-reads` caps X reads (posts plus authors); default 2000 ≈ $10 at $0.005 per read.

If no account, topic, brand, or competitor is given, ask for one instead of guessing.

## 2. Prepare the interpreter

Use a Python 3.11 or later that has XlsxWriter. When the `load_workspace_dependencies` tool is available, call it and use its `python` path, which includes XlsxWriter; otherwise check `python3 --version` and install XlsxWriter too. Install PRAW and vaderSentiment once per run into a scratch directory, not into a shared environment:

```sh
<python> -m pip install --quiet --target ./.xdi-deps -r <skill dir>/scripts/requirements.txt
export PYTHONPATH="$PWD/.xdi-deps"
```

If installation fails, continue: the report then lists sentiment as not scored and Reddit as not collected.

## 3. Choose the source

- `X_BEARER_TOKEN` set → X API v2: user lookup plus user timeline (retweets excluded) for each account, and recent search (`/2/tweets/search/recent`, last 7 days, originals only) for each topic and brand, with `tweet.fields=public_metrics,created_at,lang,author_id`, `expansions=author_id`, and `user.fields=public_metrics,created_at`. X has no free tier: every returned post and user object is one read, estimated at $0.005. The rate comes from 2026 secondary sources and must be checked at developer.x.com; the report and the `run` sheet record reads and the estimated cost. Add `--cross-check` to also collect Reddit and Hacker News.
- Not set → X is **not** collected, so account timelines and account KPIs are unavailable. Topic and brand searches use Hacker News Algolia search (keyless) and Reddit through PRAW when `REDDIT_CLIENT_ID` and `REDDIT_CLIENT_SECRET` are set (app-only, read-only; free for non-commercial use only). The data gaps section states that X data was not collected and why. Tell the user that adding `X_BEARER_TOKEN` (paid) gives X data and account KPIs.

twscrape is deliberately not a dependency: it needs user-supplied logged-in X accounts and its automated scraping violates the X terms of service, which risks account suspension. twikit and Scweet are excluded for the same reason. Never log in with user accounts, pass cookies, or download media.

## 4. Run

```sh
<python> <skill dir>/scripts/x_data_insight.py --account @<brand> --account @<peer> --topic "<topic>" --brand "<Brand>=@<brand>|<alias>" --competitor "<Rival>=@<rival>" --lang en --out ./x-data-insight
```

The script prints the HTML path and the xlsx path on stdout, the X read count and cost estimate on stderr, and each data gap on stderr. Exit status 2 means no source returned a post: report the stderr reasons and stop.

## 5. Interpret and reply

Open the HTML report, then reply with:

1. The two file paths, and the X reads and estimated cost (or that X was not called).
2. Three to five findings grounded in the numbers: how each account's engagement rate and cadence compare with peers, which topic clusters are lasting trends versus spikes and their sentiment, who leads share of voice, and what the outlier posts have in common.
3. The data gaps, verbatim, and what would close them.

Metric definitions (the report repeats them):

- Engagement = likes + reposts + replies + quotes on X; score or points + comments on Reddit and Hacker News.
- Account engagement rate = median engagement of sampled posts ÷ followers; like rate (Modash) = median likes of the last 60 days ÷ followers; cadence = posts per week over the sampled span. Follower growth needs snapshots from repeated runs.
- Net sentiment = (positive − negative) ÷ scored mentions × 100, from −100 to +100; VADER compound ≥ 0.05 is positive, ≤ −0.05 negative.
- Share of voice = a brand's mentions (or engagement) ÷ the named brands' total × 100.
- Outlier = engagement ÷ the author's median (≥ 5 sampled posts) or else the source median; ≥ 3 is an outlier.
- Topic class: trend when mentions grow, persist in half the buckets, and come from ≥ 3 authors; spike when one bucket holds half. Buckets are days with X data (recent search covers 7 days), weeks otherwise.

Do not invent numbers; label any estimate as an estimate. Clusters are keyword groups: name each theme from its keywords and example posts.
