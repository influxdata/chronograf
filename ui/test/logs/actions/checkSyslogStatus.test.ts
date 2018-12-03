// Libs
import thunkMidddleware from 'redux-thunk'

// Mock
import {getSyslogMeasurement} from 'test/logs/apiMock'

// Actions
import {
  fetchNamespaceSyslogStatusAsync,
  SetSearchStatusAction,
  ActionTypes,
} from 'src/logs/actions'

// Types
import {LogsState, SearchStatus} from 'src/types/logs'
import {Namespace} from 'src/types'
import {TimeSeriesResponse} from 'src/types/series'

// Fixtures
import {source} from 'test/fixtures'

describe('Logs.Actions.checkSyslogStatus', () => {
  const proxy = 'logsProxyLink'

  const currentSource = {
    ...source,
    links: {
      ...source.links,
      proxy,
    },
  }

  const namespace: Namespace = {
    database: 'logs-test',
    retentionPolicy: 'autogen',
  }

  const dispatch = jest.fn()
  const getState = jest.fn((): {logs: Partial<LogsState>} => ({
    logs: {currentSource},
  }))

  const thunkWareMock = thunkMidddleware({dispatch, getState})
  const mockActionHandler = thunkWareMock()

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('can fetch syslog measurement', async () => {
    const response: TimeSeriesResponse = {
      results: [
        {
          statement_id: 0,
          series: [
            {name: 'measurements', columns: ['name'], values: [['syslog']]},
          ],
        },
      ],
    }

    getSyslogMeasurement.mockResolvedValue(Promise.resolve(response))
    mockActionHandler(fetchNamespaceSyslogStatusAsync(namespace))
    expect(getSyslogMeasurement).toBeCalledWith(proxy, namespace)
  })

  const missingSyslogStatus: SetSearchStatusAction = {
    type: ActionTypes.SetSearchStatus,
    payload: {
      searchStatus: SearchStatus.MeasurementMissing,
    },
  }

  it('can update missing measurement status', async () => {
    const response = {
      results: [{statement_id: 0}],
    }

    getSyslogMeasurement.mockResolvedValue(Promise.resolve(response))
    await mockActionHandler(fetchNamespaceSyslogStatusAsync(namespace))
    await expect(dispatch).toBeCalledWith(missingSyslogStatus)
  })

  it('can update for querying errors', async () => {
    getSyslogMeasurement.mockRejectedValue({
      code: 400,
      message:
        'received status code 400 from server: err: error parsing query: found -, expected ; at line 1, char 30',
    })

    await mockActionHandler(fetchNamespaceSyslogStatusAsync(namespace))
    await expect(dispatch).toBeCalledWith(missingSyslogStatus)
  })
})
