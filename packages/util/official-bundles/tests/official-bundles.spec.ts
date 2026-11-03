/**
 * Shipped profile templates, the default-enabled optional bundles, and the offline catalog
 * that does not depend on installed provider packages or registry requests.
 */

import { describe, expect, it } from 'vitest'
import {
  DEFAULT_ENABLED_OPTIONAL_BUNDLES, OFFICIAL_ON_DEMAND_CATALOG, ON_DEMAND_BUNDLES, OPTIONAL_BUNDLES, PROFILE_TEMPLATES,
} from '../src/index.ts'

describe('Official on-demand catalog', () => {
  it('offers every admitted runtime-bearing bundle with offline localized metadata', () => {
    expect(ON_DEMAND_BUNDLES).toEqual([
      '@tomato/subagent-claude-code',
      '@tomato/subagent-codex',
    ])
    expect(OFFICIAL_ON_DEMAND_CATALOG.map(entry => entry.packageName)).toEqual(ON_DEMAND_BUNDLES)
    for (const entry of OFFICIAL_ON_DEMAND_CATALOG) {
      expect(entry.meta.icon).toMatch(/^data:image\/svg\+xml;base64,/)
      for (const text of [entry.meta.title, entry.meta.description]) {
        if (typeof text === 'string') throw new Error('Official metadata requires both shipped languages')
        expect(text.en).toMatch(/\S/)
        expect(text.zh).toMatch(/\S/)
      }
      expect(entry).not.toHaveProperty('version')
    }
  })

  it('lists no shipped or default-enabled bundle for install on request', () => {
    for (const name of [...OPTIONAL_BUNDLES, ...DEFAULT_ENABLED_OPTIONAL_BUNDLES]) {
      expect(ON_DEMAND_BUNDLES).not.toContain(name)
    }
  })
})

describe('Shipped profile templates', () => {
  it('stack each mode bundle on base except the standalone minimal SDK', () => {
    expect(PROFILE_TEMPLATES).toEqual({
      acp: { bundles: ['@tomato/base', '@tomato/acp-app'] },
      web: {
        bundles: ['@tomato/base', '@tomato/web-app', '@tomato/experimental-browser-use-playwright-bundle'],
      },
      headless: { bundles: ['@tomato/base', '@tomato/headless'] },
      sdk: { bundles: ['@tomato/base', '@tomato/sdk-app'] },
      'sdk-minimal': { bundles: ['@tomato/sdk-minimal'] },
    })
  })

  it('ships the Playwright browser layer on by default in the Web and Desktop profile', () => {
    expect(PROFILE_TEMPLATES.web!.bundles).toContain('@tomato/experimental-browser-use-playwright-bundle')
    expect(OPTIONAL_BUNDLES).toContain('@tomato/experimental-browser-use-playwright-bundle')
  })
})

describe('Default-enabled optional bundles', () => {
  it('selects a shipped optional bundle in exactly one template and nothing else', () => {
    for (const name of DEFAULT_ENABLED_OPTIONAL_BUNDLES) {
      expect(OPTIONAL_BUNDLES).toContain(name)
      const layers = Object.entries(PROFILE_TEMPLATES).filter(([, template]) => template.bundles.includes(name))
      expect(layers.map(([profile]) => profile)).toEqual(['web'])
    }
  })

  it('names only default-enabled bundles in the Web template beyond base and its mode bundle', () => {
    expect(PROFILE_TEMPLATES.web!.bundles.filter(name => OPTIONAL_BUNDLES.includes(name))
      .sort()).toEqual([...DEFAULT_ENABLED_OPTIONAL_BUNDLES].sort())
  })
})
