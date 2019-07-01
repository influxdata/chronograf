import {PRESENTATION_MODE_ANIMATION_DELAY} from '../constants'

import {notify} from 'src/shared/actions/notifications'
import {notifyPresentationMode} from 'src/shared/copy/notifications'

import {Dispatch} from 'redux'
import {TimeZones} from 'src/types'

import {
  ActionTypes,
  EnablePresentationModeAction,
  DisablePresentationModeAction,
  ToggleTemplateVariableControlBarAction,
  DelayEnablePresentationModeDispatcher,
  SetAutoRefreshActionCreator,
  SetAutoRefreshAction,
} from 'src/types/actions/app'

// ephemeral state action creators

export const enablePresentationMode = (): EnablePresentationModeAction => ({
  type: ActionTypes.EnablePresentationMode,
})

export const disablePresentationMode = (): DisablePresentationModeAction => ({
  type: ActionTypes.DisablePresentationMode,
})

export const delayEnablePresentationMode: DelayEnablePresentationModeDispatcher = () => async (
  dispatch: Dispatch<EnablePresentationModeAction>
): Promise<NodeJS.Timer> =>
  setTimeout(() => {
    dispatch(enablePresentationMode())
    dispatch(notify(notifyPresentationMode()))
  }, PRESENTATION_MODE_ANIMATION_DELAY)

// persistent state action creators

export const setAutoRefresh: SetAutoRefreshActionCreator = (
  milliseconds: number
): SetAutoRefreshAction => ({
  type: ActionTypes.SetAutoRefresh,
  payload: {
    milliseconds,
  },
})

export const toggleTemplateVariableControlBar = (): ToggleTemplateVariableControlBarAction => ({
  type: ActionTypes.ToggleTemplateVariableControlBar,
})

export const setTimeZone = (timeZone: TimeZones) => ({
  type: ActionTypes.SetTimeZone,
  payload: {
    timeZone,
  },
})
