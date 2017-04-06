import React, {PropTypes} from 'react'
import {NavBar, NavBlock, NavHeader, NavListItem} from 'src/side_nav/components/NavItems'

const {
  string,
  shape,
  bool,
} = PropTypes
const SideNav = React.createClass({
  propTypes: {
    location: string.isRequired,
    sourceID: string.isRequired,
    me: shape({
      name: string,
    }),
    isHidden: bool.isRequired,
  },

  render() {
    const {me, location, sourceID, isHidden} = this.props
    const sourcePrefix = `/sources/${sourceID}`
    const dataExplorerLink = `${sourcePrefix}/chronograf/data-explorer`

    const loggedIn = !!(me && me.name)

    return isHidden ? null : (
      <NavBar location={location}>
        <div className="sidebar__logo">
          <a href="/"><span className="icon cubo-uniform"></span></a>
        </div>
        <NavBlock icon="cubo-node" link={`${sourcePrefix}/hosts`}>
          <NavHeader link={`${sourcePrefix}/hosts`} title="Host List" />
        </NavBlock>
        <NavBlock icon="graphline" link={dataExplorerLink}>
          <NavHeader link={dataExplorerLink} title="Data Explorer" />
        </NavBlock>
        <NavBlock icon="dash-h" link={`${sourcePrefix}/dashboards`}>
          <NavHeader link={`${sourcePrefix}/dashboards`} title={'Dashboards'} />
        </NavBlock>
        <NavBlock matcher="alerts" icon="alert-triangle" link={`${sourcePrefix}/alerts`}>
          <NavHeader link={`${sourcePrefix}/alerts`} title="Alerting" />
          <NavListItem link={`${sourcePrefix}/alerts`}>Alert History</NavListItem>
          <NavListItem link={`${sourcePrefix}/alert-rules`}>Kapacitor Rules</NavListItem>
        </NavBlock>
        <NavBlock icon="crown2" link={`${sourcePrefix}/admin`}>
          <NavHeader link={`${sourcePrefix}/admin`} title="Admin" />
        </NavBlock>
        <NavBlock icon="cog-thick" link={`${sourcePrefix}/manage-sources`}>
          <NavHeader link={`${sourcePrefix}/manage-sources`} title="Configuration" />
          <NavListItem link={`${sourcePrefix}/manage-sources`}>InfluxDB</NavListItem>
          <NavListItem link={`${sourcePrefix}/kapacitor-config`}>Kapacitor</NavListItem>
        </NavBlock>
        {loggedIn ? (
        <NavBlock icon="user-outline" className="sidebar__square-last">
          <a className="sidebar__menu-item" href="/oauth/logout">Logout</a>
        </NavBlock>
        ) : null}
      </NavBar>
    )
  },
})

export default SideNav
