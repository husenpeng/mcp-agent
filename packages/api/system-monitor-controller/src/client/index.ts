/**
 * System monitor client half: installs `ctx.systemMonitor`, the shared
 * reference-counted observation stream over the generated `systemMonitor`
 * namespace. The plugin resolves the Gateway stream factory and the namespace
 * while its own context is current, because stream (re)opens run on caller
 * stacks — a mount effect, a carrier retry — whose dynamic context has not
 * declared `remote.systemMonitor`.
 * @module @tomato/api-system-monitor-controller/client
 */

import type { Context } from '@tomato/cordis'
import type {} from '@tomato/api-system-monitor-controller/remote'
import { ClientSystemMonitorModel } from './model.ts'
import { ClientSystemMonitor } from './service.ts'

export type { ISystemMonitor } from './service.ts'
export type { MonitorPoint, MonitorStatus, SystemMonitorSnapshot, SystemMonitorSource } from './model.ts'
export type { SystemMonitorRequest, SystemSampleFrame } from '../types.ts'

/** Required Client Remote services. */
export const inject = ['remote', 'remote.systemMonitor']

/**
 * Install the client monitor service.
 * @param ctx - Client root Context.
 */
export function apply(ctx: Context): void {
  // Read both faces now, not inside `start`: see the module JSDoc.
  const { remote } = ctx
  const { systemMonitor } = remote
  new ClientSystemMonitor(ctx, { $stream: options => remote.$stream(options), systemMonitor }, new ClientSystemMonitorModel())
}
