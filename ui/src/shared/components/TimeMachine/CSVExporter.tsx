import React, {PureComponent} from 'react'
import {connect} from 'react-redux'

import {Button, IconFont, ComponentStatus} from 'src/reusable_ui'
import {
  downloadInfluxQLCSV,
  downloadFluxCSV,
} from 'src/shared/utils/downloadTimeseriesCSV'
import {notify} from 'src/shared/actions/notifications'
import {
  csvExportFailed,
  fluxResponseTruncatedError,
} from 'src/shared/copy/notifications'

import {Query, Template, Service} from 'src/types'

interface Props {
  // Used for downloading an InfluxQL query
  queries: Query[]
  templates: Template[]

  // Used for downloading a Flux query
  script: string
  service: Service

  isFluxSource: boolean
  onNotify: typeof notify
}

interface State {
  buttonStatus: ComponentStatus
}

class CSVExporter extends PureComponent<Props, State> {
  constructor(props) {
    super(props)

    this.state = {buttonStatus: ComponentStatus.Default}
  }

  public render() {
    const {buttonStatus} = this.state

    return (
      <Button
        customClass="csv-export"
        text="CSV"
        icon={IconFont.Download}
        status={buttonStatus}
        onClick={this.handleClick}
      />
    )
  }

  private handleClick = async (): Promise<void> => {
    const {isFluxSource, onNotify} = this.props

    this.setState({buttonStatus: ComponentStatus.Loading})

    try {
      if (isFluxSource) {
        await this.downloadFluxCSV()
      } else {
        await this.downloadInfluxQLCSV()
      }
    } catch {
      onNotify(csvExportFailed)
    }

    this.setState({buttonStatus: ComponentStatus.Default})
  }

  private downloadInfluxQLCSV = (): Promise<void> => {
    const {queries, templates} = this.props

    return downloadInfluxQLCSV(queries, templates)
  }

  private downloadFluxCSV = async (): Promise<void> => {
    const {service, script, onNotify} = this.props

    const {didTruncate} = await downloadFluxCSV(service, script)

    if (didTruncate) {
      onNotify(fluxResponseTruncatedError())
    }

    return
  }
}

const mdtp = {
  onNotify: notify,
}

export default connect(null, mdtp)(CSVExporter)
