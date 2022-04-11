// Libraries
import React, {PureComponent} from 'react'

import {Dropdown} from '../../Dropdown'

interface Props {
  options: string[]
  selectedOption: string
  testID?: string
  onSelect?: (option: string) => void
  onDelete?: () => void | boolean
  isInCheckOverlay?: boolean
  children?: JSX.Element
}

export default class BuilderCardDropdownHeader extends PureComponent<Props> {
  public static defaultProps = {
    testID: 'builder-card--header',
  }

  public render() {
    const {children, options, onSelect, selectedOption, testID} = this.props
    return (
      <div className="builder-card--header" data-test={testID}>
        <Dropdown
          items={options.map(x => ({text: x}))}
          onChoose={({text}) => onSelect(text)}
          selected={selectedOption}
          buttonSize="btn-sm"
          className="dropdown-stretch"
          data-test="select-option-dropdown"
        />
        {children}
        {this.deleteButton}
      </div>
    )
  }

  private get deleteButton(): JSX.Element | undefined {
    const {onDelete} = this.props

    if (onDelete) {
      return <div className="builder-card--delete" onClick={onDelete} />
    }
  }
}
