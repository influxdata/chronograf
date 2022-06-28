import {Dispatch} from 'redux'
import {
  AddingAnnotationAction,
  SetAnnotationsDisplaySettingAction,
} from 'src/shared/actions/annotations'
import {TimeZones} from 'src/types'

export enum ActionTypes {
  EnablePresentationMode = 'ENABLE_PRESENTATION_MODE',
  DisablePresentationMode = 'DISABLE_PRESENTATION_MODE',
  SetAutoRefresh = 'SET_AUTOREFRESH',
  ToggleTemplateVariableControlBar = 'TOGGLE_TEMPLATE_VARIABLE_CONTROL_BAR',
  ToggleShowAnnotationControls = 'TOGGLE_SHOW_ANNOTATION_CONTROLS',
  Noop = 'NOOP',
  SetTimeZone = 'SET_TIME_ZONE',
  SetTelegrafSystemInterval = 'SET_TELEGRAF_SYSTEM_INTERVAL',
  SetHostPageDisplayStatus = 'SET_HOST_PAGE_DISPLAY_STATUS',
}

export type Action =
  | EnablePresentationModeAction
  | DisablePresentationModeAction
  | SetAutoRefreshAction
  | ToggleTemplateVariableControlBarAction
  | ToggleShowAnnotationControlsAction
  | SetTimeZoneAction
  | SetTelegrafSystemIntervalAction
  | SetHostPageDisplayStatusAction
  | AddingAnnotationAction
  | SetAnnotationsDisplaySettingAction

export type EnablePresentationModeActionCreator = () => EnablePresentationModeAction

export interface EnablePresentationModeAction {
  type: ActionTypes.EnablePresentationMode
}

export interface DisablePresentationModeAction {
  type: ActionTypes.DisablePresentationMode
}

export interface ToggleTemplateVariableControlBarAction {
  type: ActionTypes.ToggleTemplateVariableControlBar
}
export interface ToggleShowAnnotationControlsAction {
  type: ActionTypes.ToggleShowAnnotationControls
}

export type DelayEnablePresentationModeDispatcher = () => DelayEnablePresentationModeThunk

export type DelayEnablePresentationModeThunk = (
  dispatch: Dispatch<EnablePresentationModeAction>
) => Promise<NodeJS.Timer>

export type SetAutoRefreshActionCreator = (
  milliseconds: number
) => SetAutoRefreshAction

export interface SetAutoRefreshAction {
  type: ActionTypes.SetAutoRefresh
  payload: {
    milliseconds: number
  }
}

export interface SetTimeZoneAction {
  type: ActionTypes.SetTimeZone
  payload: {
    timeZone: TimeZones
  }
}

export interface SetTelegrafSystemIntervalAction {
  type: ActionTypes.SetTelegrafSystemInterval
  payload: {
    telegrafSystemInterval: string
  }
}

export interface SetHostPageDisplayStatusAction {
  type: ActionTypes.SetHostPageDisplayStatus
  payload: {
    hostPageDisabled: boolean
  }
}
