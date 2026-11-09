import { expect, it } from 'vitest'
import { listenPortArgument, trustedHostArguments } from '../src/launch-arguments.ts'

it('keeps the historical OS-assigned port when the shell names none', () => {
  expect(listenPortArgument({})).toBe('0')
  expect(listenPortArgument({ TOMATO_DESKTOP_LISTEN_PORT: '' })).toBe('0')
  expect(listenPortArgument({ TOMATO_DESKTOP_LISTEN_PORT: '   ' })).toBe('0')
})

it('passes the pinned port through unchanged so web-startup owns validation', () => {
  expect(listenPortArgument({ TOMATO_DESKTOP_LISTEN_PORT: '43110' })).toBe('43110')
  // An invalid value reaches the flag parser rather than being repaired here.
  expect(listenPortArgument({ TOMATO_DESKTOP_LISTEN_PORT: 'not-a-port' })).toBe('not-a-port')
})

it('names no trusted authority when the shell configures none', () => {
  expect(trustedHostArguments({})).toEqual([])
  expect(trustedHostArguments({ TOMATO_DESKTOP_TRUSTED_HOSTS: '' })).toEqual([])
})

it('emits one flag pair per configured authority, dropping blank and padded entries', () => {
  expect(trustedHostArguments({ TOMATO_DESKTOP_TRUSTED_HOSTS: 'tomato-hub.tailnet.ts.net' }))
    .toEqual(['--trusted-host', 'tomato-hub.tailnet.ts.net'])
  expect(trustedHostArguments({ TOMATO_DESKTOP_TRUSTED_HOSTS: 'a.example\n\n b.example \n' }))
    .toEqual(['--trusted-host', 'a.example', '--trusted-host', 'b.example'])
})

it('keeps an authority carrying a port intact', () => {
  expect(trustedHostArguments({ TOMATO_DESKTOP_TRUSTED_HOSTS: 'hub.example:8443' }))
    .toEqual(['--trusted-host', 'hub.example:8443'])
})
