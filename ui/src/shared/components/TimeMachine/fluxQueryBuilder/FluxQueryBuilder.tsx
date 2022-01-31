// Libraries
import React, {useMemo, useState} from 'react'
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
import {fluxPeriodFromRangeSeconds} from 'src/tempVars/utils/replace'
import moment from 'moment'
import {TimeMachineQueryProps} from './types'
import {addTagSelectorThunk} from './actions/thunks'

interface OwnProps extends TimeMachineQueryProps {
  onSubmit: () => void
  onShowEditor: () => void
}

type Props = OwnProps & typeof mdtp
const FluxQueryBuilder = ({
  source,
  timeRange,
  onSubmit,
  onShowEditor,
}: Props) => {
  const defaultPeriod = useMemo(() => {
    if (timeRange) {
      if (timeRange.seconds) {
        return fluxPeriodFromRangeSeconds(timeRange.seconds)
      }
      // calculate from upper / lower
      const seconds = Math.round(
        moment(timeRange.upper).diff(moment(timeRange.lower)) / 1000
      )
      return fluxPeriodFromRangeSeconds(seconds)
    }
  }, [timeRange])

  // TODO demo selectors are to be replaced by a real implementation
  const [tagSelectors, setTagSelectors] = useState(1)
  const [activeTagSelectors, setActiveTagSelectors] = useState([0])

  return (
    <div className="flux-query-builder" data-testid="flux-query-builder">
      <div className="flux-query-builder--cards">
        <FancyScrollbar>
          <div className="builder-card--list">
            <BuilderCard testID="bucket-selector">
              <BuilderCard.Header title="From" />
              <BucketsSelector source={source} timeRange={timeRange} />
            </BuilderCard>
            {activeTagSelectors.map(i => (
              <TagSelector
                key={i}
                tagIndex={i}
                onRemoveTagSelector={ix =>
                  setActiveTagSelectors(
                    activeTagSelectors.filter(x => x !== ix)
                  )
                }
              />
            ))}
            <Button
              size={ComponentSize.Large}
              customClass="flux-query-builder--add-card-button"
              icon={IconFont.PlusSkinny}
              onClick={() => {
                setActiveTagSelectors([...activeTagSelectors, tagSelectors])
                setTagSelectors(tagSelectors + 1)
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
              text="Submit"
            />
          </div>
        </AggregationSelector>
      </div>
    </div>
  )
}
const mdtp = {
  onAddTagSelector: addTagSelectorThunk,
}

export default connect(null, mdtp)(FluxQueryBuilder)
