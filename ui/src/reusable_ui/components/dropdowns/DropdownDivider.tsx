import React, {SFC} from 'react'
import classnames from 'classnames'

interface Props {
  text?: string
}

const DropdownDivider: SFC<Props> = ({text}): JSX.Element => (
  <div className={classnames('dropdown--divider', {line: !text})}>{text}</div>
)

DropdownDivider.defaultProps = {
  text: '',
}

export default DropdownDivider
