// Libraries
import React, {Component, ChangeEvent} from 'react'

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
} from 'src/reusable_ui'

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
}

interface Props {
  onDismissOverlay: () => void
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
    const {requestStatus, url} = this.state

    const buttonDisabled =
      requestStatus !== ComponentStatus.Valid && !!url
        ? ComponentStatus.Default
        : ComponentStatus.Disabled

    return (
      <Form.Footer colsXS={Columns.Four} offsetXS={Columns.Four}>
        <Button
          color={ComponentColor.Primary}
          text="Next"
          status={buttonDisabled}
          shape={ButtonShape.StretchToFit}
          onClick={this.handleFormSubmit}
        />
      </Form.Footer>
    )
  }

  private handleFormSubmit = (): void => {
    const {onDismissOverlay} = this.props

    onDismissOverlay()
    // Start wizard here
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
                />
              </Form.Element>
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

  private handleUrlChange = (e: ChangeEvent<HTMLInputElement>): void => {
    this.setState({url: e.target.value})
  }
}

export default GrafanaImporter
