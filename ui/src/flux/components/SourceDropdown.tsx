// Libraries
import React, {PureComponent} from 'react'

// Components
import Dropdown from 'src/reusable_ui/components/dropdowns/Dropdown'

// Constants
import {DynamicSource} from 'src/sources/constants'

// types
import {Service, Source, ServiceLinks, SourceLinks} from 'src/types'

interface Props {
  source: Source
  service: Service
  services: Service[]
  sources: Source[]
  allowInfluxQL: boolean
  allowFlux: boolean
  allowDynamicSource: boolean
  isDynamicSourceSelected?: boolean
  onChangeService: (service: Service, source: Source) => void
}

interface SourceDropdownItem {
  sourceID: string
  serviceID?: string
  links: ServiceLinks | SourceLinks
}

class SourceDropdown extends PureComponent<Props> {
  public render() {
    return (
      <Dropdown
        onChange={this.handleSelect}
        selectedID={this.selectedID}
        widthPixels={250}
      >
        {this.dropdownItems}
      </Dropdown>
    )
  }

  private handleSelect = (choice: SourceDropdownItem): void => {
    const {sources, services, onChangeService} = this.props

    if (choice.sourceID === DynamicSource.id) {
      onChangeService(null, null)
      return
    }

    const source = sources.find(src => {
      return src.id === choice.sourceID
    })
    const service = services.find(s => {
      return s.id === choice.serviceID
    })

    onChangeService(service, source)
  }

  private get dropdownItems(): JSX.Element[] {
    const {sources, allowFlux, allowInfluxQL, allowDynamicSource} = this.props

    const sourceOptions = sources.reduce((acc, source) => {
      let items = []
      if (allowFlux) {
        items = [...items, ...this.fluxSourceItems(source)]
      }

      if (allowInfluxQL) {
        items = [...items, this.influxQLSourceItem(source)]
      }

      return [...acc, ...items]
    }, [])

    if (allowDynamicSource) {
      return [...sourceOptions, this.dynamicSourceOption]
    }

    return sourceOptions
  }

  private get dynamicSourceOption(): JSX.Element {
    const dynamicSourceDropdownItem = {
      sourceID: DynamicSource.id,
    }
    return (
      <Dropdown.Item
        key={DynamicSource.id}
        id={DynamicSource.id}
        value={dynamicSourceDropdownItem}
      >
        {DynamicSource.name}
      </Dropdown.Item>
    )
  }

  private influxQLSourceItem(source: Source): JSX.Element {
    const sourceDropdownItem: SourceDropdownItem = {
      sourceID: source.id,
      links: source.links,
    }

    return (
      <Dropdown.Item key={source.id} id={source.id} value={sourceDropdownItem}>
        {`${source.name} (InfluxQL)`}
      </Dropdown.Item>
    )
  }

  private fluxSourceItems(source: Source): JSX.Element[] {
    const {services} = this.props

    const servicesForSource = services.filter(service => {
      return service.sourceID === source.id
    })
    return servicesForSource.map(service => {
      const serviceDropdownItem: SourceDropdownItem = {
        sourceID: source.id,
        serviceID: service.id,
        links: service.links,
      }
      return (
        <Dropdown.Item
          key={`${source.id}-${service.id}`}
          id={`${source.id}-${service.id}`}
          value={serviceDropdownItem}
        >
          {`${source.name} / ${service.name} (flux)`}
        </Dropdown.Item>
      )
    })
  }

  private get selectedID(): string {
    const {
      service,
      source,
      allowDynamicSource,
      isDynamicSourceSelected,
    } = this.props

    if (allowDynamicSource && isDynamicSourceSelected) {
      return DynamicSource.id
    }

    if (service) {
      return `${service.sourceID}-${service.id}`
    }

    return source.id
  }
}

export default SourceDropdown
