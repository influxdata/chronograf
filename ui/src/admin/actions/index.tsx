import * as _ from 'lodash'

import {
  getUsers as getUsersAJAX,
  getRoles as getRolesAJAX,
  getPermissions as getPermissionsAJAX,
  getDbsAndRps as getDbsAndRpsAJAX,
  createUser as createUserAJAX,
  createRole as createRoleAJAX,
  createDatabase as createDatabaseAJAX,
  createRetentionPolicy as createRetentionPolicyAJAX,
  deleteUser as deleteUserAJAX,
  deleteRole as deleteRoleAJAX,
  deleteDatabase as deleteDatabaseAJAX,
  deleteRetentionPolicy as deleteRetentionPolicyAJAX,
  updateRole as updateRoleAJAX,
  updateUser as updateUserAJAX,
  updateRetentionPolicy as updateRetentionPolicyAJAX,
} from 'admin/apis'

import {killQuery as killQueryProxy} from 'shared/apis/metaQuery'
import {publishAutoDismissingNotification} from 'shared/dispatchers'
import {errorThrown} from 'shared/actions/errors'
import {REVERT_STATE_DELAY} from 'shared/constants'
import {
  Database,
  InfluxDBUser as User,
  InfluxDBRole as Role,
  InfluxDBPermission as Permission,
  RetentionPolicy as RP,
  InfluxDBAdminQuery,
} from 'src/types/influxdbAdmin'

export const loadUsers = ({users}: {users: User[]}) => ({
  type: 'LOAD_USERS',
  payload: {
    users,
  },
})

export const loadRoles = ({roles}: {roles: Role[]}) => ({
  type: 'LOAD_ROLES',
  payload: {
    roles,
  },
})

export const loadPermissions = ({
  permissions,
}: {
  permissions: Permission[]
}) => ({
  type: 'LOAD_PERMISSIONS',
  payload: {
    permissions,
  },
})

export const loadDatabases = (databases: Database[]) => ({
  type: 'LOAD_DATABASES',
  payload: {
    databases,
  },
})

export const addUser = () => ({
  type: 'ADD_USER',
})

export const addRole = () => ({
  type: 'ADD_ROLE',
})

export const addDatabase = () => ({
  type: 'ADD_DATABASE',
})

export const addRetentionPolicy = (database: Database) => ({
  type: 'ADD_RETENTION_POLICY',
  payload: {
    database,
  },
})

export const syncUser = (staleUser: User, syncedUser: User) => ({
  type: 'SYNC_USER',
  payload: {
    staleUser,
    syncedUser,
  },
})

export const syncRole = (staleRole: Role, syncedRole: Role) => ({
  type: 'SYNC_ROLE',
  payload: {
    staleRole,
    syncedRole,
  },
})

export const syncDatabase = (stale: Database, synced: Database) => ({
  type: 'SYNC_DATABASE',
  payload: {
    stale,
    synced,
  },
})

export const syncRetentionPolicy = (
  database: Database,
  stale: RP,
  synced: RP
) => ({
  type: 'SYNC_RETENTION_POLICY',
  payload: {
    database,
    stale,
    synced,
  },
})

export const editUser = (user: User, updates: {}) => ({
  type: 'EDIT_USER',
  payload: {
    user,
    updates,
  },
})

export const editRole = (role: Role, updates: {}) => ({
  type: 'EDIT_ROLE',
  payload: {
    role,
    updates,
  },
})

export const editDatabase = (database: Database, updates) => ({
  type: 'EDIT_DATABASE',
  payload: {
    database,
    updates,
  },
})

export const killQuery = (queryID: string) => ({
  type: 'KILL_QUERY',
  payload: {
    queryID,
  },
})

export const setQueryToKill = (queryIDToKill: string) => ({
  type: 'SET_QUERY_TO_KILL',
  payload: {
    queryIDToKill,
  },
})

export const loadQueries = (queries: InfluxDBAdminQuery[]) => ({
  type: 'LOAD_QUERIES',
  payload: {
    queries,
  },
})

// TODO: change to 'removeUser'
export const deleteUser = (user: User) => ({
  type: 'DELETE_USER',
  payload: {
    user,
  },
})

// TODO: change to 'removeRole'
export const deleteRole = (role: Role) => ({
  type: 'DELETE_ROLE',
  payload: {
    role,
  },
})

export const removeDatabase = (database: Database) => ({
  type: 'REMOVE_DATABASE',
  payload: {
    database,
  },
})

export const removeRetentionPolicy = (
  database: Database,
  retentionPolicy: RP
) => ({
  type: 'REMOVE_RETENTION_POLICY',
  payload: {
    database,
    retentionPolicy,
  },
})

export const filterUsers = (text: string) => ({
  type: 'FILTER_USERS',
  payload: {
    text,
  },
})

export const filterRoles = (text: string) => ({
  type: 'FILTER_ROLES',
  payload: {
    text,
  },
})

export const addDatabaseDeleteCode = (database: Database) => ({
  type: 'ADD_DATABASE_DELETE_CODE',
  payload: {
    database,
  },
})

export const removeDatabaseDeleteCode = (database: Database) => ({
  type: 'REMOVE_DATABASE_DELETE_CODE',
  payload: {
    database,
  },
})

export const editRetentionPolicy = (
  database: Database,
  retentionPolicy: RP,
  updates: {}
) => ({
  type: 'EDIT_RETENTION_POLICY',
  payload: {
    database,
    retentionPolicy,
    updates,
  },
})

// async actions
export const loadUsersAsync = (url: string) => async dispatch => {
  try {
    const {data} = await getUsersAJAX(url)
    dispatch(loadUsers(data))
  } catch (error) {
    dispatch(errorThrown(error))
  }
}

export const loadRolesAsync = (url: string) => async dispatch => {
  try {
    const {data} = await getRolesAJAX(url)
    dispatch(loadRoles(data))
  } catch (error) {
    dispatch(errorThrown(error))
  }
}

export const loadPermissionsAsync = (url: string) => async dispatch => {
  try {
    const {data} = await getPermissionsAJAX(url)
    dispatch(loadPermissions(data))
  } catch (error) {
    dispatch(errorThrown(error))
  }
}

export const loadDBsAndRPsAsync = (url: string) => async dispatch => {
  try {
    const {data: {databases}} = await getDbsAndRpsAJAX(url)
    dispatch(loadDatabases(_.sortBy(databases, ({name}) => name.toLowerCase())))
  } catch (error) {
    dispatch(errorThrown(error))
  }
}

export const createUserAsync = (url: string, user: User) => async dispatch => {
  try {
    const {data} = await createUserAJAX(url, user)
    dispatch(
      publishAutoDismissingNotification('success', 'User created successfully')
    )
    dispatch(syncUser(user, data))
  } catch (error) {
    dispatch(errorThrown(error, `Failed to create user: ${error.data.message}`))
    // undo optimistic update
    setTimeout(() => dispatch(deleteUser(user)), REVERT_STATE_DELAY)
  }
}

export const createRoleAsync = (url: string, role: Role) => async dispatch => {
  try {
    const {data} = await createRoleAJAX(url, role)
    dispatch(
      publishAutoDismissingNotification('success', 'Role created successfully')
    )
    dispatch(syncRole(role, data))
  } catch (error) {
    dispatch(errorThrown(error, `Failed to create role: ${error.data.message}`))
    // undo optimistic update
    setTimeout(() => dispatch(deleteRole(role)), REVERT_STATE_DELAY)
  }
}

export const createDatabaseAsync = (
  url: string,
  database: Database
) => async dispatch => {
  try {
    const {data} = await createDatabaseAJAX(url, database)
    dispatch(syncDatabase(database, data))
    dispatch(
      publishAutoDismissingNotification(
        'success',
        'Database created successfully'
      )
    )
  } catch (error) {
    dispatch(
      errorThrown(error, `Failed to create database: ${error.data.message}`)
    )
    // undo optimistic update
    setTimeout(() => dispatch(removeDatabase(database)), REVERT_STATE_DELAY)
  }
}

export const createRetentionPolicyAsync = (
  database: Database,
  retentionPolicy: RP
) => async dispatch => {
  try {
    const {data} = await createRetentionPolicyAJAX(
      database.links.retentionPolicies,
      retentionPolicy
    )
    dispatch(
      publishAutoDismissingNotification(
        'success',
        'Retention policy created successfully'
      )
    )
    dispatch(syncRetentionPolicy(database, retentionPolicy, data))
  } catch (error) {
    dispatch(
      errorThrown(
        error,
        `Failed to create retention policy: ${error.data.message}`
      )
    )
    // undo optimistic update
    setTimeout(
      () => dispatch(removeRetentionPolicy(database, retentionPolicy)),
      REVERT_STATE_DELAY
    )
  }
}

export const updateRetentionPolicyAsync = (
  database: Database,
  retentionPolicy: RP,
  updates: {}
) => async dispatch => {
  try {
    dispatch(editRetentionPolicy(database, retentionPolicy, updates))
    const {data} = await updateRetentionPolicyAJAX(
      retentionPolicy.links.self,
      updates
    )
    dispatch(
      publishAutoDismissingNotification(
        'success',
        'Retention policy updated successfully'
      )
    )
    dispatch(syncRetentionPolicy(database, retentionPolicy, data))
  } catch (error) {
    dispatch(
      errorThrown(
        error,
        `Failed to update retention policy: ${error.data.message}`
      )
    )
  }
}

export const killQueryAsync = (
  source: string,
  queryID: string
) => async dispatch => {
  // optimistic update
  dispatch(killQuery(queryID))
  dispatch(setQueryToKill(null))
  try {
    // kill query on server
    await killQueryProxy(source, queryID)
  } catch (error) {
    dispatch(errorThrown(error))
    // TODO: handle failed killQuery
  }
}

export const deleteRoleAsync = (role: Role) => async dispatch => {
  dispatch(deleteRole(role))
  try {
    await deleteRoleAJAX(role.links.self)
    dispatch(publishAutoDismissingNotification('success', 'Role deleted'))
  } catch (error) {
    dispatch(errorThrown(error, `Failed to delete role: ${error.data.message}`))
  }
}

export const deleteUserAsync = (user: User) => async dispatch => {
  dispatch(deleteUser(user))
  try {
    await deleteUserAJAX(user.links.self)
    dispatch(publishAutoDismissingNotification('success', 'User deleted'))
  } catch (error) {
    dispatch(errorThrown(error, `Failed to delete user: ${error.data.message}`))
  }
}

export const deleteDatabaseAsync = (database: Database) => async dispatch => {
  dispatch(removeDatabase(database))
  try {
    await deleteDatabaseAJAX(database.links.self)
    dispatch(publishAutoDismissingNotification('success', 'Database deleted'))
  } catch (error) {
    dispatch(
      errorThrown(error, `Failed to delete database: ${error.data.message}`)
    )
  }
}

export const deleteRetentionPolicyAsync = (
  database: Database,
  retentionPolicy: RP
) => async dispatch => {
  dispatch(removeRetentionPolicy(database, retentionPolicy))
  try {
    await deleteRetentionPolicyAJAX(retentionPolicy.links.self)
    dispatch(
      publishAutoDismissingNotification(
        'success',
        `Retention policy ${retentionPolicy.name} deleted`
      )
    )
  } catch (error) {
    dispatch(
      errorThrown(
        error,
        `Failed to delete retentionPolicy: ${error.data.message}`
      )
    )
  }
}

export const updateRoleUsersAsync = (
  role: Role,
  users: User[]
) => async dispatch => {
  try {
    const {data} = await updateRoleAJAX(
      role.links.self,
      users,
      role.permissions
    )
    dispatch(publishAutoDismissingNotification('success', 'Role users updated'))
    dispatch(syncRole(role, data))
  } catch (error) {
    dispatch(errorThrown(error, `Failed to update role: ${error.data.message}`))
  }
}

export const updateRolePermissionsAsync = (
  role: Role,
  permissions: Permission[]
) => async dispatch => {
  try {
    const {data} = await updateRoleAJAX(
      role.links.self,
      role.users,
      permissions
    )
    dispatch(
      publishAutoDismissingNotification('success', 'Role permissions updated')
    )
    dispatch(syncRole(role, data))
  } catch (error) {
    dispatch(
      errorThrown(error, `Failed to update role:  ${error.data.message}`)
    )
  }
}

export const updateUserPermissionsAsync = (
  user: User,
  permissions: Permission[]
) => async dispatch => {
  try {
    const {data} = await updateUserAJAX(user.links.self, {permissions})
    dispatch(
      publishAutoDismissingNotification('success', 'User permissions updated')
    )
    dispatch(syncUser(user, data))
  } catch (error) {
    dispatch(
      errorThrown(error, `Failed to update user:  ${error.data.message}`)
    )
  }
}

export const updateUserRolesAsync = (
  user: User,
  roles: Role[]
) => async dispatch => {
  try {
    const {data} = await updateUserAJAX(user.links.self, {roles})
    dispatch(publishAutoDismissingNotification('success', 'User roles updated'))
    dispatch(syncUser(user, data))
  } catch (error) {
    dispatch(
      errorThrown(error, `Failed to update user:  ${error.data.message}`)
    )
  }
}

export const updateUserPasswordAsync = (
  user: User,
  password: string
) => async dispatch => {
  try {
    const {data} = await updateUserAJAX(user.links.self, {password})
    dispatch(
      publishAutoDismissingNotification('success', 'User password updated')
    )
    dispatch(syncUser(user, data))
  } catch (error) {
    dispatch(
      errorThrown(error, `Failed to update user:  ${error.data.message}`)
    )
  }
}
