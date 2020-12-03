import React, {FunctionComponent, CSSProperties} from 'react'

interface Props {
  style?: CSSProperties
}

const LoadingSpinner: FunctionComponent<Props> = ({style}) => {
  return (
    <div className="loading-spinner" style={style}>
      <div className="spinner">
        <div className="bounce1" />
        <div className="bounce2" />
        <div className="bounce3" />
      </div>
    </div>
  )
}

export default LoadingSpinner
