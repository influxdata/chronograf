// Libraries
import React, {useMemo} from 'react'
import {connect} from 'react-redux'
import copyToClipboard from 'copy-to-clipboard'

import BuilderCard from './BuilderCard'
import BucketsSelector from './BucketsSelector'
import FancyScrollbar from '../../FancyScrollbar'
import {
  Button,
  ButtonShape,
  ComponentSize,
  ComponentStatus,
  IconFont,
} from 'src/reusable_ui'
import AggregationSelector from './AggregationSelector'
import TagSelector from './TagSelector'
import {notify as notifyActionCreator} from 'src/shared/actions/notifications'
import {
  notifyCopyToClipboardFailed,
  notifyCopyToClipboardSuccess,
} from 'src/shared/copy/notifications'
import {QueryBuilderState, TimeMachineQueryProps} from './types'
import {addTagSelectorThunk} from './actions/thunks'
import timeRangeWindowPeriod from './util/timeRangeWindowPeriod'
import {RemoteDataState, TimeZones} from 'src/types'
import {buildQuery} from './util/generateFlux'
import {timeRangeLabel} from '../../TimeRangeLabel'
import FluxQueryBuilderSubmit from './FluxQueryBuilderSubmit'

interface OwnProps extends TimeMachineQueryProps {
  onSubmit: (script: string) => void
  onShowEditor: () => void
  script: string
}

type Props = OwnProps & typeof mdtp & ReturnType<typeof mstp>

const FluxQueryBuilder = ({
  source,
  timeRange,
  tags,
  isRunnable,
  builderState,
  timeZone,
  notify,
  onSubmit,
  onShowEditor,
  onAddTagSelector,
  script: editorScript,
}: Props) => {
  const [defaultPeriod, timeRangeText] = useMemo(
    () => [
      timeRangeWindowPeriod(timeRange),
      timeRangeLabel({timeRange, timeZone}),
    ],
    [timeRange, timeZone]
  )

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
                timeRangeText={timeRangeText}
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
              text="Script Editor"
              titleText="Switch to Flux Script Editor"
            />
            <Button
              shape={ButtonShape.Square}
              size={ComponentSize.ExtraSmall}
              titleText="Copy builder script to clipboard"
              icon={IconFont.Duplicate}
              status={
                isRunnable ? ComponentStatus.Default : ComponentStatus.Disabled
              }
              onClick={e => {
                let success = false
                try {
                  const script = buildQuery(builderState)
                  success = !!script && copyToClipboard(script)
                } catch (ex) {
                  console.error('Build query failed', ex)
                }

                notify(
                  success
                    ? notifyCopyToClipboardSuccess(
                        null,
                        'Builder script has been copied to clipboard.',
                        ''
                      )
                    : notifyCopyToClipboardFailed(
                        null,
                        'Builder script was not copied to clipboard.',
                        ''
                      )
                )
                e.stopPropagation()
                e.preventDefault()
              }}
            />
            <FluxQueryBuilderSubmit
              isRunnable={isRunnable}
              builderState={builderState}
              editorScript={editorScript}
              notify={notify}
              onSubmit={onSubmit}
            />
          </div>
        </AggregationSelector>
      </div>
    </div>
  )
}
const mstp = (state: any) => {
  const fluxQueryBuilder = state?.fluxQueryBuilder as QueryBuilderState
  const timeZone = state?.app?.persisted?.timeZone as TimeZones
  return {
    builderState: fluxQueryBuilder,
    tags: fluxQueryBuilder.tags,
    timeZone,
    isRunnable:
      fluxQueryBuilder.buckets.status === RemoteDataState.Done &&
      !!fluxQueryBuilder.buckets.selectedBucket,
  }
}
const mdtp = {
  onAddTagSelector: addTagSelectorThunk,
  notify: notifyActionCreator,
}

export default connect(mstp, mdtp)(FluxQueryBuilder)
