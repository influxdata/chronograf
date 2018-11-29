import {TimeSeriesServerResponse} from 'src/types/series'
import {FluxTable} from 'src/types/flux'

export const createInfluxQLDataValue = (
  value: number
): TimeSeriesServerResponse[] => [
  {
    response: {
      results: [
        {
          series: [
            {
              values: [[1, value]],
              columns: ['time', 'value'],
            },
          ],
          statement_id: 123,
        },
      ],
    },
  },
]

export const createFluxDataValue = (value: string): FluxTable[] => [
  {
    data: [
      [
        '',
        'result',
        'table',
        '_start',
        '_stop',
        '_field',
        '_measurement',
        'host',
        '_value',
      ],
      [
        '',
        '',
        '0',
        '2018-11-29T14:07:08.214Z',
        '2018-11-29T14:07:28.785Z',
        'used_percent',
        'mem',
        'user.local',
        value,
      ],
    ],
    dataTypes: {
      '': '#datatype',
      host: 'string',
      result: 'string',
      table: 'long',
      _field: 'string',
      _measurement: 'string',
      _start: 'dateTime:RFC3339',
      _stop: 'dateTime:RFC3339',
      _value: 'double',
    },
    groupKey: {
      host: 'user.local',
      _field: 'used_percent',
      _measurement: 'mem',
    },
    id: '20d646ad-51a6-4e11-829a-0dcc186ba919',
    name: '_field=used_percent _measurement=mem host=user.local',
  },
]

export const fluxValueToSingleStat = (value: string) => async (
  __: FluxTable
) => ({
  series: ['_value[host=user.local][_field=used_percent][_measurement=mem]'],
  values: [value],
})
