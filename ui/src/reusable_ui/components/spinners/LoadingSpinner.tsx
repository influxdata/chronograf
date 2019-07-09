// Libraries
import React, {FunctionComponent} from 'react'

interface Props {
  diameter?: number
}

const LoadingSpinner: FunctionComponent<Props> = ({diameter = 30}) => {
  const style = {width: `${diameter}px`, height: `${diameter}px`}
  return (
    <div className="loading-spinner--container" style={style}>
      <div className="loading-spinner--circle" style={style} />
    </div>
  )
}

export default LoadingSpinner
