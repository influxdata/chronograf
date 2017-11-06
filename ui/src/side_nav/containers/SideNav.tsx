import * as React from 'react'
import * as _ from 'lodash'
import {withRouter, Link} from 'react-router-dom'
import {compose} from 'redux'
import {connect} from 'react-redux'

import {
  NavBar,
  NavBlock,
  NavHeader,
  NavListItem,
} from 'side_nav/components/NavItems'

import {DEFAULT_HOME_PAGE} from 'shared/constants'

import {RouterSourceID, CustomLink} from 'src/types'
import {RootState} from 'src/types/redux'

export interface SideNavProps {
  isHidden: boolean
  logoutLink: string
  customLinks: CustomLink[]
}

export type SideNavPropsRouter = SideNavProps & RouterSourceID

const SideNav: React.SFC<SideNavPropsRouter> = ({
  match: {params: {sourceID}},
  location,
  isHidden,
  logoutLink,
  customLinks,
}) => {
  const sourcePrefix = `/sources/${sourceID}`
  const dataExplorerLink = `${sourcePrefix}/chronograf/data-explorer`
  const isUsingAuth = !!logoutLink

  const isDefaultPage = location.pathname.split('/').includes(DEFAULT_HOME_PAGE)

  return (
    isHidden && (
      <NavBar location={location}>
        <div
          className={isDefaultPage ? 'sidebar--item active' : 'sidebar--item'}
        >
          <Link
            to={`${sourcePrefix}/${DEFAULT_HOME_PAGE}`}
            className="sidebar--square sidebar--logo"
          >
            <span className="sidebar--icon icon cubo-uniform" />
          </Link>
        </div>
        <NavBlock
          icon="cubo-node"
          link={`${sourcePrefix}/hosts`}
          location={location}
        >
          <NavHeader link={`${sourcePrefix}/hosts`} title="Host List" />
        </NavBlock>
        <NavBlock icon="graphline" link={dataExplorerLink} location={location}>
          <NavHeader link={dataExplorerLink} title="Data Explorer" />
        </NavBlock>
        <NavBlock
          icon="dash-h"
          link={`${sourcePrefix}/dashboards`}
          location={location}
        >
          <NavHeader link={`${sourcePrefix}/dashboards`} title={'Dashboards'} />
        </NavBlock>
        <NavBlock
          icon="alert-triangle"
          link={`${sourcePrefix}/alerts`}
          location={location}
        >
          <NavHeader link={`${sourcePrefix}/alerts`} title="Alerting" />
          <NavListItem link={`${sourcePrefix}/alerts`} location={location}>
            History
          </NavListItem>
          <NavListItem link={`${sourcePrefix}/alert-rules`} location={location}>
            Create
          </NavListItem>
        </NavBlock>
        <NavBlock
          icon="crown2"
          link={`${sourcePrefix}/admin`}
          location={location}
        >
          <NavHeader link={`${sourcePrefix}/admin`} title="Admin" />
        </NavBlock>
        <NavBlock
          icon="cog-thick"
          link={`${sourcePrefix}/manage-sources`}
          location={location}
        >
          <NavHeader
            link={`${sourcePrefix}/manage-sources`}
            title="Configuration"
          />
        </NavBlock>
        {isUsingAuth ? (
          <NavBlock icon="user" location={location}>
            {customLinks ? (
              <div>
                <NavHeader key={'0'} title="User" link="/" />
                {_.sortBy(customLinks, 'name').map(({name, url}, i) => (
                  <NavListItem
                    key={`${i + 1}`}
                    useAnchor={true}
                    isExternal={true}
                    link={url}
                    location={location}
                  >
                    {name}
                  </NavListItem>
                ))}
                <NavListItem
                  key={`${customLinks.length + 1}`}
                  useAnchor={true}
                  link={logoutLink}
                  location={location}
                >
                  Logout
                </NavListItem>
              </div>
            ) : (
              <NavHeader useAnchor={true} link={logoutLink} title="Logout" />
            )}
          </NavBlock>
        ) : null}
      </NavBar>
    )
  )
}

const mapStateToProps = ({
  auth: {logoutLink},
  app: {ephemeral: {inPresentationMode}},
  links: {external: {custom: customLinks}},
}: RootState) => ({
  isHidden: inPresentationMode,
  logoutLink,
  customLinks,
})

export default compose(withRouter, connect(mapStateToProps))(SideNav)
