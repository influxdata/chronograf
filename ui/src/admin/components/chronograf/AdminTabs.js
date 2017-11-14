import React, {PropTypes} from 'react'

import {
  isUserAuthorized,
  ADMIN_ROLE,
  SUPERADMIN_ROLE,
} from 'src/auth/Authorized'

import {Tab, Tabs, TabPanel, TabPanels, TabList} from 'shared/components/Tabs'
import OrganizationsPage from 'src/admin/containers/OrganizationsPage'
import ProvidersPage from 'src/admin/containers/ProvidersPage'
import UsersTable from 'src/admin/components/chronograf/UsersTable'

const ORGANIZATIONS_TAB_NAME = 'Organizations'
const USERS_TAB_NAME = 'Users'
const PROVIDERS_TAB_NAME = 'Providers'

const AdminTabs = ({
  meRole,
  // UsersTable
  users,
  organization,
  onCreateUser,
  onUpdateUserRole,
  onUpdateUserSuperAdmin,
  onDeleteUser,
}) => {
  const tabs = [
    {
      requiredRole: SUPERADMIN_ROLE,
      type: ORGANIZATIONS_TAB_NAME,
      component: <OrganizationsPage />,
    },
    {
      requiredRole: ADMIN_ROLE,
      type: USERS_TAB_NAME,
      component: (
        <UsersTable
          users={users}
          organization={organization}
          onCreateUser={onCreateUser}
          onUpdateUserRole={onUpdateUserRole}
          onUpdateUserSuperAdmin={onUpdateUserSuperAdmin}
          onDeleteUser={onDeleteUser}
        />
      ),
    },
    {
      requiredRole: SUPERADMIN_ROLE,
      type: PROVIDERS_TAB_NAME,
      component: <ProvidersPage />,
    },
  ].filter(t => isUserAuthorized(meRole, t.requiredRole))

  return (
    <Tabs className="row">
      <TabList customClass="col-md-2 admin-tabs">
        {tabs.map((t, i) =>
          <Tab key={tabs[i].type}>
            {tabs[i].type}
          </Tab>
        )}
      </TabList>
      <TabPanels customClass="col-md-10 admin-tabs--content">
        {tabs.map((t, i) =>
          <TabPanel key={tabs[i].type}>
            {t.component}
          </TabPanel>
        )}
      </TabPanels>
    </Tabs>
  )
}

const {arrayOf, func, shape, string} = PropTypes

AdminTabs.propTypes = {
  meRole: string.isRequired,
  // UsersTable
  users: arrayOf(shape()),
  organization: shape({
    name: string.isRequired,
    id: string.isRequired,
  }),
  onCreateUser: func.isRequired,
  onUpdateUserRole: func.isRequired,
  onUpdateUserSuperAdmin: func.isRequired,
  onDeleteUser: func.isRequired,
}

export default AdminTabs
