import React from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import {withSource} from 'src/CheckSources'

import {Page} from 'src/reusable_ui'
import SubSections from 'src/shared/components/SubSections'

import UsersPage from './UsersPage'
import AllUsersPage from './AllUsersPage'
import OrganizationsPage from './OrganizationsPage'
import ProvidersPage from './ProvidersPage'

import {isUserAuthorized, ADMIN_ROLE, SUPERADMIN_ROLE} from 'src/auth/roles'

const sections = me => [
  {
    url: 'current-organization',
    name: 'Current Org',
    enabled: isUserAuthorized(me.role, ADMIN_ROLE),
    component: (
      <UsersPage meID={me.id} meCurrentOrganization={me.currentOrganization} />
    ),
  },
  {
    url: 'all-users',
    name: 'All Users',
    enabled: isUserAuthorized(me.role, SUPERADMIN_ROLE),
    component: <AllUsersPage meID={me.id} />,
  },
  {
    url: 'all-organizations',
    name: 'All Orgs',
    enabled: isUserAuthorized(me.role, SUPERADMIN_ROLE),
    component: (
      <OrganizationsPage meCurrentOrganization={me.currentOrganization} />
    ),
  },
  {
    url: 'organization-mappings',
    name: 'Org Mappings',
    enabled: isUserAuthorized(me.role, SUPERADMIN_ROLE),
    component: <ProvidersPage />,
  },
]

const AdminChronografPage = ({me, source, params: {tab}}) => (
  <Page>
    <Page.Header>
      <Page.Header.Left>
        <Page.Title title="Chronograf Admin" />
      </Page.Header.Left>
      <Page.Header.Right />
    </Page.Header>
    <Page.Contents fullWidth={true}>
      <div className="container-fluid">
        <SubSections
          sections={sections(me)}
          activeSection={tab}
          parentUrl="admin-chronograf"
          sourceID={source.id}
        />
      </div>
    </Page.Contents>
  </Page>
)

const {shape, string} = PropTypes

AdminChronografPage.propTypes = {
  me: shape({
    id: string.isRequired,
    role: string.isRequired,
    currentOrganization: shape({
      name: string.isRequired,
      id: string.isRequired,
    }),
  }).isRequired,
  params: shape({
    tab: string,
  }).isRequired,
  source: shape({
    id: string.isRequired,
    links: shape({
      users: string.isRequired,
    }),
  }).isRequired,
}

const mapStateToProps = ({auth: {me}}) => ({
  me,
})

export default withSource(connect(mapStateToProps, null)(AdminChronografPage))
