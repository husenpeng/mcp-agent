---
description: "Eleven creator-marketing robot templates for Tomato Rbot and the bundled skills their runs load."
kind: "package-reference"
---

# @tomato/experimental-robot-templates-marketing

English | [中文](README.zh.md)

## Summary

`@tomato/experimental-robot-templates-marketing` contributes creator-marketing robot templates to `ctx.robotTemplates` and the bundled skills those robots load. It provides eleven templates, each with its own skill: brand marketing insight, influencer marketing, creative and competitor intelligence, and one product-selection and one data-insight template each for TikTok, Instagram, X, and YouTube. A template is offered only when its skill ships in this package.

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Further Exploration](#further-exploration)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

The `@tomato/experimental-robot-app` bundle mounts this plugin after the `@tomato/experimental-robot/templates` registry row. It requires `robotTemplates` and `skills` and has no configuration fields.

- Each template appears as a card on the robot page; hiring it publishes a user-owned specification in the page language and instantiates it. Later edits to the robot never change the template, and template updates never change hired robots.
- Every template runs on a manual trigger with a 400,000-token, 30-minute, 300-tool-call budget, the `workspace-write` permission preset, unrestricted network, and a file deliverable: one HTML report and one xlsx workbook in the run's working directory.
- The run instruction supplies what to analyze, such as a brand and its competitors, search keywords, or channel handles.
- Each skill uses an official API when its credential environment variable is set and otherwise a keyless public source; it never logs in to a platform account, passes cookies, or downloads media. Missing credentials and unreachable sources become data-gap lines in the report.

| Skill | Official credentials | Keyless source |
|---|---|---|
| `brand-insight` | `YOUTUBE_API_KEY`; `REDDIT_CLIENT_ID` and `REDDIT_CLIENT_SECRET` | GDELT, Wikimedia Pageviews, Hacker News |
| `influencer-marketing` | `YOUTUBE_API_KEY`; `X_BEARER_TOKEN` | yt-dlp, Instaloader |
| `creative-intelligence` | `META_ACCESS_TOKEN` (Meta Ad Library) | none; `--ads-file` reanalyzes a saved export |
| `tiktok-product-selection` | none | user snapshot CSV, product pages, TikTokApi with `TIKTOK_MS_TOKEN` |
| `tiktok-data-insight` | `TIKTOK_ACCESS_TOKEN` (Display API, authorized account) | TikTokApi with `TIKTOK_MS_TOKEN`, yt-dlp |
| `instagram-product-selection`, `instagram-data-insight` | `META_ACCESS_TOKEN` and `IG_USER_ID` | Instaloader |
| `x-product-selection`, `x-data-insight` | `X_BEARER_TOKEN` (paid per read) | Reddit and Hacker News as substitutes; X is never scraped |
| `youtube-product-selection`, `youtube-data-insight` | `YOUTUBE_API_KEY` | yt-dlp |

[Third-party notices](THIRD_PARTY_NOTICES.md) list the projects the skills install or import.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

`src/templates.ts` builds every template from one shared execution profile and per-template copy in English and Chinese; the mission names the skill to load first. `src/index.ts` reads each `skills/<name>/SKILL.md` at load, rejects a file whose frontmatter `name` differs from its directory, registers one bundled skill provider whose resource base is the skill directory, and registers each template whose skills are all present.

Each skill's Python scripts separate collection (`collect.py`), pure metrics (`metrics.py`), and file output (`report.py`) behind one command-line entry, and each skill copies the helpers it needs instead of importing another skill. The HTML report is self-contained and escapes every value. Missing counts stay empty instead of becoming zero, and every unreachable source becomes a data-gap line in both files.

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

- [`@tomato/experimental-robot`](../robot/README.md) — the template registry and the conversion from template to specification.
- [`@tomato/experimental-robot-app`](../robot-app/README.md) — the bundle that mounts this package.

-----

<a id="model-experience"></a>
## Model Experience

### Robot mission

#### What the model sees

A hired robot's run receives the template's mission, success criteria, and acceptance lines through the runtime's `robot:mission` prompt section. The mission names the skill to load. The skill catalog lists each shipped skill's name and description; the body loads when the model calls the skill.

#### Token effect

The mission section adds roughly 150 to 250 tokens per run. Each shipped skill adds one catalog line; a skill body is 1,000 to 1,500 tokens when loaded.

#### KV Cache effect

The mission is stable for one specification revision. Loading the skill appends its body after the cached prefix.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **Estimates and proxies** — TikTok Shop sales come from sold-count differences between two snapshots, so the first run reports no sales delta; Instagram offers demand signals but no sales; Meta Ad Library returns commercial ads only for EU and UK reach.
- **Untested against live platforms** — each skill's suite runs offline with recorded responses; Graph API, Display API, and X API field names follow the providers' documentation and need one credentialed run to confirm.
- **The runtime does not mount skills from the specification** — `capability.skills` and `capability.network` are stored but not enforced; the mission tells the model which skill to load, and the skill must be visible in the run's skill catalog.
- **Live collection depends on network access** — a skill whose sources are all unreachable exits with status 2 and reports why; public sources such as GDELT rate-limit shared addresses.
- **Platform terms** — public-page collection can conflict with platform terms of service; the skills never log in, rate-limit their requests, and record the source of every metric.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

Run a skill's offline suite with any Python 3.11+ that has XlsxWriter: `python -m unittest discover -s skills/<skill>/tests` from the package directory. The package spec runs every skill's suite when `TOMATO_SKILL_PYTHON` or a `python3.11+` on `PATH` qualifies. The research behind the eleven templates is kept outside the package.

</details>
