import React, {PureComponent} from 'react'
import _ from 'lodash'

import Container from 'src/reusable_ui/components/overlays/OverlayContainer'
import Heading from 'src/reusable_ui/components/overlays/OverlayHeading'
import Body from 'src/reusable_ui/components/overlays/OverlayBody'
import DragAndDrop from 'src/shared/components/DragAndDrop'
import {notifyDashboardImportFailed} from 'src/shared/copy/notifications'
import * as NotificationsActions from 'src/shared/actions/notifications'

import {Dashboard} from 'src/types'

interface Props {
  onDismissOverlay: () => void
  onImportDashboard: (dashboard: Dashboard) => void
  notify: typeof NotificationsActions.notify
}

interface State {
  isImportable: boolean
}

class ImportDashboardOverlay extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      isImportable: false,
    }
  }

  public render() {
    const {onDismissOverlay} = this.props

    return (
      <Container maxWidth={800}>
        <Heading title="Import Dashboard" onDismiss={onDismissOverlay} />
        <Body>
          <DragAndDrop
            submitText="Upload Dashboard"
            fileTypesToAccept={this.validFileExtension}
            handleSubmit={this.handleUploadDashboard}
          />
        </Body>
      </Container>
    )
  }

  private get validFileExtension(): string {
    return '.json'
  }

  private handleUploadDashboard = (
    uploadContent: string,
    fileName: string
  ): void => {
    const {notify, onImportDashboard, onDismissOverlay} = this.props
    const fileExtensionRegex = new RegExp(`${this.validFileExtension}$`)
    if (!fileName.match(fileExtensionRegex)) {
      notify(notifyDashboardImportFailed(fileName, 'Please import a JSON file'))
      return
    }

    try {
      const {dashboard} = JSON.parse(uploadContent)

      if (!_.isEmpty(dashboard)) {
        onImportDashboard(dashboard)
        onDismissOverlay()
      } else {
        notify(
          notifyDashboardImportFailed(fileName, 'No dashboard found in file')
        )
      }
    } catch (error) {
      notify(notifyDashboardImportFailed(fileName, error))
    }
  }
}

export default ImportDashboardOverlay
