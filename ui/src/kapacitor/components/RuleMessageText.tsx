import React, {SFC, ChangeEvent} from 'react'
import isValidMessage from 'src/kapacitor/utils/alertMessageValidation'

import {AlertRule} from 'src/types'

interface Props {
  rule: AlertRule
  updateMessage: (e: ChangeEvent<HTMLTextAreaElement>) => void
}

const RuleMessageText: SFC<Props> = ({rule, updateMessage}) => {
  const isValid = isValidMessage(rule.message)

  const textAreaClass = isValid ? 'form-malachite' : 'form-volcano'

  const iconName = isValid ? 'checkmark' : 'stop'

  const validationCopy = isValid
    ? 'Alert message is syntactically correct.'
    : 'Please correct templates in alert message.'

  const outputStatusClass = isValid
    ? 'query-status-output--success'
    : 'query-status-output--error'

  return (
    <div className="rule-builder--message">
      <textarea
        className={`form-control input-sm monotype ${textAreaClass}`}
        onChange={updateMessage}
        placeholder="Example: {{ .ID }} is {{ .Level }} value: {{ index .Fields &quot;value&quot; }}"
        value={rule.message}
        spellCheck={false}
      />
      {rule.message ? (
        <div className="query-editor--status">
          <span className={`query-status-output ${outputStatusClass}`}>
            <span className={`icon ${iconName}`} />
            {validationCopy}
          </span>
        </div>
      ) : null}
    </div>
  )
}

export default RuleMessageText
