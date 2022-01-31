// Libraries
import React, {useMemo, useState} from 'react'

import BuilderCard from './BuilderCard'
import BucketsSelector from './BucketsSelector'
import FancyScrollbar from '../../FancyScrollbar'
import {Source, TimeRange} from 'src/types'
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

interface Props {
  source: Source
  timeRange: TimeRange
  onSubmit: () => void
  onShowEditor: () => void
}
const FluxQueryBuilder = ({
  source,
  onSubmit,
  onShowEditor,
  timeRange,
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
              <BucketsSelector source={source} />
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

export default FluxQueryBuilder
