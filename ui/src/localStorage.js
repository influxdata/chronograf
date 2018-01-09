import _ from 'lodash'
import normalizer from 'src/normalizers/dashboardTime'

export const loadLocalStorage = errorsQueue => {
  try {
    const serializedState = localStorage.getItem('state')

    const state = JSON.parse(serializedState) || {}

    if (state.VERSION && state.VERSION !== process.env.VERSION) {
      const errorText =
        'New version of Chronograf detected. Local settings cleared.'

      console.log(errorText) // tslint:disable-line no-console
      errorsQueue.push(errorText)

      if (!state.dashTimeV1) {
        window.localStorage.removeItem('state')
        return {}
      }

      const ranges = normalizer(_.get(state, ['dashTimeV1', 'ranges'], []))
      const dashTimeV1 = {ranges}

      window.localStorage.setItem(
        'state',
        JSON.stringify({
          dashTimeV1,
        })
      )

      return {dashTimeV1}
    }

    delete state.VERSION

    return state
  } catch (error) {
    const errorText = `Loading local settings failed: ${error}`

    console.error(errorText)
    errorsQueue.push(errorText)

    return {}
  }
}

export const saveToLocalStorage = ({
  app: {persisted},
  dataExplorerQueryConfigs,
  timeRange,
  dataExplorer,
  dashTimeV1: {ranges},
  dismissedNotifications,
}) => {
  try {
    const appPersisted = Object.assign({}, {app: {persisted}})
    const dashTimeV1 = {ranges: normalizer(ranges)}

    window.localStorage.setItem(
      'state',
      JSON.stringify({
        ...appPersisted,
        dataExplorerQueryConfigs,
        timeRange,
        dataExplorer,
        VERSION: process.env.VERSION,
        dashTimeV1,
        dismissedNotifications,
      })
    )
  } catch (err) {
    console.error('Unable to save data explorer: ', JSON.parse(err))
  }
}
