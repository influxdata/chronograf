import React, {PureComponent, ReactChildren} from 'react'
import {connect} from 'react-redux'
import {WithRouterProps, withRouter} from 'react-router'

import {FluxPage} from 'src/flux'
import EmptyFluxPage from 'src/flux/components/EmptyFluxPage'

import {Source, Service, Notification} from 'src/types'
import {Links} from 'src/types/flux'
import {notify as notifyAction} from 'src/shared/actions/notifications'
import {
  updateScript as updateScriptAction,
  UpdateScript,
} from 'src/flux/actions'
import * as actions from 'src/shared/actions/services'
import {getDeep} from 'src/utils/wrappers'

export const NotificationContext = React.createContext(undefined)

interface Props {
  sources: Source[]
  services: Service[]
  children: ReactChildren
  fetchServicesAsync: actions.FetchAllFluxServicesAsync
  notify: (message: Notification) => void
  updateScript: UpdateScript
  script: string
  links: Links
}

interface State {
  selectedSource: Source
  selectedService: Service
}

export class CheckServices extends PureComponent<
  Props & WithRouterProps,
  State
> {
  constructor(props: Props & WithRouterProps) {
    super(props)

    this.state = {
      selectedSource: null,
      selectedService: null,
    }
  }

  public async componentDidMount() {
    const {sources} = this.props
    if (!sources.length) {
      return
    }

    await this.props.fetchServicesAsync(sources)
  }

  public render() {
    const {services, sources, notify, updateScript, links, script} = this.props

    if (!this.props.services.length) {
      return <EmptyFluxPage onGoToNewService={this.handleGoToNewFlux} />
    }

    return (
      <NotificationContext.Provider value={{notify}}>
        <FluxPage
          source={this.source}
          sources={sources}
          service={this.service}
          services={services}
          links={links}
          script={script}
          notify={notify}
          updateScript={updateScript}
          onGoToEditFlux={this.handleGoToEditFlux}
          onChangeService={this.handleChangeService}
        />
      </NotificationContext.Provider>
    )
  }

  private handleGoToNewFlux = () => {
    const {router} = this.props
    const addFluxResource = `/sources/${this.source.id}/flux/new`
    router.push(addFluxResource)
  }

  private handleGoToEditFlux = (service: Service) => {
    const {router} = this.props
    const editFluxResource = `/sources/${this.source.id}/flux/${
      service.id
    }/edit`
    router.push(editFluxResource)
  }

  private handleChangeService = (
    selectedService: Service,
    selectedSource: Source
  ) => {
    this.setState({
      selectedService,
      selectedSource,
    })
  }

  private get source(): Source {
    const {params, sources} = this.props
    const {selectedSource} = this.state

    if (selectedSource) {
      return selectedSource
    }

    return sources.find(s => s.id === params.sourceID)
  }

  private get service(): Service {
    const {services} = this.props
    const {selectedService} = this.state

    if (selectedService) {
      return selectedService
    }

    const activeService = services.find(s => {
      return getDeep<boolean>(s, 'metadata.active', false)
    })

    return activeService || services[0]
  }
}

const mdtp = {
  fetchServicesAsync: actions.fetchAllFluxServicesAsync,
  updateScript: updateScriptAction,
  notify: notifyAction,
}

const mstp = ({sources, services, links, script}) => {
  return {
    links: links.flux,
    script,
    sources,
    services,
  }
}

export default withRouter<Props>(connect(mstp, mdtp)(CheckServices))
