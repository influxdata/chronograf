import * as React from 'react'
import {connect} from 'react-redux'
import {bindActionCreators, compose} from 'redux'
import {Router, withRouter} from 'react-router-dom'
import * as queryString from 'query-string'
import * as _ from 'lodash'

import QueryMaker from '../components/QueryMaker'
import Visualization from '../components/Visualization'
import WriteDataForm from 'data_explorer/components/WriteDataForm'
import Header from '../containers/Header'
import ResizeContainer from 'shared/components/ResizeContainer'
import OverlayTechnologies from 'shared/components/OverlayTechnologies'

import {VIS_VIEWS, INITIAL_GROUP_BY_TIME} from 'shared/constants'
import {MINIMUM_HEIGHTS, INITIAL_HEIGHTS} from '../constants'
import {errorThrown} from 'shared/actions/errors'
import {setAutoRefresh} from 'shared/actions/app'
import * as dataExplorerActions from 'data_explorer/actions/view'
import {writeLineProtocolAsync} from 'data_explorer/actions/view/write'
import {buildRawText} from 'utils/influxql'

import {
  AutoRefresh,
  QueryConfig,
  Source,
  TimeRange,
  ManualRefresh as ManualRefreshType,
  RouterRuleID,
} from 'src/types'
import {eFunc, func} from 'src/types/funcs'

export interface QueryConfigActions {
  chooseNamespace: typeof dataExplorerActions.chooseNamespace
  chooseMeasurement: typeof dataExplorerActions.chooseMeasurement
  chooseTag: typeof dataExplorerActions.chooseTag
  groupByTag: typeof dataExplorerActions.groupByTag
  toggleField: typeof dataExplorerActions.toggleField
  groupByTime: typeof dataExplorerActions.groupByTime
  toggleTagAcceptance: typeof dataExplorerActions.toggleTagAcceptance
  applyFuncsToField: typeof dataExplorerActions.applyFuncsToField
  editRawTextAsync: typeof dataExplorerActions.editRawTextAsync
  addInitialField: typeof dataExplorerActions.addInitialField
  addQuery: typeof dataExplorerActions.addQuery
  editQueryStatus: typeof dataExplorerActions.editQueryStatus
  editRawText: typeof dataExplorerActions.editRawText
  fill: typeof dataExplorerActions.fill
  removeFuncs: typeof dataExplorerActions.removeFuncs
}

export interface DataExplorerProps {
  source: Source
  router: Router
  queryConfigs: QueryConfig[]
  queryConfigActions: QueryConfigActions
  autoRefresh: AutoRefresh
  handleChooseAutoRefresh: eFunc
  timeRange: TimeRange
  setTimeRange: eFunc
  dataExplorer: {
    queryIDs: string[]
  }
  writeLineProtocol: eFunc
  errorThrownAction: eFunc
  onManualRefresh: func
  manualRefresh: ManualRefreshType
}

export interface DataExplorerState {
  showWriteForm: boolean
}

class DataExplorer extends React.Component<DataExplorerProps & RouterRuleID> {
  public state = {
    showWriteForm: false,
  }

  public getActiveQuery = () => {
    const {queryConfigs} = this.props
    if (queryConfigs.length === 0) {
      this.props.queryConfigActions.addQuery()
    }

    return queryConfigs[0]
  }

  public handleCloseWriteData = () => {
    this.setState({showWriteForm: false})
  }

  public handleOpenWriteData = () => {
    this.setState({showWriteForm: true})
  }

  public handleChooseTimeRange = bounds => {
    this.props.setTimeRange(bounds)
  }

  public componentDidMount() {
    const {location} = this.props
    const {query} = queryString.parse(location.search)
    if (query && query.length) {
      const qc = this.props.queryConfigs[0]
      this.props.queryConfigActions.editRawText(qc.id, query)
    }
  }

  public componentWillReceiveProps(nextProps: DataExplorerProps) {
    const {location, history} = this.props
    const {queryConfigs, timeRange} = nextProps
    const query = buildRawText(_.get(queryConfigs, ['0'], ''), timeRange)
    const qsCurrent = queryString.parse(location.search)
    if (query.length && qsCurrent.query !== query) {
      const qsNew = queryString.stringify({query})
      history.push(`${location.pathname}?${qsNew}`)
    }
  }

  public render() {
    const {
      source,
      timeRange,
      autoRefresh,
      queryConfigs,
      manualRefresh,
      onManualRefresh,
      errorThrownAction,
      writeLineProtocol,
      queryConfigActions,
      handleChooseAutoRefresh,
    } = this.props

    const {showWriteForm} = this.state
    const selectedDatabase = _.get(queryConfigs, ['0', 'database'], null)

    return (
      <div className="data-explorer">
        {showWriteForm && (
          <OverlayTechnologies>
            <WriteDataForm
              source={source}
              errorThrown={errorThrownAction}
              selectedDatabase={selectedDatabase}
              onClose={this.handleCloseWriteData}
              writeLineProtocol={writeLineProtocol}
            />
          </OverlayTechnologies>
        )}
        <Header
          source={source}
          timeRange={timeRange}
          autoRefresh={autoRefresh}
          showWriteForm={this.handleOpenWriteData}
          onChooseTimeRange={this.handleChooseTimeRange}
          onChooseAutoRefresh={handleChooseAutoRefresh}
          onManualRefresh={onManualRefresh}
        />
        <ResizeContainer
          containerClass="page-contents"
          minTopHeight={MINIMUM_HEIGHTS.queryMaker}
          minBottomHeight={MINIMUM_HEIGHTS.visualization}
          initialTopHeight={INITIAL_HEIGHTS.queryMaker}
          initialBottomHeight={INITIAL_HEIGHTS.visualization}
        >
          <QueryMaker
            source={source}
            actions={queryConfigActions}
            timeRange={timeRange}
            activeQuery={this.getActiveQuery()}
            initialGroupByTime={INITIAL_GROUP_BY_TIME}
          />
          <Visualization
            source={source}
            views={VIS_VIEWS}
            activeQueryIndex={0}
            timeRange={timeRange}
            autoRefresh={autoRefresh}
            queryConfigs={queryConfigs}
            manualRefresh={manualRefresh}
            errorThrown={errorThrownAction}
            editQueryStatus={queryConfigActions.editQueryStatus}
          />
        </ResizeContainer>
      </div>
    )
  }
}

const mapStateToProps = state => {
  const {
    app: {persisted: {autoRefresh}},
    dataExplorer,
    dataExplorerQueryConfigs: queryConfigs,
    timeRange,
  } = state
  const queryConfigValues = _.values(queryConfigs)

  return {
    autoRefresh,
    dataExplorer,
    queryConfigs: queryConfigValues,
    timeRange,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    handleChooseAutoRefresh: bindActionCreators(setAutoRefresh, dispatch),
    errorThrownAction: bindActionCreators(errorThrown, dispatch),
    setTimeRange: bindActionCreators(
      dataExplorerActions.setTimeRange,
      dispatch
    ),
    writeLineProtocol: bindActionCreators(writeLineProtocolAsync, dispatch),
    queryConfigActions: bindActionCreators(dataExplorerActions, dispatch),
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(DataExplorer)
