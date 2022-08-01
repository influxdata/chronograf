import {getSyslogMeasurement as target} from 'src/logs/api'

jest.mock('src/logs/api', () => ({
  getSyslogMeasurement: jest.fn(),
}))
const getSyslogMeasurement = target as jest.MockedFunction<typeof target>
export {getSyslogMeasurement}
