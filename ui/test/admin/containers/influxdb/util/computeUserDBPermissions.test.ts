import computeUserDBPermissions from 'src/admin/containers/influxdb/util/computeUserDBPermissions'
describe('admin/containers/influxdb/util/computeUserDBPermissions', () => {
  it('creates values for empty users', () => {
    expect(computeUserDBPermissions([], ['whateverdb'])).toEqual([])
  })
  it('creates values for no databases', () => {
    expect(
      computeUserDBPermissions([{name: 'a', permissions: [], roles: []}], [])
    ).toEqual([[]])
  })
  it('computes db-specific permissions', () => {
    expect(
      computeUserDBPermissions(
        [
          {
            name: 'a',
            permissions: [
              {scope: 'database', name: 'db1', allowed: ['A']},
              {scope: 'database', name: 'db3', allowed: ['B', 'C']},
            ],
            roles: [],
          },
        ],
        ['db1', 'db2', 'db3']
      )
    ).toEqual([[{A: true}, {}, {B: true, C: true}]])
  })
  it('maps all-scoped ALL permission to READ, WRITE', () => {
    expect(
      computeUserDBPermissions(
        [
          {
            name: 'a',
            permissions: [{scope: 'all', allowed: ['ALL']}],
            roles: [],
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
      computeUserDBPermissions(
        [
          {
            name: 'a',
            permissions: [
              {scope: 'all', allowed: ['Read']},
              {scope: 'database', name: 'db1', allowed: ['Write']},
              {scope: 'database', name: 'db2', allowed: ['Other']},
            ],
            roles: [],
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
      computeUserDBPermissions(
        [
          {
            name: 'a',
            permissions: [
              {scope: 'database', name: 'db2', allowed: ['Other']},
              {scope: 'database', name: 'db1', allowed: ['Write']},
              {scope: 'all', allowed: ['Read']},
            ],
            roles: [],
          },
        ],
        ['db1', 'db2', 'db3']
      )
    ).toEqual([
      [{Read: true, Write: true}, {Read: true, Other: true}, {Read: true}],
    ])
  })
})
