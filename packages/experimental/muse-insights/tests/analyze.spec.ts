/** Pure unfinished-task merge, deduplication, and ordering. */
import { describe, expect, it } from 'vitest'
import { buildUnfinishedTasks, taskTextKey } from '../src/analyze.ts'

describe('buildUnfinishedTasks', () => {
  it('prefers an in-progress todo over pending recap wording with different case and spacing', () => {
    const tasks = buildUnfinishedTasks({
      todos: [
        { sessionId: 's1', sessionTitle: 'Launch', content: '  Send   the brief ', status: 'pending' },
        { sessionId: 's1', sessionTitle: 'Launch', content: 'Ask legal', status: 'in_progress' },
      ],
      recapTasks: ['send the BRIEF', 'Ask legal', 'Plan the offsite'],
      maxTasks: 10,
    })
    expect(tasks.map(task => task.title)).toEqual(['Ask legal', 'Send the brief', 'Plan the offsite'])
    expect(tasks[0]).toMatchObject({ status: 'in_progress', source: 'todo', sessionId: 's1', sessionTitle: 'Launch' })
    expect(tasks[1]).toMatchObject({ status: 'pending', source: 'todo' })
    expect(tasks[2]).toMatchObject({ status: 'pending', source: 'recap', sessionId: null, sessionTitle: null })
  })

  it('suppresses recap wording a completed todo already finished and ignores blank items', () => {
    const tasks = buildUnfinishedTasks({
      todos: [
        { sessionId: 's1', sessionTitle: null, content: 'Open the file', status: 'completed' },
        { sessionId: 's1', sessionTitle: null, content: '   ', status: 'pending' },
      ],
      recapTasks: ['open the file', '  ', 'Draft the email'],
      maxTasks: 10,
    })
    expect(tasks.map(task => task.title)).toEqual(['Draft the email'])
  })

  it('caps the retained list and keeps task identity stable across runs', () => {
    const input = {
      todos: [
        { sessionId: 's1', sessionTitle: 'Launch', content: 'A', status: 'pending' as const },
        { sessionId: 's1', sessionTitle: 'Launch', content: 'B', status: 'pending' as const },
      ],
      recapTasks: ['C'],
      maxTasks: 2,
    }
    const first = buildUnfinishedTasks(input)
    const second = buildUnfinishedTasks(input)
    expect(first).toHaveLength(2)
    expect(first.map(task => task.id)).toEqual(second.map(task => task.id))
    expect(new Set(first.map(task => task.id)).size).toBe(2)
  })

  it('caps task text and Session titles at the stored schema limits', () => {
    const task = buildUnfinishedTasks({
      todos: [{
        sessionId: 's1',
        sessionTitle: 'S'.repeat(600),
        content: 'T'.repeat(600),
        status: 'pending',
      }],
      recapTasks: [],
      maxTasks: 10,
    })[0]
    expect(task?.title).toHaveLength(500)
    expect(task?.sessionTitle).toHaveLength(500)
  })

  it('normalizes comparison keys', () => {
    expect(taskTextKey('  Send\n the BRIEF  ')).toBe('send the brief')
  })
})
