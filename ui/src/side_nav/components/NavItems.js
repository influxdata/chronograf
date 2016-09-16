import React, {PropTypes} from 'react';
import {Link} from 'react-router';
import cx from 'classnames';

const {node, string} = PropTypes;

const NavListItem = React.createClass({
  propTypes: {
    link: string.isRequired,
    children: node,
    location: string,
    matcher: string,
  },

  render() {
    const {link, children, matcher, location} = this.props;
    const isActive = matcher && !!location.match(matcher);

    return <Link className={cx("sidebar__menu-item", {active: isActive})} to={link}>{children}</Link>;
  },
});

const NavHeader = React.createClass({
  propTypes: {
    link: string,
    title: string,
  },
  render() {
    return (
      <Link className="sidebar__menu-route" to={this.props.link}>
        <h3 className="sidebar__menu-heading">{this.props.title}</h3>
      </Link>
    );
  },
});

const NavBlock = React.createClass({
  propTypes: {
    children: node,
    link: string,
    icon: string.isRequired,
    location: string,
    matcher: string,
    className: string,
    wrapperClassName: string,
  },

  render() {
    const {location, matcher, className, wrapperClassName} = this.props;
    const isActive = matcher && !!location.match(matcher);

    const children = React.Children.map((this.props.children), (child) => {
      if (child && child.type === NavListItem) {
        return React.cloneElement(child, {
          location,
          isActive,
        });
      }

      return child;
    });


    return (
      <div className={cx('sidebar__square', className, {active: isActive})}>
        {this.renderLink()}
        <div className={wrapperClassName || "sidebar__menu-wrapper"}>
          <div className="sidebar__menu">
            {children}
          </div>
        </div>
      </div>
    );
  },

  renderLink() {
    const {link, icon} = this.props;

    if (!link) {
      return (
        <div className="sidebar__icon">
          <span className={`icon ${icon}`}></span>
        </div>
      );
    }

    return (
      <Link className="sidebar__menu-route" to={link}>
        <div className="sidebar__icon">
          <span className={`icon ${icon}`}></span>
        </div>
      </Link>
    );
  },
});

const NavBar = React.createClass({
  propTypes: {
    children: node,
    location: string.isRequired,
  },

  render() {
    const children = React.Children.map((this.props.children), (child) => {
      if (child && child.type === NavBlock) {
        return React.cloneElement(child, {
          location: this.props.location,
        });
      }

      return child;
    });
    return <aside className="sidebar">{children}</aside>;
  },
});

export {
  NavBar,
  NavBlock,
  NavHeader,
  NavListItem,
};
