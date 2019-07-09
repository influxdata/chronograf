// Libraries
import React, {FunctionComponent, ChangeEvent} from 'react'
import classnames from 'classnames'

// Types
import {ValidationState} from 'src/types'

interface Props {
  message: string
  validationState: ValidationState
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void
  onKeyUp: () => void
}

const RuleMessageTextArea: FunctionComponent<Props> = ({
  message,
  onChange,
  onKeyUp,
  validationState,
}) => {
  const className = classnames('form-control input-sm monotype', {
    'form-volcano': validationState === ValidationState.Error,
    'form-malachite': validationState === ValidationState.Success,
  })

  return (
    <textarea
      value={message}
      onKeyUp={onKeyUp}
      spellCheck={false}
      onChange={onChange}
      className={className}
      placeholder="Example: {{ .ID }} is {{ .Level }} value: {{ index .Fields &quot;value&quot; }}"
    />
  )
}

export default RuleMessageTextArea
