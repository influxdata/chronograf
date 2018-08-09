import React, {PureComponent} from 'react'
import _ from 'lodash'
import {getDeep} from 'src/utils/wrappers'

import Container from 'src/reusable_ui/components/overlays/OverlayContainer'
import Heading from 'src/reusable_ui/components/overlays/OverlayHeading'
import Body from 'src/reusable_ui/components/overlays/OverlayBody'
import DragAndDrop from 'src/shared/components/DragAndDrop'
import ImportDashboardMappings from 'src/dashboards/components/import_dashboard_mappings/ImportDashboardMappings'
import {notifyDashboardImportFailed} from 'src/shared/copy/notifications'

import {Dashboard, Cell, Source} from 'src/types'
import {Notification} from 'src/types/notifications'
import {ImportedSources} from 'src/types/dashboards'

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
  IMPORT = 'import',
  MAPPING = 'mapping',
}

class ImportDashboardOverlay extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      cells: [],
      dashboard: null,
      importedSources: {},
      isImportable: false,
      step: ImportSteps.IMPORT,
    }
  }

  public render() {
    const {onDismissOverlay} = this.props

    return (
      <Container maxWidth={800}>
        <Heading title={this.title} onDismiss={onDismissOverlay} />
        <Body>{this.renderStep}</Body>
      </Container>
    )
  }

  private get renderStep(): JSX.Element {
    const {step, importedSources, cells} = this.state
    const {source, sources} = this.props

    switch (step) {
      case ImportSteps.IMPORT:
        return (
          <DragAndDrop
            submitText="Continue"
            fileTypesToAccept={this.validFileExtension}
            handleSubmit={this.handleContinueImport}
          />
        )
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

  private get title(): string {
    const {step} = this.state

    switch (step) {
      case ImportSteps.IMPORT:
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
}

export default ImportDashboardOverlay
