import React, {PureComponent} from 'react'

import PageHeader from 'src/reusable_ui/components/page_layout/PageHeader'
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
    return (
      <>
        <PageHeader
          titleText="Flux Editor"
          fullWidth={true}
          optionsComponents={this.optionsComponents}
        />
      </>
    )
  }

  private get optionsComponents(): JSX.Element {
    const {service, services, source, sources, onChangeService} = this.props
    return (
      <>
        <SourceDropdown
          source={source}
          sources={sources}
          services={services}
          service={service}
          allowInfluxQL={false}
          allowDynamicSource={false}
          onChangeService={onChangeService}
        />
        <button
          onClick={this.handleGoToEditFlux}
          className="btn btn-sm btn-default"
        >
          Edit Connection
        </button>
      </>
    )
  }

  private handleGoToEditFlux = () => {
    const {service, onGoToEditFlux} = this.props
    onGoToEditFlux(service)
  }
}

export default FluxHeader
