import {findTimeOptionRow} from 'src/logs/utils/table'

describe('Logs.Utils.Table', () => {
  const infiniteTableData = {
    forward: {
      columns: ['time', 'noise'],
      values: [[8, 'beep'], [7, 'boop']],
    },
    backward: {
      columns: ['time', 'noise'],
      values: [[6, 'bloop'], [5, 'bleep']],
    },
  }

  it('can find the most recent row index', () => {
    const timeOption = new Date(6).toISOString()

    const actual = findTimeOptionRow(timeOption, infiniteTableData, 0)

    expect(actual).toEqual(2)
  })
})
