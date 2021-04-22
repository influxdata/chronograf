// Libraries
import React, {PureComponent} from 'react'
import _ from 'lodash'

// Utils
import {getNewDashboardCell} from 'src/dashboards/utils/cellGetters'
import {getCellTypeColors} from 'src/dashboards/constants/cellEditor'
import {
  TimeMachineContainer,
  TimeMachineContextConsumer,
} from 'src/shared/utils/TimeMachineContext'
import {buildRawText} from 'src/utils/influxql'

// Components
import {
  OverlayContainer,
  OverlayHeading,
  OverlayBody,
  MultiSelectDropdown,
  Form,
  Button,
  ComponentColor,
  ComponentStatus,
  Input,
} from 'src/reusable_ui'

// Constants
import {STATIC_LEGEND} from 'src/dashboards/constants/cellEditor'
import {NEW_EMPTY_DASHBOARD} from 'src/dashboards/constants'
import {
  notifyCellSent,
  notifyCellSendFailed,
} from 'src/shared/copy/notifications'

// APIs
import {createDashboard} from 'src/dashboards/apis'

// Types
import {
  QueryConfig,
  CellQuery,
  TimeRange,
  Dashboard,
  Source,
  Cell,
  QueryType,
  Notification,
} from 'src/types'
import {VisualizationOptions} from 'src/types/dataExplorer'
import {ColorString} from 'src/types/colors'

interface PassedProps {
  dashboards: Dashboard[]
  source: Source
  onCancel: () => void
  sendDashboardCell: (
    dashboard: Dashboard,
    newCell: Partial<Cell>
  ) => Promise<{success: boolean; dashboard: Dashboard}>
  isStaticLegend: boolean
  handleGetDashboards: () => Dashboard[]
  notify: (message: Notification) => void
  activeQueryIndex: number
}

interface ConnectedProps {
  queryType: QueryType
  queryDrafts: CellQuery[]
  timeRange: TimeRange
  visualizationOptions: VisualizationOptions
  script: string // flux script
}

type Props = PassedProps & ConnectedProps

interface State {
  selectedIDs: string[]
  name: string
  newDashboardName: string
}

const NEW_DASHBOARD_ID = 'new'

class SendToDashboardOverlay extends PureComponent<Props, State> {
  constructor(props) {
    super(props)

    this.state = {
      selectedIDs: [],
      name: '',
      newDashboardName: '',
    }
  }
  public async componentDidMount() {
    const {handleGetDashboards} = this.props
    await handleGetDashboards()
  }

  public handleChangeName = e => {
    const name = e.target.value
    this.setState({name})
  }

  public handleChangeNewDashboardName = e => {
    const newDashboardName = e.target.value
    this.setState({newDashboardName})
  }

  public render() {
    const {onCancel} = this.props
    const {name, selectedIDs, newDashboardName} = this.state

    const numberDashboards = selectedIDs.length > 1 ? selectedIDs.length : ''
    const pluralizer = selectedIDs.length > 1 ? 's' : ''

    return (
      <OverlayContainer>
        <OverlayHeading title="Send to Dashboard" onDismiss={onCancel} />
        <OverlayBody>
          {this.hasQuery() ? (
            <Form>
              <Form.Element label="Target Dashboard(s)">
                <MultiSelectDropdown
                  onChange={this.handleSelect}
                  selectedIDs={this.state.selectedIDs}
                  emptyText="Choose at least 1 dashboard"
                >
                  {this.dropdownItems}
                </MultiSelectDropdown>
              </Form.Element>
              {this.isNewDashboardSelected && (
                <Form.Element label="Name new dashboard">
                  <Input
                    value={newDashboardName}
                    onChange={this.handleChangeNewDashboardName}
                    placeholder={'Name new dashboard'}
                  />
                </Form.Element>
              )}
              <Form.Element label="Cell Name">
                <Input
                  value={name}
                  onChange={this.handleChangeName}
                  placeholder={'Name this new cell'}
                />
              </Form.Element>
              <Form.Footer>
                <Button
                  color={ComponentColor.Success}
                  text={`Send to ${numberDashboards} Dashboard${pluralizer}`}
                  titleText="Must choose at least 1 dashboard and set a name"
                  status={this.submitButtonStatus}
                  onClick={this.sendToDashboard}
                />
                <Button text="Cancel" onClick={onCancel} />
              </Form.Footer>
            </Form>
          ) : (
            <Form>
              <Form.Element>
                <div className="text-center">
                  No
                  {this.props.queryType === QueryType.Flux
                    ? ' script '
                    : ' query '}
                  specified!
                </div>
              </Form.Element>
              <Form.Footer>
                <Button text="Back" onClick={onCancel} />
              </Form.Footer>
            </Form>
          )}
        </OverlayBody>
      </OverlayContainer>
    )
  }

  private get dropdownItems(): JSX.Element[] {
    const {dashboards} = this.props
    const {newDashboardName} = this.state

    const simpleArray = _.sortBy(
      dashboards.map(d => ({
        id: d.id.toString(),
        name: d.name,
      })),
      element => {
        return element.name.toLowerCase()
      }
    )

    const items = simpleArray.map(dashboard => {
      return (
        <MultiSelectDropdown.Item
          key={dashboard.id}
          id={dashboard.id}
          value={dashboard}
        >
          {dashboard.name}
        </MultiSelectDropdown.Item>
      )
    })

    const newDashboardItem = (
      <MultiSelectDropdown.Item
        key={NEW_DASHBOARD_ID}
        id={NEW_DASHBOARD_ID}
        value={{
          id: NEW_DASHBOARD_ID,
          name: newDashboardName,
        }}
      >
        Send to a New Dashboard
      </MultiSelectDropdown.Item>
    )

    const divider = (
      <MultiSelectDropdown.Divider key={'divider'} id={'divider'} />
    )

    return [newDashboardItem, divider, ...items]
  }

  private get isNewDashboardSelected(): boolean {
    return this.state.selectedIDs.includes(NEW_DASHBOARD_ID)
  }

  private get activeQueryConfig(): QueryConfig {
    const {queryDrafts, activeQueryIndex} = this.props
    if (queryDrafts === undefined || queryDrafts.length === 0) {
      return undefined
    }
    if (activeQueryIndex < queryDrafts.length) {
      return queryDrafts[activeQueryIndex].queryConfig
    }
    return queryDrafts[0].queryConfig
  }

  private rawText = (queryConfig: QueryConfig | undefined): string => {
    const {timeRange} = this.props

    if (queryConfig) {
      return buildRawText(queryConfig, timeRange)
    }

    return ''
  }

  private hasQuery(): boolean {
    const {script, queryType} = this.props
    if (queryType === QueryType.Flux) {
      return script && !!script.trim()
    }
    const rawText = this.rawText(this.activeQueryConfig)
    return rawText && !!rawText.trim()
  }

  private get selectedDashboards(): Dashboard[] {
    const {dashboards} = this.props
    const {selectedIDs} = this.state

    return dashboards.filter(d => {
      return selectedIDs.includes(d.id.toString())
    })
  }

  private get submitButtonStatus(): ComponentStatus {
    const {name, selectedIDs} = this.state

    if (selectedIDs.length === 0 || name.trim().length === 0) {
      return ComponentStatus.Disabled
    }

    return ComponentStatus.Default
  }

  private handleSelect = async (selectedIDs: string[]) => {
    this.setState({selectedIDs})
  }

  private notifyResolutions = (
    resolved: Array<{success: boolean; dashboard: Dashboard}>,
    cellName: string
  ) => {
    const {notify} = this.props
    const failures = resolved.filter(r => r.success === false)
    if (failures.length === 0) {
      notify(notifyCellSent(cellName, resolved.length))
      return
    }
    failures.forEach(f => {
      notify(notifyCellSendFailed(cellName, f.dashboard.name))
    })
  }

  private sendToDashboard = async () => {
    const {name, newDashboardName} = this.state
    const {
      queryType,
      script,
      sendDashboardCell,
      source,
      onCancel,
      visualizationOptions,
      isStaticLegend,
    } = this.props
    const {
      type,
      gaugeColors,
      thresholdsListColors,
      lineColors,
      axes,
      decimalPlaces,
      timeFormat,
      note,
      noteVisibility,
      fieldOptions,
    } = visualizationOptions

    const isFluxQuery = queryType === QueryType.Flux

    let newCellQueries: CellQuery[]

    if (isFluxQuery) {
      newCellQueries = [
        {
          queryConfig: null,
          query: script,
          source: source.links.self,
          type: QueryType.Flux,
        },
      ]
    } else {
      const queryConfig = this.activeQueryConfig
      const rawText = this.rawText(queryConfig)
      newCellQueries = [
        {
          queryConfig,
          query: rawText,
          source: source.links.self,
          type: QueryType.InfluxQL,
        },
      ]
    }

    const colors: ColorString[] = getCellTypeColors({
      cellType: type,
      gaugeColors,
      thresholdsListColors,
      lineColors,
    })

    const legend = isStaticLegend ? STATIC_LEGEND : {}

    let selectedDashboards = this.selectedDashboards

    if (this.isNewDashboardSelected) {
      let result

      if (newDashboardName === '') {
        result = await createDashboard(NEW_EMPTY_DASHBOARD)
      } else {
        result = await createDashboard({
          ...NEW_EMPTY_DASHBOARD,
          name: newDashboardName,
        })
      }

      const newDashboard: Dashboard = result.data
      selectedDashboards = [...selectedDashboards, newDashboard]
    }

    const resolved = await Promise.all(
      selectedDashboards.map(dashboard => {
        const emptyCell = getNewDashboardCell(dashboard)
        const newCell: Partial<Cell> = {
          ...emptyCell,
          name,
          queries: newCellQueries,
          type,
          axes,
          legend,
          colors,
          decimalPlaces,
          timeFormat,
          note,
          noteVisibility,
          fieldOptions,
        }
        return sendDashboardCell(dashboard, newCell)
      })
    )
    this.notifyResolutions(resolved, name)
    onCancel()
  }
}

const ConnectedSendToDashboardOverlay = (props: PassedProps) => {
  return (
    <TimeMachineContextConsumer>
      {(timeMachineContainer: TimeMachineContainer) => {
        const {
          type,
          tableOptions,
          fieldOptions,
          timeFormat,
          decimalPlaces,
          note,
          noteVisibility,
          axes,
          thresholdsListColors,
          thresholdsListType,
          gaugeColors,
          lineColors,
          queryType,
          queryDrafts,
          timeRange,
          draftScript,
        } = timeMachineContainer.state

        const visualizationOptions = {
          type,
          axes,
          tableOptions,
          fieldOptions,
          timeFormat,
          decimalPlaces,
          note,
          noteVisibility,
          thresholdsListColors,
          gaugeColors,
          lineColors,
          thresholdsListType,
        }

        return (
          <SendToDashboardOverlay
            {...props}
            queryType={queryType}
            queryDrafts={queryDrafts}
            timeRange={timeRange}
            script={draftScript}
            visualizationOptions={visualizationOptions}
          />
        )
      }}
    </TimeMachineContextConsumer>
  )
}

export default ConnectedSendToDashboardOverlay
