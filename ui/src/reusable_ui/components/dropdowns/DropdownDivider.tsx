import React, {SFC} from 'react'
<<<<<<< HEAD
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
=======
import classnames from 'classnames'
>>>>>>> WIP use wrapper and children for configuring dropdowns

interface Props {
  text?: string
}

const DropdownDivider: SFC<Props> = ({text}) => (
  <div className={classnames('dropdown--divider', {line: !text})}>{text}</div>
)

<<<<<<< HEAD
>>>>>>> WIP Introduce new components for dropdowns
=======
DropdownDivider.defaultProps = {
  text: '',
}

>>>>>>> WIP use wrapper and children for configuring dropdowns
export default DropdownDivider
