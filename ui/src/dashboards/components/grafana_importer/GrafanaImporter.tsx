// Libraries
import React, {Component, ChangeEvent} from 'react'
import _ from 'lodash'

// Components
import {
  Form,
  Input,
  ComponentStatus,
  Button,
  ComponentColor,
  ButtonShape,
  Columns,
  Dropdown,
} from 'src/reusable_ui'

// APIS
import {
  browseExternalDashboards,
  getExternalDashboard,
} from 'src/dashboards/apis'

// Decorators
import {ErrorHandling} from 'src/shared/decorators/errors'

// Types
import {Dashboard} from 'src/types'

interface State {
  url: string
  requestStatus: ComponentStatus
  requestMessage: string
  externalDashboards: any[]
  selectedExternalDashboardID: string
}

interface Props {
  importLink: string
  onContinueGrafanaImport: (dashboard: Dashboard) => void
}

@ErrorHandling
class GrafanaImporter extends Component<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      requestStatus: ComponentStatus.Default,
      requestMessage: '',
      url: 'http://localhost:3000',
      externalDashboards: [],
      selectedExternalDashboardID: '',
    }
  }
  public render() {
    return <div className="grafana-importer">{this.renderForm}</div>
  }

  private get submitFormButton(): JSX.Element {
    const {requestStatus, url, selectedExternalDashboardID} = this.state

    const buttonStatus =
      requestStatus === ComponentStatus.Valid &&
      !!url &&
      selectedExternalDashboardID.length
        ? ComponentStatus.Default
        : ComponentStatus.Disabled

    return (
      <Form.Footer colsXS={Columns.Four} offsetXS={Columns.Four}>
        <Button
          color={ComponentColor.Primary}
          text="Next"
          status={buttonStatus}
          shape={ButtonShape.StretchToFit}
          onClick={this.handleFormSubmit}
        />
      </Form.Footer>
    )
  }

  private handleBrowseBlur = async (
    e: ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    const {importLink} = this.props

    if (!e.target.value) {
      return
    }

    if (!_.startsWith(e.target.value, 'http://')) {
      this.setState({requestMessage: 'URL must start with http://'})
      return
    }

    try {
      this.setState({
        requestStatus: ComponentStatus.Loading,
        requestMessage: '',
      })
      const externalDashboards = await browseExternalDashboards(
        importLink,
        e.target.value
      )

      const selectedExternalDashboardID = !!externalDashboards.length
        ? externalDashboards[0].id.toString()
        : ''

      this.setState({
        externalDashboards,
        requestStatus: ComponentStatus.Valid,
        selectedExternalDashboardID,
      })
    } catch (err) {
      this.setState({
        requestStatus: ComponentStatus.Error,
        requestMessage: err.message,
      })
    }
  }

  private handleFormSubmit = async (): Promise<void> => {
    const {onContinueGrafanaImport} = this.props

    const {selectedExternalDashboardID, externalDashboards, url} = this.state

    const selectedExternalDashboard = externalDashboards.find(d =>
      _.includes(selectedExternalDashboardID, `${d.id}`)
    )

    const dashboard: Dashboard = await getExternalDashboard(
      url,
      selectedExternalDashboard.uri
    )
    onContinueGrafanaImport(dashboard)
  }

  private get renderForm(): JSX.Element {
    const {url, requestStatus, requestMessage} = this.state

    return (
      <div className="row">
        <div className="col-xs-12">
          <Form>
            <Form.Element
              label="URL where Grafana is running"
              errorMessage={requestMessage}
            >
              <Input
                value={url}
                placeholder="eg: http://localhost:3000"
                onChange={this.handleUrlChange}
                status={requestStatus}
                onBlur={this.handleBrowseBlur}
                onKeyPress={this.handleBrowseKeyPress}
              />
            </Form.Element>
            {this.dashboardsDropdown}
            {this.submitFormButton}
          </Form>
        </div>
      </div>
    )
  }

  private get dashboardsDropdown(): JSX.Element {
    const {
      externalDashboards,
      requestStatus,
      selectedExternalDashboardID,
    } = this.state

    if (
      !externalDashboards.length &&
      requestStatus === ComponentStatus.Loading
    ) {
      return (
        <Form.Element>
          <div>Loading...</div>
        </Form.Element>
      )
    }

    if (!externalDashboards.length) {
      return
    }

    return (
      <Form.Element label="Select a Dashboard to import">
        <Dropdown
          onChange={this.handleChooseExternalDashboard}
          selectedID={selectedExternalDashboardID}
          buttonColor={ComponentColor.Primary}
        >
          {externalDashboards.map(ed => (
            <Dropdown.Item id={`${ed.id}`} key={`${ed.id}`} value={`${ed.id}`}>
              {ed.title}
            </Dropdown.Item>
          ))}
        </Dropdown>
      </Form.Element>
    )
  }

  private handleBrowseKeyPress = (e): void => {
    if (e.key === 'Enter') {
      e.target.blur()
    }
  }

  private handleChooseExternalDashboard = (
    selectedExternalDashboardID: string
  ): void => {
    this.setState({selectedExternalDashboardID})
  }

  private handleUrlChange = (e: ChangeEvent<HTMLInputElement>): void => {
    this.setState({url: e.target.value})
  }
}

export default GrafanaImporter
