// Libraries
import React, {PureComponent} from 'react'
import uuid from 'uuid'
import memoizeOne from 'memoize-one'

// Components
import TableSidebar from 'src/flux/components/TableSidebar'
import {FluxTable} from 'src/types'
import NoResults from 'src/flux/components/NoResults'
import TableGraph from 'src/shared/components/TableGraph'
import TableGraphTransform from 'src/shared/components/TableGraphTransform'
import TableGraphFormat from 'src/shared/components/TableGraphFormat'

// Utils
import {getDeep} from 'src/utils/wrappers'

// Types
import {ColorString} from 'src/types/colors'
import {TableOptions, FieldOption, DecimalPlaces} from 'src/types/dashboards'
import {DataType} from 'src/shared/constants'
import {QueryUpdateState} from 'src/types'

interface Props {
  data: FluxTable[]
  uuid: string
  dataType: DataType
  tableOptions: TableOptions
  timeFormat: string
  decimalPlaces: DecimalPlaces
  fieldOptions: FieldOption[]
  width: number
  height: number
  handleSetHoverTime?: (hovertime: string) => void
  colors: ColorString[]
  editorLocation?: QueryUpdateState
  onUpdateFieldOptions?: (fieldOptions: FieldOption[]) => void
}

interface State {
  selectedResultName: string | null
}

const filterTables = (tables: FluxTable[]): FluxTable[] => {
  const IGNORED_COLUMNS = ['', 'result', 'table', '_start', '_stop']

  return tables.map(table => {
    const header = table.data[0]
    const indices = IGNORED_COLUMNS.map(name => header.indexOf(name))
    const tableData = table.data
    const data = tableData.map(row => {
      return row.filter((__, i) => !indices.includes(i))
    })

    return {
      ...table,
      data,
    }
  })
}

class TimeMachineTables extends PureComponent<Props, State> {
  private filteredTablesMemoized = memoizeOne(filterTables)

  constructor(props) {
    super(props)

    this.state = {
      selectedResultName: this.defaultResultName,
    }
  }

  public componentDidUpdate() {
    if (!this.selectedResult) {
      this.setState({selectedResultName: this.defaultResultName})
    }
  }

  public render() {
    const {
      width,
      height,
      colors,
      dataType,
      timeFormat,
      tableOptions,
      decimalPlaces,
      editorLocation,
      handleSetHoverTime,
      onUpdateFieldOptions,
    } = this.props

    return (
      <div
        className="time-machine-tables"
        style={{width: `${width}px`, height: `${height}px`}}
      >
        {this.showSidebar && (
          <TableSidebar
            data={this.props.data}
            selectedResultName={this.state.selectedResultName}
            onSelectResult={this.handleSelectResult}
          />
        )}
        {this.shouldShowTable && (
          <TableGraphTransform
            data={this.selectedResult}
            dataType={dataType}
            uuid={uuid.v4()}
          >
            {(transformedData, nextUUID) => (
              <TableGraphFormat
                data={transformedData}
                uuid={nextUUID}
                dataType={dataType}
                tableOptions={tableOptions}
                timeFormat={timeFormat}
                decimalPlaces={decimalPlaces}
                fieldOptions={this.fieldOptions}
              >
                {(formattedData, sort, computedFieldOptions, onSort) => (
                  <TableGraph
                    data={formattedData}
                    sort={sort}
                    onSort={onSort}
                    dataType={dataType}
                    colors={colors}
                    tableOptions={tableOptions}
                    fieldOptions={computedFieldOptions}
                    timeFormat={timeFormat}
                    decimalPlaces={decimalPlaces}
                    editorLocation={editorLocation}
                    handleSetHoverTime={handleSetHoverTime}
                    onUpdateFieldOptions={onUpdateFieldOptions}
                  />
                )}
              </TableGraphFormat>
            )}
          </TableGraphTransform>
        )}
        {!this.hasResults && <NoResults />}
      </div>
    )
  }

  private get fieldOptions(): FieldOption[] {
    const {fieldOptions} = this.props

    const internalName = getDeep<string>(fieldOptions, '0.internalName', '')
    if (
      fieldOptions.length === 0 ||
      (fieldOptions.length === 1 &&
        (internalName === 'time' || internalName === '_time'))
    ) {
      const headers = getDeep(this.selectedResult, 'data.0', [])

      return headers.map(h => ({
        internalName: h,
        displayName: '',
        visible: true,
      }))
    }

    return fieldOptions
  }

  private handleSelectResult = (selectedResultName: string): void => {
    this.setState({selectedResultName})
  }

  private get showSidebar(): boolean {
    return this.props.data.length > 1
  }

  private get hasResults(): boolean {
    return !!this.props.data.length
  }

  private get shouldShowTable(): boolean {
    return !!this.props.data && !!this.selectedResult
  }

  private get defaultResultName() {
    const {data} = this.props

    if (data.length && !!data[0]) {
      return data[0].name
    }

    return null
  }

  private get selectedResult(): FluxTable {
    const filteredTables = this.filteredTablesMemoized(this.props.data)
    const table = filteredTables.find(
      d => d.name === this.state.selectedResultName
    )

    return table
  }
}

export default TimeMachineTables
