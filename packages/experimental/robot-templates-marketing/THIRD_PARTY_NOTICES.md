# Third-party notices

The skills in this package install the following open-source projects at run time with pip, from the exact versions in each skill's `scripts/requirements.txt`, or import them from the Tomato bundled Python runtime. No third-party source code is copied into this package.

## yt-dlp

- Project: https://github.com/yt-dlp/yt-dlp
- Version: 2026.10.26 (pinned in `skills/youtube-data-insight/scripts/requirements.txt`)
- Use: installed by `youtube-data-insight`, `youtube-product-selection`, `influencer-marketing`, and `tiktok-data-insight` into a run-local directory and called through its Python API to read public video metadata without downloading media.
- License: The Unlicense

```text
This is free and unencumbered software released into the public domain.

Anyone is free to copy, modify, publish, use, compile, sell, or
distribute this software, either in source code form or as a compiled
binary, for any purpose, commercial or non-commercial, and by any
means.

In jurisdictions that recognize copyright laws, the author or authors
of this software dedicate any and all copyright interest in the
software to the public domain. We make this dedication for the benefit
of the public at large and to the detriment of our heirs and
successors. We intend this dedication to be an overt act of
relinquishment in perpetuity of all present and future rights to this
software under copyright law.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR
OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

For more information, please refer to <http://unlicense.org/>
```

## TikTokApi

- Project: https://github.com/davidteather/TikTok-Api
- Version: 7.3.3
- Use: installed by `tiktok-product-selection` and `tiktok-data-insight` for public hashtag, account, and sound metadata.
- License: MIT, Copyright (c) 2019 David Teather.

## Instaloader

- Project: https://github.com/instaloader/instaloader
- Version: 4.16
- Use: installed by `instagram-product-selection`, `instagram-data-insight`, and `influencer-marketing` for anonymous reads of public profiles and posts; the skills never log in.
- License: MIT, Copyright (c) 2016-2026 Alexander Graf, André Koch-Kramer and the Instaloader contributors.

## PRAW

- Project: https://github.com/praw-dev/praw
- Version: 8.0.3
- Use: installed by `brand-insight`, `x-product-selection`, and `x-data-insight` for read-only Reddit search when Reddit API credentials are set.
- License: BSD-2-Clause, Copyright (c) 2016, Bryce Boe.

## VADER sentiment

- Project: https://github.com/cjhutto/vaderSentiment
- Version: 3.3.2
- Use: installed by `brand-insight` and `x-data-insight` to score English sentiment.
- License: MIT, Copyright (c) 2016 C.J. Hutto.

## XlsxWriter

- Project: https://github.com/jmcnamara/XlsxWriter
- Use: imported from the Tomato bundled Python runtime to write xlsx workbooks; not installed by this package.
- License: BSD-2-Clause, Copyright (c) 2013-2025, John McNamara.

## Packages pip installs alongside them

pip resolves these as dependencies of the projects above; they are installed with them at run time and are not part of this package: playwright (Apache-2.0), requests (Apache-2.0), httpx and httpcore (BSD-3-Clause), idna (BSD-3-Clause), prawcore and update_checker (BSD-2-Clause), websocket-client (Apache-2.0), urllib3, charset-normalizer, anyio, h11, pyee, proxyproviders (MIT), greenlet (MIT AND PSF-2.0), typing_extensions and defusedxml (PSF-2.0), and certifi (MPL-2.0, used unmodified as the CA bundle that requests loads).
