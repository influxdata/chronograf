import actionCreatorFactory, {
  ActionCreator,
  EmptyActionCreator,
} from 'typescript-fsa'

const actionCreator = actionCreatorFactory('NOTIFICATIONS')

// TODO
// // this validator is purely for development purposes. It might make sense to move this to a middleware.
// const validTypes = ['error', 'success', 'warning']
// if (!validTypes.includes(type) || message === undefined) {
//   console.error('handleNotification must have a valid type and text') // eslint-disable-line no-console
// }

export const publishNotification = actionCreator<{
  type: string
  message: string
}>('RECEIVED')

export const dismissNotification = actionCreator<{type: string}>('DISMISSED')

export const dismissAllNotifications = actionCreator('ALL_DISMISSED')
