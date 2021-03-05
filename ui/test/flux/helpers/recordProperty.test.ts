import recordProperty from 'src/flux/helpers/recordProperty'

describe('Flux.helpers.recordProperty', () => {
  it('creates identifier member expression', () => {
    expect(recordProperty('_time')).toEqual('r._time')
    expect(recordProperty('server')).toEqual('r.server')
  })
  it('creates string member expression', () => {
    expect(recordProperty('value-with-hyphen')).toEqual(
      'r.["value-with-hyphen"]'
    )
    expect(recordProperty('value%')).toEqual('r.["value%"]')
    expect(recordProperty('value a')).toEqual('r.["value a"]')
  })
})
