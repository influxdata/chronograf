import React, {FunctionComponent} from 'react'
import {connect} from 'react-redux'
import {isUserAuthorized, VIEWER_ROLE} from 'src/auth/roles'

import {Button, ComponentColor, IconFont} from 'src/reusable_ui'

import {
  addingAnnotation,
  dismissAddingAnnotation,
} from 'src/shared/actions/annotations'

import {ADDING} from 'src/shared/annotations/helpers'
import {Me} from 'src/types'

interface Props {
  isAddingAnnotation: boolean
  isUsingAuth: boolean
  me: Me
  onAddingAnnotation: typeof addingAnnotation
  onDismissAddingAnnotation: typeof dismissAddingAnnotation
}

const AddAnnotationToggle: FunctionComponent<Props> = props => {
  const {
    isAddingAnnotation,
    onAddingAnnotation,
    onDismissAddingAnnotation,
    isUsingAuth,
    me,
  } = props

  if (isUsingAuth && !isUserAuthorized(me.role, VIEWER_ROLE)) {
    return null
  }

  let onToggle
  let buttonContent = 'Annotate'
  let buttonColor = ComponentColor.Primary
  let buttonIcon = IconFont.AnnotatePlus
  let buttonDataTest = 'add-annotation--button'

  if (isAddingAnnotation) {
    onToggle = onDismissAddingAnnotation
    buttonContent = 'Cancel Annotate'
    buttonColor = ComponentColor.Default
    buttonIcon = IconFont.Remove
    buttonDataTest = 'cancel-annotation--button'
  } else {
    onToggle = onAddingAnnotation
  }

  return (
    <Button
      icon={buttonIcon}
      color={buttonColor}
      text={buttonContent}
      onClick={onToggle}
      dataTest={buttonDataTest}
    />
  )
}

const mstp = ({auth: {isUsingAuth, me}, annotations: {mode}}) => ({
  isAddingAnnotation: mode === ADDING,
  isUsingAuth,
  me,
})

const mdtp = {
  onAddingAnnotation: addingAnnotation,
  onDismissAddingAnnotation: dismissAddingAnnotation,
}

export default connect(mstp, mdtp)(AddAnnotationToggle)
