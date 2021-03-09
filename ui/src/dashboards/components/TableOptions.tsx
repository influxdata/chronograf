// Libraries
import React, {Component} from 'react'
import _ from 'lodash'

// Components
import GraphOptionsCustomizeFields from 'src/dashboards/components/GraphOptionsCustomizeFields'
import GraphOptionsFixFirstColumn from 'src/dashboards/components/GraphOptionsFixFirstColumn'
import GraphOptionsSortBy from 'src/dashboards/components/GraphOptionsSortBy'
import GraphOptionsTimeAxis from 'src/dashboards/components/GraphOptionsTimeAxis'
import GraphOptionsTimeFormat from 'src/dashboards/components/GraphOptionsTimeFormat'
import GraphOptionsDecimalPlaces from 'src/dashboards/components/GraphOptionsDecimalPlaces'
import FancyScrollbar from 'src/shared/components/FancyScrollbar'
import ThresholdsList from 'src/shared/components/ThresholdsList'
import ThresholdsListTypeToggle from 'src/shared/components/ThresholdsListTypeToggle'

// Constants
import {DEFAULT_INFLUXQL_TIME_FIELD} from 'src/dashboards/constants'

// Decorators
import {ErrorHandling} from 'src/shared/decorators/errors'

// Types
import {DecimalPlaces, ThresholdType} from 'src/types/dashboards'
import {QueryConfig} from 'src/types/queries'
import {ColorNumber} from 'src/types/colors'

interface DropdownOption {
  text: string
  key: string
}

interface RenamableField {
  internalName: string
  displayName: string
  visible: boolean
}

interface TableOptionsInterface {
  verticalTimeAxis: boolean
  sortBy: RenamableField
  fixFirstColumn: boolean
}

interface Props {
  queryConfigs: QueryConfig[]
  onUpdateTableOptions: (options: TableOptionsInterface) => void
  onUpdateFieldOptions: (fieldOptions: RenamableField[]) => void
  onUpdateTimeFormat: (timeFormat: string) => void
  onUpdateDecimalPlaces: (decimalPlaces: DecimalPlaces) => void
  tableOptions: TableOptionsInterface
  fieldOptions: RenamableField[]
  timeFormat: string
  decimalPlaces: DecimalPlaces
  thresholdsListType: ThresholdType
  thresholdsListColors: ColorNumber[]
  onResetFocus: () => void
  onUpdateThresholdsListColors: (c: ColorNumber[]) => void
  onUpdateThresholdsListType: (newType: ThresholdType) => void
}

@ErrorHandling
export class TableOptions extends Component<Props, Record<string, never>> {
  constructor(props) {
    super(props)
    this.moveField = this.moveField.bind(this)
  }

  public render() {
    const {
      tableOptions: {verticalTimeAxis, fixFirstColumn},
      fieldOptions,
      timeFormat,
      onResetFocus,
      tableOptions,
      decimalPlaces,
      onUpdateThresholdsListColors,
      thresholdsListType,
      thresholdsListColors,
      onUpdateThresholdsListType,
    } = this.props

    const tableSortByOptions = fieldOptions.map(field => ({
      key: field.internalName,
      text: field.displayName || field.internalName,
    }))

    return (
      <FancyScrollbar className="display-options" autoHide={false}>
        <div className="display-options--wrapper">
          <h5 className="display-options--header">Table Controls</h5>
          <div className="form-group-wrapper">
            <GraphOptionsSortBy
              selected={tableOptions.sortBy || DEFAULT_INFLUXQL_TIME_FIELD}
              sortByOptions={tableSortByOptions}
              onChooseSortBy={this.handleChooseSortBy}
            />
            <GraphOptionsDecimalPlaces
              digits={decimalPlaces.digits}
              isEnforced={decimalPlaces.isEnforced}
              onDecimalPlacesChange={this.handleDecimalPlacesChange}
            />
            <GraphOptionsTimeAxis
              verticalTimeAxis={verticalTimeAxis}
              onToggleVerticalTimeAxis={this.handleToggleVerticalTimeAxis}
            />
            <GraphOptionsTimeFormat
              timeFormat={timeFormat}
              onTimeFormatChange={this.handleTimeFormatChange}
            />
            <GraphOptionsFixFirstColumn
              fixed={fixFirstColumn}
              onToggleFixFirstColumn={this.handleToggleFixFirstColumn}
            />
          </div>
          <GraphOptionsCustomizeFields
            fields={fieldOptions}
            onFieldUpdate={this.handleFieldUpdate}
            moveField={this.moveField}
          />
          <ThresholdsList
            showListHeading={true}
            onResetFocus={onResetFocus}
            thresholdsListType={thresholdsListType}
            thresholdsListColors={thresholdsListColors}
            onUpdateThresholdsListColors={onUpdateThresholdsListColors}
          />
          <div className="form-group-wrapper graph-options-group">
            <ThresholdsListTypeToggle
              containerClass="form-group col-xs-6"
              thresholdsListType={thresholdsListType}
              onUpdateThresholdsListType={onUpdateThresholdsListType}
            />
          </div>
        </div>
      </FancyScrollbar>
    )
  }

  private moveField(dragIndex, hoverIndex) {
    const {onUpdateFieldOptions, fieldOptions} = this.props

    const draggedField = fieldOptions[dragIndex]

    const fieldOptionsRemoved = _.concat(
      _.slice(fieldOptions, 0, dragIndex),
      _.slice(fieldOptions, dragIndex + 1)
    )

    const fieldOptionsAdded = _.concat(
      _.slice(fieldOptionsRemoved, 0, hoverIndex),
      [draggedField],
      _.slice(fieldOptionsRemoved, hoverIndex)
    )

    onUpdateFieldOptions(fieldOptionsAdded)
  }

  private handleChooseSortBy = (option: DropdownOption) => {
    const {tableOptions, onUpdateTableOptions, fieldOptions} = this.props
    const sortBy = fieldOptions.find(f => f.internalName === option.key)
    onUpdateTableOptions({...tableOptions, sortBy})
  }

  private handleTimeFormatChange = timeFormat => {
    const {onUpdateTimeFormat} = this.props
    onUpdateTimeFormat(timeFormat)
  }

  private handleDecimalPlacesChange = decimalPlaces => {
    const {onUpdateDecimalPlaces} = this.props
    onUpdateDecimalPlaces(decimalPlaces)
  }

  private handleToggleVerticalTimeAxis = (verticalTimeAxis: boolean): void => {
    const {tableOptions, onUpdateTableOptions} = this.props
    onUpdateTableOptions({...tableOptions, verticalTimeAxis})
  }

  private handleToggleFixFirstColumn = () => {
    const {onUpdateTableOptions, tableOptions} = this.props
    const fixFirstColumn = !tableOptions.fixFirstColumn
    onUpdateTableOptions({...tableOptions, fixFirstColumn})
  }

  private handleFieldUpdate = field => {
    const {
      onUpdateTableOptions,
      onUpdateFieldOptions,
      tableOptions,
      fieldOptions,
    } = this.props
    const {sortBy} = tableOptions

    const updatedFieldOptions = fieldOptions.map(f =>
      f.internalName === field.internalName ? field : f
    )

    if (sortBy.internalName === field.internalName) {
      const updatedSortBy = {...sortBy, displayName: field.displayName}
      onUpdateTableOptions({
        ...tableOptions,
        sortBy: updatedSortBy,
      })
    }

    onUpdateFieldOptions(updatedFieldOptions)
  }
}

export default TableOptions
