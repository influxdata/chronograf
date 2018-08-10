import React, {SFC} from 'react'
import {connect} from 'react-redux'

import {
  Button,
  ComponentColor,
  IconFont,
  ComponentStatus,
} from 'src/reusable_ui'

import {
  addingAnnotation,
  dismissAddingAnnotation,
} from 'src/shared/actions/annotations'

import {ADDING} from 'src/shared/annotations/helpers'

import {AnnotationsDisplaySetting} from 'src/types/annotations'

interface Props {
  isAddingAnnotation: boolean
  displaySetting: AnnotationsDisplaySetting
  onAddingAnnotation: typeof addingAnnotation
  onDismissAddingAnnotation: typeof dismissAddingAnnotation
}

const AddAnnotationToggle: SFC<Props> = props => {
  const {
    isAddingAnnotation,
    displaySetting,
    onAddingAnnotation,
    onDismissAddingAnnotation,
  } = props

  let onToggle
  let buttonContent = 'Annotate'
  let buttonColor = ComponentColor.Primary
  let buttonIcon = IconFont.AnnotatePlus
  let buttonStatus = ComponentStatus.Default

  if (isAddingAnnotation) {
    onToggle = onDismissAddingAnnotation
    buttonContent = 'Cancel Annotate'
    buttonColor = ComponentColor.Default
    buttonIcon = IconFont.Remove
  } else {
    onToggle = onAddingAnnotation
  }

  if (displaySetting === AnnotationsDisplaySetting.HideAnnotations) {
    buttonStatus = ComponentStatus.Disabled
  }

  return (
    <Button
      icon={buttonIcon}
      color={buttonColor}
      status={buttonStatus}
      text={buttonContent}
      onClick={onToggle}
    />
  )
}

const mstp = ({annotations: {mode, displaySetting}}) => ({
  isAddingAnnotation: mode === ADDING,
  displaySetting,
})

const mdtp = {
  onAddingAnnotation: addingAnnotation,
  onDismissAddingAnnotation: dismissAddingAnnotation,
}

export default connect(mstp, mdtp)(AddAnnotationToggle)
