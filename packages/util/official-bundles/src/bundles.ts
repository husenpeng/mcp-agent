/** The bundle package names the tomato installation selects, offers, installs on demand, or retires. */

/** Installation-owned defaults used when a shipped profile is first opened. */
export interface ProfileTemplate {
  /** Ordered bundle layer list. */
  bundles: readonly string[]
}

/** The shipped profile templates auto-initialized on first use, by name. */
export const PROFILE_TEMPLATES: Record<string, ProfileTemplate> = {
  acp: {
    bundles: ['@tomato/base', '@tomato/acp-app'],
  },
  web: {
    bundles: ['@tomato/base', '@tomato/web-app'],
  },
  headless: {
    bundles: ['@tomato/base', '@tomato/headless'],
  },
  sdk: {
    bundles: ['@tomato/base', '@tomato/sdk-app'],
  },
  'sdk-minimal': {
    bundles: ['@tomato/sdk-minimal'],
  },
}

/**
 * Installation-owned bundle tuples that an earlier release wrote into a shipped profile; app-boot replaces an exact
 * match with the {@link PROFILE_TEMPLATES} entry of the same name and leaves every other list untouched.
 */
export const INSTALLATION_OWNED_PROFILE_TUPLES: Readonly<Record<string, readonly string[]>> = {
  headless: ['@tomato/base', '@tomato/web-app', '@tomato/headless'],
}

/** Bundles an earlier release shipped and the installation no longer carries; app-boot removes them from profiles. */
export const RETIRED_BUNDLES: ReadonlySet<string> = new Set([
  // The Web composition mounts Schedule itself
  // ([upgrade guide](../../../../docs/upgrade-guide/v0.2.0-rc.2/schedule-bundle-retired/guide.md)).
  '@tomato/experimental-schedule-bundle',
])

/** The bundle list a `tomato plugin` init uses for a name with no shipped template. */
export const DEFAULT_PROFILE_BUNDLES: readonly string[] = ['@tomato/base']

/**
 * The bundles the tomato installation ships for a person to switch on: each a
 * runtime dependency of the installation that declares `tomato.bundle.patch`,
 * an `icon`, and `./locale/*.json` display metadata, selected by no shipped
 * template, and offered switched off by the plugin manager except persistent
 * terminals, which have no page switch
 * ([rationale](../../../../.agents/notes/implemented/process/2026-09-15-shipped-optional-bundles.md),
 * [admission](../../../../.agents/notes/implemented/architecture/2026-09-21-experimental-capabilities-as-optional-bundles.md)).
 */
export const OPTIONAL_BUNDLES: readonly string[] = [
  '@tomato/personalized-recommendations',
  '@tomato/cua-bundle',
  '@tomato/experimental-session-search',
  '@tomato/experimental-ralph-bundle',
  '@tomato/experimental-terminal-bundle',
  '@tomato/experimental-badge-skill-bundle',
  '@tomato/experimental-session-titles-bundle',
  '@tomato/experimental-agent-team-profile',
  '@tomato/experimental-voice-input-bundle',
  '@tomato/experimental-cot-translation-bundle',
  '@tomato/experimental-auto-review',
  '@tomato/experimental-inspector-profile',
  '@tomato/experimental-plugin-market-bundle',
  '@tomato/experimental-tool-worktree',
]

/** Public TOMATO release members available through the ordinary on-demand bundle installer. */
export const ON_DEMAND_BUNDLES: readonly string[] = [
  '@tomato/subagent-claude-code',
  '@tomato/subagent-codex',
  '@tomato/experimental-browser-use-playwright-bundle',
]
