import React, {PropTypes} from 'react';
import {connect} from 'react-redux';
import PanelBuilder from '../components/PanelBuilder';
import Visualizations from '../components/Visualizations';
import Header from '../containers/Header';
import ResizeContainer from 'shared/components/ResizeContainer';
import {FETCHING} from '../reducers/explorers';
import {
  setTimeRange as setTimeRangeAction,
  createExploration as createExplorationAction,
  chooseExploration as chooseExplorationAction,
  deleteExplorer as deleteExplorerAction,
  editExplorer as editExplorerAction,
} from '../actions/view';

const DataExplorer = React.createClass({
  propTypes: {
    source: PropTypes.shape({
      links: PropTypes.shape({
        proxy: PropTypes.string.isRequired,
        self: PropTypes.string.isRequired,
      }).isRequired,
    }).isRequired,
    explorers: PropTypes.shape({}).isRequired,
    explorerID: PropTypes.string,
    panels: PropTypes.shape({}).isRequired,
    timeRange: PropTypes.shape({
      upper: PropTypes.string,
      lower: PropTypes.string,
    }).isRequired,
    setTimeRange: PropTypes.func.isRequired,
    createExploration: PropTypes.func.isRequired,
    chooseExploration: PropTypes.func.isRequired,
    deleteExplorer: PropTypes.func.isRequired,
    editExplorer: PropTypes.func.isRequired,
  },

  childContextTypes: {
    source: PropTypes.shape({
      links: PropTypes.shape({
        proxy: PropTypes.string.isRequired,
        self: PropTypes.string.isRequired,
      }).isRequired,
    }).isRequired,
  },

  getChildContext() {
    return {source: this.props.source};
  },

  getInitialState() {
    return {
      activePanelId: null,
      scrollPos: 1,
    };
  },

  handleSetActivePanel(id) {
    const panelIDs = Object.keys(this.props.panels);
    const newScrollPos = panelIDs.indexOf(id) + 1;

    // Closing an active panel should not affect scroll position
    if (newScrollPos === 0) {
      this.setState({
        activePanelID: id,
      });
      return;
    }
    // When a panel becomes active, scroll position and graph-in-focus get updated
    this.setState({
      activePanelID: id,
      scrollPos: newScrollPos,
    });
  },

  handleKeyDown(event) {
    // Keyboard shortcuts for scrolling
    const keyCode = event.keyCode;
    const {scrollPos} = this.state;
    const downKeyCode = 40;
    const upKeyCode = 38;

    if (keyCode === downKeyCode) {
      // scroll pos should never exceed the number of graphs in the list explorer
      this.setState({scrollPos: scrollPos + 1 > Object.keys(this.props.panels).length ? scrollPos : scrollPos + 1});
      return;
    } else if (keyCode === upKeyCode) {
      // scroll pos cannot be 0 or less
      this.setState({scrollPos: scrollPos - 1 < 1 ? scrollPos : scrollPos - 1});
      return;
    }
  },

  handleWheel(event) {
    const wheelDelta = event.deltaY;
    const {scrollPos} = this.state;

    if (wheelDelta > 0) {
      // scroll pos should never exceed the number of graphs in the list explorer
      this.setState({scrollPos: scrollPos + 1 > Object.keys(this.props.panels).length ? scrollPos : scrollPos + 1});
      return;
    }
    // scroll pos cannot be 0 or less
    this.setState({scrollPos: scrollPos - 1 < 1 ? scrollPos : scrollPos - 1});
  },

  render() {
    const {timeRange, explorers, explorerID, setTimeRange, createExploration, chooseExploration, deleteExplorer, editExplorer} = this.props;

    if (explorers === FETCHING || !explorerID) {
      // TODO: page-wide spinner
      return null;
    }

    return (
      <div className="data-explorer" tabIndex="0" onKeyDown={this.handleKeyDown}>
        <Header
          actions={{setTimeRange, createExploration, chooseExploration, deleteExplorer, editExplorer}}
          explorers={explorers}
          timeRange={timeRange}
          explorerID={explorerID}
        />
        <ResizeContainer>
          <PanelBuilder timeRange={timeRange} activePanelID={this.state.activePanelID} setActivePanel={this.handleSetActivePanel} />
          <Visualizations timeRange={timeRange} activePanelID={this.state.activePanelID} scrollPos={this.state.scrollPos} scrollHandler={this.handleWheel} setActivePanel={this.handleSetActivePanel} />
        </ResizeContainer>
      </div>
    );
  },
});

function mapStateToProps(state) {
  return {
    timeRange: state.timeRange,
    explorers: state.explorers,
    panels: state.panels,
  };
}

export default connect(mapStateToProps, {
  setTimeRange: setTimeRangeAction,
  createExploration: createExplorationAction,
  chooseExploration: chooseExplorationAction,
  deleteExplorer: deleteExplorerAction,
  editExplorer: editExplorerAction,
})(DataExplorer);
