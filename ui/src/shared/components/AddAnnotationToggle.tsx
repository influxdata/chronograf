import React, {SFC} from 'react'
import {connect} from 'react-redux'

import {Button, ComponentColor, IconFont} from 'src/reusable_ui'

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

  let onToggle
  let buttonContent = 'Annotate'
  let buttonColor = ComponentColor.Primary
  let buttonIcon = IconFont.AnnotatePlus

  if (isAddingAnnotation) {
    onToggle = onDismissAddingAnnotation
    buttonContent = 'Cancel Annotate'
    buttonColor = ComponentColor.Default
    buttonIcon = IconFont.Remove
  } else {
    onToggle = onAddingAnnotation
  }

  return (
    <Button
      icon={buttonIcon}
      color={buttonColor}
      text={buttonContent}
      onClick={onToggle}
    />
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
