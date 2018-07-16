import React, {SFC} from 'react'

interface Props {
  text: string
}

const DropdownDivider: SFC<Props> = ({text}) => (
  <div className="dropdown--menu-divider">{text}</div>
)

export default DropdownDivider
