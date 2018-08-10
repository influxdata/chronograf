import React, {SFC} from 'react'
import {connect} from 'react-redux'

import {
  addingAnnotation,
  dismissAddingAnnotation,
} from 'src/shared/actions/annotations'

import {ADDING} from 'src/shared/annotations/helpers'

interface Props {
  isAddingAnnotation: boolean
  onAddingAnnotation: typeof addingAnnotation
  onDismissAddingAnnotation: typeof dismissAddingAnnotation
}

const AddAnnotationToggle: SFC<Props> = props => {
  const {
    isAddingAnnotation,
    onAddingAnnotation,
    onDismissAddingAnnotation,
  } = props

  const buttonClass = isAddingAnnotation ? 'default' : 'primary'

  let onToggle
  let buttonContent

  if (isAddingAnnotation) {
    onToggle = onDismissAddingAnnotation
    buttonContent = 'Cancel Add Annotation'
  } else {
    onToggle = onAddingAnnotation
    buttonContent = (
      <>
        <span className="icon plus" /> Add Annotation
      </>
    )
  }

  return (
    <div className={`btn btn-${buttonClass} btn-sm`} onClick={onToggle}>
      {buttonContent}
    </div>
  )
}

const mstp = ({annotations: {mode}}) => ({
  isAddingAnnotation: mode === ADDING,
})

const mdtp = {
  onAddingAnnotation: addingAnnotation,
  onDismissAddingAnnotation: dismissAddingAnnotation,
}

export default connect(mstp, mdtp)(AddAnnotationToggle)
