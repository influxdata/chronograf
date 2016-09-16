import React, {PropTypes} from 'react';
import cx from 'classnames';

const {node, func, bool, number} = PropTypes;
export const Tab = React.createClass({
  propTypes: {
    children: node.isRequired,
    onClick: func,
    isDisabled: bool,
    isActive: bool,
  },

  render() {
    return (
      <div
        className={cx("btn tab", {active: this.props.isActive})}
        onClick={this.props.isDisabled ? null : this.props.onClick}
      >
        {this.props.children}
      </div>
    );
  },
});

export const TabList = React.createClass({
  propTypes: {
    children: node.isRequired,
    activeIndex: number,
    onActivate: func,
  },

  render() {
    const children = React.Children.map(this.props.children, (child, index) => {
      return React.cloneElement(child, {
        isActive: index === this.props.activeIndex,
        onClick: () => this.props.onActivate(index),
      });
    });

    return <div className="btn-group btn-group-lg tab-group" >{children}</div>;
  },
});

export const TabPanels = React.createClass({
  propTypes: {
    children: node.isRequired,
    activeIndex: number,
  },

  render() {
    return (
      <div>
        {this.props.children[this.props.activeIndex]}
      </div>
    );
  },
});

export const TabPanel = React.createClass({
  propTypes: {
    children: node.isRequired,
  },

  render() {
    return <div>{this.props.children}</div>;
  },
});

export const Tabs = React.createClass({
  propTypes: {
    children: node.isRequired,
    onSelect: func,
  },

  getDefaultProps() {
    return {
      onSelect() {},
    };
  },

  getInitialState() {
    return {
      activeIndex: 0,
    };
  },

  handleActivateTab(activeIndex) {
    this.setState({activeIndex});
    this.props.onSelect(activeIndex);
  },

  render() {
    const children = React.Children.map(this.props.children, (child) => {
      if (child.type === TabPanels) {
        return React.cloneElement(child, {
          activeIndex: this.state.activeIndex,
        });
      } else if (child.type === TabList) {
        return React.cloneElement(child, {
          activeIndex: this.state.activeIndex,
          onActivate: this.handleActivateTab,
        });
      }

      return child;
    });

    return <div>{children}</div>;
  },
});
