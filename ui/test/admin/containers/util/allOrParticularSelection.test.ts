import subject from 'src/admin/util/allOrParticularSelection'
describe('admin/util/allOrParticularSelection', () => {
  it('keeps simple changes as-is', () => {
    expect(subject([], [])).toEqual([])
    expect(subject([], ['*'])).toEqual(['*'])
    expect(subject([], ['a'])).toEqual(['a'])
    expect(subject(['a', 'b'], ['*'])).toEqual(['*'])
    expect(subject(['*'], ['a'])).toEqual(['a'])
    expect(subject(['a', 'b'], [])).toEqual([])
    expect(subject(['*'], [])).toEqual([])
  })
  it('keeps non-star selections as-is', () => {
    expect(subject(['b'], ['a', 'b'])).toEqual(['a', 'b'])
    expect(subject(['a', 'b'], ['a', 'b', 'c'])).toEqual(['a', 'b', 'c'])
    expect(subject(['a', 'b', 'c'], ['b', 'c'])).toEqual(['b', 'c'])
  })
  it('when * is selected all other options are deselected', () => {
    expect(subject(['a', 'b'], ['a', 'b', '*'])).toEqual(['*'])
  })
  it('when a particular values is selected, * is deselected', () => {
    expect(subject(['*'], ['*', 'b'])).toEqual(['b'])
  })
})
