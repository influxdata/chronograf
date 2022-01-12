// Libraries
import React from 'react'
import classnames from 'classnames'

interface Props {
  title: string
  testID?: string
  onDelete?: () => void
  onDragStart?: () => void
  className?: string
  children?: JSX.Element
}

const BuilderCardHeader = (props: Props) => {
  const {testID, children, className, onDelete, onDragStart, title} = props
  const classname = classnames('builder-card--header', {
    [`${className}`]: className,
  })

  return (
    <div className={classname} data-testid={testID ?? 'builder-card--header'}>
      {onDragStart ? (
        <div className="builder-card--draggable" onDragStart={onDragStart}>
          <div className="builder-card--hamburger" />
          <h2 className="builder-card--title">{title}</h2>
        </div>
      ) : (
        <h2 className="builder-card--title">{title}</h2>
      )}
      {children}
      {onDelete ? (
        <div className="builder-card--delete" onClick={onDelete} />
      ) : undefined}
    </div>
  )
}

export default BuilderCardHeader
