import reject from 'lodash/reject'
import {NEW_DEFAULT_DATABASE, NEW_EMPTY_RP} from 'src/admin/constants'
import uuid from 'uuid'
import {parseDuration, compareDurations} from 'src/utils/influxDuration'
import {
  changeNamedCollection,
  computeNamedChanges,
} from '../util/changeNamedCollection'
import allOrParticularSelection from '../util/allOrParticularSelection'

const querySorters = {
  '+time'(queries) {
    queries.forEach(x => (x._pd = parseDuration(x.duration)))
    return queries.sort((a, b) => {
      return compareDurations(a._pd, b._pd)
    })
  },
  '-time'(queries) {
    queries.forEach(x => (x._pd = parseDuration(x.duration)))
    return queries.sort((a, b) => {
      return -compareDurations(a._pd, b._pd)
    })
  },
  '+database'(queries) {
    queries.forEach(x => (x._pd = parseDuration(x.duration)))
    return queries.sort((a, b) => {
      return a.database.localeCompare(b.database)
    })
  },
  '-database'(queries) {
    queries.forEach(x => (x._pd = parseDuration(x.duration)))
    return queries.sort((a, b) => {
      return -a.database.localeCompare(b.database)
    })
  },
}
const identity = x => x
function sortQueries(queries, queriesSort) {
  return (querySorters[queriesSort] || identity)(queries)
}
const initialState = {
  users: [],
  roles: [],
  permissions: [],
  queries: [],
  queriesSort: '-time',
  queryIDToKill: null,
  databases: [],
  selectedDBs: ['*'],
  showUsers: true,
}

const adminInfluxDB = (state = initialState, action) => {
  switch (action.type) {
    case 'INFLUXDB_LOAD_USERS': {
      return {...state, ...action.payload}
    }

    case 'INFLUXDB_LOAD_ROLES': {
      return {...state, ...action.payload}
    }

    case 'INFLUXDB_LOAD_PERMISSIONS': {
      return {...state, ...action.payload}
    }

    case 'INFLUXDB_LOAD_DATABASES': {
      const databases = action.payload.databases
      const selectedDBs = initialState.selectedDBs
      return {...state, databases, selectedDBs}
    }

    case 'INFLUXDB_ADD_DATABASE': {
      const newDatabase = {
        ...NEW_DEFAULT_DATABASE,
        links: {self: `temp-ID${uuid.v4()}`},
        isEditing: true,
      }

      return {
        ...state,
        databases: [newDatabase, ...state.databases],
      }
    }

    case 'INFLUXDB_ADD_RETENTION_POLICY': {
      const {database} = action.payload
      const databases = state.databases.map(db =>
        db.links.self === database.links.self
          ? {
              ...database,
              retentionPolicies: [
                {...NEW_EMPTY_RP},
                ...database.retentionPolicies,
              ],
            }
          : db
      )

      return {...state, databases}
    }

    case 'INFLUXDB_SYNC_USER': {
      const {staleUser, syncedUser} = action.payload
      const newUsers = staleUser.links
        ? state.users.map(u =>
            u.links.self === staleUser.links.self ? {...syncedUser} : u
          )
        : [{...syncedUser}, ...state.users]
      const rolesChange = computeNamedChanges(
        staleUser.roles || [],
        syncedUser.roles || []
      )
      if (rolesChange) {
        // update roles that add/remove synced user
        const newRoles = state.roles.map(r => {
          const change = rolesChange[r.name]
          if (change !== undefined) {
            return {
              ...r,
              users: changeNamedCollection(r.users, {...syncedUser}, change),
            }
          }
          return r
        })
        return {...state, users: newUsers, roles: newRoles}
      }
      return {...state, users: newUsers}
    }

    case 'INFLUXDB_SYNC_ROLE': {
      const {staleRole, syncedRole} = action.payload
      const newRoles = staleRole.links
        ? state.roles.map(r =>
            r.links.self === staleRole.links.self ? {...syncedRole} : r
          )
        : [{...syncedRole}, ...state.roles]
      const usersChange = computeNamedChanges(
        staleRole.users || [],
        syncedRole.users || []
      )
      if (usersChange) {
        // update users that add/remove synced role
        const newUsers = state.users.map(u => {
          const change = usersChange[u.name]
          if (change !== undefined) {
            return {
              ...u,
              roles: changeNamedCollection(u.roles, {...syncedRole}, change),
            }
          }
          return u
        })
        return {...state, roles: newRoles, users: newUsers}
      }

      return {...state, roles: newRoles}
    }

    case 'INFLUXDB_SYNC_DATABASE': {
      const {stale, synced} = action.payload
      const newState = {
        databases: state.databases.map(db =>
          db.links.self === stale.links.self ? {...synced} : db
        ),
      }

      return {...state, ...newState}
    }

    case 'INFLUXDB_SYNC_RETENTION_POLICY': {
      const {database, stale, synced} = action.payload
      const newState = {
        databases: state.databases.map(db =>
          db.links.self === database.links.self
            ? {
                ...db,
                retentionPolicies: db.retentionPolicies.map(rp =>
                  rp.links.self === stale.links.self ? {...synced} : rp
                ),
              }
            : db
        ),
      }

      return {...state, ...newState}
    }

    case 'INFLUXDB_EDIT_DATABASE': {
      const {database, updates} = action.payload
      const newState = {
        databases: state.databases.map(db =>
          db.links.self === database.links.self ? {...db, ...updates} : db
        ),
      }

      return {...state, ...newState}
    }

    case 'INFLUXDB_EDIT_RETENTION_POLICY_REQUESTED': {
      const {database, retentionPolicy, updates} = action.payload

      const newState = {
        databases: state.databases.map(db =>
          db.links.self === database.links.self
            ? {
                ...db,
                retentionPolicies: db.retentionPolicies.map(rp =>
                  rp.links.self === retentionPolicy.links.self
                    ? {...rp, ...updates}
                    : rp
                ),
              }
            : db
        ),
      }

      return {...state, ...newState}
    }

    case 'INFLUXDB_EDIT_RETENTION_POLICY_FAILED': {
      const {database, retentionPolicy} = action.payload

      const newState = {
        databases: state.databases.map(db =>
          db.links.self === database.links.self
            ? {
                ...db,
                retentionPolicies: db.retentionPolicies.map(rp =>
                  rp.links.self === retentionPolicy.links.self
                    ? {...rp, ...retentionPolicy}
                    : rp
                ),
              }
            : db
        ),
      }

      return {...state, ...newState}
    }

    case 'INFLUXDB_DELETE_USER': {
      const {user} = action.payload
      if (user.links) {
        const newState = {
          users: state.users.filter(u => u.links.self !== user.links.self),
        }
        return {...state, ...newState}
      }
      return state
    }

    case 'INFLUXDB_DELETE_ROLE': {
      const {role} = action.payload
      if (role.links) {
        const newState = {
          roles: state.roles.filter(r => r.links.self !== role.links.self),
        }
        return {...state, ...newState}
      }
      return state
    }

    case 'INFLUXDB_REMOVE_DATABASE': {
      const {database} = action.payload
      const newState = {
        databases: state.databases.filter(
          db => db.links.self !== database.links.self
        ),
      }

      return {...state, ...newState}
    }

    case 'INFLUXDB_REMOVE_RETENTION_POLICY': {
      const {database, retentionPolicy} = action.payload
      const newState = {
        databases: state.databases.map(db =>
          db.links.self === database.links.self
            ? {
                ...db,
                retentionPolicies: db.retentionPolicies.filter(
                  rp => rp.links.self !== retentionPolicy.links.self
                ),
              }
            : db
        ),
      }

      return {...state, ...newState}
    }

    case 'INFLUXDB_ADD_DATABASE_DELETE_CODE': {
      const {database} = action.payload
      const newState = {
        databases: state.databases.map(db =>
          db.links.self === database.links.self ? {...db, deleteCode: ''} : db
        ),
      }

      return {...state, ...newState}
    }

    case 'INFLUXDB_REMOVE_DATABASE_DELETE_CODE': {
      const {database} = action.payload
      delete database.deleteCode

      const newState = {
        databases: state.databases.map(db =>
          db.links.self === database.links.self ? {...database} : db
        ),
      }

      return {...state, ...newState}
    }

    case 'INFLUXDB_LOAD_QUERIES': {
      return {
        ...state,
        queries: sortQueries(action.payload.queries, state.queriesSort),
      }
    }
    case 'INFLUXDB_SET_QUERIES_SORT': {
      const queriesSort = action.payload.queriesSort
      return {
        ...state,
        queriesSort,
        queries: sortQueries(state.queries, queriesSort),
      }
    }

    case 'INFLUXDB_FILTER_USERS': {
      const {text} = action.payload
      const newState = {
        users: state.users.map(u => {
          u.hidden = !u.name.toLowerCase().includes(text)
          return u
        }),
      }
      return {...state, ...newState}
    }

    case 'INFLUXDB_FILTER_ROLES': {
      const {text} = action.payload
      const newState = {
        roles: state.roles.map(r => {
          r.hidden = !r.name.toLowerCase().includes(text)
          return r
        }),
      }
      return {...state, ...newState}
    }

    case 'INFLUXDB_KILL_QUERY': {
      const {queryID} = action.payload
      const nextState = {
        queries: reject(state.queries, q => +q.id === +queryID),
      }

      return {...state, ...nextState}
    }

    case 'INFLUXDB_SET_QUERY_TO_KILL': {
      return {...state, ...action.payload}
    }
    case 'INFLUXDB_CHANGE_SELECTED_DBS': {
      const newDBs = action.payload.selectedDBs
      const oldDBs = state.selectedDBs || ['*']
      const selectedDBs = allOrParticularSelection(oldDBs, newDBs)
      return {...state, selectedDBs}
    }
    case 'INFLUXDB_CHANGE_SHOW_USERS': {
      return {...state, showUsers: !state.showUsers}
    }
  }

  return state
}

export default adminInfluxDB
