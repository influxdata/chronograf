import subject from 'src/admin/containers/influxdb/util/computeEffectiveDBPermissions'
import {User} from 'src/types/influxAdmin'
const redundantUserProperties: Pick<User, 'roles' | 'links'> = {
  roles: [],
  links: {self: ''},
}

describe('admin/containers/influxdb/util/computeEffectiveDBPermissions', () => {
  it('creates values for empty users', () => {
    expect(subject([], ['whateverdb'])).toEqual([])
  })
  it('creates values for no databases', () => {
    expect(
      subject([{name: 'a', permissions: [], ...redundantUserProperties}], [])
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
            ...redundantUserProperties,
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
            ...redundantUserProperties,
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
            ...redundantUserProperties,
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
            ...redundantUserProperties,
          },
        ],
        ['db1', 'db2', 'db3']
      )
    ).toEqual([
      [{Read: true, Write: true}, {Read: true, Other: true}, {Read: true}],
    ])
  })
})
