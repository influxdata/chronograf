import {Dispatch} from 'redux'
import {Source} from 'src/types'
import * as DashboardsModels from 'src/types/dashboards'
import * as DashboardsReducers from 'src/types/reducers/dashboards'
import * as ErrorsActions from 'src/types/actions/errors'
import * as QueriesModels from 'src/types/queries'
import * as TempVarsModels from 'src/types/tempVars'
import * as NotificationsActions from 'src/types/actions/notifications'

export type LoadDashboardsActionCreator = (
  dashboards: DashboardsModels.Dashboard[],
  dashboardID?: number
) => LoadDashboardsAction

export interface LoadDashboardsAction {
  type: 'LOAD_DASHBOARDS'
  payload: {
    dashboards: DashboardsModels.Dashboard[]
    dashboardID: number
  }
}

export type LoadDashboardActionCreator = (
  dashboard: DashboardsModels.Dashboard
) => LoadDashboardAction

export interface LoadDashboardAction {
  type: 'LOAD_DASHBOARD'
  payload: {
    dashboard: DashboardsModels.Dashboard
  }
}

export interface SetDashTimeV1Action {
  type: 'SET_DASHBOARD_TIME_V1'
  payload: {
    dashboardID: number
    timeRange: QueriesModels.TimeRange
  }
}

export type SetDashTimeV1ActionCreator = (
  dashboardID: number,
  timeRange: QueriesModels.TimeRange
) => SetDashTimeV1Action

export interface RetainRangesDashTimeV1Action {
  type: 'RETAIN_RANGES_DASHBOARD_TIME_V1'
  payload: {
    dashboardIDs: string[]
  }
}

export type RetainRangesDashTimeV1ActionCreator = (
  dashboardIDs: string[]
) => RetainRangesDashTimeV1Action

export type SetTimeRangeActionCreator = (
  timeRange: QueriesModels.TimeRange
) => SetTimeRangeAction

export interface SetTimeRangeAction {
  type: 'SET_DASHBOARD_TIME_RANGE'
  payload: {
    timeRange: QueriesModels.TimeRange
  }
}

export type SetZoomedTimeRangeActionCreator = (
  zoomedTimeRange: QueriesModels.TimeRange
) => SetZoomedTimeRangeAction

export interface SetZoomedTimeRangeAction {
  type: 'SET_DASHBOARD_ZOOMED_TIME_RANGE'
  payload: {
    zoomedTimeRange: QueriesModels.TimeRange
  }
}

export interface UpdateDashboardAction {
  type: 'UPDATE_DASHBOARD'
  payload: {
    dashboard: DashboardsModels.Dashboard
  }
}

export type UpdateDashboardActionCreator = (
  dashboard: DashboardsModels.Dashboard
) => UpdateDashboardAction

export type CreateDashboardActionCreator = (
  dashboard: DashboardsModels.Dashboard
) => CreateDashboardAction

export interface CreateDashboardAction {
  type: 'CREATE_DASHBOARD'
  payload: {
    dashboard: DashboardsModels.Dashboard
  }
}

export type DeleteDashboardActionCreator = (
  dashboard: DashboardsModels.Dashboard
) => DeleteDashboardAction

export interface DeleteDashboardAction {
  type: 'DELETE_DASHBOARD'
  payload: {
    dashboard: DashboardsModels.Dashboard
  }
}

export type DeleteDashboardFailedActionCreator = (
  dashboard: DashboardsModels.Dashboard
) => DeleteDashboardFailedAction

export interface DeleteDashboardFailedAction {
  type: 'DELETE_DASHBOARD_FAILED'
  payload: {
    dashboard: DashboardsModels.Dashboard
  }
}

export type SyncDashboardCellActionCreator = (
  dashboard: DashboardsModels.Dashboard,
  cell: DashboardsModels.Cell
) => SyncDashboardCellAction

export interface SyncDashboardCellAction {
  type: 'SYNC_DASHBOARD_CELL'
  payload: {
    dashboard: DashboardsModels.Dashboard
    cell: DashboardsModels.Cell
  }
}

export type AddDashboardCellDispatcher = (
  dashboard: DashboardsModels.Dashboard,
  cellType?: DashboardsModels.CellType
) => AddDashboardCellThunk

export type AddDashboardCellThunk = (
  dispatch: Dispatch<
    | AddDashboardCellAction
    | NotificationsActions.PublishNotificationActionCreator
    | ErrorsActions.ErrorThrownActionCreator
  >
) => Promise<void>

export type AddDashboardCellActionCreator = (
  dashboard: DashboardsModels.Dashboard,
  cell: DashboardsModels.Cell
) => AddDashboardCellAction

export interface AddDashboardCellAction {
  type: 'ADD_DASHBOARD_CELL'
  payload: {
    dashboard: DashboardsModels.Dashboard
    cell: DashboardsModels.Cell
  }
}

export type CloneDashboardCellDispatcher = (
  dashboard: DashboardsModels.Dashboard,
  cell: DashboardsModels.Cell
) => CloneDashboardCellThunk

export type CloneDashboardCellThunk = (
  dispatch: Dispatch<
    | AddDashboardCellAction
    | NotificationsActions.PublishNotificationActionCreator
    | ErrorsActions.ErrorThrownActionCreator
  >
) => Promise<void>

export type DeleteDashboardCellDispatcher = (
  dashboard: DashboardsModels.Dashboard,
  cell: DashboardsModels.Cell
) => DeleteDashboardCellThunk

export type DeleteDashboardCellThunk = (
  dispatch: Dispatch<
    | DeleteDashboardCellActionCreator
    | NotificationsActions.PublishNotificationActionCreator
    | ErrorsActions.ErrorThrownActionCreator
  >
) => Promise<void>

export type DeleteDashboardCellActionCreator = (
  dashboard: DashboardsModels.Dashboard,
  cell: DashboardsModels.Cell
) => DeleteDashboardCellAction

export interface DeleteDashboardCellAction {
  type: 'DELETE_DASHBOARD_CELL'
  payload: {
    dashboard: DashboardsModels.Dashboard
    cell: DashboardsModels.Cell
  }
}

export type EditCellQueryStatusActionCreator = (
  queryID: string,
  status: string
) => EditCellQueryStatusAction

export interface EditCellQueryStatusAction {
  type: 'EDIT_CELL_QUERY_STATUS'
  payload: {
    queryID: string
    status: string
  }
}

export type TemplateVariableLocalSelectedActionCreator = (
  dashboardID: number,
  templateID: string,
  values: any[]
) => TemplateVariableLocalSelectedAction

export interface TemplateVariableLocalSelectedAction {
  type: 'TEMPLATE_VARIABLE_LOCAL_SELECTED'
  payload: {
    dashboardID: number
    templateID: string
    values: any[]
  }
}

export interface UpdateTemplatesAction {
  type: 'UPDATE_TEMPLATES'
  payload: {
    templates: TempVarsModels.Template[]
  }
}

export type SetHoverTimeActionCreator = (
  hoverTime: string
) => SetHoverTimeAction

export interface SetHoverTimeAction {
  type: 'SET_HOVER_TIME'
  payload: {
    hoverTime: string
  }
}

export type SetActiveCellActionCreator = (
  activeCellID: string
) => SetActiveCellAction

export interface SetActiveCellAction {
  type: 'SET_ACTIVE_CELL'
  payload: {
    activeCellID: string
  }
}

export type GetDashboardsDispatcher = () => GetDashboardsThunk

export type GetDashboardsThunk = (
  dispatch: Dispatch<ErrorsActions.ErrorThrownActionCreator>
) => Promise<DashboardsModels.Dashboard[] | void>

export type PutDashboardDispatcher = (
  dashboard: DashboardsModels.Dashboard
) => PutDashboardThunk

export type PutDashboardThunk = (
  dispatch: Dispatch<
    UpdateDashboardAction | ErrorsActions.ErrorThrownActionCreator
  >
) => Promise<void>

export type PutDashboardByIDDispatcher = (
  dashboardID: number
) => PutDashboardByIDThunk

export type PutDashboardByIDThunk = (
  dispatch: Dispatch<ErrorsActions.ErrorThrownActionCreator>,
  getState: () => DashboardsReducers.Dashboards
) => Promise<void>

export type DeleteDashboardDispatcher = (
  dashboard: DashboardsModels.Dashboard
) => DeleteDashboardThunk

export type DeleteDashboardThunk = (
  dispatch: Dispatch<
    | DeleteDashboardActionCreator
    | NotificationsActions.PublishNotificationActionCreator
    | ErrorsActions.ErrorThrownActionCreator
    | DeleteDashboardFailedActionCreator
  >
) => Promise<void>

export type UpdateDashboardCellDispatcher = (
  dashboard: DashboardsModels.Dashboard,
  cell: DashboardsModels.Cell
) => UpdateDashboardCellThunk

export type UpdateDashboardCellThunk = (
  dispatch: Dispatch<
    SyncDashboardCellActionCreator | ErrorsActions.ErrorThrownActionCreator
  >
) => Promise<void>

export type GetDashboardWithTemplates = (
  dashboardId: number,
  source: Source
) => ((dispatch: Dispatch<any>) => Promise<void>)
