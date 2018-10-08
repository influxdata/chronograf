// Libraries
import React, {PureComponent} from 'react'
import _ from 'lodash'
import memoizeOne from 'memoize-one'

// Utils
import {manager} from 'src/worker/JobManager'
import {
  ErrorTypes,
  getInvalidDataMessage,
  computeFieldOptions,
  getDefaultTimeField,
} from 'src/dashboards/utils/tableGraph'

// Components
import InvalidData from 'src/shared/components/InvalidData'

// Constants
import {
  DEFAULT_SORT_DIRECTION,
  ASCENDING,
  DESCENDING,
} from 'src/shared/constants/tableGraph'

// Types
import {
  TimeSeriesValue,
  TimeSeriesToTableGraphReturnType,
} from 'src/types/series'
import {
  TableOptions,
  FieldOption,
  DecimalPlaces,
  Sort,
} from 'src/types/dashboards'
import {DataType} from 'src/shared/constants'
import {ColumnWidths} from 'src/dashboards/utils/tableGraph'

interface Props {
  data: TimeSeriesToTableGraphReturnType
  dataType: DataType
  tableOptions: TableOptions
  timeFormat: string
  decimalPlaces: DecimalPlaces
  fieldOptions: FieldOption[]
  uuid: string
  children: (
    data: FormattedTableData,
    sort: Sort,
    computedFieldOptions: FieldOption[],
    resortData: (fieldName: string) => void
  ) => JSX.Element
}

export interface FormattedTableData {
  transformedData: TimeSeriesValue[][]
  sortedTimeVals: TimeSeriesValue[]
  columnWidths: ColumnWidths
}

interface State {
  formattedData: FormattedTableData
  sort: Sort
  computedFieldOptions: FieldOption[]
  invalidDataError: ErrorTypes
}

interface FormatProperties {
  sort?: Sort
  fieldOptions: FieldOption[]
  tableOptions: TableOptions
  timeFormat: string
  decimalPlaces: DecimalPlaces
  uuid: string
}
const areFormatPropertiesEqual = (
  prevProperties: FormatProperties,
  newProperties: FormatProperties
) => {
  const formatProps = [
    'uuid',
    'tableOptions',
    'fieldOptions',
    'timeFormat',
    'sort',
  ]

  const areEqual = formatProps.every(k =>
    _.isEqual(prevProperties[k], newProperties[k])
  )

  return areEqual
}

class TableGraphFormat extends PureComponent<Props, State> {
  private isComponentMounted: boolean
  private memoizedTableTransform = memoizeOne(
    manager.tableTransform,
    areFormatPropertiesEqual
  )

  constructor(props: Props) {
    super(props)

    const sortField: string = _.get(
      this.props,
      'tableOptions.sortBy.internalName',
      ''
    )

    this.state = {
      formattedData: null,
      sort: {field: sortField, direction: DEFAULT_SORT_DIRECTION},
      computedFieldOptions: props.fieldOptions,
      invalidDataError: null,
    }
  }

  public render() {
    if (this.state.invalidDataError) {
      return (
        <InvalidData
          message={getInvalidDataMessage(this.state.invalidDataError)}
        />
      )
    }

    if (!this.state.formattedData) {
      return null
    }

    return this.props.children(
      this.state.formattedData,
      this.state.sort,
      this.state.computedFieldOptions,
      this.formatData
    )
  }

  public componentDidMount() {
    this.isComponentMounted = true

    this.formatData()
  }

  public componentWillUnmount() {
    this.isComponentMounted = false
  }

  public componentDidUpdate(prevProps: Props) {
    if (!areFormatPropertiesEqual(prevProps, this.props)) {
      this.formatData()
    }
  }

  private formatData = async (sortField?: string) => {
    const {
      fieldOptions,
      data: {sortedLabels, influxQLQueryType},
      dataType,
      tableOptions,
      timeFormat,
      decimalPlaces,
    } = this.props

    const sort = {...this.state.sort}

    if (sortField === sort.field) {
      sort.direction = sort.direction === ASCENDING ? DESCENDING : ASCENDING
    } else {
      sort.field = sortField || this.sortField
      sort.direction = DEFAULT_SORT_DIRECTION
    }

    const latestUUID = this.props.uuid

    const computedFieldOptions = computeFieldOptions(
      fieldOptions,
      sortedLabels,
      dataType,
      influxQLQueryType
    )

    try {
      const formattedData = await this.memoizedTableTransform({
        data: this.props.data.data,
        sort,
        fieldOptions: computedFieldOptions,
        tableOptions,
        timeFormat,
        decimalPlaces,
        uuid: latestUUID,
      })

      if (!this.isComponentMounted) {
        return
      }

      if (this.props.uuid === latestUUID) {
        this.setState({
          formattedData,
          sort,
          computedFieldOptions,
          invalidDataError: null,
        })
      }
    } catch (err) {
      if (!this.isComponentMounted) {
        return
      }
      console.error(err)

      this.setState({invalidDataError: ErrorTypes.GeneralError})
    }
  }

  private get sortField(): string {
    const {fieldOptions, dataType} = this.props

    let sortField: string = _.get(
      this.props,
      ['tableOptions', 'sortBy', 'internalName'],
      ''
    )
    const isValidSortField = !!fieldOptions.find(
      f => f.internalName === sortField
    )

    if (!isValidSortField) {
      sortField = _.get(
        getDefaultTimeField(dataType),
        'internalName',
        _.get(fieldOptions, '0.internalName', '')
      )
    }

    return sortField
  }
}

export default TableGraphFormat
