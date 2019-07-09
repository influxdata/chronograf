// Libraries
import React, {FunctionComponent} from 'react'
import classnames from 'classnames'

// Components
import RuleMessageIcon from './RuleMessageIcon'

// Types
import {ValidationState} from 'src/types'

interface Props {
  validationText: string
  validationState: ValidationState
}

const RuleMessageStatus: FunctionComponent<Props> = ({
  validationText,
  validationState,
}) => {
  const className = classnames('query-status-output', {
    'query-status-output--success': validationState === ValidationState.Success,
    'query-status-output--error': validationState === ValidationState.Error,
  })

  return (
    <div className="query-editor--status">
      <span className={className}>
        <RuleMessageIcon validationState={validationState} />
        {validationText}
      </span>
    </div>
  )
}

export default RuleMessageStatus
