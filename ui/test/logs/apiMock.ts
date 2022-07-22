import {getSyslogMeasurement} from 'src/logs/api'

jest.mock('src/logs/api', () => ({
  getSyslogMeasurement: jest.fn(),
}))
export {getSyslogMeasurement}
