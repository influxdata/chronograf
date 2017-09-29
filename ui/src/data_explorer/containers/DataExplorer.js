import React, {PropTypes, Component} from 'react'
import {connect} from 'react-redux'
import {bindActionCreators} from 'redux'

import QueryMaker from '../components/QueryMaker'
import Visualization from '../components/Visualization'
import WriteDataForm from 'src/data_explorer/components/WriteDataForm'
import Header from '../containers/Header'
import ResizeContainer from 'shared/components/ResizeContainer'
import OverlayTechnologies from 'shared/components/OverlayTechnologies'

import {VIS_VIEWS} from 'shared/constants'
import {MINIMUM_HEIGHTS, INITIAL_HEIGHTS} from '../constants'
import {errorThrown} from 'shared/actions/errors'
import {setAutoRefresh} from 'shared/actions/app'
import * as dataExplorerActionCreators from 'src/data_explorer/actions/view'
import {writeLineProtocolAsync} from 'src/data_explorer/actions/view/write'

class DataExplorer extends Component {
  constructor(props) {
    super(props)

    this.state = {
      showWriteForm: false,
    }
  }

  handleCloseWriteData = () => {
    this.setState({showWriteForm: false})
  }

  handleOpenWriteData = () => {
    this.setState({showWriteForm: true})
  }

  render() {
    const {
      autoRefresh,
      errorThrownAction,
      handleChooseAutoRefresh,
      timeRange,
      setTimeRange,
      queryConfig,
      queryConfigActions,
      source,
      writeLineProtocol,
    } = this.props

    const {showWriteForm} = this.state
    const selectedDatabase = queryConfig.database || null

    return (
      <div className="data-explorer">
        {showWriteForm
          ? <OverlayTechnologies>
              <WriteDataForm
                source={source}
                errorThrown={errorThrownAction}
                selectedDatabase={selectedDatabase}
                onClose={this.handleCloseWriteData}
                writeLineProtocol={writeLineProtocol}
              />
            </OverlayTechnologies>
          : null}
        <Header
          timeRange={timeRange}
          autoRefresh={autoRefresh}
          actions={{handleChooseAutoRefresh, setTimeRange}}
          showWriteForm={this.handleOpenWriteData}
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
            queries={queryConfig}
            actions={queryConfigActions}
            autoRefresh={autoRefresh}
            timeRange={timeRange}
            setActiveQueryIndex={this.handleSetActiveQueryIndex}
            onDeleteQuery={this.handleDeleteQuery}
            onAddQuery={this.handleAddQuery}
            activeQuery={this.getActiveQuery()}
          />
          <Visualization
            isInDataExplorer={true}
            autoRefresh={autoRefresh}
            timeRange={timeRange}
            queryConfigs={queryConfig}
            errorThrown={errorThrownAction}
            editQueryStatus={queryConfigActions.editQueryStatus}
            views={VIS_VIEWS}
          />
        </ResizeContainer>
      </div>
    )
  }
}

const {func, number, shape, string} = PropTypes

DataExplorer.propTypes = {
  source: shape({
    links: shape({
      proxy: string.isRequired,
      self: string.isRequired,
      queries: string.isRequired,
    }).isRequired,
  }).isRequired,
  queryConfig: shape({}).isRequired,
  queryConfigActions: shape({
    editQueryStatus: func.isRequired,
  }).isRequired,
  autoRefresh: number.isRequired,
  handleChooseAutoRefresh: func.isRequired,
  timeRange: shape({
    upper: string,
    lower: string,
  }).isRequired,
  setTimeRange: func.isRequired,
  writeLineProtocol: func.isRequired,
  errorThrownAction: func.isRequired,
}

DataExplorer.childContextTypes = {
  source: shape({
    links: shape({
      proxy: string.isRequired,
      self: string.isRequired,
    }).isRequired,
  }).isRequired,
}

const mapStateToProps = ({
  app: {persisted: {autoRefresh}},
  dataExplorer,
  dataExplorerQueryConfig: queryConfig,
  timeRange,
}) => ({
  autoRefresh,
  dataExplorer,
  queryConfig,
  timeRange,
})

const mapDispatchToProps = dispatch => ({
  handleChooseAutoRefresh: bindActionCreators(setAutoRefresh, dispatch),
  errorThrownAction: bindActionCreators(errorThrown, dispatch),
  setTimeRange: bindActionCreators(
    dataExplorerActionCreators.setTimeRange,
    dispatch
  ),
  writeLineProtocol: bindActionCreators(writeLineProtocolAsync, dispatch),
  queryConfigActions: bindActionCreators(dataExplorerActionCreators, dispatch),
})

export default connect(mapStateToProps, mapDispatchToProps)(DataExplorer)
