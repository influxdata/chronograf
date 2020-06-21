import {timeSeriesToTableGraphWork} from 'src/worker/jobs/timeSeriesToTableGraph'

describe('worker/jobs/timeSeriesToTableGraph', () => {
  it('generates unique column names', () => {
    const testData = [
      {
        response: {
          results: [
            {
              statement_id: 0,
              series: [
                {name: 'cpu', columns: ['time', 'count'], values: [[0, 495]]},
              ],
            },
          ],
          uuid: '76c20d6b-6803-44b9-a292-213d8b298aa5',
        },
      },
      {
        response: {
          results: [
            {
              statement_id: 0,
              series: [
                {name: 'cpu', columns: ['time', 'count'], values: [[0, 495]]},
              ],
            },
          ],
          uuid: '76c20d6b-6803-44b9-a292-213d8b298aa5',
        },
      },
    ]
    const result = timeSeriesToTableGraphWork(testData)
    expect(result).toEqual({
      data: [
        ['time', 'cpu.count', 'cpu.count_2'], // the second column is renamed
        [0, 495, 495],
      ],
      sortedLabels: [
        {label: 'cpu.count', responseIndex: 0, seriesIndex: 0},
        {label: 'cpu.count_2', responseIndex: 1, seriesIndex: 0},
      ],
      influxQLQueryType: 'DataQuery',
    })
  })
})
