import React, {PureComponent} from 'react'

import Dropdown from 'src/reusable_ui/components/dropdowns/Dropdown'

import {Service, Source, ServiceLinks, SourceLinks} from 'src/types'

interface Props {
  service: Service
  services: Service[]
  sources: Source[]
  allowInfluxQL: boolean
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

  private handleSelect = (choice: SourceDropdownItem) => {
    const {sources, services} = this.props

    const source = sources.find(src => {
      return src.id === choice.sourceID
    })
    const service = services.find(s => {
      return s.id === choice.serviceID
    })

    this.props.onChangeService(service, source)
  }

  private get dropdownItems(): JSX.Element[] {
    const {services, sources, allowInfluxQL} = this.props

    return sources.reduce((acc, source) => {
      const servicesForSource = services.filter(service => {
        return service.sourceID === source.id
      })

      const serviceItems = servicesForSource.map(service => {
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

      if (allowInfluxQL) {
        const sourceDropdownItem: SourceDropdownItem = {
          sourceID: source.id,
          links: source.links,
        }

        const influxQLDropdownItem = (
          <Dropdown.Item
            key={source.id}
            id={source.id}
            value={sourceDropdownItem}
          >
            {`${source.name} (InfluxQL)`}
          </Dropdown.Item>
        )
        return [...acc, ...serviceItems, influxQLDropdownItem]
      }
      return [...acc, ...serviceItems]
    }, [])
  }

  private get selectedID(): string {
    const {service} = this.props
    return service.sourceID + '-' + service.id
  }
}

export default SourceDropdown
