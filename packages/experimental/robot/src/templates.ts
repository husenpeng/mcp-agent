/**
 * Robot template registry provider, mounted as its own Loader row. Template
 * packages register their templates here; the robot page lists them and a
 * hire publishes a user-owned copy through `ctx.robots`.
 * @module @tomato/experimental-robot/templates
 */

import { type Context, Service } from '@tomato/cordis'
import type {} from './index.ts'
import { templateSpec } from './template-spec.ts'
import type { RobotSpec, RobotTemplate, RobotTemplateId } from './types.ts'

declare module '@tomato/cordis' {
  interface Context {
    robotTemplates: RobotTemplateRegistry
  }
}

/**
 * In-memory registry of robot templates contributed by mounted plugins.
 * Registration order is listing order. Each change emits `robot/changed`
 * with `templates`.
 */
export class RobotTemplateRegistry extends Service {
  private readonly entries = new Map<RobotTemplateId, RobotTemplate>()

  /** @param ctx - Context that receives the `robotTemplates` service. */
  constructor(ctx: Context) {
    super(ctx, 'robotTemplates')
  }

  /**
   * Add one template until the returned disposer runs. Call it inside the
   * contributing plugin's `ctx.effect` so unloading removes the template.
   * @param template - template whose id is not registered yet.
   * @returns the disposer that removes exactly this registration.
   * @throws when a template with the same id is already registered.
   */
  register(template: RobotTemplate): () => void {
    if (this.entries.has(template.id)) throw new Error(`robot template "${template.id}" is already registered`)
    this.entries.set(template.id, template)
    this.ctx.emit('robot/changed', 'templates')
    return () => {
      if (this.entries.get(template.id) !== template) return
      this.entries.delete(template.id)
      this.ctx.emit('robot/changed', 'templates')
    }
  }

  /**
   * List every registered template.
   * @returns templates in registration order.
   */
  list(): readonly RobotTemplate[] {
    return [...this.entries.values()]
  }

  /**
   * Read one template.
   * @param id - template identity.
   * @returns the template, or `undefined` when none is registered under `id`.
   */
  get(id: RobotTemplateId): RobotTemplate | undefined {
    return this.entries.get(id)
  }

  /**
   * Build the specification one hire publishes from a registered template.
   * @param id - template identity.
   * @param locale - locale whose copy fills the name, description, mission, and criteria.
   * @param name - display name to publish; defaults to the localized template name.
   * @returns a new specification independent of the template, or `undefined` when none is registered under `id`.
   */
  hireSpec(id: RobotTemplateId, locale: string, name?: string): RobotSpec | undefined {
    const template = this.entries.get(id)
    return template === undefined ? undefined : templateSpec(template, locale, name)
  }
}

export default RobotTemplateRegistry
