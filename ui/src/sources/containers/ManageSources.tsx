import React, {PureComponent} from 'react'
import {connect} from 'react-redux'
import {ErrorHandling} from 'src/shared/decorators/errors'

import * as sourcesActions from 'src/shared/actions/sources'
import * as servicesActions from 'src/shared/actions/services'
import {notify as notifyAction} from 'src/shared/actions/notifications'

import FancyScrollbar from 'src/shared/components/FancyScrollbar'
import PageHeader from 'src/reusable_ui/components/page_layout/PageHeader'
import InfluxTable from 'src/sources/components/InfluxTable'

import {
  notifySourceDeleted,
  notifySourceDeleteFailed,
} from 'src/shared/copy/notifications'

import {Source, Notification} from 'src/types'

interface Props {
  source: Source
  sources: Source[]
  notify: (n: Notification) => void
  deleteKapacitor: sourcesActions.DeleteKapacitorAsync
  fetchKapacitors: sourcesActions.FetchKapacitorsAsync
  removeAndLoadSources: sourcesActions.RemoveAndLoadSources
  setActiveKapacitor: sourcesActions.SetActiveKapacitorAsync
  fetchAllServices: servicesActions.FetchAllServicesAsync
}

const VERSION = process.env.npm_package_version

@ErrorHandling
class ManageSources extends PureComponent<Props> {
  public componentDidMount() {
    this.props.fetchAllServices(this.props.sources)
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
            />
            <p className="version-number">Chronograf Version: {VERSION}</p>
          </div>
        </FancyScrollbar>
      </div>
    )
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
  removeAndLoadSources: sourcesActions.removeAndLoadSources,
  fetchKapacitors: sourcesActions.fetchKapacitorsAsync,
  setActiveKapacitor: sourcesActions.setActiveKapacitorAsync,
  deleteKapacitor: sourcesActions.deleteKapacitorAsync,
  notify: notifyAction,
  fetchAllServices: servicesActions.fetchAllServicesAsync,
}

export default connect(mstp, mdtp)(ManageSources)
