// Libraries
import React, {FunctionComponent} from 'react'

import BuilderCard from './BuilderCard'

const AggregationSelector: FunctionComponent = () => {
  return (
    <BuilderCard className="aggregation-selector" testID="aggregation-selector">
      <BuilderCard.Header
        title="Window Period"
        className="aggregation-selector-header"
      />
      <BuilderCard.Body
        scrollable={false}
        addPadding={false}
        className="aggregation-selector-body"
      >
        <div>This is Aggregation Body</div>
      </BuilderCard.Body>
    </BuilderCard>
  )
}

export default AggregationSelector
