// Libraries
import React, {Component} from 'react'
import _ from 'lodash'

// Components
import Dropdown from 'src/shared/components/Dropdown'

// Utils
import {getDeep} from 'src/utils/wrappers'
import {
  mapCells,
  getSourceInfo,
  createSourceMappings,
} from 'src/dashboards/utils/importDashboardMappings'

// Constants
import {DYNAMIC_SOURCE, DYNAMIC_SOURCE_ITEM} from 'src/dashboards/constants'

// Types
import {Source, Cell, Template} from 'src/types'
import {
  SourcesCells,
  SourceMappings,
  ImportedSources,
  SourceItemValue,
} from 'src/types/dashboards'

interface Props {
  cells: Cell[]
  source: Source
  sources: Source[]
  importedSources: ImportedSources
  variables: Template[]
  onSubmit: (cells: Cell[], mappings: SourceMappings) => void
}

interface State {
  sourcesCells: SourcesCells
  sourceMappings: SourceMappings
}

class ImportDashboardMappings extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {sourcesCells: {}, sourceMappings: {}}
  }

  public componentDidMount() {
    const {cells, importedSources, source, variables} = this.props

    if (_.isEmpty(cells)) {
      return
    }

    const {sourcesCells, sourceMappings} = createSourceMappings(
      source,
      cells,
      importedSources,
      variables
    )

    this.setState({sourcesCells, sourceMappings})
  }

  public render() {
    return (
      <>
        {this.description}
        {this.table}
        <div className="dash-map--footer">
          <button
            className="dash-map--submit btn btn-sm btn-success"
            onClick={this.handleSubmit}
          >
            Done
          </button>
        </div>
      </>
    )
  }

  private get noMappings(): JSX.Element {
    return (
      <div
        data-test="no-mapping"
        className="generic-empty-state dash-map--empty"
      >
        <h5>No source mappings required</h5>
      </div>
    )
  }

  private get arrow(): JSX.Element {
    return (
      <div className="fancytable--td provider--arrow">
        <span />
      </div>
    )
  }

  private get description(): JSX.Element {
    const description = [
      'Match the sources from your imported dashboard with your available sources below. A ',
      <strong key="emphasis">Dynamic Source</strong>,
      ' allows the cell source to change based on your currently selected source.',
    ]

    return (
      <div className="alert alert-grey">
        <span className="icon graphline-2" />
        <div className="alert-message">{description}</div>
      </div>
    )
  }

  private get table(): JSX.Element {
    const {sourcesCells} = this.state

    if (_.isEmpty(sourcesCells)) {
      return this.noMappings
    }

    return (
      <table className="table dash-map--table">
        {this.header}
        <tbody>{this.tableBody}</tbody>
      </table>
    )
  }

  private get tableBody(): JSX.Element[] {
    const {importedSources} = this.props
    const {sourcesCells} = this.state

    const rows = _.reduce(
      sourcesCells,
      (acc, __, i) => {
        if (i !== DYNAMIC_SOURCE && sourcesCells[i]) {
          const sourceName = getDeep<string>(
            importedSources,
            `${i}.name`,
            'Source'
          )
          acc.push(this.getRow(sourceName, i))
        }
        return acc
      },
      []
    )
    if (sourcesCells[DYNAMIC_SOURCE]) {
      const noSourceRow = this.getRow('Dynamic Source', DYNAMIC_SOURCE)
      rows.push(noSourceRow)
    }
    return rows
  }

  private getRow(sourceName: string, sourceID: string): JSX.Element {
    let sourceLabel = `${sourceName} (${sourceID})`
    if (sourceID === DYNAMIC_SOURCE) {
      sourceLabel = sourceName
    }
    return (
      <tr key={sourceID}>
        <td className="dash-map--table-cell dash-map--table-half">
          <div className="dash-map--source" data-test="source-label">
            {sourceLabel}
          </div>
          {this.getCellsForSource(sourceID)}
          {this.getVariablesForSource(sourceID)}
        </td>
        <td className="dash-map--table-cell dash-map--table-center">
          {this.arrow}
        </td>
        <td className="dash-map--table-cell dash-map--table-half">
          <Dropdown
            className="dropdown-stretch"
            buttonColor="btn-default"
            buttonSize="btn-sm"
            items={this.getSourceItems(sourceID)}
            onChoose={this.handleChooseDropdown}
            selected={this.getSelected(sourceID)}
          />
        </td>
      </tr>
    )
  }

  private getSourceItems(importedSourceID: string): SourceItemValue[] {
    const {sources} = this.props

    const sourceItems = sources.map(source => {
      const sourceInfo = getSourceInfo(source)
      const sourceMap: SourceItemValue = {
        sourceInfo,
        importedSourceID,
        text: source.name,
      }
      return sourceMap
    })
    sourceItems.push({...DYNAMIC_SOURCE_ITEM, importedSourceID})
    return sourceItems
  }

  private get header(): JSX.Element {
    return (
      <thead>
        <tr>
          <th className="dash-map--table-half">Sources in Dashboard</th>
          <th className="dash-map--table-center" />
          <th className="dash-map--table-half">Available Sources</th>
        </tr>
      </thead>
    )
  }

  private getSelected(importedSourceID: string): string {
    const {sources} = this.props
    const {sourceMappings} = this.state

    const sourceMapping = sourceMappings[importedSourceID]
    if (sourceMapping) {
      return sourceMappings[importedSourceID].name
    }

    return sources[0].name
  }

  private getCellsForSource(sourceID: string): JSX.Element {
    const {sourcesCells} = this.state

    if (sourcesCells[sourceID].length) {
      return (
        <>
          <div className="dash-map--header">Cells that use this Source:</div>
          {_.map(sourcesCells[sourceID], c => {
            return (
              <div className="dash-map--cell" key={c.id}>
                {c.name}
              </div>
            )
          })}
        </>
      )
    }
  }
  private getVariablesForSource(sourceID: string): JSX.Element | undefined {
    const {variables} = this.props
    const sourceVariables = variables.filter(x => x.sourceID === sourceID)

    if (sourceVariables.length) {
      return (
        <>
          <div className="dash-map--header">
            Variables that use this source:
          </div>

          {_.map(sourceVariables, v => {
            return (
              <div className="dash-map--cell" key={`var-${v.id}`}>
                {v.tempVar}
              </div>
            )
          })}
        </>
      )
    }
  }

  private handleChooseDropdown = (item: SourceItemValue): void => {
    const {sourceMappings} = this.state

    sourceMappings[item.importedSourceID] = item.sourceInfo
    this.setState({sourceMappings})
  }

  private handleSubmit = (): void => {
    const {cells, onSubmit, importedSources} = this.props
    const {sourceMappings} = this.state

    const mappedCells = mapCells(cells, sourceMappings, importedSources)

    onSubmit(mappedCells, sourceMappings)
  }
}

export default ImportDashboardMappings
