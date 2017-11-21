import * as React from 'react'
import * as classnames from 'classnames'

import AutoRefreshDropdown from 'shared/components/AutoRefreshDropdown'
import TimeRangeDropdown from 'shared/components/TimeRangeDropdown'
import SourceIndicator from 'shared/components/SourceIndicator'
import GraphTips from 'shared/components/GraphTips'
import DashboardHeaderEdit from 'dashboards/components/DashboardHeaderEdit'
import DashboardSwitcher from 'dashboards/components/DashboardSwitcher'

import {
  Dashboard,
  DashboardName,
  Source,
  TimeRange,
  ZoomedTimeRange,
} from 'src/types'
import {func} from 'src/types/funcs'

export interface DashboardHeaderProps {
  source: Source
  activeDashboard: string
  onEditDashboard?: func
  dashboard?: Dashboard
  timeRange: TimeRange
  autoRefresh: number
  isHidden: boolean
  isEditMode?: boolean
  handleChooseTimeRange: (timeRange: TimeRange) => void
  handleChooseAutoRefresh: func
  onManualRefresh: func
  handleClickPresentationButton: func
  onAddCell?: func
  onToggleTempVarControls?: func
  showTemplateControlBar?: boolean
  zoomedTimeRange?: ZoomedTimeRange
  onCancel?: func
  onSave?: (name: string) => void
  names: DashboardName[]
}

const DashboardHeader: React.SFC<DashboardHeaderProps> = ({
  source,
  names,
  onSave,
  onCancel,
  isEditMode,
  isHidden,
  dashboard,
  onAddCell,
  autoRefresh,
  activeDashboard,
  onEditDashboard,
  onManualRefresh,
  handleChooseTimeRange,
  handleChooseAutoRefresh,
  onToggleTempVarControls,
  showTemplateControlBar,
  timeRange: {upper, lower},
  handleClickPresentationButton,
  zoomedTimeRange = {zoomedLower: null, zoomedUpper: null},
}) =>
  !isHidden && (
    <div className="page-header full-width">
      <div className="page-header__container">
        <div
          className={
            dashboard
              ? 'page-header__left page-header__dash-editable'
              : 'page-header__left'
          }
        >
          {names &&
            names.length > 1 && (
              <DashboardSwitcher
                names={names}
                activeDashboard={activeDashboard}
              />
            )}
          {dashboard ? (
            <DashboardHeaderEdit
              onSave={onSave}
              onCancel={onCancel}
              activeDashboard={activeDashboard}
              onEditDashboard={onEditDashboard}
              isEditMode={isEditMode}
            />
          ) : (
            <h1 className="page-header__title">{activeDashboard}</h1>
          )}
        </div>
        <div className="page-header__right">
          <GraphTips />
          <SourceIndicator source={source} />
          {dashboard && (
            <button className="btn btn-primary btn-sm" onClick={onAddCell}>
              <span className="icon plus" />
              Add Cell
            </button>
          )}
          {dashboard ? (
            <div
              className={classnames('btn btn-default btn-sm', {
                active: showTemplateControlBar,
              })}
              onClick={onToggleTempVarControls}
            >
              <span className="icon cube" />Template Variables
            </div>
          ) : null}
          <AutoRefreshDropdown
            onChoose={handleChooseAutoRefresh}
            onManualRefresh={onManualRefresh}
            selected={autoRefresh}
          />
          <TimeRangeDropdown
            onChooseTimeRange={handleChooseTimeRange}
            selected={{
              upper: zoomedTimeRange.zoomedUpper || upper,
              lower: zoomedTimeRange.zoomedLower || lower,
            }}
          />
          <div
            className="btn btn-default btn-sm btn-square"
            onClick={handleClickPresentationButton}
          >
            <span className="icon expand-a" />
          </div>
        </div>
      </div>
    </div>
  )

export default DashboardHeader
