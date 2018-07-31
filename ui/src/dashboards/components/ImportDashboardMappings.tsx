// Libaries
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
import {NO_SOURCE} from 'src/dashboards/constants'

// Types
import {Source, Cell} from 'src/types'
import {
  SourcesCells,
  SourceMappings,
  ImportedSources,
  SourceItemValue,
} from 'src/types/dashboards'

// Styles
import 'src/dashboards/components/ImportDashboardMappings.scss'

interface Props {
  cells: Cell[]
  source: Source
  sources: Source[]
  importedSources: ImportedSources
  onSubmit: (cells: Cell[]) => void
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
    const {cells, importedSources, source} = this.props

    if (_.isEmpty(cells)) {
      return
    }

    const {sourcesCells, sourceMappings} = createSourceMappings(
      source,
      cells,
      importedSources
    )

    this.setState({sourcesCells, sourceMappings})
  }

  public render() {
    return (
      <>
        {this.description}
        {this.table}
        <button className="btn btn-sm btn-success" onClick={this.handleSubmit}>
          Done
        </button>
      </>
    )
  }

  private get noMappings(): JSX.Element {
    return <div data-test="no-mapping">No source mappings required</div>
  }

  private get description(): JSX.Element {
    const description =
      'In order to ensure a smooth import you need to tell us how to match sources in the imported dashboard with your available sources. Selecting Dyanmic Source will allow the cell to use whatever source you are currently connected to instead of a specific source.'
    return (
      <div className="alert alert-primary">
        <span className="icon octagon" />
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
        if (i !== NO_SOURCE && sourcesCells[i]) {
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
    if (sourcesCells[NO_SOURCE]) {
      const noSourceRow = this.getRow('No Source Found', NO_SOURCE)
      rows.push(noSourceRow)
    }
    return rows
  }

  private getRow(sourceName: string, sourceID: string): JSX.Element {
    let sourceLabel = `${sourceName} (${sourceID})`
    let description = 'Cells that use this Source:'
    if (sourceID === NO_SOURCE) {
      sourceLabel = sourceName
      description = 'Cells with no Source:'
    }
    return (
      <tr key={sourceID}>
        <td className="dash-map--table-cell dash-map--table-half">
          <div className="dash-map--source" data-test="source-label">
            {sourceLabel}
          </div>
          <div className="dash-map--header">{description}</div>
          {this.getCellsForSource(sourceID)}
        </td>
        <td className="dash-map--table-cell dash-map--table-center">
          <div className="fancytable--td provider--arrow">
            <span />
          </div>
        </td>
        <td className="dash-map--table-cell dash-map--table-half">
          <Dropdown
            className="dropdown-stretch"
            buttonColor="btn-default"
            buttonSize="btn-sm"
            items={this.getSourceItems(sourceID)}
            onChoose={this.handleDropdownChange}
            selected={this.getSelected(sourceID)}
          />
        </td>
      </tr>
    )
  }

  private getSourceItems(importedSourceID: string) {
    const {sources} = this.props

    return sources.map(source => {
      const sourceInfo = getSourceInfo(source)
      const sourceMap: SourceItemValue = {
        sourceInfo,
        importedSourceID,
        text: source.name,
      }
      return sourceMap
    })
  }

  private get header() {
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

  private getCellsForSource(sourceID): JSX.Element[] {
    const {sourcesCells} = this.state

    return _.map(sourcesCells[sourceID], c => {
      return (
        <div className="dash-map--cell" key={c.id}>
          {c.name}
        </div>
      )
    })
  }

  private handleDropdownChange = (item: SourceItemValue): void => {
    const {sourceMappings} = this.state

    sourceMappings[item.importedSourceID] = item.sourceInfo
    this.setState({sourceMappings})
  }

  private handleSubmit = (): void => {
    const {cells, onSubmit, importedSources} = this.props
    const {sourceMappings} = this.state

    const mappedCells = mapCells(cells, sourceMappings, importedSources)

    onSubmit(mappedCells)
  }
}

export default ImportDashboardMappings
