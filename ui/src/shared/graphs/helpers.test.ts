import {removeMeasurement} from 'src/shared/graphs/helpers'

describe('removeMeasurement', () => {
  it('removes the measurement string from a simple label', () => {
    const label = 'cpu.mean_usage_system'
    const expected = 'mean_usage_system'
    const actual = removeMeasurement(label)

    expect(actual).toBe(expected)
  })

  it('removes the measurement string from a label with a period', () => {
    const label = 'ping.average[url=www.google.com]'
    const expected = 'average[url=www.google.com]'
    const actual = removeMeasurement(label)

    expect(actual).toBe(expected)
  })
})
