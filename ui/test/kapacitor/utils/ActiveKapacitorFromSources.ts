import ActiveKapacitorFromSources from 'src/kapacitor/utils/ActiveKapacitorFromSources'
import {source, kapacitor} from 'mocks/dummy'

describe('ActiveKapacitorFromSources', () => {
  const createSource = attrs => ({...source, ...attrs})
  const createKapacitor = attrs => ({...kapacitor, ...attrs})

  const setup = overrides => {
    const activeSource = createSource({id: 1, ...overrides})

    const sources = [
      createSource({id: '1'}),
      createSource({id: '2'}),
      createSource({id: '3'}),
      activeSource,
    ]

    return {sources, activeSource}
  }

  it('can return first when no active is present in collection', () => {
    const expectedKap = createKapacitor({name: 'foo', active: false})

    const {activeSource, sources} = setup({
      kapacitors: [expectedKap, createKapacitor({name: 'bar', active: false})],
    })

    const actualKap = ActiveKapacitorFromSources(activeSource, sources)

    expect(actualKap).toBe(expectedKap)
  })

  it('can return an active kapacitor from a collection', () => {
    const expectedKap = createKapacitor({name: 'foo', active: true})

    const {activeSource, sources} = setup({
      kapacitors: [
        createKapacitor({name: 'beep', active: false}),
        expectedKap,
        createKapacitor({name: 'bop', active: false}),
      ],
    })

    const actualKap = ActiveKapacitorFromSources(activeSource, sources)

    expect(actualKap).toBe(expectedKap)
  })
})
