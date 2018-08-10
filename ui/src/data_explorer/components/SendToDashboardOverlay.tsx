import React, {PureComponent} from 'react'

import {getNewDashboardCell} from 'src/dashboards/utils/cellGetters'

import {
  OverlayContainer,
  OverlayHeading,
  OverlayBody,
  Dropdown,
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
  selected: string
  hasQuery: boolean
  name: string
}

class SendToDashboardOverlay extends PureComponent<Props, State> {
  constructor(props) {
    super(props)
    const {queryConfig} = this.props

    this.state = {
      selected: this.props.dashboards[0].id.toString(),
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
          <Dropdown
            onChange={this.handleSelect}
            selectedID={this.selectedID}
            widthPixels={250}
          >
            {this.dropdownItems}
          </Dropdown>
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
    return dashboards.map(dashboard => {
      const stringID = dashboard.id.toString()
      return (
        <Dropdown.Item key={stringID} id={stringID} value={stringID}>
          {dashboard.name}
        </Dropdown.Item>
      )
    })
    return []
  }

  private get selectedID(): string {
    return this.state.selected
  }

  private get selectedDashboard(): Dashboard {
    const {dashboards} = this.props

    return dashboards.find(d => {
      return d.id.toString() === this.selectedID
    })
  }

  private handleSelect = choice => {
    this.setState({selected: choice})
  }

  private sendToDashboard = async () => {
    const {queryConfig, addDashboardCell, rawText, source} = this.props
    const {hasQuery, name} = this.state

    if (hasQuery) {
      const dashboard = this.selectedDashboard
      const emptyCell = getNewDashboardCell(dashboard)
      const newCell = {
        ...emptyCell,
        name,
        queries: [{queryConfig, query: rawText, source: source.links.self}],
      }
      await addDashboardCell(dashboard, newCell)
    }
  }
}

export default SendToDashboardOverlay
