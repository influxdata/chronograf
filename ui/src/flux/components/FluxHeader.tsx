import React, {PureComponent} from 'react'

import {Page} from 'src/reusable_ui'
import SourceDropdown from 'src/flux/components/SourceDropdown'

import {Service, Source} from 'src/types'

interface Props {
  service: Service
  services: Service[]
  sources: Source[]
  source: Source
  onGoToEditFlux: (service: Service) => void
  onChangeService: (service: Service, source: Source) => void
}

class FluxHeader extends PureComponent<Props> {
  constructor(props: Props) {
    super(props)
  }

  public render() {
    const {service, services, source, sources, onChangeService} = this.props

    return (
      <Page.Header fullWidth={true}>
        <Page.Header.Left>
          <Page.Title title="Flux Editor" />
        </Page.Header.Left>
        <Page.Header.Right>
          <SourceDropdown
            source={source}
            sources={sources}
            services={services}
            service={service}
            allowInfluxQL={false}
            allowFlux={true}
            allowDynamicSource={false}
            onChangeService={onChangeService}
          />
          <button
            onClick={this.handleGoToEditFlux}
            className="btn btn-sm btn-default"
          >
            Edit Connection
          </button>
        </Page.Header.Right>
      </Page.Header>
    )
  }

  private handleGoToEditFlux = () => {
    const {service, onGoToEditFlux} = this.props
    onGoToEditFlux(service)
  }
}

export default FluxHeader
