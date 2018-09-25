// Libraries
import React, {PureComponent} from 'react'
import memoizeOne from 'memoize-one'

// Components
import TableSidebar from 'src/flux/components/TableSidebar'
import {FluxTable} from 'src/types'
import NoResults from 'src/flux/components/NoResults'
import TableGraph from 'src/shared/components/TableGraph'

// Utils
import {getDeep} from 'src/utils/wrappers'

// Types
import {QueryUpdateState} from 'src/shared/actions/queries'
import {ColorString} from 'src/types/colors'
import {TableOptions, FieldOption, DecimalPlaces} from 'src/types/dashboards'
import {DataType} from 'src/shared/constants'

interface Props {
  data: FluxTable[]
  dataType: DataType
  tableOptions: TableOptions
  timeFormat: string
  decimalPlaces: DecimalPlaces
  fieldOptions: FieldOption[]
  handleSetHoverTime?: (hovertime: string) => void
  colors: ColorString[]
  editorLocation?: QueryUpdateState
  onUpdateFieldOptions?: (fieldOptions: FieldOption[]) => void
}

interface State {
  selectedResultID: string | null
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

const filteredTablesMemoized = memoizeOne(filterTables)

class TimeMachineTables extends PureComponent<Props, State> {
  constructor(props) {
    super(props)

    this.state = {
      selectedResultID: this.defaultResultId,
    }
  }

  public componentDidUpdate() {
    if (!this.selectedResult) {
      this.setState({selectedResultID: this.defaultResultId})
    }
  }

  public render() {
    const {
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
      <div className="time-machine-tables">
        {this.showSidebar && (
          <TableSidebar
            data={this.props.data}
            selectedResultID={this.state.selectedResultID}
            onSelectResult={this.handleSelectResult}
          />
        )}
        {this.shouldShowTable && (
          <TableGraph
            data={this.selectedResult}
            dataType={dataType}
            colors={colors}
            tableOptions={tableOptions}
            fieldOptions={this.fieldOptions}
            timeFormat={timeFormat}
            decimalPlaces={decimalPlaces}
            editorLocation={editorLocation}
            handleSetHoverTime={handleSetHoverTime}
            onUpdateFieldOptions={onUpdateFieldOptions}
          />
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

  private handleSelectResult = (selectedResultID: string): void => {
    this.setState({selectedResultID})
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

  private get defaultResultId() {
    const {data} = this.props

    if (data.length && !!data[0]) {
      return data[0].name
    }

    return null
  }

  private get selectedResult(): FluxTable {
    const filteredTables = filteredTablesMemoized(this.props.data)

    return filteredTables.find(d => d.name === this.state.selectedResultID)
  }
}

export default TimeMachineTables
