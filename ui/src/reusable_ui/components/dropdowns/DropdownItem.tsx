import React, {SFC} from 'react'
import {DropdownContext} from 'src/reusable_ui/components/dropdowns/Dropdown'

interface Props {
  text: string
}

const DropdownItem: SFC<Props> = ({text}) => (
  <DropdownContext.Consumer>
    {({onClick}) => (
      <div className="dropdown--menu-item" onClick={onClick(text)}>
        {text}
      </div>
    )}
  </DropdownContext.Consumer>
)

export default DropdownItem
