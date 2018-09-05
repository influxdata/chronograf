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

import {CellType} from 'src/types'
import {ThresholdType, NoteVisibility} from 'src/types/dashboards'
import {LocalStorage} from 'src/types/localStorage'

const VERSION = process.env.npm_package_version

export const loadLocalStorage = (errorsQueue: any[]): LocalStorage | {} => {
  try {
    const serializedState = localStorage.getItem('state')

    const state = JSON.parse(serializedState) || {}

    if (state.VERSION && state.VERSION !== VERSION) {
      const version = VERSION ? ` (${VERSION})` : ''

      console.log(notifyNewVersion(version).message) // tslint:disable-line no-console
      errorsQueue.push(notifyNewVersion(version))

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
    ])

    window.localStorage.setItem(
      'state',
      JSON.stringify(
        _.omit(
          {
            ...appPersisted,
            VERSION,
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
              tableInfiniteData: minimalLogs.tableInfiniteData || {},
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
