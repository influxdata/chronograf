// Libraries
import React from 'react'

interface Props {
  testID?: string
  children?: React.ReactNode
}

const BuilderCardEmpty = (props: Props) => {
  const {testID, children} = props

  return (
    <div
      className="builder-card--body builder-card--empty"
      data-testid={testID ?? 'builder-card--empty'}
    >
      {children}
    </div>
  )
}
export default BuilderCardEmpty
