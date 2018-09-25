// Types
import {DEState} from 'src/types/dataExplorer'
import {Status} from 'src/types'

export interface State {
  dataExplorer: DEState
}

export enum ActionType {
  UpdateSourceLink = 'DE_UPDATE_SOURCE_LINK',
  EditQueryStatus = 'EDIT_QUERY_STATUS',
}

export type Action = UpdateSourceLinkAction | EditQueryStatusAction

export interface UpdateSourceLinkAction {
  type: ActionType.UpdateSourceLink
  payload: {
    sourceLink: string
  }
}

export const updateSourceLink = (
  sourceLink: string
): UpdateSourceLinkAction => ({
  type: ActionType.UpdateSourceLink,
  payload: {
    sourceLink,
  },
})

interface EditQueryStatusAction {
  type: ActionType.EditQueryStatus
  payload: {
    queryID: string
    status: Status
  }
}

export const editQueryStatus = (
  queryID: string,
  status: Status
): EditQueryStatusAction => ({
  type: ActionType.EditQueryStatus,
  payload: {queryID, status},
})
