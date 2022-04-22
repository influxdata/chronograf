import _ from 'lodash'
import React, {PureComponent} from 'react'
import {withRouter, Link, WithRouterProps} from 'react-router'
import {connect} from 'react-redux'

import Authorized, {
  ADMIN_ROLE,
  isUserAuthorized,
  VIEWER_ROLE,
} from 'src/auth/Authorized'

import UserNavBlock from 'src/side_nav/components/UserNavBlock'

import {
  NavBlock,
  NavHeader,
  NavListItem,
} from 'src/side_nav/components/NavItems'

import {DEFAULT_HOME_PAGE} from 'src/shared/constants'
import {ErrorHandling} from 'src/shared/decorators/errors'

import {Env, Source, Links, Me} from 'src/types'

interface OwnProps {
  sources: Source[]
  isHidden: boolean
  isUsingAuth?: boolean
  logoutLink?: string
  links?: Links
  me: Me
  env: Env
}
type RouterProps = WithRouterProps<{
  sourceID: string
}>
type Props = OwnProps & RouterProps

@ErrorHandling
class SideNav extends PureComponent<Props> {
  constructor(props) {
    super(props)
  }

  public render() {
    const {
      params: {sourceID},
      location: {pathname: location},
      isHidden,
      isUsingAuth,
      logoutLink,
      links,
      me,
      env,
      sources = [],
    } = this.props

    const defaultSource = sources.find(s => s.default)
    const id = sourceID || _.get(defaultSource, 'id', 0)

    if (isUsingAuth && !isUserAuthorized(me.role, VIEWER_ROLE)) {
      // sidenav is available at least for VIEWER_ROLE
      return null
    }

    const sourcePrefix = `/sources/${id}`
    const dataExplorerLink = `${sourcePrefix}/chronograf/data-explorer`

    const isDefaultPage = location.split('/').includes(DEFAULT_HOME_PAGE)

    const hostPageIsEnabled = !env.hostPageDisabled

    return isHidden ? null : (
      <nav className="sidebar" data-test="sidebar">
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
        {hostPageIsEnabled && (
          <NavBlock
            highlightWhen={['hosts']}
            icon="eye"
            link={`${sourcePrefix}/hosts`}
            location={location}
          >
            <NavHeader link={`${sourcePrefix}/hosts`} title="Host List" />
          </NavBlock>
        )}
        <NavBlock
          highlightWhen={['data-explorer']}
          icon="graphline-2"
          link={dataExplorerLink}
          location={location}
        >
          <NavHeader link={dataExplorerLink} title="Explore" />
        </NavBlock>
        <NavBlock
          highlightWhen={['dashboards']}
          icon="dash-j"
          link={`${sourcePrefix}/dashboards`}
          location={location}
        >
          <NavHeader link={`${sourcePrefix}/dashboards`} title="Dashboards" />
        </NavBlock>
        <NavBlock
          highlightWhen={[
            'alerts',
            'alert-rules',
            'tickscript',
            'tickscripts',
            'flux-tasks',
            'fluxtasks',
          ]}
          icon="alerts"
          link={`${sourcePrefix}/alert-rules`}
          location={location}
        >
          <NavHeader link={`${sourcePrefix}/tickscripts`} title="Alerting" />
          <NavListItem link={`${sourcePrefix}/alert-rules`}>
            Alert Rules
          </NavListItem>
          <NavListItem link={`${sourcePrefix}/tickscripts`}>
            TICKscripts
          </NavListItem>
          <NavListItem link={`${sourcePrefix}/flux-tasks`}>
            Flux Tasks
          </NavListItem>
          <NavListItem link={`${sourcePrefix}/alerts`}>
            Alert History
          </NavListItem>
        </NavBlock>

        <NavBlock
          highlightWhen={['logs']}
          icon="wood"
          link="/logs"
          location={location}
        >
          <NavHeader link={'/logs'} title="Log Viewer" />
        </NavBlock>

        <Authorized
          requiredRole={ADMIN_ROLE}
          replaceWithIfNotUsingAuth={
            <NavBlock
              highlightWhen={['admin-influxdb']}
              icon="crown-outline"
              link={`${sourcePrefix}/admin-influxdb/databases`}
              location={location}
            >
              <NavHeader
                link={`${sourcePrefix}/admin-influxdb/databases`}
                title="InfluxDB Admin"
              />
            </NavBlock>
          }
        >
          <NavBlock
            highlightWhen={['admin-chronograf', 'admin-influxdb']}
            icon="crown-outline"
            link={`${sourcePrefix}/admin-chronograf/current-organization`}
            location={location}
          >
            <NavHeader
              link={`${sourcePrefix}/admin-chronograf/current-organization`}
              title="Admin"
            />
            <NavListItem
              link={`${sourcePrefix}/admin-chronograf/current-organization`}
            >
              Chronograf
            </NavListItem>
            <NavListItem link={`${sourcePrefix}/admin-influxdb/databases`}>
              InfluxDB
            </NavListItem>
          </NavBlock>
        </Authorized>
        <NavBlock
          highlightWhen={['manage-sources', 'kapacitors']}
          highlightUnless={['alert-rules', 'tickscripts', 'fluxtasks']}
          icon="wrench"
          link={`${sourcePrefix}/manage-sources`}
          location={location}
        >
          <NavHeader
            link={`${sourcePrefix}/manage-sources`}
            title="Configuration"
          />
        </NavBlock>
        {isUsingAuth && (
          <UserNavBlock logoutLink={logoutLink} links={links} me={me} />
        )}
      </nav>
    )
  }
}

const mapStateToProps = ({
  sources,
  auth: {isUsingAuth, logoutLink, me},
  app: {
    ephemeral: {inPresentationMode},
  },
  links,
  env,
}) => ({
  sources,
  isHidden: inPresentationMode,
  isUsingAuth,
  logoutLink,
  links,
  env,
  me,
})

export default connect(mapStateToProps)(withRouter(SideNav))
