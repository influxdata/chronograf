import {computeUserDBPermissions} from 'src/admin/containers/influxdb/util/userPermissions'
describe('admin/containers/influxdb/util/userPermissions', () => {
  describe('computeUserDBPermissions', () => {
    it('computes no permissions', () => {
      ;[true, false].forEach(isEnterprise =>
        expect(
          computeUserDBPermissions(
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
        computeUserDBPermissions(
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
        computeUserDBPermissions(
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
})
