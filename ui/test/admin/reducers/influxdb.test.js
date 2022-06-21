import reducer from 'src/admin/reducers/influxdb'

import {
  addDatabase,
  addRetentionPolicy,
  syncUser,
  syncRole,
  editDatabase,
  editRetentionPolicyRequested,
  loadUsers,
  loadRoles,
  loadPermissions,
  deleteRole,
  deleteUser,
  removeDatabase,
  removeRetentionPolicy,
  filterRoles,
  filterUsers,
  addDatabaseDeleteCode,
  removeDatabaseDeleteCode,
  loadQueries,
  setQueriesSort,
  loadDatabases,
  changeSelectedDBs,
  changeShowUsers,
  changeShowRoles,
} from 'src/admin/actions/influxdb'

import {NEW_DEFAULT_DATABASE, NEW_EMPTY_RP} from 'src/admin/constants'

// Users
const u1 = {
  name: 'acidburn',
  roles: [
    {
      name: 'hax0r',
      permissions: {
        allowed: [
          'ViewAdmin',
          'ViewChronograf',
          'CreateDatabase',
          'CreateUserAndRole',
          'AddRemoveNode',
          'DropDatabase',
          'DropData',
          'ReadData',
          'WriteData',
          'Rebalance',
          'ManageShard',
          'ManageContinuousQuery',
          'ManageQuery',
          'ManageSubscription',
          'Monitor',
          'CopyShard',
          'KapacitorAPI',
          'KapacitorConfigAPI',
        ],
        scope: 'all',
      },
    },
  ],
  permissions: [],
  links: {self: '/chronograf/v1/sources/1/users/acidburn'},
}
const u2 = {
  name: 'zerocool',
  roles: [],
  permissions: [],
  links: {self: '/chronograf/v1/sources/1/users/zerocool'},
}
const users = [u1, u2]

// Roles
const r1 = {
  name: 'hax0r',
  users: [],
  permissions: [
    {
      allowed: [
        'ViewAdmin',
        'ViewChronograf',
        'CreateDatabase',
        'CreateUserAndRole',
        'AddRemoveNode',
        'DropDatabase',
        'DropData',
        'ReadData',
        'WriteData',
        'Rebalance',
        'ManageShard',
        'ManageContinuousQuery',
        'ManageQuery',
        'ManageSubscription',
        'Monitor',
        'CopyShard',
        'KapacitorAPI',
        'KapacitorConfigAPI',
      ],
      scope: 'all',
    },
  ],
  links: {self: '/chronograf/v1/sources/1/roles/hax0r'},
}
const r2 = {
  name: 'l33tus3r',
  links: {self: '/chronograf/v1/sources/1/roles/l33tus3r'},
}
const roles = [r1, r2]

// Permissions
const global = {scope: 'all', allowed: ['p1', 'p2']}
const scoped = {scope: 'db1', allowed: ['p1', 'p3']}
const permissions = [global, scoped]

// Databases && Retention Policies
const rp1 = {
  name: 'rp1',
  duration: '0',
  replication: 2,
  isDefault: true,
  links: {self: '/chronograf/v1/sources/1/db/db1/rp/rp1'},
}

const db1 = {
  name: 'db1',
  links: {self: '/chronograf/v1/sources/1/db/db1'},
  retentionPolicies: [rp1],
}

const db2 = {
  name: 'db2',
  links: {self: '/chronograf/v1/sources/1/db/db2'},
  retentionPolicies: [],
  deleteCode: 'DELETE',
}

let state

describe('Admin.InfluxDB.Reducers', () => {
  describe('Databases', () => {
    beforeEach(() => {
      state = {databases: [db1, db2]}
    })

    it('can load databases', () => {
      const {databases, selectedDBs} = reducer(
        undefined,
        loadDatabases([{name: 'db1'}])
      )
      expect({databases, selectedDBs}).toEqual({
        databases: [{name: 'db1'}],
        selectedDBs: ['*'],
      })
    })

    it('can add a database', () => {
      const actual = reducer(state, addDatabase())
      const expected = [{...NEW_DEFAULT_DATABASE, isEditing: true}, db1, db2]
      expect(actual.databases.length).toBe(expected.length)
      expect(actual.databases[0].name).toBe(expected[0].name)
      expect(actual.databases[0].isNew).toBe(expected[0].isNew)
      expect(actual.databases[0].retentionPolicies).toBe(
        expected[0].retentionPolicies
      )
    })

    it('can edit a database', () => {
      const updates = {name: 'dbOne'}
      const actual = reducer(state, editDatabase(db1, updates))
      const expected = [{...db1, ...updates}, db2]

      expect(actual.databases).toEqual(expected)
    })

    it('can remove a database', () => {
      const actual = reducer(state, removeDatabase(db1))
      const expected = [db2]

      expect(actual.databases).toEqual(expected)
    })

    it('can add a database delete code', () => {
      const actual = reducer(state, addDatabaseDeleteCode(db1))
      const expected = [{...db1, deleteCode: ''}, db2]

      expect(actual.databases).toEqual(expected)
    })

    it('can remove the delete code', () => {
      const actual = reducer(state, removeDatabaseDeleteCode(db2))
      delete db2.deleteCode
      const expected = [db1, db2]

      expect(actual.databases).toEqual(expected)
    })
  })

  describe('Retention Policies', () => {
    beforeEach(() => {
      state = {databases: [db1]}
    })

    it('can add a retention policy', () => {
      const actual = reducer(state, addRetentionPolicy(db1))
      const expected = [{...db1, retentionPolicies: [NEW_EMPTY_RP, rp1]}]

      expect(actual.databases).toEqual(expected)
    })

    it('can remove a retention policy', () => {
      const actual = reducer(state, removeRetentionPolicy(db1, rp1))
      const expected = [{...db1, retentionPolicies: []}]

      expect(actual.databases).toEqual(expected)
    })

    it('can edit a retention policy', () => {
      const updates = {name: 'rpOne', duration: '100y', replication: '42'}
      const actual = reducer(
        state,
        editRetentionPolicyRequested(db1, rp1, updates)
      )
      const expected = [{...db1, retentionPolicies: [{...rp1, ...updates}]}]

      expect(actual.databases).toEqual(expected)
    })
  })
  it('it can load users', () => {
    const {users: d, usersFilter} = reducer(state, loadUsers({users}))
    const expected = {
      users,
      usersFilter: '',
    }

    expect({users: d, usersFilter}).toEqual(expected)
  })
  it('it can sync a stale user', () => {
    const staleUser = {...u1, roles: []}
    state = {users: [u2, staleUser], roles: []}

    const actual = reducer(state, syncUser(staleUser, u1))
    const expected = {
      users: [u2, u1],
    }

    expect(actual.users).toEqual(expected.users)
  })
  it('it can sync a new user', () => {
    const staleUser = {name: 'new-user', password: 'pwd'}
    state = {users: [u2]}

    const syncedUser = {
      name: 'new-user',
      roles: [],
      permissions: [],
      links: {self: ''},
    }
    const actual = reducer(state, syncUser(staleUser, syncedUser))
    const expected = {
      users: [syncedUser, u2],
    }

    expect(actual.users).toEqual(expected.users)
  })
  it('it can sync a user with changed roles', () => {
    const shared = {permissions: [], links: {self: 'a'}}
    const staleUser = {...shared, name: 'u1', roles: [{name: 'r1'}]}
    state = {
      users: [staleUser],
      roles: [
        {name: 'r1', users: [{name: 'u1'}]},
        {name: 'r2', users: []},
      ],
    }
    const syncedUser = {...shared, name: 'u1', roles: [{name: 'r2'}]}

    const actual = reducer(state, syncUser(staleUser, syncedUser))
    const expected = {
      users: [syncedUser],
      roles: [
        {name: 'r1', users: []},
        {name: 'r2', users: [syncedUser]},
      ],
    }

    expect(actual.users).toEqual(expected.users)
    expect(actual.roles).toEqual(expected.roles)
  })

  it('it can sync a stale role', () => {
    const staleRole = {...r1, permissions: []}
    state = {roles: [r2, staleRole], users: []}

    const actual = reducer(state, syncRole(staleRole, r1))
    const expected = {
      roles: [r2, r1],
    }

    expect(actual.roles).toEqual(expected.roles)
  })
  it('it can sync a new role', () => {
    const staleRole = {name: 'new-role'}
    state = {roles: [r2]}
    const syncedRole = {
      name: 'new-role',
      users: [],
      permissions: [],
      links: {self: ''},
    }

    const actual = reducer(state, syncRole(staleRole, syncedRole))
    const expected = {
      roles: [syncedRole, r2],
    }

    expect(actual.roles).toEqual(expected.roles)
  })
  it('it can sync a role with changed users', () => {
    const shared = {permissions: [], links: {self: 'a'}}
    const staleRole = {...shared, name: 'r1', users: [{name: 'u1'}]}
    state = {
      roles: [staleRole],
      users: [
        {name: 'u1', roles: [{name: 'u1'}]},
        {name: 'u2', roles: []},
      ],
    }
    const syncedRole = {...shared, name: 'u1', users: [{name: 'u2'}]}
    const actual = reducer(state, syncRole(staleRole, syncedRole))
    const expected = {
      roles: [syncedRole],
      users: [
        {name: 'u1', roles: []},
        {name: 'u2', roles: [syncedRole]},
      ],
    }

    expect(actual.roles).toEqual(expected.roles)
    expect(actual.users).toEqual(expected.users)
  })

  it('it can load roles', () => {
    const {roles: d, rolesFilter} = reducer(state, loadRoles({roles}))
    const expected = {
      roles,
      rolesFilter: '',
    }

    expect({roles: d, rolesFilter}).toEqual(expected)
  })

  it('it can delete a non-existing role', () => {
    state = {
      roles: [r1],
    }

    const actual = reducer(state, deleteRole({}))
    const expected = {
      roles: [r1],
    }

    expect(actual.roles).toEqual(expected.roles)
  })

  it('it can delete a role', () => {
    state = {
      roles: [r1],
    }

    const actual = reducer(state, deleteRole(r1))
    const expected = {
      roles: [],
    }

    expect(actual.roles).toEqual(expected.roles)
  })

  it('it can delete a user', () => {
    state = {
      users: [u1],
    }

    const actual = reducer(state, deleteUser(u1))
    const expected = {
      users: [],
    }

    expect(actual.users).toEqual(expected.users)
  })
  it('it can delete a non-existing user', () => {
    state = {
      users: [u1],
    }

    const actual = reducer(state, deleteUser({}))
    const expected = {
      users: [u1],
    }

    expect(actual.users).toEqual(expected.users)
  })

  it('can filter roles w/ "x" text', () => {
    state = {
      roles,
    }

    const text = 'x'

    const {roles: d, rolesFilter} = reducer(state, filterRoles(text))
    const expected = {
      roles: [
        {...r1, hidden: false},
        {...r2, hidden: true},
      ],
      rolesFilter: text,
    }

    expect({roles: d, rolesFilter}).toEqual(expected)
  })

  it('can filter users w/ "zero" text', () => {
    state = {
      users,
    }

    const text = 'zero'

    const {users: d, usersFilter} = reducer(state, filterUsers(text))
    const expected = {
      users: [
        {...u1, hidden: true},
        {...u2, hidden: false},
      ],
      usersFilter: text,
    }

    expect({users: d, usersFilter}).toEqual(expected)
  })

  // Permissions
  it('it can load the permissions', () => {
    const actual = reducer(undefined, loadPermissions({permissions}))
    const expected = {
      permissions,
    }

    expect(actual.permissions).toEqual(expected.permissions)
  })

  describe('Queries', () => {
    it('it sorts queries by time descending OOTB', () => {
      const queries = [
        {id: 1, database: 'a', duration: '11µs'},
        {id: 2, database: 'b', duration: '36µs'},
      ]
      const actual = reducer(undefined, loadQueries(queries))
      expect(actual.queriesSort).toEqual('-time')
      expect(actual.queries).toHaveLength(2)
      expect(actual.queries[0].id).toEqual(2)
      expect(actual.queries[1].id).toEqual(1)
    })
    it('it sorts queries by database', () => {
      const queries = [
        {id: 2, database: 'b', duration: '16µs'},
        {id: 1, database: 'a', duration: '21µs'},
      ]
      let actual = reducer(undefined, loadQueries(queries))
      actual = reducer(actual, setQueriesSort('+database'))
      expect(actual.queriesSort).toEqual('+database')
      expect(actual.queries).toHaveLength(2)
      expect(actual.queries[0].id).toEqual(1)
      expect(actual.queries[1].id).toEqual(2)
      actual = reducer(actual, setQueriesSort('-database'))
      expect(actual.queriesSort).toEqual('-database')
      expect(actual.queries).toHaveLength(2)
      expect(actual.queries[0].id).toEqual(2)
      expect(actual.queries[1].id).toEqual(1)
      const queries2 = [
        {id: 3, database: 'c', duration: '26µs'},
        {id: 1, database: 'x', duration: '11µs'},
        {id: 2, database: 'd', duration: '22µs'},
      ]
      actual = reducer(actual, loadQueries(queries2))
      expect(actual.queries).toHaveLength(3)
      expect(actual.queries[0].id).toEqual(1)
      expect(actual.queries[1].id).toEqual(2)
      expect(actual.queries[2].id).toEqual(3)
    })
    it('it sorts queries by time', () => {
      const queries = [
        {id: 2, database: 'b', duration: '36µs'},
        {id: 1, database: 'a', duration: '11µs'},
      ]
      let actual = reducer(undefined, loadQueries(queries))
      actual = reducer(actual, setQueriesSort('+time'))
      expect(actual.queriesSort).toEqual('+time')
      expect(actual.queries).toHaveLength(2)
      expect(actual.queries[0].id).toEqual(1)
      expect(actual.queries[1].id).toEqual(2)
      actual = reducer(actual, setQueriesSort('-time'))
      expect(actual.queriesSort).toEqual('-time')
      expect(actual.queries).toHaveLength(2)
      expect(actual.queries[0].id).toEqual(2)
      expect(actual.queries[1].id).toEqual(1)
      const queries2 = [
        {id: 3, database: 'c', duration: '36µs'},
        {id: 1, database: 'x', duration: '11µs'},
        {id: 2, database: 'd', duration: '12µs'},
      ]
      actual = reducer(actual, loadQueries(queries2))
      expect(actual.queries).toHaveLength(3)
      expect(actual.queries[0].id).toEqual(3)
      expect(actual.queries[1].id).toEqual(2)
      expect(actual.queries[2].id).toEqual(1)
    })
  })
  describe('filters', () => {
    it('can change selected DBS', () => {
      const testPairs = [
        {
          prev: undefined,
          change: ['db1'],
          next: ['db1'],
        },
        {
          prev: [],
          change: ['db1'],
          next: ['db1'],
        },
        {
          prev: ['db1'],
          change: ['db1', '*'],
          next: ['*'],
        },
        {
          prev: ['*'],
          change: ['db1', '*'],
          next: ['db1'],
        },
        {
          prev: ['db1'],
          change: [],
          next: [],
        },
      ]
      testPairs.forEach(({prev, change, next}) => {
        const {selectedDBs} = reducer(
          {selectedDBs: prev},
          changeSelectedDBs(change)
        )
        expect(selectedDBs).toEqual(next)
      })
    })
    it('can change showUsers flag', () => {
      const vals = [undefined, true, false]
      vals.forEach(prev => {
        const {showUsers} = reducer({showUsers: prev}, changeShowUsers())
        expect(showUsers).toEqual(!prev)
      })
    })
    it('can change showRoles flag', () => {
      const vals = [undefined, true, false]
      vals.forEach(prev => {
        const {showRoles} = reducer({showRoles: prev}, changeShowRoles())
        expect(showRoles).toEqual(!prev)
      })
    })
  })
})
