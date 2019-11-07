import {
  ActionTypes,
  SetTelegrafSystemIntervalAction,
  SetHostPageDisplayStatusAction,
} from 'src/types/actions/app'

export type SetTelegrafSystemIntervalActionCreator = (
  telegrafSystemInterval: string
) => SetTelegrafSystemIntervalAction

export type SetHostPageDisplayStatusActionCreator = (
  isHostPageDisabled: boolean
) => SetHostPageDisplayStatusAction

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
