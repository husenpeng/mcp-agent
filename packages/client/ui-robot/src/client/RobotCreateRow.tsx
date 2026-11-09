/** Dedicated transcript row for one `robot_create` call: created robot and its open action. */
import type { ReactNode } from 'react'
import { useState } from 'react'
import { Button, DisclosureRow, IconAgentPresetOutlineRegular } from '@tomato/client-ui-primitives'
import type { ToolCallViewProps } from '@tomato/client-ui-tool/client'
import type { InjectFace, PropsLocale } from '@tomato/client-ui-slots'
import type { NS } from './locales.ts'
import { RobotAvatar } from './RobotAvatar.tsx'
import css from './RobotCreateRow.module.css'

/** Page action the row exposes after a successful creation. */
export interface RobotCreateRowInjected {
  /** Select the created robot and open the robots panel. */
  readonly openRobot: (robotId: string) => void
}

/** Props of the dedicated creation row. */
export type RobotCreateRowProps =
  ToolCallViewProps
  & PropsLocale<typeof NS>
  & InjectFace<RobotCreateRowInjected>

/** The structured payload the tool records for presenters. */
interface CreatedRobot {
  readonly robotId: string
  readonly name: string
}

/* v8 ignore next -- Non-expandable rows never invoke DisclosureRow's required toggle callback. */
const noop = (): void => undefined

/**
 * Read the presentation metadata the creation tool records.
 * @param meta - durable `tool/result` metadata, possibly absent for old Sessions.
 * @returns the created robot identity, or undefined when the payload is not this shape.
 */
function createdRobot(meta: unknown): CreatedRobot | undefined {
  if (typeof meta !== 'object' || meta === null) return undefined
  const value = meta as Record<string, unknown>
  return typeof value.robotId === 'string' && typeof value.name === 'string'
    ? { robotId: value.robotId, name: value.name }
    : undefined
}

/** First line of the durable result text, used for a failed creation. */
function resultText(block: Extract<ToolCallViewProps, { phase: 'result' }>['block']): string | undefined {
  const parts = block.content.map(item => item.type === 'text' ? item.text : JSON.stringify(item))
  if (parts.length === 0 && block.error !== undefined) return `${block.error.name}: ${block.error.code}`
  return parts.join('\n') || undefined
}

/**
 * Render one robot creation call with the created robot's identity and a
 * shortcut to its page.
 * @param props - call phase, recorded metadata, locale copy, and page actions.
 * @returns the creation row.
 */
export function RobotCreateRow(props: RobotCreateRowProps): ReactNode {
  const { t } = props
  const [open, setOpen] = useState(false)
  if (props.phase !== 'result') {
    return (
      <div className={css.row} data-tool="robot_create" data-state="preparing" aria-label={t('createTool.creating')}>
        <DisclosureRow
          title={t('createTool.creating')}
          icon={<IconAgentPresetOutlineRegular size={14} />}
          open={false}
          expandable={false}
          onToggle={noop}
          running
        />
      </div>
    )
  }
  const created = props.block.isError ? undefined : createdRobot(props.block.meta)
  if (!props.block.isError) {
    return (
      <div className={css.row} data-tool="robot_create" data-state="created">
        <DisclosureRow
          title={created === undefined ? t('createTool.title') : t('createTool.created', { name: created.name })}
          icon={created === undefined
            ? <IconAgentPresetOutlineRegular size={14} />
            : <RobotAvatar name={created.name} skills={[]} size={18} />}
          open={false}
          expandable={false}
          onToggle={noop}
          {...created === undefined ? {} : {
            headerAccessory: (
              <Button size="sm" variant="outline" onClick={() => { props.openRobot(created.robotId) }}>
                {t('createTool.open')}
              </Button>
            ),
          }}
        />
      </div>
    )
  }
  const failure = resultText(props.block)
  return (
    <div className={css.row} data-tool="robot_create" data-state="failed">
      <DisclosureRow
        title={t('createTool.failed')}
        icon={<IconAgentPresetOutlineRegular size={14} />}
        open={open && failure !== undefined}
        expandable={failure !== undefined}
        expandOnRowClick
        onToggle={() => { setOpen(value => !value) }}
      >
        {failure === undefined ? null : <pre className={css.failure}>{failure}</pre>}
      </DisclosureRow>
    </div>
  )
}
