import React, {PureComponent} from 'react'

import {getNewDashboardCell} from 'src/dashboards/utils/cellGetters'

import {
  OverlayContainer,
  OverlayHeading,
  OverlayBody,
  MultiSelectDropdown,
} from 'src/reusable_ui'

import {addDashboardCellAsync} from 'src/dashboards/actions'

import {QueryConfig, Dashboard, Source} from 'src/types'

interface Props {
  queryConfig: QueryConfig
  dashboards: Dashboard[]
  source: Source
  rawText: string
  onCancel: () => void
  addDashboardCell: typeof addDashboardCellAsync
}

interface State {
  selectedIDs: string[]
  hasQuery: boolean
  name: string
}

class SendToDashboardOverlay extends PureComponent<Props, State> {
  constructor(props) {
    super(props)
    const {queryConfig} = this.props

    this.state = {
      selectedIDs: [],
      hasQuery: queryConfig.fields.length !== 0,
      name: '',
    }
  }

  public handleChangeName = e => {
    const name = e.target.value
    this.setState({name})
  }

  public render() {
    const {onCancel} = this.props
    const {hasQuery, name} = this.state

    return (
      <OverlayContainer>
        <OverlayHeading title="Send to Dashboard" />
        <OverlayBody>
          <div className="form-group">
            <label htmlFor="New Cell Name"> New Cell Name </label>
            <input
              type="text"
              id="New Cell Name"
              className="form-control input-sm"
              value={name}
              onChange={this.handleChangeName}
            />
          </div>
          <MultiSelectDropdown
            onChange={this.handleSelect}
            selectedIDs={this.state.selectedIDs}
          >
            {this.dropdownItems}
          </MultiSelectDropdown>
          <button
            className="button button-md button-default"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="button button-md button-success"
            disabled={!hasQuery}
            onClick={this.sendToDashboard}
          >
            Send to Dashboard
          </button>
        </OverlayBody>
      </OverlayContainer>
    )
  }

  private get dropdownItems(): JSX.Element[] {
    const {dashboards} = this.props

    const simpleArray = dashboards.map(d => ({
      id: d.id.toString(),
      name: d.name,
    }))
    return simpleArray.map(dashboard => {
      return (
        <MultiSelectDropdown.Item
          key={dashboard.id}
          id={dashboard.id}
          value={dashboard}
        >
          {dashboard.name}
        </MultiSelectDropdown.Item>
      )
    })
  }

  private get selectedDashboards(): Dashboard[] {
    const {dashboards} = this.props
    const {selectedIDs} = this.state

    return dashboards.filter(d => {
      return selectedIDs.includes(d.id.toString())
    })
  }

  private handleSelect = (updatedSelection: string[]) => {
    this.setState({selectedIDs: updatedSelection})
  }

  private sendToDashboard = async () => {
    const {
      queryConfig,
      addDashboardCell,
      rawText,
      source,
      onCancel,
    } = this.props
    const {hasQuery, name} = this.state

    if (hasQuery) {
      await Promise.all(
        this.selectedDashboards.map(dashboard => {
          const emptyCell = getNewDashboardCell(dashboard)
          const newCell = {
            ...emptyCell,
            name,
            queries: [{queryConfig, query: rawText, source: source.links.self}],
          }
          return addDashboardCell(dashboard, newCell)
        })
      )
      onCancel()
    }
  }
}

export default SendToDashboardOverlay
