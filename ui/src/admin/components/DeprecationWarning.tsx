import React, {FunctionComponent} from 'react'

interface Props {
  message: JSX.Element
}

const DeprecationWarning: FunctionComponent<Props> = ({message}) => (
  <div className="alert alert-primary">
    <span className="icon octagon" />
    <div className="alert-message">{message}</div>
  </div>
)

export default DeprecationWarning
