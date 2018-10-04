// Libraries
import React, {PureComponent} from 'react'

// Components
import Dropdown from 'src/reusable_ui/components/dropdowns/Dropdown'

// Constants
import {DynamicSource} from 'src/sources/constants'

// types
import {Source, SourceLinks, QueryType} from 'src/types'

interface Props {
  source: Source
  type: QueryType
  sources: Source[]
  allowDynamicSource: boolean
  isDynamicSourceSelected?: boolean
  onSelectDynamicSource?: () => void
  onChangeSource: (source: Source, type: QueryType) => void
}

interface SourceDropdownItem {
  sourceID: string
  links: SourceLinks
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
    const {sources, onChangeSource, onSelectDynamicSource, type} = this.props

    if (choice.sourceID === DynamicSource.id && onSelectDynamicSource) {
      onSelectDynamicSource()
      return
    }

    const source = sources.find(src => {
      return src.id === choice.sourceID
    })

    onChangeSource(source, type)
  }

  private get dropdownItems(): JSX.Element[] {
    const {sources, allowDynamicSource} = this.props

    const sourceOptions: JSX.Element[] = sources.map(source => (
      <Dropdown.Item
        key={source.id}
        id={source.id}
        value={this.sourceDropdownItemValue(source)}
      >
        {source.name}
      </Dropdown.Item>
    ))

    if (allowDynamicSource) {
      sourceOptions.push(this.dynamicSourceOption)
      return sourceOptions
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

  private sourceDropdownItemValue(source: Source): SourceDropdownItem {
    return {
      sourceID: source.id,
      links: source.links,
    }
  }

  private get selectedID(): string {
    const {source, allowDynamicSource, isDynamicSourceSelected} = this.props

    if (allowDynamicSource && isDynamicSourceSelected) {
      return DynamicSource.id
    }

    return source.id
  }
}

export default SourceDropdown
