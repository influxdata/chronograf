// Libraries
import React, {Component, ChangeEvent} from 'react'
import _ from 'lodash'

// Components
import {
  Radio,
  Form,
  Input,
  ComponentStatus,
  Button,
  ComponentColor,
  ButtonShape,
  Columns,
  MultiSelectDropdown,
} from 'src/reusable_ui'

// APIS
import {browseExternalDashboards} from 'src/dashboards/apis'

// Decorators
import {ErrorHandling} from 'src/shared/decorators/errors'

const enum GrafanaImportMode {
  Browse = 'browse',
  Specific = 'specific',
}

interface State {
  mode: GrafanaImportMode
  url: string
  requestStatus: ComponentStatus
  requestMessage: string
  externalDashboards: any[]
  selectedExternalDashboardIDs: string[]
}

interface Props {
  onDismissOverlay: () => void
  importLink: string
}

@ErrorHandling
class GrafanaImporter extends Component<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      mode: GrafanaImportMode.Browse,
      requestStatus: ComponentStatus.Default,
      requestMessage: '',
      url: '',
      externalDashboards: [],
      selectedExternalDashboardIDs: [],
    }
  }
  public render() {
    const {mode} = this.state

    return (
      <div className="grafana-importer">
        <Radio>
          <Radio.Button
            id="grafana-importer--browse"
            active={mode === GrafanaImportMode.Browse}
            titleText="Choose dashboards to import from Grafana"
            value={GrafanaImportMode.Browse}
            onClick={this.handleRadioClick}
          >
            Browse Dashboards
          </Radio.Button>
          <Radio.Button
            id="grafana-importer--specific"
            active={mode === GrafanaImportMode.Specific}
            titleText="Import a specific dashboard from Grafana"
            value={GrafanaImportMode.Specific}
            onClick={this.handleRadioClick}
          >
            Specific Dashboard
          </Radio.Button>
        </Radio>
        {this.renderForm}
      </div>
    )
  }

  private handleRadioClick = (mode: GrafanaImportMode): void => {
    this.setState({
      mode,
      url: '',
      requestStatus: ComponentStatus.Default,
      requestMessage: '',
    })
  }

  private get submitFormButton(): JSX.Element {
    const {requestStatus, url, selectedExternalDashboardIDs} = this.state

    const buttonStatus =
      requestStatus === ComponentStatus.Valid &&
      !!url &&
      selectedExternalDashboardIDs.length
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

    try {
      this.setState({
        requestStatus: ComponentStatus.Loading,
        requestMessage: '',
      })
      const externalDashboards = await browseExternalDashboards(
        importLink,
        e.target.value
      )

      this.setState({externalDashboards, requestStatus: ComponentStatus.Valid})
    } catch (err) {
      this.setState({
        requestStatus: ComponentStatus.Error,
        requestMessage: err.message,
      })
    }
  }

  private handleFormSubmit = (): void => {
    const {onDismissOverlay} = this.props
    // const {selectedExternalDashboardIDs, externalDashboards} = this.state

    // const selectedExternalDashboards = externalDashboards.filter(d =>
    //   _.includes(selectedExternalDashboardIDs, `${d.id}`)
    // )

    // Start wizard here
    // console.log(selectedExternalDashboards)

    onDismissOverlay()
  }

  private get renderForm(): JSX.Element {
    const {mode, url, requestStatus, requestMessage} = this.state

    if (mode === GrafanaImportMode.Browse) {
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
                />
              </Form.Element>
              {this.dashboardsDropdown}
              {this.submitFormButton}
            </Form>
          </div>
        </div>
      )
    }

    return (
      <div className="row">
        <div className="col-xs-12">
          <Form>
            <Form.Element
              label="URL of Grafana dashboard"
              errorMessage={requestMessage}
            >
              <Input
                value={url}
                placeholder="eg: https://grafana.com/api/dashboards/5063/revisions/5/download"
                onChange={this.handleUrlChange}
                status={requestStatus}
              />
            </Form.Element>
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
      selectedExternalDashboardIDs,
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

    const simpleArray = externalDashboards.map(d => ({
      id: `${d.id}`,
      name: d.title,
    }))

    return (
      <Form.Element label="Select dashboards to import">
        <MultiSelectDropdown
          onChange={this.handleChooseExternalDashboard}
          selectedIDs={selectedExternalDashboardIDs}
          buttonColor={ComponentColor.Primary}
          emptyText="None selected"
        >
          {simpleArray.map(ed => (
            <MultiSelectDropdown.Item id={ed.id} key={ed.id} value={ed}>
              {ed.name}
            </MultiSelectDropdown.Item>
          ))}
        </MultiSelectDropdown>
      </Form.Element>
    )
  }

  private handleChooseExternalDashboard = (
    selectedExternalDashboardIDs: string[]
  ): void => {
    this.setState({selectedExternalDashboardIDs})
  }

  private handleUrlChange = (e: ChangeEvent<HTMLInputElement>): void => {
    this.setState({url: e.target.value})
  }
}

export default GrafanaImporter
