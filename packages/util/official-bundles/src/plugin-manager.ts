/** The package names the plugin manager protects, hides, orders, or marks experimental. */

/**
 * Plugin packages the plugin manager refuses to disable or remove, because management itself needs them; a bundle that
 * contains one is read-only as well. Removing a name drops only this `management-required` refusal; the manager's own
 * entry, installation-carried bundles, and unaddressable rows stay protected by their own rules.
 */
export const PROTECTED_PLUGINS: ReadonlySet<string> = new Set([
  '@tomato/plugin-manager', '@tomato/cordis-plugin-loader',
  '@tomato/cordis-plugin-include', '@tomato/api-gateway',
  '@tomato/host-webserver', '@tomato/client-modules',
  '@tomato/client-ui-settings-plugin-inventory', '@tomato/client-ui-plugin-manager',
  '@tomato/host-plugin-inventory', '@tomato/typert-registry',
  '@tomato/api-remotes', '@tomato/api-remote-access',
  '@tomato/cordis-plugin-timer', '@tomato/client-connection',
  '@tomato/host-frontend-static', '@tomato/tools',
  '@tomato/hmr',
])

/**
 * Built-in profile bundles and persistent terminals, which have no plugin manager page.
 * Their Host availability and activation stay intact.
 */
export const HIDDEN_BUNDLES: ReadonlySet<string> = new Set([
  '@tomato/base',
  '@tomato/web-app',
  '@tomato/headless',
  '@tomato/sdk-app',
  '@tomato/acp-app',
  '@tomato/sdk-minimal',
  '@tomato/experimental-terminal-bundle',
])

/**
 * The optional bundles the plugin manager's main and More lists rank first, in this order. {@link MORE_BUNDLES}, not
 * this list, decides whether a bundle appears on the main list.
 */
export const EXTENSION_BUNDLES: readonly string[] = [
  '@tomato/experimental-agent-team-profile',
  '@tomato/experimental-voice-input-bundle',
  '@tomato/experimental-plugin-market-bundle',
  '@tomato/experimental-auto-review',
]

/**
 * The optional bundles the plugin manager's main list leaves out until the profile enables them; its More list,
 * which includes every eligible bundle, ranks them last in this order.
 */
export const MORE_BUNDLES: readonly string[] = [
  '@tomato/personalized-recommendations',
  '@tomato/experimental-inspector-profile',
  '@tomato/cua-bundle',
  '@tomato/experimental-tool-worktree',
  '@tomato/experimental-cot-translation-bundle',
  '@tomato/experimental-session-search',
  '@tomato/experimental-session-titles-bundle',
  '@tomato/experimental-badge-skill-bundle',
  '@tomato/experimental-ralph-bundle',
  '@tomato/subagent-codex',
  '@tomato/subagent-claude-code',
]

/** Official bundles the plugin manager marks with the Experimental badge. */
export const EXPERIMENTAL_BUNDLES: ReadonlySet<string> = new Set([
  '@tomato/personalized-recommendations',
  '@tomato/cua-bundle',
  '@tomato/experimental-browser-use-playwright-bundle',
  '@tomato/experimental-agent-team-profile',
  '@tomato/experimental-voice-input-bundle',
  '@tomato/experimental-auto-review',
  '@tomato/experimental-inspector-profile',
  '@tomato/experimental-tool-worktree',
  '@tomato/experimental-cot-translation-bundle',
  '@tomato/experimental-session-search',
  '@tomato/experimental-session-titles-bundle',
  '@tomato/experimental-badge-skill-bundle',
  '@tomato/experimental-ralph-bundle',
  '@tomato/experimental-plugin-market-bundle',
])
