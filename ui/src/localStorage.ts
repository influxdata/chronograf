import _ from 'lodash'
import dashBoardTimeNormalizer from 'src/normalizers/dashboardTime'
import dashBoardRefreshNormalizer from 'src/normalizers/dashboardRefresh'
import {
  notifyNewVersion,
  notifyLoadLocalSettingsFailed,
} from 'src/shared/copy/notifications'

import {defaultTableData} from 'src/logs/constants'
import {VERSION, GIT_SHA} from 'src/shared/constants'

import {LocalStorage} from 'src/types/localStorage'

export const loadLocalStorage = (errorsQueue: any[]): LocalStorage | {} => {
  try {
    const serializedState = localStorage.getItem('state')
    const state = JSON.parse(serializedState) || {}
    const gitSHAChanged = state.GIT_SHA && state.GIT_SHA !== GIT_SHA
    const npmVersionChanged = state.VERSION && state.VERSION !== VERSION

    if (
      npmVersionChanged ||
      gitSHAChanged ||
      window.location.search === '?clearLocalStorage'
    ) {
      window.localStorage.removeItem('state')

      if (npmVersionChanged) {
        errorsQueue.push(notifyNewVersion(VERSION))
      }

      // eslint-disable-next-line no-console
      console.debug('Cleared Chronograf localStorage state')

      return {}
    }

    delete state.VERSION
    delete state.GIT_SHA

    return state
  } catch (error) {
    console.error(notifyLoadLocalSettingsFailed(error).message)
    errorsQueue.push(notifyLoadLocalSettingsFailed(error))

    return {}
  }
}

export const saveToLocalStorage = ({
  app,
  timeRange,
  dashTimeV1: {ranges, refreshes},
  logs,
  script,
}: LocalStorage): void => {
  try {
    const dashTimeV1 = {
      ranges: dashBoardTimeNormalizer(ranges),
      refreshes: dashBoardRefreshNormalizer(refreshes),
    }

    const minimalLogs = _.omit(logs, [
      'tableData',
      'histogramData',
      'queryCount',
      'tableInfiniteData',
      'newRowsAdded',
      'searchStatus',
      'queryCount',
      'nextOlderUpperBound',
      'nextOlderLowerBound',
      'nextNewerUpperBound',
      'nextNewerLowerBound',
      'currentTailUpperBound',
      'nextTailLowerBound',
      'tailChunkDurationMs',
      'olderChunkDurationMs',
      'newerChunkDurationMs',
    ])

    window.localStorage.setItem(
      'state',
      JSON.stringify({
        app: {
          ...app,
          persisted: app.persisted,
        },
        VERSION,
        GIT_SHA,
        timeRange,
        dashTimeV1,
        script,
        logs: {
          ...minimalLogs,
          histogramData: [],
          tableData: {},
          queryCount: 0,
          tableInfiniteData: {
            forward: defaultTableData,
            backward: defaultTableData,
          },
          tableTime: minimalLogs.tableTime || {},
        },
      })
    )
  } catch (err) {
    console.error('Unable to save data explorer: ', JSON.parse(err))
  }
}
