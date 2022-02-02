// Libraries
import React, {useMemo} from 'react'
import {connect} from 'react-redux'

import BuilderCard from './BuilderCard'
import BucketsSelector from './BucketsSelector'
import FancyScrollbar from '../../FancyScrollbar'
import {
  Button,
  ButtonShape,
  ComponentColor,
  ComponentSize,
  IconFont,
} from 'src/reusable_ui'
import AggregationSelector from './AggregationSelector'
import TagSelector from './TagSelector'
import {TagSelectorState, TimeMachineQueryProps} from './types'
import {addTagSelectorThunk} from './actions/thunks'
import timeRangeWindowPeriod from './util/timeRangeWindowPeriod'

interface OwnProps extends TimeMachineQueryProps {
  onSubmit: () => void
  onShowEditor: () => void
}

type Props = OwnProps & typeof mdtp & ReturnType<typeof mstp>

const FluxQueryBuilder = ({
  source,
  timeRange,
  tags,
  onSubmit,
  onShowEditor,
  onAddTagSelector,
}: Props) => {
  const defaultPeriod = useMemo(() => timeRangeWindowPeriod(timeRange), [
    timeRange,
  ])

  return (
    <div className="flux-query-builder" data-testid="flux-query-builder">
      <div className="flux-query-builder--cards">
        <FancyScrollbar>
          <div className="builder-card--list">
            <BuilderCard testID="bucket-selector">
              <BuilderCard.Header title="From" />
              <BucketsSelector source={source} timeRange={timeRange} />
            </BuilderCard>
            {tags.map(tag => (
              <TagSelector
                source={source}
                timeRange={timeRange}
                key={tag.tagIndex}
                tagIndex={tag.tagIndex}
              />
            ))}
            <Button
              size={ComponentSize.Large}
              customClass="flux-query-builder--add-card-button"
              icon={IconFont.PlusSkinny}
              onClick={() => {
                onAddTagSelector(source, timeRange)
              }}
              shape={ButtonShape.Square}
            />
          </div>
        </FancyScrollbar>
        <AggregationSelector defaultPeriod={defaultPeriod}>
          <div className="flux-query-builder--actions">
            <Button
              size={ComponentSize.ExtraSmall}
              onClick={onShowEditor}
              text="Query Editor"
              titleText="Switch to Flux Query Editor"
            />
            <Button
              size={ComponentSize.ExtraSmall}
              color={ComponentColor.Primary}
              onClick={onSubmit}
              text="Run"
            />
          </div>
        </AggregationSelector>
      </div>
    </div>
  )
}
const mstp = (state: any) => {
  return {
    tags: state?.fluxQueryBuilder?.tags as TagSelectorState[],
  }
}
const mdtp = {
  onAddTagSelector: addTagSelectorThunk,
}

export default connect(mstp, mdtp)(FluxQueryBuilder)
