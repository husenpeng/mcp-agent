# Third-Party Notices — @tomato/experimental-robot-templates-knowledge-work

The `plugins/` directory is a byte-for-byte copy of Anthropic's [knowledge-work-plugins](https://github.com/anthropics/knowledge-work-plugins) repository at commit `e605d8ddbfb688da57dfaaceebd93f12a64ef1d3` (2026-11-09).

| Upstream | Vendored path | License | Copyright |
| --- | --- | --- | --- |
| `anthropics/knowledge-work-plugins` | `plugins/` | Apache-2.0 | Anthropic PBC |

Eleven vendored role directories carry their own `LICENSE` file, all identical to [`LICENSE-APACHE-2.0`](LICENSE-APACHE-2.0), which is the complete Apache License 2.0 text redistributed with this package. The vendored content is unmodified; the adaptation happens at load time in `src/`, which is licensed with this package under MIT.

The sixteen English and Chinese role card texts in `src/templates.ts` are this package's own copy and are not derived from the upstream repository.
