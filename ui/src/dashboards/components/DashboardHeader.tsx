// Libraries
import React, {Component} from 'react'

// Components
import AutoRefreshDropdown from 'src/shared/components/dropdown_auto_refresh/AutoRefreshDropdown'
import TimeRangeDropdown from 'src/shared/components/TimeRangeDropdown'
import GraphTips from 'src/shared/components/GraphTips'
import RenameDashboard from 'src/dashboards/components/rename_dashboard/RenameDashboard'
import DashboardSwitcher from 'src/dashboards/components/DashboardSwitcher'
import Authorized, {EDITOR_ROLE} from 'src/auth/Authorized'
import {
  Button,
  ComponentColor,
  ButtonShape,
  IconFont,
  Page,
} from 'src/reusable_ui'

// Types
import * as AppActions from 'src/types/actions/app'
import * as DashboardsModels from 'src/types/dashboards'
import * as QueriesModels from 'src/types/queries'
import {TimeZones} from 'src/types'
import {setTimeZone} from 'src/shared/actions/app'

import {ErrorHandling} from 'src/shared/decorators/errors'
import TimeZoneToggle from 'src/shared/components/time_zones/TimeZoneToggle'

interface State {
  selected: QueriesModels.TimeRange
}

interface Props {
  activeDashboard: string
  dashboard: DashboardsModels.Dashboard
  timeRange: QueriesModels.TimeRange
  timeZone: TimeZones
  onSetTimeZone: typeof setTimeZone
  autoRefresh: number
  handleChooseTimeRange: (timeRange: QueriesModels.TimeRange) => void
  handleChooseAutoRefresh: AppActions.SetAutoRefreshActionCreator
  onManualRefresh: () => void
  handleClickPresentationButton: AppActions.DelayEnablePresentationModeDispatcher
  onAddCell: () => void
  showTempVarControls?: boolean
  onToggleShowTempVarControls?: () => void
  showAnnotationControls: boolean
  onToggleShowAnnotationControls?: () => void
  zoomedTimeRange: QueriesModels.TimeRange
  onRenameDashboard: (name: string) => Promise<void>
  dashboardLinks: DashboardsModels.DashboardSwitcherLinks
  isHidden: boolean
}

@ErrorHandling
class DashboardHeader extends Component<Props, State> {
  public static defaultProps: Partial<Props> = {
    zoomedTimeRange: {
      upper: null,
      lower: null,
    },
  }

  public static getDerivedStateFromProps(props: Props): Partial<State> {
    const {upper, lower} = props.zoomedTimeRange

    if (upper || lower) {
      return {selected: {upper, lower}}
    }

    if (!props.zoomedTimeRange.lower) {
      return {
        selected: {
          upper: props.timeRange.upper,
          lower: props.timeRange.lower,
        },
      }
    }

    return {}
  }

  constructor(props: Props) {
    super(props)

    const {timeRange, zoomedTimeRange} = props

    this.state = {
      selected: {
        upper: timeRange.upper || zoomedTimeRange.upper,
        lower: timeRange.lower || zoomedTimeRange.lower,
      },
    }
  }

  public render() {
    const {
      isHidden,
      timeZone,
      autoRefresh,
      onSetTimeZone,
      onManualRefresh,
      handleChooseAutoRefresh,
    } = this.props
    const {selected} = this.state

    return (
      <Page.Header fullWidth={true} inPresentationMode={isHidden}>
        <Page.Header.Left>
          {this.dashboardSwitcher}
          {this.dashboardTitle}
        </Page.Header.Left>
        <Page.Header.Right showSourceIndicator={true}>
          <GraphTips />
          <TimeZoneToggle timeZone={timeZone} onSetTimeZone={onSetTimeZone} />
          {this.addCellButton}
          {this.toolButtons}
          <AutoRefreshDropdown
            onChoose={handleChooseAutoRefresh}
            onManualRefresh={onManualRefresh}
            selected={autoRefresh}
          />
          <TimeRangeDropdown
            onChooseTimeRange={this.handleChooseTimeRange}
            selected={selected}
          />
          <Button
            icon={IconFont.ExpandA}
            onClick={this.handleClickPresentationButton}
            shape={ButtonShape.Square}
            titleText="Enter Full-Screen Presentation Mode"
          />
        </Page.Header.Right>
      </Page.Header>
    )
  }

  private handleChooseTimeRange = (
    timeRange: QueriesModels.TimeRange
  ): void => {
    this.setState({selected: timeRange}, () => {
      window.setTimeout(() => {
        this.props.handleChooseTimeRange(timeRange)
      }, 0)
    })
  }

  private handleClickPresentationButton = (): void => {
    this.props.handleClickPresentationButton()
  }

  private get addCellButton(): JSX.Element {
    const {dashboard, onAddCell} = this.props

    if (dashboard) {
      return (
        <Authorized requiredRole={EDITOR_ROLE}>
          <Button
            shape={ButtonShape.Square}
            color={ComponentColor.Primary}
            icon={IconFont.AddCell}
            onClick={onAddCell}
            titleText="Add a Cell to Dashboard"
          />
        </Authorized>
      )
    }
  }

  private get toolButtons(): JSX.Element {
    const {
      dashboard,
      showTempVarControls,
      onToggleShowTempVarControls,
      showAnnotationControls,
      onToggleShowAnnotationControls,
    } = this.props

    if (dashboard) {
      let variablesTooltip = 'Show Template Variables Controls'
      let annotationsTooltip = 'Show Annotations Controls'

      if (showTempVarControls) {
        variablesTooltip = 'Hide Template Variables Controls'
      }

      if (showAnnotationControls) {
        annotationsTooltip = 'Hide Annotations Controls'
      }

      return (
        <>
          <Button
            text="Variables"
            icon={IconFont.Cube}
            onClick={onToggleShowTempVarControls}
            active={showTempVarControls}
            titleText={variablesTooltip}
          />
          <Button
            text="Annotations"
            icon={IconFont.Annotate}
            onClick={onToggleShowAnnotationControls}
            active={showAnnotationControls}
            titleText={annotationsTooltip}
          />
        </>
      )
    }
  }

  private get dashboardSwitcher(): JSX.Element {
    const {dashboardLinks} = this.props

    if (dashboardLinks.links.length > 1) {
      return <DashboardSwitcher dashboardLinks={dashboardLinks} />
    }
  }

  private get dashboardTitle(): JSX.Element {
    const {dashboard, activeDashboard, onRenameDashboard} = this.props

    if (dashboard) {
      return (
        <Authorized
          requiredRole={EDITOR_ROLE}
          replaceWithIfNotAuthorized={<Page.Title title={activeDashboard} />}
        >
          <RenameDashboard
            onRename={onRenameDashboard}
            name={activeDashboard}
          />
        </Authorized>
      )
    }

    return <Page.Title title={activeDashboard} />
  }
}

export default DashboardHeader
