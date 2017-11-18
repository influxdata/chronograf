import * as React from 'react'
import * as ReactTooltip from 'react-tooltip'

export interface QuestionMarkTooltipProps {
  tipID: string
  tipContent: string
}

const QuestionMarkTooltip: React.SFC<QuestionMarkTooltipProps> = ({
  tipID,
  tipContent,
}) => (
  <div className="question-mark-tooltip">
    <div
      className="question-mark-tooltip--icon"
      data-for={`${tipID}-tooltip`}
      data-tip={tipContent}
    >
      ?
    </div>
    <ReactTooltip
      id={`${tipID}-tooltip`}
      effect="solid"
      html={true}
      place="bottom"
      class="influx-tooltip"
    />
  </div>
)

export default QuestionMarkTooltip
