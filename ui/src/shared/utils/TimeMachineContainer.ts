// Libraries
import {Container} from 'unstated'
import uuid from 'uuid'

// Utils
import {
  fill,
  timeShift,
  chooseTag,
  groupByTag,
  removeFuncs,
  groupByTime,
  toggleField,
  chooseNamespace,
  chooseMeasurement,
  addInitialField,
  applyFuncsToField,
  toggleTagAcceptance,
} from 'src/utils/queryTransitions'
import {getTimeRange} from 'src/dashboards/utils/cellGetters'
import {buildQuery} from 'src/utils/influxql'
import defaultQueryConfig from 'src/utils/defaultQueryConfig'

// Constants
import {TYPE_QUERY_CONFIG} from 'src/dashboards/constants'
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
import {DEFAULT_TIME_RANGE} from 'src/data_explorer/constants'

// Types
import {
  Status,
  Field,
  GroupBy,
  Tag,
  TimeShift,
  ApplyFuncsToFieldArgs,
  CellQuery,
  QueryType,
  TimeRange,
  CellType,
  QueryConfig,
} from 'src/types'
import {
  DecimalPlaces,
  FieldOption,
  ThresholdType,
  TableOptions,
  NoteVisibility,
  Axes,
} from 'src/types/dashboards'
import {ColorString, ColorNumber} from 'src/types/colors'

export interface TimeMachineState {
  script: string
  queryDrafts: CellQuery[]
  timeRange: TimeRange
  type: CellType
  axes: Axes | null
  tableOptions: TableOptions
  fieldOptions: FieldOption[]
  timeFormat: string
  decimalPlaces: DecimalPlaces
  note: string
  noteVisibility: NoteVisibility
  thresholdsListColors: ColorNumber[]
  thresholdsListType: ThresholdType
  gaugeColors: ColorNumber[]
  lineColors: ColorString[]
}

export class TimeMachineContainer extends Container<TimeMachineState> {
  constructor(initialState: Partial<TimeMachineState> = {}) {
    super()

    this.state = {
      script: '',
      queryDrafts: [],
      timeRange: DEFAULT_TIME_RANGE,
      type: CellType.Line,
      note: '',
      noteVisibility: NoteVisibility.Default,
      thresholdsListType: ThresholdType.Text,
      thresholdsListColors: DEFAULT_THRESHOLDS_LIST_COLORS,
      gaugeColors: DEFAULT_GAUGE_COLORS,
      lineColors: DEFAULT_LINE_COLORS,
      axes: DEFAULT_AXES,
      tableOptions: DEFAULT_TABLE_OPTIONS,
      timeFormat: DEFAULT_TIME_FORMAT,
      decimalPlaces: DEFAULT_DECIMAL_PLACES,
      fieldOptions: DEFAULT_FIELD_OPTIONS,
      ...initialState,
    }
  }

  public handleChangeScript = (script: string) => {
    return this.setState({script})
  }

  public handleUpdateTimeRange = (timeRange: TimeRange) => {
    return this.setState({timeRange})
  }

  public handleUpdateQueryDrafts = (queryDrafts: CellQuery[]) => {
    return this.setState({queryDrafts})
  }

  public handleToggleField = (queryID: string, fieldFunc: Field) => {
    return this.updateQueryDrafts(queryID, q => ({
      ...toggleField(q, fieldFunc),
      rawText: null,
    }))
  }

  public handleGroupByTime = (queryID: string, time: string) => {
    return this.updateQueryDrafts(queryID, q => groupByTime(q, time))
  }

  public handleFill = (queryID: string, value: string) => {
    return this.updateQueryDrafts(queryID, q => fill(q, value))
  }

  public handleRemoveFuncs = (queryID: string, fields: Field[]) => {
    return this.updateQueryDrafts(queryID, q => removeFuncs(q, fields))
  }

  public handleApplyFuncsToField = (
    queryID: string,
    fieldFunc: ApplyFuncsToFieldArgs,
    groupBy?: GroupBy
  ) => {
    return this.updateQueryDrafts(queryID, q =>
      applyFuncsToField(q, fieldFunc, groupBy)
    )
  }

  public handleChooseTag = (queryID: string, tag: Tag) => {
    return this.updateQueryDrafts(queryID, q => chooseTag(q, tag))
  }

  public handleChooseNamespace = (
    queryID: string,
    options: {database: string; retentionPolicy: string}
  ) => {
    return this.updateQueryDrafts(queryID, q => chooseNamespace(q, options))
  }

  public handleChooseMeasurement = (queryID: string, measurement: string) => {
    return this.updateQueryDrafts(queryID, q => ({
      ...chooseMeasurement(q, measurement),
      rawText: q.rawText || '',
    }))
  }

  public handleGroupByTag = (queryID: string, tagKey: string) => {
    return this.updateQueryDrafts(queryID, q => groupByTag(q, tagKey))
  }

  public handleToggleTagAcceptance = (queryID: string) => {
    return this.updateQueryDrafts(queryID, q => toggleTagAcceptance(q))
  }

  public handleAddInitialField = (
    queryID: string,
    field: Field,
    groupBy: GroupBy
  ) => {
    return this.updateQueryDrafts(queryID, q =>
      addInitialField(q, field, groupBy)
    )
  }

  public handleEditQueryStatus = (queryID: string, status: Status) => {
    return this.updateQueryDrafts(queryID, q => ({...q, status}))
  }

  public handleTimeShift = (queryID: string, shift: TimeShift) => {
    return this.updateQueryDrafts(queryID, q => timeShift(q, shift))
  }

  public handleAddQuery = (): Promise<void> => {
    const {queryDrafts} = this.state
    const queryID = uuid.v4()
    const newQueryDraft: CellQuery = {
      query: '',
      queryConfig: defaultQueryConfig({id: queryID}),
      source: '',
      id: queryID,
      type: QueryType.InfluxQL,
    }

    return this.setState({queryDrafts: [...queryDrafts, newQueryDraft]})
  }

  public handleDeleteQuery = (queryID: string) => {
    const {queryDrafts} = this.state
    const updatedQueryDrafts = queryDrafts.filter(query => query.id !== queryID)

    return this.setState({queryDrafts: updatedQueryDrafts})
  }

  public handleUpdateType = (type: CellType) => {
    return this.setState({type})
  }

  public handleUpdateNote = (note: string) => {
    return this.setState({note})
  }

  public handleUpdateNoteVisibility = (noteVisibility: NoteVisibility) => {
    return this.setState({noteVisibility})
  }

  public handleUpdateThresholdsListColors = (
    thresholdsListColors: ColorNumber[]
  ) => {
    return this.setState({thresholdsListColors})
  }

  public handleUpdateThresholdsListType = (
    thresholdsListType: ThresholdType
  ) => {
    return this.setState({thresholdsListType})
  }

  public handleUpdateGaugeColors = (gaugeColors: ColorNumber[]) => {
    return this.setState({gaugeColors})
  }

  public handleUpdateAxes = (axes: Axes) => {
    return this.setState({axes})
  }

  public handleUpdateTableOptions = (tableOptions: TableOptions) => {
    return this.setState({tableOptions})
  }

  public handleUpdateLineColors = (lineColors: ColorString[]) => {
    return this.setState({lineColors})
  }

  public handleUpdateTimeFormat = (timeFormat: string) => {
    return this.setState({timeFormat})
  }

  public handleUpdateDecimalPlaces = (decimalPlaces: DecimalPlaces) => {
    return this.setState({decimalPlaces})
  }

  public handleUpdateFieldOptions = (fieldOptions: FieldOption[]) => {
    return this.setState({fieldOptions})
  }

  private updateQueryDrafts = (
    queryID: string,
    nextQueryConfigFn: ((q: QueryConfig) => QueryConfig)
  ) => {
    const {queryDrafts} = this.state
    const updatedQueryDrafts = queryDrafts.map(query => {
      if (query.id === queryID) {
        const nextQueryConfig = nextQueryConfigFn(query.queryConfig)

        return {
          ...query,
          query: buildQuery(
            TYPE_QUERY_CONFIG,
            getTimeRange(nextQueryConfig),
            nextQueryConfig
          ),
          queryConfig: nextQueryConfig,
        }
      }
      return query
    })

    return this.setState({queryDrafts: updatedQueryDrafts})
  }
}
