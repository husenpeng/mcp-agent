import { expect, it } from 'vitest'
import { releasePatchFiles } from '../src/release-overlay.ts'

it('applies the release overlay only when the Electron shell supplies one', () => {
  expect(releasePatchFiles({})).toEqual([])
  expect(releasePatchFiles({ TOMATO_DESKTOP_RELEASE_OVERLAY: '' })).toEqual([])
  expect(releasePatchFiles({ TOMATO_DESKTOP_RELEASE_OVERLAY: '/Applications/Tomato AI.app/Contents/Resources/release-profile.patch.yml' }))
    .toEqual(['/Applications/Tomato AI.app/Contents/Resources/release-profile.patch.yml'])
})
