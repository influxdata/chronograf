// Libraries
import React from 'react'
import {
  Button,
  ComponentColor,
  ComponentSize,
  ComponentStatus,
} from 'src/reusable_ui'

interface Props {
  isCustomScript: boolean
  isRunnable: boolean
  submitAction: () => void
}

const FluxQueryBuilderSubmit = ({
  isCustomScript,
  isRunnable,
  submitAction,
}: Props) => {
  // TODO require confirmation when isCustomScript
  // Submitting the query builder will discard any changes you have made
  // using Flux. This cannot be recovered.

  return (
    <Button
      size={ComponentSize.ExtraSmall}
      color={isCustomScript ? ComponentColor.Warning : ComponentColor.Primary}
      onClick={submitAction}
      status={isRunnable ? ComponentStatus.Default : ComponentStatus.Disabled}
      text="Submit"
    />
  )
}

export default FluxQueryBuilderSubmit
