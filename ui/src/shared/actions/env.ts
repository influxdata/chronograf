import {
  ActionTypes,
  SetTelegrafSystemIntervalAction,
  SetHostPageDisplayStatusAction,
  SetV3SupportEnabledAction,
} from 'src/types/actions/app'

export type SetTelegrafSystemIntervalActionCreator = (
  telegrafSystemInterval: string
) => SetTelegrafSystemIntervalAction

export type SetHostPageDisplayStatusActionCreator = (
  isHostPageDisabled: boolean
) => SetHostPageDisplayStatusAction

export type SetV3SupportEnabledActionCreator = (
  v3SupportEnabled: boolean
) => SetV3SupportEnabledAction

export const setTelegrafSystemInterval: SetTelegrafSystemIntervalActionCreator = (
  telegrafSystemInterval
): SetTelegrafSystemIntervalAction => ({
  type: ActionTypes.SetTelegrafSystemInterval,
  payload: {
    telegrafSystemInterval,
  },
})

export const setHostPageDisplayStatus: SetHostPageDisplayStatusActionCreator = (
  hostPageDisabled
): SetHostPageDisplayStatusAction => ({
  type: ActionTypes.SetHostPageDisplayStatus,
  payload: {
    hostPageDisabled,
  },
})

export const setV3SupportEnabled: SetV3SupportEnabledActionCreator = (
  v3SupportEnabled
): SetV3SupportEnabledAction => ({
  type: ActionTypes.SetV3SupportEnabled,
  payload: {
    v3SupportEnabled,
  },
})
