import {
  computeDBPermRecords,
  computeEffectiveUserDBPermissions,
  computeEntitiesDBPermissions,
  mergeDBPermRecords,
} from 'src/admin/util/computeEffectiveDBPermissions'
import {User, UserRole} from 'src/types/influxAdmin'
const emptyUserProperties: Pick<User, 'roles' | 'links'> = {
  roles: [],
  links: {self: ''},
}
const emptyRoleProperties: Pick<UserRole, 'users' | 'links'> = {
  users: [],
  links: {self: ''},
}

describe('admin/util/computeEffectiveDBPermissions', () => {
  describe('computeDBPermRecords', () => {
    const subject = computeDBPermRecords
    it('creates value for no databases', () => {
      expect(
        subject({name: 'a', permissions: [], ...emptyUserProperties}, [])
      ).toEqual({})
      expect(
        subject({name: 'a', permissions: [], ...emptyUserProperties}, [], {
          db1: {},
        })
      ).toEqual({db1: {}})
    })
    it('computes db-specific permissions', () => {
      expect(
        subject(
          {
            name: 'a',
            permissions: [
              {scope: 'database', name: 'db1', allowed: ['A']},
              {scope: 'database', name: 'db3', allowed: ['B', 'C']},
            ],
            ...emptyUserProperties,
          },
          ['db1', 'db2', 'db3']
        )
      ).toEqual({db1: {A: true}, db3: {B: true, C: true}})
    })
    it('maps all-scoped ALL permission to READ, WRITE', () => {
      expect(
        subject(
          {
            name: 'a',
            permissions: [{scope: 'all', allowed: ['ALL']}],
            ...emptyUserProperties,
          },
          ['db1', 'db2']
        )
      ).toEqual({
        db1: {READ: true, WRITE: true},
        db2: {READ: true, WRITE: true},
      })
    })
    it('inherits all permissions', () => {
      expect(
        subject(
          {
            name: 'a',
            permissions: [
              {scope: 'all', allowed: ['Read']},
              {scope: 'database', name: 'db1', allowed: ['Write']},
              {scope: 'database', name: 'db2', allowed: ['Other']},
            ],
            ...emptyUserProperties,
          },
          ['db1', 'db2']
        )
      ).toEqual({
        db1: {Read: true, Write: true},
        db2: {Read: true, Other: true},
      })
    })
    it('inherits independently on order', () => {
      expect(
        subject(
          {
            name: 'a',
            permissions: [
              {scope: 'database', name: 'db2', allowed: ['Other']},
              {scope: 'database', name: 'db1', allowed: ['Write']},
              {scope: 'all', allowed: ['Read']},
            ],
            ...emptyUserProperties,
          },
          ['db1', 'db2', 'db3']
        )
      ).toEqual({
        db1: {Read: true, Write: true},
        db2: {Read: true, Other: true},
        db3: {Read: true},
      })
    })
    it('uses custom initial DB perms', () => {
      expect(
        subject(
          {
            name: 'a',
            permissions: [
              {scope: 'database', name: 'db2', allowed: ['Other']},
              {scope: 'database', name: 'db1', allowed: ['Write']},
              {scope: 'all', allowed: ['Read']},
            ],
            ...emptyUserProperties,
          },
          ['db1', 'db2', 'db3'],
          {a: {Other: true}, db3: {Write: true}}
        )
      ).toEqual({
        a: {Other: true},
        db1: {Read: true, Write: true},
        db2: {Read: true, Other: true},
        db3: {Read: true, Write: true},
      })
    })
  })
  describe('mergeDBPermRecords', () => {
    const subject = mergeDBPermRecords
    it('can merge no records', () => {
      expect(subject()).toEqual({})
    })
    it('can merge empty records', () => {
      expect(subject({}, {}, {})).toEqual({})
    })
    it('can merge perm non-empty records', () => {
      expect(
        subject(
          {db1: {R: true}},
          {db2: {W: true}},
          {db1: {W: true}, db2: {R: true}, db3: {O: true, C: true}}
        )
      ).toEqual({
        db1: {R: true, W: true},
        db2: {R: true, W: true},
        db3: {O: true, C: true},
      })
    })
  })
  describe('computeEntitiesDBPermissions', () => {
    const subject = computeEntitiesDBPermissions
    it('creates values for empty users', () => {
      expect(subject([], ['whateverdb'])).toEqual([])
    })
    it('creates values for no databases', () => {
      expect(
        subject([{name: 'a', permissions: [], ...emptyUserProperties}], [])
      ).toEqual([[]])
    })
    it('computes db-specific permissions', () => {
      expect(
        subject(
          [
            {
              name: 'a',
              permissions: [
                {scope: 'database', name: 'db1', allowed: ['A']},
                {scope: 'database', name: 'db3', allowed: ['B', 'C']},
              ],
              ...emptyUserProperties,
            },
          ],
          ['db1', 'db2', 'db3']
        )
      ).toEqual([[{A: true}, {}, {B: true, C: true}]])
    })
    it('maps all-scoped ALL permission to READ, WRITE', () => {
      expect(
        subject(
          [
            {
              name: 'a',
              permissions: [{scope: 'all', allowed: ['ALL']}],
              ...emptyUserProperties,
            },
          ],
          ['db1', 'db2']
        )
      ).toEqual([
        [
          {READ: true, WRITE: true},
          {READ: true, WRITE: true},
        ],
      ])
    })
    it('inherits all permissions', () => {
      expect(
        subject(
          [
            {
              name: 'a',
              permissions: [
                {scope: 'all', allowed: ['Read']},
                {scope: 'database', name: 'db1', allowed: ['Write']},
                {scope: 'database', name: 'db2', allowed: ['Other']},
              ],
              ...emptyUserProperties,
            },
          ],
          ['db1', 'db2']
        )
      ).toEqual([
        [
          {Read: true, Write: true},
          {Read: true, Other: true},
        ],
      ])
    })
    it('inherits independently on order', () => {
      expect(
        subject(
          [
            {
              name: 'a',
              permissions: [
                {scope: 'database', name: 'db2', allowed: ['Other']},
                {scope: 'database', name: 'db1', allowed: ['Write']},
                {scope: 'all', allowed: ['Read']},
              ],
              ...emptyUserProperties,
            },
          ],
          ['db1', 'db2', 'db3']
        )
      ).toEqual([
        [{Read: true, Write: true}, {Read: true, Other: true}, {Read: true}],
      ])
    })
  })
  describe('computeEffectiveUserDBPermissions', () => {
    const subject = computeEffectiveUserDBPermissions
    it('creates values for empty users', () => {
      expect(subject([], [], ['whateverdb'])).toEqual([])
    })
    it('creates values for no databases', () => {
      expect(
        subject([{...emptyUserProperties, name: 'a', permissions: []}], [], [])
      ).toEqual([[]])
    })
    it('computes effective permissions', () => {
      expect(
        subject(
          [
            {
              ...emptyUserProperties,
              name: 'a',
              permissions: [
                {scope: 'database', name: 'db1', allowed: ['A']},
                {scope: 'database', name: 'db3', allowed: ['B', 'C']},
              ],
              roles: [
                {
                  ...emptyRoleProperties,
                  name: 'ra',
                  permissions: [],
                },
                {
                  ...emptyRoleProperties,
                  name: 'rb',
                  permissions: [],
                },
              ],
            },
          ],
          [
            {
              ...emptyRoleProperties,
              name: 'ra',
              permissions: [{scope: 'database', name: 'db1', allowed: ['B']}],
            },
            {
              ...emptyRoleProperties,
              name: 'rb',
              permissions: [{scope: 'database', name: 'db2', allowed: ['B']}],
            },
          ],
          ['db1', 'db2', 'db3']
        )
      ).toEqual([[{A: true, B: true}, {B: true}, {B: true, C: true}]])
    })
    it('inherits all permissions from role', () => {
      expect(
        subject(
          [
            {
              ...emptyUserProperties,
              name: 'a',
              permissions: [
                {scope: 'database', name: 'db1', allowed: ['W']},
                {scope: 'all', allowed: ['R']},
                {scope: 'database', name: 'db2', allowed: ['O']},
              ],
              roles: [
                {
                  ...emptyRoleProperties,
                  name: 'ra',
                  permissions: [],
                },
                {
                  ...emptyRoleProperties,
                  name: 'rb',
                  permissions: [],
                },
              ],
            },
          ],
          [
            {
              ...emptyRoleProperties,
              name: 'ra',
              permissions: [{scope: 'database', name: 'db1', allowed: ['B']}],
            },
            {
              ...emptyRoleProperties,
              name: 'rb',
              permissions: [{scope: 'all', allowed: ['C']}],
            },
          ],
          ['db1', 'db2']
        )
      ).toEqual([
        [
          {R: true, W: true, B: true, C: true},
          {R: true, O: true, C: true},
        ],
      ])
    })
  })
})
