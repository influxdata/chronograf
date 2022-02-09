// Libraries
import React from 'react'
import classnames from 'classnames'

interface Props {
  testID?: string
  className?: string
  children?: React.ReactNode | React.ReactNodeArray
}

const BuilderCardMenu = (props: Props) => {
  const {testID, children, className} = props
  const classname = classnames('builder-card--menu', {
    [`${className}`]: className,
  })

  return (
    <div className={classname} data-testid={testID ?? 'builder-card--menu'}>
      {children}
    </div>
  )
}

export default BuilderCardMenu
