// libraries
import _ from 'lodash'
import uuid from 'uuid'

// actions
import {Action, ActionType} from 'src/dashboards/actions/cellEditorOverlay'

// utils
import {getDeep} from 'src/utils/wrappers'
import defaultQueryConfig from 'src/utils/defaultQueryConfig'

// constants
import {
  DEFAULT_THRESHOLDS_LIST_COLORS,
  DEFAULT_GAUGE_COLORS,
  validateGaugeColors,
  validateThresholdsListColors,
  getThresholdsListType,
} from 'src/shared/constants/thresholds'
import {
  DEFAULT_LINE_COLORS,
  validateLineColors,
} from 'src/shared/constants/graphColorPalettes'
import {initializeOptions} from 'src/dashboards/constants/cellEditor'
import {editor} from 'src/flux/constants'

// types
import {CellType, Cell, TimeRange} from 'src/types'
import {CellQuery, ThresholdType, TableOptions} from 'src/types/dashboards'
import {ThresholdColor, GaugeColor, LineColor} from 'src/types/colors'
import {NewDefaultCell} from 'src/types/dashboards'

export interface CEOInitialState {
  cell: Cell | NewDefaultCell | null
  thresholdsListType: ThresholdType
  thresholdsListColors: ThresholdColor[]
  gaugeColors: GaugeColor[]
  lineColors: LineColor[]
  queryDrafts: CellQuery[]
  timeRange: TimeRange
  script: string
}

export const initialState = {
  cell: null,
  thresholdsListType: ThresholdType.Text,
  thresholdsListColors: DEFAULT_THRESHOLDS_LIST_COLORS,
  gaugeColors: DEFAULT_GAUGE_COLORS,
  lineColors: DEFAULT_LINE_COLORS,
  queryDrafts: null,
  timeRange: null,
  script: editor.DEFAULT_SCRIPT,
}

const getNewQueryDrafts = (sourceLink?: string): CellQuery[] => {
  const id = uuid.v4()
  const newQueryConfig = {
    ...defaultQueryConfig({id}),
  }
  const newQueryDraft: CellQuery = {
    query: '',
    queryConfig: newQueryConfig,
    source: sourceLink || '',
    id,
    type: 'influxql',
  }
  return [newQueryDraft]
}

export default (state = initialState, action: Action): CEOInitialState => {
  switch (action.type) {
    case ActionType.LoadCEO: {
      const {cell, timeRange} = action.payload

      const tableOptions = getDeep<TableOptions>(
        cell,
        'tableOptions',
        initializeOptions(CellType.Table)
      )

      // QueryDrafts corresponds to InfluxQL queries, script to Flux queries
      // When saved, either the InfluxQL query or the script is saved to cell.queries

      let queryDrafts: CellQuery[]
      let script = editor.DEFAULT_SCRIPT
      const sourceLink = getDeep<string>(cell, 'queries.0.source', '')

      if (sourceLink.includes('service')) {
        script = getDeep<string>(cell, 'queries.0.query', editor.DEFAULT_SCRIPT)

        queryDrafts = getNewQueryDrafts(sourceLink)
      } else {
        queryDrafts = cell.queries.map(q => {
          const id = uuid.v4()
          const queryConfig = {...q.queryConfig, id}

          return {...q, queryConfig, id}
        })
      }
      if (_.isEmpty(queryDrafts)) {
        queryDrafts = getNewQueryDrafts()
      }

      if ((cell as Cell).colors) {
        const colors = (cell as Cell).colors

        const thresholdsListType = getThresholdsListType(colors)
        const thresholdsListColors = validateThresholdsListColors(
          colors,
          thresholdsListType
        )
        const gaugeColors = validateGaugeColors(colors)

        const lineColors = validateLineColors(colors)

        return {
          ...state,
          cell: {...cell, tableOptions},
          thresholdsListType,
          thresholdsListColors,
          gaugeColors,
          lineColors,
          queryDrafts,
          timeRange,
          script,
        }
      }
      return {
        ...state,
        cell: {...cell, tableOptions},
        queryDrafts,
        timeRange,
        script,
      }
    }

    case ActionType.ClearCEO: {
      const cell = null
      const timeRange = null
      const script = editor.DEFAULT_SCRIPT

      return {...state, cell, timeRange, script}
    }

    case ActionType.ChangeCellType: {
      const {cellType} = action.payload
      const cell = {...state.cell, type: cellType}

      return {...state, cell}
    }

    case ActionType.UpdateCellNote: {
      const {note} = action.payload
      const cell = {...state.cell, note}

      return {...state, cell}
    }

    case ActionType.UpdateCellNoteVisibility: {
      const {noteVisibility} = action.payload
      const cell = {...state.cell, noteVisibility}

      return {...state, cell}
    }

    case ActionType.RenameCell: {
      const {cellName} = action.payload
      const cell = {...state.cell, name: cellName}

      return {...state, cell}
    }

    case ActionType.UpdateThresholdsListColors: {
      const {thresholdsListColors} = action.payload

      return {...state, thresholdsListColors}
    }

    case ActionType.UpdateThresholdsListType: {
      const {thresholdsListType} = action.payload

      const thresholdsListColors = state.thresholdsListColors.map(color => ({
        ...color,
        type: thresholdsListType,
      }))

      return {...state, thresholdsListType, thresholdsListColors}
    }

    case ActionType.UpdateGaugeColors: {
      const {gaugeColors} = action.payload

      return {...state, gaugeColors}
    }

    case ActionType.UpdateAxes: {
      const {axes} = action.payload
      const cell = {...state.cell, axes}

      return {...state, cell}
    }

    case ActionType.UpdateTableOptions: {
      const {tableOptions} = action.payload
      const cell = {...state.cell, tableOptions}

      return {...state, cell}
    }

    case ActionType.ChangeTimeFormat: {
      const {timeFormat} = action.payload
      const cell = {...state.cell, timeFormat}

      return {...state, cell}
    }

    case ActionType.ChangeDecimalPlaces: {
      const {decimalPlaces} = action.payload
      const cell = {...state.cell, decimalPlaces}

      return {...state, cell}
    }

    case ActionType.UpdateFieldOptions: {
      const {fieldOptions} = action.payload
      const cell = {...state.cell, fieldOptions}

      return {...state, cell}
    }

    case ActionType.UpdateLineColors: {
      const {lineColors} = action.payload

      return {...state, lineColors}
    }

    case ActionType.UpdateQueryDrafts: {
      const {queryDrafts} = action.payload

      return {...state, queryDrafts}
    }

    case ActionType.UpdateEditorTimeRange: {
      const {timeRange} = action.payload

      return {...state, timeRange}
    }

    case ActionType.UpdateScript: {
      const {script} = action.payload

      return {...state, script}
    }
  }

  return state
}
