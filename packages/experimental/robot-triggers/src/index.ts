/**
 * Starts robot runs from the specification's cron schedules and robot event
 * topics. Schedule state is recomputed from specifications on load and after
 * registry changes; missed occurrences during downtime are not replayed.
 * @module @tomato/experimental-robot-triggers
 */

import type { Context } from '@tomato/cordis'
import type { RobotId } from '@tomato/experimental-robot'
import { createCronScheduleRecord, ScheduleId } from '@tomato/schedule'
import type {} from '@tomato/storage-domain'

/** Stable Cordis plugin name. */
export const name = 'robot-triggers'

/** Services required before triggers can start runs. */
export const inject = ['robots']

declare module '@tomato/cordis' {
  interface Events {
    /**
     * One robot event topic declared by an event trigger.
     * @param topic - topic matched against event triggers.
     * @param payload - JSON-compatible payload handed to the run.
     * @mode emit
     */
    'robot/event'(topic: string, payload: unknown): void
  }
}

const ROBOT_DOMAIN = 'tomato_robot'
const MAX_TIMER_DELAY = 2 ** 31 - 1

interface CronEntry {
  readonly robot: RobotId
  readonly expression: string
  readonly timeZone: string
  readonly mission: string
  readonly next: number
}

interface EventEntry {
  readonly robot: RobotId
  readonly topic: string
  readonly mission: string
}

function nextCronTime(expression: string, timeZone: string, now: number): number {
  const record = createCronScheduleRecord(
    ScheduleId('robot-trigger'),
    'scheduled robot run',
    { expression, time_zone: timeZone },
    now,
    'Robot trigger',
  )
  return Date.parse(record.scheduledAt)
}

function payloadText(payload: unknown): string {
  return JSON.stringify(payload)
}

/**
 * Emit one robot event topic to matching event triggers.
 * @param ctx - context whose robot triggers receive the event.
 * @param topic - exact topic declared by an event trigger.
 * @param payload - JSON-compatible payload handed to the run.
 */
export function emitRobotEvent(ctx: Context, topic: string, payload: unknown): void {
  ctx.emit('robot/event', topic, payload)
}

/**
 * Mount the trigger scheduler. It scans every robot's published revision for
 * cron and event triggers and follows later registry writes.
 * @param ctx - plugin context carrying the robot service.
 */
export function apply(ctx: Context): void {
  let cron: CronEntry[] = []
  let events: EventEntry[] = []
  let timer: ReturnType<typeof setTimeout> | undefined

  const start = (robot: RobotId, message: string): void => {
    void ctx.robots.start(robot, { message }).catch((error: unknown) => {
      ctx.logger.warn(`robot-triggers: starting a run for ${robot} failed: ${String(error)}`)
    })
  }

  const arm = (): void => {
    if (timer !== undefined) {
      clearTimeout(timer)
      timer = undefined
    }
    if (cron.length === 0) return
    const now = Date.now()
    const next = Math.min(...cron.map(entry => entry.next))
    const delay = Math.min(Math.max(next - now, 0), MAX_TIMER_DELAY)
    timer = setTimeout(() => {
      timer = undefined
      tick()
    }, delay)
  }

  const tick = (): void => {
    const now = Date.now()
    const due = cron.filter(entry => entry.next <= now)
    for (const entry of due) start(entry.robot, entry.mission)
    cron = cron.map(entry => entry.next <= now ? { ...entry, next: nextCronTime(entry.expression, entry.timeZone, now) } : entry)
    arm()
  }

  const refresh = async (): Promise<void> => {
    const now = Date.now()
    const nextCron: CronEntry[] = []
    const nextEvents: EventEntry[] = []
    for (const robot of await ctx.robots.robots()) {
      const revision = await ctx.robots.revision(robot.spec)
      /* v8 ignore next -- the provider creates robots from published revisions */
      if (revision === undefined) continue
      for (const trigger of revision.spec.goal.triggers) {
        if (trigger.kind === 'cron') {
          try {
            nextCron.push({
              robot: robot.id,
              expression: trigger.expression,
              timeZone: trigger.timeZone,
              mission: revision.spec.goal.mission,
              next: nextCronTime(trigger.expression, trigger.timeZone, now),
            })
          } catch (error: unknown) {
            ctx.logger.warn(`robot-triggers: robot ${robot.id} has an unusable cron trigger: ${String(error)}`)
          }
        } else if (trigger.kind === 'event') {
          nextEvents.push({ robot: robot.id, topic: trigger.topic, mission: revision.spec.goal.mission })
        }
      }
    }
    cron = nextCron
    events = nextEvents
    arm()
  }

  ctx.on('domain/changed', (change) => {
    if (change.domain !== ROBOT_DOMAIN || (change.table !== 'robots' && change.table !== 'revisions')) return
    void refresh()
  })

  ctx.on('robot/event', (topic, payload) => {
    for (const entry of events) {
      if (entry.topic === topic) start(entry.robot, `${entry.mission}\n\nRobot event: ${topic}\n${payloadText(payload)}`)
    }
  })

  ctx.effect(() => () => {
    if (timer !== undefined) clearTimeout(timer)
    timer = undefined
  })

  void refresh()
}
