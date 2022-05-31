import {
  computePermissions,
  computePermissionsChange,
  toUserPermissions,
} from 'src/admin/containers/influxdb/util/permissions'
import {User, UserPermission} from 'src/types/influxAdmin'
const redundantUserProperties: Pick<User, 'roles' | 'links'> = {
  roles: [],
  links: {self: ''},
}
describe('admin/containers/influxdb/util/permissions', () => {
  describe('computeUserDBPermissions', () => {
    it('computes no permissions', () => {
      ;[true, false].forEach(isEnterprise =>
        expect(
          computePermissions(
            {
              name: 'a',
              permissions: [],
              ...redundantUserProperties,
            },
            isEnterprise
          )
        ).toEqual({})
      )
    })
    it('includes only database permissions for OSS', () => {
      expect(
        computePermissions(
          {
            name: 'a',
            permissions: [
              {scope: 'all', allowed: ['R', 'W']},
              {scope: 'database', name: 'db1', allowed: ['W']},
              {scope: 'database', name: 'db2', allowed: ['R']},
            ],
            ...redundantUserProperties,
          },
          false /* isEnterprise */
        )
      ).toEqual({db1: {W: true}, db2: {R: true}})
    })
    it('includes extra database for Enterprise all-scoped permissions', () => {
      expect(
        computePermissions(
          {
            name: 'a',
            permissions: [
              {scope: 'all', allowed: ['R', 'W']},
              {scope: 'database', name: 'db1', allowed: ['W']},
              {scope: 'database', name: 'db2', allowed: ['R']},
            ],
            ...redundantUserProperties,
          },
          true /* isEnterprise */
        )
      ).toEqual({'': {R: true, W: true}, db1: {W: true}, db2: {R: true}})
    })
  })
  describe('computeUserPermissionsChange', () => {
    const userPerms = {db1: {Write: true}}
    it('toggles new db permission', () => {
      expect(computePermissionsChange('db2', 'Read', userPerms, {})).toEqual({
        db2: {Read: true},
      })
      expect(
        computePermissionsChange('db2', 'Read', userPerms, {
          db2: {Read: true},
        })
      ).toEqual({})
      expect(
        computePermissionsChange('db2', 'Read', userPerms, {db3: {A: true}})
      ).toEqual({
        db2: {Read: true},
        db3: {A: true},
      })
      expect(
        computePermissionsChange('db2', 'Read', userPerms, {
          db2: {Read: true},
          db3: {A: true},
        })
      ).toEqual({db3: {A: true}})
    })
    it('toggles existing db new permission', () => {
      expect(computePermissionsChange('db1', 'Read', userPerms, {})).toEqual({
        db1: {Read: true},
      })
      expect(
        computePermissionsChange('db1', 'Read', userPerms, {
          db1: {Read: true},
        })
      ).toEqual({})
      expect(
        computePermissionsChange('db1', 'Read', userPerms, {db3: {A: true}})
      ).toEqual({
        db1: {Read: true},
        db3: {A: true},
      })
      expect(
        computePermissionsChange('db1', 'Read', userPerms, {
          db1: {Read: true},
          db3: {A: true},
        })
      ).toEqual({db3: {A: true}})
    })
    it('toggles existing db existing permission', () => {
      expect(computePermissionsChange('db1', 'Write', userPerms, {})).toEqual({
        db1: {Write: false},
      })
      expect(
        computePermissionsChange('db1', 'Write', userPerms, {
          db1: {Write: false},
        })
      ).toEqual({})
      expect(
        computePermissionsChange('db1', 'Write', userPerms, {
          db3: {A: true},
        })
      ).toEqual({
        db1: {Write: false},
        db3: {A: true},
      })
      expect(
        computePermissionsChange('db1', 'Write', userPerms, {
          db1: {Write: false},
          db3: {A: true},
        })
      ).toEqual({db3: {A: true}})
    })
  })
  describe('toUserPermissions', () => {
    // sort the test results so that they are comparable with expected results
    const sorted = (perms: UserPermission[]) =>
      perms
        .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
        .map(({name, scope, allowed}) => ({
          name,
          scope,
          allowed: (allowed || []).sort(),
        }))
    it('changes permissions in OSS', () => {
      expect(
        sorted(
          toUserPermissions({db1: {READ: true}}, {db2: {WRITE: true}}, [
            {scope: 'all', allowed: ['ALL']},
          ])
        )
      ).toEqual([
        {scope: 'all', allowed: ['ALL']},
        {scope: 'database', name: 'db1', allowed: ['READ']},
        {scope: 'database', name: 'db2', allowed: ['WRITE']},
      ])
    })
    it('removes permission in OSS', () => {
      expect(
        sorted(
          toUserPermissions(
            {db1: {READ: true}},
            {db1: {READ: false}, db2: {READ: true}},
            [{scope: 'all', allowed: ['ALL']}]
          )
        )
      ).toEqual([
        {scope: 'all', allowed: ['ALL']},
        {scope: 'database', name: 'db2', allowed: ['READ']},
      ])
    })
    it('adds permissions in Enterprise', () => {
      expect(
        sorted(
          toUserPermissions(
            {db1: {READ: true}},
            {db2: {WRITE: true}, '': {Other: true}}
          )
        )
      ).toEqual([
        {scope: 'all', allowed: ['Other']},
        {scope: 'database', name: 'db1', allowed: ['READ']},
        {scope: 'database', name: 'db2', allowed: ['WRITE']},
      ])
    })
    it('removes permissions in Enterprise', () => {
      expect(
        sorted(
          toUserPermissions(
            {db1: {READ: true, WRITE: true}, '': {Other: true}},
            {db1: {WRITE: false}, '': {Other: false}, db3: {Other: true}}
          )
        )
      ).toEqual([
        {scope: 'database', name: 'db1', allowed: ['READ']},
        {scope: 'database', name: 'db3', allowed: ['Other']},
      ])
    })
  })
})
