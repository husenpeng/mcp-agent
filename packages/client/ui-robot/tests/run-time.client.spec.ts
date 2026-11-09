// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { makeTranslate } from '@tomato/client-test-runtime'
import { zh as commonZh } from '@tomato/client-locale/src/locales/zh.ts'
import type { Run } from '@tomato/api-robot-controller/client'
import { ageLabel, durationLabel, runElapsed, runMeta } from '../src/client/run-time.ts'
import { zh } from '../src/client/locales.ts'

const t = makeTranslate({ ...commonZh, ...zh })

const DAY = 86_400_000

function run(state: Run['state'], extra: Partial<Run> = {}): Run {
  return {
    id: 'run-1' as Run['id'],
    robot: 'robot-1' as Run['robot'],
    spec: { spec: 'spec-1' as Run['spec']['spec'], revision: 1 },
    state,
    input: { message: '整理报告' },
    startedAt: 1_000_000,
    ...extra,
  }
}

describe('run time labels', () => {
  it('names every relative-age bucket', () => {
    const now = Date.UTC(2026, 10, 4)
    expect(ageLabel(now, now, t)).toBe('刚刚')
    expect(ageLabel(now - 60_000, now, t)).toBe('1 分钟前')
    expect(ageLabel(now - 2 * 3_600_000, now, t)).toBe('2 小时前')
    expect(ageLabel(now - 3 * DAY, now, t)).toBe('3 天前')
    expect(ageLabel(now - 40 * DAY, now, t)).toBe('1 个月前')
    expect(ageLabel(now - 400 * DAY, now, t)).toBe('1 年前')
  })

  it('labels durations at second, minute, and hour resolution', () => {
    expect(durationLabel(5_000, t)).toBe('5 秒')
    expect(durationLabel(125_000, t)).toBe('2 分 5 秒')
    expect(durationLabel(3_725_000, t)).toBe('1 小时 2 分')
    expect(durationLabel(-1_000, t)).toBe('0 秒')
  })

  it('measures a settled run to its end and a live one to now', () => {
    expect(runElapsed(run('running'), 1_060_000)).toBe(60_000)
    expect(runElapsed(run('succeeded', { endedAt: 1_030_000 }), 9_000_000)).toBe(30_000)
    // A clock that runs backwards never yields a negative duration.
    expect(runElapsed(run('running'), 900_000)).toBe(0)
  })

  it('composes the header meta parts, omitting empty counters', () => {
    const live = runMeta(run('running', { startedAt: 970_000 }), 0, 0, 1_000_000, t)
    expect(live).toEqual(['刚刚开始', '已进行 30 秒'])
    const settled = runMeta(run('failed', { startedAt: 1_000_000, endedAt: 1_300_000 }), 12, 2, 1_540_000, t)
    expect(settled).toEqual(['9 分钟前开始', '用时 5 分 0 秒', '12 步', '2 个失败'])
  })
})
