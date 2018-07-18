import React, {PureComponent} from 'react'
import {connect} from 'react-redux'
import {ErrorHandling} from 'src/shared/decorators/errors'

import * as actions from 'src/shared/actions/sources'
import {notify as notifyAction} from 'src/shared/actions/notifications'

import FancyScrollbar from 'src/shared/components/FancyScrollbar'
import PageHeader from 'src/reusable_ui/components/page_layout/PageHeader'
import InfluxTable from 'src/sources/components/InfluxTable'

import GrandWizard from 'src/sources/components/GrandWizard'

import {
  notifySourceDeleted,
  notifySourceDeleteFailed,
} from 'src/shared/copy/notifications'

import {Source, Notification} from 'src/types'

interface State {
  wizardVisibility: boolean
}

interface Props {
  source: Source
  sources: Source[]
  notify: (n: Notification) => void
  deleteKapacitor: actions.DeleteKapacitorAsync
  fetchKapacitors: actions.FetchKapacitorsAsync
  removeAndLoadSources: actions.RemoveAndLoadSources
  setActiveKapacitor: actions.SetActiveKapacitorAsync
}

declare var VERSION: string

@ErrorHandling
class ManageSources extends PureComponent<Props, State> {
  constructor(props) {
    super(props)

    this.state = {
      wizardVisibility: true,
    }
  }

  public componentDidMount() {
    this.props.sources.forEach(source => {
      this.props.fetchKapacitors(source)
    })
  }

  public componentDidUpdate(prevProps: Props) {
    if (prevProps.sources.length !== this.props.sources.length) {
      this.props.sources.forEach(source => {
        this.props.fetchKapacitors(source)
      })
    }
  }

  public render() {
    const {sources, source, deleteKapacitor} = this.props
    const {wizardVisibility} = this.state

    return (
      <div className="page" id="manage-sources-page">
        <PageHeader titleText="Configuration" sourceIndicator={true} />
        <FancyScrollbar className="page-contents">
          <div className="container-fluid">
            <InfluxTable
              source={source}
              sources={sources}
              deleteKapacitor={deleteKapacitor}
              onDeleteSource={this.handleDeleteSource}
              setActiveKapacitor={this.handleSetActiveKapacitor}
              toggleVisibility={this.toggleVisibility}
            />
            <p className="version-number">Chronograf Version: {VERSION}</p>
          </div>
        </FancyScrollbar>
        <GrandWizard wizardVisibility={wizardVisibility} />
      </div>
    )
  }

  private toggleVisibility = isVisible => () => {
    this.setState({
      wizardVisibility: isVisible,
    })
  }

  private handleDeleteSource = (source: Source) => {
    const {notify} = this.props

    try {
      this.props.removeAndLoadSources(source)
      notify(notifySourceDeleted(source.name))
    } catch (e) {
      notify(notifySourceDeleteFailed(source.name))
    }
  }

  private handleSetActiveKapacitor = ({kapacitor}) => {
    this.props.setActiveKapacitor(kapacitor)
  }
}

const mstp = ({sources}) => ({
  sources,
})

const mdtp = {
  removeAndLoadSources: actions.removeAndLoadSources,
  fetchKapacitors: actions.fetchKapacitorsAsync,
  setActiveKapacitor: actions.setActiveKapacitorAsync,
  deleteKapacitor: actions.deleteKapacitorAsync,
  notify: notifyAction,
}

export default connect(mstp, mdtp)(ManageSources)
