import React, {FunctionComponent} from 'react'

const PageSpinner: FunctionComponent<Record<string, never>> = () => {
  return (
    <div className="page-spinner-container">
      <div className="page-spinner" />
    </div>
  )
}

export default PageSpinner
