import * as React from 'react'
import {withRouter} from 'react-router-dom'

import AutoRefreshDropdown from 'shared/components/AutoRefreshDropdown'
import TimeRangeDropdown from 'shared/components/TimeRangeDropdown'
import SourceIndicator from 'shared/components/SourceIndicator'
import GraphTips from 'shared/components/GraphTips'

import {AutoRefresh, Source, TimeRange} from 'src/types'

export interface HeaderProps {
  source: Source
  timeRange: TimeRange
  autoRefresh: AutoRefresh
  showWriteForm: () => void
  onManualRefresh: () => void
  onChooseTimeRange: () => void
  onChooseAutoRefresh: () => void
}

const Header: React.SFC<HeaderProps> = ({
  source,
  timeRange,
  autoRefresh,
  showWriteForm,
  onManualRefresh,
  onChooseTimeRange,
  onChooseAutoRefresh,
}) => (
  <div className="page-header full-width">
    <div className="page-header__container">
      <div className="page-header__left">
        <h1 className="page-header__title">Data Explorer</h1>
      </div>
      <div className="page-header__right">
        <GraphTips />
        <SourceIndicator source={source} />
        <div
          className="btn btn-sm btn-default"
          onClick={showWriteForm}
          data-test="write-data-button"
        >
          <span className="icon pencil" />
          Write Data
        </div>
        <AutoRefreshDropdown
          iconName="refresh"
          selected={autoRefresh}
          onChoose={onChooseAutoRefresh}
          onManualRefresh={onManualRefresh}
        />
        <TimeRangeDropdown
          selected={timeRange}
          page="DataExplorer"
          onChooseTimeRange={onChooseTimeRange}
        />
      </div>
    </div>
  </div>
)

export default withRouter(Header)
