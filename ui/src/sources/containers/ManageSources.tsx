import React, {PureComponent} from 'react'
import {connect} from 'react-redux'
import {ErrorHandling} from 'src/shared/decorators/errors'

import * as sourcesActions from 'src/shared/actions/sources'
import * as servicesActions from 'src/shared/actions/services'
import {notify as notifyAction} from 'src/shared/actions/notifications'

import FancyScrollbar from 'src/shared/components/FancyScrollbar'
import PageHeader from 'src/reusable_ui/components/page_layout/PageHeader'
import InfluxTable from 'src/sources/components/InfluxTable'
import ConnectionWizard from 'src/sources/components/ConnectionWizard'

import {
  notifySourceDeleted,
  notifySourceDeleteFailed,
} from 'src/shared/copy/notifications'

import {Source, Notification, Service} from 'src/types'
import {getDeep} from 'src/utils/wrappers'

interface State {
  wizardVisibility: boolean
  sourceInWizard: Source
}

interface Props {
  source: Source
  sources: Source[]
  services: Service[]
  notify: (n: Notification) => void
  deleteKapacitor: sourcesActions.DeleteKapacitorAsync
  fetchKapacitors: sourcesActions.FetchKapacitorsAsync
  removeAndLoadSources: sourcesActions.RemoveAndLoadSources
  setActiveKapacitor: sourcesActions.SetActiveKapacitorAsync
  fetchAllServices: servicesActions.FetchAllFluxServicesAsync
  setActiveFlux: servicesActions.SetActiveServiceAsync
  deleteFlux: servicesActions.DeleteServiceAsync
}

const VERSION = process.env.npm_package_version

@ErrorHandling
class ManageSources extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      wizardVisibility: false,
      sourceInWizard: null,
    }
  }
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
    const {sources, source, deleteKapacitor, deleteFlux, services} = this.props
    const {wizardVisibility, sourceInWizard} = this.state
    return (
      <div className="page" id="manage-sources-page">
        <PageHeader titleText="Configuration" sourceIndicator={true} />
        <FancyScrollbar className="page-contents">
          <div className="container-fluid">
            <InfluxTable
              source={source}
              sources={sources}
              services={services}
              deleteFlux={deleteFlux}
              deleteKapacitor={deleteKapacitor}
              onDeleteSource={this.handleDeleteSource}
              setActiveFlux={this.handleSetActiveFlux}
              setActiveKapacitor={this.handleSetActiveKapacitor}
              toggleWizard={this.toggleWizard}
            />
            <p className="version-number">Chronograf Version: {VERSION}</p>
          </div>
        </FancyScrollbar>
        <ConnectionWizard
          isVisible={wizardVisibility}
          toggleVisibility={this.toggleWizard}
          source={sourceInWizard}
        />
      </div>
    )
  }

  private handleSetActiveFlux = async (source, service) => {
    const {services, setActiveFlux} = this.props
    const prevActiveService = services.find(s => {
      return getDeep<boolean>(s, 'metadata.active', false)
    })
    await setActiveFlux(source, service, prevActiveService)
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

  private toggleWizard = (isVisible: boolean) => (
    source: Source = null
  ) => () => {
    this.setState({
      wizardVisibility: isVisible,
      sourceInWizard: source,
    })
  }

  private handleSetActiveKapacitor = ({kapacitor}) => {
    this.props.setActiveKapacitor(kapacitor)
  }
}

const mstp = ({sources, services}) => ({
  sources,
  services,
})

const mdtp = {
  notify: notifyAction,
  removeAndLoadSources: sourcesActions.removeAndLoadSources,
  fetchKapacitors: sourcesActions.fetchKapacitorsAsync,
  setActiveKapacitor: sourcesActions.setActiveKapacitorAsync,
  deleteKapacitor: sourcesActions.deleteKapacitorAsync,
  fetchAllServices: servicesActions.fetchAllFluxServicesAsync,
  setActiveFlux: servicesActions.setActiveServiceAsync,
  deleteFlux: servicesActions.deleteServiceAsync,
}

export default connect(mstp, mdtp)(ManageSources)
