import {
  computeUserPermissions,
  computeUserPermissionsChange,
} from 'src/admin/containers/influxdb/util/userPermissions'
describe('admin/containers/influxdb/util/userPermissions', () => {
  describe('computeUserDBPermissions', () => {
    it('computes no permissions', () => {
      ;[true, false].forEach(isEnterprise =>
        expect(
          computeUserPermissions(
            {
              name: 'a',
              permissions: [],
              roles: [],
            },
            isEnterprise
          )
        ).toEqual({})
      )
    })
    it('includes only database permissions for OSS', () => {
      expect(
        computeUserPermissions(
          {
            name: 'a',
            permissions: [
              {scope: 'all', allowed: ['R', 'W']},
              {scope: 'database', name: 'db1', allowed: ['W']},
              {scope: 'database', name: 'db2', allowed: ['R']},
            ],
            roles: [],
          },
          false /* isEnterprise */
        )
      ).toEqual({db1: {W: true}, db2: {R: true}})
    })
    it('includes extra database for Enterprise all-scoped permissions', () => {
      expect(
        computeUserPermissions(
          {
            name: 'a',
            permissions: [
              {scope: 'all', allowed: ['R', 'W']},
              {scope: 'database', name: 'db1', allowed: ['W']},
              {scope: 'database', name: 'db2', allowed: ['R']},
            ],
            roles: [],
          },
          true /* isEnterprise */
        )
      ).toEqual({'': {R: true, W: true}, db1: {W: true}, db2: {R: true}})
    })
  })
  describe('computeUserPermissionsChange', () => {
    const userPerms = {db1: {Write: true}}
    it('toggles new db permission', () => {
      expect(
        computeUserPermissionsChange('db2', 'Read', userPerms, {})
      ).toEqual({
        db2: {Read: true},
      })
      expect(
        computeUserPermissionsChange('db2', 'Read', userPerms, {
          db2: {Read: true},
        })
      ).toEqual({})
      expect(
        computeUserPermissionsChange('db2', 'Read', userPerms, {db3: {A: true}})
      ).toEqual({
        db2: {Read: true},
        db3: {A: true},
      })
      expect(
        computeUserPermissionsChange('db2', 'Read', userPerms, {
          db2: {Read: true},
          db3: {A: true},
        })
      ).toEqual({db3: {A: true}})
    })
    it('toggles existing db new permission', () => {
      expect(
        computeUserPermissionsChange('db1', 'Read', userPerms, {})
      ).toEqual({
        db1: {Read: true},
      })
      expect(
        computeUserPermissionsChange('db1', 'Read', userPerms, {
          db1: {Read: true},
        })
      ).toEqual({})
      expect(
        computeUserPermissionsChange('db1', 'Read', userPerms, {db3: {A: true}})
      ).toEqual({
        db1: {Read: true},
        db3: {A: true},
      })
      expect(
        computeUserPermissionsChange('db1', 'Read', userPerms, {
          db1: {Read: true},
          db3: {A: true},
        })
      ).toEqual({db3: {A: true}})
    })
    it('toggles existing db existing permission', () => {
      expect(
        computeUserPermissionsChange('db1', 'Write', userPerms, {})
      ).toEqual({
        db1: {Write: false},
      })
      expect(
        computeUserPermissionsChange('db1', 'Write', userPerms, {
          db1: {Write: false},
        })
      ).toEqual({})
      expect(
        computeUserPermissionsChange('db1', 'Write', userPerms, {
          db3: {A: true},
        })
      ).toEqual({
        db1: {Write: false},
        db3: {A: true},
      })
      expect(
        computeUserPermissionsChange('db1', 'Write', userPerms, {
          db1: {Write: false},
          db3: {A: true},
        })
      ).toEqual({db3: {A: true}})
    })
  })
})
