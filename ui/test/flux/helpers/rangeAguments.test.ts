import rangeArguments from 'src/flux/helpers/rangeArguments'

describe('Flux.helpers.rangeArguments', () => {
  it('formats relative time range', () => {
    expect(rangeArguments({lower: 'xyz', lowerFlux: '-10s'})).toBe(
      'start: -10s'
    )
  })
  it('formats absolute time range', () => {
    expect(rangeArguments({lower: 'a', upper: 'b'})).toBe('start: a, stop: b')
  })
})
