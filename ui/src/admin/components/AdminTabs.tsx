import * as React from 'react'
import {Tab, Tabs, TabPanel, TabPanels, TabList} from 'shared/components/Tabs'
import UsersTable from 'admin/components/UsersTable'
import RolesTable from 'admin/components/RolesTable'
import QueriesPage from 'admin/containers/QueriesPage'
import DatabaseManagerPage from 'admin/containers/DatabaseManagerPage'
import {eFunc} from 'src/types/funcs'
import {Source} from 'src/types'
import {
  InfluxDBUser as User,
  InfluxDBRole as Role,
  InfluxDBPermission as Permission,
} from 'src/types/influxdbAdmin'

export interface AdminTabsProps {
  source: Source
  users: User[]
  roles: Role[]
  permissions: string[]
  hasRoles: boolean
  isEditingUsers: boolean
  isEditingRoles: boolean
  onClickCreate: eFunc
  onEditUser: (user: User, updates: {}) => void
  onSaveUser: (user: User) => void
  onCancelEditUser: (user: User) => void
  onEditRole: (role: Role, updates: {}) => void
  onCancelEditRole: (role: Role, updates: {}) => void
  onSaveRole: (role: Role, updates: {}) => void
  onDeleteRole: (role: Role, updates: {}) => void
  onDeleteUser: (user: User) => void
  onFilterRoles: (text: string) => void
  onFilterUsers: (text: string) => void
  onUpdateRoleUsers: (role: Role, users: User[]) => void
  onUpdateRolePermissions: (role: Role, permissions: Permission[]) => void
  onUpdateUserRoles: (user: User, roles: Role[]) => void
  onUpdateUserPermissions: (user: User, permissions: Permission[]) => void
  onUpdateUserPassword: (user: User, password: string) => void
}

const AdminTabs: React.SFC<AdminTabsProps> = ({
  users,
  roles,
  permissions,
  source,
  hasRoles,
  isEditingUsers,
  isEditingRoles,
  onClickCreate,
  onEditUser,
  onSaveUser,
  onCancelEditUser,
  onEditRole,
  onSaveRole,
  onCancelEditRole,
  onDeleteRole,
  onDeleteUser,
  onFilterRoles,
  onFilterUsers,
  onUpdateRoleUsers,
  onUpdateRolePermissions,
  onUpdateUserRoles,
  onUpdateUserPermissions,
  onUpdateUserPassword,
}) => {
  let tabs = [
    {
      type: 'Databases',
      component: <DatabaseManagerPage source={source} />,
    },
    {
      type: 'Users',
      component: (
        <UsersTable
          users={users}
          allRoles={roles}
          hasRoles={hasRoles}
          permissions={permissions}
          isEditing={isEditingUsers}
          onSave={onSaveUser}
          onCancel={onCancelEditUser}
          onClickCreate={onClickCreate}
          onEdit={onEditUser}
          onDelete={onDeleteUser}
          onFilter={onFilterUsers}
          onUpdatePermissions={onUpdateUserPermissions}
          onUpdateRoles={onUpdateUserRoles}
          onUpdatePassword={onUpdateUserPassword}
        />
      ),
    },
    {
      type: 'Roles',
      component: (
        <RolesTable
          roles={roles}
          allUsers={users}
          permissions={permissions}
          isEditing={isEditingRoles}
          onClickCreate={onClickCreate}
          onEdit={onEditRole}
          onSave={onSaveRole}
          onCancel={onCancelEditRole}
          onDelete={onDeleteRole}
          onFilter={onFilterRoles}
          onUpdateRoleUsers={onUpdateRoleUsers}
          onUpdateRolePermissions={onUpdateRolePermissions}
        />
      ),
    },
    {
      type: 'Queries',
      component: <QueriesPage source={source} />,
    },
  ]

  if (!hasRoles) {
    tabs = tabs.filter(t => t.type !== 'Roles')
  }

  return (
    <Tabs className="row">
      <TabList customClass="col-md-2 admin-tabs">
        {tabs.map((_, i) => <Tab key={tabs[i].type}>{tabs[i].type}</Tab>)}
      </TabList>
      <TabPanels customClass="col-md-10 admin-tabs--content">
        {tabs.map((t, i) => (
          <TabPanel key={tabs[i].type}>{t.component}</TabPanel>
        ))}
      </TabPanels>
    </Tabs>
  )
}
export default AdminTabs
