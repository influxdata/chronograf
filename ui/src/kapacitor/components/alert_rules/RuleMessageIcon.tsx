// Libraries
import React, {FunctionComponent} from 'react'

// Components
import LoadingSpinner from 'src/reusable_ui/components/spinners/LoadingSpinner'

// Types
import {ValidationState} from 'src/types'

interface Props {
  validationState: ValidationState
}

const RuleMessageIcon: FunctionComponent<Props> = ({validationState}) => {
  if (validationState === ValidationState.Validating) {
    return <LoadingSpinner diameter={15} />
  }

  if (validationState === ValidationState.Error) {
    return <span className="icon stop" />
  }

  if (validationState === ValidationState.Success) {
    return <span className="icon checkmark" />
  }

  return null
}

export default RuleMessageIcon
