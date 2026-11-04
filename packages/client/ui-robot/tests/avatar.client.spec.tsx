// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { RobotAvatar } from '../src/client/RobotAvatar.tsx'
import { robotAvatarArt } from '../src/client/RobotAvatarArt.tsx'

afterEach(cleanup)

const SKILLS = [
  'brand-insight',
  'influencer-marketing',
  'creative-intelligence',
  'tiktok-product-selection',
  'tiktok-data-insight',
  'instagram-product-selection',
  'instagram-data-insight',
  'x-product-selection',
  'x-data-insight',
  'youtube-product-selection',
  'youtube-data-insight',
]

describe('robot avatar', () => {
  it.each(SKILLS)('draws the recognized %s artwork', (skill) => {
    const { container } = render(<RobotAvatar name="达人营销专家" skills={[skill]} />)
    expect(container.querySelector(`[data-art="${skill}"]`)).not.toBeNull()
    expect(container.querySelector('svg')).not.toBeNull()
    expect(container.textContent).toBe('')
  })

  it('selects the first recognized role and ignores unknown skills before it', () => {
    expect(robotAvatarArt(['unknown', 'brand-insight'])?.skill).toBe('brand-insight')
    expect(robotAvatarArt(['unknown'])).toBeUndefined()
    expect(robotAvatarArt([])).toBeUndefined()
  })

  it('falls back to the first grapheme when no role artwork applies', () => {
    const { container } = render(<RobotAvatar name=" 达人营销专家 " skills={['unknown']} />)
    expect(container.querySelector('svg')).toBeNull()
    expect(container.textContent).toBe('达')
  })

  it('uses a question mark for a blank name', () => {
    const { container } = render(<RobotAvatar name="   " skills={[]} />)
    expect(container.textContent).toBe('?')
  })
})
