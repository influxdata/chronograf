import React, {FunctionComponent} from 'react'
import classnames from 'classnames'
import {CSSProperties} from 'react'

const disabledClass = (disabled: boolean) => (disabled ? ' disabled' : '')

interface Props {
  iconName: string
  selected: string
  buttonSize: string
  toggleStyle: CSSProperties
  buttonColor: string
  disabled: boolean
}

const DropdownHead: FunctionComponent<Props> = ({
  iconName,
  selected,
  buttonSize,
  toggleStyle,
  buttonColor,
  disabled,
}) => (
  <div
    className={`btn dropdown-toggle ${buttonSize} ${buttonColor}${disabledClass(
      disabled
    )}`}
    style={toggleStyle}
  >
    {iconName && <span className={classnames('icon', {[iconName]: true})} />}
    <span className="dropdown-selected">{selected}</span>
    <span className="caret" />
  </div>
)

export default DropdownHead
