import reject from 'lodash/reject'
import {
  NEW_DEFAULT_USER,
  NEW_DEFAULT_ROLE,
  NEW_DEFAULT_DATABASE,
  NEW_EMPTY_RP,
} from 'admin/constants'
import uuidv4 from 'uuid/v4'

const initialState = {
  users: null,
  roles: [],
  permissions: [],
  queries: [],
  queryIDToKill: null,
  databases: [],
}

export default function admin(state = initialState, action) {
  switch (action.type) {
    case 'LOAD_USERS': {
      return {...state, ...action.payload}
    }

    case 'LOAD_ROLES': {
      return {...state, ...action.payload}
    }

    case 'LOAD_PERMISSIONS': {
      return {...state, ...action.payload}
    }

    case 'LOAD_DATABASES': {
      return {...state, ...action.payload}
    }

    case 'ADD_USER': {
      const newUser = {...NEW_DEFAULT_USER, isEditing: true}
      return {
        ...state,
        users: [newUser, ...state.users],
      }
    }

    case 'ADD_ROLE': {
      const newRole = {...NEW_DEFAULT_ROLE, isEditing: true}
      return {
        ...state,
        roles: [newRole, ...state.roles],
      }
    }

    case 'ADD_DATABASE': {
      const newDatabase = {
        ...NEW_DEFAULT_DATABASE,
        links: {self: `temp-ID${uuidv4()}`},
        isEditing: true,
      }

      return {
        ...state,
        databases: [newDatabase, ...state.databases],
      }
    }

    case 'ADD_RETENTION_POLICY': {
      const {database} = action.payload
      const databases = state.databases.map(
        db =>
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

    case 'SYNC_USER': {
      const {staleUser, syncedUser} = action.payload
      const newState = {
        users: state.users.map(
          u => (u.links.self === staleUser.links.self ? {...syncedUser} : u)
        ),
      }
      return {...state, ...newState}
    }

    case 'SYNC_ROLE': {
      const {staleRole, syncedRole} = action.payload
      const newState = {
        roles: state.roles.map(
          r => (r.links.self === staleRole.links.self ? {...syncedRole} : r)
        ),
      }
      return {...state, ...newState}
    }

    case 'SYNC_DATABASE': {
      const {stale, synced} = action.payload
      const newState = {
        databases: state.databases.map(
          db => (db.links.self === stale.links.self ? {...synced} : db)
        ),
      }

      return {...state, ...newState}
    }

    case 'SYNC_RETENTION_POLICY': {
      const {database, stale, synced} = action.payload
      const newState = {
        databases: state.databases.map(
          db =>
            db.links.self === database.links.self
              ? {
                  ...db,
                  retentionPolicies: db.retentionPolicies.map(
                    rp =>
                      rp.links.self === stale.links.self ? {...synced} : rp
                  ),
                }
              : db
        ),
      }

      return {...state, ...newState}
    }

    case 'EDIT_USER': {
      const {user, updates} = action.payload
      const newState = {
        users: state.users.map(
          u => (u.links.self === user.links.self ? {...u, ...updates} : u)
        ),
      }
      return {...state, ...newState}
    }

    case 'EDIT_ROLE': {
      const {role, updates} = action.payload
      const newState = {
        roles: state.roles.map(
          r => (r.links.self === role.links.self ? {...r, ...updates} : r)
        ),
      }
      return {...state, ...newState}
    }

    case 'EDIT_DATABASE': {
      const {database, updates} = action.payload
      const newState = {
        databases: state.databases.map(
          db =>
            db.links.self === database.links.self ? {...db, ...updates} : db
        ),
      }

      return {...state, ...newState}
    }

    case 'EDIT_RETENTION_POLICY': {
      const {database, retentionPolicy, updates} = action.payload

      const newState = {
        databases: state.databases.map(
          db =>
            db.links.self === database.links.self
              ? {
                  ...db,
                  retentionPolicies: db.retentionPolicies.map(
                    rp =>
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

    case 'DELETE_USER': {
      const {user} = action.payload
      const newState = {
        users: state.users.filter(u => u.links.self !== user.links.self),
      }

      return {...state, ...newState}
    }

    case 'DELETE_ROLE': {
      const {role} = action.payload
      const newState = {
        roles: state.roles.filter(r => r.links.self !== role.links.self),
      }

      return {...state, ...newState}
    }

    case 'REMOVE_DATABASE': {
      const {database} = action.payload
      const newState = {
        databases: state.databases.filter(
          db => db.links.self !== database.links.self
        ),
      }

      return {...state, ...newState}
    }

    case 'REMOVE_RETENTION_POLICY': {
      const {database, retentionPolicy} = action.payload
      const newState = {
        databases: state.databases.map(
          db =>
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

    case 'ADD_DATABASE_DELETE_CODE': {
      const {database} = action.payload
      const newState = {
        databases: state.databases.map(
          db =>
            db.links.self === database.links.self ? {...db, deleteCode: ''} : db
        ),
      }

      return {...state, ...newState}
    }

    case 'REMOVE_DATABASE_DELETE_CODE': {
      const {database} = action.payload
      delete database.deleteCode

      const newState = {
        databases: state.databases.map(
          db => (db.links.self === database.links.self ? {...database} : db)
        ),
      }

      return {...state, ...newState}
    }

    case 'LOAD_QUERIES': {
      return {...state, ...action.payload}
    }

    case 'FILTER_USERS': {
      const {text} = action.payload
      const newState = {
        users: state.users.map(u => {
          u.hidden = !u.name.toLowerCase().includes(text)
          return u
        }),
      }
      return {...state, ...newState}
    }

    case 'FILTER_ROLES': {
      const {text} = action.payload
      const newState = {
        roles: state.roles.map(r => {
          r.hidden = !r.name.toLowerCase().includes(text)
          return r
        }),
      }
      return {...state, ...newState}
    }

    case 'KILL_QUERY': {
      const {queryID} = action.payload
      const nextState = {
        queries: reject(state.queries, q => +q.id === +queryID),
      }

      return {...state, ...nextState}
    }

    case 'SET_QUERY_TO_KILL': {
      return {...state, ...action.payload}
    }
  }

  return state
}
