import {Dispatch} from 'redux'
import {TimeZones} from 'src/types'

export enum ActionTypes {
  EnablePresentationMode = 'ENABLE_PRESENTATION_MODE',
  DisablePresentationMode = 'DISABLE_PRESENTATION_MODE',
  SetAutoRefresh = 'SET_AUTOREFRESH',
  ToggleTemplateVariableControlBar = 'TOGGLE_TEMPLATE_VARIABLE_CONTROL_BAR',
  Noop = 'NOOP',
  SetTimeZone = 'SET_TIME_ZONE',
}

export type Action =
  | EnablePresentationModeAction
  | DisablePresentationModeAction
  | SetAutoRefreshAction
  | ToggleTemplateVariableControlBarAction
  | SetTimeZoneAction

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
