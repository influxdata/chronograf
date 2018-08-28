import React, {PureComponent} from 'react'
import {connect} from 'react-redux'

import {Button, IconFont, ComponentStatus} from 'src/reusable_ui'
import downloadTimeseriesCSV from 'src/shared/utils/downloadTimeseriesCSV'
import {notify} from 'src/shared/actions/notifications'
import {csvExportFailed} from 'src/shared/copy/notifications'

import {Query, Template} from 'src/types'

interface Props {
  queries: Query[]
  templates: Template[]
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

  private handleClick = async () => {
    const {queries, templates, onNotify} = this.props

    this.setState({buttonStatus: ComponentStatus.Loading})

    try {
      await downloadTimeseriesCSV(queries, templates)
    } catch {
      onNotify(csvExportFailed)
    }

    this.setState({buttonStatus: ComponentStatus.Default})
  }
}

const mdtp = {
  onNotify: notify,
}

export default connect(null, mdtp)(CSVExporter)
