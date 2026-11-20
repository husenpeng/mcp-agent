/** The collaboration tab refuses the development template until a published Rbot can run its members. */
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { GroupChatInjected } from '../src/client/types.ts'
import { GroupChat } from '../src/client/GroupChat.tsx'
import type { GroupChatProps } from '../src/client/GroupChat.tsx'

/** The tab is rendered only here, so the actions never run; their types still come from the inject face. */
const actions: GroupChatInjected['actions'] = {
  publish: vi.fn<GroupChatInjected['actions']['publish']>(),
  start: vi.fn<GroupChatInjected['actions']['start']>(),
  cancel: vi.fn<GroupChatInjected['actions']['cancel']>(),
  track: vi.fn(),
}

/**
 * Render the tab with one roster and robot catalog.
 * @param robots - published Rbots the template may bind.
 * @returns the static markup.
 */
function render(robots: readonly { spec: string; revision: number; name: string }[]): string {
  return renderToStaticMarkup(
    <GroupChat
      {...({} as GroupChatProps)}
      useRegistry={selector => selector({ specs: [], runs: [] })}
      useLedger={selector => selector({ entries: [] })}
      useRobots={selector => selector({ options: robots })}
      actions={actions}
      createWithConversation={() => {}}
      openCanvas={() => {}}
      workspaceRoot={() => undefined}
      useRemoteAccess={() => true}
      t={((key: string) => key)}
    />,
  )
}

describe('collaboration template button', () => {
  it('disables the template and names the missing Rbot until one is published', () => {
    const markup = render([])
    expect(markup).toContain('group.notice.noRobot')
    expect(markup).toMatch(/title="group\.notice\.noRobot"/u)
    expect(markup).toMatch(/<button[^>]*disabled[^>]*>group\.template<\/button>/u)
  })

  it('enables the template once a published Rbot exists', () => {
    const markup = render([{ spec: 'dev-bot', revision: 2, name: 'Dev' }])
    expect(markup).not.toMatch(/<button[^>]*disabled[^>]*>group\.template<\/button>/u)
    expect(markup).toContain('group.template')
  })
})
