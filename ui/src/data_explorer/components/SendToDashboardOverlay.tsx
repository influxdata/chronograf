// Libraries
import React, {PureComponent} from 'react'

// Utils
import {getNewDashboardCell} from 'src/dashboards/utils/cellGetters'

// Components
import {
  OverlayContainer,
  OverlayHeading,
  OverlayBody,
  MultiSelectDropdown,
  Form,
  Button,
  ComponentColor,
  ComponentStatus,
  Input,
} from 'src/reusable_ui'

// Constants
import {addDashboardCellAsync} from 'src/dashboards/actions'

// Types
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
    const {name, selectedIDs} = this.state

    const numberDashboards = selectedIDs.length > 1 ? selectedIDs.length : ''
    const pluralizer = selectedIDs.length > 1 ? 's' : ''

    return (
      <OverlayContainer>
        <OverlayHeading title="Send to Dashboard" onDismiss={onCancel} />
        <OverlayBody>
          <Form>
            <Form.Element label="Cell Name">
              <Input
                value={name}
                onChange={this.handleChangeName}
                placeholder={'Name this new cell'}
              />
            </Form.Element>
            <Form.Element label="Target Dashboard(s)">
              <MultiSelectDropdown
                onChange={this.handleSelect}
                selectedIDs={this.state.selectedIDs}
                emptyText="Choose at least 1 dashboard"
              >
                {this.dropdownItems}
              </MultiSelectDropdown>
            </Form.Element>
            <Form.Footer>
              <Button
                color={ComponentColor.Success}
                text={`Send to ${numberDashboards} Dashboard${pluralizer}`}
                titleText="Must choose at least 1 dashboard and set a name"
                status={this.submitButtonStatus}
                onClick={this.sendToDashboard}
              />
              <Button text="Cancel" onClick={onCancel} />
            </Form.Footer>
          </Form>
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

  private get submitButtonStatus(): ComponentStatus {
    const {hasQuery, name, selectedIDs} = this.state

    if (!hasQuery || selectedIDs.length === 0 || name.trim().length === 0) {
      return ComponentStatus.Disabled
    }

    return ComponentStatus.Default
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
