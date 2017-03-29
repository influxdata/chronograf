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
} from 'src/admin/apis'

import {
  killQuery as killQueryProxy,
} from 'shared/apis/metaQuery'

import {publishNotification} from 'src/shared/actions/notifications'
import {ADMIN_NOTIFICATION_DELAY} from 'src/admin/constants'

export const loadUsers = ({users}) => ({
  type: 'LOAD_USERS',
  payload: {
    users,
  },
})

export const loadRoles = ({roles}) => ({
  type: 'LOAD_ROLES',
  payload: {
    roles,
  },
})

export const loadPermissions = ({permissions}) => ({
  type: 'LOAD_PERMISSIONS',
  payload: {
    permissions,
  },
})

export const loadDatabases = (databases) => ({
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

export const addRetentionPolicy = (database) => ({
  type: 'ADD_RETENTION_POLICY',
  payload: {
    database,
  },
})

export const syncUser = (staleUser, syncedUser) => ({
  type: 'SYNC_USER',
  payload: {
    staleUser,
    syncedUser,
  },
})

export const syncRole = (staleRole, syncedRole) => ({
  type: 'SYNC_ROLE',
  payload: {
    staleRole,
    syncedRole,
  },
})

export const syncDatabase = (stale, synced) => ({
  type: 'SYNC_DATABASE',
  payload: {
    stale,
    synced,
  },
})

export const syncRetentionPolicy = (database, stale, synced) => ({
  type: 'SYNC_RETENTION_POLICY',
  payload: {
    database,
    stale,
    synced,
  },
})


export const editUser = (user, updates) => ({
  type: 'EDIT_USER',
  payload: {
    user,
    updates,
  },
})

export const editRole = (role, updates) => ({
  type: 'EDIT_ROLE',
  payload: {
    role,
    updates,
  },
})

export const editDatabase = (database, updates) => ({
  type: 'EDIT_DATABASE',
  payload: {
    database,
    updates,
  },
})

export const killQuery = (queryID) => ({
  type: 'KILL_QUERY',
  payload: {
    queryID,
  },
})

export const setQueryToKill = (queryIDToKill) => ({
  type: 'SET_QUERY_TO_KILL',
  payload: {
    queryIDToKill,
  },
})

export const loadQueries = (queries) => ({
  type: 'LOAD_QUERIES',
  payload: {
    queries,
  },
})

// TODO: change to 'removeUser'
export const deleteUser = (user) => ({
  type: 'DELETE_USER',
  payload: {
    user,
  },
})

// TODO: change to 'removeRole'
export const deleteRole = (role) => ({
  type: 'DELETE_ROLE',
  payload: {
    role,
  },
})

export const removeDatabase = (database) => ({
  type: 'REMOVE_DATABASE',
  payload: {
    database,
  },
})

export const removeRetentionPolicy = (database, retentionPolicy) => ({
  type: 'REMOVE_RETENTION_POLICY',
  payload: {
    database,
    retentionPolicy,
  },
})

export const filterUsers = (text) => ({
  type: 'FILTER_USERS',
  payload: {
    text,
  },
})

export const filterRoles = (text) => ({
  type: 'FILTER_ROLES',
  payload: {
    text,
  },
})

export const addDatabaseDeleteCode = (database) => ({
  type: 'ADD_DATABASE_DELETE_CODE',
  payload: {
    database,
  },
})

export const removeDatabaseDeleteCode = (database) => ({
  type: 'REMOVE_DATABASE_DELETE_CODE',
  payload: {
    database,
  },
})

export const editRetentionPolicy = (database, retentionPolicy, updates) => ({
  type: 'EDIT_RETENTION_POLICY',
  payload: {
    database,
    retentionPolicy,
    updates,
  },
})

// async actions
export const loadUsersAsync = (url) => async (dispatch) => {
  const {data} = await getUsersAJAX(url)
  dispatch(loadUsers(data))
}

export const loadRolesAsync = (url) => async (dispatch) => {
  const {data} = await getRolesAJAX(url)
  dispatch(loadRoles(data))
}

export const loadPermissionsAsync = (url) => async (dispatch) => {
  const {data} = await getPermissionsAJAX(url)
  dispatch(loadPermissions(data))
}

export const loadDBsAndRPsAsync = (url) => async (dispatch) => {
  const {data: {databases}} = await getDbsAndRpsAJAX(url)
  dispatch(loadDatabases(databases))
}

export const createUserAsync = (url, user) => async (dispatch) => {
  try {
    const {data} = await createUserAJAX(url, user)
    dispatch(publishNotification('success', 'User created successfully'))
    dispatch(syncUser(user, data))
  } catch (error) {
    // undo optimistic update
    dispatch(publishNotification('error', `Failed to create user: ${error.data.message}`))
    setTimeout(() => dispatch(deleteUser(user)), ADMIN_NOTIFICATION_DELAY)
  }
}

export const createRoleAsync = (url, role) => async (dispatch) => {
  try {
    const {data} = await createRoleAJAX(url, role)
    dispatch(publishNotification('success', 'Role created successfully'))
    dispatch(syncRole(role, data))
  } catch (error) {
    // undo optimistic update
    dispatch(publishNotification('error', `Failed to create role: ${error.data.message}`))
    setTimeout(() => dispatch(deleteRole(role)), ADMIN_NOTIFICATION_DELAY)
  }
}

export const createDatabaseAsync = (url, database) => async (dispatch) => {
  try {
    const {data} = await createDatabaseAJAX(url, database)
    dispatch(syncDatabase(database, data))
    dispatch(publishNotification('success', 'Database created successfully'))
  } catch (error) {
    // undo optimistic update
    dispatch(publishNotification('error', `Failed to create database: ${error.data.message}`))
    setTimeout(() => dispatch(removeDatabase(database)), ADMIN_NOTIFICATION_DELAY)
  }
}

export const createRetentionPolicyAsync = (database, retentionPolicy) => async (dispatch) => {
  try {
    const {data} = await createRetentionPolicyAJAX(database.links.retentionPolicies, retentionPolicy)
    dispatch(publishNotification('success', 'Retention policy created successfully'))
    dispatch(syncRetentionPolicy(database, retentionPolicy, data))
  } catch (error) {
    // undo optimistic update
    dispatch(publishNotification('error', `Failed to create retention policy: ${error.data.message}`))
    setTimeout(() => dispatch(removeRetentionPolicy(database, retentionPolicy)), ADMIN_NOTIFICATION_DELAY)
  }
}

export const updateRetentionPolicyAsync = (database, retentionPolicy, updates) => async (dispatch) => {
  try {
    dispatch(editRetentionPolicy(database, retentionPolicy, updates))
    const {data} = await updateRetentionPolicyAJAX(retentionPolicy.links.self, updates)
    dispatch(publishNotification('success', 'Retention policy updated successfully'))
    dispatch(syncRetentionPolicy(database, retentionPolicy, data))
  } catch (error) {
    dispatch(publishNotification('error', `Failed to update retention policy: ${error.data.message}`))
  }
}

export const killQueryAsync = (source, queryID) => (dispatch) => {
  // optimistic update
  dispatch(killQuery(queryID))
  dispatch(setQueryToKill(null))

  // kill query on server
  killQueryProxy(source, queryID)
}

export const deleteRoleAsync = (role, addFlashMessage) => (dispatch) => {
  // optimistic update
  dispatch(deleteRole(role))

  // delete role on server
  deleteRoleAJAX(role.links.self, addFlashMessage, role.name)
}

export const deleteUserAsync = (user, addFlashMessage) => (dispatch) => {
  // optimistic update
  dispatch(deleteUser(user))

  // delete user on server
  deleteUserAJAX(user.links.self, addFlashMessage, user.name)
}

export const deleteDatabaseAsync = (database) => async (dispatch) => {
  dispatch(removeDatabase(database))
  dispatch(publishNotification('success', 'Database deleted'))
  try {
    await deleteDatabaseAJAX(database.links.self)
  } catch (error) {
    dispatch(publishNotification('error', `Failed to delete database: ${error.data.message}`))
  }
}

export const deleteRetentionPolicyAsync = (database, retentionPolicy) => async (dispatch) => {
  dispatch(removeRetentionPolicy(database, retentionPolicy))
  dispatch(publishNotification('success', `Retention policy ${retentionPolicy.name} deleted`))
  try {
    await deleteRetentionPolicyAJAX(retentionPolicy.links.self)
  } catch (error) {
    dispatch(publishNotification('error', `Failed to delete retentionPolicy: ${error.data.message}`))
  }
}

export const updateRoleUsersAsync = (role, users) => async (dispatch) => {
  try {
    const {data} = await updateRoleAJAX(role.links.self, users, role.permissions)
    dispatch(publishNotification('success', 'Role users updated'))
    dispatch(syncRole(role, data))
  } catch (error) {
    dispatch(publishNotification('error', `Failed to update role: ${error.data.message}`))
  }
}

export const updateRolePermissionsAsync = (role, permissions) => async (dispatch) => {
  try {
    const {data} = await updateRoleAJAX(role.links.self, role.users, permissions)
    dispatch(publishNotification('success', 'Role permissions updated'))
    dispatch(syncRole(role, data))
  } catch (error) {
    dispatch(publishNotification('error', `Failed to updated role:  ${error.data.message}`))
  }
}

export const updateUserPermissionsAsync = (user, permissions) => async (dispatch) => {
  try {
    const {data} = await updateUserAJAX(user.links.self, user.roles, permissions)
    dispatch(publishNotification('success', 'User permissions updated'))
    dispatch(syncUser(user, data))
  } catch (error) {
    dispatch(publishNotification('error', `Failed to updated user:  ${error.data.message}`))
  }
}

export const updateUserRolesAsync = (user, roles) => async (dispatch) => {
  try {
    const {data} = await updateUserAJAX(user.links.self, roles, user.permissions)
    dispatch(publishNotification('success', 'User roles updated'))
    dispatch(syncUser(user, data))
  } catch (error) {
    dispatch(publishNotification('error', `Failed to updated user:  ${error.data.message}`))
  }
}
