import React, {FunctionComponent} from 'react'

import {RuleMessage} from 'src/types/kapacitor'

interface Props {
  onClickTemplate: () => void
  template: RuleMessage
}

const CodeData: FunctionComponent<Props> = ({onClickTemplate, template}) => (
  <code
    className="rule-builder--message-template"
    data-tip={template.text}
    onClick={onClickTemplate}
  >
    {template.label}
  </code>
)

export default CodeData
