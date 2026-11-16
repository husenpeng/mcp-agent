/** Reading the ticket list out of the Session's event window. */
import { describe, expect, it } from 'vitest'
import { latestTickets, rowsOf, TICKETS_RECORD } from '../src/client/tickets.ts'

const ROW = { id: 'ticket-1', subject: '加 tier 字段', stage: 'person', needs: 'review', state: 'ready', blocking: 0, rounds: 1 }

describe('ticket rows', () => {
  it('reads the rows a record carries, and ignores anything malformed', () => {
    expect(rowsOf(TICKETS_RECORD, { tickets: [ROW, { id: 'x' }, 'nonsense', { id: 'y', subject: 'z' }] }))
      .toEqual([ROW, { id: 'y', subject: 'z', stage: 'working', needs: undefined, state: undefined, blocking: 0, rounds: 0 }])
    expect(rowsOf(TICKETS_RECORD, { tickets: 'no' })).toEqual([])
    expect(rowsOf('plugin:other', { tickets: [ROW] })).toEqual([])
  })

  it('takes the newest record from the window and nothing else', () => {
    const events = [
      { type: TICKETS_RECORD, data: { tickets: [{ ...ROW, id: 'old' }] } },
      { type: 'user/message', data: {} },
      { type: TICKETS_RECORD, data: { tickets: [{ ...ROW, id: 'new' }] } },
    ]
    expect(latestTickets(events).map(row => row.id)).toEqual(['new'])
    expect(latestTickets([])).toEqual([])
    expect(latestTickets([{ type: 'user/message', data: {} }])).toEqual([])
    // A client entry carries its payload beside the envelope, not inside `data`.
    expect(latestTickets([{ type: TICKETS_RECORD, event: { data: { tickets: [ROW] } } }]).map(row => row.id)).toEqual(['ticket-1'])
  })
})
