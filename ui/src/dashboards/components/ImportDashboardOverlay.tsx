import React, {PureComponent} from 'react'
import _ from 'lodash'
import {getDeep} from 'src/utils/wrappers'

import Container from 'src/reusable_ui/components/overlays/OverlayContainer'
import Body from 'src/reusable_ui/components/overlays/OverlayBody'
import DragAndDrop from 'src/shared/components/DragAndDrop'
import ImportDashboardMappings from 'src/dashboards/components/import_dashboard_mappings/ImportDashboardMappings'
import GrafanaImporter from 'src/dashboards/components/grafana_importer/GrafanaImporter'
import {notifyDashboardImportFailed} from 'src/shared/copy/notifications'

import {Dashboard, Cell, Source} from 'src/types'
import {Notification} from 'src/types/notifications'
import {ImportedSources} from 'src/types/dashboards'
import {Radio, ButtonShape} from 'src/reusable_ui'

interface Props {
  source: Source
  sources: Source[]
  onDismissOverlay: () => void
  notify: (message: Notification) => void
  onImportDashboard: (dashboard: Dashboard) => void
}

interface State {
  cells: Cell[]
  step: ImportSteps
  dashboard: Dashboard
  isImportable: boolean
  importedSources: ImportedSources
}

const enum ImportSteps {
  FILE = 'file',
  MAPPING = 'mapping',
  GRAFANA = 'grafana',
}

class ImportDashboardOverlay extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      cells: [],
      dashboard: null,
      importedSources: {},
      isImportable: false,
      step: ImportSteps.FILE,
    }
  }

  public render() {
    const {onDismissOverlay} = this.props

    return (
      <Container maxWidth={800}>
        <div className="overlay--heading import-dashboard-header">
          <div className="overlay--title">{this.title}</div>
          {this.ImportModeToggle}
          <button className="overlay--dismiss" onClick={onDismissOverlay} />
        </div>
        <Body>{this.renderStep}</Body>
      </Container>
    )
  }

  private get renderStep(): JSX.Element {
    const {step, importedSources, cells} = this.state
    const {source, sources, onDismissOverlay} = this.props

    switch (step) {
      case ImportSteps.FILE:
        return (
          <DragAndDrop
            submitText="Continue"
            fileTypesToAccept={this.validFileExtension}
            handleSubmit={this.handleContinueImport}
          />
        )
      case ImportSteps.GRAFANA:
        return <GrafanaImporter onDismissOverlay={onDismissOverlay} />
      case ImportSteps.MAPPING:
        return (
          <ImportDashboardMappings
            cells={cells}
            source={source}
            sources={sources}
            importedSources={importedSources}
            onSubmit={this.handleUploadDashboard}
          />
        )
    }
  }

  private get ImportModeToggle(): JSX.Element {
    const {step} = this.state

    if (step === ImportSteps.FILE || step === ImportSteps.GRAFANA) {
      return (
        <div className="import-dash-mode">
          <Radio shape={ButtonShape.StretchToFit}>
            <Radio.Button
              id="import-mode-file"
              active={step === ImportSteps.FILE}
              titleText="Import Dashboard from a JSON File"
              value={ImportSteps.FILE}
              onClick={this.handleToggleImportMode}
            >
              From File
            </Radio.Button>
            <Radio.Button
              id="import-mode-grafana"
              active={step === ImportSteps.GRAFANA}
              titleText="Import Dashboards from Grafana"
              value={ImportSteps.GRAFANA}
              onClick={this.handleToggleImportMode}
            >
              From Grafana
            </Radio.Button>
          </Radio>
        </div>
      )
    }
  }

  private get title(): string {
    const {step} = this.state

    switch (step) {
      case ImportSteps.FILE:
      case ImportSteps.GRAFANA:
        return 'Import Dashboard'

      case ImportSteps.MAPPING:
        return 'Reconcile Sources'
    }
  }

  private get validFileExtension(): string {
    return '.json'
  }

  private handleContinueImport = (
    uploadContent: string,
    fileName: string
  ): void => {
    const {notify} = this.props
    const fileExtensionRegex = new RegExp(`${this.validFileExtension}$`)
    if (!fileName.match(fileExtensionRegex)) {
      notify(notifyDashboardImportFailed(fileName, 'Please import a JSON file'))
      return
    }

    try {
      const {dashboard, meta} = JSON.parse(uploadContent)

      if (!_.isEmpty(dashboard)) {
        const cells = getDeep<Cell[]>(dashboard, 'cells', [])
        const importedSources = getDeep<ImportedSources>(meta, 'sources', {})
        this.setState({
          cells,
          dashboard,
          importedSources,
          step: ImportSteps.MAPPING,
        })
      } else {
        notify(
          notifyDashboardImportFailed(fileName, 'No dashboard found in file')
        )
      }
    } catch (error) {
      notify(notifyDashboardImportFailed(fileName, error))
    }
  }

  private handleUploadDashboard = (cells: Cell[]): void => {
    const {dashboard} = this.state

    const {onImportDashboard, onDismissOverlay} = this.props

    onImportDashboard({...dashboard, cells})
    onDismissOverlay()
  }

  private handleToggleImportMode = (mode: ImportSteps): void => {
    this.setState({step: mode})
  }
}

export default ImportDashboardOverlay
