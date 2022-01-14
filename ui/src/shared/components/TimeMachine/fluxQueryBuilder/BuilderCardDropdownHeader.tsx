// Libraries
import React, {PureComponent} from 'react'

import {Dropdown} from 'src/reusable_ui'
import {BuilderAggregateFunctionType} from 'src/types'

interface Props {
  options: string[]
  selectedOption: string
  testID?: string
  onSelect?: (option: BuilderAggregateFunctionType) => void
  onDelete?: () => void
  isInCheckOverlay?: boolean
  children?: JSX.Element
}

const emptyFunction = () => {}

export default class BuilderCardDropdownHeader extends PureComponent<Props> {
  public static defaultProps = {
    testID: 'builder-card--header',
  }

  public render() {
    const {
      children,
      isInCheckOverlay,
      options,
      onSelect,
      selectedOption,
      testID,
    } = this.props
    return (
      <div className="builder-card--header" data-testid={testID}>
        {isInCheckOverlay ? (
          <span>{selectedOption}</span>
        ) : (
          <Dropdown
            selectedID={selectedOption}
            data-testid="select-option-dropdown"
            onChange={onSelect ? onSelect : emptyFunction}
          >
            {options.map((option: string) => (
              <Dropdown.Item id={option} key={option} value={option} />
            ))}
          </Dropdown>
        )}
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
