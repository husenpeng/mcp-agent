/**
 * Test-only client roster of the assembled viewer page.
 *
 * A served viewer page is the owner's own Web shell with the owner's client plugins; this roster is the
 * subset the viewer page specs need: the wire plugin, the Gateway, remote access, the Session/Workspace controllers,
 * the menu service, presentation plugins, and the Liveshare `./client` face, which mounts the viewer surfaces when the
 * carrier names a share. Every row is the package's own `/client` face registered as a module-table
 * factory. It must be imported only after {@link prepareViewerRemoteFaces} answered the generated
 * `/remote` faces these plugins import.
 *
 * @module @tomato/experimental-liveshare/tests/viewer-page-roster
 */

import * as apiGateway from '@tomato/api-gateway/client'
import * as apiRemoteAccess from '@tomato/api-remote-access/client'
import * as apiRemotes from '@tomato/api-remotes/client'
import * as apiSessionController from '@tomato/api-session-controller/client'
import * as apiWorkspaceController from '@tomato/api-workspace-controller/client'
import * as clientConnection from '@tomato/client-connection/client'
import * as clientFileUpload from '@tomato/client-file-upload/client'
import * as clientLocale from '@tomato/client-locale/client'
import * as clientModules from '@tomato/client-modules/client'
import * as clientResources from '@tomato/client-resources/client'
import * as clientShortcuts from '@tomato/client-shortcuts/client'
import * as uiAttachment from '@tomato/client-ui-attachment/client'
import * as uiChat from '@tomato/client-ui-chat/client'
import * as uiContextMenu from '@tomato/client-ui-context-menu/client'
import * as uiConversation from '@tomato/client-ui-conversation/client'
import * as uiDeliverables from '@tomato/client-ui-deliverables/client'
import * as uiFileDrag from '@tomato/client-ui-file-drag/client'
import * as uiLayout from '@tomato/client-ui-layout/client'
import * as uiRenderer from '@tomato/client-ui-renderer/client'
import * as uiSession from '@tomato/client-ui-session/client'
import * as uiSettings from '@tomato/client-ui-settings/client'
import * as uiSidebar from '@tomato/client-ui-sidebar/client'
import * as uiSidebarRight from '@tomato/client-ui-sidebar-right/client'
import * as uiTheme from '@tomato/client-ui-theme/client'
import * as uiTool from '@tomato/client-ui-tool/client'
import * as uiTrajectory from '@tomato/client-ui-trajectory/client'
import * as uiWorkspace from '@tomato/client-ui-workspace/client'
import * as typertRegistry from '@tomato/typert-registry/client'
import * as liveshare from '../src/client/index.ts'

/** One module-table row: the entry id the Loader creates, and that plugin's client exports. */
export interface ViewerPageRosterRow {
  readonly id: string
  readonly exports: Readonly<Record<string, unknown>>
}

/** Entry id of the module-system bootstrap whose exports the facade hands to the module system. */
export const VIEWER_PAGE_BOOTSTRAP_ID = '@tomato/client-modules'

/** The viewer page roster; Cordis composes these entries by service injection, so order is irrelevant. */
export const VIEWER_PAGE_ROSTER: readonly ViewerPageRosterRow[] = [
  { id: '@tomato/typert-registry', exports: typertRegistry },
  { id: '@tomato/experimental-liveshare', exports: liveshare },
  { id: VIEWER_PAGE_BOOTSTRAP_ID, exports: clientModules },
  { id: '@tomato/client-connection', exports: clientConnection },
  { id: '@tomato/api-gateway', exports: apiGateway },
  { id: '@tomato/api-remote-access', exports: apiRemoteAccess },
  { id: '@tomato/api-remotes', exports: apiRemotes },
  { id: '@tomato/api-session-controller', exports: apiSessionController },
  { id: '@tomato/api-workspace-controller', exports: apiWorkspaceController },
  { id: '@tomato/client-file-upload', exports: clientFileUpload },
  { id: '@tomato/client-locale', exports: clientLocale },
  { id: '@tomato/client-resources', exports: clientResources },
  { id: '@tomato/client-shortcuts', exports: clientShortcuts },
  { id: '@tomato/client-ui-renderer', exports: uiRenderer },
  { id: '@tomato/client-ui-theme', exports: uiTheme },
  { id: '@tomato/client-ui-settings', exports: uiSettings },
  { id: '@tomato/client-ui-layout', exports: uiLayout },
  { id: '@tomato/client-ui-session', exports: uiSession },
  { id: '@tomato/client-ui-sidebar', exports: uiSidebar },
  { id: '@tomato/client-ui-conversation', exports: uiConversation },
  { id: '@tomato/client-ui-chat', exports: uiChat },
  { id: '@tomato/client-ui-context-menu', exports: uiContextMenu },
  { id: '@tomato/client-ui-tool', exports: uiTool },
  { id: '@tomato/client-ui-attachment', exports: uiAttachment },
  { id: '@tomato/client-ui-file-drag', exports: uiFileDrag },
  { id: '@tomato/client-ui-sidebar-right', exports: uiSidebarRight },
  { id: '@tomato/client-ui-trajectory', exports: uiTrajectory },
  { id: '@tomato/client-ui-deliverables', exports: uiDeliverables },
  { id: '@tomato/client-ui-workspace', exports: uiWorkspace },
]
