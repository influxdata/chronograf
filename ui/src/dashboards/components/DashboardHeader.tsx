// Libraries
import React, {Component} from 'react'

// Components
import PageHeader from 'src/reusable_ui/components/page_layout/PageHeader'
import PageHeaderTitle from 'src/reusable_ui/components/page_layout/PageHeaderTitle'
import AutoRefreshDropdown from 'src/shared/components/dropdown_auto_refresh/AutoRefreshDropdown'
import TimeRangeDropdown from 'src/shared/components/TimeRangeDropdown'
import GraphTips from 'src/shared/components/GraphTips'
import RenameDashboard from 'src/dashboards/components/rename_dashboard/RenameDashboard'
import DashboardSwitcher from 'src/dashboards/components/DashboardSwitcher'
import Authorized, {EDITOR_ROLE} from 'src/auth/Authorized'
import {Button, ComponentColor, ButtonShape, IconFont} from 'src/reusable_ui'

// Types
import * as AppActions from 'src/types/actions/app'
import * as DashboardsModels from 'src/types/dashboards'
import * as QueriesModels from 'src/types/queries'

import {ErrorHandling} from 'src/shared/decorators/errors'

interface State {
  selected: QueriesModels.TimeRange
}

interface Props {
  activeDashboard: string
  dashboard: DashboardsModels.Dashboard
  timeRange: QueriesModels.TimeRange
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
    const {isHidden} = this.props

    return (
      <PageHeader
        fullWidth={true}
        sourceIndicator={true}
        titleComponents={this.renderPageTitle}
        optionsComponents={this.optionsComponents}
        inPresentationMode={isHidden}
      />
    )
  }

  private get renderPageTitle(): JSX.Element {
    return (
      <>
        {this.dashboardSwitcher}
        {this.dashboardTitle}
      </>
    )
  }

  private get optionsComponents(): JSX.Element {
    const {handleChooseAutoRefresh, onManualRefresh, autoRefresh} = this.props

    const {selected} = this.state

    return (
      <>
        <GraphTips />
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
        />
      </>
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
      return (
        <>
          <Button
            text="Variables"
            icon={IconFont.Cube}
            onClick={onToggleShowTempVarControls}
            active={showTempVarControls}
          />
          <Button
            text="Annotations"
            icon={IconFont.Annotate}
            onClick={onToggleShowAnnotationControls}
            active={showAnnotationControls}
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
          replaceWithIfNotAuthorized={
            <PageHeaderTitle title={activeDashboard} />
          }
        >
          <RenameDashboard
            onRename={onRenameDashboard}
            name={activeDashboard}
          />
        </Authorized>
      )
    }

    return <PageHeaderTitle title={activeDashboard} />
  }
}

export default DashboardHeader
