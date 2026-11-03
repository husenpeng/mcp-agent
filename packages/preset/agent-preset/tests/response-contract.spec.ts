/**
 * Shipped Web presets: every user-facing preset carries the same response contract,
 * and `minimal` keeps its complete fixed prompt.
 */
import { readdirSync, readFileSync } from 'node:fs'
import * as yaml from 'js-yaml'
import { entryListSchema } from '@tomato/cordis-plugin-include'
import { describe, expect, it } from 'vitest'

const PRESET_DIR = new URL('../../../bundle/web-app/presets/', import.meta.url)

/** The response contract every user-facing preset adds after first-party guidance. */
const RESPONSE_CONTRACT = `Answer in the user's language. Start with the answer: the first sentence states the conclusion, the result, or the recommended action, and when several points matter, lead with the one that changes the user's decision. Never open with what you did, what you are about to do, or a status report.

Include only information that changes the user's decision or tells them what to do. Leave out restated requests, tool narration, background the user already has, and closing summaries that repeat the answer.

A reply of one or two sentences stays plain. A longer reply uses at most three sections in this order: conclusion, supporting evidence or steps, next actions. Omit an empty section, prefer short paragraphs or bullets, and use a table only to compare three or more items.

Expand a point when the user asks for detail, when the conclusion depends on a non-obvious mechanism, or when the user must verify a claim; otherwise keep supporting material in a presented file. Tool instructions and required output formats take precedence over this section.`

/** Preset whose complete prompt intentionally suppresses every other section. */
const MINIMAL = 'minimal'

interface PersonaConfig {
  readonly prefix?: string
  readonly suffix?: string
  readonly complete?: boolean
}

interface PluginRow {
  readonly id?: string
  readonly name?: string
  readonly config?: PersonaConfig
}

interface PresetRow {
  readonly id?: string
  readonly config?: { readonly plugins?: readonly PluginRow[] }
}

interface PatchEntry {
  readonly insert?: readonly PresetRow[]
}

/** Read one shipped preset's persona row. */
function persona(id: string): PersonaConfig | undefined {
  const patch = yaml.load(readFileSync(new URL(`./${id}.patch.yml`, PRESET_DIR), 'utf8'), { schema: entryListSchema })
  const rows = (patch as PatchEntry[]).flatMap(entry => entry.insert ?? [])
  const preset = rows.find(row => row.id === `preset-${id}`)
  return preset?.config?.plugins?.find(plugin => plugin.id === 'persona')?.config
}

const presets = readdirSync(PRESET_DIR)
  .filter(file => file.endsWith('.patch.yml'))
  .map(file => file.slice(0, -'.patch.yml'.length))

describe('the shipped Web presets', () => {
  it.for(presets.filter(id => id !== MINIMAL))('%s carries the response contract', (id) => {
    const config = persona(id)
    expect(config?.suffix).toBe(RESPONSE_CONTRACT)
    expect(config?.complete).not.toBe(true)
    expect(config?.prefix).toContain('marketing operations assistant')
  })

  it('keeps minimal on its complete prompt', () => {
    const config = persona(MINIMAL)
    expect(config?.complete).toBe(true)
    expect(config?.suffix).toBeUndefined()
  })

  it('lists standard, ptc, and cordis among the presets under test', () => {
    expect(presets).toEqual(expect.arrayContaining(['standard', 'ptc', 'cordis', MINIMAL]))
  })
})
