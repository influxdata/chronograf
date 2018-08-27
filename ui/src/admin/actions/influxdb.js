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
} from 'src/admin/apis/influxdb'

import {killQuery as killQueryProxy} from 'shared/apis/metaQuery'

import {notify} from 'shared/actions/notifications'
import {errorThrown} from 'shared/actions/errors'

import {
  notifyDBUserCreated,
  notifyDBUserCreationFailed,
  notifyDBUserDeleted,
  notifyDBUserDeleteFailed,
  notifyDBUserPermissionsUpdated,
  notifyDBUserPermissionsUpdateFailed,
  notifyDBUserRolesUpdated,
  notifyDBUserRolesUpdateFailed,
  notifyDBUserPasswordUpdated,
  notifyDBUserPasswordUpdateFailed,
  notifyDatabaseCreated,
  notifyDBCreationFailed,
  notifyDBDeleted,
  notifyDBDeleteFailed,
  notifyRoleCreated,
  notifyRoleCreationFailed,
  notifyRoleDeleted,
  notifyRoleDeleteFailed,
  notifyRoleUsersUpdated,
  notifyRoleUsersUpdateFailed,
  notifyRolePermissionsUpdated,
  notifyRolePermissionsUpdateFailed,
  notifyRetentionPolicyCreated,
  notifyRetentionPolicyCreationFailed,
  notifyRetentionPolicyDeleted,
  notifyRetentionPolicyDeleteFailed,
  notifyRetentionPolicyUpdated,
  notifyRetentionPolicyUpdateFailed,
  notifyRetentionPolicyCreationError,
} from 'shared/copy/notifications'

import {REVERT_STATE_DELAY} from 'shared/constants'
import _ from 'lodash'

export const loadUsers = ({users}) => ({
  type: 'INFLUXDB_LOAD_USERS',
  payload: {
    users,
  },
})

export const loadRoles = ({roles}) => ({
  type: 'INFLUXDB_LOAD_ROLES',
  payload: {
    roles,
  },
})

export const loadPermissions = ({permissions}) => ({
  type: 'INFLUXDB_LOAD_PERMISSIONS',
  payload: {
    permissions,
  },
})

export const loadDatabases = databases => ({
  type: 'INFLUXDB_LOAD_DATABASES',
  payload: {
    databases,
  },
})

export const addUser = () => ({
  type: 'INFLUXDB_ADD_USER',
})

export const addRole = () => ({
  type: 'INFLUXDB_ADD_ROLE',
})

export const addDatabase = () => ({
  type: 'INFLUXDB_ADD_DATABASE',
})

export const addRetentionPolicy = database => ({
  type: 'INFLUXDB_ADD_RETENTION_POLICY',
  payload: {
    database,
  },
})

export const syncUser = (staleUser, syncedUser) => ({
  type: 'INFLUXDB_SYNC_USER',
  payload: {
    staleUser,
    syncedUser,
  },
})

export const syncRole = (staleRole, syncedRole) => ({
  type: 'INFLUXDB_SYNC_ROLE',
  payload: {
    staleRole,
    syncedRole,
  },
})

export const syncDatabase = (stale, synced) => ({
  type: 'INFLUXDB_SYNC_DATABASE',
  payload: {
    stale,
    synced,
  },
})

export const syncRetentionPolicy = (database, stale, synced) => ({
  type: 'INFLUXDB_SYNC_RETENTION_POLICY',
  payload: {
    database,
    stale,
    synced,
  },
})

export const editUser = (user, updates) => ({
  type: 'INFLUXDB_EDIT_USER',
  payload: {
    user,
    updates,
  },
})

export const editRole = (role, updates) => ({
  type: 'INFLUXDB_EDIT_ROLE',
  payload: {
    role,
    updates,
  },
})

export const editDatabase = (database, updates) => ({
  type: 'INFLUXDB_EDIT_DATABASE',
  payload: {
    database,
    updates,
  },
})

export const killQuery = queryID => ({
  type: 'INFLUXDB_KILL_QUERY',
  payload: {
    queryID,
  },
})

export const setQueryToKill = queryIDToKill => ({
  type: 'INFLUXDB_SET_QUERY_TO_KILL',
  payload: {
    queryIDToKill,
  },
})

export const loadQueries = queries => ({
  type: 'INFLUXDB_LOAD_QUERIES',
  payload: {
    queries,
  },
})

// TODO: change to 'removeUser'
export const deleteUser = user => ({
  type: 'INFLUXDB_DELETE_USER',
  payload: {
    user,
  },
})

// TODO: change to 'removeRole'
export const deleteRole = role => ({
  type: 'INFLUXDB_DELETE_ROLE',
  payload: {
    role,
  },
})

export const removeDatabase = database => ({
  type: 'INFLUXDB_REMOVE_DATABASE',
  payload: {
    database,
  },
})

export const removeRetentionPolicy = (database, retentionPolicy) => ({
  type: 'INFLUXDB_REMOVE_RETENTION_POLICY',
  payload: {
    database,
    retentionPolicy,
  },
})

export const filterUsers = text => ({
  type: 'INFLUXDB_FILTER_USERS',
  payload: {
    text,
  },
})

export const filterRoles = text => ({
  type: 'INFLUXDB_FILTER_ROLES',
  payload: {
    text,
  },
})

export const addDatabaseDeleteCode = database => ({
  type: 'INFLUXDB_ADD_DATABASE_DELETE_CODE',
  payload: {
    database,
  },
})

export const removeDatabaseDeleteCode = database => ({
  type: 'INFLUXDB_REMOVE_DATABASE_DELETE_CODE',
  payload: {
    database,
  },
})

export const editRetentionPolicyRequested = (
  database,
  retentionPolicy,
  updates
) => ({
  type: 'INFLUXDB_EDIT_RETENTION_POLICY_REQUESTED',
  payload: {
    database,
    retentionPolicy,
    updates,
  },
})

export const editRetentionPolicyCompleted = syncRetentionPolicy

export const editRetentionPolicyFailed = (
  database,
  retentionPolicy,
  updates
) => ({
  type: 'INFLUXDB_EDIT_RETENTION_POLICY_FAILED',
  payload: {
    database,
    retentionPolicy,
    updates,
  },
})

// async actions
export const loadUsersAsync = url => async dispatch => {
  try {
    const {data} = await getUsersAJAX(url)
    dispatch(loadUsers(data))
  } catch (error) {
    dispatch(errorThrown(error))
  }
}

export const loadRolesAsync = url => async dispatch => {
  try {
    const {data} = await getRolesAJAX(url)
    dispatch(loadRoles(data))
  } catch (error) {
    dispatch(errorThrown(error))
  }
}

export const loadPermissionsAsync = url => async dispatch => {
  try {
    const {data} = await getPermissionsAJAX(url)
    dispatch(loadPermissions(data))
  } catch (error) {
    dispatch(errorThrown(error))
  }
}

export const loadDBsAndRPsAsync = url => async dispatch => {
  try {
    const {
      data: {databases},
    } = await getDbsAndRpsAJAX(url)
    dispatch(loadDatabases(_.sortBy(databases, ({name}) => name.toLowerCase())))
  } catch (error) {
    dispatch(errorThrown(error))
  }
}

export const createUserAsync = (url, user) => async dispatch => {
  try {
    const {data} = await createUserAJAX(url, user)
    dispatch(notify(notifyDBUserCreated()))
    dispatch(syncUser(user, data))
  } catch (error) {
    dispatch(errorThrown(error, notifyDBUserCreationFailed(error.data.message)))
    // undo optimistic update
    setTimeout(() => dispatch(deleteUser(user)), REVERT_STATE_DELAY)
  }
}

export const createRoleAsync = (url, role) => async dispatch => {
  try {
    const {data} = await createRoleAJAX(url, role)
    dispatch(notify(notifyRoleCreated()))
    dispatch(syncRole(role, data))
  } catch (error) {
    dispatch(errorThrown(error, notifyRoleCreationFailed(error.data.message)))
    // undo optimistic update
    setTimeout(() => dispatch(deleteRole(role)), REVERT_STATE_DELAY)
  }
}

export const createDatabaseAsync = (url, database) => async dispatch => {
  try {
    const {data} = await createDatabaseAJAX(url, database)
    dispatch(syncDatabase(database, data))
    dispatch(notify(notifyDatabaseCreated()))
  } catch (error) {
    dispatch(errorThrown(error, notifyDBCreationFailed(error.data.message)))
    // undo optimistic update
    setTimeout(() => dispatch(removeDatabase(database)), REVERT_STATE_DELAY)
  }
}

export const createRetentionPolicyAsync = (
  database,
  retentionPolicy
) => async dispatch => {
  try {
    const {data} = await createRetentionPolicyAJAX(
      database.links.retentionPolicies,
      retentionPolicy
    )
    dispatch(notify(notifyRetentionPolicyCreated()))
    dispatch(syncRetentionPolicy(database, retentionPolicy, data))
  } catch (error) {
    dispatch(notify(notifyRetentionPolicyCreationError()))
    dispatch(
      errorThrown(notifyRetentionPolicyCreationFailed(error.data.message))
    )
    // undo optimistic update
    setTimeout(
      () => dispatch(removeRetentionPolicy(database, retentionPolicy)),
      REVERT_STATE_DELAY
    )
  }
}

export const updateRetentionPolicyAsync = (
  database,
  oldRP,
  newRP
) => async dispatch => {
  try {
    dispatch(editRetentionPolicyRequested(database, oldRP, newRP))
    const {data} = await updateRetentionPolicyAJAX(oldRP.links.self, newRP)
    dispatch(editRetentionPolicyCompleted(database, oldRP, data))
    dispatch(notify(notifyRetentionPolicyUpdated()))
  } catch (error) {
    dispatch(editRetentionPolicyFailed(database, oldRP))
    dispatch(
      errorThrown(error, notifyRetentionPolicyUpdateFailed(error.data.message))
    )
  }
}

export const killQueryAsync = (source, query) => async dispatch => {
  // optimistic update
  dispatch(killQuery(query.id))
  dispatch(setQueryToKill(null))
  try {
    // kill query on server
    await killQueryProxy(source, query.id, query.tcpHost)
  } catch (error) {
    dispatch(errorThrown(error))
    // TODO: handle failed killQuery
  }
}

export const deleteRoleAsync = role => async dispatch => {
  dispatch(deleteRole(role))
  try {
    await deleteRoleAJAX(role.links.self)
    dispatch(notify(notifyRoleDeleted(role.name)))
  } catch (error) {
    dispatch(errorThrown(error, notifyRoleDeleteFailed(error.data.message)))
  }
}

export const deleteUserAsync = user => async dispatch => {
  dispatch(deleteUser(user))
  try {
    await deleteUserAJAX(user.links.self)
    dispatch(notify(notifyDBUserDeleted(user.name)))
  } catch (error) {
    dispatch(errorThrown(error, notifyDBUserDeleteFailed(error.data.message)))
  }
}

export const deleteDatabaseAsync = database => async dispatch => {
  dispatch(removeDatabase(database))
  try {
    await deleteDatabaseAJAX(database.links.self)
    dispatch(notify(notifyDBDeleted(database.name)))
  } catch (error) {
    dispatch(errorThrown(error, notifyDBDeleteFailed(error.data.message)))
  }
}

export const deleteRetentionPolicyAsync = (
  database,
  retentionPolicy
) => async dispatch => {
  dispatch(removeRetentionPolicy(database, retentionPolicy))
  try {
    await deleteRetentionPolicyAJAX(retentionPolicy.links.self)
    dispatch(notify(notifyRetentionPolicyDeleted(retentionPolicy.name)))
  } catch (error) {
    dispatch(
      errorThrown(error, notifyRetentionPolicyDeleteFailed(error.data.message))
    )
  }
}

export const updateRoleUsersAsync = (role, users) => async dispatch => {
  try {
    const {data} = await updateRoleAJAX(
      role.links.self,
      users,
      role.permissions
    )
    dispatch(notify(notifyRoleUsersUpdated()))
    dispatch(syncRole(role, data))
  } catch (error) {
    dispatch(
      errorThrown(error, notifyRoleUsersUpdateFailed(error.data.message))
    )
  }
}

export const updateRolePermissionsAsync = (
  role,
  permissions
) => async dispatch => {
  try {
    const {data} = await updateRoleAJAX(
      role.links.self,
      role.users,
      permissions
    )
    dispatch(notify(notifyRolePermissionsUpdated()))
    dispatch(syncRole(role, data))
  } catch (error) {
    dispatch(
      errorThrown(error, notifyRolePermissionsUpdateFailed(error.data.message))
    )
  }
}

export const updateUserPermissionsAsync = (
  user,
  permissions
) => async dispatch => {
  try {
    const {data} = await updateUserAJAX(user.links.self, {permissions})
    dispatch(notify(notifyDBUserPermissionsUpdated()))
    dispatch(syncUser(user, data))
  } catch (error) {
    dispatch(
      errorThrown(
        error,
        notifyDBUserPermissionsUpdateFailed(error.data.message)
      )
    )
  }
}

export const updateUserRolesAsync = (user, roles) => async dispatch => {
  try {
    const {data} = await updateUserAJAX(user.links.self, {roles})
    dispatch(notify(notifyDBUserRolesUpdated()))
    dispatch(syncUser(user, data))
  } catch (error) {
    dispatch(
      errorThrown(error, notifyDBUserRolesUpdateFailed(error.data.message))
    )
  }
}

export const updateUserPasswordAsync = (user, password) => async dispatch => {
  try {
    const {data} = await updateUserAJAX(user.links.self, {password})
    dispatch(notify(notifyDBUserPasswordUpdated()))
    dispatch(syncUser(user, data))
  } catch (error) {
    dispatch(
      errorThrown(error, notifyDBUserPasswordUpdateFailed(error.data.message))
    )
  }
}
