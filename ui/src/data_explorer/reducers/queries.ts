// libraries
import _ from 'lodash'
import uuid from 'uuid'

// actions
import {Action, ActionType} from 'src/data_explorer/actions/queries'

// utils
import defaultQueryConfig from 'src/utils/defaultQueryConfig'

// constants
import {timeRanges} from 'src/shared/data/timeRanges'
import {editor} from 'src/flux/constants'
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

// types
import {CellType} from 'src/types'
import {DEState} from 'src/types/dataExplorer'
import {
  CellQuery,
  ThresholdType,
  NoteVisibility,
  QueryType,
} from 'src/types/dashboards'

const {lower, upper} = timeRanges.find(tr => tr.lower === 'now() - 1h')

export const initialState: DEState = {
  queryDrafts: [],
  timeRange: {lower, upper},
  queryStatus: {queryID: null, status: null},
  script: editor.DEFAULT_SCRIPT,
  sourceLink: '',
  visType: CellType.Line,
  thresholdsListType: ThresholdType.Text,
  thresholdsListColors: DEFAULT_THRESHOLDS_LIST_COLORS,
  gaugeColors: DEFAULT_GAUGE_COLORS,
  lineColors: DEFAULT_LINE_COLORS,
  axes: DEFAULT_AXES,
  tableOptions: DEFAULT_TABLE_OPTIONS,
  timeFormat: DEFAULT_TIME_FORMAT,
  decimalPlaces: DEFAULT_DECIMAL_PLACES,
  fieldOptions: DEFAULT_FIELD_OPTIONS,
  note: '',
  noteVisibility: NoteVisibility.Default,
}

export default (state = initialState, action: Action): DEState => {
  switch (action.type) {
    case ActionType.LoadDE: {
      const {timeRange, queries} = action.payload

      let queryDrafts: CellQuery[] = queries.map(q => {
        const id = _.get(q, 'queryConfig.id')
        return {...q, id}
      })

      if (_.isEmpty(queryDrafts)) {
        const id = uuid.v4()
        const newQueryConfig = {
          ...defaultQueryConfig({id}),
        }
        const newQueryDraft: CellQuery = {
          query: '',
          queryConfig: newQueryConfig,
          source: '',
          id,
          type: QueryType.InfluxQL,
        }
        queryDrafts = [newQueryDraft]
      }

      return {
        ...state,
        queryDrafts,
        timeRange,
      }
    }

    case ActionType.UpdateQueryDrafts: {
      const {queryDrafts} = action.payload

      return {...state, queryDrafts}
    }

    case ActionType.UpdateEditorTimeRange: {
      const {timeRange} = action.payload

      return {...state, timeRange}
    }

    case ActionType.UpdateQueryStatus: {
      const {queryID, status} = action.payload
      const queryStatus = {queryID, status}

      return {...state, queryStatus}
    }

    case ActionType.UpdateScript: {
      const {script} = action.payload

      return {...state, script}
    }

    case ActionType.UpdateSourceLink: {
      const {sourceLink} = action.payload

      return {...state, sourceLink}
    }

    case ActionType.ChangeVisualizationType: {
      const {cellType} = action.payload

      return {...state, visType: cellType}
    }

    case ActionType.UpdateThresholdsListColors: {
      const {thresholdsListColors} = action.payload

      return {...state, thresholdsListColors}
    }

    case ActionType.UpdateThresholdsListType: {
      const {thresholdsListType} = action.payload

      const thresholdsListColors = state.thresholdsListColors.map(color => {
        return {...color, type: thresholdsListType}
      })

      return {...state, thresholdsListColors, thresholdsListType}
    }

    case ActionType.UpdateGaugeColors: {
      const {gaugeColors} = action.payload

      return {...state, gaugeColors}
    }

    case ActionType.UpdateAxes: {
      const {axes} = action.payload

      return {...state, axes}
    }

    case ActionType.UpdateTableOptions: {
      const {tableOptions} = action.payload

      return {...state, tableOptions}
    }

    case ActionType.ChangeTimeFormat: {
      const {timeFormat} = action.payload

      return {...state, timeFormat}
    }

    case ActionType.ChangeDecimalPlaces: {
      const {decimalPlaces} = action.payload

      return {...state, decimalPlaces}
    }

    case ActionType.UpdateFieldOptions: {
      const {fieldOptions} = action.payload

      return {...state, fieldOptions}
    }

    case ActionType.UpdateLineColors: {
      const {lineColors} = action.payload

      return {...state, lineColors}
    }

    case ActionType.UpdateNote: {
      const {note} = action.payload

      return {...state, note}
    }

    case ActionType.UpdateNoteVisibility: {
      const {noteVisibility} = action.payload

      return {...state, noteVisibility}
    }
  }

  return state
}
