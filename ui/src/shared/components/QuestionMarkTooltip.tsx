import React, {FunctionComponent} from 'react'
import ReactTooltip from 'react-tooltip'

interface Props {
  tipID: string
  tipContent: string
}

const QuestionMarkTooltip: FunctionComponent<Props> = ({tipID, tipContent}) => (
  <div className="question-mark-tooltip">
    <div
      className="question-mark-tooltip--icon"
      data-for={`${tipID}-tooltip`}
      data-tip={tipContent}
      data-delay-hide="100"
      data-delay-show="50"
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
