import React, {SFC} from 'react'
<<<<<<< HEAD
import classnames from 'classnames'

interface Props {
  text?: string
}

const DropdownDivider: SFC<Props> = ({text}) => (
  <div className={classnames('dropdown--divider', {line: !text})}>{text}</div>
)

DropdownDivider.defaultProps = {
  text: '',
}

=======

interface Props {
  text: string
}

const DropdownDivider: SFC<Props> = ({text}) => (
  <div className="dropdown--menu-divider">{text}</div>
)

>>>>>>> WIP Introduce new components for dropdowns
export default DropdownDivider
