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

import {Query, Template, Source, TimeRange} from 'src/types'

interface Props {
  // Used for downloading an InfluxQL query
  queries: Query[]
  templates: Template[]

  // Used for downloading a Flux query
  script: string
  source: Source
  timeRange: TimeRange
  fluxASTLink: string

  isFluxSelected: boolean
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
    const {isFluxSelected, onNotify} = this.props

    this.setState({buttonStatus: ComponentStatus.Loading})

    try {
      if (isFluxSelected) {
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
    const {source, script, onNotify, timeRange, fluxASTLink} = this.props

    const {didTruncate, rowCount} = await downloadFluxCSV(
      source,
      script,
      timeRange,
      fluxASTLink
    )

    if (didTruncate) {
      onNotify(fluxResponseTruncatedError(rowCount))
    }

    return
  }
}

const mstp = state => ({
  fluxASTLink: state.links.flux.ast,
})

const mdtp = {
  onNotify: notify,
}

export default connect(mstp, mdtp)(CSVExporter)
