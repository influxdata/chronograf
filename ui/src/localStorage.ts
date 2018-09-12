import _ from 'lodash'
import normalizer from 'src/normalizers/dashboardTime'
import {
  notifyNewVersion,
  notifyLoadLocalSettingsFailed,
} from 'src/shared/copy/notifications'

import {
  DEFAULT_THRESHOLDS_LIST_COLORS,
  DEFAULT_GAUGE_COLORS,
} from 'src/shared/constants/thresholds'
import {DEFAULT_LINE_COLORS} from 'src/shared/constants/graphColorPalettes'
import {DEFAULT_AXES} from 'src/dashboards/constants/cellEditor'
import {
  DEFAULT_TABLE_OPTIONS,
  DEFAULT_TIME_FORMAT,
  DEFAULT_DECIMAL_PLACES,
  DEFAULT_FIELD_OPTIONS,
} from 'src/dashboards/constants'
import {editor} from 'src/flux/constants'
import {defaultTableData} from 'src/logs/constants'

import {CellType} from 'src/types'
import {ThresholdType, NoteVisibility} from 'src/types/dashboards'
import {LocalStorage} from 'src/types/localStorage'

const VERSION = process.env.npm_package_version
const GIT_SHA = process.env.GIT_SHA

export const loadLocalStorage = (errorsQueue: any[]): LocalStorage | {} => {
  try {
    const serializedState = localStorage.getItem('state')
    const state = JSON.parse(serializedState) || {}
    const gitSHAChanged = state.GIT_SHA && state.GIT_SHA !== GIT_SHA
    const npmVersionChanged = state.VERSION && state.VERSION !== VERSION

    if (npmVersionChanged || gitSHAChanged) {
      window.localStorage.removeItem('state')

      if (npmVersionChanged) {
        errorsQueue.push(notifyNewVersion(VERSION))
      }

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
  app: {persisted},
  timeRange,
  dataExplorer,
  dashTimeV1: {ranges},
  logs,
  script,
}: LocalStorage): void => {
  try {
    const appPersisted = {app: {persisted}}
    const dashTimeV1 = {ranges: normalizer(ranges)}

    const minimalLogs = _.omit(logs, [
      'tableData',
      'histogramData',
      'queryCount',
      'tableInfiniteData',
    ])

    window.localStorage.setItem(
      'state',
      JSON.stringify(
        _.omit(
          {
            ...appPersisted,
            VERSION,
            GIT_SHA,
            timeRange,
            dashTimeV1,
            dataExplorer: {
              ...dataExplorer,
              queryDrafts: dataExplorer.queryDrafts || [],
              timeRange: dataExplorer.timeRange || {},
              sourceLink: dataExplorer.sourceLink || '',
              queryStatus: dataExplorer.queryStatus || {},
              script: dataExplorer.script || editor.DEFAULT_SCRIPT,
              visType: dataExplorer.visType || CellType.Line,
              thresholdsListType:
                dataExplorer.thresholdsListType || ThresholdType.Text,
              thresholdsListColors:
                dataExplorer.thresholdsListColors ||
                DEFAULT_THRESHOLDS_LIST_COLORS,
              gaugeColors: dataExplorer.gaugeColors || DEFAULT_GAUGE_COLORS,
              lineColors: dataExplorer.lineColors || DEFAULT_LINE_COLORS,
              axes: dataExplorer.axes || DEFAULT_AXES,
              tableOptions: dataExplorer.tableOptions || DEFAULT_TABLE_OPTIONS,
              timeFormat: dataExplorer.timeFormat || DEFAULT_TIME_FORMAT,
              decimalPlaces:
                dataExplorer.decimalPlaces || DEFAULT_DECIMAL_PLACES,
              fieldOptions: dataExplorer.fieldOptions || DEFAULT_FIELD_OPTIONS,
              noteVisibility:
                dataExplorer.noteVisibility || NoteVisibility.Default,
            },
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
          },
          'dataExplorerQueryConfigs'
        )
      )
    )
  } catch (err) {
    console.error('Unable to save data explorer: ', JSON.parse(err))
  }
}
