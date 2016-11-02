import React, {PropTypes} from 'react';
import {connect} from 'react-redux';
import Visualization from './Visualization';

const {shape, string, number, func} = PropTypes;

const Visualizations = React.createClass({
  propTypes: {
    timeRange: shape({
      upper: string,
      lower: string,
    }).isRequired,
    panels: shape({}).isRequired,
    queryConfigs: shape({}).isRequired,
    width: string,
    activePanelID: string,
    setActivePanel: func.isRequired,
    scrollPos: number.isRequired,
    scrollHandler: func.isRequired,
  },

  render() {
    const {panels, queryConfigs, timeRange, width, activePanelID} = this.props;

    const panelIDs = Object.keys(panels);
    const visualizations = panelIDs.map((panelID) => {
      const panel = panels[panelID];
      const queries = panel.queryIds.map((id) => queryConfigs[id]);
      return <Visualization name={panel.name} panels={panels} key={panelID} panelID={panelID} queryConfigs={queries} timeRange={timeRange} isActive={panelID === activePanelID} setActivePanel={this.props.setActivePanel} />;
    });

    const activePanelIndex = panelIDs.indexOf(activePanelID);

    return (
      <div className="panels" data-scroll-pos={this.props.scrollPos} data-graph-in-focus={activePanelIndex + 1} style={{width}} onWheel={this.props.scrollHandler}>
        <div className="panels-arrows">
          <div className="panels-arrow"></div>
          <div className="panels-arrow"></div>
        </div>
        <div className="panels-slider">
          {visualizations}
        </div>
      </div>
    );
  },
});

function mapStateToProps(state) {
  return {
    panels: state.panels,
    queryConfigs: state.queryConfigs,
  };
}

export default connect(mapStateToProps)(Visualizations);
