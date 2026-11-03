/**
 * Image evidence card plugin, node half. Pure UI plugin: the empty apply
 * exists so the row appears in the host `cordis.yml` / Loader; the browser
 * half ships via `exports["./client"]`, discovered through the package.json
 * `tomato.client` declaration.
 */

/** Host plugin body — no host-side behavior for this surface plugin. */
export function apply(): void {}
