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
    const {services, sources, allowInfluxQL, allowDynamicSource} = this.props

    const sourceOptions = sources.reduce((acc, source) => {
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

    if (allowDynamicSource) {
      const dynamicSourceDropdownItem = {
        sourceID: DynamicSource.id,
      }
      const dynamicSource = (
        <Dropdown.Item
          key={DynamicSource.id}
          id={DynamicSource.id}
          value={dynamicSourceDropdownItem}
        >
          {DynamicSource.name}
        </Dropdown.Item>
      )

      return [...sourceOptions, dynamicSource]
    }

    return sourceOptions
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
