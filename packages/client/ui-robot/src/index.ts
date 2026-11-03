/**
 * Node half of the Tomato Rbot plugin. The browser half in `src/client/` owns
 * every contribution; this entry exists so the package appears as an ordinary
 * Loader row.
 * @module @tomato/client-ui-robot
 */

/** Loader-visible no-op body; the browser half carries the feature. */
export function apply(): void {}
